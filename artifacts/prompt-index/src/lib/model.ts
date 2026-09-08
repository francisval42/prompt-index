import { parsePrompt, promptModules, launchReadyModules, connectModules, explainerModules, brandSkillModule, digestModules } from './content-utils';

export type ManifestItem = {
  id: string; // Used as React key
  section: 'Prompts' | 'Packs' | 'Notes' | 'Digest';
  ref: string;
  kind: string;
  category?: string;
  title: string;
  tags: string;
  added: string;
  updated: string;
  action: 'COPY' | 'OPEN';
  body: string;
  url?: string;
  filename?: string;
  isConnect?: boolean;
};

// 1. Prompts
const prompts: ManifestItem[] = Object.entries(promptModules)
  .map(([path, raw]) => {
    const filename = path.split('/').pop()!;
    const parsed = parsePrompt(raw, filename);
    if (!parsed) return null;
    return {
      id: `prompt-${parsed.id}`,
      section: 'Prompts' as const,
      ref: parsed.id || '',
      kind: parsed.type || 'Prompt',
      category: parsed.category || '',
      title: parsed.title || '',
      tags: Array.isArray(parsed.platforms) ? parsed.platforms.join(', ') : (parsed.platforms || ''),
      added: parsed.added || parsed.updated || '',
      updated: parsed.updated || '',
      action: 'COPY' as const,
      body: parsed.body,
    };
  })
  .filter(Boolean) as ManifestItem[];

// 2. Packs (Launch ready + Connect)
const launchReady: ManifestItem[] = Object.entries(launchReadyModules)
  .map(([path, raw]) => {
    const filename = path.split('/').pop()!;
    const parsed = parsePrompt(raw, filename);
    if (!parsed) return null;
    const order = parsed.order != null ? String(parsed.order) : '0';
    return {
      id: `pack-lr-${filename}`,
      section: 'Packs' as const,
      ref: `LR${order}`,
      kind: 'Launch ready',
      title: parsed.title || '',
      tags: parsed.file || filename,
      added: parsed.added || parsed.updated || '',
      updated: parsed.updated || '',
      action: 'COPY' as const,
      body: parsed.body,
    };
  })
  .filter(Boolean) as ManifestItem[];

const connect: ManifestItem[] = Object.entries(connectModules)
  .map(([path, raw]) => {
    const filename = path.split('/').pop()!;
    const parsed = parsePrompt(raw, filename);
    if (!parsed) return null;
    const order = parsed.order != null ? String(parsed.order) : '0';
    return {
      id: `pack-cn-${filename}`,
      section: 'Packs' as const,
      ref: `CN${order}`,
      kind: 'Connect',
      title: parsed.title || '',
      tags: parsed.file || filename,
      added: parsed.added || parsed.updated || '',
      updated: parsed.updated || '',
      action: 'COPY' as const,
      body: parsed.body,
      filename: parsed.file || filename,
      isConnect: true,
    };
  })
  .filter(Boolean) as ManifestItem[];

// 3. Notes (Explainers + Brand Skill)
const explainers: ManifestItem[] = Object.entries(explainerModules)
  .map(([path, raw]) => {
    const filename = path.split('/').pop()!;
    const parsed = parsePrompt(raw, filename);
    if (!parsed) return null;
    // The existing explainer order is zero-based; public note refs start at N01.
    const order = String(Number(parsed.order ?? 0) + 1).padStart(2, '0');
    return {
      id: `note-ex-${filename}`,
      section: 'Notes' as const,
      ref: `N${order}`,
      kind: parsed.kind || 'Explainer',
      title: parsed.title || '',
      tags: parsed.file || filename,
      added: parsed.added || parsed.updated || '',
      updated: parsed.updated || '',
      action: 'COPY' as const,
      body: parsed.body,
    };
  })
  .filter(Boolean) as ManifestItem[];

// Brand skill special construction
const BRAND_SKILL_STEPS = [
  '1. Open a Cowork chat in Claude.',
  "2. Give it a brand skill to copy the shape of. The example below works. So does Claude's built-in brand-guidelines skill.",
  "3. Connect the folder holding your logos, fonts and brand assets. If there isn't one, name your colours and fonts in the chat.",
  '4. Ask for a skill file for your own brand: colours, type, voice, rules.',
  '5. It renders a specimen. Correct it until it looks like you.',
  '6. Save the skill from the file card.',
].join('\n');

const brandSkillRaw = Object.values(brandSkillModule)[0];
if (!brandSkillRaw) throw new Error('The brand skill example is missing.');
const brandSkill = parsePrompt(brandSkillRaw);
const brandSkillBody = `${BRAND_SKILL_STEPS}\n\n${brandSkillRaw}`;
const brandSkillItem: ManifestItem = {
  id: 'note-brand-skill',
  section: 'Notes',
  ref: `N${String(Math.max(0, ...explainers.map(item => Number(item.ref.slice(1)))) + 1).padStart(2, '0')}`,
  kind: 'Skill',
  title: 'Make a brand skill',
  tags: brandSkill?.name || 'francis-valente-brand',
  // Supplied Manifest reference metadata; the skill file itself has no date.
  added: '2026-08-22',
  updated: '2026-08-26',
  action: 'COPY',
  body: brandSkillBody,
};
explainers.push(brandSkillItem);

// 4. Digest
const digest: ManifestItem[] = Object.entries(digestModules)
  .map(([path, raw]) => {
    const filename = path.split('/').pop()!;
    const parsed = parsePrompt(raw, filename);
    if (!parsed?.issue || !parsed.title || !parsed.updated || !parsed.url) {
      throw new Error(`Digest entry ${filename} requires issue, title, updated and url.`);
    }
    const url = String(parsed.url);
    // Accept real HTTP(S) URLs and site-relative paths, never executable schemes.
    if (!/^(https?:\/\/|\/(?!\/))/i.test(url)) {
      throw new Error(`Digest entry ${filename} requires an HTTP(S) or site-relative URL.`);
    }
    return {
      id: `digest-${filename}`,
      section: 'Digest' as const,
      ref: parsed.issue || '',
      kind: 'Issue',
      title: parsed.title || '',
      tags: 'Email',
      added: parsed.added || parsed.updated || '',
      updated: parsed.updated || '',
      action: 'OPEN' as const,
      body: '',
      url,
    };
  })
  .filter(Boolean) as ManifestItem[];

export const SECTIONS = ['Prompts', 'Packs', 'Notes', 'Digest'] as const;
export type Section = (typeof SECTIONS)[number];
export const PROMPT_CATEGORIES = ['Protocols', 'Discovery', 'Generation', 'Repairs', 'Review', 'Builds'] as const;

export const allItems: ManifestItem[] = [
  ...prompts.sort((a, b) => a.ref.localeCompare(b.ref)),
  ...([...launchReady, ...connect].sort((a, b) => a.ref.localeCompare(b.ref))),
  ...explainers.sort((a, b) => a.ref.localeCompare(b.ref)),
  ...digest.sort((a, b) => a.ref.localeCompare(b.ref)),
];
