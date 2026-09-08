---
name: Content glob validation
description: Vite builds do not guarantee that markdown globs actually loaded the library
---

Validate the content registry against the source files after relocating a loader. A green typecheck and build do not establish that Vite's eager glob imports found anything.

**Why:** A wrong relative glob can compile to an empty object without an error. A separately synthesized brand note can leave the page looking plausible while the actual library is missing.

**How to apply:** Compare loaded refs and section counts to the markdown files, and compare copy/download payloads to the exact post-frontmatter bytes, including leading blank lines and CRLF.