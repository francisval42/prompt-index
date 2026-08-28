import { useCallback, useEffect, useState } from 'react';
import {
  addSubscriber,
  adminLogin,
  getAdminSession,
  getNewsletterDomainStatus,
  listIssues,
  listSubscribers,
  removeSubscriber,
  sendIssue,
  sendTestIssue,
} from '@workspace/api-client-react';
import type {
  Issue,
  SendResult,
  SendingDomainStatus,
  Subscriber,
} from '@workspace/api-client-react';

const labelClass = 'text-xs uppercase tracking-wider text-muted font-medium';
const inputClass =
  'w-full bg-transparent border border-border px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-none placeholder:text-muted';
const buttonClass =
  'border border-border px-6 py-3 font-bold text-foreground hover:bg-[#111] active:bg-[#111] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none transition-none disabled:text-muted disabled:hover:bg-transparent disabled:cursor-not-allowed';
const textButtonClass =
  'font-bold text-muted hover:text-foreground active:text-foreground py-3 -my-3 px-3 -mx-3 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none transition-none disabled:cursor-not-allowed';

function errorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status;
    if (typeof s === 'number') return s;
  }
  return undefined;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const msg = (data as { error?: unknown }).error;
      if (typeof msg === 'string' && msg) return msg;
    }
  }
  return fallback;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function CopyButton({ value }: { value: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 1600);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={
        state === 'copied'
          ? 'font-bold text-accent py-3 -my-3 px-3 -mx-3 touch-manipulation outline-none'
          : textButtonClass
      }
    >
      {state === 'idle' ? 'COPY' : state === 'copied' ? 'COPIED' : 'FAILED'}
    </button>
  );
}

type Phase = 'checking' | 'login' | 'admin';

