import {
  Router,
  type IRouter,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  newsletterIssuesTable,
  newsletterSubscribersTable,
  type NewsletterIssue,
  type NewsletterSubscriber,
} from "@workspace/db";
import {
  AddSubscriberBody,
  AddSubscriberResponse,
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminSessionResponse,
  GetNewsletterDomainStatusResponse,
  ListIssuesResponse,
  ListSubscribersResponse,
  SendIssueBody,
  SendIssueResponse,
  SendTestIssueBody,
  SendTestIssueResponse,
} from "@workspace/api-zod";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_MS,
  createSessionToken,
  isValidSessionToken,
  newUnsubscribeToken,
  passwordMatches,
  requireAdmin,
} from "../lib/adminSession";
import { ResendError, getDomainStatus, sendEmail } from "../lib/resend";
import {
  NEWSLETTER_DOMAIN,
  NEWSLETTER_FROM,
  TEST_RECIPIENT,
  buildIssueEmail,
  issueContentHash,
} from "../lib/newsletterEmail";

const router: IRouter = Router();

// Login attempts: max 5 per IP per 5 minutes.
const LOGIN_WINDOW_MS = 5 * 60_000;
const LOGIN_MAX_PER_WINDOW = 5;
const MAX_TRACKED_IPS = 1_000;
const loginHits = new Map<string, number[]>();

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (loginHits.get(ip) ?? []).filter(
    (t) => now - t < LOGIN_WINDOW_MS,
  );
  if (recent.length >= LOGIN_MAX_PER_WINDOW) {
    loginHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  loginHits.set(ip, recent);
  if (loginHits.size > MAX_TRACKED_IPS) {
    // Drop expired buckets first, then oldest-inserted ones so the map stays
    // bounded even under sustained address churn. Evicting a live bucket only
    // resets that IP's window, which is acceptable at this cap.
    for (const [key, times] of loginHits) {
      if (!times.some((t) => now - t < LOGIN_WINDOW_MS)) loginHits.delete(key);
    }
    for (const key of loginHits.keys()) {
      if (loginHits.size <= MAX_TRACKED_IPS) break;
      loginHits.delete(key);
    }
  }
  return false;
}

function toSubscriberJson(row: NewsletterSubscriber) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    status: row.status,
    dateAdded: row.createdAt.toISOString(),
  };
}

function toIssueJson(row: NewsletterIssue) {
  return {
    id: row.id,
    subject: row.subject,
    sentAt: row.sentAt.toISOString(),
    recipientCount: row.recipientCount,
    failedCount: row.failedCount,
  };
}

/**
 * Unsubscribe links must work wherever the app is served (dev domain now,
 * francisvalente.com in production), so build them from the request host.
 * trust proxy is 1, so protocol/host come from the proxy headers.
 */
function unsubscribeUrlFor(req: Request, token: string): string {
  const host = req.get("host") ?? "localhost";
  return `${req.protocol}://${host}/api/newsletter/unsubscribe/${token}`;
}

function handleResendError(req: Request, res: Response, err: unknown): void {
  if (err instanceof ResendError) {
    req.log.error({ status: err.status, message: err.message }, "Resend error");
    res.status(502).json({ error: err.message });
    return;
  }
  throw err;
}

/**
 * The very first publish boots before the production database exists
 * (Replit provisions it during a successful publish). Database-backed routes
 * answer 503 explicitly in that window instead of throwing.
 */
function requireDatabase(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({
      error:
        "The database is not available yet. Try again once the publish has finished.",
    });
    return;
  }
  next();
}

// ---------------------------------------------------------------- session --

router.get("/newsletter/admin/session", (req, res): void => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  res.json(
    GetAdminSessionResponse.parse({
      authenticated: isValidSessionToken(cookies?.[ADMIN_COOKIE]),
    }),
  );
});

router.post("/newsletter/admin/session", (req, res): void => {
  if (isLoginRateLimited(req.ip ?? "unknown")) {
    res
      .status(429)
      .json({ error: "Too many attempts. Wait five minutes and try again." });
    return;
  }

  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }

  const actual = process.env.ADMIN_PASSWORD;
  if (!actual) {
    res.status(503).json({
      error: "ADMIN_PASSWORD secret is not set. Add it in Secrets, then retry.",
    });
    return;
  }

  if (!passwordMatches(parsed.data.password, actual)) {
    req.log.warn("Admin login failed");
    res.status(401).json({ error: "Wrong password." });
    return;
  }

  const token = createSessionToken();
  if (!token) {
    res.status(503).json({ error: "SESSION_SECRET secret is not set." });
    return;
  }

  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/newsletter",
    maxAge: SESSION_MAX_AGE_MS,
  });
  res.json(AdminLoginResponse.parse({ authenticated: true }));
});

// ----------------------------------------------------------------- domain --

