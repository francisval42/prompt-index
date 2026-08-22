import "./_group.css";

export function Guidelines() {
  return (
    <main className="fv-board fv-guidelines">
      <style>{`
        .fv-guidelines {
          min-height: 100dvh;
          padding: 0 32px 88px;
          background: #0a0a0a;
          color: #e6e6e6;
          box-sizing: border-box;
          font-family: var(--fv-font-mono);
        }
        .fv-guidelines * { box-sizing: border-box; }
        .fv-sheet {
          width: 100%;
          max-width: 1216px;
          margin: 0 auto;
          border-left: 1px solid #1f1f1f;
          border-right: 1px solid #1f1f1f;
        }
        .fv-topline {
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid #1f1f1f;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 500;
          line-height: 1;
          letter-spacing: .16em;
          text-transform: uppercase;
        }
        .fv-titlebar {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: end;
          gap: 24px;
          padding: 44px 20px 37px;
          border-bottom: 1px solid #1f1f1f;
        }
        .fv-wordmark {
          margin: 0 0 18px;
          color: #e6e6e6;
          font-family: var(--fv-font-display);
          font-size: 38px;
          font-weight: normal;
          line-height: .82;
          letter-spacing: -.025em;
          text-transform: uppercase;
        }
        .fv-page-title {
          margin: 0;
          color: #e6e6e6;
          font-family: var(--fv-font-display);
          font-size: clamp(46px, 7vw, 88px);
          font-weight: normal;
          line-height: .83;
          letter-spacing: -.035em;
          text-transform: uppercase;
        }
        .fv-document-code {
          padding-bottom: 5px;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .15em;
          text-align: right;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .fv-section { border-bottom: 1px solid #1f1f1f; }
        .fv-section-head {
          display: grid;
          grid-template-columns: 185px 1fr;
          padding: 15px 20px 14px;
          border-bottom: 1px solid #1f1f1f;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .16em;
          line-height: 1.3;
          text-transform: uppercase;
        }
        .fv-section-head strong {
          color: #e6e6e6;
          font-weight: 700;
        }
        .fv-rule {
          display: grid;
          grid-template-columns: 185px minmax(0, 1fr);
          min-height: 53px;
          border-bottom: 1px solid #1f1f1f;
        }
        .fv-rule:last-child { border-bottom: 0; }
        .fv-rule-index {
          padding: 18px 20px;
          border-right: 1px solid #1f1f1f;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .fv-rule-copy {
          padding: 16px 20px;
          color: #e6e6e6;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.55;
        }
        .fv-rule-copy b { font-weight: 700; }
        .fv-exhibits {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #1f1f1f;
        }
        .fv-exhibit { min-width: 0; }
        .fv-exhibit + .fv-exhibit { border-left: 1px solid #1f1f1f; }
        .fv-exhibit-meta {
          display: flex;
          justify-content: space-between;
          padding: 13px 20px;
          border-bottom: 1px solid #1f1f1f;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .15em;
          text-transform: uppercase;
        }
        .fv-status-good { color: #ff5c00; }
        .fv-status-bad { color: #8a8a8a; }
        .fv-demo { min-height: 116px; padding: 20px; }
        .fv-correct-row {
          display: grid;
          grid-template-columns: 7px 1fr auto;
          align-items: center;
          min-height: 52px;
          border-top: 1px solid #1f1f1f;
          border-bottom: 1px solid #1f1f1f;
          color: #e6e6e6;
          font-size: 12px;
        }
        .fv-state-mark { width: 2px; height: 20px; background: #ff5c00; }
        .fv-correct-row span:nth-child(2) { padding-left: 12px; }
        .fv-correct-row span:last-child { padding-right: 12px; color: #ff5c00; font-size: 10px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; }
        .fv-wrong-block {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          padding: 0 12px;
          background: #ff5c00;
          color: #0a0a0a;
          font-size: 12px;
          font-weight: 700;
        }
        .fv-type-misuse {
          padding: 26px 20px 28px;
          color: #e6e6e6;
          font-family: var(--fv-font-display);
          font-size: 24px;
          font-weight: normal;
          line-height: .95;
          text-transform: uppercase;
        }
        .fv-copy-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #1f1f1f;
        }
        .fv-copy-cell {
          min-height: 77px;
          padding: 16px 20px;
          border-bottom: 1px solid #1f1f1f;
        }
        .fv-copy-cell:nth-child(odd) { border-right: 1px solid #1f1f1f; }
        .fv-copy-cell:nth-last-child(-n+2) { border-bottom: 0; }
        .fv-copy-label { display: block; margin-bottom: 10px; color: #8a8a8a; font-size: 9px; font-weight: 500; letter-spacing: .15em; text-transform: uppercase; }
        .fv-copy-value { font-size: 13px; line-height: 1.35; }
        .fv-copy-value .fv-accent-text { color: #ff5c00; }
        .fv-access {
          display: grid;
          grid-template-columns: 185px 1fr;
        }
        .fv-access-label {
          padding: 17px 20px;
          border-right: 1px solid #1f1f1f;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .fv-access-content { min-width: 0; }
        .fv-ratio { display: grid; grid-template-columns: 1fr 88px 74px; min-height: 49px; border-bottom: 1px solid #1f1f1f; align-items: center; padding: 0 20px; font-size: 12px; }
        .fv-ratio span:nth-child(2) { color: #e6e6e6; text-align: right; }
        .fv-ratio span:last-child { color: #8a8a8a; font-size: 10px; font-weight: 500; letter-spacing: .12em; text-align: right; text-transform: uppercase; }
        .fv-constraints { padding: 16px 20px 17px; font-size: 12px; line-height: 1.7; }
        .fv-constraints p { margin: 0; }
        .fv-footer { display: flex; justify-content: space-between; padding: 15px 20px; color: #8a8a8a; font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
        @media (max-width: 700px) {
          .fv-guidelines { padding: 0 12px 44px; }
          .fv-titlebar { grid-template-columns: 1fr; padding-top: 34px; }
          .fv-document-code { text-align: left; }
          .fv-section-head, .fv-rule, .fv-access { grid-template-columns: 112px minmax(0, 1fr); }
          .fv-section-head, .fv-rule-index, .fv-rule-copy, .fv-access-label { padding-left: 12px; padding-right: 12px; }
          .fv-exhibits, .fv-copy-grid { grid-template-columns: 1fr; }
          .fv-exhibit + .fv-exhibit { border-left: 0; border-top: 1px solid #1f1f1f; }
          .fv-copy-cell:nth-child(odd) { border-right: 0; }
          .fv-copy-cell:nth-last-child(2) { border-bottom: 1px solid #1f1f1f; }
          .fv-ratio { padding: 0 12px; grid-template-columns: 1fr 64px 52px; font-size: 11px; }
          .fv-topline { padding: 0 12px; }
          .fv-footer { padding: 14px 12px; }
        }
      `}</style>
      <div className="fv-sheet">
        <header className="fv-topline">
          <span>Francis Valente</span><span>Brand Kit / Board 04</span>
        </header>
        <div className="fv-titlebar">
          <div>
            <p className="fv-wordmark">Francis Valente</p>
            <h1 className="fv-page-title">Brand<br />Guidelines</h1>
          </div>
          <div className="fv-document-code">FV / 04.00 / 2024.11</div>
        </div>

        <section className="fv-section">
          <div className="fv-section-head"><strong>01 / Colour</strong><span>State, not decoration</span></div>
          <div className="fv-rule"><div className="fv-rule-index">Rule 01</div><div className="fv-rule-copy">Orange marks the active, the focused and the copied. Nothing else.</div></div>
          <div className="fv-rule"><div className="fv-rule-index">Rule 02</div><div className="fv-rule-copy">Never decorative orange. Never orange fills behind text blocks. Never orange body text. Greyscale carries all hierarchy.</div></div>
          <div className="fv-exhibits">
            <div className="fv-exhibit"><div className="fv-exhibit-meta"><span>Do</span><span className="fv-status-good">Correct</span></div><div className="fv-demo"><div className="fv-correct-row"><i className="fv-state-mark" /><span>API key copied</span><span>Copied</span></div></div></div>
            <div className="fv-exhibit"><div className="fv-exhibit-meta"><span>Don't</span><span className="fv-status-bad">Wrong</span></div><div className="fv-demo"><div className="fv-wrong-block"><span>API key copied</span><span>COPIED</span></div></div></div>
          </div>
        </section>

        <section className="fv-section">
          <div className="fv-section-head"><strong>02 / Type</strong><span>Single display exception</span></div>
          <div className="fv-rule"><div className="fv-rule-index">Gladiator</div><div className="fv-rule-copy">Wordmark and display only. Never below roughly 28px. Never UI labels. Never body.</div></div>
          <div className="fv-rule"><div className="fv-rule-index">JetBrains Mono</div><div className="fv-rule-copy">Everywhere else. <b>400</b> body. <b>500</b> uppercase tracked labels. <b>700</b> headings.</div></div>
          <div className="fv-exhibits">
            <div className="fv-exhibit"><div className="fv-exhibit-meta"><span>Display threshold</span><span>28px minimum</span></div><div className="fv-demo"><div className="fv-wordmark" style={{ margin: "8px 0 0", fontSize: "29px" }}>Francis Valente</div></div></div>
            <div className="fv-exhibit"><div className="fv-exhibit-meta"><span>Misuse</span><span className="fv-status-bad">Wrong</span></div><div className="fv-type-misuse">Payment service unavailable. Try again shortly.</div></div>
          </div>
        </section>

        <section className="fv-section">
          <div className="fv-section-head"><strong>03 / Voice</strong><span>Interface copy</span></div>
          <div className="fv-rule"><div className="fv-rule-index">Tone</div><div className="fv-rule-copy">Clinical. Imperative. Factual. Uppercase micro labels.</div></div>
          <div className="fv-rule"><div className="fv-rule-index">Omit</div><div className="fv-rule-copy">No welcome copy. No explainer copy. The interface is the explanation. Empty sections are removed, never explained.</div></div>
          <div className="fv-rule"><div className="fv-rule-index">Errors</div><div className="fv-rule-copy">State the fact, then the action. Never use em dashes.</div></div>
          <div className="fv-copy-grid">
            <div className="fv-copy-cell"><span className="fv-copy-label">Action</span><span className="fv-copy-value">COPY / <span className="fv-accent-text">COPIED.</span></span></div>
            <div className="fv-copy-cell"><span className="fv-copy-label">Payment state</span><span className="fv-copy-value">PAY A$12.34. <span className="fv-accent-text">PAID.</span></span></div>
            <div className="fv-copy-cell"><span className="fv-copy-label">Error</span><span className="fv-copy-value">Payment service unavailable. Try again shortly.</span></div>
            <div className="fv-copy-cell"><span className="fv-copy-label">Constraint</span><span className="fv-copy-value">Minimum A$1.00, maximum A$10,000.00.</span></div>
          </div>
        </section>

        <section className="fv-section">
          <div className="fv-section-head"><strong>04 / Access</strong><span>Measured constraints</span></div>
          <div className="fv-access">
            <div className="fv-access-label">Contrast / Ink</div>
            <div className="fv-access-content">
              <div className="fv-ratio"><span>Text #e6e6e6 on ink</span><span>15.86</span><span>AA</span></div>
              <div className="fv-ratio"><span>Muted #8a8a8a on ink</span><span>5.73</span><span>AA</span></div>
              <div className="fv-ratio"><span>Accent #ff5c00 on ink</span><span>6.39</span><span>AA</span></div>
            </div>
          </div>
          <div className="fv-access">
            <div className="fv-access-label">Light context</div>
            <div className="fv-access-content">
              <div className="fv-ratio"><span>Muted #8a8a8a on light</span><span>3.45</span><span>Large only</span></div>
              <div className="fv-ratio"><span>Accent #ff5c00 on light</span><span>3.10</span><span>UI only</span></div>
            </div>
          </div>
          <div className="fv-access">
            <div className="fv-access-label">Interaction</div>
            <div className="fv-access-content fv-constraints"><p>Focus: visible orange outline. Orange is the focus color by definition.</p><p>Motion: functional only. Instant state changes. Respect prefers-reduced-motion.</p><p>Touch targets: minimum 44px. Body text: 13px mono minimum at product scale; kit exhibits reproduce below scale.</p></div>
          </div>
        </section>
        <footer className="fv-footer"><span>Francisvalente.com</span><span>End / Board 04</span></footer>
      </div>
    </main>
  );
}