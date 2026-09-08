---
name: Stripe connector + stripe-replit-sync quirks
description: Replit Stripe connector settings field names, and why stripe-replit-sync must stay external in esbuild bundles
---

# Connector settings field names

The Replit Stripe connector's connection-settings API returns keys `secret` and `publishable` — NOT `secret_key` / `publishable_key` as some skill templates assume. There is no `webhook_secret` field at all: stripe-replit-sync provisions and stores the managed webhook secret itself (in `stripe._managed_webhooks`).

**Why:** Discovered by probing the live connection API after template field names came back undefined.

**How to apply:** When reading Stripe credentials from the connector, accept both naming variants (stripeClient.ts does this). Never ask the user for a webhook secret.

# stripe-replit-sync cannot be bundled

`runMigrations()` reads its `migrations/*.sql` files from disk relative to its own module location. If esbuild bundles the package, that path resolves inside the app's `dist/` (no migrations there), and runMigrations "succeeds" while applying nothing — the boot then crashes later with `relation "stripe.accounts" does not exist`.

**Why:** Cost a failed workflow boot; the silent no-op migration is the trap.

**How to apply:** Keep `stripe-replit-sync` in the esbuild `external` list (api-server/build.mjs). Same reasoning applies to any package that path-traverses to sibling asset files.

# API surface notes (v1.0.0)

- `runMigrations({ databaseUrl })` — no `schema` option; the SQL hardcodes the `stripe` schema.
- `findOrCreateManagedWebhook(url)` returns `Stripe.WebhookEndpoint` directly (use `.url`), not a wrapper object.

# API access is not proof of live checkout setup

Treat a successful Stripe API-key check, an added generic Stripe connection, and the managed payments production connection as separate checks. A working development sandbox is not evidence that production credentials are attached.

**Why:** Stripe authentication succeeded through both a manually supplied live key and a sandbox connection while the published payment configuration still lacked its managed credentials. Replit's documented go-live flow uses the Replit Integrated Payments Stripe Marketplace app from the Publish pane, not merely adding a secret.

**How to apply:** Verify the published payment configuration as well as direct API authentication. Do not pair a live secret with a sandbox publishable key or silently switch the preview to real-money payments. Consult current Replit docs for the go-live steps.