router.get(
  "/newsletter/admin/domain",
  requireAdmin,
  async (req, res): Promise<void> => {
    try {
      const status = await getDomainStatus(NEWSLETTER_DOMAIN);
      res.json(
        GetNewsletterDomainStatusResponse.parse({
          domain: NEWSLETTER_DOMAIN,
          found: status.found,
          verified: status.status === "verified",
          status: status.status,
          records: status.records,
        }),
      );
    } catch (err) {
      handleResendError(req, res, err);
    }
  },
);

// ------------------------------------------------------------ subscribers --

router.get(
  "/newsletter/admin/subscribers",
  requireAdmin,
  requireDatabase,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(newsletterSubscribersTable)
      .orderBy(
        desc(newsletterSubscribersTable.createdAt),
        desc(newsletterSubscribersTable.id),
      );
    res.json(ListSubscribersResponse.parse(rows.map(toSubscriberJson)));
  },
);

router.post(
  "/newsletter/admin/subscribers",
  requireAdmin,
  requireDatabase,
  async (req, res): Promise<void> => {
    const parsed = AddSubscriberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }
    const email = parsed.data.email.trim().toLowerCase();
    const firstName = parsed.data.firstName?.trim() ?? "";

    const [existing] = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.email, email));

    if (existing) {
      if (existing.status === "active") {
        res.status(409).json({ error: "Already an active subscriber." });
        return;
      }
      const [updated] = await db
        .update(newsletterSubscribersTable)
        .set({ status: "active", firstName: firstName || existing.firstName })
        .where(eq(newsletterSubscribersTable.id, existing.id))
        .returning();
      req.log.info({ id: existing.id }, "Subscriber reactivated");
      res.status(201).json(AddSubscriberResponse.parse(toSubscriberJson(updated)));
      return;
    }

    const [created] = await db
      .insert(newsletterSubscribersTable)
      .values({ email, firstName, unsubscribeToken: newUnsubscribeToken() })
      .returning();
    req.log.info({ id: created.id }, "Subscriber added");
    res.status(201).json(AddSubscriberResponse.parse(toSubscriberJson(created)));
  },
);

router.delete(
  "/newsletter/admin/subscribers/:id",
  requireAdmin,
  requireDatabase,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = Number.parseInt(raw ?? "", 10);
    if (!Number.isInteger(id) || id < 1) {
      res.status(404).json({ error: "Subscriber not found." });
      return;
    }
    const [removed] = await db
      .delete(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.id, id))
      .returning();
    if (!removed) {
      res.status(404).json({ error: "Subscriber not found." });
      return;
    }
    req.log.info({ id }, "Subscriber removed");
    res.sendStatus(204);
  },
);

// ----------------------------------------------------------------- issues --

router.get(
  "/newsletter/admin/issues",
  requireAdmin,
  requireDatabase,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(newsletterIssuesTable)
      .orderBy(desc(newsletterIssuesTable.sentAt), desc(newsletterIssuesTable.id));
    res.json(ListIssuesResponse.parse(rows.map(toIssueJson)));
  },
);

// ---------------------------------------------------------------- sending --

const SEND_GAP_MS = 600; // Resend allows 2 requests/second; stay under it.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

router.post(
  "/newsletter/admin/test-send",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = SendTestIssueBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Subject and body are both required." });
      return;
    }
    const { subject, body } = parsed.data;
    // The test footer carries a non-resolving token so the link is visible
    // but cannot unsubscribe anyone.
    const unsubscribeUrl = unsubscribeUrlFor(req, "test");
    const email = buildIssueEmail(body, unsubscribeUrl);

    try {
      await sendEmail({
        from: NEWSLETTER_FROM,
        to: TEST_RECIPIENT,
        subject,
        html: email.html,
        text: email.text,
        headers: listUnsubscribeHeaders(unsubscribeUrl),
      });
    } catch (err) {
      handleResendError(req, res, err);
      return;
    }

    req.log.info("Test issue sent");
    res.json(SendTestIssueResponse.parse({ sent: 1, failed: 0, errors: [] }));
  },
);

