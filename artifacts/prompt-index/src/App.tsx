import React, { useState, useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';

import brandSkillExampleRaw from '../content/brand-skill/example.md?raw';

// Load all markdown files
const promptModules = import.meta.glob('../content/prompts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const launchReadyModules = import.meta.glob('../content/launch-ready/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const capabilityModules = import.meta.glob('../content/capabilities/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const CATEGORY_ORDER = [
  "Protocols",
  "Discovery",
  "Generation",
  "Repairs",
  "Review",
  "Builds"
];

function parsePrompt(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const fmStr = match[1];
  const body = match[2];
  
  let cleanBody = body;
  if (cleanBody.startsWith('\r\n')) {
    cleanBody = cleanBody.substring(2);
  } else if (cleanBody.startsWith('\n')) {
    cleanBody = cleanBody.substring(1);
  }

  const fm: any = {};
  fmStr.split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon > -1) {
      const key = line.substring(0, colon).trim();
      let val: any = line.substring(colon + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      } else if (val.startsWith('[') && val.endsWith(']')) {
        val = val.substring(1, val.length - 1).split(',').map((s: string) => s.trim());
      }
      fm[key] = val;
    }
  });

  return { ...fm, body: cleanBody, raw };
}

const allPrompts = Object.values(promptModules).map(parsePrompt).filter(Boolean);

const BRAND_STEPS = [
  '1. Open a Cowork chat in Claude.',
  "2. Give it a brand skill to copy the shape of. The example below works. So does Claude's built-in brand-guidelines skill.",
  "3. Connect the folder holding your logos, fonts and brand assets. If there isn't one, name your colours and fonts in the chat.",
  '4. Ask for a skill file for your own brand: colours, type, voice, rules.',
  '5. It renders a specimen. Correct it until it looks like you.',
  '6. Save the skill from the file card.',
];

const brandSkillExample = parsePrompt(brandSkillExampleRaw);

const launchReadyDocs = Object.values(launchReadyModules)
  .map(parsePrompt)
  .filter(Boolean)
  .sort((a: any, b: any) => Number(a.order) - Number(b.order));

const capabilityDocs = Object.values(capabilityModules)
  .map(parsePrompt)
  .filter(Boolean)
  .sort((a: any, b: any) => Number(a.order) - Number(b.order));

const LAUNCH_STEPS = [
  '1. Copy the build rules into replit.md before the first prompt. Other tools: CLAUDE.md, .cursor/rules, or attach the file at chat start.',
  '2. Paste the kickoff prompt. The AI confirms the rules, asks the setup questions, builds the scaffold before any feature.',
  '3. Request features with the feature template. Every feature ends on the definition of done.',
  '4. Every few features, run a checkpoint sweep: access, duplicates, secrets, schema, queries.',
  '5. Before launch, run the audit as a second user. Fix every critical.',
  '6. Rotate every key. Launch.',
];

function copyText(text: string, done: () => void) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(err => console.error("Copy failed", err));
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      done();
    } catch (error) {
      console.error("Copy failed", error);
    }
    textArea.remove();
  }
}

function PromptRow({ prompt }: { prompt: any }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (copied) return;
    copyText(prompt.body, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return (
    <div className="border-b border-border group">
      <div 
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="flex flex-col sm:flex-row sm:items-center py-3 gap-2 sm:gap-4 hover:bg-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 cursor-pointer transition-none outline-none"
      >
        <div className="text-muted w-10 shrink-0 hidden sm:block">{prompt.id}</div>
        <div className="text-foreground flex-1 font-medium flex gap-2">
          <span className="sm:hidden text-muted">{prompt.id}</span>
          {prompt.title}
        </div>
        <div className="text-muted text-sm shrink-0 sm:w-24">{prompt.type}</div>
        <div className="text-muted text-sm flex flex-wrap gap-2 shrink-0 sm:w-48">
          {(Array.isArray(prompt.platforms) ? prompt.platforms : []).map((p: string) => (
            <span key={p}>{p}</span>
          ))}
        </div>
        <button 
          onClick={handleCopy}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleCopy(e);
            }
          }}
          className={`shrink-0 self-start sm:self-auto sm:w-20 text-left sm:text-right font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground'}`}
          tabIndex={0}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      
      {expanded && (
        <div className="py-8 bg-background border-t border-border cursor-auto">
          <div 
            className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
            dangerouslySetInnerHTML={{ __html: marked.parse(prompt.body) as string }}
          />
        </div>
      )}
    </div>
  );
}

function BrandSkillPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (copied) return;
    copyText(brandSkillExampleRaw, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return (
    <div className="flex flex-col gap-10 pb-16">
      <ol className="flex flex-col gap-3">
        {BRAND_STEPS.map(step => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <section className="flex flex-col">
        <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
          <h2 className="text-xs tracking-wider text-muted font-medium">WORKED EXAMPLE: francis-valente-brand</h2>
          <button
            onClick={handleCopy}
            className={`shrink-0 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground'}`}
            tabIndex={0}
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
        <div className="py-8">
          <div
            className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
            dangerouslySetInnerHTML={{ __html: marked.parse(brandSkillExample?.body ?? '') as string }}
          />
        </div>
      </section>
    </div>
  );
}

function LaunchDocRow({ doc }: { doc: any }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (copied) return;
    copyText(doc.body, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return (
    <div className="border-b border-border group">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="flex flex-col sm:flex-row sm:items-center py-3 gap-2 sm:gap-4 hover:bg-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 cursor-pointer transition-none outline-none"
      >
        <div className="text-muted w-10 shrink-0 hidden sm:block">{doc.order}</div>
        <div className="text-foreground flex-1 font-medium flex gap-2">
          <span className="sm:hidden text-muted">{doc.order}</span>
          {doc.title}
        </div>
        <div className="text-muted text-sm shrink-0 sm:w-48">{doc.file}</div>
        <button
          onClick={handleCopy}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleCopy(e);
            }
          }}
          className={`shrink-0 self-start sm:self-auto sm:w-20 text-left sm:text-right font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground'}`}
          tabIndex={0}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {expanded && (
        <div className="py-8 bg-background border-t border-border cursor-auto">
          <div
            className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
            dangerouslySetInnerHTML={{ __html: marked.parse(doc.body) as string }}
          />
        </div>
      )}
    </div>
  );
}

