---
order: 1
file: 1-BUILD-RULES.md
title: Rules the AI builds under
updated: 2026-08-22
---
# BUILD-RULES.md

Non-negotiable build rules for this project. Version 1.0, August 2026.

**To the human:** attach this file at the start of every AI build chat, or install it permanently using the platform notes in 0-START-HERE.md. On Replit, paste the whole file into `replit.md` under the marked section.

**To the AI assistant:** you are building a production application, not a demo. The rules below override convenience, speed, and "keeping the code simple". Read them all before writing any code, then follow section 0.

---

## 0. Operating agreement

1. On first read, confirm you have these rules by summarising them in 10 bullets or fewer, then ask the human the setup questions in section 0.1 if they have not been answered yet.
2. These rules apply to every feature, every table, every endpoint. If a request conflicts with a rule, say so and propose a compliant alternative. Never silently drop a rule.
3. If the platform makes a rule impossible, say which rule and why, and state the nearest compliant approach. Do not just skip it.
4. Work in small slices. Describe your plan before any change that touches more than a few files, the schema, or auth.
5. Never rewrite or delete code unrelated to the current request. Never run destructive database operations (drop, truncate, bulk delete, column type changes on live data) without explicit approval and a stated backup step.
6. Maintain a `PROJECT-STATE.md` file in the project root (on Replit, keep this as a section inside `replit.md`). It lists: current schema, routes or workflows, integrations, and decisions made. Update it every time any of those change. This is what prevents duplicate features being built in later sessions.
7. State which mode is active at the start of each session: PROTOTYPE or PRODUCTION (section 0.2). Default to PRODUCTION unless told otherwise.
8. Every feature ends with the Definition of Done report (section 9). Do not declare a feature finished without it.

### 0.1 Setup questions (ask once, record answers in PROJECT-STATE)

1. Who owns data? Single user per account, teams/organisations, or public content? (This sets the tenancy model.)
2. Which data is private to its owner, and which is meant to be public?
3. How do users sign in? (Email/password, magic link, Google, platform auth.)
4. Are payments involved now or later? One-off or subscriptions?
5. Expected scale in the first six months? (Rough user and record counts.)
6. Prototype or production? (Section 0.2.)

### 0.2 Modes

- **PROTOTYPE**: a throwaway experiment, no real users, no real data. Rules 1 (access control) and 2 (secrets) still apply in full. Rules 3 to 8 may be relaxed, but say so when you relax one.
- **PRODUCTION**: anything real users will touch, even a small beta. All rules apply.

---

## 1. Access control: deny by default

The most common launch-killing defect in AI-built apps is data readable by anyone. Access control is created WITH each table, never added later.

### 1A. If the client talks to the database directly (Supabase, Firebase, Lovable, Bubble)

- Enable row-level security (or privacy rules) on every table the moment it is created. A table without rules does not get its first row of user data.
- Never `USING (true)`, never "Everyone can view", never a data type with no privacy rules. If something is meant to be public, write an explicit rule that says exactly which fields are public and to whom.
- Write separate policies for SELECT, INSERT, UPDATE, and DELETE. INSERT and UPDATE use WITH CHECK so users cannot write rows they should not own.
- The anon/public API key is safe only because of these rules. Never expose the service-role or admin key to the client.

### 1B. If a server sits between client and database (Replit Agent apps, Express, Next.js API routes)

- Every route or endpoint authenticates the caller before doing anything else. No unauthenticated routes except those deliberately public, listed in PROJECT-STATE.
- The user's identity comes from the session or verified token only. Never from the request body, query string, or a client-supplied ID. `userId` in a request payload is an attack, not a convenience.
- Every database query on user data is filtered by the authenticated owner or tenant ID. No "fetch by record ID alone" on private data: fetch by record ID AND owner ID.
- Admin capability is a server-side check on the user's record, never a hidden button, a client-side flag, or a special URL.

### Both models

- Every table holding user data carries an owner column (`user_id`) and, if teams exist, a tenant column (`org_id`). Every read and write is scoped by them.
- The access test that matters: sign in as a second, non-admin user and attempt to read and write the first user's data through the UI and through the raw API. Both must fail. This test is part of Definition of Done for any feature touching user data.

---

## 2. Secrets and credentials

