import { REORG } from './flag';
import { subscribeSyncStatus } from '../store/sync';
import { RAIL_KEY, onRailReset } from './railSavedKey';

// THE RAIL, SAVED WITH THE ACCOUNT (the reorg, behind ?reorg=1 in Machina). Nick's ruling, Nov 18, 1:56 pm: her pinned Projects and their
// order, each Project's box (two letters, a colour, a picture) and the list-or-boxes switch follow her to every device. Fable accepted the
// storage plan Nov 18, 2:45 pm (Downloads/polish-rail-storage-plan.md): users.rail on the server, box_pictures for the bytes, and one local key.
//
// EVERY ACT IS ITS OWN FACT WITH ITS OWN STAMP, merged on proofing's rules (store/proofing.ts mergeProofing):
//   - commutative and idempotent: merge(a,b) equals merge(b,a), and merging a record with itself changes nothing;
//   - a tie is broken by VALUE, never by which side it came from, so two devices can never each keep their own forever;
//   - a stamped empty wins (an unpin, "no letters", a removed picture are acts, not absences);
//   - a remote record enters ONLY through the merge. There is no replace-from-server.
// So two devices pinning different Projects keep both pins; letters set on one and a colour on the other keep both; only two acts on the SAME
// fact meet, and the later one wins. The server compares-and-swaps the merged record (apps/server/src/rail.ts), so an interleaved GET/PUT is
// refused (409) and merged again rather than written over, and it drops a Project deleted for good, naming it in `dropped`.
//
// SWITCH OFF, NOTHING HAPPENS: this module reads no storage, writes none and never calls the server unless REORG is on.

export type PinView = 'boxes' | 'list';
export interface RailPin { order: number; at: string; removedAt?: string }
export interface RailBoxFacts { letters?: string; lettersAt?: string; colour?: string; colourAt?: string; picture?: string; pictureAt?: string }
export interface RailRecord { pins: Record<string, RailPin>; boxes: Record<string, RailBoxFacts>; view?: PinView; viewAt?: string }
interface PendingPicture { sha: string; mime: string; data: string; at: string }
interface Mirror { rail: RailRecord; pending: Record<string, PendingPicture> }

/** An unpin's marker is kept this long, then tidied away (proofing's PROOFING_TOMBSTONE_DAYS). */
export const RAIL_TOMBSTONE_DAYS = 180;
export const PICTURE_MAX_BYTES = 64 * 1024;
export const PICTURE_SIDE = 256;
const ROUND_AFTER_ACT_MS = 1000;
const CAS_TRIES = 3;

// ---- the merge (pure) ---------------------------------------------------------------------------------------------------

export function emptyRail(): RailRecord { return { pins: {}, boxes: {} }; }

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isStamp = (v: unknown): v is string => typeof v === 'string' && v !== '' && !Number.isNaN(Date.parse(v));

/** A key-sorted JSON: two equal records always spell the same, whatever order their keys arrived in. */
export function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (isMap(v)) return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
}

/** Shallow, like proofing's isProofingRecord: anything else merges as ABSENT, never as a record. */
export function isRailRecord(v: unknown): v is RailRecord {
  return isMap(v) && (v.pins === undefined || isMap(v.pins)) && (v.boxes === undefined || isMap(v.boxes));
}

// a record off the wire or out of storage, reduced to the facts it can prove: a malformed entry is dropped, never merged
function normalize(v: unknown): RailRecord | null {
  if (!isRailRecord(v)) return null;
  const out = emptyRail();
  for (const [id, p] of Object.entries(isMap(v.pins) ? v.pins : {})) {
    if (!isMap(p) || !isStamp(p.at) || typeof p.order !== 'number' || !Number.isFinite(p.order)) continue;
    out.pins[id] = isStamp(p.removedAt) ? { order: p.order, at: p.at, removedAt: p.removedAt } : { order: p.order, at: p.at };
  }
  for (const [id, b] of Object.entries(isMap(v.boxes) ? v.boxes : {})) {
    if (!isMap(b)) continue;
    const box: RailBoxFacts = {};
    if (typeof b.letters === 'string' && isStamp(b.lettersAt)) { box.letters = b.letters; box.lettersAt = b.lettersAt; }
    if (typeof b.colour === 'string' && isStamp(b.colourAt)) { box.colour = b.colour; box.colourAt = b.colourAt; }
    if (typeof b.picture === 'string' && isStamp(b.pictureAt)) { box.picture = b.picture; box.pictureAt = b.pictureAt; }
    if (Object.keys(box).length) out.boxes[id] = box;
  }
  if ((v.view === 'list' || v.view === 'boxes') && isStamp(v.viewAt)) { out.view = v.view; out.viewAt = v.viewAt; }
  return out;
}

