# Memory index

- [Stripe connector + sync quirks](stripe-connector.md) — connector settings keys are `secret`/`publishable`; stripe-replit-sync must stay esbuild-external or migrations silently no-op.
- [Orval zod catalog pin](orval-zod.md) — `"zod": "catalog:"` breaks orval version detection (emits zod v4 syntax); keep the version-3 override in orval.config.ts.
- [Design subagent crash recovery](design-subagent-crashes.md) — dead subagents usually finished their work; verify files/shapes before redoing, re-apply only shape extras.
- [Prod boot vs DB provisioning](prod-boot-and-db.md) — prod DB exists only after a successful publish; listen before init or first publish crash-loops. Mirror fatals to stderr, pino buffers die with the process.
