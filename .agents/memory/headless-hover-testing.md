---
name: Headless verification limits
description: Hover/CSP noise, transient UI timing and remote clipboard limits
---

Tailwind v4 wraps every hover: utility in @media (hover: hover). Headless test browsers can report (hover: none), so computed styles never show the hover value even though real desktop browsers apply it.

**Why:** An e2e run flagged a "missing" row hover tint (Aug 2026). A comparative check showed old rows behaved identically, and the compiled CSS had the rule correctly inside the media query. Nothing was broken.

**How to apply:** When a tester reports a missing hover state, compare a pre-existing element with the same class in the same run, and check the compiled CSS (curl the dev server's /src/index.css?direct). Only treat it as a regression if old and new elements differ.

## Dev-mode CSP inline-style console errors

Test runs against the Vite dev server surface repeated console errors about refused inline styles (Content-Security-Policy). This is ambient dev-environment noise from the dev plugins that inject inline styles; rendering and app behavior are unaffected.

**How to apply:** when a tester's report mentions CSP inline-style console errors but the tested behavior passed, treat them as noise — not a regression to chase.

## Transient feedback and clipboard

Check one-second COPIED feedback with the click and timed observations inside one browser evaluation, not separate remote actions. Do not extend the product's feedback duration just to satisfy a delayed assertion.

**Why:** Remote browser round trips can outlast the entire feedback interval. The remote native clipboard also stalled during verification even with permissions, so a missing later screenshot label alone did not establish an application failure.

**How to apply:** A resolving clipboard recorder can verify the exact outgoing bytes and application state changes, but does not prove an OS clipboard transfer. Report that distinction. For one-time redirect notices, check the initial landing before any helper reloads it.
