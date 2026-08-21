# Prompt Index

A single-page personal index of AI prompts for francisvalente.com: find a prompt, copy it, leave.

## Run & Operate

- Workflow `artifacts/prompt-index: web` runs the site (Vite dev server at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/prompt-index run build` — production static build
- Deploys as a Replit static deployment; the custom domain francisvalente.com gets attached in deployment settings after the first publish

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Site: Vite + React, static, no backend and no database (the shared api-server exists in the workspace but the site does not use it)
- Fonts: JetBrains Mono only, self-hosted via @fontsource/jetbrains-mono (400/500/700)
- Markdown rendering: `marked` (the only parser dependency)

## Where things live

- `artifacts/prompt-index/` — the site
- `artifacts/prompt-index/content/prompts/*.md` — one markdown file per prompt, parsed at build time via `import.meta.glob` with `?raw`
- `SCHEMA.md` (repo root) — documents the content model; never rendered, linked or referenced on the site
- `attached_assets/Pasted--Replit-Agent-Build-Brief-Prompt-Index-francisvalente-c_1787282585385.txt` — the binding build spec; consult it before any design or scope change

## Architecture decisions

- Frontmatter is parsed by a small hand-rolled parser in the app (no gray-matter/YAML lib) to honor the strict dependency budget
- The raw markdown body (frontmatter excluded) is kept verbatim in memory; it is both the COPY clipboard payload and the render source

## Product

One page: INDEX header, single Prompts tab, filter input (`/` focuses, Esc clears, case-insensitive substring across id/title/category/type/platforms), categories in fixed order (Protocols, Discovery, Generation, Repairs, Review, Builds; empty ones vanish entirely), dense hairline rows that expand inline to rendered markdown, COPY button copying the raw body exactly.

## User preferences

- The attached build brief is the spec and wins over defaults: clinical greyscale look, accent #ff5c00 only on active-tab underline / hover / focus / COPIED, no icons, images, shadows, cards, gradients, toasts, footer, or descriptive copy anywhere
- No new dependencies beyond React, Vite, @fontsource/jetbrains-mono, and one markdown parser

## Gotchas

- Prompt files are the byte-exact source of truth for the COPY action: never reformat, re-wrap, or "clean up" files under `content/prompts/`
- Frontmatter `id` is a three-digit string assigned once, never renumbered or reused; next id = highest existing + 1
- Page head must keep the robots noindex meta tag
- A category header must never render without entry rows under it

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
