// the font roster: nine faces, one table, one resolver, one loader; Times New Roman and Arial are named, never shipped (metric-compatible open fallbacks keep line breaks identical); default faces eager, the rest load on choose [fontRoster §1]
import { SIZE_DEFAULT, PAGE_SIZE_DEFAULT, PAGE_PT_FALLBACK } from './fontSize';
import type { StoredFace, FaceGeneric, FaceSource } from '../types';

export type { StoredFace };

export interface RosterFace {
  name: string;
  generic: FaceGeneric;
  source: 'bundled' | 'named';
  fallback?: string;
  /** The complete CSS font-family value. */
  stack: string;
  group: 'serif' | 'sans' | 'mono';
  sizeAdjust: number;
  /** True when main.tsx already imports it eagerly; `load` is then a no-op. */
  eager: boolean;
  load: () => Promise<unknown>;
}

const none = () => Promise.resolve();
const both = (...loads: Array<() => Promise<unknown>>) => () => Promise.all(loads.map((l) => l()));

export const ROSTER: readonly RosterFace[] = [
  { name: 'Crimson Pro', generic: 'serif', source: 'bundled', group: 'serif', sizeAdjust: 1, eager: true, load: none,
    stack: "'Crimson Pro Variable', Georgia, serif" },
  { name: 'Lora', generic: 'serif', source: 'bundled', group: 'serif', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource-variable/lora/wght.css'), () => import('@fontsource-variable/lora/wght-italic.css')),
    stack: "'Lora Variable', Georgia, serif" },
  // Arbor's default writing face: it loads with the theme (themeFontFaces.ts) or when chosen, never eagerly [fontRoster §2]
  { name: 'EB Garamond', generic: 'serif', source: 'bundled', group: 'serif', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource-variable/eb-garamond/wght.css'), () => import('@fontsource-variable/eb-garamond/wght-italic.css')),
    stack: "'EB Garamond Variable', Georgia, serif" },
  { name: 'Source Serif 4', generic: 'serif', source: 'bundled', group: 'serif', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource-variable/source-serif-4/wght.css'), () => import('@fontsource-variable/source-serif-4/wght-italic.css')),
    stack: "'Source Serif 4 Variable', Georgia, serif" },
  { name: 'Times New Roman', generic: 'serif', source: 'named', fallback: 'Tinos', group: 'serif', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource/tinos/400.css'), () => import('@fontsource/tinos/400-italic.css'), () => import('@fontsource/tinos/700.css'), () => import('@fontsource/tinos/700-italic.css')),
    stack: "'Times New Roman', 'Tinos', Times, serif" },
  { name: 'Figtree', generic: 'sans-serif', source: 'bundled', group: 'sans', sizeAdjust: 1, eager: true, load: none,
    stack: "'Figtree Variable', system-ui, sans-serif" },
  // the defaults Flux (Titillium Web) and Machina (Source Sans 3) wear: load on choose or with their theme, never eager [fontRoster §3]
  { name: 'Source Sans 3', generic: 'sans-serif', source: 'bundled', group: 'sans', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource-variable/source-sans-3/wght.css'), () => import('@fontsource-variable/source-sans-3/wght-italic.css')),
    stack: "'Source Sans 3 Variable', system-ui, sans-serif" },
  { name: 'Titillium Web', generic: 'sans-serif', source: 'bundled', group: 'sans', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource/titillium-web/400.css'), () => import('@fontsource/titillium-web/400-italic.css'), () => import('@fontsource/titillium-web/700.css'), () => import('@fontsource/titillium-web/700-italic.css')),
    stack: "'Titillium Web', system-ui, sans-serif" },
  { name: 'Atkinson Hyperlegible', generic: 'sans-serif', source: 'bundled', group: 'sans', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource/atkinson-hyperlegible/400.css'), () => import('@fontsource/atkinson-hyperlegible/400-italic.css'), () => import('@fontsource/atkinson-hyperlegible/700.css'), () => import('@fontsource/atkinson-hyperlegible/700-italic.css')),
    stack: "'Atkinson Hyperlegible', system-ui, sans-serif" },
  { name: 'Arial', generic: 'sans-serif', source: 'named', fallback: 'Arimo', group: 'sans', sizeAdjust: 1, eager: false,
    load: both(() => import('@fontsource/arimo/400.css'), () => import('@fontsource/arimo/400-italic.css'), () => import('@fontsource/arimo/700.css'), () => import('@fontsource/arimo/700-italic.css')),
    stack: "'Arial', 'Arimo', Helvetica, sans-serif" },
  { name: 'Courier Prime', generic: 'monospace', source: 'bundled', group: 'mono', sizeAdjust: 1, eager: true, load: none,
    stack: "'Courier Prime', 'Courier New', monospace" },
];

export const DEFAULT_FACE_NAME = 'Crimson Pro';

// each theme's default writing face, by voice; kept in step with the CSS tokens (theme-fonts-source.mjs fails on drift), so "Default (<face>)" never needs a DOM read [fontRoster §4]
export const THEME_DEFAULT_FACE: Readonly<Record<string, { serif: string; sans: string }>> = {
  plateau: { serif: 'EB Garamond', sans: 'Figtree' },
  flux: { serif: 'Titillium Web', sans: 'Chakra Petch' },
  machina: { serif: 'Source Sans 3', sans: 'Atkinson Hyperlegible' },
};
export function themeDefaultFaceName(theme: string | null | undefined, voice: string | null | undefined): string | null {
  const t = theme ? THEME_DEFAULT_FACE[theme] : undefined;
  return t ? (voice === 'sans' ? t.sans : t.serif) : null;
}

