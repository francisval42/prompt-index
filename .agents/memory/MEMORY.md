# Memory index

- [Stripe connector + sync quirks](stripe-connector.md) — connector settings keys are `secret`/`publishable`; stripe-replit-sync must stay esbuild-external or migrations silently no-op.
- [Orval zod catalog pin](orval-zod.md) — `"zod": "catalog:"` breaks orval version detection (emits zod v4 syntax); keep the version-3 override in orval.config.ts.
