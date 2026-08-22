// Generates the site favicon set: lowercase "fv" (JetBrains Mono 700, brand
// accent #ff5c00) on a charcoal sphere shaded with brand neutral ramp values.
// Sources: attached_assets/brand/fonts/JetBrainsMono-700.woff2, tokens.json.
// Run from repo root: node scripts/src/gen-favicon.mjs
import { createRequire } from "node:module";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const fontkit = require("fontkit"); // CJS module, no ESM default export

const FONT = "attached_assets/brand/fonts/JetBrainsMono-700.woff2";
const OUT_DIR = "artifacts/prompt-index/public";
const MARK_COPY = "attached_assets/brand/marks/mark-fv-sphere.svg";

const SIZE = 512;
const RADIUS = 252;
const FONT_SIZE = 250;
const ACCENT = "#ff5c00";
// brand neutral ramp: 700, 800, 900
const SPHERE_HI = "#323232";
const SPHERE_MID = "#1c1c1c";
const SPHERE_LO = "#080808";

const font = fontkit.openSync(path.resolve(FONT));
const scale = FONT_SIZE / font.unitsPerEm;
const run = font.layout("fv");

// Serialize glyph outlines to a single SVG path, y flipped (font units are y-up).
let d = "";
let penX = 0;
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
const fmt = (n) => Number(n.toFixed(2));

for (let i = 0; i < run.glyphs.length; i++) {
  const glyph = run.glyphs[i];
  const pos = run.positions[i];
  const ox = penX + pos.xOffset;
  const oy = pos.yOffset;
  const tx = (x) => fmt((ox + x) * scale);
  const ty = (y) => fmt(-(oy + y) * scale);
  const track = (x, y) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  };
  for (const cmd of glyph.path.commands) {
    const a = cmd.args;
    switch (cmd.command) {
      case "moveTo": { const x = tx(a[0]), y = ty(a[1]); track(x, y); d += `M${x} ${y}`; break; }
      case "lineTo": { const x = tx(a[0]), y = ty(a[1]); track(x, y); d += `L${x} ${y}`; break; }
      case "quadraticCurveTo": {
        const cx = tx(a[0]), cy = ty(a[1]), x = tx(a[2]), y = ty(a[3]);
        track(cx, cy); track(x, y); d += `Q${cx} ${cy} ${x} ${y}`; break;
      }
      case "bezierCurveTo": {
        const c1x = tx(a[0]), c1y = ty(a[1]), c2x = tx(a[2]), c2y = ty(a[3]), x = tx(a[4]), y = ty(a[5]);
        track(c1x, c1y); track(c2x, c2y); track(x, y);
        d += `C${c1x} ${c1y} ${c2x} ${c2y} ${x} ${y}`; break;
      }
      case "closePath": d += "Z"; break;
      default: throw new Error(`Unhandled path command: ${cmd.command}`);
    }
  }
  penX += pos.xAdvance;
}

if (!d) throw new Error("No glyph outlines produced");

// Center the ink box optically in the sphere.
const inkW = maxX - minX;
const inkH = maxY - minY;
const dx = fmt(SIZE / 2 - (minX + inkW / 2));
const dy = fmt(SIZE / 2 - (minY + inkH / 2));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
<defs>
<radialGradient id="s" cx="35%" cy="30%" r="78%">
<stop offset="0" stop-color="${SPHERE_HI}"/>
<stop offset="0.55" stop-color="${SPHERE_MID}"/>
<stop offset="1" stop-color="${SPHERE_LO}"/>
</radialGradient>
</defs>
<circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${RADIUS}" fill="url(#s)"/>
<path transform="translate(${dx} ${dy})" fill="${ACCENT}" d="${d}"/>
</svg>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "favicon.svg"), svg);
fs.writeFileSync(MARK_COPY, svg);

const png = (px) => new Resvg(svg, { fitTo: { mode: "width", value: px } }).render().asPng();

fs.writeFileSync(path.join(OUT_DIR, "apple-touch-icon.png"), png(180));
const p16 = png(16), p32 = png(32), p48 = png(48);
const ico = await pngToIco([p16, p32, p48]);
fs.writeFileSync(path.join(OUT_DIR, "favicon.ico"), ico);

console.log(JSON.stringify({
  inkW: fmt(inkW), inkH: fmt(inkH), dx, dy,
  svgBytes: svg.length,
  files: ["favicon.svg", "favicon.ico", "apple-touch-icon.png", MARK_COPY],
}));
