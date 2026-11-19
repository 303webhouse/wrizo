import { createHash } from 'node:crypto';

// THE RAIL'S SAVED DATA, the server's rules (POLISH; Nick's ruling Nov 18, 1:56 pm: her pinned Projects and their order, each Project's box -
// two letters, a colour, a picture - and the list-or-boxes switch are SAVED WITH THE ACCOUNT; Fable accepted the storage plan Nov 18, 2:45 pm).
//
// Where they live: `users.rail`, one nullable jsonb column (the proofing recipe), and `box_pictures`, one row per Project at most. NOT on the
// drawers row: a drawer push replaces the whole row last-writer-wins, so a rename on one device and a pin on another would lose one of them,
// and an older app that pushes a drawer would wipe any new column.
//
// THE MERGE IS THE CLIENT'S (apps/desktop/src/reorg/railSaved.ts), exactly as proofing's is: every act is its own fact with its own stamp, and
// the client GETs, merges, and PUTs the merged record. What the server owns is what the client cannot be trusted with:
//   1. COMPARE-AND-SWAP. A PUT carries the value it merged against (`base`); the write lands only if the stored value still equals it, or the
//      answer is 409 and the client fetches, merges and tries again. Two devices can then never interleave a GET and a PUT and drop one's acts.
//   2. A PURGE IS FINAL. A Project deleted for good loses its pin and its box here, whatever a stale device sends back (`dropped` names them).
//   3. THE PICTURE. 64 KB at most, WebP, JPEG or PNG by its own first bytes (never SVG, which can carry script, nor GIF), one per Project.
//
// No database here: the SQL is behind RailStore (railRoutes.ts), so this file's rules run unchanged in the browserless check
// (apps/desktop/scripts/harness/writing-audit/reorg-rail-saved.mjs) against an in-memory store.

export const RAIL_MAX_BYTES = 256 * 1024;
export const PICTURE_MAX_BYTES = 64 * 1024;
/** A ceiling on one account's picture rows, so a client cannot fill the table with made-up Project ids. */
export const PICTURE_MAX_ROWS = 500;
/** The Notebook is a place of its own, not a drawer: it is never purged. */
export const NOTEBOOK_ID = 'notebook';
const ID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export type PictureMime = 'image/webp' | 'image/jpeg' | 'image/png';
export interface StoredPicture { sha: string; mime: string; bytes: Uint8Array; pickedAt: string }

export interface RailStore {
  getRail(userId: string): Promise<unknown | null>;
  /** Writes `next` only if the stored value equals `base` (null = never set). True when it wrote. */
  casRail(userId: string, base: unknown | null, next: unknown | null): Promise<boolean>;
  purgedDrawerIds(userId: string, ids: string[]): Promise<Set<string>>;
  getPicture(userId: string, drawerId: string): Promise<StoredPicture | null>;
  /** Last writer wins on pickedAt: 'older' when the stored row was picked later. */
  putPicture(userId: string, drawerId: string, pic: StoredPicture): Promise<'stored' | 'older'>;
  pictureCount(userId: string): Promise<number>;
  /** A removal stamped later than the stored picture deletes its bytes. */
  deletePictureIfOlder(userId: string, drawerId: string, removedAt: string): Promise<void>;
}

export interface Reply { status: number; json?: unknown; bytes?: Uint8Array; headers?: Record<string, string> }

export function validDrawerId(id: unknown): id is string {
  return typeof id === 'string' && ID_RE.test(id);
}

/** The picture's own first bytes say what it is; the Content-Type a client sends is not trusted. */
export function sniffPicture(b: Uint8Array): PictureMime | null {
  const at = (i: number, s: string) => [...s].every((c, k) => b[i + k] === c.charCodeAt(0));
  if (b.length >= 12 && at(0, 'RIFF') && at(8, 'WEBP')) return 'image/webp';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b[0] === 0x89 && at(1, 'PNG') && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  return null;
}

export function sha256Hex(b: Uint8Array): string {
  return createHash('sha256').update(b).digest('hex');
}

const isMap = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Shallow, like proofing's: the shape the purge filter depends on. The client owns the rest of the shape. */
export function isRailShape(v: unknown): boolean {
  if (!isMap(v)) return false;
  if (v.pins !== undefined && !isMap(v.pins)) return false;
  if (v.boxes !== undefined && !isMap(v.boxes)) return false;
  if (v.view !== undefined && v.view !== 'list' && v.view !== 'boxes') return false;
  return true;
}

