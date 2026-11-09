// FLUX V2 - THE READOUTS. Every string the Flux page frame speaks is built here and nowhere else (components/FluxReadouts.tsx composes them and holds no literal of its own), so each one is
// a TRUE reading - the page's position, the rack the writer is in, the hint for the surface they are on - and the harness (flux-v2.mjs) can hold each one to its source.
// Flux-only chrome: Arbor never calls these. These are readouts, not lexicon words - the words they quote (Doc, Rack, Track) are the Flux words, fixed here.

const pad = (n: number, width: number): string => String(Math.max(0, Math.trunc(n))).padStart(width, '0');

// the block caret's width: a third of the old 0.48 ratio, never under 3 px [fluxReadouts §1]
export function caretWidth(height: number): number {
  return Math.max(3, Math.round(height * 0.16));
}

// how long the chrome takes to recede while typing: Arbor keeps the engine's slow curve; Flux is quicker, so a drawer is never caught half-faded [fluxReadouts §2]
export const FADE_OUT_FLUX_S = 0.8;
export function fadeOutSeconds(theme: string, base: number): number {
  return theme === 'flux' ? FADE_OUT_FLUX_S : base;
}

/** DOC nn // title - the page's own number (its place in the sequence, 1-based, two digits at least) and its title. */
export function docReadout(n: number, title: string): string {
  return `DOC ${pad(n, 2)} // ${title}`;
}

/** TRK n/m - the section's real position in its set (store/place.ts trackOf) over that set's size. */
export function trackReadout(n: number, m: number): string {
  return `TRK ${n}/${m}`;
}

/** TRK 5.2/9 - a sub-step's position: its parent's place among the main steps, the sub-step's number under it, over the main steps' size. A position, never a count. */
export function subTrackReadout(n: number, k: number, m: number): string {
  return `TRK ${n}.${k}/${m}`;
}

/** X ### · Y ### - a node's position as thousandths of the board, three digits, clamped to 0..999. */
export function coordReadout(x: number, y: number): string {
  const c = (v: number): string => pad(Math.min(999, Math.max(0, Math.round(v * 1000))), 3);
  return `X ${c(x)} · Y ${c(y)}`;
}

/** The rail box's count: a true number of what is stored, two digits at least (04, 12). */
export function railReadout(n: number): string {
  return pad(n, 2);
}

/** The words a rail hint quotes - ALL of them read from the lexicon entries the boxes' own labels use (drawerPage, stripPlan, drawerPlaceDrawers, drawerPlaceJournal), so a hint follows its box when
 *  a word is renamed (Law 5: the day circuits become schemas, "2 circuits" becomes "2 schemas" with no edit here). Plural labels as the lexicon gives them; the singular is the label without its
 *  final s, which every one of these (Pages/Docs, Boards/Circuits, Drawers/Racks) is. */
export interface RailHintWords { doc: string; circuit: string; rack: string; log: string }
const singular = (plural: string): string => plural.toLowerCase().replace(/s$/, '');
const plural = (w: string): string => w.toLowerCase();
const one = (n: number, w: string): string => `${n} ${n === 1 ? singular(w) : plural(w)}`;

/** The hover hint that names what a rail box's count counts (a bare number is only true when its scope is clear). where: unfiled (the Journal) or inside a rack (a Drawer). Sentence frames live here; the
 *  nouns arrive in `words`. */
export type RailHintKind = 'docs' | 'circuits' | 'log' | 'place' | 'voice' | 'tone';
export function railHint(kind: RailHintKind, n: number | string, where: 'journal' | 'drawer', words: RailHintWords): string {
  const num = typeof n === 'number' ? n : 0;
  const rack = singular(words.rack);
  const scope = where === 'journal' ? `not filed in a ${rack}` : `in this ${rack}`;
  if (kind === 'docs') return `${one(num, words.doc)} ${scope}`;
  if (kind === 'circuits') return `${one(num, words.circuit)} ${scope}`;
  if (kind === 'log') return `${one(num, words.doc)} in the ${words.log}`;
  if (kind === 'place') return `${num === 1 ? `1 ${singular(words.doc)} or ${singular(words.circuit)}` : `${num} ${plural(words.doc)} and ${plural(words.circuit)}`} ${scope}`;
  const cap = String(n).charAt(0).toUpperCase() + String(n).slice(1).toLowerCase();
  if (kind === 'voice') return `The Voice of your ${plural(words.doc)}: ${cap}`;
  return `Page: ${cap}`;
}

/** RACK ▸ name - the rack the writer is in. */
export function rackReadout(name: string): string {
  return `RACK ▸ ${name}`;
}

export const HINTS = {
  prose: 'TYPE — THE CHROME RECEDES ▪ PASTE MEETS THE FIREWALL',
  wireIn: 'FORWARD ONLY — NO WAY BACK ▪ PASTE MEETS THE FIREWALL',
  board: 'DRAG A NODE ▪ DRAG ITS INPUT TO CONNECT',
} as const;

export type HintSurface = 'prose' | 'wireIn' | 'board';

export function hintFor(surface: string): string | null {
  if (surface === 'prose') return HINTS.prose;
  if (surface === 'wireIn') return HINTS.wireIn;
  if (surface === 'board') return HINTS.board;
  return null;
}

/** The corner brackets close in ONCE per page open: true when the page changed (and there is a page). Same page, re-render, or no page: false. */
export function shouldAcquire(prev: string | null, id: string | null): boolean {
  return prev !== id && id !== null;
}
