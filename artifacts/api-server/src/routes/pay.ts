import { Router, type IRouter } from "express";
import {
  CreatePayIntentBody,
  CreatePayIntentResponse,
  GetPayConfigResponse,
} from "@workspace/api-zod";
import {
  getStripePublishableKey,
  getUncachableStripeClient,
} from "../lib/stripeClient";

const router: IRouter = Router();

// Lightweight in-memory rate limiter: max 10 intent creations per IP per minute.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const MAX_TRACKED_IPS = 10_000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  if (!hits.has(ip) && hits.size >= MAX_TRACKED_IPS) {
    // Bounded eviction under address churn: drop expired buckets first, then
    // oldest-inserted ones. Never a global reset — that would let an attacker
    // cycling addresses wipe every live bucket.
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
    }
    while (hits.size >= MAX_TRACKED_IPS) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  }
  hits.set(ip, recent);
  return false;
}

const sweep = setInterval(
  () => {
    const now = Date.now();
    for (const [ip, times] of hits) {
      const recent = times.filter((t) => now - t < WINDOW_MS);
      if (recent.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, recent);
      }
    }
  },
  5 * 60_000,
);
sweep.unref();

router.get("/pay/config", async (_req, res): Promise<void> => {
  const publishableKey = await getStripePublishableKey();
  res.json(GetPayConfigResponse.parse({ publishableKey }));
});

router.post("/pay/intent", async (req, res): Promise<void> => {
  if (isRateLimited(req.ip ?? "unknown")) {
    res
      .status(429)
      .json({ error: "Too many requests. Wait a minute and try again." });
    return;
  }

  const parsed = CreatePayIntentBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn(
      { errors: parsed.error.message },
      "Invalid payment intent input",
    );
    res.status(400).json({
      error: "Invalid input. Amount must be between A$1.00 and A$10,000.00.",
    });
    return;
  }

  const { amountCents } = parsed.data;
  const reference = parsed.data.reference?.trim() || undefined;

  try {
    const stripe = await getUncachableStripeClient();
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      description: reference ?? "francisvalente.com/pay",
      metadata: {
        source: "pay-portal",
        reference: reference ?? "",
      },
      payment_method_types: ["card"],
    });

    if (!intent.client_secret) {
      req.log.error(
        { intentId: intent.id },
        "PaymentIntent missing client_secret",
      );
      res.status(500).json({ error: "Payment setup failed. Try again." });
      return;
    }

    req.log.info({ intentId: intent.id, amountCents }, "PaymentIntent created");
    res
      .status(201)
      .json(CreatePayIntentResponse.parse({ clientSecret: intent.client_secret }));
  } catch (err) {
    req.log.error({ err }, "Stripe PaymentIntent creation failed");
    res
      .status(500)
      .json({ error: "Payment service unavailable. Try again shortly." });
  }
});

export default router;
