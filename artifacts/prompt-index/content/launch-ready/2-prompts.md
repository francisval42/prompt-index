---
order: 2
file: 2-PROMPTS.md
title: Kickoff and checkpoint prompts
updated: 2026-08-22
---
# PROMPTS.md

Copy-paste prompts for running a build under `1-BUILD-RULES.md`. Version 1.0, August 2026.

**Placeholders.** Anything in square brackets is a placeholder you replace before sending:

- `[APP NAME]` - your app's working name
- `[ONE-PARAGRAPH DESCRIPTION]` - what the app does, for whom
- `[FEATURE]` - the feature you are requesting, in one or two sentences
- `[N]` - a number (rows to seed, users to create)

Everything else is sent exactly as written.

---

## P1. Kickoff (new project)

Use after installing the rules (see 0-START-HERE.md). First message of the build.

```
We are building [APP NAME]: [ONE-PARAGRAPH DESCRIPTION].

Before writing any code:

1. Confirm you have read the build rules (in replit.md / BUILD-RULES.md) by
   summarising them in 10 bullets or fewer.
2. Ask me the six setup questions from section 0.1 of the rules, one at a
   time, and record my answers in PROJECT-STATE.
3. Propose the scaffold and wait for my approval: auth setup, base schema
   with access control per rule 1, secrets wiring, and the error-handling
   pattern from rule 8. The scaffold is built and tested before any feature.

Mode: PRODUCTION.
```

## P2. Retrofit (existing project)

Use when the app already exists and the rules were not in place from the start.

```
The build rules (in replit.md / BUILD-RULES.md) now apply to this project.
Before changing anything:

1. Audit the current app against every rule section (1 through 8).
2. Produce a gap list: each gap with the rule it breaks, severity
   (critical / important / nice-to-have), and the concrete fix.
3. Populate PROJECT-STATE with the current schema, routes or workflows,
   and integrations as they exist today.
4. Make no changes yet. We will agree the fix order first, criticals first.
```

## P3. Feature request template

Use for every feature. The closing lines are what keep the rules alive mid-build.

```
Build: [FEATURE]

Apply the build rules. Before coding, tell me in a few lines how rule 1
(access control) and rule 6 (duplicate check against PROJECT-STATE) apply
to this feature. When finished, report the Definition of Done from rule 9,
item by item: done, n/a with reason, or NOT done. List anything you did
not handle.
```

## P4. Checkpoint sweeps

Run one or two every few features, or weekly. Each is self-contained.

**S1. Access control sweep**

```
Sweep every table and every route/workflow for access control per rule 1.
For each, state: what scopes reads, what scopes writes, and how a second
non-admin user is blocked from reaching another user's data. List anything
open, unscoped, or relying on client-side checks, with severity. Fix
nothing yet, report first.
```

**S2. Duplicate sweep**

```
List every workflow, endpoint, scheduled job, and event handler, sorted
alphabetically. Flag near-duplicates, anything overlapping an existing
feature, multiple handlers on one trigger, and dead or disabled code.
Recommend what to merge or delete, then update PROJECT-STATE to match
reality. Change nothing without my approval.
```

**S3. Secrets sweep**

```
Search the entire codebase, config, and client-side output for anything
that looks like a credential: sk_live, sk_test, whsec_, service_role,
api key, token, password, bearer, and any long random string assigned to
a variable. Report each hit: file, what it is, whether it could reach the
client. Confirm every real key lives only in the secrets manager. If any
real key is exposed anywhere, say so plainly and tell me to rotate it.
```

**S4. Schema review**

```
Print the full current schema and check it against rule 3: entities in
their own tables, standard columns present, field types correct (phone as
text, money as integer cents, dates as timestamps, categories as enums),
constraints in place (unique, foreign keys, not null), owner and tenant
columns everywhere they belong. Flag every deviation with the fix, and
update the schema section of PROJECT-STATE.
```

**S5. Query efficiency sweep**

```
Find every query pattern that fails rule 7: queries inside loops or
repeating groups, unpaginated lists, counts done by loading full lists,
client-side filtering of downloaded tables, and unindexed foreign keys or
filter columns. For each, show where it is and the fix. Assume 5,000 rows
per main table when judging.
```

**S6. Rules-intact check (Replit)**

```
Show me the current "Build rules" section of replit.md word for word.
Confirm it is complete and unmodified. If anything was removed or
reworded, restore the section from 1-BUILD-RULES.md and tell me what had
changed. Then show me the current PROJECT-STATE section.
```

## P5. Pre-launch audit run

Use alongside `3-PRE-LAUNCH-AUDIT.md`. The AI does its half; you still do the manual second-user and payment tests yourself.

```
We are preparing to launch. Work through every section of
3-PRE-LAUNCH-AUDIT.md that can be checked from inside the project
(access control, schema, duplicates, query efficiency, error handling,
secrets). For each item: pass or fail, evidence, severity, and the fix.
Then produce the findings in the report format at the end of that file,
ordered by severity. Do not fix anything until we agree the list. Finally,
list the checks I must do manually (second-user test, auth edge cases in
the browser, Stripe test-mode scenarios, key rotation).
```

## P6. Session restart

Use when returning to a project after a break, before asking for anything new.

```
Before we continue: re-read the build rules and PROJECT-STATE. Summarise
in a few lines what exists today (schema, routes/workflows, integrations,
open items), and confirm which mode we are in. Then wait for my next
instruction.
```
