# Rulings: `apps/desktop/src/components/Cascade.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Cascade §n]` points here.

## Cascade §1

From `apps/desktop/src/components/Cascade.tsx`, line 79 at `e2898deb` (the comment that stays: "the rail: the place block (it opens the switcher), Pages and Boards, a divider, Journal, then the foot; no Shelf (its pages show in the Journal); category ids are unchanged so every data-category selector survives").

```ts
// BIG PROJECTS 1a - THE RAIL, top to bottom: the PLACE BLOCK (where you are; it opens the switcher), Pages and Boards bracketed under it, a divider,
// Journal, then the foot (Settings, Themes, Trash). THERE IS NO SHELF: its pages are shown in the Journal (store/place.ts journalMembers), and
// /shelf redirects. Internal category ids are unchanged (`drawers` is the place block, `plan` is Boards) so every data-category selector survives;
// only the labels moved. The place block is rendered by <PlaceBlock>, inside the strip, so it fades with the rest of the rail while typing.
//
// (History: VW1, item 134, grouped the rail by kind - Page and Plan; Drawers; Journal and Shelf. The Shelf left that band on purpose, and now leaves
// the rail altogether.)
```

## Cascade §2

From `apps/desktop/src/components/Cascade.tsx`, line 90 at `e2898deb` (the comment that stays: "the Trash sits at the very foot of the strip (SECTION_TRASH below), not in section C").

```ts
// B1 S5 (superseded by Nick's own placement) — the Trash NO LONGER lives in
// section C; it sits at the very foot of the strip (SECTION_TRASH below), the
// last place of all, a thin line above it.
```

## Cascade §3

From `apps/desktop/src/components/Cascade.tsx`, line 142 at `e2898deb` (the comment that stays: "zoomed, the prose page is painted by a transform in a stage-wide column, so the margin is the painted page's - the twin of Tutor.tsx's availableTutorMargin").

```ts
  // PAGE-SIZE (drawer-mirror CD, Oct 24) - the prose page is PAINTED by a transform, ~1.6x and in a stage-wide column while zoomed: the margin is the
  // painted page's (read from the column it was ~0 in the zoom, and the survey never docked) - the twin of Tutor.tsx's availableTutorMargin
```

## Cascade §4

From `apps/desktop/src/components/Cascade.tsx`, line 180 at `e2898deb` (the comment that stays: "the two-drawer law: this drawer registers its close path, so an exclusion handoff shuts it exactly as a click would").

```ts
  // item 83 M1 (R9/R11) — the two-drawer law. This drawer registers its own
  // close path so an exclusion handoff shuts it exactly as a writer's click
  // would (same slide, no second animation), and announces its opens so the
  // Tools drawer yields when the measured band cannot hold both.
```

## Cascade §5

From `apps/desktop/src/components/Cascade.tsx`, line 186 at `e2898deb` (the comment that stays: "the open/close announcement is an effect keyed on one derived truth (a category chosen and not docked), so every path announces and a setState updater stays pure").

```ts
  // item 83 errata E1 (2026-08-28) — THE ANNOUNCEMENT IS STRUCTURAL, the
  // same repair the Sliver takes and for the same two reasons: a setState
  // updater must be pure (announcing from inside one closed the OTHER
  // drawer from within this component's render phase), and an announcement
  // written per-path is only ever as complete as the paths someone
  // remembered. `closePanel` docking a survey was already a silent one —
  // `data-visible="false"` withdraws the panel from the band, so the store
  // should hear a close, and it never did.
  //
  // OPEN, for this drawer, means the panel is actually OCCUPYING the band:
  // a category is chosen AND the panel is not docked away. Keying the effect
  // on that one derived truth means every path — toggle, switch, dock,
  // Escape, dismiss, and the exclusion handoff itself — announces correctly
  // without any of them having to remember to.
```

## Cascade §6

From `apps/desktop/src/components/Cascade.tsx`, line 307 at `e2898deb` (the comment that stays: "closing keeps the pop-out layers drawn for --drawer-dur (inert, data-leaving) so they slide and fade out; `state` stays the one truth every effect reads").

```ts
  // TOOLS #10 item 8 - THE POP-OUTS USE THE TOOLS STRIP'S SLIDE-AND-FADE (Nick's "quiet" motion, every theme; Nomad's own comes with Nomad). Opening plays the CSS slide-and-fade on mount; CLOSING keeps the layers
  // drawn for the same length (--drawer-dur, the short fade under reduced motion) with data-leaving, inert, so they slide back and fade out instead of vanishing. `state` stays the one truth: every effect above
  // still reads it, so the two-drawer announcements and Escape are exactly as before; only what is DRAWN lags a close.
```

## Cascade §7

From `apps/desktop/src/components/Cascade.tsx`, line 366 at `e2898deb` (the comment that stays: "data-category names the button, so a harness never selects a category by index (an index survives a reorder and silently picks a different panel)").

```ts
          // VW1 — THE DOM HOOK. `key` is React-internal and never reaches the
          // DOM, so before this every harness reached these buttons by INDEX.
          // An index survives a reorder and silently selects a different
          // category: none of those selectors throws, so some checks go red
          // and others PASS AGAINST THE WRONG PANEL. That is item 130's shape
          // again - the instrument answered the question it was asked, and it
          // was not the one that mattered. Naming the category makes the rail
          // reorderable without touching a single harness.
```