// the later stamp wins; equal stamps, the larger value (arbitrary but symmetric: the side a value came from never decides)
function later(aAt: string | undefined, aVal: unknown, bAt: string | undefined, bVal: unknown): 'a' | 'b' {
  if (!bAt) return 'a';
  if (!aAt) return 'b';
  if (aAt !== bAt) return bAt > aAt ? 'b' : 'a';
  return canon(bVal) > canon(aVal) ? 'b' : 'a';
}

const lastAct = (p: RailPin): string => (p.removedAt && p.removedAt > p.at ? p.removedAt : p.at);
export const isPinnedFact = (p: RailPin | undefined): boolean => !!p && !(p.removedAt && p.removedAt >= p.at);

function compact(r: RailRecord, now = Date.now()): RailRecord {
  const cutoff = new Date(now - RAIL_TOMBSTONE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const pins: Record<string, RailPin> = {};
  for (const [id, p] of Object.entries(r.pins)) if (isPinnedFact(p) || lastAct(p) >= cutoff) pins[id] = p;
  return { ...r, pins };
}

export function mergeRail(aIn: unknown, bIn: unknown): RailRecord {
  const a = normalize(aIn);
  const b = normalize(bIn);
  if (!a && !b) return emptyRail();
  if (!a || !b) return compact((a || b) as RailRecord);
  const pins: Record<string, RailPin> = {};
  for (const id of new Set([...Object.keys(a.pins), ...Object.keys(b.pins)])) {
    const x = a.pins[id];
    const y = b.pins[id];
    pins[id] = !x ? y : !y ? x : later(lastAct(x), x, lastAct(y), y) === 'b' ? y : x;
  }
  const boxes: Record<string, RailBoxFacts> = {};
  for (const id of new Set([...Object.keys(a.boxes), ...Object.keys(b.boxes)])) {
    const x = a.boxes[id] || {};
    const y = b.boxes[id] || {};
    const box: RailBoxFacts = {};
    for (const f of ['letters', 'colour', 'picture'] as const) {
      const at = `${f}At` as const;
      const w = later(x[at], x[f], y[at], y[f]) === 'b' ? y : x;
      if (w[at] !== undefined) { box[f] = w[f]; box[at] = w[at]; }
    }
    if (Object.keys(box).length) boxes[id] = box;
  }
  const out: RailRecord = { pins, boxes };
  const v = later(a.viewAt, a.view, b.viewAt, b.view) === 'b' ? b : a;
  if (v.viewAt) { out.view = v.view; out.viewAt = v.viewAt; }
  return compact(out);
}

/** Her pins, in her order (equal orders - two devices pinning at once - settle by id, the same on every device). */
export function pinnedIdsOf(r: RailRecord): string[] {
  return Object.entries(r.pins).filter(([, p]) => isPinnedFact(p)).sort(([ia, pa], [ib, pb]) => pa.order - pb.order || (ia < ib ? -1 : ia > ib ? 1 : 0)).map(([id]) => id);
}

// ---- the local copy -----------------------------------------------------------------------------------------------------

function readMirror(): Mirror {
  try {
    const raw = localStorage.getItem(RAIL_KEY);
    if (!raw) return { rail: emptyRail(), pending: {} };
    const parsed = JSON.parse(raw) as Partial<Mirror>;
    const pending: Record<string, PendingPicture> = {};
    for (const [id, p] of Object.entries(isMap(parsed.pending) ? parsed.pending : {})) {
      if (isMap(p) && typeof p.sha === 'string' && typeof p.mime === 'string' && typeof p.data === 'string' && isStamp(p.at)) pending[id] = p as unknown as PendingPicture;
    }
    return { rail: mergeRail(parsed.rail, null), pending };
  } catch {
    return { rail: emptyRail(), pending: {} };
  }
}

let rail: RailRecord = emptyRail();
let pending: Record<string, PendingPicture> = {};
let signedIn = false;
let version = 0;
const listeners = new Set<() => void>();

function notify(): void {
  version += 1;
  listeners.forEach((fn) => { try { fn(); } catch { /* a listener never breaks the rail */ } });
}

// read, merge, write: another window of this device may have written since (its acts are kept, never written over). Written ONLY when what it
// holds changed: a rail she never touched leaves storage exactly as it was (no key at all), and a round that learned nothing writes nothing.
function persist(): void {
  if (!REORG) return;
  const stored = readMirror();
  rail = mergeRail(rail, stored.rail);
  pending = { ...stored.pending, ...pending };
  const empty = Object.keys(rail.pins).length === 0 && Object.keys(rail.boxes).length === 0 && !rail.viewAt && Object.keys(pending).length === 0;
  try {
    const had = localStorage.getItem(RAIL_KEY);
    if (had === null ? empty : canon({ rail: stored.rail, pending: stored.pending }) === canon({ rail, pending })) return;
    localStorage.setItem(RAIL_KEY, JSON.stringify({ rail, pending }));
  } catch { /* storage full or blocked: memory still holds it, the server gets it */ }
}

export function subscribeSavedRail(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function getSavedRail(): RailRecord { return rail; }
export function savedRailVersion(): number { return version; }

// ---- her acts ----------------------------------------------------------------------------------------------------------

// a stamp strictly after the fact it replaces: two acts inside one millisecond must still read in the order she made them
function stampAfter(...prev: (string | undefined)[]): string {
  let t = Date.now();
  for (const p of prev) if (p) t = Math.max(t, Date.parse(p) + 1);
  return new Date(t).toISOString();
}

function acted(): void {
  persist();
  notify();
  if (signedIn) scheduleRound(ROUND_AFTER_ACT_MS);
}

export function togglePinSaved(id: string): void {
  const p = rail.pins[id];
  if (isPinnedFact(p)) {
    rail = { ...rail, pins: { ...rail.pins, [id]: { ...p, removedAt: stampAfter(p.at, p.removedAt) } } };
  } else {
    const order = Object.values(rail.pins).filter(isPinnedFact).reduce((m, q) => Math.max(m, q.order), 0) + 1;
    rail = { ...rail, pins: { ...rail.pins, [id]: { order, at: stampAfter(p?.at, p?.removedAt) } } };
  }
  acted();
}

export function setViewSaved(view: PinView): void {
  if (rail.view === view) return;
  rail = { ...rail, view, viewAt: stampAfter(rail.viewAt) };
  acted();
}

/** Letters ('' = no letters) and a colour, each stamped on its own. `removePicture` stamps the picture away (a colour pick clears it: R5). */
export function setBoxFactsSaved(id: string, patch: { letters?: string; colour?: string; removePicture?: boolean }): void {
  const box: RailBoxFacts = { ...(rail.boxes[id] || {}) };
  if (patch.letters !== undefined) { box.letters = patch.letters; box.lettersAt = stampAfter(box.lettersAt); }
  if (patch.colour !== undefined) { box.colour = patch.colour; box.colourAt = stampAfter(box.colourAt); }
  if (patch.removePicture) {
    box.picture = '';
    box.pictureAt = stampAfter(box.pictureAt);
    if (pending[id]) { const { [id]: _gone, ...rest } = pending; pending = rest; }
  }
  rail = { ...rail, boxes: { ...rail.boxes, [id]: box } };
  acted();
}

const HEX = (buf: ArrayBuffer): string => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
// a picture shown on this device before (or without) the server: sha -> data: URL, memory only
const shown = new Map<string, string>();

/** A picture already made small (encodeBoxPicture): kept here until the server has it, then served from there to every device. */
export async function setBoxPictureSaved(id: string, bytes: Uint8Array, mime: string): Promise<void> {
  if (bytes.length === 0 || bytes.length > PICTURE_MAX_BYTES) return;
  const sha = HEX(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)));
  const data = toBase64(bytes);
  shown.set(sha, `data:${mime};base64,${data}`);
  const box: RailBoxFacts = { ...(rail.boxes[id] || {}) };
  box.picture = sha;
  box.pictureAt = stampAfter(box.pictureAt);
  pending = { ...pending, [id]: { sha, mime, data, at: box.pictureAt } };
  rail = { ...rail, boxes: { ...rail.boxes, [id]: box } };
  acted();
}

