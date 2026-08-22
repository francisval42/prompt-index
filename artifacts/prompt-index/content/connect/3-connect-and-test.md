---
order: 3
file: 3-CONNECT-AND-TEST.md
title: Register, test, troubleshoot
updated: 2026-08-23
---

3-CONNECT-AND-TEST

REGISTER

1. Deploy the app. A workspace preview sleeps, and a sleeping server
   fails the MCP handshake. Deploy it so the /mcp URL stays up.

2. Sign in once via the app's status page. Session-based servers
   expose nothing until someone is signed in.

3. claude.ai: Settings > Connectors > Add custom connector. Name it
   and paste the MCP URL:
   https://<yourapp>.replit.app/mcp
   (replace <yourapp> with your Replit app name).
   Claude Code: claude mcp add --transport http <name> <url>
   (replace <name> with what you want to call the server, <url>
   with the same MCP URL).

4. Start a fresh chat. Tool lists load at session start, never
   mid-chat. Every fix in this doc ends with a new chat.

SMOKE TESTS

1. Read. Ask for something only the new server knows, e.g. "list my
   latest <thing>" (replace <thing> with whatever the service
   holds). Watch which tool fires. Yours, not a built-in.

2. Preview. Ask for a write and expect a preview back, not an
   action. If it executes without asking, stop and fix
   confirmed=true before anything else.

3. Write. Confirm the preview, then check the result in the real
   service, not just the chat.

THE CARD - WHEN TOOLS VANISH

- Fresh chat first. No fix shows up in the session that broke.
- Server asleep. Open the app URL in a browser. If it takes seconds
  to respond, that was the problem. Deploy properly.
- Signed out. Open the status page. If it shows the sign-in button,
  log in and retry.
- Registered but no tools. Replit logs, look for errors on
  initialize or tools/list. That is the handshake failing.
- Tools vanished after adding a tool. One malformed schema silently
  sinks the whole list. Suspect the newest tool.
- Wrong tools firing. A built-in connector for the same service is
  answering first. Disable one of them, or name your server in the
  ask.
