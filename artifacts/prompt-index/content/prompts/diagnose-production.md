---
id: "003"
title: Diagnose a broken production app before touching code
category: Repairs
type: Prompt
platforms: [Claude, Replit Agent]
updated: 2026-08-23
---

Investigate the current state of this app and produce a status report with a fix plan. Do not change any code, secrets or settings. Diagnosis only.

Take the symptoms from this chat. Verify every claim about the app yourself rather than assuming it.

Report on:

1. App map. Stack, entry points, how the parts are wired, which processes run in production, how it deploys, whether the production deployment is running, crashed or stale, and when it last deployed successfully.

2. Reproduce each symptom. Trigger the failing path and capture it: endpoint, status code, and the server side stack trace from the production deployment logs, not the workspace logs.

3. Auth and integration chain. For every external service the app talks to, document the flow as implemented: credentials, scopes, token storage and refresh, expiry handling. State which links you verified live.

4. Suspects. Rank the likely causes with the evidence for and against each: expired credentials or secrets, state stored somewhere ephemeral, secrets present in the workspace but missing from the deployment, upstream calls failing with errors swallowed into empty results.

5. Environment. List the names of every env var and secret the code reads and whether each is present in production. Never print values, even partially. Flag any read in code but never set.

6. Report. What is definitely broken, what is fine, root causes ranked with evidence, then a step by step fix plan split into changes inside the app and changes I must make elsewhere myself. Flag any step that could affect other systems sharing the same credentials.

Constraints: read only, nothing sent, no secrets printed, no dependency upgrades. Do not mark anything as diagnosed without quoting the production evidence.
