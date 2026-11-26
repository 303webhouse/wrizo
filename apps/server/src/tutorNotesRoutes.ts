import { Router, type Request, type Response } from 'express';
import { pool } from './db';
import { requireAuth } from './auth';
import { asyncHandler } from './asyncHandler';
import { rateLimit } from './rateLimit';
import { notesAdd, notesEdit, notesList, notesRemove, notesWipe, type Note, type NotesStore, type Reply } from './tutorNotes';

// THE TUTOR'S NOTES ON FILE, the routes and the SQL (the rules are tutorNotes.ts's). GET/POST /api/tutor/notes, PATCH/DELETE /api/tutor/notes/:id, DELETE /api/tutor/notes (wipe).
// Every one behind requireAuth and scoped to the session's own user id: EVERY statement below carries `user_id = $1` with $1 the session's id, never a value from the request.
// Not part of /sync (no other writer's device, and no merge, ever sees a note), and no soft delete: remove and wipe are real SQL deletes.

const COLS = `id, kind, text, source, created_at, updated_at`;
const iso = (v: unknown): string => new Date(v as string).toISOString();
const toNote = (r: { id: string; kind: Note['kind']; text: string; source: Note['source']; created_at: unknown; updated_at: unknown }): Note => ({
  id: r.id, kind: r.kind, text: r.text, source: r.source, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
});

export const sqlNotesStore: NotesStore = {
  async list(userId) {
    const { rows } = await pool.query(`select ${COLS} from tutor_notes where user_id = $1 order by created_at, id`, [userId]);
    return rows.map(toNote);
  },
  async count(userId) {
    const { rows } = await pool.query(`select count(*)::int as n from tutor_notes where user_id = $1`, [userId]);
    return rows[0]?.n ?? 0;
  },
  async insert(userId, n) {
    const { rows } = await pool.query(
      `insert into tutor_notes (user_id, kind, text, source) values ($1, $2, $3, $4) returning ${COLS}`,
      [userId, n.kind, n.text, n.source]);
    return toNote(rows[0]);
  },
  async update(userId, id, patch) {
    const { rows } = await pool.query(
      `update tutor_notes set kind = coalesce($3, kind), text = coalesce($4, text), updated_at = now() where user_id = $1 and id = $2 returning ${COLS}`,
      [userId, id, patch.kind ?? null, patch.text ?? null]);
    return rows[0] ? toNote(rows[0]) : null;
  },
  async remove(userId, id) {
    const r = await pool.query(`delete from tutor_notes where user_id = $1 and id = $2`, [userId, id]);
    return (r.rowCount ?? 0) > 0;
  },
  async wipe(userId) {
    const r = await pool.query(`delete from tutor_notes where user_id = $1`, [userId]);
    return r.rowCount ?? 0;
  },
};

function send(res: Response, reply: Reply): void {
  res.status(reply.status);
  res.json(reply.json ?? {});
}

export const tutorNotesRouter = Router();
tutorNotesRouter.use('/tutor/notes', requireAuth);
// her own screen is the only caller: a generous per-account limit (not the Tutor chat's 10 a minute, which is for paid model calls)
tutorNotesRouter.use('/tutor/notes', rateLimit(60, 60_000, (req) => req.session.userId!));

const me = (req: Request): string => req.session.userId as string;

tutorNotesRouter.get('/tutor/notes', asyncHandler(async (req: Request, res: Response) => {
  send(res, await notesList(sqlNotesStore, me(req)));
}));

tutorNotesRouter.post('/tutor/notes', asyncHandler(async (req: Request, res: Response) => {
  send(res, await notesAdd(sqlNotesStore, me(req), req.body));
}));

tutorNotesRouter.patch('/tutor/notes/:id', asyncHandler(async (req: Request, res: Response) => {
  send(res, await notesEdit(sqlNotesStore, me(req), req.params.id, req.body));
}));

tutorNotesRouter.delete('/tutor/notes/:id', asyncHandler(async (req: Request, res: Response) => {
  send(res, await notesRemove(sqlNotesStore, me(req), req.params.id));
}));

tutorNotesRouter.delete('/tutor/notes', asyncHandler(async (req: Request, res: Response) => {
  send(res, await notesWipe(sqlNotesStore, me(req)));
}));
