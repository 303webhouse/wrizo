# Rulings: `apps/desktop/src/store/drawerSet.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[drawerSet §n]` points here.

## drawerSet §1

From `apps/desktop/src/store/drawerSet.ts`, line 1 at `e2898deb` (the comment that stays: "what the left drawer shows, in one table: Sliver.tsx asks allowed() before rendering a section; pure, tested browserless; the host still decides whether a section has data").

```ts
// PHASE 1 (docs/plans/phase1-drawers.md 3.1) - WHAT THE LEFT DRAWER SHOWS, in one table.
//
// Which tabs a surface has and which sections each tab holds used to be implied by scattered conditions in Sliver.tsx. This is the
// single statement of it; Sliver.tsx asks it (allowed()) before rendering a section, and the browserless harness tests the table.
// It is pure: no React, no storage. The host still decides whether a section has DATA (a screenplay page passes no type member, so there
// is no Typeface there); this table decides whether the section may APPEAR on that surface and tab at all.
//
// It encodes what the drawers show TODAY plus the tab row. Ruled so far (Nick, Oct 9): Free Write = typeface choices + INK, no Format group
// (B/I/U wait for the typing-path work); the open tab is olive and choices are brass outlines; Actions = Tags, Copy, Delete, Header/Footer (Q3).
// Not yet ruled, so absent here on purpose: an INK tab in Draft/Revise (Q2 - the table gives Draft and Revise no tab row, the current law).
```

## drawerSet §2

From `apps/desktop/src/store/drawerSet.ts`, line 30 at `e2898deb` (the comment that stays: "Draft: the full set, in order").

```ts
  // Draft: the full set, in the ruled order - Typeface, Format, Actions, Templates (then the page-kind chips, as today).
```

## drawerSet §3

From `apps/desktop/src/store/drawerSet.ts`, line 32 at `e2898deb` (the comment that stays: "Revise: the Typeface and nothing else").

```ts
  // Revise: the Typeface and nothing else (the standing 112-A ruling).
```