/** Where a box's picture is drawn from: this device's copy, else the server (signed in), else nowhere (the letters show). */
export function boxPictureUrl(id: string): string | undefined {
  const sha = rail.boxes[id]?.picture;
  if (!sha) return undefined;
  const mine = shown.get(sha) ?? (pending[id]?.sha === sha ? `data:${pending[id].mime};base64,${pending[id].data}` : undefined);
  if (mine) return mine;
  return signedIn ? `/api/box-picture/${encodeURIComponent(id)}?v=${sha}` : undefined;
}

/**
 * Her chosen file, made small on this device: cropped square from the centre, scaled to 256 x 256, WebP at 0.8 (Fable, Nov 18 2:45 pm), JPEG
 * where the browser cannot encode WebP. A picture still over 64 KB steps down in quality; null if nothing fits. The original never leaves.
 */
export async function encodeBoxPicture(file: Blob): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!/^image\//.test(file.type)) return null;
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement('canvas');
  canvas.width = PICTURE_SIDE;
  canvas.height = PICTURE_SIDE;
  const ctx = canvas.getContext('2d');
  if (!ctx || side <= 0) return null;
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, PICTURE_SIDE, PICTURE_SIDE);
  bmp.close?.();
  for (const [type, q] of [['image/webp', 0.8], ['image/webp', 0.6], ['image/jpeg', 0.8], ['image/jpeg', 0.6], ['image/jpeg', 0.4]] as const) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
    if (!blob || blob.type !== type) continue;   // a browser that cannot encode WebP hands back PNG: try the next
    if (blob.size <= PICTURE_MAX_BYTES) return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: type };
  }
  return null;
}

