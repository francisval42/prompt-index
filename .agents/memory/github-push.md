---
name: GitHub push auth
description: How git pushes authenticate in this workspace, and why the GitHub connector cannot sign them
---

# GitHub push auth

Two separate credential systems exist. They fail independently.

1. **git push / fetch (the git wire protocol)** authenticates via `GIT_ASKPASS=replit-git-askpass`. That script asks a local pid2 service (`localhost:8284/$REPLIT_ASKPASS_PID2_SESSION/github/token`) for a token minted from the **user's Replit account-level GitHub link** (replit.com/account, Connected services — same thing the Git pane uses). If GitHub rejects it, the remote says `Invalid username or token. Password authentication is not supported for Git operations.` Only the user can repair it by reconnecting GitHub on their account page or in the Git pane. Anonymous fetch still works on public repos, so fetch succeeding proves nothing about push.

2. **The GitHub connector (integration)** is API-only. `listConnections('github')` returns the connection with `settings` EMPTY by design — credentials are withheld from the sandbox and injected server-side by the proxy. `getClient()` works for REST calls (verify with `client.rest.users.getAuthenticated()`), but no raw token is ever exposed, so it cannot authenticate git pushes, and `client.auth()` yields nothing usable.

**How to apply:** when a push fails auth, probe the connector API first. If the API probe succeeds, do NOT propose reauthorizing the connector — the broken credential is the account-level link, which is the user's to fix. Fallback: a user-provided PAT via the secrets flow. Recreating commits over the REST API is not an option when local SHAs must be preserved.

**Why recorded:** burned a session discovering the connector's health is unrelated to git push auth, and that empty connector settings are normal, not a defect.
