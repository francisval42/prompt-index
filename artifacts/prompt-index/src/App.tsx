import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { marked } from 'marked';

import brandSkillExampleRaw from '../content/brand-skill/example.md?raw';

// Load all markdown files
const promptModules = import.meta.glob('../content/prompts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const launchReadyModules = import.meta.glob('../content/launch-ready/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const connectModules = import.meta.glob('../content/connect/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const explainerModules = import.meta.glob('../content/explainers/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
// Images that explainer markdown references by relative path, served through
// Vite so they exist in dev and in the fingerprinted production build.
const explainerAssets = import.meta.glob('../content/explainers/*.{svg,png,jpg,jpeg,gif,webp}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

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

const connectDocs = Object.values(connectModules)
  .map(parsePrompt)
  .filter(Boolean)
  .sort((a: any, b: any) => Number(a.order) - Number(b.order));

const explainerDocs = Object.values(explainerModules)
  .map(parsePrompt)
  .filter(Boolean)
  .sort((a: any, b: any) => Number(a.order) - Number(b.order));

// Row slug for hash deep links: the file name minus .md (e.g. skills.md -> #skills).
const explainerSlug = (doc: any) => String(doc.file ?? '').replace(/\.md$/i, '') || String(doc.order);

const explainerAssetByName: Record<string, string> = Object.fromEntries(
  Object.entries(explainerAssets).map(([path, url]) => [path.split('/').pop() ?? path, url]),
);

// Markdown in content/explainers references images by bare relative path
// (e.g. skills-diagram.svg). That path never exists at the served URL, so
// rewrite each img src in the rendered HTML to its Vite asset URL.
function resolveExplainerAssetUrls(html: string): string {
  return html.replace(/src="([^"]+)"/g, (match, src) => {
    let decoded = src;
    try {
      decoded = decodeURIComponent(src);
    } catch {
      // Malformed percent escape in a content-authored path: fall through
      // with the raw value rather than crashing the whole tab.
    }
    const name = decoded.split('/').pop();
    const mapped = name ? explainerAssetByName[name] : undefined;
    return mapped ? `src="${mapped}"` : match;
  });
}

// Split a markdown body into HTML chunks and fenced code blocks so each code
// block can render as a React component with the site's stateful COPY button.
// The code text is passed through verbatim: what renders is what copies.
function splitMarkdownSegments(markdown: string): Array<{ kind: 'html'; html: string } | { kind: 'code'; code: string }> {
  const tokens = marked.lexer(markdown);
  const links = (tokens as any).links ?? {};
  const segments: Array<{ kind: 'html'; html: string } | { kind: 'code'; code: string }> = [];
  let chunk: any[] = [];
  const flush = () => {
    if (!chunk.length) return;
    (chunk as any).links = links;
    segments.push({ kind: 'html', html: marked.parser(chunk as any) as string });
    chunk = [];
  };
  for (const token of tokens) {
    if ((token as any).type === 'code') {
      flush();
      segments.push({ kind: 'code', code: (token as any).text });
    } else {
      chunk.push(token);
    }
  }
  flush();
  return segments;
}

const LAUNCH_STEPS = [
  '1. Copy the build rules into replit.md before the first prompt. Other tools: CLAUDE.md, .cursor/rules, or attach the file at chat start.',
  '2. Paste the kickoff prompt. The AI confirms the rules, asks the setup questions, builds the scaffold before any feature.',
  '3. Request features with the feature template. Every feature ends on the definition of done.',
  '4. Every few features, run a checkpoint sweep: access, duplicates, secrets, schema, queries.',
  '5. Before launch, run the audit as a second user. Fix every critical.',
  '6. Rotate every key. Launch.',
];

