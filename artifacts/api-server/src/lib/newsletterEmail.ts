import { createHash } from "node:crypto";
import { marked } from "marked";
import templateHtml from "./newsletter-template.html";

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

// ---------------------------------------------------------------- template --
// newsletter-template.html is the user-supplied wrapper. Its header, styles
// and footer are used verbatim; the sample content between the two markers
// below is replaced with the typed subject and body. Keep the markers and the
// {{unsubscribe_url}} placeholder intact when editing the template.

const CONTENT_START = "<!-- OPENER -->";
const CONTENT_END = "<!-- FOOTER -->";
const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";
// Sample-specific bits of the template head/header that must not go out
// verbatim in real issues.
const SAMPLE_DATE_LINE = "Issue 001 · 5 September 2026";
const TITLE_RE = /<title>[\s\S]*?<\/title>/;
const PREHEADER_RE = /<span style="display:none[^>]*>[\s\S]*?<\/span>/;

const SANS = "-apple-system, 'Segoe UI', Arial, Helvetica, sans-serif";
const MONO = "Consolas, Menlo, 'Courier New', monospace";
const PREHEADER_STYLE =
  "display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all;";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Orange 1px rule, same construction the template uses for section breaks. */
function rule(margin: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; margin:${margin};"><tbody><tr><td height="1" style="height:1px; background-color:#ff5c00; font-size:0; line-height:1px;">&nbsp;</td></tr></tbody></table>`;
}

/**
 * Restyles marked's bare HTML output with the template's inline styles so
 * typed markdown looks native to the wrapper: headings become orange-rule
 * section labels, blockquotes become the bordered highlight box, links get
 * the accent color. Email clients ignore <style> for most of this, hence
 * inline everything.
 */
function styleBodyHtml(html: string): string {
  const pStyle = `margin:0 0 16px 0; font-family:${SANS}; font-size:16px; line-height:27px; mso-line-height-rule:exactly; color:#e6e1d8;`;
  const sectionLabel = (inner: string): string =>
    `${rule("18px 0 0 0")}\n<p style="margin:16px 0 16px 0; font-family:${MONO}; font-size:13px; line-height:20px; mso-line-height-rule:exactly; letter-spacing:0.08em; color:#a49e93;">${inner}</p>`;

  return (
    html
      // Fenced code blocks first so the inline <code> pass cannot touch them.
      .replace(
        /<pre><code[^>]*>/g,
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; background-color:#2b2521; border:1px solid #34343c; margin:0 0 16px 0;"><tbody><tr><td style="padding:16px 20px;"><pre style="margin:0; font-family:${MONO}; font-size:13px; line-height:20px; color:#e6e1d8; white-space:pre-wrap; word-break:break-word;">`,
      )
      .replace(/<\/code><\/pre>/g, "</pre></td></tr></tbody></table>")
      .replace(
        /<code>/g,
        `<code style="font-family:${MONO}; font-size:14px; background-color:#2b2521; padding:1px 5px; color:#e6e1d8;">`,
      )
      .replace(/<p>/g, `<p style="${pStyle}">`)
      .replace(
        /<a href=/g,
        `<a style="color:#ff7a33; text-decoration:underline;" href=`,
      )
      .replace(/<strong>/g, `<strong style="color:#faf7f1;">`)
      .replace(/<ul>/g, `<ul style="margin:0 0 16px 0; padding:0 0 0 24px;">`)
      .replace(/<ol>/g, `<ol style="margin:0 0 16px 0; padding:0 0 0 24px;">`)
      .replace(
        /<li>/g,
        `<li style="margin:0 0 8px 0; font-family:${SANS}; font-size:16px; line-height:26px; mso-line-height-rule:exactly; color:#e6e1d8;">`,
      )
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g, (_m, _level, inner: string) =>
        sectionLabel(inner),
      )
      .replace(
        /<blockquote>/g,
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; background-color:#2b2521; border:1px solid #ff5c00; margin:0 0 16px 0;"><tbody><tr><td style="padding:22px 24px 6px 24px;">`,
      )
      .replace(/<\/blockquote>/g, "</td></tr></tbody></table>")
      .replace(/<hr\s*\/?>/g, rule("8px 0 24px 0"))
      .replace(/<img /g, `<img style="max-width:100%; height:auto; border:0;" `)
  );
}

/** Inbox preview snippet derived from the typed body (plain text, ~140 chars). */
function preheaderFrom(markdown: string, fallback: string): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[#>\s*-]+/gm, " ")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const source = plain || fallback;
  return source.length > 140 ? `${source.slice(0, 139).trimEnd()}…` : source;
}

/** "5 September 2026" style date for the header strip, Sydney time. */
function issueDateLine(): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(new Date());
}

/**
 * Renders the typed subject and body (markdown, inline HTML passed through)
 * into the user-supplied template's content area. Header, styles and footer
 * come from the template; the caller provides the per-recipient unsubscribe
 * URL, which replaces the template's {{unsubscribe_url}} placeholder.
 */
export function buildIssueEmail(
  subject: string,
  body: string,
  unsubscribeUrl: string,
): BuiltEmail {
  const rendered = marked.parse(body, { async: false }) as string;

  let html = templateHtml
    .split(UNSUBSCRIBE_PLACEHOLDER)
    .join(escapeHtml(unsubscribeUrl));

  const start = html.indexOf(CONTENT_START);
  const end = html.indexOf(CONTENT_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      "newsletter-template.html is missing its <!-- OPENER --> / <!-- FOOTER --> content markers",
    );
  }

  const contentRows = `<!-- CONTENT (generated from the typed subject and body) -->
        <tr>
          <td class="pad" width="600" style="padding:36px 40px 0 40px;">
            <p style="margin:0; font-family:${SANS}; font-size:21px; line-height:29px; mso-line-height-rule:exactly; font-weight:700; color:#faf7f1;">${escapeHtml(subject)}</p>
          </td>
        </tr>
        <tr>
          <td class="pad" width="600" style="padding:24px 40px 0 40px; font-family:${SANS}; font-size:16px; line-height:27px; mso-line-height-rule:exactly; color:#e6e1d8;">
${styleBodyHtml(rendered)}
          </td>
        </tr>

        `;
  html = html.slice(0, start) + contentRows + html.slice(end);

  // Sample head/header bits: title and hidden preview text follow the typed
  // content; the header date line shows the send date.
  html = html.replace(TITLE_RE, `<title>${escapeHtml(subject)}</title>`);
  html = html.replace(
    PREHEADER_RE,
    `<span style="${PREHEADER_STYLE}">${escapeHtml(preheaderFrom(body, subject))}</span>`,
  );
  html = html.replace(SAMPLE_DATE_LINE, issueDateLine());

  const text = `${body}\n\n--\nUnsubscribe: ${unsubscribeUrl}\n`;

  return { html, text };
}
