import type { ProofingRecord, ProofingDialect, ProofingWord } from '../types';
import { PROOFING_DEFAULT_DIALECT, PROOFING_TOMBSTONE_DAYS } from '../types';

// the proofing store: one nullable jsonb column, users.proofing, per writer; no setFromServer exists - a remote enters only through the commutative mergeRemote, so words added here are never replaced [proofing §1]

const KEY = 'writer-studio-proofing';

/** The empty record. A writer who has never proofed has no column value at all. */
export function emptyProofing(): ProofingRecord {
  return { dialect: PROOFING_DEFAULT_DIALECT, words: {}, ignored: '', engine: '' };
}

// --- the merge -----------------------------------------------------------

/**
 * LWW-element-set over `words`, plus whole-value last-writer-wins for the three
 * scalars. COMMUTATIVE and IDEMPOTENT: merge(a,b) and merge(b,a) agree, and
 * merging a record with itself changes nothing. That is what lets the same
 * function serve the boot pull AND the pre-push step without a second code path.
 *
 * A word's later stamp wins, so a re-ADD after a remove beats the tombstone and a
 * remove after an add beats the entry — whichever the writer did last.
 */
export function mergeProofing(aIn: ProofingRecord | null, bIn: ProofingRecord | null): ProofingRecord {
  // a malformed remote record merges as null: the server does not validate a shape the client owns [proofing §2]
  const a = isProofingRecord(aIn) ? aIn : null;
  const b = isProofingRecord(bIn) ? bIn : null;
  if (!a) return b ? compactProofing(b) : emptyProofing();
  if (!b) return compactProofing(a);

  const words: Record<string, ProofingWord> = { ...a.words };
  for (const [key, theirs] of Object.entries(b.words)) {
    const mine = words[key];
    if (!mine) { words[key] = theirs; continue; }
    // The stamp that decides is the LATER of each side's own last act — an add or
    // a remove, whichever came last on that side.
    words[key] = lastActAt(theirs) > lastActAt(mine) ? theirs : mine;
  }

  // scalars merge later-wins by stamp, and a stamped winner's value is taken as-is, '' included (a clear is a write); the fallback chain only for an unstamped record; a tie is broken by value, so the merge commutes [proofing §3]
  const pickSide = (
    aAt: string | undefined, bAt: string | undefined,
    aVal: string, bVal: string,
    aTie = '', bTie = '',
  ): 'a' | 'b' => {
    const aS = aAt ?? '';
    const bS = bAt ?? '';
    if (aS !== bS) return bS > aS ? 'b' : 'a';
    if (aVal !== bVal) return bVal > aVal ? 'b' : 'a';
    return bTie > aTie ? 'b' : 'a';
  };
  const dSide = pickSide(a.dialectAt, b.dialectAt, a.dialect, b.dialect);
  const iSide = pickSide(a.ignoredAt, b.ignoredAt, a.ignored, b.ignored, a.engine, b.engine);
  const dWin = dSide === 'b' ? b : a;
  const iWin = iSide === 'b' ? b : a;
  const dLose = dSide === 'b' ? a : b;
  const iLose = iSide === 'b' ? a : b;
  return compactProofing({
    // A stamped winner is authoritative, empty or not. Unstamped, fall back.
    dialect: dWin.dialectAt
      ? dWin.dialect
      : (dWin.dialect || dLose.dialect || PROOFING_DEFAULT_DIALECT),
    dialectAt: dWin.dialectAt ?? dLose.dialectAt,
    words,
    ignored: iWin.ignoredAt ? iWin.ignored : (iWin.ignored || iLose.ignored || ''),
    engine: iWin.ignoredAt ? iWin.engine : (iWin.engine || iLose.engine || ''),
    ignoredAt: iWin.ignoredAt ?? iLose.ignoredAt,
  });
}

// is this actually a proofing record? Shallow: it checks the shape the merge depends on; a bad entry only loses a comparison [proofing §4]
export function isProofingRecord(v: unknown): v is ProofingRecord {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.dialect !== 'string') return false;
  if (!r.words || typeof r.words !== 'object' || Array.isArray(r.words)) return false;
  return true;
}

function lastActAt(w: ProofingWord): string {
  return w.removedAt && w.removedAt > w.addedAt ? w.removedAt : w.addedAt;
}

