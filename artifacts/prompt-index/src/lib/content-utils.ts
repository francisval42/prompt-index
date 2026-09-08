import { marked } from 'marked';

// Use strict glob imports
export const promptModules = import.meta.glob('../../content/prompts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const launchReadyModules = import.meta.glob('../../content/launch-ready/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const connectModules = import.meta.glob('../../content/connect/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const explainerModules = import.meta.glob('../../content/explainers/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const brandSkillModule = import.meta.glob('../../content/brand-skill/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const digestModules = import.meta.glob('../../content/digest/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const explainerAssets = import.meta.glob('../../content/explainers/*.{svg,png,jpg,jpeg,gif,webp}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

// Shared marked parsing logic
export function parsePrompt(raw: string, filename: string = '') {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const fmStr = match[1];
  const body = match[2];
  
  const fm: any = {};
  fmStr.split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon > -1) {
      const key = line.substring(0, colon).trim();
      let val: any = line.substring(colon + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      } else if (val.startsWith('[') && val.endsWith(']')) {
        val = val
          .substring(1, val.length - 1)
          .split(',')
          .map((s: string) => s.trim());
      }
      fm[key] = val;
    }
  });

  // Nothing after the closing frontmatter delimiter is trimmed or normalized.
  return { ...fm, body, filename };
}

const explainerAssetByName: Record<string, string> = Object.fromEntries(
  Object.entries(explainerAssets).map(([path, url]) => [path.split('/').pop() ?? path, url]),
);

export function resolveExplainerAssetUrls(html: string): string {
  return html.replace(/src="([^"]+)"/g, (match, src) => {
    let decoded = src;
    try {
      decoded = decodeURIComponent(src);
    } catch {}
    const name = decoded.split('/').pop();
    const mapped = name ? explainerAssetByName[name] : undefined;
    return mapped ? `src="${mapped}"` : match;
  });
}

export function splitMarkdownSegments(markdown: string): Array<{ kind: 'html'; html: string } | { kind: 'code' | 'table'; code: string }> {
  const tokens = marked.lexer(markdown);
  const links = (tokens as any).links ?? {};
  const segments: Array<{ kind: 'html'; html: string } | { kind: 'code' | 'table'; code: string }> = [];
  let chunk: any[] = [];
  const flush = () => {
    if (!chunk.length) return;
    (chunk as any).links = links;
    segments.push({ kind: 'html', html: marked.parser(chunk as any) as string });
    chunk = [];
  };
  for (const token of tokens) {
    if (token.type === 'table') {
      flush();
      segments.push({ kind: 'table', code: token.raw });
    } else if ((token as any).type === 'code') {
      flush();
      segments.push({ kind: 'code', code: (token as any).text });
    } else {
      chunk.push(token);
    }
  }
  flush();
  return segments;
}

export function copyText(text: string, done: () => void) {
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
      if (document.execCommand('copy')) done();
      else console.error('Copy failed');
    } catch (error) {
      console.error("Copy failed", error);
    }
    textArea.remove();
  }
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}