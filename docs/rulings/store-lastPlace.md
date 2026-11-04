# Rulings: `apps/desktop/src/store/lastPlace.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[lastPlace §n]` points here.

## lastPlace §1

From `apps/desktop/src/store/lastPlace.ts`, line 4 at `f079d49e` (the comment that stays: "resume on open: one per-device localStorage key, not a collection (a flush can neither erase nor resurrect it), carrying its account id; three states, because "no pointer yet" and "decided: no place" differ").

```ts
// RESUME ON OPEN (docs/plans/resume-on-open.md, cleared by Fable 2026-10-16).
// After the splash, a signed-in writer lands on the last Page or board they had
// OPEN — not the front door. This module is the whole data side: where "last
// place" is saved, how it is read back, and what a cold open should do with it.
// Storage-only and pure: it imports nothing from the Splash and no component.
//
// WHERE IT LIVES: one localStorage key, per device, no new column and no sync.
// It is NOT one of the collections, so resetLocalData() and persistence's
// wholesale flush can neither erase nor resurrect it. The record carries the
// account id it was written for: another account's pointer is treated as absent,
// and sign-out clears it besides.
//
// THREE RECORD STATES, because "no pointer yet" and "decided: no place" must
// differ (Fable's ruling 2): an ABSENT record is the one case that seeds itself
// once from getResumeTarget() (the edited race); a record with id:null means that
// decision was already made, so a later deleted/Trashed target gets the blank Page
// and never quietly re-seeds from the edited race.
```

## lastPlace §2

From `apps/desktop/src/store/lastPlace.ts`, line 89 at `f079d49e` (the comment that stays: "seed from the edited race, once, for a writer with no record at all; returns the record written").

```ts
/** Seed from the edited race, once, for a writer with no record at all (ruling 2). Returns the record written. */
```

## lastPlace §3

From `apps/desktop/src/store/lastPlace.ts`, line 100 at `f079d49e` (the comment that stays: "the cold-open decision: absent record - seed once, then decide; a pointer that no longer resolves, or "no place": a fresh blank Page, and the record becomes "decided: none"").

```ts
/**
 * The cold-open decision for a signed-in writer. Absent record: seed once, then
 * decide on it. A pointer that no longer resolves (deleted, Trashed, gone) or a
 * "no place" record: a fresh blank Page (ruling 1), and the stale pointer becomes
 * the "decided: none" record so it is not re-seeded.
 */
```
