---
name: francis-valente-brand
description: "Applies the Francis Valente personal brand to any output: charcoal black surfaces, one vivid orange accent, Gladiator Bold display type over JetBrains Mono. Use whenever Francis wants something styled, branded or presented as his own, any page, artifact, document, deck, graphic or chart for francisvalente.com or his personal identity, and whenever he says brand it, my brand, FV style, or asks for the dark and orange look, even if he does not name the brand."
---

# Francis Valente Brand Styling

## Overview

The personal brand of Francis Valente (francisvalente.com). Near-black surfaces, greyscale type, one vivid orange accent used sparingly. Type does the talking; decoration earns its place or does not appear.

**Keywords**: Francis Valente, personal brand, FV, francisvalente.com, brand colours, dark theme, charcoal, orange accent, styling, visual identity

## Colours

Core palette, dark first:

- Charcoal background: `#0a0a0a`
- Primary text: `#e6e6e6`
- Secondary text: `#8a8a8a`
- Hairline borders: `#1f1f1f`
- Accent orange: `#ff5c00`

Rules:

- Orange is scarce. It marks the active, the interactive and the important: active states, links, hover and focus, one highlighted element or data series per view. Everything else stays greyscale. If orange appears in more than a few places on one screen, it has stopped meaning anything.
- Flat surfaces only. No gradients, no shadows, no elevated cards, no decorative icons, no stock imagery.
- Structure comes from hairline `#1f1f1f` borders and from spacing, not from boxes and fills.

Light contexts (print, documents that must be light): background `#ffffff`, text `#0a0a0a`, secondary `#8a8a8a`, borders `#e5e5e5`, the same orange `#ff5c00` accent under the same scarcity rules. Dark remains the default whenever there is a choice.

## Typography

- Display and headings: **Gladiator Bold**, bundled at `assets/fonts/Gladiator-Bold.ttf`. The face ships in bold only, so use it large and let it sit: page titles, section headings, one-line statements. Never body text.
- Everything else: **JetBrains Mono** (400, 500, 700), falling back to any monospace. Body, UI, labels, captions, code.
- When Gladiator is unavailable, fall back to JetBrains Mono 700. Do not substitute another display face.
- Set Gladiator at normal font-weight. The boldness lives in the face; stacking bold on top double-thickens it in some renderers.
- Gladiator has no brace glyphs ({ }), so keep it away from code and anything that renders braces.

## Using the bundled font

HTML pages and artifacts must embed it so it travels:

```css
@font-face {
  font-family: 'Gladiator';
  src: url(data:font/ttf;base64,BASE64) format('truetype');
  font-weight: normal;
  font-style: normal;
}
```

Replace BASE64 with the output of `base64 -w0 assets/fonts/Gladiator-Bold.ttf`, then set headings to `font-family: 'Gladiator', 'JetBrains Mono', monospace;`.

Documents, slides and anything using system fonts (docx, pptx, LibreOffice rendering):

```bash
mkdir -p ~/.fonts && cp assets/fonts/Gladiator-Bold.ttf ~/.fonts/ && fc-cache -f
```

The installed family name is `Gladiator`. In matplotlib, register it with `matplotlib.font_manager.fontManager.addfont('assets/fonts/Gladiator-Bold.ttf')` and use `FontProperties(fname=...)` for titles.

## Voice

The brand is verbal as much as visual. In any branded content:

- No em dashes, anywhere, ever. Commas, colons, full stops or hyphens instead.
- No explainer text. If a heading needs a subtitle to be understood, fix the heading.
- Direct prose, Australian English, no buzzwords, no preamble, no marketing cadence.
- Titles and labels are outcome-phrased and self-explanatory.

## Charts and data

Dark background, greyscale series stepped between `#e6e6e6` and `#8a8a8a`, orange reserved for the one series or point that matters. Hairline gridlines at `#1f1f1f`. No chart junk: no legends where direct labels work, no borders around plot areas, no 3D.