export function railDrawerIds(rail: unknown): string[] {
  if (!isMap(rail)) return [];
  const ids = new Set<string>([...Object.keys(isMap(rail.pins) ? rail.pins : {}), ...Object.keys(isMap(rail.boxes) ? rail.boxes : {})]);
  ids.delete(NOTEBOOK_ID);
  return [...ids];
}

export function withoutDrawers(rail: Record<string, unknown>, ids: ReadonlySet<string>): Record<string, unknown> {
  const strip = (m: unknown) => (isMap(m) ? Object.fromEntries(Object.entries(m).filter(([k]) => !ids.has(k))) : m);
  const next: Record<string, unknown> = { ...rail };
  if (rail.pins !== undefined) next.pins = strip(rail.pins);
  if (rail.boxes !== undefined) next.boxes = strip(rail.boxes);
  return next;
}

export async function railGet(store: RailStore, userId: string): Promise<Reply> {
  return { status: 200, json: { rail: (await store.getRail(userId)) ?? null } };
}

export async function railPut(store: RailStore, userId: string, body: unknown): Promise<Reply> {
  if (!isMap(body) || !('rail' in body)) return { status: 400, json: { error: 'bad request' } };
  const rail = body.rail ?? null;
  const base = body.base ?? null;
  if (rail !== null && !isRailShape(rail)) return { status: 400, json: { error: 'bad request' } };
  if (rail !== null && JSON.stringify(rail).length > RAIL_MAX_BYTES) return { status: 413, json: { error: 'payload too large', limitBytes: RAIL_MAX_BYTES } };
  const purged = rail === null ? new Set<string>() : await store.purgedDrawerIds(userId, railDrawerIds(rail));
  const next = rail !== null && purged.size > 0 ? withoutDrawers(rail as Record<string, unknown>, purged) : rail;
  if (!(await store.casRail(userId, base, next))) return { status: 409, json: { error: 'changed' } };
  // a removal she made stamps the box's picture '' - its bytes go too, unless a later picture is already stored
  const boxes = isMap(next) && isMap(next.boxes) ? next.boxes : {};
  for (const [id, box] of Object.entries(boxes)) {
    if (isMap(box) && box.picture === '' && typeof box.pictureAt === 'string' && validDrawerId(id)) await store.deletePictureIfOlder(userId, id, box.pictureAt);
  }
  return { status: 200, json: { rail: next, dropped: [...purged] } };
}

export async function pictureGet(store: RailStore, userId: string, drawerId: unknown, v: unknown): Promise<Reply> {
  if (!validDrawerId(drawerId)) return { status: 400, json: { error: 'bad request' } };
  const pic = await store.getPicture(userId, drawerId);
  // asked for a picture by its sha and holding another: not found, so a cache keyed by ?v= never holds the wrong bytes
  if (!pic || (typeof v === 'string' && v !== '' && v !== pic.sha)) return { status: 404, json: { error: 'not found' } };
  return {
    status: 200,
    bytes: pic.bytes,
    headers: {
      'Content-Type': pic.mime,
      'Cache-Control': typeof v === 'string' && v !== '' ? 'private, max-age=31536000, immutable' : 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  };
}

export async function picturePut(store: RailStore, userId: string, drawerId: unknown, body: unknown, pickedAt: unknown): Promise<Reply> {
  if (!validDrawerId(drawerId)) return { status: 400, json: { error: 'bad request' } };
  if (!(body instanceof Uint8Array)) return { status: 415, json: { error: 'not a picture' } };
  if (body.length === 0) return { status: 400, json: { error: 'bad request' } };
  if (body.length > PICTURE_MAX_BYTES) return { status: 413, json: { error: 'payload too large', limitBytes: PICTURE_MAX_BYTES } };
  const mime = sniffPicture(body);
  if (!mime) return { status: 415, json: { error: 'not a picture' } };
  if (typeof pickedAt !== 'string' || Number.isNaN(Date.parse(pickedAt))) return { status: 400, json: { error: 'bad request' } };
  if ((await store.purgedDrawerIds(userId, [drawerId])).has(drawerId)) return { status: 410, json: { error: 'deleted for good' } };
  if (!(await store.getPicture(userId, drawerId)) && (await store.pictureCount(userId)) >= PICTURE_MAX_ROWS) return { status: 507, json: { error: 'too many pictures' } };
  const sha = sha256Hex(body);
  const result = await store.putPicture(userId, drawerId, { sha, mime, bytes: body, pickedAt: new Date(pickedAt).toISOString() });
  return { status: 200, json: { sha, stored: result === 'stored' } };
}
