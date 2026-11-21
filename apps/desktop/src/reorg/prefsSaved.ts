import { REORG } from './flag';
import { subscribeSyncStatus } from '../store/sync';
import { onRailReset, PREFS_LOCAL_KEY } from './railSavedKey';

// THE REORG'S PREFERENCES, SAVED WITH THE ACCOUNT (the Back menu, phase 4; Nick's SAVED DATA ruling, Nov 19, 4:05 pm: split side and width, the linked-assets toggle, the last
// search word and her own templates follow her to every device; Fable, Nov 19, 7:00 pm: "a NEW users.prefs jsonb column with its own GET/PUT, built the way 26b built users.rail
// and /api/rail, NOT inside rail"). The server half is apps/server/src/prefs.ts (compare-and-swap, the shape, the size); this is the client half, the rail's recipe
// (reorg/railSaved.ts) over a simpler record.
//
// THE RECORD is a map of FACTS, each a map with its own stamp `at`: { split: { side: 'right', width: 0.5, at }, linkedAssets: { on: true, at }, searchWord: { word, at },
// templates: { items, at } }. One fact = one preference = one act: the later act wins, whole. Two devices that set DIFFERENT preferences keep both; two that set the SAME one
// meet, and the later stamp wins (a tie settles by value, never by which side it came from, so the two devices can never each keep their own forever).
//
//   - commutative and idempotent: merge(a,b) equals merge(b,a), and merging a record with itself changes nothing;
//   - a remote record enters ONLY through the merge. There is no replace-from-server;
//   - the local copy is ONE localStorage key holding the record itself, in the very shape the server holds (the device-first fallback of the split width, Nov 19 6:05 pm, wrote
//     this same key in this same shape, so a copy made then reads unchanged);
//   - sign-out clears the copy (railSavedKey.ts's hook), so the next account never sees this one's preferences.
//
// SWITCH OFF, NOTHING HAPPENS: this module reads no storage, writes none and never calls the server unless REORG is on.
// SUPERSEDED for ONE fact (Fable, Nov 19, 11:20 pm: "The room choice (Automatic / Day / Night) is SAVED TO THE ACCOUNT, for Machina AND Arbor ... Store it as a `room`
// fact in users.prefs"): the room is not a reorg feature, so it is SWITCHLESS - saved, kept on the device and synced whatever the switch (store/roomPref.ts is its
// bridge to <html data-room>). With the switch OFF: a reorg fact is never set and never kept on the device (only the switchless facts are written to the local copy,
// beside whatever a switch-on session left there); the module reads its local copy and runs ONE round with the account per sign-in (the room another device chose),
// plus a round after each of her own acts. With the switch ON, everything is as it was.

export interface PrefFact { at: string; [field: string]: unknown }
export type PrefsRecord = Record<string, PrefFact>;

export const PREFS_KEY = PREFS_LOCAL_KEY;
const ROUND_AFTER_ACT_MS = 1000;
const CAS_TRIES = 3;
const FACT_RE = /^[a-z][A-Za-z0-9]{0,31}$/;
/** The facts saved whatever the reorg's switch (Fable, Nov 19, 11:20 pm: the room; Nov 20, 12:15 pm: the session's writing settings; 5:15 pm: the writing goal): account data in every theme. */
export const SWITCHLESS: ReadonlySet<string> = new Set(['room']).add('writing').add('goal');
const allowed = (name: string): boolean => REORG || SWITCHLESS.has(name);

// ---- the merge (pure) ---------------------------------------------------------------------------------------------------

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isStamp = (v: unknown): v is string => typeof v === 'string' && v !== '' && !Number.isNaN(Date.parse(v));

/** A key-sorted JSON: two equal records always spell the same, whatever order their keys arrived in. */
export function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (isMap(v)) return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
}

export function emptyPrefs(): PrefsRecord { return {}; }

// a record off the wire or out of storage, reduced to the facts it can prove: a malformed fact is dropped, never merged
function normalize(v: unknown): PrefsRecord | null {
  if (!isMap(v)) return null;
  const out: PrefsRecord = {};
  for (const [k, f] of Object.entries(v)) if (FACT_RE.test(k) && isMap(f) && isStamp(f.at)) out[k] = f as PrefFact;
  return out;
}

