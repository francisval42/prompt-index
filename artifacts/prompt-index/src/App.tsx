import { useEffect, useRef, useState, useMemo } from 'react';
import { allItems, ManifestItem, SECTIONS, PROMPT_CATEGORIES, Section } from './lib/model';
import { resolveExplainerAssetUrls, splitMarkdownSegments, copyText, downloadText } from './lib/content-utils';

function formatManifestDate(dStr: string) {
  if (!dStr) return '';
  const [year, month, day] = dStr.split('-');
  if (!year || !month || !day) return dStr;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(date.getTime())) return dStr;
  const mStr = date.toLocaleString('en-US', { month: 'short' });
  return `${date.getDate()} ${mStr} ${date.getFullYear().toString().slice(-2)}`;
}

export default function App() {
  const readSection = (): Section | '' => {
    const s = new URLSearchParams(window.location.search).get('s') ?? '';
    return (SECTIONS as readonly string[]).includes(s) ? (s as Section) : '';
  };
  const readCategory = (): string => {
    const c = new URLSearchParams(window.location.search).get('c') ?? '';
    return (PROMPT_CATEGORIES as readonly string[]).includes(c) ? c : '';
  };
  const [filter, setFilter] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [section, setSection] = useState<Section | ''>(readSection);
  const [category, setCategory] = useState<string>(readCategory);
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const same = (url.searchParams.get('q') ?? '') === filter
        && (url.searchParams.get('s') ?? '') === section
        && (url.searchParams.get('c') ?? '') === category;
      if (same) return;
      if (filter) url.searchParams.set('q', filter); else url.searchParams.delete('q');
      if (section) url.searchParams.set('s', section); else url.searchParams.delete('s');
      if (category) url.searchParams.set('c', category); else url.searchParams.delete('c');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [filter, section, category]);

  useEffect(() => {
    const restoreFilter = () => {
      setFilter(new URLSearchParams(window.location.search).get('q') ?? '');
      setSection(readSection());
      setCategory(readCategory());
    };
    window.addEventListener('popstate', restoreFilter);
    return () => window.removeEventListener('popstate', restoreFilter);
  }, []);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clockTime = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Australia/Melbourne' });
  const clockDate = now.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' }).replace(/[.,]/g, '').replace(/\bSept\b/g, 'Sep');

  const term = filter.toLowerCase();
  const visibleItems = useMemo(() => {
    const matched = allItems.filter(item => {
      if (section && item.section !== section) return false;
      if (section === 'Prompts' && category && item.category !== category) return false;
      if (!term) return true;
      return item.ref.toLowerCase().includes(term) ||
             item.kind.toLowerCase().includes(term) ||
             (item.category ?? '').toLowerCase().includes(term) ||
             item.title.toLowerCase().includes(term) ||
             item.section.toLowerCase().includes(term) ||
             item.tags.toLowerCase().includes(term);
    });
    // Newest first by added date; same-day entries keep their ref order.
    return [...matched].sort((a, b) => (b.added || '').localeCompare(a.added || '') || a.ref.localeCompare(b.ref));
  }, [term, section, category]);

  const presentCategories = useMemo(
    () => PROMPT_CATEGORIES.filter(c => allItems.some(item => item.section === 'Prompts' && item.category === c)),
    [],
  );

  const chooseSection = (next: Section | '') => {
    setSection(next);
    if (next !== 'Prompts') setCategory('');
    setExpandedId(null);
  };

  useEffect(() => {
    setCursor(0);
  }, [term, section, category]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);
  
  const handleCopy = (item: ManifestItem) => {
    copyText(item.body, () => {
      setCopiedId(item.id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 1000);
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;
      const isNativeInteractive = activeTag === 'button' || activeTag === 'a';

      if (e.key === 'Escape') {
        setFilter('');
        setSection('');
        setCategory('');
        setExpandedId(null);
        inputRef.current?.blur();
        return;
      }

      if (isInputFocused) {
        if (e.key === 'Enter') inputRef.current?.blur();
        return;
      }

      if ((e.key === 'Enter' || e.key === ' ') && isNativeInteractive) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (visibleItems.length === 0) return;

      const scrollRowIntoView = (index: number) => {
        const id = visibleItems[index]?.id;
        const el = document.getElementById(`row-${id}`);
        if (!el) return;
        // Keyboard movement moves focus too, so the following Enter cannot
        // activate a previously focused row or one of its COPY controls.
        el.focus({ preventScroll: true });
        const rect = el.getBoundingClientRect();
        const headerHeight = headerRef.current?.getBoundingClientRect().bottom ?? 0;
        if (rect.top < headerHeight) {
          window.scrollBy(0, rect.top - headerHeight);
        } else if (rect.bottom > window.innerHeight) {
          window.scrollBy(0, rect.bottom - window.innerHeight);
        }
      };

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(cursor + 1, visibleItems.length - 1);
        setCursor(next);
        scrollRowIntoView(next);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.max(cursor - 1, 0);
        setCursor(next);
        scrollRowIntoView(next);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = visibleItems[cursor];
        if (item) {
          if (item.action === 'OPEN' && item.url) {
            window.location.href = item.url;
          } else {
            setExpandedId(prev => (prev === item.id ? null : item.id));
          }
        }
      } else if (e.key === 'c') {
        e.preventDefault();
        const item = visibleItems[cursor];
        if (item && item.action === 'COPY') {
          handleCopy(item);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visibleItems, cursor, copiedId]);

  return (
    <div className="manifest min-h-[100dvh] bg-[var(--color-background)] text-[var(--color-foreground)] font-mono text-[14px] max-[760px]:text-base leading-relaxed flex flex-col">
      {/* Status Line */}
      <div ref={headerRef} className="sticky top-0 z-10 bg-[var(--color-background)] border-b border-[var(--color-border)] py-4 px-[clamp(16px,4vw,40px)] grid grid-cols-[auto_minmax(0,1fr)_auto] max-[760px]:grid-cols-[auto_minmax(0,1fr)] items-baseline gap-6">
        <div className="flex items-baseline gap-3.5 flex-wrap max-[760px]:max-w-[164px] max-[760px]:gap-y-2">
          <span className="font-display font-normal text-[36px] leading-none tracking-[0.04em] text-[var(--color-foreground)]">
            {clockTime}
          </span>
          <span className="text-[11px] tracking-[0.1em] uppercase text-[var(--color-muted)]">
            {clockDate} · Melbourne
          </span>
        </div>
        <div className="flex items-baseline gap-2.5 min-w-0">
          <span className="text-[13px] text-[var(--color-muted)]">/</span>
          <input 
            ref={inputRef}
            type="text"
            aria-label="Filter manifest items"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="filter"
            autoComplete="off"
            spellCheck={false}
            className={`manifest-filter flex-1 min-w-0 max-w-[420px] bg-transparent border-0 border-b border-solid outline-none py-1 font-mono text-[14px] max-[760px]:text-base text-[var(--color-foreground)] rounded-none placeholder:text-[var(--color-muted)] ${focused ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}
          />
        </div>
        <div className="text-[11px] tracking-[0.1em] uppercase text-[var(--color-muted)] whitespace-nowrap max-[760px]:hidden">
          {visibleItems.length} of {allItems.length} items
        </div>
      </div>

      {/* Manifest */}
      <main className="py-2 px-[clamp(16px,4vw,40px)] pb-[120px] max-w-[1180px] box-border flex flex-col gap-9">
        {/* Section and category switches */}
        <nav aria-label="Sections" className="flex flex-col gap-2 pt-7">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium tracking-[0.14em] uppercase">
            {(['', ...SECTIONS] as const).map(sec => {
              const active = section === sec;
              return (
                <button
                  key={sec || 'recent'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseSection(sec)}
                  className={`manifest-action bg-transparent border-0 p-0 font-mono cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}
                >
                  {sec || 'Recent'}
                </button>
              );
            })}
          </div>
          {section === 'Prompts' && presentCategories.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] tracking-[0.14em] uppercase">
              {(['', ...presentCategories] as const).map(cat => {
                const active = category === cat;
                return (
                  <button
                    key={cat || 'all'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setCategory(cat); setExpandedId(null); }}
                    className={`manifest-action bg-transparent border-0 p-0 font-mono cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${active ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}
                  >
                    {cat || 'All'}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {visibleItems.length === 0 && (
          <div className="text-[var(--color-muted)]">0 results</div>
        )}

        {visibleItems.length > 0 && (
            <section className="flex flex-col border-t border-[var(--color-border)]">
              {visibleItems.map(item => {
                const isCursor = visibleItems[cursor]?.id === item.id;
                const isExpanded = expandedId === item.id;
                const isCopied = copiedId === item.id;
                
                const handleRowClick = () => {
                  if (item.action === 'OPEN' && item.url) {
                    window.location.href = item.url;
                  } else {
                    setExpandedId(prev => (prev === item.id ? null : item.id));
                  }
                };
                
                return (
                  <div key={item.id} className="border-b border-[var(--color-border)]">
                    <div 
                      id={`row-${item.id}`}
                      role={item.action === 'OPEN' ? 'link' : 'button'}
                      tabIndex={0}
                      aria-expanded={item.action === 'COPY' ? isExpanded : undefined}
                      aria-controls={item.action === 'COPY' ? `body-${item.id}` : undefined}
                      aria-label={item.title}
                      onFocus={e => {
                        if (e.target === e.currentTarget) setCursor(visibleItems.indexOf(item));
                      }}
                      onKeyDown={e => {
                        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRowClick();
                        }
                      }}
                      onClick={handleRowClick}
                      className={`manifest-row grid grid-cols-[52px_84px_minmax(0,2fr)_minmax(0,1fr)_84px_64px] max-[1000px]:grid-cols-[52px_84px_minmax(0,1fr)_84px_64px] max-[760px]:grid-cols-[44px_minmax(0,1fr)_auto] items-baseline py-[11px] pr-0 gap-4 cursor-pointer select-none border-l-2 ml-[-2px] pl-[14px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 ${isCursor ? 'bg-[var(--color-cursor)] border-l-[var(--color-accent)]' : 'bg-transparent border-l-transparent'}`}
                      onMouseEnter={() => setCursor(visibleItems.indexOf(item))}
                    >
                      <div className="text-[var(--color-muted)] text-[12px]">{item.ref}</div>
                      <div className="text-[var(--color-muted)] text-[11px] uppercase tracking-[0.1em] [overflow-wrap:anywhere] max-[760px]:hidden">{item.kind}</div>
                      <div className="font-medium text-[var(--color-foreground)] min-w-0 leading-[1.5] min-[760px]:max-[1000px]:line-clamp-2 [overflow-wrap:anywhere]">
                        {item.title}
                        <span className="hidden max-[760px]:block mt-1 font-normal text-[var(--color-muted)] text-[11px] uppercase tracking-[0.06em]">{formatManifestDate(item.added)}</span>
                      </div>
                      <div className="text-[var(--color-muted)] text-[12px] flex flex-wrap gap-x-3 gap-y-1 [overflow-wrap:anywhere] max-[1000px]:hidden">{item.tags.split(', ').map(tag => <span key={tag}>{tag}</span>)}</div>
                      <div className="text-[var(--color-muted)] text-[11px] uppercase tracking-[0.06em] text-right whitespace-nowrap max-[760px]:hidden">{formatManifestDate(item.added)}</div>
                      
                      <div className="flex justify-end text-[12px] tracking-[0.06em]">
                        {item.action === 'OPEN' ? (
                          <a 
                            href={item.url}
                            className="manifest-action font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] outline-none text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                            onClick={e => e.stopPropagation()}
                          >
                            OPEN
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item);
                            }}
                            className={`manifest-action font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] outline-none ${isCopied ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}
                          >
                            {isCopied ? 'COPIED' : 'COPY'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && item.action !== 'OPEN' && (
                      <div id={`body-${item.id}`} className="border-t border-[var(--color-border)] pt-[32px] pb-[36px] pr-[14px] pl-[166px] max-[760px]:pl-0">
                        <div className="max-w-[72ch] min-w-0">
                          {item.updated && item.updated !== item.added && (
                            <div className="mb-6 text-[11px] uppercase tracking-[0.06em] text-[var(--color-muted)]">Updated {formatManifestDate(item.updated)}</div>
                          )}
                          <div className="manifest-prose">
                            {splitMarkdownSegments(item.body).map((seg, idx) => {
                              if (seg.kind === 'html') {
                                return (
                                  <div 
                                    key={idx} 
                                    dangerouslySetInnerHTML={{ __html: resolveExplainerAssetUrls(seg.html) }} 
                                  />
                                );
                              }
                              return (
                                <pre key={idx} className={`bg-[#111] border border-[var(--color-border)] my-4 p-[12px_14px] text-[13px] overflow-x-auto ${seg.kind === 'table' ? 'text-muted' : 'text-foreground'}`}>
                                  <code>{seg.code}</code>
                                </pre>
                              );
                            })}
                            
                            {item.isConnect && item.filename && (
                              <div className="mt-8">
                                <button
                                  type="button"
                                  onClick={() => downloadText(item.filename!, item.body)}
                                  className="manifest-action text-[12px] tracking-[0.06em] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] outline-none text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                                >
                                  DOWNLOAD {item.filename}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
        )}

        <div className="pt-2">
          <div className="flex flex-wrap gap-6 text-[11px] tracking-[0.1em] uppercase text-[var(--color-muted)]">
            <span>j k move</span>
            <span>enter open</span>
            <span>c copy</span>
            <span>/ filter</span>
            <span>esc clear</span>
          </div>
        </div>
      </main>
    </div>
  );
}
