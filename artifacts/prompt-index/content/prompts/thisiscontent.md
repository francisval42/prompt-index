---
id: "007"
title: Capture content from any chat without breaking the flow
category: Builds
type: Protocol
platforms: [Claude, Cowork]
added: 2026-09-09
updated: 2026-09-09
---

---
name: thisiscontent
description: "Capture something from the current chat as publishable content without derailing the work: log it to the Notion Content Log with a summary and full long-form detail, or review the log for the website. Trigger on /thisiscontent, \"this is content\", \"log this for the site\"."
---

# /thisiscontent

Francis says this mid-conversation when the thing just built, explained or discovered is worth sharing later on francisvalente.com. The job is to capture it properly and hand the conversation straight back. Nothing about the current task changes.

## Two modes

- `/thisiscontent` (optionally with a hint, e.g. `/thisiscontent the bundle sync trick`) captures one entry from the current chat.
- `/thisiscontent review` opens the log for a publishing pass with Francis.

## Destination

The Notion database **Content Log**, via the Notion connector.

- Database page: `[NOTION DATABASE ID]`
- Data source: `collection://[DATA SOURCE ID]`

If the Notion connector is not available in the chat, write the entry as a markdown file instead, same fields as frontmatter and the long form as the body, into `[LOCAL FOLDER]` (create the folder if needed, filename `YYYY-MM-DD-short-slug.md`) when that folder is reachable, otherwise deliver the file into the chat and say it needs moving to the log. Never silently drop a capture.

## Capture mode

1. Work out what the content is. Default to the most recent complete, reusable thing in the chat: a prompt, a protocol, a process, a technique, a design decision, an idea. A hint after the command wins. If two candidates are equally plausible, pick the more reusable one and name the other in the closing line so Francis can redirect with one word.
2. Create one page in the Content Log with these properties:
   - Name: outcome-phrased, reserved, part of the furniture. What it lets you do, never a brand name, never ad language, no exclamation marks. Same grammar as the site titles ("Run a shadow work session that ends in one change to try").
   - Summary: two or three plain sentences. What it is, when you reach for it, what it produces.
   - Kind: Prompt (one-shot), Protocol (a role or rules for a whole chat), Snippet, Process (a repeatable way of doing something), Idea (not yet built), Explainer (a how-it-works piece), Pack (a set of files).
   - Category: one of Protocols, Discovery, Generation, Repairs, Review, Builds, or Other when it is not a prompt.
   - Platforms: where it runs or applies (Claude, ChatGPT, Replit Agent, Cowork, Zapier, Other).
   - Status: Captured.
   - Captured: today's date, Melbourne.
   - Source: the chat or thread in a few words ("personal website build, 8 Sep").
   - Site ref: leave empty.
3. Write the page body. This is the long form and it is the point of the exercise. The summary is what you would say in a sentence, the body is what makes it exceptional. Include, as applies:
   - **Verbatim**: for a prompt, protocol or snippet, the exact text, unedited, in a code block. This is the source of truth for the site's COPY action later.
   - **What it does**: the mechanism, plainly. Why it works and what it is really doing underneath.
   - **Where it came from**: the problem or moment that produced it, what was tried first and failed, what the breakthrough was.
   - **The fine detail**: the parts that make it work that a summary would lose. Ordering that matters, a rule that looks optional but is not, the failure modes, the edge cases, numbers and settings that were tuned.
   - **How to use it**: steps, inputs, what to expect back, how long it takes.
   - **Judgement calls**: decisions made along the way and the reasoning, alternatives rejected and why.
   - **Publishing notes**: suggested site section (Prompts, Packs, Notes), anything that must be stripped before it goes public (client names, credentials, internal URLs), and what a reader would need that the chat took for granted.
   Write it in full flowing sentences. Do not pad. Do not invent detail that was not in the chat; if something is unknown, say so in one line rather than guessing.
4. Scrub before saving: no tokens, keys, passwords, client names, account numbers or private emails. Replace with a bracketed placeholder and say so in Publishing notes.
5. Close with one line only, then return to the task: `Logged CL-<ref>: <Name>.` Add a second clause only if a redirect is possible ("or did you mean the sync routine?"). No summary of the entry in the chat, no questions, no offer to do more. The conversation carries on where it was.

## Review mode

1. Query the Content Log for everything with Status Captured or Reviewed, newest first.
2. Present them as a numbered list: Ref, Name, Kind, Category, Captured date, one line of the Summary. Nothing else.
3. Work through them one at a time with Francis, one question per turn: publish, park, or needs more. For each one to publish, draft the site entry from the page body using the site content model (SCHEMA.md in the prompt-index repo: three-digit id set once, outcome-phrased title, one category, type, platforms, added and updated dates, body verbatim for prompts). Hand the entry to the website work as a branch with a separate commit, in line with how he reviews code changes.
4. Update the Notion page: Status to Publishing when the branch is pushed, Published with the Site ref filled in once it is live, Parked if he passes.

## Style

Australian English. No em dashes, use commas, full stops or hyphens. No buzzwords. Titles reserved. Body in prose, not bullet soup, except the verbatim block and any genuine step list.