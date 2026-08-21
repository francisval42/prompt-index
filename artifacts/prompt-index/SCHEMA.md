## Content model

Each prompt is one markdown file with YAML frontmatter:

- id: a three-digit string ("001", "002"), assigned once when the prompt is added, never renumbered and never reused; the next id is always the highest existing id plus one
- title: outcome-phrased, describing what the prompt achieves, never a brand or product name
- category: exactly one of Protocols, Discovery, Generation, Repairs, Review, Builds
- type: one of Protocol, Prompt, Snippet
- platforms: list of tags, e.g. Claude, ChatGPT, Replit Agent
- updated: date, stored but not displayed

The markdown body below the frontmatter is the prompt text itself, verbatim. The body is the source of truth for the copy action.