// A fact that is MANY small preferences at once (the writing settings: a dozen switches in one fact) may carry `fieldAt`, a stamp per field: two devices that each changed a
// DIFFERENT field then both keep their change, and the later stamp wins only per field. Without `fieldAt` on either side the merge is exactly the whole-fact rule above (every
// older fact, the room, the split). A field with no stamp of its own counts as stamped by its fact's `at`. Still commutative and idempotent: the tie of a field settles by value.
function fieldStamps(f: PrefFact): Record<string, string> {
  const out: Record<string, string> = {};
  const fa = isMap(f.fieldAt) ? f.fieldAt : {};
  for (const k of Object.keys(f)) if (k !== 'at' && k !== 'fieldAt') out[k] = isStamp(fa[k]) ? (fa[k] as string) : f.at;
  return out;
}
function mergeFields(x: PrefFact, y: PrefFact): PrefFact {
  const sx = fieldStamps(x);
  const sy = fieldStamps(y);
  const out: PrefFact = { at: y.at > x.at ? y.at : x.at };
  const stamps: Record<string, string> = {};
  for (const k of new Set([...Object.keys(sx), ...Object.keys(sy)])) {
    const inX = k in sx;
    const inY = k in sy;
    const useY = !inX || (inY && (sy[k] > sx[k] || (sy[k] === sx[k] && canon(y[k]) > canon(x[k]))));
    out[k] = useY ? y[k] : x[k];
    stamps[k] = useY ? sy[k] : sx[k];
  }
  out.fieldAt = stamps;
  return out;
}

export function mergePrefs(aIn: unknown, bIn: unknown): PrefsRecord {
  const a = normalize(aIn);
  const b = normalize(bIn);
  if (!a && !b) return emptyPrefs();
  if (!a || !b) return { ...((a || b) as PrefsRecord) };
  const out: PrefsRecord = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k];
    const y = b[k];
    if (!x) out[k] = y;
    else if (!y) out[k] = x;
    else if (isMap(x.fieldAt) || isMap(y.fieldAt)) out[k] = mergeFields(x, y);
    else if (x.at !== y.at) out[k] = y.at > x.at ? y : x;
    else out[k] = canon(y) > canon(x) ? y : x;   // equal stamps: the larger value, arbitrary but symmetric
  }
  return out;
}

// ---- the local copy -----------------------------------------------------------------------------------------------------

function readLocal(): PrefsRecord {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? mergePrefs(JSON.parse(raw), null) : emptyPrefs();
  } catch {
    return emptyPrefs();
  }
}

let prefs: PrefsRecord = emptyPrefs();
let signedIn = false;
let version = 0;
// true once a round has HEARD the account (a GET that answered): until then a fact missing here may only be one that has not arrived yet, so a bridge must not adopt a device's own values as the account's
let heard = false;
export function prefsHeardServer(): boolean { return heard; }
const listeners = new Set<() => void>();

function notify(): void {
  version += 1;
  listeners.forEach((fn) => { try { fn(); } catch { /* a listener never breaks a preference */ } });
}

// read, merge, write: another window of this device may have written since (its acts are kept, never written over). Written ONLY when what it holds changed: a record she
// never touched leaves storage exactly as it was (no key at all).
function persist(): void {
  const stored = readLocal();
  prefs = mergePrefs(prefs, stored);
  // the switch off keeps only the switchless facts it holds, beside whatever the copy already had (a reorg fact is never added, and one a switch-on session left is kept)
  const mine: PrefsRecord = REORG ? prefs : { ...stored, ...Object.fromEntries(Object.entries(prefs).filter(([k]) => SWITCHLESS.has(k))) };
  try {
    const had = localStorage.getItem(PREFS_KEY);
    if (had === null ? Object.keys(mine).length === 0 : canon(stored) === canon(mine)) return;
    localStorage.setItem(PREFS_KEY, JSON.stringify(mine));
  } catch { /* storage full or blocked: memory still holds it, the server gets it */ }
}

