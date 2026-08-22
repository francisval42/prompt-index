import './_group.css';

type Swatch = {
  name: string;
  role: string;
  hex: string;
  oklch: string;
  color: string;
  text?: string;
};

const corePalette: Swatch[] = [
  { name: 'INK', role: 'PAGE BACKGROUND', hex: '#0a0a0a', oklch: 'oklch(14.5% 0 0)', color: '#0a0a0a' },
  { name: 'PANEL', role: 'RAISED SURFACE / HAIRLINE', hex: '#1f1f1f', oklch: 'oklch(23.9% 0 0)', color: '#1f1f1f' },
  { name: 'TEXT', role: 'PRIMARY CONTENT', hex: '#e6e6e6', oklch: 'oklch(92.5% 0 0)', color: '#e6e6e6', text: '#0a0a0a' },
  { name: 'MUTED', role: 'SECONDARY CONTENT', hex: '#8a8a8a', oklch: 'oklch(63.3% 0 0)', color: '#8a8a8a', text: '#0a0a0a' },
  { name: 'ACCENT', role: 'ACTIVE / FOCUS / COPIED', hex: '#ff5c00', oklch: 'oklch(68.4% 0.212 40.6)', color: '#ff5c00', text: '#0a0a0a' },
  { name: 'LIGHT', role: 'LIGHT CONTEXT', hex: '#ffffff', oklch: 'oklch(100% 0 0)', color: '#ffffff', text: '#0a0a0a' },
];

const neutralRamp = [
  ['50', '#f3f3f3'], ['100', '#d5d5d5'], ['200', '#b7b7b7'], ['300', '#9b9b9b'], ['400', '#7f7f7f'],
  ['500', '#646464'], ['600', '#4b4b4b'], ['700', '#323232'], ['800', '#1c1c1c'], ['900', '#080808'],
];

const accentRamp = [
  ['50', '#ffe0d5'], ['100', '#fec1ab'], ['200', '#fd9f7d'], ['300', '#fd7743'], ['400', '#ff5c00'],
  ['500', '#cc4a07'], ['600', '#ac3c02'], ['700', '#8b3106'], ['800', '#6e2403'], ['900', '#521801'],
];

const contrastRows = [
  ['TEXT', 'INK', '15.86', 'AA', false],
  ['MUTED', 'INK', '5.73', 'AA', false],
  ['ACCENT', 'INK', '6.39', 'AA', false],
  ['TEXT', 'PANEL', '13.21', 'AA', false],
  ['MUTED', 'PANEL', '4.77', 'AA', false],
  ['ACCENT', 'PANEL', '5.32', 'AA', false],
  ['INK', 'LIGHT', '19.80', 'AA', false],
  ['MUTED', 'LIGHT', '3.45', 'LARGE TEXT ONLY', true],
  ['ACCENT', 'LIGHT', '3.10', 'LARGE TEXT AND UI ONLY', true],
  ['INK', 'ACCENT', '6.39', 'AA', false],
  ['LIGHT', 'ACCENT', '3.10', 'LARGE ONLY', true],
];

function RuleLabel({ children }: { children: React.ReactNode }) {
  return <div className="fv-rule-label">{children}</div>;
}

function ContextFragment({ light = false }: { light?: boolean }) {
  return (
    <div className={`fv-context ${light ? 'is-light' : ''}`}>
      <div className="fv-context-top"><span>INDEX / 041</span><span>READY</span></div>
      <div className="fv-context-row">
        <span className="fv-state-mark" />
        <span className="fv-context-title">SYSTEM PROMPT</span>
        <span className="fv-context-meta">COPIED</span>
      </div>
      <div className="fv-context-row">
        <span className="fv-state-space" />
        <span className="fv-context-title">EVALUATION NOTE</span>
        <span className="fv-context-meta">12.04.24</span>
      </div>
    </div>
  );
}

