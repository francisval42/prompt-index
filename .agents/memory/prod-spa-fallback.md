---
name: Published site lags workspace
description: Why live-site checks must confirm which bundle is deployed before judging behavior.
---

# Published site lags the workspace

**Rule:** The live deployment serves whatever build the user last published — it can be many merged features behind the workspace, and agents cannot republish (publishing is user-initiated).

**Why:** A production verification judged HTTP 200s on deep links as feature evidence, but the live bundle predated the features entirely — status codes on a stale bundle prove nothing about new client behavior.

**How to apply:** Before judging live behavior, confirm the deployed bundle is current: fetch the JS file the live index.html references and grep it for a distinctive new string. Note the SPA fallback (`/* → /index.html` rewrite in the web artifact's production config) is honored by static autoscale deploys, so deep links return 200 even on stale bundles.
