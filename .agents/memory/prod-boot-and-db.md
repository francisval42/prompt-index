---
name: Production boot vs Replit database provisioning
description: Why servers must not hard-require DATABASE_URL at boot, and why crash logs vanish in deployments
---

The production database does not exist until a successful publish provisions it. A server that throws on missing DATABASE_URL before opening its port can never pass the startup probe on its first publish: publish needs the boot, the boot demands what only publish creates.

**Why:** First publish of the Stripe API server failed exactly this way; the live site kept serving the older build while every new publish crash-looped.

**How to apply:** listen() first so /api/healthz answers 200, run database/Stripe init in the background (retry transient failures, degrade loudly when DATABASE_URL is absent). Per-request Stripe calls (payment intents, publishable key) work without the database; only webhook sync needs it, and Stripe's delivery retries make that self-heal once a later instance boots with the database provisioned.

Second lesson: pino logs through an async worker thread, so a fast crash loses every buffered line and deployment logs show only stray fragments of Node's code frame (a single caret from a megabyte-long bundled line). Mirror fatal errors to stderr with synchronous console.error, and keep uncaughtException/unhandledRejection handlers that do the same before exiting.
