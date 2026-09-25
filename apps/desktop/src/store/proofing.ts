import type { ProofingRecord, ProofingDialect, ProofingWord } from '../types';
import { PROOFING_DEFAULT_DIALECT, PROOFING_TOMBSTONE_DAYS } from '../types';

// ITEM 204 PART 2 — THE PROOFING STORE: the writer's personal dictionary, their
// dialect, and harper's own ignore blob.
//
// ONE nullable jsonb column, `users.proofing`, on `users.page_defaults`' recipe —
// Nick's schema word ("1. Yes"), Fable's shape approval. Per WRITER, not per page,
// so it is not `pageSettings`; and deliberately NOT smuggled into `page_defaults`,
// which is the writer's starting DRESS and would be overloaded by a second concept.
//
// ⛔ THE ONE THING THIS FILE EXISTS TO GET RIGHT: `page_defaults`' recipe has a
// DESTRUCTIVE LINE, and it is not copied here.
//
//   `pageDefaults.ts:113` — `if (server) { defaults = server; writeLocal(server); }`
//
// That REPLACES the local copy on every boot. Correct for a dress written by one
// deliberate act from one place; catastrophic for a set edited on every device —
// it would destroy words added here and not yet pushed, every time the server's
// copy was older. So this store has NO `setFromServer`, and there is no way to
// spell one: the only way a remote record enters is `mergeRemote`, and the merge
// is commutative. Fable's ruling: *"the seam makes the destructive form
// unsayable."*
//
// CONVERGENCE (option A, ruled). Per-key merge on BOTH sides of the boundary: the
// client always GETs, merges, and PUTs the MERGED set; the boot pull merges and
// never replaces. An LWW-element-set over `words`, keyed lower-cased, stamped.
//
// ⚠ THE RESIDUAL, NAMED AND OWED TO THE OFFER: a word can be briefly MISSING on
// another device until the device that added it syncs again. It is not lost — each
// device retains its own additions, so the next GET-merge-PUT re-contributes them.
// It is lost permanently only if that device loses local storage first, which
// includes signing out (see `clearProofingLocal`, below — ruled: a signed-out
// device keeps nothing of the writer's).

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
export function mergeProofing(a: ProofingRecord | null, b: ProofingRecord | null): ProofingRecord {
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

  // The scalars: later-wins is not available (they carry no stamp of their own),
  // so the INCOMING value wins when it is non-empty. `ignored` is opaque and must
  // never be merged per-key — the design: "an ignore is a convenience, never
  // data." A stale blob is harmless because it matches nothing.
  return compactProofing({
    dialect: b.dialect || a.dialect || PROOFING_DEFAULT_DIALECT,
    words,
    ignored: b.ignored || a.ignored || '',
    engine: b.engine || a.engine || '',
  });
}

function lastActAt(w: ProofingWord): string {
  return w.removedAt && w.removedAt > w.addedAt ? w.removedAt : w.addedAt;
}

/**
 * COMPACTION, NOT A CAP (Fable's ruling). A `removedAt` older than 180 days is
 * dropped entirely.
 *
 * Why compaction rather than a cap: a cap on a SET silently loses the writer's
 * OLDEST WORDS, which are the ones they are least likely to notice going. A
 * tombstone's whole job is to expire, so expiring it is the honest bound.
 *
 * ⚠ THE CONSEQUENCE, NAMED: a device offline longer than 180 days can bring a
 * removed word BACK, because the tombstone that would have suppressed it is gone.
 * Ruled benign — the writer removes it again — and named here rather than
 * discovered.
 */
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

/**
 * Signing out takes the dictionary with it — Fable's ruling: *"a signed-out device
 * keeps nothing of the writer's; it goes out the same way every other writer
 * record does."* Called from `resetLocalData`.
 *
 * ⚠ This is the one place the residual above becomes real loss: words added on
 * this device and never pushed go out with it. That is the ruled trade, and the
 * alternative (one account's dictionary outliving its session on a shared device)
 * was the worse one.
 */
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
  current = { ...current, dialect };
  writeLocal(current);
  notify();
  return current;
}

/** harper's own export, stored opaque with the version that wrote it. */
export function setProofingIgnored(ignored: string, engine: string): ProofingRecord {
  current = { ...current, ignored, engine };
  writeLocal(current);
  notify();
  return current;
}

// --- the boundary -------------------------------------------------------

/**
 * GET, MERGE, PUT THE MERGED SET — the ruled shape, in one function so the three
 * steps cannot be performed separately or in the wrong order.
 *
 * Used for the boot pull AND for pushing a local change: because the merge is
 * commutative and idempotent, there is only one operation here, not two.
 */
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
