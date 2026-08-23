---
order: 10
title: Production debugging
summary: Live logs and read-only queries on the deployed app
updated: 2026-08-23
---

The published app is [symptom].

Before touching code: read the production logs and query the live database read-only. Root cause with evidence first, the exact log line or query result. Then the smallest fix. Then proof it works in production, not just locally.
