import { runMigrations } from "stripe-replit-sync";
import app from "./app";
import { logger } from "./lib/logger";
import { getStripeSync } from "./lib/stripeClient";

/**
 * Pino writes through an async worker thread, so buffered lines are lost when
 * the process dies immediately. Mirror fatal output to stderr synchronously
 * so crashes are always visible in deployment logs.
 */
function logFatal(context: string, err: unknown): void {
  logger.error({ err }, context);
  console.error(`[fatal] ${context}`, err);
}

process.on("uncaughtException", (err) => {
  logFatal("Uncaught exception", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logFatal("Unhandled rejection", reason);
  process.exit(1);
});

/**
 * Initialize the Stripe schema, managed webhook, and data sync.
 */
async function initStripe(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  logger.info("Initializing Stripe schema...");
  await runMigrations({ databaseUrl });
  logger.info("Stripe schema ready");

  const stripeSync = await getStripeSync();

  const domains = process.env.REPLIT_DOMAINS;
  if (!domains) {
    throw new Error(
      "REPLIT_DOMAINS environment variable is not set; cannot register the Stripe webhook.",
    );
  }

  logger.info("Setting up managed Stripe webhook...");
  const webhookBaseUrl = `https://${domains.split(",")[0]}`;
  const webhook = await stripeSync.findOrCreateManagedWebhook(
    `${webhookBaseUrl}/api/stripe/webhook`,
  );
  logger.info({ webhookUrl: webhook.url }, "Stripe webhook configured");

  // Non-blocking backfill; keeps startup fast while data syncs in background.
  stripeSync
    .syncBackfill()
    .then(() => logger.info("Stripe data synced"))
    .catch((err) => logger.error({ err }, "Error syncing Stripe data"));
}

const INIT_ATTEMPTS = 5;

/**
 * Run Stripe init in the background so the server can start listening (and
 * pass the deployment startup probe) first.
 *
 * The very first publish of this server runs before the production database
 * exists -- Replit provisions it as part of a successful publish -- so a hard
 * DATABASE_URL requirement at boot would make publishing impossible. Without
 * a database this instance serves degraded: payment intent creation and
 * /pay/config still work (per-request Stripe calls, no database), while
 * webhook sync stays down until a later instance boots with DATABASE_URL set.
 * Stripe retries failed webhook deliveries, so sync catches up on its own.
 */
async function initStripeWithRetry(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    const msg =
      "DATABASE_URL is not set; skipping Stripe schema and webhook init. " +
      "Payment intents still work; webhook sync is down until the production database exists.";
    logger.error(msg);
    console.error(`[startup] ${msg}`);
    return;
  }

  for (let attempt = 1; attempt <= INIT_ATTEMPTS; attempt++) {
    try {
      await initStripe();
      return;
    } catch (err) {
      if (attempt === INIT_ATTEMPTS) {
        logFatal(
          `Stripe init failed after ${INIT_ATTEMPTS} attempts; serving degraded (payment intents work, webhook sync down)`,
          err,
        );
        return;
      }
      logger.warn({ err, attempt }, "Stripe init failed; retrying");
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  console.error("[startup] PORT environment variable is required but was not provided.");
  process.exit(1);
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  console.error(`[startup] Invalid PORT value: "${rawPort}"`);
  process.exit(1);
}

app.listen(port, (err) => {
  if (err) {
    logFatal("Error listening on port", err);
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  void initStripeWithRetry();
});
