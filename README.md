# francisvalente.com

Prompt Index site plus a private newsletter service, deployed as one Replit monorepo project. The site is a static Vite + React app; the backend is a shared Express API server under `/api`.

## Newsletter service

Manages a private subscriber list and sends issues through Resend. Emails go out from `Francis Valente <news@navaro.com.au>`, one email per subscriber, never CC or BCC. There is no public sign-up page; subscribers are managed on the admin page only.

### Admin page

`/admin` (unlisted, not in the site nav). One password-protected page showing:

- Sending domain status for `navaro.com.au`, checked live against Resend. If unverified, it lists the exact DNS records Resend wants so they can be added in Cloudflare, with per-record copy buttons.
- The subscriber list (email, first name, status, date added) with add and remove.
- The issue sender: subject, body (markdown or simple HTML), send test, send to all active subscribers, and the sent-issue history.

### Endpoints

All served by the API server under `/api/newsletter`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/newsletter/admin/session` | none | Whether the caller holds a valid admin session |
| POST | `/api/newsletter/admin/session` | password | Login; sets the session cookie (12 h) |
| GET | `/api/newsletter/admin/domain` | session | Resend verification status for navaro.com.au plus required DNS records |
| GET | `/api/newsletter/admin/subscribers` | session | List subscribers |
| POST | `/api/newsletter/admin/subscribers` | session | Add a subscriber (reactivates a previously unsubscribed email) |
| DELETE | `/api/newsletter/admin/subscribers/{id}` | session | Remove a subscriber |
| GET | `/api/newsletter/admin/issues` | session | Sent-issue history (subject, date, recipient count) |
| POST | `/api/newsletter/admin/test-send` | session | Send the draft to francis@vgfs.com.au only |
| POST | `/api/newsletter/admin/send` | session | Send to all active subscribers, individually |
| GET | `/api/newsletter/unsubscribe/{token}` | none | One-click unsubscribe link from email footers; flips immediately |
| POST | `/api/newsletter/unsubscribe/{token}` | none | RFC 8058 one-click unsubscribe target (List-Unsubscribe-Post) |

Resend failures surface their real error message in the admin page, per recipient on full sends.

### Secrets

| Name | Used for |
| --- | --- |
| `RESEND_API_KEY` | All Resend API calls (domain status, sending) |
| `ADMIN_PASSWORD` | The admin page password |
| `SESSION_SECRET` | Signs the admin session cookie |
| `DATABASE_URL` | Provided by Replit; holds `newsletter_subscribers` and `newsletter_issues`. The API server creates these tables automatically at start if they are missing, so a fresh production database needs no manual migration step |

No keys are hardcoded. If a secret is missing the API answers with an explicit error instead of a silent fallback.

### How a weekly send works

1. Open `/admin` and enter the admin password.
2. Check the sending domain reads VERIFIED. If not, add the listed DNS records in Cloudflare and refresh until it does.
3. Write the subject and body (markdown or simple HTML).
4. SEND TEST TO ME: emails only francis@vgfs.com.au. Check rendering in a real inbox.
5. SEND TO N ACTIVE: shows the recipient count and asks for confirmation. Each active subscriber gets an individual email with a personal one-click unsubscribe link in the footer and `List-Unsubscribe` / `List-Unsubscribe-Post` headers.
6. The issue is recorded (subject, date, recipient count, failures). Sending a byte-identical issue to the full list again is refused unless explicitly confirmed as a duplicate (SEND ANYWAY).

Every send (test and real) renders the typed subject and body into the wrapper at `artifacts/api-server/src/lib/newsletter-template.html`. The template's header, styles and footer are used verbatim; the rows between its `<!-- OPENER -->` and `<!-- FOOTER -->` comments are replaced with the typed content, and its `{{unsubscribe_url}}` placeholder is swapped for each recipient's personal link at send time. Keep those two markers and the placeholder intact when editing the template.

Unsubscribing flips the subscriber to unsubscribed immediately with no confirmation screen. Note: some corporate mail scanners follow links inside emails, which can trigger an unsubscribe; accepted tradeoff for a small personal list.
