---
name: Design subagent crash recovery
description: What to do when a canvas/design subagent dies without reporting
---

A subagent that dies without reporting has usually already finished its real work.

**Why:** Crashes tend to happen after the file writes and shape updates, so the deliverable is often complete even though no report arrives.

**How to apply:** Before redoing a dead subagent's work, inspect its outputs directly (files, canvas shape state, rendered preview) and re-apply only what cannot be confirmed, as a cheap idempotent update. When a job promise rejects, JSON.stringify the rejection reason; it prints as [object Object] otherwise.