// compaction, not a cap: a removedAt older than 180 days is dropped (a cap would lose the oldest words); a device offline longer can bring a removed word back [proofing §5]
export function compactProofing(rec: ProofingRecord): ProofingRecord {
  const cutoff = Date.now() - PROOFING_TOMBSTONE_DAYS * 24 * 60 * 60 * 1000;
  const words: Record<string, ProofingWord> = {};
  for (const [key, w] of Object.entries(rec.words)) {
    if (w.removedAt && Date.parse(w.removedAt) < cutoff) continue;
    words[key] = w;
  }
  return { ...rec, words };
}

/** The live word set, tombstones excluded — what a read-time drop consults. */
export function proofingWordSet(rec: ProofingRecord | null): Set<string> {
  const out = new Set<string>();
  for (const [key, w] of Object.entries(rec?.words ?? {})) {
    if (!w.removedAt || w.removedAt <= w.addedAt) out.add(key);
  }
  return out;
}

// --- the local mirror ----------------------------------------------------

let current: ProofingRecord = readLocal();
const listeners = new Set<() => void>();

function readLocal(): ProofingRecord {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return emptyProofing();
    const parsed = JSON.parse(raw) as Partial<ProofingRecord>;
    return compactProofing({ ...emptyProofing(), ...parsed, words: parsed.words ?? {} });
  } catch {
    return emptyProofing();
  }
}

function writeLocal(rec: ProofingRecord): void {
  try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch { /* storage full/blocked */ }
}

function notify(): void { listeners.forEach(fn => fn()); }

export function getProofing(): ProofingRecord { return current; }

export function subscribeProofing(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * ⛔ THE ONLY DOOR A REMOTE RECORD COMES THROUGH. There is deliberately no
 * `setProofing`/`setFromServer`: see this file's header. A caller cannot replace
 * the local set even by mistake, because nothing here accepts a replacement.
 */
export function mergeRemote(remote: ProofingRecord | null): ProofingRecord {
  current = mergeProofing(current, remote);
  writeLocal(current);
  notify();
  return current;
}

// signing out takes the dictionary with it (called from resetLocalData); unpushed words on this device go with it [proofing §6]
export function clearProofingLocal(): void {
  current = emptyProofing();
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  notify();
}

// --- the writer's own acts ----------------------------------------------

/** Add a word. The key is lower-cased for matching; the writer's casing is kept. */
export function addProofingWord(word: string): ProofingRecord {
  const trimmed = word.trim();
  if (!trimmed) return current;
  const key = trimmed.toLowerCase();
  const now = new Date().toISOString();
  // An add after a remove drops the tombstone by being the later act.
  current = compactProofing({
    ...current,
    words: { ...current.words, [key]: { display: trimmed, addedAt: now } },
  });
  writeLocal(current);
  notify();
  return current;
}

/** Remove a word — a TOMBSTONE, not a delete, or the merge stops being a set. */
export function removeProofingWord(word: string): ProofingRecord {
  const key = word.trim().toLowerCase();
  const existing = current.words[key];
  if (!existing) return current;
  const now = new Date().toISOString();
  current = { ...current, words: { ...current.words, [key]: { ...existing, removedAt: now } } };
  writeLocal(current);
  notify();
  return current;
}

export function setProofingDialect(dialect: ProofingDialect): ProofingRecord {
  // Stamped, or the merge cannot tell this choice from the server's older one.
  current = { ...current, dialect, dialectAt: new Date().toISOString() };
  writeLocal(current);
  notify();
  return current;
}

/** harper's own export, stored opaque with the version that wrote it. */
export function setProofingIgnored(ignored: string, engine: string): ProofingRecord {
  current = { ...current, ignored, engine, ignoredAt: new Date().toISOString() };
  writeLocal(current);
  notify();
  return current;
}

// --- the boundary -------------------------------------------------------

// get, merge, put the merged set, in one function so the steps cannot be split or reordered; the merge is commutative and idempotent, so boot pull and push are one operation [proofing §7]
export async function syncProofing(): Promise<ProofingRecord> {
  let remote: ProofingRecord | null = null;
  try {
    const r = await fetch('/api/proofing', { credentials: 'include' });
    if (r.ok) remote = ((await r.json())?.proofing ?? null) as ProofingRecord | null;
  } catch {
    // Offline: the local mirror governs and the next call re-merges. Nothing is
    // replaced, so there is nothing to lose by failing here.
    return current;
  }
  const merged = mergeRemote(remote);
  try {
    await fetch('/api/proofing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ proofing: merged }),
    });
  } catch { /* offline: the merged local copy stands and pushes next time */ }
  return merged;
}
