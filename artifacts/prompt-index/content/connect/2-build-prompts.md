---
order: 2
file: 2-BUILD-PROMPTS.md
title: The two build prompts
updated: 2026-08-23
---

2-BUILD-PROMPTS

Two prompts. A builds the whole thing from nothing. B adds an MCP
server to a backend that already exists. Anything in < > is a
placeholder, each one says what to replace it with.

PROMPT A - BUILD FROM SCRATCH

Build a backend service that connects <service> (replace with the
tool, e.g. Xero) to Claude over MCP.

Stack: Node/Express on Replit. No frontend beyond a single status
page.

Auth:
- OAuth2 against the <service> API. Client ID, client secret, and
  tenant ID if the provider uses one, come from Replit Secrets as
  environment variables. Never hardcode them.
- Request refresh tokens and store them server-side. Refresh access
  tokens silently.
- Status page shows: signed in as which account, a sign-in button
  and a sign-out button. Sign-out clears the stored session
  completely.
- Redirect URI is the live app URL + /auth/callback.

MCP server:
- Expose an MCP server over HTTP at /mcp using
  @modelcontextprotocol/sdk.
- Tools: <list the reads and writes you need, one per line, e.g.
  list_invoices, read_invoice, create_invoice>.
- Every write tool takes confirmed (boolean). confirmed=false
  returns a full preview of what would happen. confirmed=true
  executes. Never execute without it.
- Tool descriptions state exactly what the tool does and what it
  returns.

Rules:
- Secrets never reach the frontend, the code or the logs.
- API errors surface the real message, not a generic failure.
- README documents every tool, the auth flow and the /mcp URL.

PROMPT B - WRAP AN EXISTING BACKEND

Add an MCP server to this app without changing how it currently
works.

- Install @modelcontextprotocol/sdk.
- Expose an MCP server over HTTP at /mcp.
- Wrap the existing backend functions as tools. Do not rewrite any
  logic, wrap what exists.
- Tools: <list the functions to expose, or delete this line and ask
  the agent to propose a list from the codebase>.
- Every write tool takes confirmed (boolean). confirmed=false
  returns a preview. confirmed=true executes.
- Reuse the app's existing auth and session. If the session is
  missing or expired, tools return a clear "sign in via the web app
  first" message instead of failing silently.
- The web app keeps running exactly as before. Confirm both work.
- README gains a section: the tool list and the /mcp URL.

AFTER EITHER PROMPT

- Test sign-in on the status page before touching MCP.
- Open the /mcp URL in a browser. An error response is fine, a
  timeout is not.
- Go to 3-CONNECT-AND-TEST.
