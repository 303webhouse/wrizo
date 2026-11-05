# Rulings: `apps/desktop/src/store/tutorHistory.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[tutorHistory §n]` points here.

## tutorHistory §1

From `apps/desktop/src/store/tutorHistory.ts`, line 1 at `7f1c6a84` (the comment that stays: "the client sends only the most recent messages within the server's cap, ending with the writer's; pure and dependency-free, so a proof runs the real function").

```ts
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
```

## tutorHistory §2

From `apps/desktop/src/store/tutorHistory.ts`, line 17 at `7f1c6a84` (the comment that stays: "mirrors apps/server/src/tutor.ts's MAX_MESSAGES (20): separate packages, so it must stay numerically mirrored").

```ts
// TUTOR_MAX_MESSAGES mirrors apps/server/src/tutor.ts's own MAX_MESSAGES (20).
// It is a SEPARATE constant, not an import — the client and server are
// different packages with no shared module today (the same reason
// MAX_DELTA_CHARS/MAX_BIBLE_CHARS/MAX_SELECTION_CHARS are each independently
// capped on both sides, per that file's own comments) — but it must stay
// numerically mirrored: raising this without raising the server's constant
// wastes nothing (the server would just re-reject), and lowering the server's
// without lowering this reopens item 215's exact failure. If TUTOR desk changes
// the server's cap, this constant changes with it in the same commit.
```

## tutorHistory §3

From `apps/desktop/src/store/tutorHistory.ts`, line 28 at `7f1c6a84` (the comment that stays: "cap a stored thread to the most recent `max` messages in order; a window this function cut must open on a writer turn").

```ts
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
```

## tutorHistory §4

From `apps/desktop/src/store/tutorHistory.ts`, line 55 at `7f1c6a84` (the comment that stays: "the leading-tutor drop repairs a truncation, so it never runs on a thread this function did not cut (a spur may legitimately open one)").

```ts
  // BATCH EIGHT FIX (2026-10-01) — the leading-tutor drop is a truncation
  // repair; it must never run on a thread this function never cut. A
  // thread UNDER the cap can legitimately open on a tutor turn — item 84's
  // own deck phase commits the drawn spur as a tutor-role message
  // immediately before the writer's reply to it, on purpose, so the
  // transcript (and the wire) read "the spur, then the answer to it."
  // The ORIGINAL amendment ran the drop unconditionally, so a two-message
  // spur+reply thread — nowhere near 20 messages, never sliced — had its
  // own spur stripped from the wire: the model answered a prompt it could
  // no longer see. Caught live in Batch Eight's own parked leg (item84.mjs
  // S5, "the wire carries the spur as an ordinary turn of the
  // conversation"). Only a window this function ITSELF cut can have opened
  // on a slicing artifact; an untouched thread's own first message is the
  // writer's story to tell, never this function's to edit.
```