// ---- the round: pictures up, then GET, merge, compare-and-swap PUT --------------------------------------------------------

let roundTimer: ReturnType<typeof setTimeout> | null = null;
let inRound = false;
let again = false;
// bumped at sign-out: a round still waiting on the network then writes nothing (store/sync.ts's generation, the same guard)
let generation = 0;
const STALE = Symbol('stale');

function scheduleRound(ms: number): void {
  if (roundTimer) clearTimeout(roundTimer);
  roundTimer = setTimeout(() => { roundTimer = null; void syncRail(); }, ms);
}

async function uploadPending(live: () => void): Promise<void> {
  for (const [id, p] of Object.entries(pending)) {
    const bin = atob(p.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const r = await fetch(`/api/box-picture/${encodeURIComponent(id)}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': p.mime, 'X-Picked-At': p.at }, body: bytes });
    live();
    // stored, or a later picture was already there, or refused for good (too big, not a picture, the Project deleted for good): done with it
    if (r.ok || r.status === 400 || r.status === 410 || r.status === 413 || r.status === 415) {
      if (pending[id]?.sha === p.sha) { const { [id]: _done, ...rest } = pending; pending = rest; }
    } else return;   // 401, 5xx, 507: kept, tried next round
  }
}

function forget(ids: unknown): void {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const gone = new Set(ids.filter((x): x is string => typeof x === 'string'));
  const keep = <T,>(m: Record<string, T>) => Object.fromEntries(Object.entries(m).filter(([k]) => !gone.has(k)));
  // a purge is final: the server refused these Projects, so this device stops sending them (a removal, not a stamp)
  rail = { ...rail, pins: keep(rail.pins), boxes: keep(rail.boxes) };
  pending = keep(pending);
  try { localStorage.setItem(RAIL_KEY, JSON.stringify({ rail: mergeRail(rail, null), pending })); } catch { /* ignore */ }
}

/** One round with the server. Offline, signed out, or a server without the routes: the local copy governs and the next round merges. */
export async function syncRail(): Promise<void> {
  if (!REORG) return;
  if (inRound) { again = true; return; }
  inRound = true;
  const gen = generation;
  const live = (): void => { if (gen !== generation) throw STALE; };
  try {
    persist();
    await uploadPending(live);
    for (let i = 0; i < CAS_TRIES; i += 1) {
      const g = await fetch('/api/rail', { credentials: 'include' });
      live();
      if (!g.ok) return;
      const remote = ((await g.json()) as { rail?: unknown })?.rail ?? null;
      live();
      rail = mergeRail(rail, remote);
      persist();
      notify();
      if (canon(rail) === canon(mergeRail(remote, null)) && remote !== null) return;   // the server already holds every fact
      if (remote === null && Object.keys(rail.pins).length === 0 && Object.keys(rail.boxes).length === 0 && !rail.viewAt) return;   // nothing to say
      const p = await fetch('/api/rail', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rail, base: remote }) });
      live();
      if (p.status === 409) continue;   // another device wrote between our GET and PUT: fetch, merge, try again
      if (!p.ok) return;
      const body = (await p.json()) as { rail?: unknown; dropped?: unknown };
      live();
      forget(body.dropped);
      rail = mergeRail(rail, body.rail ?? null);
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

// ---- wiring (switch on only) --------------------------------------------------------------------------------------------

if (REORG) {
  const loaded = readMirror();
  rail = loaded.rail;
  pending = loaded.pending;
  onRailReset(() => {
    generation += 1;
    inRound = false;
    again = false;
    rail = emptyRail();
    pending = {};
    shown.clear();
    signedIn = false;
    if (roundTimer) { clearTimeout(roundTimer); roundTimer = null; }
    notify();
  });
  // every finished sync is a signed-in, reachable server: run a round after it (every ~20 s while she writes, and on reconnect)
  subscribeSyncStatus((s) => {
    if (s !== 'synced') return;
    signedIn = true;
    scheduleRound(0);
  });
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    // another window of this device wrote the copy: take its acts in (a merge, never a replace)
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key !== RAIL_KEY) return;
      const stored = readMirror();
      rail = mergeRail(rail, stored.rail);
      pending = { ...stored.pending, ...pending };
      notify();
    });
  }
}
