## Content model

Each prompt is one markdown file with YAML frontmatter:

- id: a three-digit string ("001", "002"), assigned once when the prompt is added, never renumbered and never reused; the next id is always the highest existing id plus one
- title: outcome-phrased, describing what the prompt achieves, never a brand or product name
- category: exactly one of Protocols, Discovery, Generation, Repairs, Review, Builds
- type: one of Protocol, Prompt, Snippet
- platforms: list of tags, e.g. Claude, ChatGPT, Replit Agent
- added: ISO date, set once when the entry is first added and never changed; displayed as `21 Aug 26` on the row (desktop and mobile)
- updated: ISO date, moved on every edit; shown inside the expanded panel only when it differs from added

The markdown body below the frontmatter is the prompt text itself, verbatim. The body is the source of truth for the copy action.

### Packs

`content/launch-ready/*.md` and `content/connect/*.md` use `order`, `file`, `title`, `added`, and `updated`. Refs are `LR` + order or `CN` + order. The frontmatter file name is a tag and, for Connect, the download filename. COPY and DOWNLOAD use exactly the body after the frontmatter, including its whitespace.

### Notes

`content/explainers/*.md` use `order` (existing zero-based order), `file`, `title`, `added`, `updated`, and optional `kind` (default `Explainer`). Public refs start at `N01`. The brand skill follows the explainers, has kind `Skill` and title `Make a brand skill`; its body is the existing six numbered steps, a blank line, then the complete example skill file. The handoff reference provides its added and updated dates because the skill frontmatter has none.

### Digest

`content/digest/*.md` use the following frontmatter:

```yaml
---
issue: "001"
title: The issue title
added: 2026-09-05
updated: 2026-09-05
url: /path-to-a-real-published-issue
---
```

Each row uses the issue as its ref, kind `Issue`, tag `Email`, and an OPEN anchor to `url` in the same tab. HTTP(S) URLs and site-relative paths are supported. Digest rows never expand or copy. No issue is added until its destination exists.

The default view (Recent) is one flat feed of every section, newest `added` first, same-day entries in ref order. A switch row above the feed narrows it to one section (Prompts, Packs, Notes, Digest); with Prompts selected a second row offers the six categories, empty ones hidden. The selection is carried in the URL as `s` and `c` alongside the text filter `q`; Escape clears all three. This document is never rendered or linked from the site.
