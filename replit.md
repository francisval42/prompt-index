# Prompt Index

A single-page personal index of AI prompts for francisvalente.com: find a prompt, copy it, leave. Also hosts an unlisted payment portal at `/pay` and an unlisted newsletter admin at `/admin`.

## Run & Operate

- Workflow `artifacts/prompt-index: web` runs the site (Vite dev server at `/`)
- Workflow `artifacts/api-server: API Server` runs the backend (`/api`); required for `/pay` and `/admin`, unused by the index page
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/prompt-index run build` — production static build
- `node scripts/src/gen-favicon.mjs` — regenerates the favicon set (fv on charcoal sphere) in `public/` from the brand fonts and tokens
- Deploys as a Replit monorepo deployment (static site + api-server); the custom domain francisvalente.com gets attached in deployment settings after the first publish

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Site: Vite + React, static; the index page uses no backend, the `/pay` page calls the shared api-server
- API: Express on the shared api-server artifact; contract-first (endpoints declared in `lib/api-spec/openapi.yaml`, orval generates the zod schemas and fetch client)
- Payments: Stripe via the Replit connector (test keys in dev; live keys arrive via the Publish pane when publishing). `stripe-replit-sync` migrates a Postgres `stripe` schema and syncs payment data through a managed webhook at `/api/stripe/webhook`
- Newsletter: Resend called via plain fetch (no SDK) from the api-server; subscriber and issue tables live in the shared Postgres through `lib/db` (drizzle-kit push)
- Fonts: JetBrains Mono self-hosted via @fontsource/jetbrains-mono (400/500/700); Gladiator (single cut, self-hosted TTF at `src/assets/fonts/`) is used only for the 36px Melbourne clock on the manifest. Existing `/pay` and `/admin` title styling remains unchanged.
- Markdown rendering: `marked` (the only parser dependency)

## Where things live

- `artifacts/prompt-index/` — the site; `src/pages/pay.tsx` is the payment page (wouter route `/pay` in `src/main.tsx`)
- `artifacts/prompt-index/content/prompts/*.md` — one markdown file per prompt, parsed at build time via `import.meta.glob` with `?raw`
- `artifacts/api-server/src/routes/pay.ts` — GET `/api/pay/config`, POST `/api/pay/intent` (validation + per-IP rate limit)
- `artifacts/api-server/src/routes/newsletter.ts` — all `/api/newsletter` routes: admin session, Resend domain status, subscribers, issues, test send, full send, public unsubscribe
- `artifacts/api-server/src/lib/resend.ts`, `lib/adminSession.ts`, `lib/newsletterEmail.ts` — Resend fetch wrapper, HMAC session cookie helpers, email rendering (typed content into `newsletter-template.html`) and content hash
- `artifacts/prompt-index/src/pages/admin.tsx` — the newsletter admin page (wouter route `/admin` in `src/main.tsx`)
- `README.md` (repo root) — newsletter endpoints, secrets and the weekly send runbook
- `artifacts/api-server/src/lib/stripeClient.ts` — Stripe credentials from the Replit connector (uncached so token rotation works)
- `artifacts/api-server/src/index.ts` — boot: stripe schema migrations → managed webhook registration → non-blocking backfill
- `SCHEMA.md` (repo root) — documents the content model; never rendered, linked or referenced on the site
- `attached_assets/Francis_Valente's_Weekly_AI_Digest_1788868611216.zip` contains `design_handoff_manifest/BUILD-BRIEF.md`, the binding Manifest spec and its HTML reference. It supersedes the earlier tabbed-index brief. The reference is not production content.
- `attached_assets/Pasted--Replit-Agent-Build-Brief-Prompt-Index-francisvalente-c_1787282585385.txt` applies only where the Manifest brief is silent.

## Architecture decisions

- Frontmatter is parsed by a small hand-rolled parser in the app (no gray-matter/YAML lib) to honor the strict dependency budget
- The raw markdown body (frontmatter excluded) is kept verbatim in memory; it is both the COPY clipboard payload and the render source
- Payment amounts are validated server-side only (integer cents, 100–1,000,000 AUD cents); the server sets amount/currency on the PaymentIntent, so the client can't manipulate them
- PaymentIntents are card-only (`payment_method_types: ["card"]`), metadata `source: "pay-portal"` plus the optional reference

## Product

The site is a single flat manifest. Everything the site holds (Prompts, Packs, Notes, Digest issues) lists on one page as rows in one ledger: find a thing, copy it, leave.
- Prompts: `content/prompts/*.md`. Action = COPY (raw body).
- Packs: `content/launch-ready/*.md` and `content/connect/*.md`. Action = COPY. Connect items additionally show a DOWNLOAD button for their content.
- Notes: `content/explainers/*.md` and the brand skill. Action = COPY.
- Digest: `content/digest/*.md`. Action = OPEN (links to issue URL).
Rows filter instantly across ref, kind, title, section, and tags via the header input. Expand to read, or navigate with global j/k/Enter/c keys. Mobile: 16px base text, 44px tap targets. Legacy `/brand`, `/launch`, `/connect`, and `/explainers` redirect silently to `/`. Unknown paths retain the one-time redirect notice.

Digest is content-driven, not automatically populated by newsletter sends. The handoff's sample `weekly-digest.html` destination was not included, so no sample issue is shipped. Add real issue files with working URLs; empty and fully filtered sections never render.

`/pay` (unlisted, not in the nav): custom AUD amount (min A$1, max A$10,000) plus optional reference (≤200 chars) → embedded dark-themed Stripe Payment Element (billing country defaults to AU) → PAID / error-with-retry states. Same design language as the index; deliberately no products, subscriptions, auth, saved cards, or refunds.

`/admin` (unlisted, not in the nav): password login (ADMIN_PASSWORD, 12 h session cookie signed with SESSION_SECRET), then one page with the Resend verification status for navaro.com.au including the exact DNS records to add in Cloudflare (per-value COPY), the subscriber list (add, two-tap REMOVE then SURE?), the issue composer (subject, markdown or simple HTML body, SEND TEST TO ME goes only to francis@vgfs.com.au, SEND TO N ACTIVE with inline confirm and a SEND ANYWAY (DUPLICATE) path when an identical issue was already sent), and the sent-issue history. Same design language as the index.

## User preferences

- The Manifest spec wins over defaults: flat charcoal/greyscale, accent #ff5c00 only on cursor bars, the focused filter underline, focus-visible outlines and COPIED. No icons, shadows, cards, gradients, toasts, motion, masthead or descriptive copy. Only the key legend follows the sections. Payment/admin states retain their existing styles.
- No new dependencies beyond React, Vite, @fontsource/jetbrains-mono, marked (one markdown parser), and the Stripe libraries required by `/pay`

## Gotchas

- Prompt files are the byte-exact source of truth for the COPY action: never reformat, re-wrap, or "clean up" files under `content/prompts/`
- Frontmatter `id` is a three-digit string assigned once, never renumbered or reused; next id = highest existing + 1
- Page head must keep the robots noindex meta tag
- A category header must never render without entry rows under it
- The Stripe webhook route must stay registered with `express.raw` BEFORE `express.json` in `app.ts` (signature verification needs the raw body)
- `stripe-replit-sync` must stay in the esbuild `external` list in `api-server/build.mjs` — bundling it makes its migrations a silent no-op
- Keep `trust proxy` set to `1` (not `true`) in `app.ts`; trusting the whole chain lets clients spoof `req.ip` past the rate limiter
- Mobile rules: the site root stays `text-base` and every input at 16px or more, or iOS zooms on focus; the viewport meta must never regain `maximum-scale`
- Text-action buttons (COPY, DOWNLOAD, BACK) get 44px tap boxes via `py-3 sm:-my-3 px-3 -mx-3 sm:px-0 sm:mx-0`: vertical padding stays real on phones (negative margins would overlap the stacked controls above and below) and turns invisible from `sm:` where rows are single-line; reuse for new text actions
- `PayPage` is lazy-loaded in `main.tsx`; never import it or `@stripe/*` statically from index code, that puts Stripe.js back on every page
- Markdown prose containers need `[overflow-wrap:anywhere]` and `prose-pre:overflow-x-auto`; long tokens otherwise stretch the page sideways on phones
- Newsletter sends are always one email per subscriber, never CC or BCC; every email carries that subscriber's personal unsubscribe link plus List-Unsubscribe and List-Unsubscribe-Post headers, and the from address stays `Francis Valente <news@navaro.com.au>`
- Unsubscribe links are built from the request host at send time, so dev sends carry dev links; GET on the unsubscribe URL flips the subscriber immediately (mail scanners that prefetch links can trigger it, an accepted tradeoff for this list)
- `@workspace/db` connects lazily on first query, never at import time; the first publish boots without a database, so an import-time DATABASE_URL requirement would crash the server before it listens
- Newsletter tables are created at api-server boot by idempotent DDL (`ensureNewsletterSchema` in `lib/db`); keep that DDL in sync with `lib/db/src/schema/newsletter.ts` whenever the schema changes
- Every newsletter email renders into the user-supplied wrapper `artifacts/api-server/src/lib/newsletter-template.html`; its `<!-- OPENER -->` / `<!-- FOOTER -->` markers and `{{unsubscribe_url}}` placeholder are load-bearing (`buildIssueEmail` throws if the markers go missing), and `.html` imports rely on the esbuild text loader in `build.mjs`
- Full sends reserve the issue row (advisory lock on the content hash) before the first email goes out, then update or delete it afterwards; do not reorder that flow or concurrent identical sends can double-deliver

## Brand

- Approved brand direction: the FRANCIS VALENTE specimen at `attached_assets/francis_valente_brand_spec_1787401127952.html`; kit boards are canvas iframes backed by `artifacts/mockup-sandbox/src/components/mockups/brand-kit/`
- Reusable assets: `attached_assets/brand/` (tokens.css, tokens.json, fonts/, marks/) plus the bundle `attached_assets/francis-valente-brand-kit.zip`
- Rules: Gladiator is display-only (wordmark and large display moments, never below ~28px, never UI labels or body); orange #ff5c00 marks active/focused/copied states only, never decoration; a light context (#ffffff background, same ink/muted/accent) is approved in the spec
- The Manifest brief supersedes the old INDEX title: there is no masthead. Gladiator is reserved for the Melbourne clock; all other manifest text is JetBrains Mono.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
