import { getJournalEntry, getSystemKind } from './persistence';

// the way back: one session-scoped slot (sessionStorage) for scroll, caret and mode; the latest departure wins; a same-tab reload keeps the chip, by design [wayBack §1]

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
//
// B1 — a genuine defect found live while repairing this ticket's own
// harness (w2.mjs): every '/page/:id' route counted as "writing" here,
// unconditionally — harmless before this ticket (a system Board didn't
// exist, so '/journal' — departing TO the Journal — was always a plain,
// never-"writing" list route, and the chip reliably showed there). Now
// '/journal' redirects to a REAL '/page/:id' (the Journal Board), which a
// bare regex can't distinguish from a genuine prose page — silently
// suppressing a chip that had always shown on arrival. Scoped to SYSTEM
// Boards only (getSystemKind) — a deliberately narrow fix: an ordinary
// user Board's own existing "counts as writing" behavior is untouched,
// out of this ticket's scope and unverified against every other harness
// file's own assumptions about it.
export function isWritingRoute(pathname: string): boolean {
  if (pathname === '/sprint') return true;
  if (/^\/project\/[^/]+\/sprint$/.test(pathname)) return true;
  const pageMatch = pathname.match(/^\/page\/([^/]+)$/);
  if (pageMatch) return getSystemKind(getJournalEntry(pageMatch[1])) === undefined;
  if (pathname.startsWith('/journal/') && pathname !== '/journal/spread') return true;
  return false;
}
