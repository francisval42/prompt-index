---
order: 3
file: 3-PRE-LAUNCH-AUDIT.md
title: The audit before launch
added: 2026-08-22
updated: 2026-08-22
---
# PRE-LAUNCH-AUDIT.md

The self-audit to run before real users touch the app. Version 1.0, August 2026.

Budget two to three hours. You need: a second test account (a non-admin user you create fresh), your browser's developer tools (F12, Network tab), and payments in test mode. Prompt P5 in `2-PROMPTS.md` makes the AI run its half; the tests below marked "manual" are yours, because they are exactly the tests the AI never does for itself.

**Severity scale**

- **Critical**: data leak, money handled wrongly, users locked out, exposed credentials. Do not launch until fixed and re-tested.
- **Important**: breaks for real users or at real scale within weeks. Fix before or immediately after launch, with a date.
- **Nice-to-have**: polish and hygiene. Backlog.

---

## 1. Access control and data privacy

Why: the single most common finding. Developer-mode permissions left on in production means any user can read any user's data.

Test (manual):

1. Create a second, non-admin account. Sign in with it in a private window.
2. Try to reach the first account's data through the UI: change IDs in URLs (`/listing/12` to `/listing/13`), open pages deep-linked from account A.
3. Open the Network tab, find the API calls the app makes, and replay them with account B's session but account A's record IDs. On Supabase-style platforms, query the API directly with the public anon key from the browser.
4. Try writes, not just reads: edit or delete one of account A's records as account B.
5. Check every data type/table, not just the obvious one. Messages, transactions, and uploaded files are the usual leaks.

Pass when: every cross-user read and write fails, through the UI and through the raw API, on every table.

Severity if failed: **Critical**.

## 2. Authentication edge cases

Why: login works on the happy path because you tested as yourself. Half of audited apps have at least one of these flows broken.

Test (manual), walk each flow:

1. Sign up twice with the same email. Expect a clear message, not a second account or a crash.
2. Sign in before verifying the email. Expect an explanation and a resend option.
3. Open a verification link after it expires, and open one twice. Expect a friendly page with a way forward, not a dead end.
4. Full password reset: request, receive, use the link, confirm the old password stopped working and other sessions ended.
5. Request a reset for an email that has no account. Expect the same neutral message as for a real one.
6. If Google/OAuth sign-in exists: sign up with password, then with Google on the same email. Expect one account with defined behaviour.

Pass when: every flow shows a sensible message and leaves the account in a sane state.

Severity if failed: flows 1 to 4 **Critical** (users locked out or duplicated), 5 and 6 **Important**.

## 3. Payments beyond the success case

Why: checkout works because you tested with the success card. Refunds, failures, and cancellations arriving with no handler pile up silently for months.

Test (manual, Stripe test mode):

1. Successful checkout with `4242 4242 4242 4242`. Confirm access flips on the webhook, not the redirect: complete a checkout, close the browser BEFORE the success page loads, and check the account still got upgraded.
2. Declined payment with `4000 0000 0000 0002`. Expect a clear user-facing message and no access granted.
3. Cancel the subscription from the Stripe dashboard (not from the app). Confirm the app notices and downgrades at the right time.
4. Issue a refund from the Stripe dashboard. Confirm access is revoked and the change is recorded.
5. Checkout with `4000 0000 0000 0259`, which creates a dispute in test mode. Confirm the account gets flagged and you get alerted, per rule 5.
6. In Stripe, open the webhook endpoint's delivery log. Confirm events are succeeding (200s), and that failed/retried events are visible somewhere you would notice.
7. Confirm the webhook verifies signatures: the endpoint should reject a request sent to it without a valid Stripe signature.

Pass when: every lifecycle event changes the user's entitlement correctly without human intervention.

Severity if failed: **Critical**.

## 4. Secrets and credentials

Why: keys pasted into AI chats, committed to code, or shipped in the client bundle. Assume anything that ever left the secrets manager is compromised.

Test:

1. Run sweep S3 (the AI searches code and config).
2. Manual: load the app, view page source and the JS bundles (Network tab), and search for `sk_live`, `sk_test`, `whsec_`, `service_role`, `AKIA`, `Bearer `, and your API keys' first characters. The Stripe publishable key (`pk_`) and Supabase anon key are the only acceptable finds, and the anon key only if section 1 passed.
3. Search your AI chat histories for any real key you ever pasted.
4. Check each provider dashboard for key scopes: no full-access key where a restricted one works.

Pass when: nothing secret is reachable from the client or sitting in code/chat history, and scopes are minimal.

