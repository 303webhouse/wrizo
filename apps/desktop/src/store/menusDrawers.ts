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

export type DrawerId = 'cascade' | 'tools';

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
export function canCoexist(): boolean {
  if (typeof document === 'undefined') return true;
  const paper = document.querySelector('.mode-page, .board-canvas, .script-page');
  const rail = document.querySelector('.desk-frame-strip');
  if (!paper || !rail) return true;

  const band = paper.getBoundingClientRect().left - rail.getBoundingClientRect().right;
  if (!Number.isFinite(band) || band <= 0) return true;

  const tools = measuredWidth('.wz-sliver[data-open="true"]', CLOSED_TOOLS_W);
  const cascade = measuredWidth('.wz-cascade-panel', CLOSED_CASCADE_W);
  return band >= tools + cascade;
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
  const other: DrawerId = id === 'cascade' ? 'tools' : 'cascade';
  const mustClose = openDrawer === other && !canCoexist() ? other : null;
  if (mustClose) closers.get(mustClose)?.();
  openDrawer = id;
  notify();
  return mustClose;
}

export function noteClosed(id: DrawerId): void {
  if (openDrawer === id) { openDrawer = null; notify(); }
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
const getSnapshot = (): DrawerId | null => openDrawer;

export function useOpenDrawer(): DrawerId | null {
  return useSyncExternalStore(subscribe, getSnapshot);
}
