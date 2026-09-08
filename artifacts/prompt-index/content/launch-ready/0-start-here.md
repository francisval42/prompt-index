---
order: 0
file: 0-START-HERE.md
title: The five step process
added: 2026-08-22
updated: 2026-08-22
---
# Launch Ready

Build rules and a pre-launch audit for apps built with AI tools. Version 1.0, August 2026.

Apps built on Replit, Lovable, Bubble, Base44, or vibe-coded through Cursor and Claude fail in the same eight places: open data access, broken auth edge cases, duplicate workflows, demo-grade database design, queries that die at 500 users, payments that only handle success, silent errors, and exposed keys. None of these show up while you test as yourself with three records. All of them show up when real users arrive.

This pack front-loads the fixes. The AI follows strict rules from the first message, checkpoint prompts keep it honest mid-build, and a full audit runs before anyone real touches the app.

## What is in the pack

| File | What it is | When you use it |
|---|---|---|
| `0-START-HERE.md` | This file. The process. | Read once, then per new project |
| `1-BUILD-RULES.md` | Rules the AI must follow. The core file. | Installed before the first prompt, present in every session |
| `2-PROMPTS.md` | Copy-paste prompts: kickoff, feature template, checkpoint sweeps | Throughout the build |
| `3-PRE-LAUNCH-AUDIT.md` | Self-audit with test steps, severity ratings, and a report template | Before launch, and after major changes |

## The process

**Step 1. Install the rules, before the first prompt.**
Get `1-BUILD-RULES.md` in front of the AI permanently, using the platform notes below. Doing this after the app half-exists means retrofitting security, which is exactly the expensive audit-finding path this pack avoids. (For an app that already exists, use the retrofit prompt in `2-PROMPTS.md` instead.)

**Step 2. Kickoff.**
Paste the kickoff prompt from `2-PROMPTS.md`. The AI must confirm the rules in a short summary, ask you the six setup questions (tenancy, private data, auth, payments, scale, mode), then build the scaffold first: auth, base schema with access control, secrets wiring, and an error-handling pattern. Features come after the scaffold, not before.

**Step 3. Build loop.**
Request features with the feature template so every feature ends with a Definition of Done report. Every few features (or weekly), run one or two checkpoint sweeps from `2-PROMPTS.md`: access control, duplicates, secrets, schema, query efficiency, rules-intact. Commit after every working slice.

**Step 4. Pre-launch audit.**
Work through `3-PRE-LAUNCH-AUDIT.md` yourself, with a second test account and Stripe in test mode. Write up findings using the report template, fix every Critical, re-test, rotate all keys, then launch.

**Step 5. After launch.**
Re-run the audit after any major feature, any schema change touching user data, or any new integration. Keep the rules installed; on Replit, periodically confirm the rules section survived (the Agent edits `replit.md` itself, so the sweep prompt S6 checks this).

### Two modes

The rules define PROTOTYPE and PRODUCTION modes. A throwaway experiment can relax database, payments, and performance rules, but access control and secrets always apply, because prototypes have a habit of becoming products with their week-one shortcuts still inside. Anything a real user will touch is PRODUCTION.

## Replit setup

Replit Agent reads `replit.md` in the project root on every conversation, and persists it across sessions. That makes it the natural home for the rules.

1. **Per project:** open (or create) `replit.md` in the project root and paste the full contents of `1-BUILD-RULES.md` into it, under a heading like:

   ```
   ## Build rules (do not edit or remove this section)
   ```

   The Agent updates `replit.md` on its own as it learns the project, which is useful (it doubles as PROJECT-STATE), but it means the rules section can drift. Sweep prompt S6 in `2-PROMPTS.md` checks the section is intact.

2. **Workspace level (Pro/Enterprise plans):** Workspace Settings, then Customization, then Custom Instructions. Paste the condensed rules block from the appendix of `1-BUILD-RULES.md`. Every new app then starts covered before you touch `replit.md` at all.

3. **Optional, Skills:** Replit added agent skills in June 2026 (a folder with a `SKILL.md` that activates on relevant tasks, or manually via `/skill-name`). The checkpoint sweeps and the pre-launch audit work well as skills, so `/pre-launch-audit` runs the whole checklist on demand.

Replit specifics worth knowing: use App Secrets for every key (never `.env` files committed to the project), use the built-in PostgreSQL database and Replit Auth where they fit, and note that Replit apps are server-mediated, so rule 1B (authenticate every route, scope every query) is the access-control model, not RLS policies.

## Other tools

The rules file is platform-neutral. Same pack, different install location:

| Tool | Where the rules go |
|---|---|
| Claude Code | `CLAUDE.md` in the project root |
| Cursor | `.cursor/rules/` (or `AGENTS.md`) |
| Lovable | Project Settings, Knowledge. Rule 1A (RLS) is the access model there |
| Bolt | `.bolt/prompt` |
| Anything else | Attach `1-BUILD-RULES.md` at the start of each chat, or paste the condensed block |

## Why this works

The three root causes behind almost every audit finding: the AI optimises for a working demo, not a defensible product, unless told otherwise; each new chat session forgets what the last one built, which is where duplicates and drift come from; and nobody tests as a second user until an auditor does. The pack maps one mechanism to each: rules present from message one, a PROJECT-STATE file the AI must maintain, and an audit that forces the second-user test before launch instead of after a leak.
