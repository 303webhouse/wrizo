// PAGE BREAKS FOR PROSE (Fable, Nov 19; docs: ARBOR-pagebreaks-proposal.md, the Wrizors' spec draft 3). A page is a US Letter page at the Doc's own
// Page setup, worked out from the laid-out lines of the CLEAN text in a hidden letter page (store/pageMeasure.ts), never from the window, never
// stored. This file is the pure half: the whole-line walk, the page of an offset, and the one in-memory list every reader reads (the marks, the
// count, the page-turn sound). Nothing here persists (law 4) [pageBreaks §1]
import { LETTER_IN_BASE } from './pageScale';

/** One logical line (a row) of the clean text, as laid out on the letter page at scale 1. */
export interface LineUnit {
  /** The row's laid-out height in layout px (its computed height: the same at any depth or scale). */
  h: number;
  /** How many lines the row wraps to (a count of distinct line tops, never a position). */
  n: number;
  /** The row-local clean offsets where its lines start (starts[0] = 0). */
  starts: number[];
  /** The row's first clean offset in the section's text. */
  base: number;
}

// the text height of a page: 11 page-inches less the .85in top and bottom margins (desk-frame §9's padding), at scale 1 [pageBreaks §2]
export const PAGE_TEXT_H = LETTER_IN_BASE * (11 - 2 * 0.85);

// THE WHOLE-LINE WALK: a page holds whole line boxes while the sum of their pitches (row height / row lines) fits the page's text height; the
// break is the first character of the first line that does not fit. Nothing is decided from a deep pixel position, so a page 160 sheets down
// breaks where page 2 would (the probe's 50k one-line drift came from chaining viewport rects) [pageBreaks §3]
export function walkLines(units: LineUnit[], H: number = PAGE_TEXT_H): number[] {
  const br: number[] = [];
  const EPS = 1e-6;
  let used = 0;
  let i = 0;
  let j = 0;   // the first line of units[i] not yet placed
  while (i < units.length) {
    const u = units[i];
    const n = Math.max(1, u.n);
    const p = u.h / n;
    const remain = (n - j) * p;
    if (used + remain <= H + EPS) { used += remain; i++; j = 0; continue; }
    let k = Math.floor((H - used) / p + EPS);
    if (k <= 0 && used === 0) k = 1;   // a line taller than a page still takes one
    const line = j + k;
    if (line >= n) { i++; j = 0; if (i < units.length) br.push(units[i].base); used = 0; continue; }   // a guard: cannot happen while k < n - j
    br.push(u.base + (u.starts[line] ?? 0));
    used = 0;
    j = line;
  }
  return br;
}

/** The 1-based page (within its section) that holds clean offset `offset`: 1 + the breaks at or before it. Arithmetic, no layout. */
export function pageAt(breaks: readonly number[], offset: number): number {
  let lo = 0, hi = breaks.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (breaks[m] <= offset) lo = m + 1; else hi = m; }
  return 1 + lo;
}

// THE ONE LIST. `breaks` are the open section's clean offsets; `before` is the pages of the Doc's sections above it and `total` every section's
// pages (each section opens a fresh page, so the Doc counts on: section n's first page is before + 1). `page` is the caret's page in the Doc.
// The count, the marks and the sound all read this snapshot, so they can never disagree [pageBreaks §4]
export interface PageBreakState {
  /** The page entry this list belongs to (a list never outlives its page). */
  id: string | null;
  breaks: number[];
  /** Pages of the Doc's sections before this one (0 for a single page or the first section). */
  before: number;
  /** Pages in the whole Doc (this section's pages + every other section's). */
  total: number;
  /** The caret's page in the Doc (before + pageAt(breaks, caret)). */
  page: number;
  /** True when this section has a section above it: its first line then opens with a pair (spec §2). */
  sectionHead: boolean;
  /** Bumped whenever the breaks themselves change (the marks redraw on it; a caret move alone does not bump it). */
  version: number;
}

const EMPTY: PageBreakState = { id: null, breaks: [], before: 0, total: 1, page: 1, sectionHead: false, version: 0 };
let state: PageBreakState = EMPTY;
const listeners = new Set<() => void>();

export function getPageBreaks(): PageBreakState { return state; }
export function setPageBreaks(next: Omit<PageBreakState, 'version'> & { version?: number }): void {
  const sameBreaks = next.id === state.id && next.breaks.length === state.breaks.length && next.breaks.every((b, k) => b === state.breaks[k])
    && next.sectionHead === state.sectionHead;
  const version = sameBreaks ? state.version : state.version + 1;
  if (sameBreaks && next.before === state.before && next.total === state.total && next.page === state.page) return;
  state = { ...next, version };
  listeners.forEach((l) => l());
}
export function clearPageBreaks(id: string | null): void { if (state.id === id) { state = { ...EMPTY, version: state.version + 1 }; listeners.forEach((l) => l()); } }
export function subscribePageBreaks(l: () => void): () => void { listeners.add(l); return () => { listeners.delete(l); }; }

// Test/inspection seam (the pageTurnSound.ts pattern): a read of the one list, nothing writable.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoPageBreaks?: unknown }).wrizoPageBreaks = () => ({ ...state, breaks: state.breaks.slice() });
}
