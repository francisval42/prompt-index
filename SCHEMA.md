## Content model

Each prompt is one markdown file with YAML frontmatter:

- id: a three-digit string ("001", "002"), assigned once when the prompt is added, never renumbered and never reused; the next id is always the highest existing id plus one
- title: outcome-phrased, describing what the prompt achieves, never a brand or product name
- category: exactly one of Protocols, Discovery, Generation, Repairs, Review, Builds
- type: one of Protocol, Prompt, Snippet
- platforms: list of tags, e.g. Claude, ChatGPT, Replit Agent
- updated: ISO date, displayed as `21 Aug 26` in the manifest

The markdown body below the frontmatter is the prompt text itself, verbatim. The body is the source of truth for the copy action.

### Packs

`content/launch-ready/*.md` and `content/connect/*.md` use `order`, `file`, `title`, and `updated`. Refs are `LR` + order or `CN` + order. The frontmatter file name is a tag and, for Connect, the download filename. COPY and DOWNLOAD use exactly the body after the frontmatter, including its whitespace.

### Notes

`content/explainers/*.md` use `order` (existing zero-based order), `file`, `title`, `updated`, and optional `kind` (default `Explainer`). Public refs start at `N01`. The brand skill follows the explainers, has kind `Skill` and title `Make a brand skill`; its body is the existing six numbered steps, a blank line, then the complete example skill file. The handoff reference provides its update date because the skill frontmatter has none.

### Digest

`content/digest/*.md` use the following frontmatter:

```yaml
---
issue: "001"
title: The issue title
updated: 2026-09-05
url: /path-to-a-real-published-issue
---
```

Each row uses the issue as its ref, kind `Issue`, tag `Email`, and an OPEN anchor to `url` in the same tab. HTTP(S) URLs and site-relative paths are supported. Digest rows never expand or copy. No issue is added until its destination exists.

Sections render in the order Prompts, Packs, Notes, Digest, with rows sorted by ref within each. Empty and fully filtered sections do not render. This document is never rendered or linked from the site.
