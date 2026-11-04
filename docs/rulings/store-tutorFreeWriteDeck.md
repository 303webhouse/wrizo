# Rulings: `apps/desktop/src/store/tutorFreeWriteDeck.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[tutorFreeWriteDeck §n]` points here.

## tutorFreeWriteDeck §1

From `apps/desktop/src/store/tutorFreeWriteDeck.ts`, line 1 at `f079d49e` (the comment that stays: "the Free Write roster is DECK-DRAWN, never model-drawn: every line is a verbatim member of a local pool, drawn synchronously, so "nothing was sent" is structural").

```ts
// ITEM 84, THE DECK PHASE — the Tutor's Free Write roster, DECK-DRAWN.
//
// Nick's lock record (docs/menus/tutor/tutor-menus-lock-record.md §1 line 1) redesigned
// the Free Write roster to: (A) a blank composer with a cursor · (B) "Writing Prompt" ·
// (C) "Unblock" · (D) "Free Writing Tips". His §6 Q2 word — "Stimulus." — ruled a writing
// prompt lawful as a spur ("a prompt is a spur, not the writer's work"), and his mechanism
// ruling split (B) into two phases. THIS FILE IS THE DECK PHASE, and only the deck phase:
//
//   DECK-DRAWN, NEVER MODEL-DRAWN. Every line a preset renders is a verbatim member of one
//   of the local pools below. The draw is SYNCHRONOUS and LOCAL — there is no fetch, no
//   await, no model, and no wire act anywhere in this module. Because the draw is
//   synchronous and local, "nothing was sent" is a STRUCTURAL fact, not a policy: a
//   model-composed line could not be a pool member.
//
// The precedent is FX15's first-line invite, inherited whole — its pool + synchronous draw
// (components/useFirstLineInvite.tsx), its no-near-repeat ring (store/idleNudges.ts's
// pick()), its window inspection seam, and its harness assertion shape (fx15.mjs:113: "the
// rendered line is a verbatim member of the local NUDGE_POOL deck"). What FX15 could NOT
// give is the CONTENT: NUDGE_POOL is the in-page idle-nudge deck (bare sensory fragments
// tuned for a slip over the paper), the wrong register for a Tutor preset, and it holds
// nothing at all for Unblock or Free Writing Tips. These three pools are new and authored.
//
// NOT IN SCOPE, and deliberately unstubbed: the MODEL PHASE (item 108 — the Tutor Memory
// Arc), where the carve-out sentence, the deck->model threshold, and the retrieval design
// settle together. Nothing here reaches toward it. Because nothing travels, this phase
// needs no disclosure gate and no carve-out sentence at all.
//
// TWO STANDING LAWS BIND THE CONTENT BELOW:
//   * THE VOICE LAW (lock record §2) — impersonal, phrased at the work, never at the
//     writer. No "you", no "your", no first person, anywhere in these pools.
//   * TD1's FRAME — locate, diagnose, direct; never supply. Unblock and Free Writing Tips
//     are guidance ABOUT writing, never writing itself. A prompt is a spur toward the
//     writer's own page, never a piece of their work.
// And no genre assumptions: nothing below presumes fiction over memoir over essay, or any
// particular kind of story inside fiction.
```
