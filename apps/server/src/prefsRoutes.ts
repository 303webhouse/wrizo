import { Router, type Request, type Response } from 'express';
import { pool } from './db';
import { requireAuth } from './auth';
import { asyncHandler } from './asyncHandler';
import { prefsGet, prefsPut, type PrefsStore, type Reply } from './prefs';

// THE REORG'S ACCOUNT PREFERENCES, the routes and the SQL (the rules are prefs.ts's). GET/PUT /api/prefs, each behind requireAuth and scoped to the session's own user id.
// Not part of /sync and NOT inside /api/rail: like page_defaults, proofing and the rail, prefs is one value on the user row with no id and no clock of its own (the stamps
// inside it are the merge's own data, not a record clock), and its PUT is a whole-blob compare-and-swap of ITS OWN column.

// A jsonb parameter: a real SQL NULL for null, never the string "null" (a jsonb null is not SQL NULL, so the column would have two empties).
const jsonb = (v: unknown): string | null => (v == null ? null : JSON.stringify(v));

export const sqlPrefsStore: PrefsStore = {
  async getPrefs(userId) {
    const { rows } = await pool.query(`select prefs from users where id = $1`, [userId]);
    return rows[0]?.prefs ?? null;
  },
  async casPrefs(userId, base, next) {
    // jsonb equality is semantic (key order and spacing do not count), so the base the client received compares equal to what is stored
    const r = await pool.query(`update users set prefs = $3::jsonb where id = $1 and prefs is not distinct from $2::jsonb`, [userId, jsonb(base), jsonb(next)]);
    return (r.rowCount ?? 0) > 0;
  },
};

function send(res: Response, reply: Reply): void {
  res.status(reply.status);
  res.json(reply.json ?? {});
}

export const prefsRouter = Router();
prefsRouter.use(requireAuth);

prefsRouter.get('/prefs', asyncHandler(async (req: Request, res: Response) => {
  send(res, await prefsGet(sqlPrefsStore, req.session.userId as string));
}));

prefsRouter.put('/prefs', asyncHandler(async (req: Request, res: Response) => {
  send(res, await prefsPut(sqlPrefsStore, req.session.userId as string, req.body));
}));
