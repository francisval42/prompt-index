import "./_group.css";

type MarkProps = { className?: string };

function MarkA({ className }: MarkProps) {
  return <svg className={className} viewBox="0 0 120 120" aria-label="Concept A FV interlock" role="img">
    <path fill="currentColor" d="M14 14h66v16H31v20h39v16H31v40H14V14Zm58 36h18l16 40 10-24h-18L89 50h17L120 14H99L72 50Z" />
  </svg>;
}

function MarkB({ className }: MarkProps) {
  return <svg className={className} viewBox="0 0 120 120" aria-label="Concept B index mark" role="img">
    <path fill="currentColor" d="M16 18h88v4H16zm0 21h88v4H16zm0 21h88v4H16zm0 21h62v13H16z" />
  </svg>;
}

function MarkC({ className }: MarkProps) {
  return <svg className={className} viewBox="0 0 120 120" aria-label="Concept C stencil ligature" role="img">
    <path fill="currentColor" fillRule="evenodd" d="M13 14h60v15H31v25h35v15H31v37H13V14Zm54 0h18l19 59 16-59h-18l-7 29-10-29H67Zm18 92h18l15-46H99l-14 46Z" />
    <path fill="#0a0a0a" d="M47 14h8v15h-8zm35 31h8v14h-8zm-11 46h8v15h-8z" />
  </svg>;
}

const marks = [
  { id: "A", name: "INTERLOCK", detail: "F + V / RECTANGULAR BAR SYSTEM", Component: MarkA },
  { id: "B", name: "INDEX", detail: "RULED LIST / ACTIVE LINE", Component: MarkB },
  { id: "C", name: "STENCIL", detail: "FV LIGATURE / CUT CHARACTER", Component: MarkC },
] as const;

function Rule({ label, value }: { label: string; value: string }) {
  return <div className="fv-rule"><span>{label}</span><strong>{value}</strong></div>;
}