const CONNECT_STEPS = [
  '1. List what Claude needs to reach.',
  '2. Check the connector directory, wire it, stop if covered.',
  '3. No connector, confirm the service has an API.',
  '4. Set up API access with 1-API-ACCESS.',
  '5. Build the server with 2-BUILD-PROMPTS.',
  '6. Register and test with 3-CONNECT-AND-TEST.',
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

function rowDeepLinkUrl(slug: string): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${encodeURIComponent(slug)}`;
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
        className="flex flex-col sm:flex-row sm:items-center py-3 gap-2 sm:gap-4 hover:bg-[#111] active:bg-[#111] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 cursor-pointer transition-none outline-none"
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
        <RowLinkButton slug={slug} />
        <button 
          onClick={handleCopy}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleCopy(e);
            }
          }}
          className={`shrink-0 self-start sm:self-auto sm:w-20 text-left sm:text-right font-bold py-3 sm:-my-3 px-3 -mx-3 sm:px-0 sm:mx-0 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground active:text-foreground'}`}
          tabIndex={0}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      
      {expanded && (
        <div className="py-8 bg-background border-t border-border cursor-auto">
          <div 
            className="prose prose-invert [overflow-wrap:anywhere] prose-p:leading-relaxed prose-pre:overflow-x-auto prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
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
            className={`shrink-0 font-bold py-3 -my-3 px-3 -mx-3 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground active:text-foreground'}`}
            tabIndex={0}
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
        <div className="py-8">
          <div
            className="prose prose-invert [overflow-wrap:anywhere] prose-p:leading-relaxed prose-pre:overflow-x-auto prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
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
        className="flex flex-col sm:flex-row sm:items-center py-3 gap-2 sm:gap-4 hover:bg-[#111] active:bg-[#111] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 cursor-pointer transition-none outline-none"
      >
        <div className="text-muted w-10 shrink-0 hidden sm:block">{doc.order}</div>
        <div className="text-foreground flex-1 font-medium flex gap-2">
          <span className="sm:hidden text-muted">{doc.order}</span>
          {doc.title}
        </div>
        <div className="text-muted text-sm shrink-0 sm:w-48">{doc.file}</div>
        <RowLinkButton slug={slug} />
        <button
          onClick={handleCopy}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleCopy(e);
            }
          }}
          className={`shrink-0 self-start sm:self-auto sm:w-20 text-left sm:text-right font-bold py-3 sm:-my-3 px-3 -mx-3 sm:px-0 sm:mx-0 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground active:text-foreground'}`}
          tabIndex={0}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {expanded && (
        <div className="py-8 bg-background border-t border-border cursor-auto">
          <div
            className="prose prose-invert [overflow-wrap:anywhere] prose-p:leading-relaxed prose-pre:overflow-x-auto prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
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
        className="flex flex-col sm:flex-row sm:items-center py-3 gap-2 sm:gap-4 hover:bg-[#111] active:bg-[#111] touch-manipulation cursor-pointer transition-none"
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
          className="shrink-0 self-start sm:self-auto sm:w-24 text-left sm:text-right font-bold py-3 sm:-my-3 px-3 -mx-3 sm:px-0 sm:mx-0 touch-manipulation text-muted hover:text-foreground active:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none"
        >
          DOWNLOAD
        </button>
        <RowLinkButton slug={slug} />
        <button
          type="button"
          onClick={handleCopy}
          className={`shrink-0 self-start sm:self-auto sm:w-20 text-left sm:text-right font-bold py-3 sm:-my-3 px-3 -mx-3 sm:px-0 sm:mx-0 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground active:text-foreground'}`}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {expanded && (
        <div id={panelId} className="py-8 bg-background border-t border-border cursor-auto">
          <div
            className="prose prose-invert [overflow-wrap:anywhere] prose-p:leading-relaxed prose-pre:overflow-x-auto prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
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

function ExplainerCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (copied) return;
    copyText(code, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className={`shrink-0 font-bold py-3 sm:-my-3 px-3 -mx-3 sm:px-0 sm:mx-0 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground active:text-foreground'}`}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <pre className="bg-[#111] border border-border overflow-x-auto p-4 text-sm leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

function ExplainerRow({ doc }: { doc: any }) {
  const slug = explainerSlug(doc);
  const { rowRef, expanded, setExpanded } = useRowDeepLink(slug);
  const segments = useMemo(() => splitMarkdownSegments(doc.body), [doc.body]);

  return (
    <div ref={rowRef} id={slug} className="border-b border-border group scroll-mt-4">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="flex items-center py-3 hover:bg-[#111] active:bg-[#111] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 cursor-pointer transition-none outline-none"
      >
        <div className="text-foreground flex-1 font-medium">{doc.title}</div>
      </div>

      {expanded && (
        <div className="py-8 bg-background border-t border-border cursor-auto flex flex-col gap-6">
          {segments.map((seg, i) =>
            seg.kind === 'code' ? (
              <ExplainerCodeBlock key={i} code={seg.code} />
            ) : (
              <div
                key={i}
                className="prose prose-invert [overflow-wrap:anywhere] prose-p:leading-relaxed prose-img:w-full prose-pre:overflow-x-auto prose-pre:bg-[#111] prose-pre:border prose-pre:border-border max-w-3xl mx-auto prose-hr:border-border prose-headings:font-bold prose-headings:text-foreground"
                dangerouslySetInnerHTML={{ __html: resolveExplainerAssetUrls(seg.html) }}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ExplainersPage() {
  return (
    <div className="flex flex-col gap-10 pb-16">
      <section className="flex flex-col">
        <div className="border-t border-border flex flex-col">
          {explainerDocs.map((doc: any) => (
            <ExplainerRow key={explainerSlug(doc)} doc={doc} />
          ))}
        </div>
      </section>
    </div>
  );
}

type TabKey = 'prompts' | 'brand' | 'launch' | 'connect' | 'explainers';

// Each tab has a stable URL so it can be shared and deep-linked directly.
const TAB_PATHS: Record<TabKey, string> = {
  prompts: '/',
  brand: '/brand',
  launch: '/launch',
  connect: '/connect',
  explainers: '/explainers',
};

const PATH_TO_TAB = new Map<string, TabKey>(
  (Object.entries(TAB_PATHS) as [TabKey, string][]).map(([key, tabPath]) => [tabPath, key]),
);

const FILTER_PARAM = 'q';
const TAB_TITLES: Record<TabKey, string> = {
  prompts: 'Prompts',
  brand: 'Brand skill',
  launch: 'Launch ready',
  connect: 'Connect',
  explainers: 'Explainers',
};

// sessionStorage key set just before the unknown-path redirect so the index
// can tell the visitor why they landed there. Consumed (removed) the first
// time the notice renders, so it shows once per redirect: reloads and normal
// visits to "/" stay clean. sessionStorage instead of wouter's history state
// because state set via replaceState survives a reload and would re-show it.
const BROKEN_LINK_FLAG = 'index:broken-link-redirect';

// Drop-in for wouter's <Redirect to="/" replace />: identical navigation (a
// pre-paint layout effect; `replace` keeps the dead URL out of history) plus
// the session flag App consumes to show the one-time broken-link notice.
function BrokenLinkRedirect() {
  const [, navigate] = useLocation();
  useLayoutEffect(() => {
    try {
      sessionStorage.setItem(BROKEN_LINK_FLAG, '1');
    } catch {
      // Storage blocked (private browsing, etc.): skip the notice, keep the redirect.
    }
    navigate('/', { replace: true });
  }, [navigate]);
  return null;
}

function App() {
  const [location] = useLocation();
  // Unknown paths redirect to the index (see the guard after the hooks below).
  const normalizedPath = normalizePath(location);
  const matchedTab = PATH_TO_TAB.get(normalizedPath);
  const tab: TabKey = matchedTab ?? 'prompts';
  // Clicking the already-active tab is a no-op so it doesn't stack duplicate
  // history entries (and, on Prompts, doesn't wipe ?q= from the URL).
  const skipIfActive = (key: TabKey) => (e: React.MouseEvent) => {
    if (tab === key) e.preventDefault();
  };
  // Seed the filter from ?q= so a shared or bookmarked link restores the same filtered view.
  const [filter, setFilter] = useState(readFilterFromUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  // True only right after BrokenLinkRedirect sent the visitor here; cleared
  // by the DISMISS button or by navigating to another tab.
  const [showBrokenLinkNotice, setShowBrokenLinkNotice] = useState(false);

  // Set a distinct title per tab so history entries, bookmarks, and shared
  // links are distinguishable. Runs on load and on every tab switch.
  useEffect(() => {
    document.title = `Index — ${TAB_TITLES[tab]}`;
  }, [tab]);

  // Surface the broken-link notice on the render after the redirect lands on
  // "/", consuming the flag so it appears only once. Navigating to any other
  // tab dismisses it.
  useEffect(() => {
    if (normalizedPath !== '/') {
      setShowBrokenLinkNotice(false);
      return;
    }
    let flaggedRedirect = false;
    try {
      flaggedRedirect = sessionStorage.getItem(BROKEN_LINK_FLAG) === '1';
      if (flaggedRedirect) sessionStorage.removeItem(BROKEN_LINK_FLAG);
    } catch {
      // No storage access — the redirect stays silent, as it was before.
    }
    if (flaggedRedirect) setShowBrokenLinkNotice(true);
  }, [normalizedPath]);

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

  // Mirror the filter into ?q= while on the Prompts tab so the current view can
  // be copied straight from the address bar. replaceState (not pushState) keeps
  // typing from flooding session history; the short debounce coalesces fast
  // keystrokes below browser rate limits on history updates. Other tabs are
  // untouched: tab links navigate to bare paths, and this effect skips them.
  useEffect(() => {
    if (tab !== 'prompts') return;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if ((params.get(FILTER_PARAM) ?? '') === filter) return;
      if (filter) {
        params.set(FILTER_PARAM, filter);
      } else {
        params.delete(FILTER_PARAM);
      }
      const query = params.toString();
      // Preserve unrelated params and the row deep-link hash; only ?q= belongs
      // to this feature.
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
      );
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [tab, filter]);

  // Back/forward can land on a Prompts history entry whose URL carries a
  // different ?q= than current state; adopt the URL's value so the visible
  // list always matches the address bar. Non-Prompts entries are ignored so
  // the filter still persists across ordinary tab switches.
  useEffect(() => {
    const handlePopState = () => {
      if (PATH_TO_TAB.get(currentAppPath()) !== 'prompts') return;
      setFilter(readFilterFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Mistyped or outdated links (e.g. /brands, /launch-ready) land here.
  // Redirect to the index instead of silently rendering Prompts under the
  // wrong URL, which would get bookmarked and re-shared. `replace` keeps the
  // dead URL out of history so Back doesn't bounce through it again, and the
  // redirect flags the session so the index can explain what happened (see
  // BrokenLinkRedirect above).
  // (Kept after the hooks: both renders must call the same hooks in order.)
  if (!matchedTab) {
    return <BrokenLinkRedirect />;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-mono text-base">
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
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'prompts' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground active:text-foreground'}`}
        >
          Prompts
        </Link>
        <Link
          href={TAB_PATHS.brand}
          onClick={skipIfActive('brand')}
          aria-current={tab === 'brand' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'brand' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground active:text-foreground'}`}
        >
          Brand skill
        </Link>
        <Link
          href={TAB_PATHS.launch}
          onClick={skipIfActive('launch')}
          aria-current={tab === 'launch' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'launch' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground active:text-foreground'}`}
        >
          Launch ready
        </Link>
        <Link
          href={TAB_PATHS.connect}
          onClick={skipIfActive('connect')}
          aria-current={tab === 'connect' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'connect' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground active:text-foreground'}`}
        >
          Connect
        </Link>
        <Link
          href={TAB_PATHS.explainers}
          onClick={skipIfActive('explainers')}
          aria-current={tab === 'explainers' ? 'page' : undefined}
          className={`h-full flex items-center px-2 -mb-[1px] border-b-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 outline-none ${tab === 'explainers' ? 'border-accent text-foreground font-medium' : 'border-transparent text-muted hover:text-foreground active:text-foreground'}`}
        >
          Explainers
        </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-10">
        {tab === 'brand' ? (
          <BrandSkillPage />
        ) : tab === 'launch' ? (
          <LaunchReadyPage />
        ) : tab === 'connect' ? (
          <ConnectPage />
        ) : tab === 'explainers' ? (
          <ExplainersPage />
        ) : (
          <>
            {showBrokenLinkNotice && (
              <div
                role="status"
                className="flex items-start justify-between gap-4 border border-border px-4 py-3 text-sm text-muted"
              >
                <span>That page doesn't exist, so we brought you to the index.</span>
                <button
                  type="button"
                  onClick={() => setShowBrokenLinkNotice(false)}
                  className="shrink-0 font-bold text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none"
                >
                  DISMISS
                </button>
              </div>
            )}
            <div>
              <input 
                ref={inputRef}
                type="text"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
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

const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

function RowLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (copied) return;
    copyText(rowDeepLinkUrl(slug), () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return (
    <button
      type="button"
      title="Copy link to this row"
      onClick={handleCopyLink}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleCopyLink(e);
        }
      }}
      className={`shrink-0 self-start sm:self-auto sm:w-16 text-left sm:text-right font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none ${copied ? 'text-accent' : 'text-muted hover:text-foreground'}`}
    >
      {copied ? 'COPIED' : 'LINK'}
    </button>
  );
}

function readFilterFromUrl(): string {
  return new URLSearchParams(window.location.search).get(FILTER_PARAM) ?? '';
}

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

function currentAppPath(): string {
  const { pathname } = window.location;
  const withoutBase =
    ROUTER_BASE && pathname.startsWith(ROUTER_BASE) ? pathname.slice(ROUTER_BASE.length) : pathname;
  return normalizePath(withoutBase);
}