const GENERIC_STACK: Record<FaceGeneric, string> = {
  serif: 'Georgia, serif',
  'sans-serif': 'system-ui, sans-serif',
  monospace: "'Courier New', monospace",
};

export function rosterFace(name: string | undefined): RosterFace | undefined {
  return name === undefined ? undefined : ROSTER.find((f) => f.name === name);
}

// FONT-SPAN (docs/font-span-plan.md): a font on highlighted words is stored in the text as `[words]{.font-<slug>}`; the slug is the
// face's name, lower-cased, with a hyphen for each run of spaces or other characters (`EB Garamond` -> `eb-garamond`).
export function fontSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** The stored face a span's slug names: the roster face when this build knows it; otherwise a face NAMED from the slug, rendered by
 *  faceStack's own rule (its name first, then a serif - the fallback is faithful in kind, never a sans for a serif). */
export function faceForSlug(slug: string): StoredFace {
  const known = ROSTER.find((f) => fontSlug(f.name) === slug);
  if (known) return storedFaceFor(known);
  const name = slug.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  return { name, generic: 'serif', source: 'named' };
}

// the stored form of a face added from this device's own fonts: the existing record, `source: 'device'` [fontRoster §5]
export function deviceFace(name: string): StoredFace {
  return { name, generic: 'serif', source: 'device' };
}

/** The stored form of a roster face (what a page writes when the writer chooses it). */
export function storedFaceFor(face: RosterFace): StoredFace {
  return face.fallback
    ? { name: face.name, generic: face.generic, source: face.source, fallback: face.fallback }
    : { name: face.name, generic: face.generic, source: face.source };
}

const quote = (n: string) => `'${n.replace(/['\\]/g, '')}'`;

/** The CSS font-family for a stored face, or undefined when there is none (the page then renders as it always did).
 *  A face this build does not know still RENDERS: its own name first, then its generic class, so the fallback is a
 *  serif for a serif and never a sans (the fallback is faithful in kind). */
export function faceStack(stored: StoredFace | undefined): string | undefined {
  if (!stored || typeof stored.name !== 'string' || !stored.name) return undefined;
  const known = rosterFace(stored.name);
  if (known) return known.stack;
  // a device face missing here falls back to the theme's default, never to a generic class [fontRoster §6]
  if (stored.source === 'device') return `${quote(stored.name)}, var(--font-prose)`;
  const generic: FaceGeneric = stored.generic === 'sans-serif' || stored.generic === 'monospace' ? stored.generic : 'serif';
  return `${quote(stored.name)}, ${GENERIC_STACK[generic]}`;
}

/** The name of the FIRST family in a CSS font-family value, the way a writer would say it: quotes dropped and the package's
 *  " Variable" suffix removed ("'Crimson Pro Variable', Georgia, serif" -> "Crimson Pro"; "'Chakra Petch', sans-serif" ->
 *  "Chakra Petch"). Null when there is no family to name. Used to label the face that ACTUALLY renders when a page never chose. */
export function faceNameFromStack(stack: string | null | undefined): string | null {
  if (!stack) return null;
  const first = stack.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '').replace(/ Variable$/, '').trim();
  return first ? first : null;
}

const inflight = new Map<string, Promise<unknown>>();
/** Fetch a face's CSS if it is not already present. Memoised; a failed load is dropped so a later choose retries, and
 *  never throws - the page renders in the stack's fallback meanwhile. */
export function ensureFaceLoaded(name: string | undefined): Promise<unknown> {
  const face = rosterFace(name);
  if (!face || face.eager) return Promise.resolve();
  let p = inflight.get(face.name);
  if (!p) {
    p = face.load().catch(() => { inflight.delete(face.name); });
    inflight.set(face.name, p);
  }
  return p;
}

/** A card's style: its own face, and its size as a MULTIPLIER on the card's existing rule (`--card-type-k`, read by
 *  `.board-text` and the popup editor), so 11 is today's card exactly and a card that never chose emits nothing. */
export function cardTypeStyle(face: StoredFace | undefined, size: number | undefined): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  const stack = faceStack(face);
  if (stack) out.fontFamily = stack;
  const adjust = rosterFace(face?.name)?.sizeAdjust ?? 1;
  const points = size ?? SIZE_DEFAULT;
  if (points !== SIZE_DEFAULT || adjust !== 1) out['--card-type-k'] = String((points / SIZE_DEFAULT) * adjust);
  return Object.keys(out).length ? out : undefined;
}

// a page's face and size as inline style; size is real points in page units (n x --wz-pt), so the type scales with the page [fontRoster §7]
export function pageTypeStyle(face: StoredFace | undefined, size: number | undefined): { fontFamily?: string; fontSize?: string } {
  const out: { fontFamily?: string; fontSize?: string } = {};
  const stack = faceStack(face);
  if (stack) out.fontFamily = stack;
  const adjust = rosterFace(face?.name)?.sizeAdjust ?? 1;
  const points = size ?? PAGE_SIZE_DEFAULT;
  if (points !== PAGE_SIZE_DEFAULT || adjust !== 1) out.fontSize = `calc(${points * adjust} * var(--wz-pt, ${PAGE_PT_FALLBACK}))`;
  return out;
}
