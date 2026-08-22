import './_group.css';

const prompts = [
  ['WRITING', 'Turn a raw interview transcript into a concise first-person profile.'],
  ['RESEARCH', 'Find the source of this claim and note what the source actually says.'],
  ['SYSTEMS', 'Design a small operating system for weekly editorial planning.'],
];

export function BrandInAction() {
  return (
    <main className="fv-board fv-action-board">
      <style>{`
        .fv-action-board {
          --line: var(--fv-panel);
          --gutter: 42px;
          min-height: 100dvh;
          width: 100%;
          box-sizing: border-box;
          padding: 0 0 72px;
          background: #0a0a0a;
          color: #e6e6e6;
          font-family: var(--fv-font-mono);
          letter-spacing: -0.02em;
        }
        .fv-action-board *, .fv-action-board *::before, .fv-action-board *::after { box-sizing: border-box; }
        .fv-action-board button { font: inherit; }
        .fv-action-shell { width: min(1280px, 100%); margin: 0 auto; }
        .fv-action-masthead {
          min-height: 90px; padding: 26px var(--gutter) 21px; border-bottom: 1px solid var(--line);
          display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;
        }
        .fv-action-wordmark { font-family: var(--fv-font-display); font-size: 30px; line-height: .9; letter-spacing: .015em; color: #e6e6e6; }
        .fv-action-meta, .fv-action-kicker, .fv-action-caption, .fv-action-tag {
          font-size: 10px; line-height: 1.2; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
        }
        .fv-action-meta { color: #8a8a8a; white-space: nowrap; }
        .fv-action-intro {
          display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--line);
        }
        .fv-action-intro > div { min-height: 135px; padding: 24px var(--gutter); }
        .fv-action-intro > div + div { border-left: 1px solid var(--line); }
        .fv-action-kicker { color: #8a8a8a; margin-bottom: 16px; }
        .fv-action-title { margin: 0; font-family: var(--fv-font-display); font-size: clamp(35px, 4vw, 53px); line-height: .86; letter-spacing: .005em; font-weight: normal; }
        .fv-action-index { margin: 0; color: #8a8a8a; font-size: 12px; line-height: 1.55; max-width: 350px; }
        .fv-action-exhibits { padding: 0 var(--gutter); }
        .fv-action-exhibit { padding: 38px 0 0; }
        .fv-action-caption { color: #8a8a8a; padding-bottom: 11px; }
        .fv-action-frame { border: 1px solid var(--line); background: #0a0a0a; overflow: hidden; }
        .fv-product-header { padding: 23px 25px 19px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
        .fv-product-header strong { font-size: 14px; font-weight: 700; letter-spacing: .02em; }
        .fv-product-header span { color: #8a8a8a; font-size: 10px; text-transform: uppercase; letter-spacing: .13em; }
        .fv-prompt-list { padding: 0 25px; }
        .fv-prompt-row { min-height: 67px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 112px minmax(0, 1fr) 74px; align-items: center; gap: 22px; }
        .fv-prompt-row:last-child { border-bottom: 0; }
        .fv-prompt-category, .fv-prompt-status { color: #8a8a8a; font-size: 10px; font-weight: 500; letter-spacing: .13em; }
        .fv-prompt-copy { font-size: 12px; line-height: 1.45; color: #e6e6e6; }
        .fv-prompt-status { text-align: right; }
        .fv-prompt-row.is-copied .fv-prompt-status { color: #ff5c00; }
        .fv-payment { display: grid; grid-template-columns: minmax(0, 1fr) 340px; min-height: 276px; }
        .fv-payment-main { padding: 25px; }
        .fv-payment-side { padding: 25px; border-left: 1px solid var(--line); background: #1f1f1f; display: flex; flex-direction: column; justify-content: space-between; }
        .fv-field-label { display: block; color: #8a8a8a; font-size: 10px; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; margin-bottom: 9px; }
        .fv-amount-box { height: 52px; display: flex; align-items: center; border: 1px solid #ff5c00; padding: 0 14px; color: #e6e6e6; font-size: 17px; box-shadow: inset 0 0 0 1px #ff5c00; }
        .fv-prefix { color: #8a8a8a; margin-right: 9px; }
        .fv-reference { margin-top: 23px; }
        .fv-amount-input { background: transparent; border: 0; outline: 0; color: inherit; font: inherit; width: 100%; padding: 0; }
        .fv-reference-line { display: block; width: 100%; background: transparent; border: 0; border-bottom: 1px solid var(--line); height: 30px; color: #8a8a8a; font-size: 12px; font-family: inherit; letter-spacing: inherit; padding: 0; }
        .fv-pay-button { align-self: flex-start; border: 1px solid #e6e6e6; color: #e6e6e6; background: transparent; padding: 12px 18px; min-height: 44px; font-size: 11px; font-weight: 700; letter-spacing: .07em; cursor: pointer; }
        .fv-pay-button:focus-visible, .fv-reference-line:focus-visible { outline: 1px solid #ff5c00; outline-offset: 2px; }
        .fv-payment-note { color: #8a8a8a; font-size: 10px; line-height: 1.55; }
        .fv-paid { border-top: 1px solid var(--line); padding-top: 17px; }
        .fv-paid-mark { display: flex; align-items: center; gap: 8px; color: #ff5c00; font-size: 11px; font-weight: 700; letter-spacing: .11em; }
        .fv-paid-mark::before { content: ''; width: 7px; height: 7px; background: #ff5c00; display: block; }
        .fv-paid-amount { font-size: 19px; font-weight: 700; margin-top: 8px; }
        .fv-social-frame { padding: 26px; background: #1f1f1f; }
        .fv-social-card { width: min(100%, 790px); aspect-ratio: 1200 / 630; margin: 0 auto; background: #0a0a0a; border: 1px solid #0a0a0a; padding: 35px 38px; display: flex; flex-direction: column; justify-content: space-between; }
        .fv-social-top { display: flex; justify-content: space-between; align-items: flex-start; color: #8a8a8a; font-size: 10px; letter-spacing: .13em; }
        .fv-social-wordmark { font-family: var(--fv-font-display); color: #e6e6e6; font-size: clamp(38px, 6vw, 75px); line-height: .82; letter-spacing: .012em; font-weight: normal; }
        .fv-social-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
        .fv-social-domain { color: #e6e6e6; font-size: 11px; letter-spacing: .05em; }
        .fv-social-rule { height: 2px; width: 78px; background: #ff5c00; }
        .fv-chrome { background: #1f1f1f; padding: 18px 22px 0; }
        .fv-chrome-window { border: 1px solid #323232; border-bottom: 0; }
        .fv-tabs { height: 41px; border-bottom: 1px solid #323232; display: flex; align-items: flex-end; padding-left: 10px; }
        .fv-tab { height: 31px; width: 250px; background: #0a0a0a; border: 1px solid #323232; border-bottom: 0; display: flex; align-items: center; gap: 9px; padding: 0 10px; color: #e6e6e6; font-size: 10px; }
        .fv-favicon { width: 16px; height: 16px; background: #e6e6e6; color: #0a0a0a; display: grid; place-items: center; font-size: 8px; font-weight: 700; line-height: 1; letter-spacing: -.12em; flex: 0 0 auto; }
        .fv-tab-domain { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fv-address { height: 48px; display: flex; align-items: center; padding: 0 16px; gap: 10px; background: #0a0a0a; color: #8a8a8a; font-size: 10px; }
        .fv-address-dot { width: 6px; height: 6px; border: 1px solid #8a8a8a; border-radius: 50%; }
        .fv-footer { display: flex; justify-content: space-between; padding: 32px var(--gutter) 0; color: #8a8a8a; font-size: 10px; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; }
        @media (max-width: 700px) {
          .fv-action-board { --gutter: 18px; }
          .fv-action-masthead { min-height: 77px; padding-top: 21px; }
          .fv-action-wordmark { font-size: 24px; }
          .fv-action-meta { display: none; }
          .fv-action-intro { grid-template-columns: 1fr; }
          .fv-action-intro > div { min-height: 0; padding-top: 20px; padding-bottom: 20px; }
          .fv-action-intro > div + div { border-left: 0; border-top: 1px solid var(--line); }
          .fv-action-exhibit { padding-top: 28px; }
          .fv-prompt-list { padding: 0 16px; }
          .fv-prompt-row { grid-template-columns: 1fr; gap: 5px; padding: 14px 0; }
          .fv-prompt-status { text-align: left; }
          .fv-payment { grid-template-columns: 1fr; }
          .fv-payment-side { min-height: 205px; border-left: 0; border-top: 1px solid var(--line); }
          .fv-social-frame { padding: 10px; }
          .fv-social-card { padding: 20px; }
          .fv-tab { width: 210px; }
          .fv-footer { padding-top: 22px; }
        }
      `}</style>
      <div className="fv-action-shell">
        <header className="fv-action-masthead">
          <div className="fv-action-wordmark">FRANCIS VALENTE</div>
          <div className="fv-action-meta">BRAND KIT / 03 / PRODUCT SURFACES</div>
        </header>

        <section className="fv-action-intro" aria-label="Board description">
          <div>
            <div className="fv-action-kicker">Board 03</div>
            <h1 className="fv-action-title">BRAND IN ACTION</h1>
          </div>
          <div>
            <div className="fv-action-kicker">Scope</div>
            <p className="fv-action-index">Prompt index. Payment. Social preview. Browser chrome.</p>
          </div>
        </section>

        <div className="fv-action-exhibits">
          <section className="fv-action-exhibit">
            <div className="fv-action-caption">01 / PROMPT INDEX / DEFAULT + COPIED</div>
            <div className="fv-action-frame">
              <div className="fv-product-header"><strong>INDEX</strong><span>37 prompts</span></div>
              <div className="fv-prompt-list">
                {prompts.map(([category, copy], index) => (
                  <div className={`fv-prompt-row ${index === 1 ? 'is-copied' : ''}`} key={category}>
                    <div className="fv-prompt-category">{category}</div>
                    <div className="fv-prompt-copy">{copy}</div>
                    <div className="fv-prompt-status">{index === 1 ? 'COPIED' : 'COPY'}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="fv-action-exhibit">
            <div className="fv-action-caption">02 / PAYMENT / FOCUS + CONFIRMATION</div>
            <div className="fv-action-frame fv-payment">
              <div className="fv-payment-main">
                <label className="fv-field-label" htmlFor="fv-demo-amount">Amount (AUD)</label>
                <div className="fv-amount-box"><span className="fv-prefix">A$</span><input id="fv-demo-amount" className="fv-amount-input" defaultValue="480.00" inputMode="decimal" /></div>
                <div className="fv-reference">
                  <label className="fv-field-label" htmlFor="fv-demo-reference">Reference / Optional</label>
                  <input id="fv-demo-reference" className="fv-reference-line" defaultValue="MAY EDITORIAL RETAINER" />
                </div>
              </div>
              <div className="fv-payment-side">
                <button className="fv-pay-button" type="button">PAY A$480.00</button>
                <div className="fv-paid">
                  <div className="fv-paid-mark">PAID</div>
                  <div className="fv-paid-amount">A$480.00</div>
                </div>
              </div>
            </div>
          </section>

          <section className="fv-action-exhibit">
            <div className="fv-action-caption">03 / SOCIAL PREVIEW / 1200 × 630</div>
            <div className="fv-action-frame fv-social-frame">
              <div className="fv-social-card">
                <div className="fv-social-top"><span>PROMPT INDEX</span><span>03</span></div>
                <div className="fv-social-wordmark">FRANCIS<br />VALENTE</div>
                <div className="fv-social-bottom"><span className="fv-social-domain">francisvalente.com</span><span className="fv-social-rule" /></div>
              </div>
            </div>
          </section>

          <section className="fv-action-exhibit">
            <div className="fv-action-caption">04 / BROWSER CHROME / MINIMUM SCALE</div>
            <div className="fv-action-frame fv-chrome">
              <div className="fv-chrome-window">
                <div className="fv-tabs"><div className="fv-tab"><span className="fv-favicon">FV</span><span className="fv-tab-domain">francisvalente.com</span></div></div>
                <div className="fv-address"><span className="fv-address-dot" /><span>francisvalente.com</span></div>
              </div>
            </div>
          </section>
        </div>
        <footer className="fv-footer"><span>FRANCIS VALENTE</span><span>END / 03</span></footer>
      </div>
    </main>
  );
}