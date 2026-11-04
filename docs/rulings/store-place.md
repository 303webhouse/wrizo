# Rulings: `apps/desktop/src/store/place.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[place §n]` points here.

## place §1

From `apps/desktop/src/store/place.ts`, line 7 at `f079d49e` (the comment that stays: "the place: "where you are" is always a Drawer or a Journal; no schema change (a set is a projects row with a drawerId; the first Journal is a read-time rule); the bootstrap only ever ADDS; every reader writes nothing").

```ts
// BIG PROJECTS, STEP 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18). THE PLACE: "where you are" is always a Drawer or a Journal.
//
// SCHEMA CHANGE: NONE. Everything here is rows in collections that already exist (drawers, projects, journal_entries) plus two per-device
// localStorage keys (the place, the open counts). A SET is a `projects` row with a `drawerId`; the FIRST JOURNAL is not a row at all but a
// read-time rule over the pages with no live home. Nothing is moved behind the writer's back: the Top Drawer bootstrap only ever ADDS a Drawer
// and its one set, and only for an account that has never had a Drawer row.
//
// Pure data: it imports no component, owns no layout, and every reader below WRITES NOTHING (the views never touch orderIndex).
```

## place §2

From `apps/desktop/src/store/place.ts`, line 52 at `f079d49e` (the comment that stays: "is this the account's untouched top drawer? Render-time only: the born-with id AND name, so a renamed drawer keeps its name").

```ts
/**
 * FLUX V2 - is this the account's untouched top drawer? A render-time question only (the Root word, ruled Oct 21): true for the born-with id AND the born-with name, so a drawer the
 * writer renamed keeps its own name. Nothing here ever writes a name.
 */
```
