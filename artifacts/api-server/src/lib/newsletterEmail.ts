import { createHash } from "node:crypto";
import { marked } from "marked";

export const NEWSLETTER_FROM = "Francis Valente <news@navaro.com.au>";
export const NEWSLETTER_DOMAIN = "navaro.com.au";
export const TEST_RECIPIENT = "francis@vgfs.com.au";

/**
 * Identity of an issue for the duplicate-send refusal. Byte-exact over
 * subject and body; any edit makes it a different issue.
 */
export function issueContentHash(subject: string, body: string): string {
  return createHash("sha256")
    .update(subject)
    .update("\n\u0000\n")
    .update(body)
    .digest("hex");
}

export interface BuiltEmail {
  html: string;
  text: string;
}

/**
 * Renders the body (markdown, with inline HTML passed through) into a
 * minimal single-column email shell with the unsubscribe footer.
 */
export function buildIssueEmail(
  body: string,
  unsubscribeUrl: string,
): BuiltEmail {
  const rendered = marked.parse(body, { async: false }) as string;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#111111;">
${rendered}
<hr style="border:none;border-top:1px solid #dddddd;margin:32px 0 16px;">
<p style="font-size:13px;line-height:1.5;color:#777777;margin:0;">
You are receiving this because you subscribed to Francis Valente's newsletter.
<a href="${unsubscribeUrl}" style="color:#777777;">Unsubscribe</a>
</p>
</div>
</body>
</html>`;

  const text = `${body}\n\n--\nUnsubscribe: ${unsubscribeUrl}\n`;

  return { html, text };
}
