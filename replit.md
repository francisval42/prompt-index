# Prompt Index

A single-page personal index of AI prompts for francisvalente.com: find a prompt, copy it, leave. Also hosts an unlisted payment portal at `/pay`.

## Run & Operate

- Workflow `artifacts/prompt-index: web` runs the site (Vite dev server at `/`)
- Workflow `artifacts/api-server: API Server` runs the backend (`/api`); required for `/pay`, unused by the index page
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/prompt-index run build` — production static build
- Deploys as a Replit monorepo deployment (static site + api-server); the custom domain francisvalente.com gets attached in deployment settings after the first publish

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Site: Vite + React, static; the index page uses no backend, the `/pay` page calls the shared api-server
- API: Express on the shared api-server artifact; contract-first (endpoints declared in `lib/api-spec/openapi.yaml`, orval generates the zod schemas and fetch client)
- Payments: Stripe via the Replit connector (test keys in dev; live keys arrive via the Publish pane when publishing). `stripe-replit-sync` migrates a Postgres `stripe` schema and syncs payment data through a managed webhook at `/api/stripe/webhook`
- Fonts: JetBrains Mono only, self-hosted via @fontsource/jetbrains-mono (400/500/700)
- Markdown rendering: `marked` (the only parser dependency)

## Where things live

- `artifacts/prompt-index/` — the site; `src/pages/pay.tsx` is the payment page (wouter route `/pay` in `src/main.tsx`)
- `artifacts/prompt-index/content/prompts/*.md` — one markdown file per prompt, parsed at build time via `import.meta.glob` with `?raw`
- `artifacts/api-server/src/routes/pay.ts` — GET `/api/pay/config`, POST `/api/pay/intent` (validation + per-IP rate limit)
- `artifacts/api-server/src/lib/stripeClient.ts` — Stripe credentials from the Replit connector (uncached so token rotation works)
- `artifacts/api-server/src/index.ts` — boot: stripe schema migrations → managed webhook registration → non-blocking backfill
- `SCHEMA.md` (repo root) — documents the content model; never rendered, linked or referenced on the site
- `attached_assets/Pasted--Replit-Agent-Build-Brief-Prompt-Index-francisvalente-c_1787282585385.txt` — the binding build spec; consult it before any design or scope change

## Architecture decisions

- Frontmatter is parsed by a small hand-rolled parser in the app (no gray-matter/YAML lib) to honor the strict dependency budget
- The raw markdown body (frontmatter excluded) is kept verbatim in memory; it is both the COPY clipboard payload and the render source
- Payment amounts are validated server-side only (integer cents, 100–1,000,000 AUD cents); the server sets amount/currency on the PaymentIntent, so the client can't manipulate them
- PaymentIntents are card-only (`payment_method_types: ["card"]`), metadata `source: "pay-portal"` plus the optional reference

## Product

One page: INDEX header, single Prompts tab, filter input (`/` focuses, Esc clears, case-insensitive substring across id/title/category/type/platforms), categories in fixed order (Protocols, Discovery, Generation, Repairs, Review, Builds; empty ones vanish entirely), dense hairline rows that expand inline to rendered markdown, COPY button copying the raw body exactly.

`/pay` (unlisted, not in the nav): custom AUD amount (min A$1, max A$10,000) plus optional reference (≤200 chars) → embedded dark-themed Stripe Payment Element (billing country defaults to AU) → PAID / error-with-retry states. Same design language as the index; deliberately no products, subscriptions, auth, saved cards, or refunds.

## User preferences

- The attached build brief is the spec and wins over defaults: clinical greyscale look, accent #ff5c00 only on active-tab underline / hover / focus / COPIED / PAID and payment errors, no icons, images, shadows, cards, gradients, toasts, footer, or descriptive copy anywhere
- No new dependencies beyond React, Vite, @fontsource/jetbrains-mono, one markdown parser, and the Stripe libraries required by `/pay`

## Gotchas

- Prompt files are the byte-exact source of truth for the COPY action: never reformat, re-wrap, or "clean up" files under `content/prompts/`
- Frontmatter `id` is a three-digit string assigned once, never renumbered or reused; next id = highest existing + 1
- Page head must keep the robots noindex meta tag
- A category header must never render without entry rows under it
- The Stripe webhook route must stay registered with `express.raw` BEFORE `express.json` in `app.ts` (signature verification needs the raw body)
- `stripe-replit-sync` must stay in the esbuild `external` list in `api-server/build.mjs` — bundling it makes its migrations a silent no-op
- Keep `trust proxy` set to `1` (not `true`) in `app.ts`; trusting the whole chain lets clients spoof `req.ip` past the rate limiter

## Brand

- Approved brand direction: the FRANCIS VALENTE specimen at `attached_assets/francis_valente_brand_spec_1787401127952.html`; kit boards are canvas iframes backed by `artifacts/mockup-sandbox/src/components/mockups/brand-kit/`
- Reusable assets: `attached_assets/brand/` (tokens.css, tokens.json, fonts/, marks/) plus the bundle `attached_assets/francis-valente-brand-kit.zip`
- Rules: Gladiator is display-only (wordmark and large display moments, never below ~28px, never UI labels or body); orange #ff5c00 marks active/focused/copied states only, never decoration; a light context (#ffffff background, same ink/muted/accent) is approved in the spec
- The live site still follows the build brief (JetBrains Mono only); adopting Gladiator on the site requires an explicit user decision

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
