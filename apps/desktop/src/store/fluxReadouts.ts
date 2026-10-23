// FLUX V2 - THE READOUTS. Every string the Flux page frame speaks is built here and nowhere else (components/FluxReadouts.tsx composes them and holds no literal of its own), so each one is
// a TRUE reading - the page's position, the rack the writer is in, the hint for the surface they are on - and the harness (flux-v2.mjs) can hold each one to its source.
// Flux-only chrome: Arbor never calls these. These are readouts, not lexicon words - the words they quote (Doc, Rack, Track) are the Flux words, fixed here.

const pad = (n: number, width: number): string => String(Math.max(0, Math.trunc(n))).padStart(width, '0');

/** DOC nn // title - the page's own number (its place in the sequence, 1-based, two digits at least) and its title. */
export function docReadout(n: number, title: string): string {
  return `DOC ${pad(n, 2)} // ${title}`;
}

/** TRK n/m - the section's real position in its set (store/place.ts trackOf) over that set's size. */
export function trackReadout(n: number, m: number): string {
  return `TRK ${n}/${m}`;
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

// The hint lines (Fable, Oct 21): the prose surface and Wire In each get one true line. A board hint lands with the Inputs work after step 3 - there is none until then.
export const HINTS = {
  prose: 'TYPE — THE CHROME RECEDES ▪ PASTE MEETS THE FIREWALL',
  wireIn: 'FORWARD ONLY — NO WAY BACK ▪ PASTE MEETS THE FIREWALL',
} as const;

export type HintSurface = 'prose' | 'wireIn' | 'board';

export function hintFor(surface: string): string | null {
  if (surface === 'prose') return HINTS.prose;
  if (surface === 'wireIn') return HINTS.wireIn;
  return null;
}

/** The corner brackets close in ONCE per page open: true when the page changed (and there is a page). Same page, re-render, or no page: false. */
export function shouldAcquire(prev: string | null, id: string | null): boolean {
  return prev !== id && id !== null;
}
