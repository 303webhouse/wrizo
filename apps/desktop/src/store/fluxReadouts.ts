// FLUX V2 - THE READOUTS. Every string the Flux page frame speaks is built here and nowhere else (components/FluxReadouts.tsx composes them and holds no literal of its own), so each one is
// a TRUE reading - the page's position, the rack the writer is in, the hint for the surface they are on - and the harness (flux-v2.mjs) can hold each one to its source.
// Flux-only chrome: Arbor never calls these. These are readouts, not lexicon words - the words they quote (Doc, Rack, Track) are the Flux words, fixed here.

const pad = (n: number, width: number): string => String(Math.max(0, Math.trunc(n))).padStart(width, '0');

/** The block caret's width for a line of this height: a third of the old 0.48 ratio (Nick, Oct 23: "a slimmer caret, the block at about 1/3 width"), never under 3 px. */
export function caretWidth(height: number): number {
  return Math.max(3, Math.round(height * 0.16));
}

/** How long the chrome takes to recede while the writer types. Arbor keeps its slow curve (the engine's own base); FLUX is quicker (Nick, Oct 23: "an open drawer reaches the 0.08 floor about 1 s after the first key"), so a drawer's contents are never caught half-faded. */
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

/** RACK ▸ name - the rack the writer is in. */
export function rackReadout(name: string): string {
  return `RACK ▸ ${name}`;
}

// The hint lines (Fable, Oct 21): the prose surface and Wire In each get one true line; the board's landed with the Inputs work, after step 3.
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
