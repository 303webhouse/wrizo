import { Router, type Request, type Response } from 'express';
import { pool } from './db';
import { requireAuth } from './auth';
import { asyncHandler } from './asyncHandler';

// "DOES THE ACCOUNT HOLD THE CARD WITH THIS ID?" (MOBILE-B; Fable, Nov 26). The phone companion counts a note as sent only when the account holds its Card, and it used to learn that by downloading the
// whole account for each note. This answers that one question, yes or no, for the signed-in writer's own rows, and reads nothing else. No table and no field of its own.
// A Card is one element of a Board's `boxes`. A Board she deleted, or a Card she deleted in place, still counts: the note arrived, and is never added again.
export const cardHeldRouter = Router();

cardHeldRouter.get('/card-held/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `select exists (select 1 from journal_entries where user_id = $1 and boxes @> $2::jsonb) as held`,
    [req.session.userId as string, JSON.stringify([{ id: req.params.id }])]);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ held: rows[0]?.held === true });
}));
