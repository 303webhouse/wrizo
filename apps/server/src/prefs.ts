// THE REORG'S ACCOUNT PREFERENCES, the server's rules (FIX; Nick's SAVED DATA ruling, Nov 19, 4:05 pm: "split side/width, linked-assets toggle, last search word, own
// templates = account prefs (users.prefs jsonb, ONE migration, which Fable reads before it ships)"; Fable, Nov 19, 7:00 pm: "a NEW users.prefs jsonb column with its own
// GET/PUT, built the way 26b built users.rail and /api/rail, NOT inside rail: its PUT replaces the whole blob").
//
// Where it lives: `users.prefs`, one nullable jsonb column, and nothing else. Its own door, GET/PUT /api/prefs, so a rail write and a prefs write never meet: each is a
// whole-blob compare-and-swap of its own column, and neither can replace the other's facts.
//
// THE MERGE IS THE CLIENT'S (apps/desktop/src/reorg/prefsSaved.ts), exactly as the rail's and proofing's are: every preference is its own FACT with its own stamp (`at`), and
// the client GETs, merges and PUTs the merged record. What the server owns is what the client cannot be trusted with:
//   1. COMPARE-AND-SWAP. A PUT carries the value it merged against (`base`); the write lands only if the stored value still equals it, or the answer is 409 and the client
//      fetches, merges and tries again. Two devices can then never interleave a GET and a PUT and drop one's acts.
//   2. THE SHAPE. A record is a map of facts; a fact is a map with a stamp (`at`, an ISO time). Anything else is refused 400, so a made-up client cannot park junk in the column.
//   3. THE SIZE. 128 KB at most (own templates are the largest thing a fact will ever hold), 413 beyond it.
//
// No database here: the SQL is behind PrefsStore (prefsRoutes.ts), so these rules run unchanged in the browserless check
// (apps/desktop/scripts/harness/writing-audit/reorg-prefs-saved.mjs) against an in-memory store.

export const PREFS_MAX_BYTES = 128 * 1024;
/** A fact's name: a short camel-case word (split, linkedAssets, searchWord, templates ...). New preferences need no server change. */
const FACT_RE = /^[a-z][A-Za-z0-9]{0,31}$/;
export const PREFS_MAX_FACTS = 32;

export interface PrefsStore {
  getPrefs(userId: string): Promise<unknown | null>;
  /** Writes `next` only if the stored value equals `base` (null = never set). True when it wrote. */
  casPrefs(userId: string, base: unknown | null, next: unknown | null): Promise<boolean>;
}

export interface Reply { status: number; json?: unknown }

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isStamp = (v: unknown): boolean => typeof v === 'string' && v !== '' && !Number.isNaN(Date.parse(v));

/** A record is a map of facts, each fact a map carrying its own stamp. The client owns the rest of each fact's shape. */
export function isPrefsShape(v: unknown): boolean {
  if (!isMap(v)) return false;
  const names = Object.keys(v);
  if (names.length > PREFS_MAX_FACTS) return false;
  return names.every((k) => FACT_RE.test(k) && isMap(v[k]) && isStamp((v[k] as Record<string, unknown>).at));
}

export async function prefsGet(store: PrefsStore, userId: string): Promise<Reply> {
  return { status: 200, json: { prefs: (await store.getPrefs(userId)) ?? null } };
}

export async function prefsPut(store: PrefsStore, userId: string, body: unknown): Promise<Reply> {
  if (!isMap(body) || !('prefs' in body)) return { status: 400, json: { error: 'bad request' } };
  const prefs = body.prefs ?? null;
  const base = body.base ?? null;
  if (prefs !== null && !isPrefsShape(prefs)) return { status: 400, json: { error: 'bad request' } };
  if (base !== null && !isMap(base)) return { status: 400, json: { error: 'bad request' } };
  if (prefs !== null && JSON.stringify(prefs).length > PREFS_MAX_BYTES) return { status: 413, json: { error: 'payload too large', limitBytes: PREFS_MAX_BYTES } };
  if (!(await store.casPrefs(userId, base, prefs))) return { status: 409, json: { error: 'changed' } };
  return { status: 200, json: { prefs } };
}
