// ITEM 207 (phase 1, 207a) — THE FONT ROSTER: nine faces, one data table, one resolver, one loader.
//
// THE NINE (Nick approved the list; PLAN desk's amendment §11): Crimson Pro (the default) · Lora · EB Garamond ·
// Source Serif 4 · Times New Roman · Figtree · Atkinson Hyperlegible · Arial · Courier Prime.
//
// TIMES NEW ROMAN AND ARIAL ARE NAMED, NEVER SHIPPED (proprietary). Each stack names the installed font first
// and falls back to a metric-compatible open face - Tinos for Times New Roman, Arimo for Arial - so a machine that
// lacks the font breaks the same text at the same places (identical advance widths). What that buys is line-break
// identity across machines, NOT a match to a style guide's line length (that is a property of the sheet).
//
// LOAD ON CHOOSE, DEFAULT EAGER. Crimson Pro, Figtree and Courier Prime are imported eagerly in main.tsx (unchanged
// - the default face is present at first paint, and Courier is the screenplay face). Every other face is a dynamic
// import of its CSS, fired when the writer CHOOSES it or when a page that uses it OPENS - never at startup. The
// eager list does not grow (item207.mjs checks that against main.tsx).
//
// SIZE-ADJUST (Fable's ruling, 2026-09-24): every face carries `sizeAdjust`, and every one is 1. The size number is
// LITERAL printed points - a writer following a style guide types 12 and means 12 - so no face is normalised to
// another's x-height. The field is the seam: changing a face's apparent size later is one number in this table.
import { PROSE_BASE_PX, SIZE_DEFAULT } from './fontSize';
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

const GENERIC_STACK: Record<FaceGeneric, string> = {
  serif: 'Georgia, serif',
  'sans-serif': 'system-ui, sans-serif',
  monospace: "'Courier New', monospace",
};

export function rosterFace(name: string | undefined): RosterFace | undefined {
  return name === undefined ? undefined : ROSTER.find((f) => f.name === name);
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

/** The inline style a writing surface applies for its page's own face and size; empty when the page never chose, which
 *  is what keeps an untouched page byte-identical. `size` is points; 11 is today's rendering. */
export function pageTypeStyle(face: StoredFace | undefined, size: number | undefined): { fontFamily?: string; fontSize?: string } {
  const out: { fontFamily?: string; fontSize?: string } = {};
  const stack = faceStack(face);
  if (stack) out.fontFamily = stack;
  const adjust = rosterFace(face?.name)?.sizeAdjust ?? 1;
  const points = size ?? SIZE_DEFAULT;
  if (points !== SIZE_DEFAULT || adjust !== 1) out.fontSize = `calc(${PROSE_BASE_PX}px * ${(points / SIZE_DEFAULT) * adjust} * var(--paper-scale))`;
  return out;
}
