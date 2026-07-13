// W2 — the way back. A session-scoped (sessionStorage, one slot) capture of
// the last writing session a departure left behind, so a later return can
// restore more than the route: scroll, caret, and mode. Session-scoped by
// design (docs/w2-way-back-brief.md) — a way back is a live thread, not a
// bookmark; it never survives an app restart and there is no history (the
// most recent departure always wins — "opening a different writing surface
// replaces the slot").
//
// S0 finding (confirmed by code inspection, no separate empirical harness
// step): before W2, browser/router back-navigation restores the ROUTE (React
// Router's own history) but nothing else — no surface anywhere persisted
// scroll position or caret offset across an unmount. This module is the fix.
//
// Fable W2-review advisory A3 (2026-07-13): a reload on a non-writing route
// preserves the chip, since sessionStorage survives a same-tab reload. Judged
// CORRECT, not a bug — the "live thread" should survive a refresh; it dies
// with the tab. Recorded here so this isn't "fixed" by a future pass.

export interface WayBackSession {
  entryId: string;
  route: string;
  scrollY?: number;    // omitted for board/script (S1: route + mount only — their own view state persists through their own stores)
  caret?: number;      // text surfaces only (PageEditor text delegate, QuickSprint, JournalEntry authored)
  mode?: string;       // informational; PageEditor/QuickSprint already persist mode per-page independently (wrizo-mode-page-<id>) — this is not the restore path for it
  capturedAt: number;
}

const KEY = 'wrizo-way-back';

export function captureWayBack(session: WayBackSession): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch { /* best-effort */ }
}

export function getWayBack(): WayBackSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WayBackSession) : null;
  } catch { return null; }
}

export function clearWayBack(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* best-effort */ }
}

// A writing-surface route — the chip must never render while already ON one
// (departing FROM it is the only way a way back gets created). Excludes
// /journal/spread explicitly: it shares the /journal/:id shape textually but
// is a list view, not a writing surface.
export function isWritingRoute(pathname: string): boolean {
  if (pathname === '/sprint') return true;
  if (/^\/project\/[^/]+\/sprint$/.test(pathname)) return true;
  if (/^\/page\/[^/]+$/.test(pathname)) return true;
  if (pathname.startsWith('/journal/') && pathname !== '/journal/spread') return true;
  return false;
}