Severity if failed: **Critical**.

**Rotation checklist (do this before launch even if everything passed):** create new keys for every service (Stripe secret + webhook secret, database/service keys, email provider, any third-party API), update the secrets manager, confirm the app works, then revoke the old keys. Rotation is cheap; a leaked key is not.

## 5. Database structure

Why: the schema was modelled for the demo. It works at 10 users and falls apart at 500.

Test:

1. Run sweep S4 (the AI prints and checks the schema).
2. Review the flags yourself against rule 3: entities stuffed into User or Listing that need their own table (messages, transactions, reviews), phone numbers in numeric fields, dates as text, money as floats, missing owner/tenant columns, missing unique/foreign-key/not-null constraints.
3. Spot-check real records: an Australian mobile stored as a number will have lost its leading zero already.

Pass when: no structural flags at Critical or Important severity remain.

Severity if failed: **Important** (Critical if tenancy columns are missing, that becomes an access-control hole).

## 6. Duplicate workflows and features

Why: "add a feature" prompts across many sessions quietly build the same thing twice. Two handlers fire on one trigger, records double up, and on Bubble it burns Workload Units.

Test:

1. Run sweep S2 (alphabetical inventory, near-duplicates flagged).
2. Manual spot-check: perform the app's core action once and count what happened. One email sent, one record created, one notification. Check the database and logs, not just the UI.

Pass when: the inventory is clean and one action produces exactly one of everything.

Severity if failed: **Important** (Critical if it double-charges or double-records transactions).

## 7. Performance under real data

Why: everything is fast with 12 rows. N+1 queries and unpaginated lists are invisible until traffic arrives, then fatal.

Test:

1. Ask the AI to seed realistic volume: `Seed the database with [N] test users and [N] records per main table, clearly marked as seed data with a flag so we can delete them cleanly.` Use at least 500.
2. Open the heaviest pages (dashboards, lists, search) with the Network tab open. Look at response sizes and counts: one page triggering dozens of similar requests is an N+1; a multi-megabyte JSON response is an unpaginated table download.
3. Run sweep S5.
4. Delete the seed data afterwards using the flag.

Pass when: heavy pages load in a couple of seconds with a bounded number of requests and paginated responses.

Severity if failed: **Important**.

## 8. Error handling and logging

Why: most AI-built apps fail silently. The first you hear of a production bug is a user leaving.

Test (manual):

1. In developer tools, switch the network to Offline and submit a form. Expect a plain-language message, not a white screen or a button that does nothing.
2. Break one integration on purpose (temporarily set an invalid API key for a non-critical service). Expect a handled failure for the user and a logged error with context for you.
3. Double-click every submit button that creates or pays for something. Expect one record, one charge.
4. Confirm logs exist and you know where to read them, and that they contain no secrets or passwords.

Pass when: every induced failure produced both a sensible user message and a useful log line.

Severity if failed: **Important** (Critical if double-submit creates double charges).

---

## The audit report

Findings become a written report, not a feeling. Fill this in as you go; it doubles as a client-ready document.

```
AUDIT REPORT

App:            [APP NAME]
Platform:       [PLATFORM]
Date:           [DATE]
Audited by:     [NAME]
Scope:          Sections 1-8 of PRE-LAUNCH-AUDIT.md v1.0

EXECUTIVE SUMMARY
[Three to five sentences: overall state, count of findings by severity,
launch recommendation: go / go after criticals / no-go.]

FINDINGS
| ID | Area | Severity | Finding | Evidence | Fix | Effort | Status |
|----|------|----------|---------|----------|-----|--------|--------|
| F1 | Access control | Critical | [what you found] | [screenshot ref / steps] | [the fix] | [hours] | Open |

PRIORITISED FIX LIST
1. [All Criticals, in order: data leaks, then payments, then secrets, then auth]
2. [Importants with dates]
3. [Nice-to-haves, backlog]

RE-TEST LOG
| ID | Re-tested on | Result |

SIGN-OFF
All Critical findings fixed and re-tested: [YES/NO]
All keys rotated:                          [YES/NO]
Cleared for launch:                        [YES/NO]  [DATE]
```

Placeholders in the template: `[APP NAME]`, `[PLATFORM]`, `[DATE]`, `[NAME]` are yours to fill in; the bracketed guidance inside sections describes what to write there. Take a screenshot for every finding and number them to match the ID column.

## Launch gate

Launch when, and only when: every Critical is fixed and re-tested, Importants have owners and dates, all keys are rotated, and the report is saved with the project. Re-run the audit after major features, schema changes touching user data, or new integrations.