function LaunchReadyPage() {
  return (
    <div className="flex flex-col gap-10 pb-16">
      <ol className="flex flex-col gap-3">
        {LAUNCH_STEPS.map(step => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <section className="flex flex-col">
        <div className="border-t border-border flex flex-col">
          {launchReadyDocs.map((doc: any) => (
            <LaunchDocRow key={doc.order} doc={doc} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CapabilityRow({ doc }: { doc: any }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (copied) return;
    copyText(doc.body, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  const num = String(doc.order).padStart(2, '0');
  const panelId = `capability-panel-${doc.order}`;

  return (
    <div className="border-b border-border group">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex flex-col sm:flex-row sm:items-center py-3 gap-2 sm:gap-4 hover:bg-[#111] cursor-pointer transition-none"
      >
        <div className="text-muted w-10 shrink-0 hidden sm:block">{num}</div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={e => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-foreground font-medium flex gap-2 sm:w-72 shrink-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none"
        >
          <span className="sm:hidden text-muted">{num}</span>
          {doc.title}
        </button>
        <div className="text-muted text-sm flex-1">{doc.summary}</div>
        <button
          type="button"
          onClick={handleCopy}
          className={`shrink-0 self-start sm:self-auto sm:w-20 text-left sm:text-right font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground'}`}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {expanded && (
        <div id={panelId} className="py-8 bg-background border-t border-border cursor-auto">
          <div
            className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
            dangerouslySetInnerHTML={{ __html: marked.parse(doc.body) as string }}
          />
        </div>
      )}
    </div>
  );
}

function CapabilitiesPage() {
  return (
    <div className="flex flex-col gap-10 pb-16">
      <section className="flex flex-col">
        <div className="border-t border-border flex flex-col">
          {capabilityDocs.map((doc: any) => (
            <CapabilityRow key={doc.order} doc={doc} />
          ))}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<'prompts' | 'brand' | 'launch' | 'capabilities'>('prompts');
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          e.preventDefault();
          inputRef.current.focus();
        }
      } else if (e.key === 'Escape') {
        setFilter('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredPrompts = useMemo(() => {
    const term = filter.toLowerCase();
    if (!term) return allPrompts;

    return allPrompts.filter(p => {
      return (
        p.id?.toLowerCase().includes(term) ||
        p.title?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.type?.toLowerCase().includes(term) ||
        (Array.isArray(p.platforms) && p.platforms.some((pl: string) => pl.toLowerCase().includes(term)))
      );
    });
  }, [filter]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    CATEGORY_ORDER.forEach(c => groups[c] = []);
    filteredPrompts.forEach(p => {
      if (groups[p.category]) {
        groups[p.category].push(p);
      } else {
        groups[p.category] = [p];
      }
    });
    // sort by id within category
    Object.values(groups).forEach(arr => arr.sort((a, b) => (a.id || '').localeCompare(b.id || '')));
    return groups;
  }, [filteredPrompts]);

  const hasResults = filteredPrompts.length > 0;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-mono text-sm sm:text-base">
      <header className="px-4 py-6 sm:px-8 border-b border-border">
        <h1 className="font-display font-normal text-3xl sm:text-4xl leading-none uppercase tracking-[.015em]">INDEX</h1>
      </header>
      
      <nav className="px-4 sm:px-8 border-b border-border flex items-end h-12 gap-2">
        <button
          type="button"
          onClick={() => setTab('prompts')}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'prompts' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Prompts
        </button>
        <button
          type="button"
          onClick={() => setTab('brand')}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'brand' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Brand skill
        </button>
        <button
          type="button"
          onClick={() => setTab('launch')}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'launch' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Launch ready
        </button>
        <button
          type="button"
          onClick={() => setTab('capabilities')}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'capabilities' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Capabilities
        </button>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-10">
        {tab === 'brand' ? (
          <BrandSkillPage />
        ) : tab === 'launch' ? (
          <LaunchReadyPage />
        ) : tab === 'capabilities' ? (
          <CapabilitiesPage />
        ) : (
          <>
            <div>
              <input 
                ref={inputRef}
                type="text"
                placeholder="Filter..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-none placeholder:text-muted"
              />
            </div>

            {!hasResults ? (
              <div className="text-muted border-t border-border pt-4">0 results</div>
            ) : (
              <div className="flex flex-col gap-12 pb-16">
                {CATEGORY_ORDER.map(cat => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;
                  return (
                    <section key={cat} className="flex flex-col">
                      <h2 className="text-xs uppercase tracking-wider text-muted mb-2 font-medium">{cat}</h2>
                      <div className="border-t border-border flex flex-col">
                        {items.map(p => (
                          <PromptRow key={p.id} prompt={p} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