router.post(
  "/newsletter/admin/send",
  requireAdmin,
  requireDatabase,
  async (req, res): Promise<void> => {
    const parsed = SendIssueBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Subject and body are both required." });
      return;
    }
    const { subject, body } = parsed.data;
    const confirmDuplicate = parsed.data.confirmDuplicate === true;
    const contentHash = issueContentHash(subject, body);

    // Reserve the content hash atomically BEFORE any email goes out. The
    // advisory lock serializes concurrent identical drafts (double submit,
    // a second tab, a retry racing a slow send), so exactly one request
    // inserts the reservation row; the others see it and get the 409.
    const reservation = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${contentHash}))`,
      );
      const [previous] = await tx
        .select()
        .from(newsletterIssuesTable)
        .where(eq(newsletterIssuesTable.contentHash, contentHash))
        .orderBy(desc(newsletterIssuesTable.sentAt))
        .limit(1);
      if (previous && !confirmDuplicate) {
        return { blocked: previous, row: undefined };
      }
      const [row] = await tx
        .insert(newsletterIssuesTable)
        .values({ subject, body, contentHash, recipientCount: 0, failedCount: 0 })
        .returning();
      return { blocked: undefined, row };
    });

    if (reservation.blocked) {
      const prev = reservation.blocked;
      const date = prev.sentAt.toISOString().slice(0, 10);
      res.status(409).json({
        error:
          prev.recipientCount === 0
            ? "A send of this exact issue is already in progress or was interrupted."
            : `This exact issue already went to ${prev.recipientCount} subscribers on ${date}.`,
      });
      return;
    }
    const issueRow = reservation.row;
    if (!issueRow) {
      res.status(500).json({ error: "Could not record the issue." });
      return;
    }

    const active = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.status, "active"))
      .orderBy(newsletterSubscribersTable.id);

    if (active.length === 0) {
      await db
        .delete(newsletterIssuesTable)
        .where(eq(newsletterIssuesTable.id, issueRow.id));
      res.status(400).json({ error: "No active subscribers." });
      return;
    }

    // One email per subscriber, never CC/BCC; each gets its own token link.
    const errors: Array<{ email: string; error: string }> = [];
    let sent = 0;
    for (const [i, sub] of active.entries()) {
      if (i > 0) await sleep(SEND_GAP_MS);
      const unsubscribeUrl = unsubscribeUrlFor(req, sub.unsubscribeToken);
      const email = buildIssueEmail(body, unsubscribeUrl);
      try {
        await sendEmail({
          from: NEWSLETTER_FROM,
          to: sub.email,
          subject,
          html: email.html,
          text: email.text,
          headers: listUnsubscribeHeaders(unsubscribeUrl),
        });
        sent += 1;
      } catch (err) {
        const message =
          err instanceof ResendError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Unknown send error";
        req.log.error({ subscriberId: sub.id }, "Send failed for subscriber");
        errors.push({ email: sub.email, error: message });
      }
    }

    // The reservation only becomes a real history entry when something went
    // out; an all-fail attempt must not block a retry behind the duplicate
    // refusal.
    if (sent > 0) {
      await db
        .update(newsletterIssuesTable)
        .set({
          recipientCount: active.length,
          failedCount: errors.length,
          sentAt: new Date(),
        })
        .where(eq(newsletterIssuesTable.id, issueRow.id));
    } else {
      await db
        .delete(newsletterIssuesTable)
        .where(eq(newsletterIssuesTable.id, issueRow.id));
    }

    req.log.info({ sent, failed: errors.length }, "Issue send finished");
    res.json(
      SendIssueResponse.parse({ sent, failed: errors.length, errors }),
    );
  },
);

// ------------------------------------------------- public unsubscribe -----

function unsubscribePage(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
</head>
<body style="margin:0;background:#0a0a0a;color:#e6e6e6;font-family:ui-monospace,'JetBrains Mono',Menlo,monospace;">
<div style="max-width:600px;margin:0 auto;padding:48px 16px;">
<h1 style="font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 12px;">${title}</h1>
<p style="margin:0;color:#8a8a8a;line-height:1.6;">${message}</p>
</div>
</body>
</html>`;
}

async function flipToUnsubscribed(
  token: string,
): Promise<NewsletterSubscriber | undefined> {
  if (!token || token.length > 200) return undefined;
  const [row] = await db
    .update(newsletterSubscribersTable)
    .set({ status: "unsubscribed" })
    .where(eq(newsletterSubscribersTable.unsubscribeToken, token))
    .returning();
  return row;
}

// Immediate flip on open, no confirmation screen (idempotent).
router.get(
  "/newsletter/unsubscribe/:token",
  async (req, res): Promise<void> => {
    if (!process.env.DATABASE_URL) {
      res
        .status(503)
        .type("html")
        .send(
          unsubscribePage(
            "Temporarily unavailable",
            "Try this link again in a few minutes.",
          ),
        );
      return;
    }
    const raw = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;
    const row = await flipToUnsubscribed(raw ?? "");
    if (!row) {
      res
        .status(404)
        .type("html")
        .send(
          unsubscribePage(
            "Link not valid",
            "This unsubscribe link is not valid or the subscriber was removed.",
          ),
        );
      return;
    }
    req.log.info({ subscriberId: row.id }, "Subscriber unsubscribed");
    res
      .type("html")
      .send(
        unsubscribePage(
          "Unsubscribed",
          `${row.email} will not receive further issues.`,
        ),
      );
  },
);

// RFC 8058 one-click unsubscribe target (mail clients POST here).
router.post(
  "/newsletter/unsubscribe/:token",
  async (req, res): Promise<void> => {
    if (!process.env.DATABASE_URL) {
      res.sendStatus(503);
      return;
    }
    const raw = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;
    const row = await flipToUnsubscribed(raw ?? "");
    if (row) req.log.info({ subscriberId: row.id }, "One-click unsubscribe");
    res.status(row ? 200 : 404).end();
  },
);

export default router;
