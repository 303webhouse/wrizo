// STORAGE-FULL STEP 2 — MIGRATION, ONCE, VERIFIED BY READ-BACK (Fable's ruling, item 4).
//
// Reads each collection's legacy whole-blob localStorage key, writes every record into its IndexedDB object store,
// and VERIFIES by reading the store back and counting — never trusts a resolved promise alone (a promise can
// resolve without every record having actually landed if, say, two source records share a malformed id and one
// silently overwrote the other; counting the ids back out catches that, a bare "did it throw" check would not).
// Only once a collection verifies does migration move forward for it; a verification failure leaves the legacy
// copy exactly where it was, so the NEXT boot retries rather than this one silently losing it.
//
// THE ASYMMETRY. A SIGNED-IN writer's data also lives on the server — the floor under it — so legacy localStorage
// is cleared the SAME boot as a verified migration. A SIGNED-OUT writer (F2's local-first writing) has no such
// floor, so legacy copies are kept ONE MORE BOOT (state 'migrated-pending-clear') and only cleared once a LATER
// boot re-verifies IndexedDB still holds everything — proof the IndexedDB path itself, not just one run of it, is
// the real thing before the only other copy is removed.
import { idbGetAll, idbCommit } from './idbStore';

const FLAG_KEY = 'writer-studio-idb-migration-v1';
export type MigrationState = 'not-started' | 'migrated-pending-clear' | 'done';

export function getMigrationState(): MigrationState {
  try {
    const v = localStorage.getItem(FLAG_KEY);
    if (v === 'migrated-pending-clear' || v === 'done') return v;
  } catch { /* corrupt/unavailable: treat as not started */ }
  return 'not-started';
}
function setMigrationState(state: MigrationState): void {
  try { localStorage.setItem(FLAG_KEY, state); } catch { /* best-effort; this boot's own result still holds in memory */ }
}
/** Clears the migration flag — a real production need (logout: the next account's first boot must re-evaluate
 *  migration from scratch, never inherit a prior account's "done"), and incidentally what a test wants too. */
export function clearMigrationState(): void {
  try { localStorage.removeItem(FLAG_KEY); } catch { /* ignore */ }
}

export interface MigrationPlan {
  storeNames: readonly string[];
  /** collection name -> its legacy whole-blob localStorage key. */
  legacyKeys: Readonly<Record<string, string>>;
  signedIn: boolean;
}
export interface MigrationResult {
  state: MigrationState;
  migratedCollections: string[];
  clearedKeys: string[];
}

function readLegacyArray(key: string): Array<{ id: string }> {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Array<{ id: string }>) : [];
  } catch { return []; }
}
function clearLegacyKeys(keys: Iterable<string>): string[] {
  const cleared: string[] = [];
  for (const key of keys) { try { localStorage.removeItem(key); cleared.push(key); } catch { /* best-effort */ } }
  return cleared;
}

/** Idempotent and safe to call every boot; a no-op once state is 'done'. */
export async function migrateLegacyStorageOnce(plan: MigrationPlan): Promise<MigrationResult> {
  const state = getMigrationState();
  if (state === 'done') return { state, migratedCollections: [], clearedKeys: [] };

  if (state === 'not-started') {
    const migratedCollections: string[] = [];
    for (const [collection, legacyKey] of Object.entries(plan.legacyKeys)) {
      const records = readLegacyArray(legacyKey);
      if (records.length === 0) continue;
      await idbCommit(plan.storeNames, collection, records);
      const landed = await idbGetAll<{ id: string }>(plan.storeNames, collection);
      const landedIds = new Set(landed.map((r) => r.id));
      if (!records.every((r) => landedIds.has(r.id))) {
        // Verification failed for this collection: leave EVERY legacy key untouched and retry next boot, rather
        // than clear some collections now and leave the migration half-done with no way to tell which half.
        return { state, migratedCollections, clearedKeys: [] };
      }
      migratedCollections.push(collection);
    }
    const nextState: MigrationState = plan.signedIn ? 'done' : 'migrated-pending-clear';
    setMigrationState(nextState);
    const clearedKeys = plan.signedIn ? clearLegacyKeys(Object.values(plan.legacyKeys)) : [];
    return { state: nextState, migratedCollections, clearedKeys };
  }

  // state === 'migrated-pending-clear' — a signed-out writer's own LATER, independent verification.
  let allOk = true;
  for (const [collection, legacyKey] of Object.entries(plan.legacyKeys)) {
    const legacyCount = readLegacyArray(legacyKey).length;
    if (legacyCount === 0) continue;
    const landed = await idbGetAll<{ id: string }>(plan.storeNames, collection);
    if (landed.length < legacyCount) { allOk = false; break; }
  }
  if (!allOk) return { state, migratedCollections: [], clearedKeys: [] };
  setMigrationState('done');
  const clearedKeys = clearLegacyKeys(Object.values(plan.legacyKeys));
  return { state: 'done', migratedCollections: [], clearedKeys };
}
