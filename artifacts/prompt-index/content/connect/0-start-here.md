---
order: 0
file: 0-START-HERE.md
title: The six step process
added: 2026-08-22
updated: 2026-08-23
---

0-START-HERE

THE PROCESS

1. List what Claude needs to reach. Email, calendar, files, CRM, phones,
   whatever the job touches. One line per service.

2. Check the directory. claude.ai settings > Connectors > browse the
   directory. Claude Code: /mcp. If the service is there, connect it,
   authorise the account, test with one real task. You are done. Stop.

3. No connector? Confirm the service has an API and your plan includes
   API access. No API, no build.

4. Set up API access with 1-API-ACCESS. App registration, tenant,
   redirect URI, scopes, secrets. Complete the checklist before any
   code exists.

5. Build the server with 2-BUILD-PROMPTS. Prompt A builds a backend
   with an MCP server from scratch. Prompt B wraps an existing backend.
   Either way, every write sits behind confirmed=true.

6. Register and test with 3-CONNECT-AND-TEST. Add the /mcp endpoint as
   a custom connector, run the smoke tests, keep the troubleshooting
   card for the day the tools vanish.

RULES

- Connector before custom. Always check the directory first, it grows
  every month.
- One server per service, not one per task.
- Writes preview by default. Nothing sends, deletes or books without
  confirmed=true.
- Secrets live in Replit Secrets, never in code, never in the prompt.
- New scopes invalidate old logins. Build a sign-out button on day one
  and use it after every scope change.
