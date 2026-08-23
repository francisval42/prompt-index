---
name: Headless hover false negatives
description: Why e2e testers report missing hover styles on this site (Tailwind v4 hover gating)
---

Tailwind v4 wraps every hover: utility in @media (hover: hover). Headless test browsers can report (hover: none), so computed styles never show the hover value even though real desktop browsers apply it.

**Why:** An e2e run flagged a "missing" row hover tint (Aug 2026). A comparative check showed old rows behaved identically, and the compiled CSS had the rule correctly inside the media query. Nothing was broken.

**How to apply:** When a tester reports a missing hover state, compare a pre-existing element with the same class in the same run, and check the compiled CSS (curl the dev server's /src/index.css?direct). Only treat it as a regression if old and new elements differ.
