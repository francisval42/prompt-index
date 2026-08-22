---
order: 1
file: 1-API-ACCESS.md
title: The auth checklist
updated: 2026-08-23
---

1-API-ACCESS

THE CHECKLIST

1. Find the developer portal. Microsoft: Azure Portal > App
   registrations. Google: Cloud Console > Credentials. Anything else:
   search "<service> developer API" (replace <service> with the tool
   you are connecting).

2. Register one app per service. Name it after the tool, not the task.
   The same registration can back other builds later.

3. Account audience. Decide who can sign in: work accounts only, or
   work plus personal. Wrong audience fails login with no useful error.
   Microsoft: this is signInAudience, and tenant "common" covers both.

4. Platform type is Web. Not Mobile, not Desktop. An app on Replit
   authenticating through a browser redirect is a Web platform. Wrong
   type rejects the redirect silently.

5. Redirect URI. The exact live URL, not localhost.
   https://yourapp.replit.app/auth/callback
   (replace yourapp with your actual Replit app name). Scheme, host
   and path must match character for character. Add localhost as a
   second URI only if you also run it locally.

6. Scopes. List every permission the build needs, read and write, and
   always include the refresh token scope: offline_access on
   Microsoft, access_type=offline on Google. Without it you log in
   again every hour.

7. Secrets. Client ID, tenant ID and client secret go into Replit
   Secrets as environment variables. Never in code, never in a prompt,
   never in git.

8. Secret expiry. Client secrets expire, Microsoft defaults to six
   months. Pick the longest allowed and diarise the renewal.

THE TRAPS

- New scopes kill old logins. Add a scope and the app loops: login
  screen, sign-in flash, login screen, no error anywhere. The stored
  token no longer covers the scopes. Sign out, clear the session, log
  in fresh. This is why the sign-out button is a day one feature.

- Redirect URI mismatch. Fails silently or with a generic error. When
  login breaks, check this before anything else.

- Admin consent. Some scopes on work tenants need an admin to approve
  the app once. If login works on a personal account but not the work
  one, this is it.
