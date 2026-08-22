---
name: Orval + pnpm catalog zod version detection
description: Why orval emits zod v4 syntax in this workspace and the pin that fixes it
---

`"zod": "catalog:"` in a package.json breaks orval's zod-version auto-detection: it cannot parse the catalog protocol, assumes latest (v4), and emits v4-only syntax like `zod.int()` against the workspace's zod 3.x — codegen output then fails typecheck.

**Why:** Hit during API codegen; the error surfaces far from the cause (generated file, not config).

**How to apply:** Keep `override: { zod: { version: 3 } }` in `lib/api-spec/orval.config.ts` (commented there). If the workspace catalog ever moves to zod 4, remove the pin.
