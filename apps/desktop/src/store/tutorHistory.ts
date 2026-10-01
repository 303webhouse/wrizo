// ITEM 215 — INTERIM RULE (Fable, 2026-09-30): the client sends only the most
// recent messages within the server's own cap, always ending with the writer's
// new one; the thread on screen is unchanged, and the server is unchanged.
// TUTOR desk states the long-term rule later (raise the cap? summarize what
// falls off? tell the writer?) — this is the mechanical stopgap that keeps a
// long-lived Tutor thread SENDABLE at all in the meantime.
//
// Pure and dependency-free, like ink.ts / strokeBasis.ts, so it is testable
// without React or a browser — and so a proof of this file can run the exact
// function Tutor.tsx calls, never a re-typed copy of it.
//
// The role union is written out (not imported) because no shared type exists
// for it — types/index.ts's own JournalEntry['tutor']['messages'] comment
// states the same 'writer' | 'tutor' union inline, the same way.
type TutorRole = 'writer' | 'tutor';

// TUTOR_MAX_MESSAGES mirrors apps/server/src/tutor.ts's own MAX_MESSAGES (20).
// It is a SEPARATE constant, not an import — the client and server are
// different packages with no shared module today (the same reason
// MAX_DELTA_CHARS/MAX_BIBLE_CHARS/MAX_SELECTION_CHARS are each independently
// capped on both sides, per that file's own comments) — but it must stay
// numerically mirrored: raising this without raising the server's constant
// wastes nothing (the server would just re-reject), and lowering the server's
// without lowering this reopens item 215's exact failure. If TUTOR desk changes
// the server's cap, this constant changes with it in the same commit.
export const TUTOR_MAX_MESSAGES = 20;

/**
 * Cap a stored thread to at most `max` messages before it travels on the wire,
 * keeping the MOST RECENT ones and their existing order (a stored thread is
 * already chronological, so this starts as exactly `slice(-max)`; a length at
 * or under `max` returns unchanged). The writer's own message they just sent
 * is always the array's last element (Tutor.tsx appends it to storage before
 * assembling history), so it is always included as long as `max >= 1`.
 *
 * ITEM 215 AMENDMENT (Fable, 2026-09-30) — THE WINDOW MUST OPEN ON A WRITER
 * TURN. A thread is not guaranteed to alternate in lockstep with `max`: in a
 * strictly alternating writer/tutor thread, a 20-message cut can land ON a
 * tutor turn (an odd total length slices to an even-length window whose first
 * surviving element is the tutor's), which maps to an assistant-first
 * conversation once role is translated to 'user'/'assistant' on the wire
 * (tutor.ts). Some providers refuse that shape outright — env.tutorBaseUrl
 * (DeepSeek by default) is untested against it, so this is not assumed safe;
 * it is closed instead. After the slice, every LEADING tutor turn is dropped
 * (a loop, not a single `shift`, since more than one could in principle
 * precede the next writer turn) — the newest message is the array's last
 * element and is never touched by this, so "ends with the newest" still
 * holds; only the window's OPEN edge moves, and only when it must.
 */
export function capTutorHistory<T extends { role: TutorRole; text: string }>(
  full: readonly T[],
  max: number = TUTOR_MAX_MESSAGES,
): T[] {
  if (max <= 0) return [];
  let capped = full.length <= max ? full.slice() : full.slice(full.length - max);
  while (capped.length > 0 && capped[0].role === 'tutor') capped = capped.slice(1);
  return capped;
}