- All keys, tokens, and connection strings live in the platform's secrets manager (Replit App Secrets, environment variables). Never in source code, never in client-side code, never committed, never pasted into an AI chat.
- The only keys allowed in client code are ones designed to be public (Stripe publishable key, Supabase anon key), and the anon key is only acceptable when rule 1A is fully in place.
- Service-role, secret, and admin keys are used in server-side code only.
- In code examples and docs, always use obvious placeholders like `[YOUR-STRIPE-SECRET-KEY]`, and say where the real value must be set. Never invent realistic-looking keys.
- Every incoming webhook verifies its signature (for Stripe, the `whsec_` signing secret) before processing.
- Request the narrowest key scope the integration needs. No full-access keys where a restricted key works.
- If you notice a real credential in code, chat history, or logs, say so immediately and tell the human to rotate it. Assume it is compromised.
- Never log secrets, tokens, passwords, or full card details.

---

## 3. Database design

Model for the product, not the demo. Apps that work at 10 users fail at 500 because of what was stuffed into the User table in week one.

- One table per real entity. Messages, transactions, reviews, notifications, memberships each get their own table with foreign keys. Never lists, delimited strings, or growing JSON blobs inside User or Listing to avoid making a table.
- Standard columns on every table: `id` (UUID), `created_at`, `updated_at`, and the owner/tenant columns from rule 1.
- Field types, no exceptions:
  - Phone numbers: text (E.164 format). A numeric type drops leading zeros.
  - Money: integer cents (or a decimal type). Never floating point.
  - Dates and times: proper timestamp type with timezone. Never text.
  - Fixed categories (status, role, plan): enum or option set, not free text.
  - True/false: boolean, not "yes"/"no" strings.
