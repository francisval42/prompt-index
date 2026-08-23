import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { marked } from 'marked';

import brandSkillExampleRaw from '../content/brand-skill/example.md?raw';

// Load all markdown files
const promptModules = import.meta.glob('../content/prompts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const launchReadyModules = import.meta.glob('../content/launch-ready/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const capabilityModules = import.meta.glob('../content/capabilities/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const connectModules = import.meta.glob('../content/connect/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

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

const connectDocs = Object.values(connectModules)
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

const CONNECT_STEPS = [
  '1. List what Claude needs to reach. Email, calendar, files, CRM, one line per service.',
  '2. Check the directory first. claude.ai: Settings > Connectors. Claude Code: /mcp. If the service is there, connect it, test it, stop.',
  '3. No connector? Confirm the service has an API and your plan includes API access. No API, no build.',
  '4. Set up API access with 1-API-ACCESS. Complete the checklist before any code exists.',
  '5. Build the server with 2-BUILD-PROMPTS. Every write sits behind confirmed=true.',
  '6. Register and test with 3-CONNECT-AND-TEST. Keep the troubleshooting card.',
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

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getHashSlug(): string {
  const raw = window.location.hash.replace(/^#/, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
function PromptRow({ prompt }: { prompt: any }) {
  const slug = String(prompt.id);
  const { rowRef, expanded, setExpanded } = useRowDeepLink(slug);
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
    <div ref={rowRef} id={slug} className="border-b border-border group scroll-mt-4">
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
  const slug = String(doc.order);
  const { rowRef, expanded, setExpanded } = useRowDeepLink(slug);
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
    <div ref={rowRef} id={slug} className="border-b border-border group scroll-mt-4">
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
  const slug = String(doc.order);
  const { rowRef, expanded, setExpanded } = useRowDeepLink(slug);
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
    <div ref={rowRef} id={slug} className="border-b border-border group scroll-mt-4">
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

function ConnectDocRow({ doc }: { doc: any }) {
  const slug = String(doc.order);
  const { rowRef, expanded, setExpanded } = useRowDeepLink(slug);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copied) return;
    copyText(doc.body, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadText(doc.file, doc.body);
  };

  const panelId = `connect-panel-${doc.order}`;

  return (
    <div ref={rowRef} id={slug} className="border-b border-border group scroll-mt-4">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex flex-col sm:flex-row sm:items-center py-3 gap-2 sm:gap-4 hover:bg-[#111] cursor-pointer transition-none"
      >
        <div className="text-muted w-10 shrink-0 hidden sm:block">{doc.order}</div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={e => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-foreground flex-1 font-medium flex gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none"
        >
          <span className="sm:hidden text-muted">{doc.order}</span>
          {doc.title}
        </button>
        <div className="text-muted text-sm shrink-0 sm:w-48">{doc.file}</div>
        <button
          type="button"
          onClick={handleDownload}
          className="shrink-0 self-start sm:self-auto sm:w-24 text-left sm:text-right font-bold text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none"
        >
          DOWNLOAD
        </button>
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

function ConnectPage() {
  return (
    <div className="flex flex-col gap-10 pb-16">
      <ol className="flex flex-col gap-3">
        {CONNECT_STEPS.map(step => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <section className="flex flex-col">
        <div className="border-t border-border flex flex-col">
          {connectDocs.map((doc: any) => (
            <ConnectDocRow key={doc.order} doc={doc} />
          ))}
        </div>
      </section>
    </div>
  );
}

type TabKey = 'prompts' | 'brand' | 'launch' | 'capabilities' | 'connect';

// Each tab has a stable URL so it can be shared and deep-linked directly.
const TAB_PATHS: Record<TabKey, string> = {
  prompts: '/',
  brand: '/brand',
  launch: '/launch',
  capabilities: '/capabilities',
  connect: '/connect',
};

const PATH_TO_TAB = new Map<string, TabKey>(
  (Object.entries(TAB_PATHS) as [TabKey, string][]).map(([key, tabPath]) => [tabPath, key]),
);

// Human-readable tab names for the document title, matching the nav labels.
const TAB_TITLES: Record<TabKey, string> = {
  prompts: 'Prompts',
  brand: 'Brand skill',
  launch: 'Launch ready',
  capabilities: 'Capabilities',
  connect: 'Connect',
};

function App() {
  const [location] = useLocation();
  // Tolerate trailing slashes ("/connect/" === "/connect"); unknown paths fall back to Prompts.
  const normalizedPath = location.replace(/\/+$/, '') || '/';
  const tab: TabKey = PATH_TO_TAB.get(normalizedPath) ?? 'prompts';
  // Clicking the already-active tab is a no-op so it doesn't stack duplicate history entries.
  const skipIfActive = (key: TabKey) => (e: React.MouseEvent) => {
    if (tab === key) e.preventDefault();
  };
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Set a distinct title per tab so history entries, bookmarks, and shared
  // links are distinguishable. Runs on load and on every tab switch.
  useEffect(() => {
    document.title = `Index — ${TAB_TITLES[tab]}`;
  }, [tab]);

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
      
      {/*
        Tabs are real anchors (wouter Link) so browser link affordances work:
        cmd/ctrl+click and middle-click open in a new browser tab, right-click
        offers "Copy Link Address". Plain left-click stays a client-side
        navigation (wouter prevents the default and calls navigate()).
        Cursor: anchors keep the native pointer cursor (buttons had Tailwind
        preflight's default cursor) — deliberate, since these are now links.
      */}
      <nav className="overflow-x-auto">
        <div className="px-4 sm:px-8 border-b border-border flex items-end h-12 gap-2 w-max min-w-full">
        <Link
          href={TAB_PATHS.prompts}
          onClick={skipIfActive('prompts')}
          aria-current={tab === 'prompts' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'prompts' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Prompts
        </Link>
        <Link
          href={TAB_PATHS.brand}
          onClick={skipIfActive('brand')}
          aria-current={tab === 'brand' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'brand' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Brand skill
        </Link>
        <Link
          href={TAB_PATHS.launch}
          onClick={skipIfActive('launch')}
          aria-current={tab === 'launch' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'launch' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Launch ready
        </Link>
        <Link
          href={TAB_PATHS.capabilities}
          onClick={skipIfActive('capabilities')}
          aria-current={tab === 'capabilities' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'capabilities' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Capabilities
        </Link>
        <Link
          href={TAB_PATHS.connect}
          onClick={skipIfActive('connect')}
          aria-current={tab === 'connect' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'connect' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground'}`}
        >
          Connect
        </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-10">
        {tab === 'brand' ? (
          <BrandSkillPage />
        ) : tab === 'launch' ? (
          <LaunchReadyPage />
        ) : tab === 'capabilities' ? (
          <CapabilitiesPage />
        ) : tab === 'connect' ? (
          <ConnectPage />
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

function useRowDeepLink(slug: string) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  // A row mounts expanded when the URL hash already points at it (initial
  // page load, or a remount after tab / back-forward navigation).
  const [expanded, setExpandedState] = useState(() => getHashSlug() === slug);

  useEffect(() => {
    if (pendingScrollSlug === slug && getHashSlug() === slug) {
      pendingScrollSlug = null;
      requestAnimationFrame(() => rowRef.current?.scrollIntoView({ block: 'start' }));
    }

    const mountPathname = window.location.pathname;
    const onHashChange = () => {
      // Ignore traversals that also switch tabs; the rows that remount for
      // the new tab handle those via the mount path above.
      if (window.location.pathname !== mountPathname) return;
      if (getHashSlug() !== slug) return;
      pendingScrollSlug = null;
      setExpandedState(true);
      requestAnimationFrame(() => rowRef.current?.scrollIntoView({ block: 'start' }));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [slug]);

  // Expanding claims the hash for this row; collapsing clears it only if the
  // row still owns it (another row expanded later may have taken it over).
  const setExpanded = (next: boolean) => {
    setExpandedState(next);
    if (next) {
      replaceHash(slug);
    } else if (getHashSlug() === slug) {
      replaceHash(null);
    }
  };

  return { rowRef, expanded, setExpanded };
}

function replaceHash(slug: string | null) {
  const base = window.location.pathname + window.location.search;
  history.replaceState(history.state, '', slug ? `${base}#${encodeURIComponent(slug)}` : base);
}

let pendingScrollSlug: string | null = getHashSlug() || null;