export function LogoConcepts() {
  return (
    <main className="fv-board">
      <style>{`
        .fv-board{min-height:100dvh;width:100%;max-width:1280px;margin:0 auto;padding:0 32px 80px;box-sizing:border-box;letter-spacing:.01em}
        .fv-board *{box-sizing:border-box}.fv-board ::selection{background:var(--fv-accent);color:var(--fv-ink)}
        .fv-top{height:94px;border-bottom:1px solid var(--fv-panel);display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
        .fv-kicker,.fv-meta,.fv-caption,.fv-label,.fv-rule span{font-size:10px;line-height:1.3;font-weight:500;letter-spacing:.16em;text-transform:uppercase}
        .fv-kicker{color:var(--fv-muted)}.fv-section-number{justify-self:center;color:var(--fv-accent)}.fv-meta{justify-self:end;color:var(--fv-muted);text-align:right}
        .fv-intro{padding:58px 0 48px;border-bottom:1px solid var(--fv-panel);display:flex;justify-content:space-between;align-items:flex-end;gap:32px}
        .fv-title{font-family:var(--fv-font-display);font-weight:normal;font-size:clamp(42px,7.1vw,91px);line-height:.86;letter-spacing:-.055em;margin:0;text-transform:uppercase}
        .fv-intro-note{color:var(--fv-muted);max-width:260px;font-size:11px;line-height:1.6;text-align:right}
        .fv-section{border-bottom:1px solid var(--fv-panel);padding:24px 0 48px}.fv-section-head{display:flex;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid var(--fv-panel);margin-bottom:32px}
        .fv-label{color:var(--fv-muted)}.fv-caption{color:var(--fv-muted);margin:10px 0 0}.fv-wordmark-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--fv-panel)}
        .fv-wordmark-cell{min-height:215px;padding:28px;border-right:1px solid var(--fv-panel);position:relative;display:flex;align-items:center}.fv-wordmark-cell:nth-child(2n){border-right:0}.fv-wordmark-cell:nth-child(n+3){border-top:1px solid var(--fv-panel)}
        .fv-wordmark-cell.is-light{background:var(--fv-light);color:var(--fv-ink)}.fv-lockup{font-family:var(--fv-font-display);font-weight:normal;font-size:clamp(35px,5.2vw,65px);letter-spacing:-.06em;line-height:.8;text-transform:uppercase}.fv-lockup.one{white-space:nowrap;font-size:clamp(20px,3.2vw,40px)}
        .fv-lockup.stack{line-height:.78}.fv-cell-label{position:absolute;left:28px;top:18px;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--fv-muted)}
        .fv-mark-summary{display:grid;grid-template-columns:170px 1fr;gap:32px;padding:0 0 26px;border-bottom:1px solid var(--fv-panel)}.fv-monogram{width:132px;height:132px;color:var(--fv-text)}.fv-summary-title{font-family:var(--fv-font-display);font-size:38px;letter-spacing:-.04em;margin:6px 0 16px;font-weight:normal}.fv-summary-copy{font-size:11px;line-height:1.65;color:var(--fv-muted);max-width:480px;margin:0}
        .fv-concept{display:grid;grid-template-columns:170px 1fr;border-bottom:1px solid var(--fv-panel);padding:26px 0}.fv-concept:last-child{border-bottom:0}.fv-concept-id{font-size:11px;color:var(--fv-muted);letter-spacing:.16em}.fv-concept-name{color:var(--fv-text);display:block;margin-top:8px}
        .fv-variants{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--fv-panel)}.fv-variant{min-height:148px;padding:16px;border-right:1px solid var(--fv-panel);position:relative;display:flex;align-items:center;justify-content:center}.fv-variant:last-child{border-right:0}.fv-variant.light{background:var(--fv-light);color:var(--fv-ink)}.fv-variant.single{background:var(--fv-text);color:var(--fv-ink)}.fv-variant.single .fv-variant-label{color:#4b4b4b}.fv-variant-label{position:absolute;top:12px;left:14px;font-size:9px;letter-spacing:.12em;color:var(--fv-muted);text-transform:uppercase}.fv-mark{width:78px;height:78px}.fv-variant.light .fv-mark{color:var(--fv-ink)}.fv-testrow{display:flex;align-items:center;gap:18px;padding:18px 0 0}.fv-testrow .fv-label{min-width:104px}.fv-tiny{width:32px;height:32px;color:var(--fv-text)}.fv-tiny.light{background:var(--fv-light);color:var(--fv-ink);padding:4px;box-sizing:content-box}.fv-tiny.single{background:var(--fv-text);color:var(--fv-ink);padding:4px;box-sizing:content-box}
        .fv-spec-grid{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--fv-panel);border-left:1px solid var(--fv-panel)}.fv-spec{min-height:238px;border-right:1px solid var(--fv-panel);border-bottom:1px solid var(--fv-panel);padding:22px;position:relative}.fv-spec h3{font-size:11px;font-weight:500;letter-spacing:.16em;margin:0 0 28px;color:var(--fv-muted)}.fv-clearspace{height:130px;display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:16px}.fv-clear-box{width:178px;height:100px;border:1px dashed var(--fv-muted);display:flex;align-items:center;justify-content:center}.fv-clear-inner{width:110px;height:62px;border:1px solid var(--fv-accent);display:flex;align-items:center;justify-content:center}.fv-clear-inner svg{width:45px;height:45px}.fv-dimension{position:absolute;font-size:9px;color:var(--fv-accent);letter-spacing:.1em}.fv-dimension.top{top:4px}.fv-dimension.side{right:12%;top:59px}.fv-size{display:flex;align-items:flex-end;gap:24px;height:130px;padding-left:8px}.fv-size .fv-mark{width:48px;height:48px}.fv-size-line{height:32px;width:1px;background:var(--fv-accent);position:relative}.fv-size-line:after{content:"32PX";position:absolute;bottom:-18px;left:-10px;color:var(--fv-accent);font-size:9px}.fv-rule{display:flex;justify-content:space-between;border-top:1px solid var(--fv-panel);padding:11px 0;color:var(--fv-muted)}.fv-rule strong{font-size:10px;color:var(--fv-text);font-weight:500;letter-spacing:.06em}.fv-icon-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--fv-panel)}.fv-icon-card{min-height:230px;padding:20px;display:flex;align-items:center;justify-content:center;position:relative;border-right:1px solid var(--fv-panel)}.fv-appicon{width:128px;height:128px;border-radius:26px;background:var(--fv-ink);border:1px solid #323232;display:flex;align-items:center;justify-content:center;position:relative}.fv-appicon svg{width:74px;height:74px;color:var(--fv-text)}.fv-appicon-dot{height:7px;width:7px;background:var(--fv-accent);position:absolute;right:18px;bottom:18px}.fv-footer{display:flex;justify-content:space-between;padding-top:18px;color:var(--fv-muted);font-size:9px;letter-spacing:.14em;text-transform:uppercase}
        @media(max-width:700px){.fv-board{padding:0 16px 48px}.fv-top{grid-template-columns:1fr auto;height:70px}.fv-meta{display:none}.fv-intro{padding:38px 0;display:block}.fv-intro-note{text-align:left;margin-top:22px}.fv-wordmark-grid,.fv-spec-grid{grid-template-columns:1fr}.fv-wordmark-cell{border-right:0;border-bottom:1px solid var(--fv-panel);min-height:160px}.fv-wordmark-cell:last-child{border-bottom:0}.fv-wordmark-cell:nth-child(n+3){border-top:0}.fv-mark-summary,.fv-concept{grid-template-columns:1fr;gap:16px}.fv-variants{grid-template-columns:1fr 1fr}.fv-variant:nth-child(2){border-right:0}.fv-variant:nth-child(n+3){border-top:1px solid var(--fv-panel)}.fv-icon-grid{grid-template-columns:1fr}.fv-icon-card{border-right:0;border-bottom:1px solid var(--fv-panel)}.fv-icon-card:last-child{border-bottom:0}}
      `}</style>

      <header className="fv-top">
        <div className="fv-kicker">Francis Valente / Brand Kit</div>
        <div className="fv-kicker fv-section-number">02 / 04</div>
        <div className="fv-meta">Logo Concepts<br />Revision 01</div>
      </header>

      <section className="fv-intro">
        <h1 className="fv-title">Logo<br />Concepts</h1>
        <p className="fv-intro-note">Approved type faces only. Accent is state-specific. All marks retain structure at minimum scale.</p>
      </section>

      <section className="fv-section">
        <div className="fv-section-head"><span className="fv-label">01 / Primary Wordmark</span><span className="fv-label">Gladiator / Display Cut</span></div>
        <div className="fv-wordmark-grid">
          <div className="fv-wordmark-cell"><span className="fv-cell-label">Ink / One Line</span><div className="fv-lockup one">Francis Valente</div></div>
          <div className="fv-wordmark-cell is-light"><span className="fv-cell-label">Light / One Line</span><div className="fv-lockup one">Francis Valente</div></div>
          <div className="fv-wordmark-cell"><span className="fv-cell-label">Ink / Stacked</span><div className="fv-lockup stack">Francis<br />Valente</div></div>
          <div className="fv-wordmark-cell is-light"><span className="fv-cell-label">Light / Stacked</span><div className="fv-lockup stack">Francis<br />Valente</div></div>
        </div>
      </section>

      <section className="fv-section">
        <div className="fv-section-head"><span className="fv-label">02 / Symbol Study</span><span className="fv-label">Gladiator Derived Geometry</span></div>
        <div className="fv-mark-summary">
          <MarkC className="fv-monogram" />
          <div><div className="fv-summary-title">FV</div><p className="fv-summary-copy">Monogram reference. Use where the full wordmark is impractical. The V is a directional cut through the composition, not a separate appended character.</p></div>
        </div>
        {marks.map(({ id, name, detail, Component }) => (
          <article className="fv-concept" key={id}>
            <div className="fv-concept-id">{id} <span className="fv-concept-name">{name}</span><p className="fv-caption">{detail}</p></div>
            <div>
              <div className="fv-variants">
                <div className="fv-variant"><span className="fv-variant-label">Dark</span><Component className="fv-mark" /></div>
                <div className="fv-variant light"><span className="fv-variant-label">Light</span><Component className="fv-mark" /></div>
                <div className="fv-variant single"><span className="fv-variant-label">Single Colour</span><Component className="fv-mark" /></div>
                <div className="fv-variant"><span className="fv-variant-label">Focused</span><Component className="fv-mark" /><i className="fv-appicon-dot" /></div>
              </div>
              <div className="fv-testrow"><span className="fv-label">Legibility / 32px</span><Component className="fv-tiny" /><Component className="fv-tiny light" /><Component className="fv-tiny single" /></div>
            </div>
          </article>
        ))}
      </section>

      <section className="fv-section">
        <div className="fv-section-head"><span className="fv-label">03 / Application</span><span className="fv-label">Digital System</span></div>
        <div className="fv-icon-grid">
          <div className="fv-icon-card"><span className="fv-variant-label">App Icon / Default</span><div className="fv-appicon"><MarkC /><i className="fv-appicon-dot" /></div></div>
          <div className="fv-icon-card"><span className="fv-variant-label">App Icon / No State Detail</span><div className="fv-appicon"><MarkC /></div></div>
        </div>
      </section>

      <section className="fv-section">
        <div className="fv-section-head"><span className="fv-label">04 / Construction</span><span className="fv-label">Non-Negotiable</span></div>
        <div className="fv-spec-grid">
          <div className="fv-spec"><h3>Clear Space</h3><div className="fv-clearspace"><span className="fv-dimension top">1B</span><span className="fv-dimension side">1B</span><div className="fv-clear-box"><div className="fv-clear-inner"><MarkA /></div></div></div><Rule label="Unit" value="B = MARK BAR THICKNESS" /><Rule label="Minimum clearance" value="1B / ALL SIDES" /></div>
          <div className="fv-spec"><h3>Minimum Size</h3><div className="fv-size"><MarkA className="fv-mark" /><div className="fv-size-line" /></div><Rule label="Digital mark" value="32PX MINIMUM" /><Rule label="Wordmark" value="140PX MINIMUM" /></div>
        </div>
      </section>
      <footer className="fv-footer"><span>Francisvalente.com</span><span>Logo Concepts / 02</span></footer>
    </main>
  );
}