export default function AdminPage() {
  const [phase, setPhase] = useState<Phase>('checking');

  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [domain, setDomain] = useState<SendingDomainStatus | null>(null);
  const [domainBusy, setDomainBusy] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  const [subs, setSubs] = useState<Subscriber[] | null>(null);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [addFirstName, setAddFirstName] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [removeBusyId, setRemoveBusyId] = useState<number | null>(null);

  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testBusy, setTestBusy] = useState(false);
  const [testNotice, setTestNotice] = useState<
    { kind: 'ok' | 'error'; message: string } | null
  >(null);
  const [sendPhase, setSendPhase] = useState<
    'idle' | 'confirm' | 'duplicate' | 'sending'
  >('idle');
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  const backToLogin = useCallback((message: string | null) => {
    setPhase('login');
    setPassword('');
    setLoginError(message);
    setDomain(null);
    setSubs(null);
    setIssues(null);
  }, []);

  const guard = useCallback(
    (err: unknown): boolean => {
      if (errorStatus(err) === 401) {
        backToLogin('Session expired. Enter the password again.');
        return true;
      }
      return false;
    },
    [backToLogin],
  );

  const refreshDomain = useCallback(async () => {
    setDomainBusy(true);
    setDomainError(null);
    try {
      setDomain(await getNewsletterDomainStatus());
    } catch (err) {
      if (!guard(err)) {
        setDomainError(errorMessage(err, 'Could not reach Resend.'));
      }
    } finally {
      setDomainBusy(false);
    }
  }, [guard]);

  const refreshSubscribers = useCallback(async () => {
    setSubsError(null);
    try {
      setSubs(await listSubscribers());
    } catch (err) {
      if (!guard(err)) {
        setSubsError(errorMessage(err, 'Could not load subscribers.'));
      }
    }
  }, [guard]);

  const refreshIssues = useCallback(async () => {
    setIssuesError(null);
    try {
      setIssues(await listIssues());
    } catch (err) {
      if (!guard(err)) {
        setIssuesError(errorMessage(err, 'Could not load sent issues.'));
      }
    }
  }, [guard]);

  const enterAdmin = useCallback(() => {
    setPhase('admin');
    void refreshDomain();
    void refreshSubscribers();
    void refreshIssues();
  }, [refreshDomain, refreshSubscribers, refreshIssues]);

  useEffect(() => {
    let cancelled = false;
    getAdminSession()
      .then((s) => {
        if (cancelled) return;
        if (s.authenticated) {
          enterAdmin();
        } else {
          setPhase('login');
        }
      })
      .catch(() => {
        if (!cancelled) setPhase('login');
      });
    return () => {
      cancelled = true;
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    if (loginBusy || !password) return;
    setLoginBusy(true);
    setLoginError(null);
    try {
      await adminLogin({ password });
      setPassword('');
      enterAdmin();
    } catch (err) {
      setLoginError(errorMessage(err, 'Login failed. Try again.'));
    } finally {
      setLoginBusy(false);
    }
  };

  const handleAdd = async () => {
    const email = addEmail.trim();
    if (addBusy || !email) return;
    setAddBusy(true);
    setAddError(null);
    try {
      await addSubscriber({ email, firstName: addFirstName.trim() });
      setAddEmail('');
      setAddFirstName('');
      await refreshSubscribers();
    } catch (err) {
      if (!guard(err)) {
        setAddError(errorMessage(err, 'Could not add subscriber.'));
      }
    } finally {
      setAddBusy(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (removeBusyId !== null) return;
    setRemoveBusyId(id);
    try {
      await removeSubscriber(id);
      setConfirmRemoveId(null);
      await refreshSubscribers();
    } catch (err) {
      if (!guard(err)) {
        setSubsError(errorMessage(err, 'Could not remove subscriber.'));
      }
    } finally {
      setRemoveBusyId(null);
    }
  };

  const handleTest = async () => {
    if (testBusy || !subject.trim() || !body.trim()) return;
    setTestBusy(true);
    setTestNotice(null);
    try {
      await sendTestIssue({ subject, body });
      setTestNotice({ kind: 'ok', message: 'TEST SENT TO FRANCIS@VGFS.COM.AU' });
    } catch (err) {
      if (!guard(err)) {
        setTestNotice({
          kind: 'error',
          message: errorMessage(err, 'Test send failed.'),
        });
      }
    } finally {
      setTestBusy(false);
    }
  };

  const doSend = async (confirmDuplicate: boolean) => {
    setSendPhase('sending');
    setSendError(null);
    setSendResult(null);
    try {
      const result = await sendIssue({
        subject,
        body,
        ...(confirmDuplicate ? { confirmDuplicate: true } : {}),
      });
      setSendResult(result);
      setSendPhase('idle');
      setSubject('');
      setBody('');
      setTestNotice(null);
      void refreshIssues();
    } catch (err) {
      if (guard(err)) return;
      if (errorStatus(err) === 409) {
        setDuplicateMessage(
          errorMessage(err, 'This exact issue was already sent.'),
        );
        setSendPhase('duplicate');
        return;
      }
      setSendError(errorMessage(err, 'Send failed.'));
      setSendPhase('idle');
    }
  };

  const activeCount = subs?.filter((s) => s.status === 'active').length ?? 0;
  const draftReady = Boolean(subject.trim() && body.trim());

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-mono text-base">
      <header className="px-4 py-6 sm:px-8 border-b border-border">
        <h1 className="font-display font-normal text-3xl sm:text-4xl leading-none uppercase tracking-[.015em]">INDEX</h1>
      </header>

      <nav className="px-4 sm:px-8 border-b border-border flex items-end h-12">
        <div className="h-full flex items-center border-b-2 border-accent text-foreground font-medium px-2 -mb-[1px]">
          Newsletter admin
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
        {phase === 'checking' && <div className="text-muted">Checking session...</div>}

        {phase === 'login' && (
          <form
            className="max-w-md flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              void handleLogin();
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="admin-password" className={labelClass}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                enterKeyHint="go"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(null);
                }}
                className={inputClass}
              />
            </div>
            {loginError && <div className="text-accent">{loginError}</div>}
            <div>
              <button
                type="submit"
                disabled={loginBusy || !password}
                className={buttonClass}
              >
                {loginBusy ? 'CHECKING...' : 'ENTER'}
              </button>
            </div>
          </form>
        )}

        {phase === 'admin' && (
          <div className="max-w-3xl flex flex-col gap-10 pb-16">
            <section className="flex flex-col gap-4 border-b border-border pb-10">
              <div className={labelClass}>Sending domain</div>
              {domainBusy && !domain && (
                <div className="text-muted">Checking navaro.com.au with Resend...</div>
              )}
              {domainError && (
                <div className="text-accent">
                  {domainError}{' '}
                  <button
                    type="button"
                    onClick={() => void refreshDomain()}
                    className="underline font-bold p-2 -m-2 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none"
                  >
                    RETRY
                  </button>
                </div>
              )}
              {domain && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                    <span className="font-bold">{domain.domain}</span>
                    <span
                      className={
                        domain.verified ? 'text-accent font-bold' : 'text-muted'
                      }
                    >
                      {domain.status.toUpperCase().replace(/_/g, ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => void refreshDomain()}
                      disabled={domainBusy}
                      className={textButtonClass}
                    >
                      {domainBusy ? 'CHECKING...' : 'REFRESH'}
                    </button>
                  </div>
                  {!domain.found && (
                    <p className="text-muted">
                      navaro.com.au is not registered in this Resend account. Add it
                      under Domains in Resend, then refresh.
                    </p>
                  )}
                  {domain.found && !domain.verified && domain.records.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <p className="text-muted">
                        Add these DNS records in Cloudflare for navaro.com.au, then
                        refresh.
                      </p>
                      <div className="flex flex-col">
                        {domain.records.map((r, i) => (
                          <div
                            key={`${r.type}-${r.name}-${i}`}
                            className="border-t border-border py-4 flex flex-col gap-2"
                          >
                            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                              <span className="font-bold">{r.type}</span>
                              {r.record && (
                                <span className="text-muted text-xs uppercase tracking-wider">
                                  {r.record}
                                </span>
                              )}
                              {r.status && (
                                <span
                                  className={
                                    r.status === 'verified'
                                      ? 'text-accent text-xs uppercase tracking-wider font-bold'
                                      : 'text-muted text-xs uppercase tracking-wider'
                                  }
                                >
                                  {r.status.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                              <div className="min-w-0">
                                <div className={labelClass}>Name</div>
                                <div className="break-all">{r.name}</div>
                              </div>
                              <CopyButton value={r.name} />
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                              <div className="min-w-0">
                                <div className={labelClass}>Value</div>
                                <div className="break-all">{r.value}</div>
                              </div>
                              <CopyButton value={r.value} />
                            </div>
                            {(r.ttl || r.priority != null) && (
                              <div className="text-muted text-sm">
                                {r.ttl ? `TTL ${r.ttl}` : ''}
                                {r.ttl && r.priority != null ? ' · ' : ''}
                                {r.priority != null ? `Priority ${r.priority}` : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 border-b border-border pb-10">
              <div className={labelClass}>Subscribers</div>
              {subs && (
                <div className="text-muted">
                  {activeCount} active · {subs.length} total
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  placeholder="email@example.com"
                  value={addEmail}
                  onChange={(e) => {
                    setAddEmail(e.target.value);
                    setAddError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleAdd();
                  }}
                  className={inputClass}
                />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="First name (optional)"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleAdd();
                  }}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => void handleAdd()}
                  disabled={addBusy || !addEmail.trim()}
                  className={buttonClass}
                >
                  {addBusy ? 'ADDING...' : 'ADD'}
                </button>
              </div>
              {addError && <div className="text-accent">{addError}</div>}
              {subsError && <div className="text-accent">{subsError}</div>}
              {subs && subs.length === 0 && (
                <div className="text-muted">No subscribers yet.</div>
              )}
              {subs && subs.length > 0 && (
                <div className="flex flex-col">
                  {subs.map((s) => (
                    <div
                      key={s.id}
                      className="border-t border-border py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1"
                    >
                      <span className="font-bold break-all">{s.email}</span>
                      {s.firstName && <span className="text-muted">{s.firstName}</span>}
                      {s.status === 'unsubscribed' && (
                        <span className="text-muted text-xs uppercase tracking-wider">
                          Unsubscribed
                        </span>
                      )}
                      <span className="text-muted text-sm">{formatDate(s.dateAdded)}</span>
                      <span className="ml-auto">
                        {confirmRemoveId === s.id ? (
                          <button
                            type="button"
                            onClick={() => void handleRemove(s.id)}
                            disabled={removeBusyId !== null}
                            className="font-bold text-accent py-3 -my-3 px-3 -mx-3 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none"
                          >
                            {removeBusyId === s.id ? 'REMOVING...' : 'SURE?'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(s.id)}
                            disabled={removeBusyId !== null}
                            className={textButtonClass}
                          >
                            REMOVE
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 border-b border-border pb-10">
              <div className={labelClass}>New issue</div>
              <div className="flex flex-col gap-2">
                <label htmlFor="issue-subject" className={labelClass}>
                  Subject
                </label>
                <input
                  id="issue-subject"
                  type="text"
                  autoComplete="off"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="issue-body" className={labelClass}>
                  Body
                </label>
                <textarea
                  id="issue-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Markdown or simple HTML."
                  className={`${inputClass} min-h-[16rem] resize-y leading-relaxed`}
                />
              </div>

              {testNotice && (
                <div className={testNotice.kind === 'ok' ? 'text-accent font-bold' : 'text-accent'}>
                  {testNotice.message}
                </div>
              )}
              {sendError && <div className="text-accent">{sendError}</div>}
              {sendResult && (
                <div className="flex flex-col gap-1">
                  <div className="text-accent font-bold">
                    SENT TO {sendResult.sent} SUBSCRIBER{sendResult.sent === 1 ? '' : 'S'}
                  </div>
                  {sendResult.errors.map((e) => (
                    <div key={e.email} className="text-accent break-words">
                      {e.email}: {e.error}
                    </div>
                  ))}
                </div>
              )}

              {sendPhase === 'idle' && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <button
                    type="button"
                    onClick={() => void handleTest()}
                    disabled={testBusy || !draftReady}
                    className={buttonClass}
                  >
                    {testBusy ? 'SENDING TEST...' : 'SEND TEST TO ME'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSendError(null);
                      setSendResult(null);
                      setSendPhase('confirm');
                    }}
                    disabled={!draftReady || activeCount === 0}
                    className={buttonClass}
                  >
                    SEND TO {activeCount} ACTIVE
                  </button>
                </div>
              )}
              {sendPhase === 'confirm' && (
                <div className="flex flex-col gap-4">
                  <div className="font-bold">
                    Send this issue to {activeCount} active subscriber
                    {activeCount === 1 ? '' : 's'}?
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <button
                      type="button"
                      onClick={() => void doSend(false)}
                      className={buttonClass}
                    >
                      CONFIRM SEND
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendPhase('idle')}
                      className={textButtonClass}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
              {sendPhase === 'duplicate' && (
                <div className="flex flex-col gap-4">
                  <div className="text-accent">{duplicateMessage}</div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <button
                      type="button"
                      onClick={() => void doSend(true)}
                      className={buttonClass}
                    >
                      SEND ANYWAY (DUPLICATE)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendPhase('idle')}
                      className={textButtonClass}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
              {sendPhase === 'sending' && (
                <div className="text-muted">
                  Sending to {activeCount} subscriber{activeCount === 1 ? '' : 's'}...
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <div className={labelClass}>Sent issues</div>
              {issuesError && <div className="text-accent">{issuesError}</div>}
              {issues && issues.length === 0 && (
                <div className="text-muted">None sent yet.</div>
              )}
              {issues && issues.length > 0 && (
                <div className="flex flex-col">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="border-t border-border py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1"
                    >
                      <span className="text-muted text-sm">{formatDate(issue.sentAt)}</span>
                      <span className="font-bold break-words">{issue.subject}</span>
                      <span className="text-muted text-sm ml-auto">
                        {issue.recipientCount} sent
                        {issue.failedCount > 0 ? ` · ${issue.failedCount} failed` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