export function subscribePrefs(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function prefsVersion(): number { return version; }
export function getSavedPrefs(): PrefsRecord { return prefs; }

/** One preference, as saved (its fields and its stamp), or null when she has never set it. */
export function getPref(name: string): PrefFact | null { return prefs[name] ?? null; }

// a stamp strictly after the fact it replaces: two acts inside one millisecond must still read in the order she made them
function stampAfter(prev: string | undefined): string {
  let t = Date.now();
  if (prev) t = Math.max(t, Date.parse(prev) + 1);
  return new Date(t).toISOString();
}

/** Her act: this preference becomes `value` (its fields, without a stamp), stamped now. A fact of the same value is not an act: nothing is written. */
export function setPref(name: string, value: Record<string, unknown>): void {
  if (!allowed(name) || !FACT_RE.test(name)) return;
  const was = prefs[name];
  if (was) { const { at: _at, ...fields } = was; void _at; if (canon(fields) === canon(value)) return; }
  prefs = { ...prefs, [name]: { ...value, at: stampAfter(was?.at) } };
  persist();
  notify();
  if (signedIn) scheduleRound(ROUND_AFTER_ACT_MS);
}

// ---- the round: GET, merge, compare-and-swap PUT -----------------------------------------------------------------------------

let roundTimer: ReturnType<typeof setTimeout> | null = null;
let inRound = false;
let again = false;
// bumped at sign-out: a round still waiting on the network then writes nothing (store/sync.ts's generation, the same guard)
let generation = 0;
const STALE = Symbol('stale');

function scheduleRound(ms: number): void {
  if (roundTimer) clearTimeout(roundTimer);
  roundTimer = setTimeout(() => { roundTimer = null; void syncPrefs(); }, ms);
}

/** One round with the server. Offline, signed out, or a server without the route: the local copy governs and the next round merges. */
export async function syncPrefs(): Promise<void> {
  if (inRound) { again = true; return; }
  inRound = true;
  const gen = generation;
  const live = (): void => { if (gen !== generation) throw STALE; };
  try {
    persist();
    for (let i = 0; i < CAS_TRIES; i += 1) {
      const g = await fetch('/api/prefs', { credentials: 'include' });
      live();
      if (!g.ok) return;
      const remote = ((await g.json()) as { prefs?: unknown })?.prefs ?? null;
      live();
      prefs = mergePrefs(prefs, remote);
      heard = true;
      persist();
      notify();
      if (remote !== null && canon(prefs) === canon(mergePrefs(remote, null))) return;   // the server already holds every fact
      if (remote === null && Object.keys(prefs).length === 0) return;                      // nothing to say
      const p = await fetch('/api/prefs', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefs, base: remote }) });
      live();
      if (p.status === 409) continue;   // another device wrote between our GET and PUT: fetch, merge, try again
      if (!p.ok) return;
      const body = (await p.json()) as { prefs?: unknown };
      live();
      prefs = mergePrefs(prefs, body.prefs ?? null);
      notify();
      return;
    }
  } catch {
    /* offline: the local copy stands and the next round merges */
  } finally {
    // only the current account's round owns the flag (a reset already released it)
    if (gen === generation) {
      inRound = false;
      if (again) { again = false; scheduleRound(0); }
    }
  }
}

// ---- wiring (the seam switch on only; the rest for the switchless facts too) --------------------------------------------------------------------------------------------

let roundsThisSignIn = 0;
{
  prefs = readLocal();
  // sign-out takes the preferences with it (railSavedKey.clearRailLocal runs every hook): the next account never sees this one's
  onRailReset(() => {
    generation += 1;
    inRound = false;
    again = false;
    prefs = emptyPrefs();
    signedIn = false;
    heard = false;
    roundsThisSignIn = 0;
    try { localStorage.removeItem(PREFS_KEY); } catch { /* storage blocked */ }
    if (roundTimer) { clearTimeout(roundTimer); roundTimer = null; }
    notify();
  });
  // every finished sync is a signed-in, reachable server: run a round after it (the switch off: the first one of each sign-in only - the room another device chose
  // arrives with the next sign-in or reload, and her own acts still go up a second later)
  subscribeSyncStatus((s) => {
    if (s !== 'synced') return;
    signedIn = true;
    if (!REORG && roundsThisSignIn > 0) return;
    roundsThisSignIn += 1;
    scheduleRound(0);
  });
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    // another window of this device wrote the copy: take its acts in (a merge, never a replace)
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key !== PREFS_KEY) return;
      prefs = mergePrefs(prefs, readLocal());
      notify();
    });
  }
  if (REORG && typeof window !== 'undefined') (window as unknown as { wrizoPrefs?: unknown }).wrizoPrefs = { get: getSavedPrefs, pref: getPref, set: setPref, sync: syncPrefs };
}
