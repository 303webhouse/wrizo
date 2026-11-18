import express, { Router, type Request, type Response } from 'express';
import { pool } from './db';
import { requireAuth } from './auth';
import { asyncHandler } from './asyncHandler';
import { PICTURE_MAX_BYTES, pictureGet, picturePut, railGet, railPut, type RailStore, type Reply } from './rail';

// THE RAIL'S SAVED DATA, the routes and the SQL (the rules are rail.ts's). GET/PUT /api/rail and GET/PUT /api/box-picture/:drawerId, every
// one behind requireAuth and scoped to the session's own user id. Not part of /sync: like page_defaults and proofing, the rail is one value on
// the user row with no id and no clock of its own (the stamps inside it are the merge's own data, not a record clock).

// A jsonb parameter: a real SQL NULL for null, never the string "null" (a jsonb null is not SQL NULL, so the column would have two empties).
const jsonb = (v: unknown): string | null => (v == null ? null : JSON.stringify(v));

export const sqlRailStore: RailStore = {
  async getRail(userId) {
    const { rows } = await pool.query(`select rail from users where id = $1`, [userId]);
    return rows[0]?.rail ?? null;
  },
  async casRail(userId, base, next) {
    // jsonb equality is semantic (key order and spacing do not count), so the base the client received compares equal to what is stored
    const r = await pool.query(`update users set rail = $3::jsonb where id = $1 and rail is not distinct from $2::jsonb`, [userId, jsonb(base), jsonb(next)]);
    return (r.rowCount ?? 0) > 0;
  },
  async purgedDrawerIds(userId, ids) {
    if (ids.length === 0) return new Set();
    const { rows } = await pool.query(`select id from drawers where user_id = $1 and id = any($2::text[]) and purged_at is not null`, [userId, ids]);
    return new Set(rows.map((r: { id: string }) => r.id));
  },
  async getPicture(userId, drawerId) {
    const { rows } = await pool.query(`select sha, mime, bytes, picked_at from box_pictures where user_id = $1 and drawer_id = $2`, [userId, drawerId]);
    const r = rows[0];
    return r ? { sha: r.sha, mime: r.mime, bytes: new Uint8Array(r.bytes), pickedAt: new Date(r.picked_at).toISOString() } : null;
  },
  async putPicture(userId, drawerId, pic) {
    const r = await pool.query(
      `insert into box_pictures (user_id, drawer_id, sha, mime, bytes, picked_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (user_id, drawer_id) do update set
         sha = excluded.sha, mime = excluded.mime, bytes = excluded.bytes, picked_at = excluded.picked_at
       where excluded.picked_at > box_pictures.picked_at`,
      [userId, drawerId, pic.sha, pic.mime, Buffer.from(pic.bytes), pic.pickedAt]);
    return (r.rowCount ?? 0) > 0 ? 'stored' : 'older';
  },
  async pictureCount(userId) {
    const { rows } = await pool.query(`select count(*)::int as n from box_pictures where user_id = $1`, [userId]);
    return rows[0]?.n ?? 0;
  },
  async deletePictureIfOlder(userId, drawerId, removedAt) {
    await pool.query(`delete from box_pictures where user_id = $1 and drawer_id = $2 and picked_at < $3::timestamptz`, [userId, drawerId, removedAt]);
  },
};

// DELETE FOR GOOD (sync.ts writeShell, drawers): the Project's pin and box leave the rail, and its picture's bytes are deleted. The server does
// this itself, so a purge made from ANY app, an older one included, clears them; railPut's filter keeps a stale device from sending them back.
export async function purgeRailDrawer(userId: string, drawerId: string): Promise<void> {
  await pool.query(`update users set rail = (rail #- array['pins', $2]::text[]) #- array['boxes', $2]::text[] where id = $1 and rail is not null`, [userId, drawerId]);
  await pool.query(`delete from box_pictures where user_id = $1 and drawer_id = $2`, [userId, drawerId]);
}

function send(res: Response, reply: Reply): void {
  for (const [k, v] of Object.entries(reply.headers ?? {})) res.setHeader(k, v);
  res.status(reply.status);
  if (reply.bytes) res.end(Buffer.from(reply.bytes));
  else res.json(reply.json ?? {});
}

export const railRouter = Router();
railRouter.use(requireAuth);

railRouter.get('/rail', asyncHandler(async (req: Request, res: Response) => {
  send(res, await railGet(sqlRailStore, req.session.userId as string));
}));

railRouter.put('/rail', asyncHandler(async (req: Request, res: Response) => {
  send(res, await railPut(sqlRailStore, req.session.userId as string, req.body));
}));

railRouter.get('/box-picture/:drawerId', asyncHandler(async (req: Request, res: Response) => {
  send(res, await pictureGet(sqlRailStore, req.session.userId as string, req.params.drawerId, req.query.v));
}));

// The bytes arrive raw, capped at the picture's own limit (a larger body is refused 413 before it is buffered). The app-wide JSON parser in
// index.ts skips an image Content-Type, so this parser is the one that reads them; a JSON body never becomes a Buffer and is refused 415.
railRouter.put('/box-picture/:drawerId', express.raw({ type: () => true, limit: PICTURE_MAX_BYTES }), asyncHandler(async (req: Request, res: Response) => {
  const body = Buffer.isBuffer(req.body) ? new Uint8Array(req.body) : req.body;
  send(res, await picturePut(sqlRailStore, req.session.userId as string, req.params.drawerId, body, req.get('X-Picked-At')));
}));
