---
name: Bundler-wrapped HTML uploads
description: Attached .html files exported from canvas/artifact previews are self-extracting bundler shells, not the real page.
---

Uploaded HTML that shows a `__bundler_loading` div and `<script type="__bundler/manifest">` blocks is a Replit artifact-export shell. The real page is JSON-encoded inside `<script type="__bundler/template">`; embedded assets live in the manifest.

**Why:** The user's newsletter template arrived in this form; treating the file as the template itself would have shipped the loader shell in emails.

**How to apply:** Extract with `JSON.parse` of the template script's content (node one-liner) before using any uploaded HTML as source material. Empty manifest `{}` means the extracted HTML is self-contained.
