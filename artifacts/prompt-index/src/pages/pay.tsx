import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Appearance, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { createPayIntent, getPayConfig } from '@workspace/api-client-react';

const MIN_CENTS = 100;
const MAX_CENTS = 1_000_000;

// Coffee mode (/pay?coffee): a count stepper at a fixed price instead of free-text amount and reference.
const COFFEE_CENTS = 500;
const COFFEE_MIN = 1;
const COFFEE_MAX = 50;

function parseAmountToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/^a?\$/i, '').replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

function formatAud(cents: number): string {
  return `A$${(cents / 100).toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const msg = (data as { error?: unknown }).error;
      if (typeof msg === 'string' && msg) return msg;
    }
  }
  return fallback;
}

// Mirrors the site palette inside Stripe's iframe.
const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#ff5c00',
    colorBackground: '#0a0a0a',
    colorText: '#e6e6e6',
    colorTextSecondary: '#8a8a8a',
    colorTextPlaceholder: '#8a8a8a',
    colorDanger: '#ff5c00',
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    fontSizeBase: '14px',
    borderRadius: '0px',
    focusOutline: '2px solid #ff5c00',
    focusBoxShadow: 'none',
  },
  rules: {
    '.Input': {
      border: '1px solid #1f1f1f',
      backgroundColor: '#0a0a0a',
      boxShadow: 'none',
    },
    '.Label': {
      color: '#8a8a8a',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
};

function appearanceForViewport(): Appearance {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches) {
    return { ...appearance, variables: { ...appearance.variables, fontSizeBase: '16px' } };
  }
  return appearance;
}

const labelClass = 'text-xs uppercase tracking-wider text-muted font-medium';
const inputClass =
  'w-full bg-transparent border border-border px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-none placeholder:text-muted';
const buttonClass =
  'border border-border px-6 py-3 font-bold text-foreground hover:bg-[#111] active:bg-[#111] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none transition-none disabled:text-muted disabled:hover:bg-transparent disabled:cursor-not-allowed';
const textButtonClass =
  'font-bold text-muted hover:text-foreground active:text-foreground py-3 -my-3 px-3 -mx-3 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none transition-none disabled:cursor-not-allowed';

type FinalStatus = 'succeeded' | 'processing';

function CheckoutForm({
  amountCents,
  onDone,
  onBack,
}: {
  amountCents: number;
  onDone: (status: FinalStatus) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements || confirming) return;
    setConfirming(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message ?? 'Payment failed. Try again.');
        return;
      }

      const status = result.paymentIntent?.status;
      if (status === 'succeeded' || status === 'processing') {
        onDone(status);
      } else {
        setError(`Payment not completed (status: ${status ?? 'unknown'}). Try again.`);
      }
    } catch {
      setError('Network problem while confirming. Check your connection and try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!ready && <div className="text-muted">Loading payment form...</div>}
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          defaultValues: { billingDetails: { address: { country: "AU" } } },
        }}
      />
      {error && <div className="text-accent">{error}</div>}
      {ready && (
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handlePay}
            disabled={!stripe || confirming}
            className={buttonClass}
          >
            {confirming ? 'PROCESSING...' : `PAY ${formatAud(amountCents)}`}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={confirming}
            className={textButtonClass}
          >
            BACK
          </button>
        </div>
      )}
    </div>
  );
}

export default function PayPage() {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeAppearance] = useState(appearanceForViewport);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configNonce, setConfigNonce] = useState(0);

  const [phase, setPhase] = useState<'input' | 'element' | 'done'>('input');
  const [coffeeMode] = useState(() => new URLSearchParams(window.location.search).has('coffee'));
  const [coffees, setCoffees] = useState(1);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [inputError, setInputError] = useState<{ field: 'amount' | 'reference' | 'form'; message: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [submittedReference, setSubmittedReference] = useState('');
  const [finalStatus, setFinalStatus] = useState<FinalStatus>('succeeded');

  useEffect(() => {
    let cancelled = false;
    setConfigError(null);
    getPayConfig()
      .then((cfg) => {
        if (!cancelled) setStripePromise(loadStripe(cfg.publishableKey));
      })
      .catch(() => {
        if (!cancelled) setConfigError('Could not load payment configuration.');
      });
    return () => {
      cancelled = true;
    };
  }, [configNonce]);

  const handleContinue = async () => {
    if (creating) return;
    const cents = coffeeMode ? coffees * COFFEE_CENTS : parseAmountToCents(amount);
    if (cents == null || cents < MIN_CENTS || cents > MAX_CENTS) {
      setInputError({ field: 'amount', message: 'Enter an amount between A$1.00 and A$10,000.00.' });
      return;
    }
    const ref = coffeeMode ? `Coffee x ${coffees}` : reference.trim();
    if (ref.length > 200) {
      setInputError({ field: 'reference', message: 'Reference must be 200 characters or fewer.' });
      return;
    }

    setInputError(null);
    setCreating(true);
    try {
      const res = await createPayIntent({
        amountCents: cents,
        ...(ref ? { reference: ref } : {}),
      });
      setAmountCents(cents);
      setSubmittedReference(ref);
      setClientSecret(res.clientSecret);
      setPhase('element');
    } catch (err) {
      setInputError({ field: 'form', message: extractErrorMessage(err, 'Could not start payment. Try again.') });
    } finally {
      setCreating(false);
    }
  };

  const handleBack = () => {
    setClientSecret(null);
    setPhase('input');
  };

  const handleReset = () => {
    setCoffees(1);
    setAmount('');
    setReference('');
    setSubmittedReference('');
    setClientSecret(null);
    setInputError(null);
    setPhase('input');
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-mono text-base">
      <header className="px-4 py-6 sm:px-8 border-b border-border">
        <h1 className="font-display font-normal text-3xl sm:text-4xl leading-none uppercase tracking-[.015em]">INDEX</h1>
      </header>

      <nav className="px-4 sm:px-8 border-b border-border flex items-end h-12">
        <div className="h-full flex items-center border-b-2 border-accent text-foreground font-medium px-2 -mb-[1px]">
          {coffeeMode ? 'Coffee' : 'Pay'}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
        <div className="max-w-md flex flex-col gap-10 pb-16">
          {phase === 'input' && coffeeMode && (
            <section className="flex flex-col gap-6">
              <p className="text-muted">
                Buy Francis a coffee. Processed by Stripe in AUD.
              </p>

              <div className="flex flex-col gap-2">
                <div className={labelClass}>Coffees</div>
                <div className="flex items-center gap-6">
                  <div className="flex items-stretch border border-border">
                    <button
                      type="button"
                      aria-label="One less coffee"
                      onClick={() => setCoffees((n) => Math.max(COFFEE_MIN, n - 1))}
                      disabled={coffees <= COFFEE_MIN}
                      className="px-4 py-3 font-bold text-muted hover:text-foreground disabled:text-border touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none transition-none"
                    >
                      -
                    </button>
                    <div aria-live="polite" className="min-w-[3ch] flex items-center justify-center text-foreground font-bold tabular-nums">
                      {coffees}
                    </div>
                    <button
                      type="button"
                      aria-label="One more coffee"
                      onClick={() => setCoffees((n) => Math.min(COFFEE_MAX, n + 1))}
                      disabled={coffees >= COFFEE_MAX}
                      className="px-4 py-3 font-bold text-muted hover:text-foreground disabled:text-border touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none transition-none"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xl font-bold tabular-nums">{formatAud(coffees * COFFEE_CENTS)}</div>
                </div>
                <div className="text-xs text-muted">{formatAud(COFFEE_CENTS)} a coffee.</div>
                {inputError?.field === 'amount' && (
                  <div className="text-accent">{inputError.message}</div>
                )}
              </div>

              {inputError?.field === 'form' && <div className="text-accent">{inputError.message}</div>}
              {configError && (
                <div className="text-accent">
                  {configError}{' '}
                  <button
                    type="button"
                    onClick={() => setConfigNonce((n) => n + 1)}
                    className="underline font-bold p-2 -m-2 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none"
                  >
                    RETRY
                  </button>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => void handleContinue()}
                  disabled={creating || !!configError || !stripePromise}
                  className={buttonClass}
                >
                  {creating
                    ? 'STARTING...'
                    : !stripePromise && !configError
                      ? 'LOADING...'
                      : 'CONTINUE'}
                </button>
              </div>
            </section>
          )}

          {phase === 'input' && !coffeeMode && (
            <section className="flex flex-col gap-6">
              <p className="text-muted">
                Make a payment to Francis Valente. Processed by Stripe in AUD.
              </p>

              <div className="flex flex-col gap-2">
                <label htmlFor="pay-amount" className={labelClass}>
                  Amount (AUD)
                </label>
                <div className="flex items-stretch border border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-none">
                  <span className="flex items-center pl-4 text-muted select-none">
                    A$
                  </span>
                  <input
                    id="pay-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    enterKeyHint="go"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (inputError?.field === 'amount') setInputError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleContinue();
                    }}
                    className="flex-1 bg-transparent px-2 py-3 pr-4 text-foreground outline-none placeholder:text-muted"
                  />
                </div>
                <div className="text-xs text-muted">
                  Minimum A$1.00, maximum A$10,000.00.
                </div>
                {inputError?.field === 'amount' && (
                  <div className="text-accent">{inputError.message}</div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="pay-reference" className={labelClass}>
                  Reference <span className="normal-case tracking-normal">· optional</span>
                </label>
                <input
                  id="pay-reference"
                  type="text"
                  autoComplete="off"
                  enterKeyHint="go"
                  maxLength={200}
                  placeholder="Invoice number, name, note..."
                  value={reference}
                  onChange={(e) => {
                    setReference(e.target.value);
                    if (inputError?.field === 'reference') setInputError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleContinue();
                  }}
                  className={inputClass}
                />
                {inputError?.field === 'reference' && (
                  <div className="text-accent">{inputError.message}</div>
                )}
              </div>

              {inputError?.field === 'form' && <div className="text-accent">{inputError.message}</div>}
              {configError && (
                <div className="text-accent">
                  {configError}{' '}
                  <button
                    type="button"
                    onClick={() => setConfigNonce((n) => n + 1)}
                    className="underline font-bold p-2 -m-2 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none"
                  >
                    RETRY
                  </button>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => void handleContinue()}
                  disabled={creating || !!configError || !stripePromise}
                  className={buttonClass}
                >
                  {creating
                    ? 'STARTING...'
                    : !stripePromise && !configError
                      ? 'LOADING...'
                      : 'CONTINUE'}
                </button>
              </div>
            </section>
          )}

          {phase === 'element' && clientSecret && stripePromise && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 border-b border-border pb-4">
                <div className={labelClass}>Paying</div>
                <div className="text-xl font-bold">{formatAud(amountCents)}</div>
                {submittedReference && (
                  <div className="text-muted break-words">
                    Ref: {submittedReference}
                  </div>
                )}
              </div>
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{ clientSecret, appearance: stripeAppearance }}
              >
                <CheckoutForm
                  amountCents={amountCents}
                  onDone={(status) => {
                    setFinalStatus(status);
                    setPhase('done');
                  }}
                  onBack={handleBack}
                />
              </Elements>
            </section>
          )}

          {phase === 'done' && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="text-accent font-bold text-xl uppercase tracking-wide">
                  {finalStatus === 'succeeded' ? 'Paid' : 'Processing'}
                </div>
                <div className="text-2xl font-bold">{formatAud(amountCents)}</div>
                {submittedReference && (
                  <div className="text-muted break-words">
                    Ref: {submittedReference}
                  </div>
                )}
              </div>
              <p className="text-muted">
                {finalStatus === 'succeeded'
                  ? 'Payment received.'
                  : 'Payment is processing and will be confirmed shortly.'}
              </p>
              <div>
                <button type="button" onClick={handleReset} className={buttonClass}>
                  {coffeeMode ? 'ANOTHER COFFEE' : 'NEW PAYMENT'}
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