- Constraints are not optional: unique on email and anything else that must be unique, foreign keys on every relation, NOT NULL on required fields.
- Schema changes happen through migrations (or the platform's schema tool), never ad-hoc live edits. After any schema change, print the updated schema and record it in PROJECT-STATE.
- Store only the personal data the product needs. Every PII field is a liability.

---

## 4. Authentication: the full matrix, not the happy path

Use the platform's managed auth (Replit Auth, Supabase Auth, Clerk). Never hand-roll password storage or session handling.

Every one of these flows must work and show a sensible message. Half of them are broken in most AI-built apps:

1. Sign-up with an email that already exists: clear message, no duplicate account, no crash.
2. Sign-in attempt before email verification: explain the state, offer to resend the link.
3. Verification link opened after expiry, or opened twice: friendly error plus a resend option, never a dead end or a blank page.
4. Password reset end to end: request, email arrives, link works once, old sessions handled.
5. Password reset requested for an email that does not exist: show the same "if that account exists, we sent a link" message. Different messages let attackers enumerate users.
6. Same email arriving via OAuth (Google) and via password sign-up: one account, defined behaviour, not two half-accounts.
7. Password change or reset invalidates other active sessions.
8. Account deletion: define what happens to the user's data, and make sign-in afterwards behave sensibly.

Also: rate-limit auth endpoints, and never confirm whether an email is registered through error message differences.

---

## 5. Payments: the webhook is the source of truth

A redirect to a success page proves nothing. Entitlements change only when a verified webhook event says so.

- Never mark a user as paid from the client-side success redirect alone. The `checkout.session.completed` (or equivalent) webhook does that.
- Handle the whole lifecycle, each mapped to an entitlement change:

| Event | What you must do |
|---|---|
| `checkout.session.completed` | Grant access, store customer and subscription IDs on the user |
| `invoice.payment_failed` | Mark past_due, restrict or warn, notify the user |
| `customer.subscription.updated` | Sync plan and status from the event payload |
| `customer.subscription.deleted` | Revoke access at the right moment (usually period end) |
| `charge.refunded` | Revoke access, record it |
| `charge.dispute.created` | Flag the account, alert the human |

- Verify the webhook signature on every event. Reject unsigned or badly signed calls.
- Webhook handlers are idempotent: record processed event IDs and skip repeats, because Stripe retries.
- The user record carries a subscription status field with the full lifecycle (`active`, `past_due`, `cancelled`, `refunded`), not a paid boolean.
- Development and testing use test-mode keys only. Before launch, the human runs the payment tests in 3-PRE-LAUNCH-AUDIT.md, including a decline, a cancellation made from the Stripe dashboard, and a refund.

---

## 6. Code organisation and duplication

The root cause of duplicate workflows is that each chat session forgets the last one. PROJECT-STATE (rule 0.6) is the fix. These rules use it.

- Before adding any feature, workflow, endpoint, or scheduled job: check PROJECT-STATE and search the codebase for anything similar. If something close exists, extend it. Building a near-duplicate is a defect.
- One trigger, one handler. If two things must respond to the same trigger, document why in PROJECT-STATE.
- Name things by a convention that makes near-duplicates visible when sorted: verb-object, prefixed by domain (`booking-create`, `booking-cancel`, `email-send-receipt`).
- Delete dead code and disabled workflows. Do not keep switched-off duplicates around, they get re-enabled by accident and they burn platform quota.
- Business logic lives in one place and is reused. The same price calculation copied into three files is three future bugs.
- Keep the client/server boundary explicit: validation and authorisation on the server always, client-side checks are UX only.
- Small files with one job. When a file passes roughly 300 lines or mixes concerns, split it.
- Commit (or checkpoint) after every working slice with a message saying what changed. Never leave a day of work uncommitted.

---

## 7. Performance and queries

Invisible at 10 users, fatal at 500. Build it right the first time, it costs nothing extra.

- Never query inside a loop or per row of a displayed list. Fetch related data with joins or a single batched query. On no-code platforms: no searches inside repeating group cells.
- Paginate every list that can grow past about 50 rows. No "load all users" pages.
- Count with a count query or aggregate. Never load a full list just to display its length.
- Filter and sort on the server or in the database query. Never download a whole table and filter it client-side.
- Index every foreign key and every column used in common filters and sorts.
- Fetch only needed fields on large tables, not entire rows with heavy columns.

---

## 8. Errors, logging, and failure states

Silent failure makes production debugging impossible. Every failure is visible to the user and recorded for the developer.

- Every external call (API, database, payment, email) has an explicit failure path. Decide what the user sees and what gets logged. "It just does nothing" is never acceptable.
- Users see a plain-language message and what to do next ("Could not save your listing. Try again, and contact us if it keeps happening."). Never a white screen, a raw stack trace, or a silent no-op.
- Log errors server-side with context: what operation, which user or request, what the underlying error was. No secrets or full PII in logs.
- Submit buttons show a loading state and disable while in flight. This is double-charge and double-record protection, not polish.
- Every list has a designed empty state, every fetch a loading state.
- Background jobs and webhooks log failures somewhere a human will actually see.

---

## 9. Definition of Done (report this per feature)

A feature is finished only when you can state, item by item:

1. Access control written and tested for every new table or route, including the second-user test (rule 1). State how it was tested.
2. No new secrets in code or client bundle; new keys went into the secrets manager (rule 2).
3. Schema changes follow rule 3 and are recorded in PROJECT-STATE.
4. Relevant auth edge cases still work (rule 4).
5. Payment paths, if touched, are webhook-driven and idempotent (rule 5).
6. Duplicate check done: nothing similar already existed, or it was extended instead (rule 6).
7. Lists paginated, no per-row queries introduced (rule 7).
8. Failure paths handled and logged, loading/disabled/empty states present (rule 8).
9. PROJECT-STATE updated.

End every feature with this list, marking each item done, not applicable (with reason), or NOT done (flag it clearly).

---

## Appendix: condensed rules block

For workspace-level custom instructions, or tools where you cannot attach files. Paste as-is.

```
BUILD RULES (condensed). You are building a production app, not a demo.
1. Access control with every table, deny by default. Client-DB platforms: RLS/privacy
   rules on every table, no USING(true), policies for select/insert/update/delete.
   Server apps: authenticate every route, identity from session only (never from the
   request), every query scoped by owner/tenant ID. Test as a second user.
2. Secrets only in the secrets manager. Never in code, client bundles, or chat.
   Verify webhook signatures. Flag any exposed key and tell me to rotate it.
3. Real schema: own table per entity, UUID ids, created_at/updated_at, owner column.
   Phone = text, money = integer cents, dates = timestamp, categories = enum.
   Unique + foreign key + not-null constraints. Migrations, not live edits.
4. Auth full matrix: duplicate email sign-up, unverified sign-in, expired/reused
   verification links, full password reset, no user enumeration, OAuth + email
   collision = one account. Managed auth only, never hand-rolled.
5. Payments: entitlements change on verified webhooks only, never on the success
   redirect. Handle failed payments, cancellations, refunds, disputes. Idempotent
   handlers. Subscription status field, not a paid boolean.
6. Before adding anything, check for an existing similar feature and extend it.
   One trigger one handler. Delete dead code. Maintain PROJECT-STATE.md (schema,
   routes, integrations, decisions) and update it every change.
7. No queries in loops. Paginate lists over 50 rows. Count with aggregates.
   Filter server-side. Index foreign keys.
8. Every external call has a failure path: plain-language user message plus a
   server-side log with context. Loading and disabled states on submits.
9. End each feature by reporting against these rules: done, n/a, or NOT done.
If a request conflicts with a rule, say so and propose a compliant alternative.
```
