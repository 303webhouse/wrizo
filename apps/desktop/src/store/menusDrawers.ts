import { useSyncExternalStore } from 'react';

// the two-drawer law: coexistence is a decision about both drawers, so it lives in one store (the useSyncExternalStore pub-sub shape); measuring here is a policy, not an anchor [menusDrawers §1]

// the page's two hands (tools, tutor) are now MEASURED too (see canHoldBoth below) [menusDrawers §2]
export type DrawerId = 'cascade' | 'tools' | 'tutor';

/** Which drawers believe they stand open (so the always-exclusive pair can find its rival without measuring anything). */
const stands = new Set<DrawerId>();

let openDrawer: DrawerId | null = null;      // whichever most recently opened
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

/** Widths are read from the rendered boxes where possible; these are only the
 *  fallbacks for a drawer that is currently closed (and so has no width to
 *  measure). They mirror the CSS, and are used ONLY by the policy test — never
 *  to place anything. */
const CLOSED_TOOLS_W = 200;   // .wz-sliver open width (panel + grip)
const CLOSED_CASCADE_W = 300; // .wz-cascade-panel width:min(300px, 86vw)

function measuredWidth(sel: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const el = document.querySelector(sel);
  if (!el) return fallback;
  const w = el.getBoundingClientRect().width;
  return w > 1 ? w : fallback;
}

/**
 * Can both drawers stand open on this surface, at this instant?
 * Reads rendered geometry only. Returns true when nothing is measurable yet
 * (first paint) so the policy never closes a drawer on missing information —
 * a wrong "no" is visible to the writer, a wrong "yes" self-corrects on the
 * next layout pass.
 */
// the paper, per surface: name the box the writer SEES (.mode-page, .board-canvas-wrap, .script-sheet), single-sourced with scripts/menus-probe.mjs; naming the wrong box disabled the law on screenplay [menusDrawers §3]
const PAPER_SEL = '.mode-page, .board-canvas-wrap, .script-sheet';

export function canCoexist(): boolean {
  if (typeof document === 'undefined') return true;
  const paper = document.querySelector(PAPER_SEL);
  const rail = document.querySelector('.desk-frame-strip');
  if (!paper || !rail) return true;

  const paperBox = paper.getBoundingClientRect();
  const railBox = rail.getBoundingClientRect();

  // the measurement must prove itself before its answer counts: the permissive answer only when the boxes are laid out, never inferred from the band's sign [menusDrawers §4]
  const laidOut = paperBox.width > 0 && paperBox.height > 0
    && railBox.width > 0 && railBox.height > 0;
  if (!laidOut) return true;   // measurement failed — say yes, self-corrects next pass

  const band = paperBox.left - railBox.right;
  if (!Number.isFinite(band)) return true;   // measurement failed — same reason

  // Measured, and real. A band at or below zero is a surface whose paper
  // begins at or before the rail's own right edge — a full-bleed canvas has
  // no room to give, and 'no room' is a NO, not a shrug. This is the branch
  // the old code lacked: it returned TRUE here, which said 'they may coexist'
  // when the honest reading was 'there is no room at all'.
  if (band <= 0) return false;

  const tools = measuredWidth('.wz-sliver[data-open="true"]', CLOSED_TOOLS_W);
  const cascade = measuredWidth('.wz-cascade-panel[data-visible="true"]:not([data-leaving])', CLOSED_CASCADE_W)   // a pop-out that is EXITING (data-leaving) no longer occupies the band [menusDrawers §5]
  return band >= tools + cascade;
}

// the page's two hands, measured: both stand where there is DRAWER_MIN of desk on each side of the paper, else the later closes the other; the page never moves, so it reads the same open or shut; a failed measurement says yes [menusDrawers §6]
export const DRAWER_MIN = 200;   // a drawer's narrowest open width, px - page-size.mjs and the drawer harnesses read the same number
export function canHoldBoth(): boolean {
  if (typeof document === 'undefined') return true;
  const paper = document.querySelector(PAPER_SEL);
  const stage = document.querySelector('.desk-frame-stage');
  if (!paper || !stage) return true;
  const p = paper.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  if (!(p.width > 0 && p.height > 0 && s.width > 0 && s.height > 0)) return true;   // not laid out yet
  const left = p.left - s.left;
  const right = s.right - p.right;
  if (!Number.isFinite(left) || !Number.isFinite(right)) return true;
  return left >= DRAWER_MIN && right >= DRAWER_MIN;
}

// each drawer registers its own close path, so the exclusion handoff animates with exactly the slide it uses when closed on its own [menusDrawers §7]
const closers = new Map<DrawerId, () => void>();

export function registerDrawer(id: DrawerId, close: () => void): () => void {
  closers.set(id, close);
  return () => { if (closers.get(id) === close) closers.delete(id); };
}

/**
 * Announce that `id` is opening. If the other drawer stands and the band
 * cannot hold both, the other is closed through its own path. Returns the
 * drawer that yielded, or null when both may stand.
 */
export function requestOpen(id: DrawerId): DrawerId | null {
  // the rival yields only where the page and both hands do not fit; the guard's text is exact: one-drawer.mjs's mutants anchor on it [menusDrawers §8]
  let yielded: DrawerId | null = null;
  if (id === 'tools' || id === 'tutor') {
    const rival: DrawerId = id === 'tools' ? 'tutor' : 'tools';
    if (stands.has(rival) && !canHoldBoth()) { stands.delete(rival); closers.get(rival)?.(); yielded = rival; }
  }
  // the far-left cascade against the Tools drawer: the width-measured law, exactly as before
  let mustClose: DrawerId | null = null;
  if (id !== 'tutor') {
    const other: DrawerId = id === 'cascade' ? 'tools' : 'cascade';
    // `stands`, not `openDrawer`: openDrawer is only the MOST RECENT opener, so after cascade -> Tutor -> Tools it reads 'tutor' and the width law would never see the cascade still standing.
    mustClose = stands.has(other) && !canCoexist() ? other : null;
    if (mustClose) { stands.delete(mustClose); closers.get(mustClose)?.(); }
  }
  stands.add(id);
  openDrawer = id;
  notify();
  return yielded ?? mustClose;
}

export function noteClosed(id: DrawerId): void {
  const had = stands.has(id);
  stands.delete(id);
  if (openDrawer === id) { openDrawer = null; notify(); }
  else if (had) notify();   // a hand that stood and closed is news to useStandingHands, even when it was not the latest opener [menusDrawers §9]
}

/** PAGE-SIZE (spec point 3) - the zoom TUCKS the page's two hands: each closes through its OWN registered path (the same slide it uses when
 *  closed by hand), and each path notes its own close back here. A hand already shut is asked nothing. The grips stay; the writer may reopen. */
export function tuckDrawers(): void {
  for (const id of ['tools', 'tutor'] as const) {
    if (stands.has(id)) closers.get(id)?.();
  }
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const getSnapshot = (): DrawerId | null => openDrawer;

export function useOpenDrawer(): DrawerId | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// which of the page's two hands stand open (the board narrows beside them); a string snapshot so the store's identity is stable between changes [menusDrawers §10]
const getHands = (): string => (stands.has('tools') ? 'T' : '') + (stands.has('tutor') ? 'U' : '');
export function useStandingHands(): { tools: boolean; tutor: boolean } {
  const h = useSyncExternalStore(subscribe, getHands);
  return { tools: h.includes('T'), tutor: h.includes('U') };
}
