import { getJournalEntries, getProject, getSystemKind } from './persistence';
import { getResumeTarget } from './resume';

// resume on open: one per-device localStorage key, not a collection (a flush can neither erase nor resurrect it), carrying its account id; three states, because "no pointer yet" and "decided: no place" differ [lastPlace §1]

const KEY = 'wz.lastPlace';

export type PlaceKind = 'page' | 'project';

export interface LastPlace {
  v: 1;
  uid: string;
  kind: PlaceKind | null;
  id: string | null;
  at: number;
}

/** What a cold open should do. `blank` = a fresh Free Write page (born on the first word). */
export type Landing = { kind: 'route'; route: string; place: PlaceKind; id: string } | { kind: 'blank' };

function readRaw(): LastPlace | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<LastPlace> | null;
    if (!p || p.v !== 1 || typeof p.uid !== 'string') return null;
    const kind = p.kind === 'page' || p.kind === 'project' ? p.kind : null;
    const id = typeof p.id === 'string' && p.id && kind ? p.id : null;
    return { v: 1, uid: p.uid, kind: id ? kind : null, id, at: typeof p.at === 'number' ? p.at : 0 };
  } catch {
    return null; // blocked storage or a malformed value: no pointer, never a crash
  }
}

function write(rec: LastPlace): void {
  try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch { /* blocked or full: the device simply does not remember */ }
}

/** The pointer for THIS account, or null (absent, or written for another account). */
export function readLastPlace(uid: string): LastPlace | null {
  const p = readRaw();
  return p && p.uid === uid ? p : null;
}

export function clearLastPlace(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear if storage is blocked */ }
}

/** Is this a surface that may be remembered? Live, and never a system board (Journal / Trash). */
export function isRememberable(kind: PlaceKind, id: string): boolean {
  if (!id || id === 'new') return false;
  if (kind === 'project') return getProject(id) != null;
  // A REAL, live row only. getJournalEntry falls through to the unborn slot (a page not yet born has no row to
  // return to), so it cannot be the test; getJournalEntries() is the non-deleted rows themselves.
  const e = getJournalEntries().find(x => x.id === id);
  return !!e && !getSystemKind(e);
}

/** Remember a place the writer has open. Quiet no-op for anything not rememberable. */
export function recordLastPlace(uid: string, kind: PlaceKind, id: string): boolean {
  if (!isRememberable(kind, id)) return false;
  const cur = readRaw();
  if (cur && cur.uid === uid && cur.kind === kind && cur.id === id) return true; // already the pointer: no write per render
  write({ v: 1, uid, kind, id, at: Date.now() });
  return true;
}

/** The route a place opens at (routeForEntry for a Page is /page/:id; a legacy project opens its overview). */
function routeFor(kind: PlaceKind, id: string): string {
  return kind === 'project' ? `/project/${id}` : `/page/${id}`;
}

// seed from the edited race, once, for a writer with no record at all; returns the record written [lastPlace §2]
function seed(uid: string): LastPlace {
  const t = getResumeTarget();
  const m = t ? /^\/(page|project)\/([^/?#]+)/.exec(t.route) : null;
  const rec: LastPlace = m && isRememberable(m[1] as PlaceKind, m[2])
    ? { v: 1, uid, kind: m[1] as PlaceKind, id: m[2], at: Date.now() }
    : { v: 1, uid, kind: null, id: null, at: Date.now() };
  write(rec);
  return rec;
}

// the cold-open decision: absent record - seed once, then decide; a pointer that no longer resolves, or "no place": a fresh blank Page, and the record becomes "decided: none" [lastPlace §3]
export function resolveLanding(uid: string): Landing {
  let rec = readLastPlace(uid);
  if (!rec) rec = seed(uid);
  if (rec.kind && rec.id && isRememberable(rec.kind, rec.id)) {
    return { kind: 'route', route: routeFor(rec.kind, rec.id), place: rec.kind, id: rec.id };
  }
  if (rec.id) write({ v: 1, uid, kind: null, id: null, at: Date.now() });
  return { kind: 'blank' };
}

// Test/inspection seams (the wrizoResume pattern). Never read by app code.
if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  w.wrizoRecordLastPlace = (uid: string, kind: PlaceKind, id: string) => recordLastPlace(uid, kind, id);
  w.wrizoLastPlace = () => readRaw();
  w.wrizoResolveLanding = (uid: string) => resolveLanding(uid);
}