export function ColorTypography() {
  return (
    <main className="fv-board">
      <style>{`
        .fv-board { min-height:100dvh; padding:0 32px 76px; letter-spacing:-.02em; }
        .fv-sheet { width:100%; max-width:1216px; margin:0 auto; border-left:1px solid #1f1f1f; border-right:1px solid #1f1f1f; }
        .fv-topline { height:43px; border-bottom:1px solid #1f1f1f; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:0 18px; color:#8a8a8a; font-size:9px; font-weight:500; letter-spacing:.15em; }
        .fv-topline span:last-child{text-align:right}.fv-topline strong{font-weight:500;color:#e6e6e6}
        .fv-header { min-height:248px; padding:33px 18px 29px; border-bottom:1px solid #1f1f1f; display:flex; flex-direction:column; justify-content:space-between; }
        .fv-overline,.fv-rule-label,.fv-section-note { color:#8a8a8a; font-size:9px; font-weight:500; letter-spacing:.16em; line-height:1.45; text-transform:uppercase; }
        .fv-title { margin:22px 0 0; font-family:var(--fv-font-display); font-size:clamp(48px,7.1vw,94px); font-weight:normal; letter-spacing:.01em; line-height:.78; color:#e6e6e6; }
        .fv-title-sub { align-self:flex-end; width:calc(50% - 9px); color:#8a8a8a; font-size:10px; letter-spacing:.11em; line-height:1.65; text-transform:uppercase; }
        .fv-section { border-bottom:1px solid #1f1f1f; }
        .fv-section-heading { min-height:64px; padding:0 18px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1f1f1f; }
        .fv-section-heading h2 { margin:0; font-size:10px; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:#e6e6e6; }
        .fv-core-grid { display:grid; grid-template-columns:repeat(6,1fr); }
        .fv-swatch { min-height:218px; border-right:1px solid #1f1f1f; padding:14px; display:flex; flex-direction:column; justify-content:space-between; }.fv-swatch:last-child{border-right:0}
        .fv-swatch-color { height:102px; border:1px solid #323232; }
        .fv-swatch-data { margin-top:20px; }.fv-swatch-name { font-size:11px;font-weight:700;letter-spacing:.09em; }.fv-swatch-role,.fv-swatch-oklch { margin-top:6px;color:#8a8a8a;font-size:8px;font-weight:500;line-height:1.5;letter-spacing:.1em; }.fv-swatch-hex{margin-top:12px;font-size:11px;font-weight:500;letter-spacing:.04em}
        .fv-ramp-block { padding:18px; }.fv-ramp-title { margin-bottom:13px; display:flex;justify-content:space-between;align-items:end; }
        .fv-ramp { display:grid;grid-template-columns:repeat(10,1fr);border:1px solid #323232; }.fv-ramp-cell { height:86px;border-right:1px solid rgba(10,10,10,.34);padding:9px;display:flex;flex-direction:column;justify-content:space-between; }.fv-ramp-cell:last-child{border:0}.fv-ramp-cell span{font-size:9px;font-weight:700;letter-spacing:.04em}.fv-ramp-cell small{font-size:8px;font-weight:500;letter-spacing:.03em}.fv-ramp-cell.brand{outline:2px solid #ff5c00;outline-offset:-2px}
        .fv-dual { display:grid;grid-template-columns:1fr 1fr; }.fv-context-wrap{padding:18px;border-right:1px solid #1f1f1f;}.fv-context-wrap:last-child{border:0}.fv-context { margin-top:15px;border:1px solid #323232;background:#0a0a0a;color:#e6e6e6; }.fv-context.is-light{background:#fff;border-color:#d5d5d5;color:#0a0a0a}.fv-context-top,.fv-context-row { display:grid;grid-template-columns:1fr auto;align-items:center;padding:0 13px; }.fv-context-top{height:36px;border-bottom:1px solid currentColor;font-size:8px;font-weight:500;letter-spacing:.12em;opacity:.62}.fv-context-row{height:50px;border-bottom:1px solid currentColor;grid-template-columns:8px 1fr auto;gap:10px}.fv-context-row:last-child{border:0}.fv-state-mark{width:5px;height:5px;background:#ff5c00}.fv-state-space{width:5px;height:5px}.fv-context-title{font-size:10px;font-weight:500;letter-spacing:.1em}.fv-context-meta{font-size:8px;font-weight:500;letter-spacing:.1em;color:#ff5c00}.fv-context-row:last-child .fv-context-meta{color:currentColor;opacity:.54}
        .fv-type { padding:0 18px; }.fv-display-specimen { padding:30px 0 38px;border-bottom:1px solid #1f1f1f; }.fv-display-word { font-family:var(--fv-font-display);font-weight:normal;line-height:.83;letter-spacing:.01em;color:#e6e6e6;white-space:nowrap; }.fv-display-word:nth-child(2){font-size:clamp(40px,5.7vw,75px);margin-top:27px}.fv-display-word:nth-child(3){font-size:clamp(30px,4vw,53px);margin-top:23px}.fv-display-word:nth-child(4){font-size:30px;margin-top:20px}
        .fv-mono-specimen{display:grid;grid-template-columns:180px 1fr;padding:23px 0;border-bottom:1px solid #1f1f1f;align-items:baseline}.fv-mono-specimen:last-child{border:0}.fv-mono-meta{color:#8a8a8a;font-size:8px;font-weight:500;letter-spacing:.14em;line-height:1.65}.fv-mono-sample{color:#e6e6e6}.fv-mono-sample.head{font-size:25px;font-weight:700;letter-spacing:-.05em}.fv-mono-sample.label{font-size:11px;font-weight:500;letter-spacing:.16em}.fv-mono-sample.body{font-size:13px;font-weight:400;letter-spacing:-.03em}.fv-legibility{font-size:9px;font-weight:400;letter-spacing:.015em;color:#e6e6e6}
        .fv-audit { overflow-x:auto; }.fv-table { width:100%;border-collapse:collapse;min-width:720px; }.fv-table th,.fv-table td{height:48px;padding:0 18px;border-bottom:1px solid #1f1f1f;text-align:left;font-size:10px;letter-spacing:.07em;}.fv-table th{height:39px;color:#8a8a8a;font-size:8px;font-weight:500;letter-spacing:.15em;text-transform:uppercase}.fv-table td{font-weight:500}.fv-table td:nth-child(3){font-size:11px;color:#e6e6e6}.fv-table td:last-child{color:#8a8a8a;font-size:9px}.fv-table tr.is-limit td:last-child{color:#ff5c00}.fv-limit{display:inline-block;border:1px solid #ff5c00;padding:3px 5px;font-size:8px;letter-spacing:.09em}
        .fv-footer { padding:18px;display:flex;justify-content:space-between;color:#8a8a8a;font-size:8px;font-weight:500;letter-spacing:.13em;text-transform:uppercase; }
        @media(max-width:760px){.fv-board{padding:0 12px 36px}.fv-topline{grid-template-columns:1fr auto}.fv-topline strong{display:none}.fv-header{min-height:210px}.fv-title-sub{width:100%;margin-top:20px;align-self:auto}.fv-core-grid{grid-template-columns:repeat(2,1fr)}.fv-swatch:nth-child(2n){border-right:0}.fv-swatch:nth-child(-n+4){border-bottom:1px solid #1f1f1f}.fv-dual{grid-template-columns:1fr}.fv-context-wrap{border-right:0;border-bottom:1px solid #1f1f1f}.fv-mono-specimen{grid-template-columns:1fr;gap:12px}.fv-display-word:nth-child(4){font-size:23px}.fv-section-heading{min-height:56px}.fv-section-note{display:none}.fv-ramp{min-width:650px}.fv-ramp-block{overflow-x:auto}}
      `}</style>
      <div className="fv-sheet">
        <header className="fv-topline"><span>FRANCIS VALENTE / BRAND KIT</span><strong>COLOR + TYPOGRAPHY</strong><span>BOARD 01 / 2024</span></header>
        <section className="fv-header">
          <div><div className="fv-overline">01 / FOUNDATION</div><h1 className="fv-title">COLOR<br />TYPE</h1></div>
          <div className="fv-title-sub">Approved values for product interface, prompt index and document system.</div>
        </section>

        <section className="fv-section">
          <div className="fv-section-heading"><h2>Core palette</h2><div className="fv-section-note">Six named values only</div></div>
          <div className="fv-core-grid">{corePalette.map((swatch) => <div className="fv-swatch" key={swatch.name}><div className="fv-swatch-color" style={{ background: swatch.color }} /><div className="fv-swatch-data"><div className="fv-swatch-name">{swatch.name}</div><div className="fv-swatch-role">{swatch.role}</div><div className="fv-swatch-hex">{swatch.hex}</div><div className="fv-swatch-oklch">{swatch.oklch}</div></div></div>)}</div>
        </section>

        <section className="fv-section">
          <div className="fv-section-heading"><h2>Neutral ramp</h2><div className="fv-section-note">Pure grey / no tint</div></div>
          <div className="fv-ramp-block"><div className="fv-ramp-title"><RuleLabel>50 → 900</RuleLabel><RuleLabel>Interface calibration</RuleLabel></div><div className="fv-ramp">{neutralRamp.map(([step, hex]) => <div className="fv-ramp-cell" key={step} style={{ background: hex, color: Number(step) < 400 ? '#0a0a0a' : '#e6e6e6' }}><span>{step}</span><small>{hex}</small></div>)}</div></div>
        </section>
        <section className="fv-section">
          <div className="fv-section-heading"><h2>Accent ramp</h2><div className="fv-section-note">400 / Brand value</div></div>
          <div className="fv-ramp-block"><div className="fv-ramp-title"><RuleLabel>50 → 900</RuleLabel><RuleLabel>State system only</RuleLabel></div><div className="fv-ramp">{accentRamp.map(([step, hex]) => <div className={`fv-ramp-cell ${step === '400' ? 'brand' : ''}`} key={step} style={{ background: hex, color: Number(step) < 400 ? '#0a0a0a' : '#e6e6e6' }}><span>{step}</span><small>{hex}{step === '400' ? ' / BRAND' : ''}</small></div>)}</div></div>
        </section>

        <section className="fv-section">
          <div className="fv-section-heading"><h2>Context behavior</h2><div className="fv-section-note">Same fragment / two contexts</div></div>
          <div className="fv-dual"><div className="fv-context-wrap"><RuleLabel>Dark context / ink</RuleLabel><ContextFragment /></div><div className="fv-context-wrap"><RuleLabel>Light context / light</RuleLabel><ContextFragment light /></div></div>
        </section>

        <section className="fv-section">
          <div className="fv-section-heading"><h2>Type specimen</h2><div className="fv-section-note">Two families / fixed roles</div></div>
          <div className="fv-type">
            <div className="fv-display-specimen"><RuleLabel>Gladiator / display only</RuleLabel><div className="fv-display-word">FRANCIS VALENTE</div><div className="fv-display-word">FRANCIS VALENTE</div><div className="fv-display-word">FRANCIS VALENTE</div></div>
            <div className="fv-mono-specimen"><div className="fv-mono-meta">JetBrains Mono<br />700 / Heading</div><div className="fv-mono-sample head">Prompt index / protocol</div></div>
            <div className="fv-mono-specimen"><div className="fv-mono-meta">JetBrains Mono<br />500 / Label</div><div className="fv-mono-sample label">SOURCE / SESSION / 014</div></div>
            <div className="fv-mono-specimen"><div className="fv-mono-meta">JetBrains Mono<br />400 / Body</div><div className="fv-mono-sample body">A maintained reference for reusable instructions and evaluation notes.</div></div>
            <div className="fv-mono-specimen"><div className="fv-mono-meta">JetBrains Mono<br />400 / 9px</div><div className="fv-legibility">0123456789 / ABCDEFGHIJKLMNOPQRSTUVWXYZ / prompt_id: fv.041</div></div>
          </div>
        </section>

        <section className="fv-section">
          <div className="fv-section-heading"><h2>Contrast audit</h2><div className="fv-section-note">WCAG 2.1 / measured ratios</div></div>
          <div className="fv-audit"><table className="fv-table"><thead><tr><th>Foreground</th><th>Background</th><th>Ratio</th><th>Result</th></tr></thead><tbody>{contrastRows.map(([fg, bg, ratio, result, limited]) => <tr className={limited ? 'is-limit' : ''} key={`${fg}-${bg}`}><td>{fg}</td><td>{bg}</td><td>{ratio}:1</td><td>{limited ? <span className="fv-limit">{result}</span> : result}</td></tr>)}</tbody></table></div>
        </section>
        <footer className="fv-footer"><span>FRANCISVALENTE.COM</span><span>COLOR AND TYPOGRAPHY / 01</span></footer>
      </div>
    </main>
  );
}