import { useSyncExternalStore } from 'react';

// ITEM 83 M1 — THE TWO-DRAWER LAW (R9, re-derived by R11 for opposite anchors).
//
// Nick's ruling, verbatim: "we want the menu thin enough that on a wider
// desktop screen, both the left-hand menu tabs (like Page, Plan, etc.) can be
// open at the same time as the Tools menu sliver without overlapping. On a
// smaller laptop or tablet screen, the tabs should close the other if they
// would overlap if they are both open. When one 'drawer' is opened, the other
// closes with the same animated effects as when they are opened/closed
// independently."
//
// WHY A STORE AT ALL. The two drawers own independent local state in two
// unrelated components (Cascade.tsx's `useCascade`, Sliver.tsx's `open`), and
// neither can see the other. Coexistence is a decision ABOUT BOTH, so it needs
// one place to live. This is the same tiny pub-sub shape as
// deskFrameActive.ts, and it uses useSyncExternalStore for the same reason
// that file documents at length: a consumer that mounts in the same commit as
// a writer must not miss the notification.
//
// WHY THIS MEASURES, AND WHY THAT IS LAWFUL. The wave's constitutional law is
// ANCHORS ARE LAYOUT; A POLICY QUESTION MAY MEASURE, AN ANCHOR MAY NOT.
// Nothing here positions anything — the dock is anchored by CSS against the
// paper, the cascade panel by CSS against the rail. What this file decides is
// only WHETHER BOTH MAY BE OPEN, which is a policy question about the room
// that remains, and the only honest way to answer it is to ask the rendered
// boxes. It reads the paper's and the rail's real rects; it never re-derives
// where they are from a formula, which is precisely the failure this wave was
// called to remove (a hand-synced `--sliver-paper-half` that duplicated
// `.mode-pagecol`'s width and drifted from it).
//
// THE THRESHOLD. Both drawers live in the band between the rail's right edge
// and the paper's left edge. The Tools drawer is paper-mounted and opens
// LEFTWARD (handle + body); the cascade drawer is rail-mounted and opens
// RIGHTWARD. They coexist exactly when the band holds both:
//     paper.left − rail.right  >=  handleW + toolsW + cascadeW
// Measured, every layout pass, at whatever the surface actually renders.

// PHASE 1 (Fable, Oct 12) - ONE DRAWER AT A TIME, AT EVERY WIDTH, for the page's own two hands: the Tools drawer (left, 'tools') and the Tutor drawer (right,
// 'tutor'). Opening either closes the other, through the other's own close path (so it leaves with the slide it uses when closed independently). This is NOT the
// width-measured law below, which still governs the far-left cascade against the Tools drawer: that one asks whether the band holds both; this one never asks.
// SUPERSEDED (page-size, Fable's ruling Oct 23): the two hands are now MEASURED too - see canHoldBoth below. Phase 1's text above is kept as the record.
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
/**
 * THE PAPER, PER SURFACE — single-sourced with scripts/menus-probe.mjs.
 *
 * item 83 errata E1 (2026-08-28). This list used to read
 * `.mode-page, .board-canvas, .script-page`, and BOTH of its non-prose
 * entries named a box the writer never sees:
 *
 *   - `.board-canvas` is the element INSIDE `.board-canvas-wrap`'s 1px
 *     border. The dock is anchored against the WRAP, so the policy was
 *     measuring a different box from the one the anchor is verified against.
 *   - `.script-page` is the screenplay's outer wrapper, and on the FRAMED
 *     screenplay surface it does not render at all. `querySelector` returned
 *     null, `canCoexist` took its `!paper` early return, and the two-drawer
 *     law was therefore DISABLED OUTRIGHT on screenplay — measured, not
 *     inferred: the diagnostic read `OLD l=undefined band=null` at both
 *     reference widths while `.script-sheet` read a real band of 191/348px.
 *
 * The probe's own comment records that naming the wrong box has caught this
 * project three times. The rule it landed on is the rule here: NAME THE BOX
 * THE WRITER SEES, NOT THE NEAREST ONE WITH A MATCHING CLASS.
 */
const PAPER_SEL = '.mode-page, .board-canvas-wrap, .script-sheet';

export function canCoexist(): boolean {
  if (typeof document === 'undefined') return true;
  const paper = document.querySelector(PAPER_SEL);
  const rail = document.querySelector('.desk-frame-strip');
  if (!paper || !rail) return true;

  const paperBox = paper.getBoundingClientRect();
  const railBox = rail.getBoundingClientRect();

  // THE MEASUREMENT MUST PROVE ITSELF BEFORE ITS ANSWER COUNTS.
  //
  // Fable's ruling on this repair, and its first law: THE FIX MUST NOT HIDE
  // A FAILED MEASUREMENT BEHIND A FULL-BLEED CANVAS. A box that has not been
  // laid out yet reports 0x0, and a band computed from one means nothing. So
  // the permissive answer is reached ONLY by proving the boxes are real —
  // never by inferring it from the band's sign, which is exactly how a
  // failed measurement would come to wear a full-bleed canvas's clothes.
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
  const cascade = measuredWidth('.wz-cascade-panel[data-visible="true"]', CLOSED_CASCADE_W);
  return band >= tools + cascade;
}

/**
 * PAGE-SIZE (Fable's ruling, Oct 23) - THE PAGE'S TWO HANDS, MEASURED. This REPLACES Phase 1's "one drawer at a time, at every width" (Oct 12) with
 * Nick's own original ask in this file's header: on a screen with room, both stand; where they would crowd the page, the later one closes the other.
 * "Room" is the desk on EACH side of the page the writer sees: at least DRAWER_MIN of it left of the paper (the Tools drawer's side) AND right of it (the
 * Tutor's), inside the stage. The page never moves for either drawer (page primacy), so this reads the same whether they are open or shut. Same posture
 * as canCoexist above: a failed measurement says YES (it self-corrects on the next pass; a wrong NO is visible to the writer).
 */
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

/** Each drawer registers its OWN close path here on mount. The exclusion
 *  handoff then calls that path rather than reimplementing a close, so the
 *  displaced drawer animates with exactly the slide it uses when closed
 *  independently — Nick's "with the same animated effects" is satisfied by
 *  reusing the path, not by copying its timing. */
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
  // the page's two hands: MEASURED (page-size, Oct 23) - the rival yields only where the page and both hands do not fit (canHoldBoth). The guard's text
  // is exact: one-drawer.mjs's mutants anchor on it.
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
  stands.delete(id);
  if (openDrawer === id) { openDrawer = null; notify(); }
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
