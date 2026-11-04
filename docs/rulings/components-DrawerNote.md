# Rulings: `apps/desktop/src/components/DrawerNote.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DrawerNote §n]` points here.

## DrawerNote §1

From `apps/desktop/src/components/DrawerNote.tsx`, line 4 at `ded4321b` (the comment that stays: "a pressable "?" note, not a hover tooltip (hover is unreachable by keyboard and touch); an overlay outside the tablist, so it displaces nothing and never changes tabs").

```ts
// PHASE 1 (S3) - THE SMALL "?" NOTE beside a tab's word. A PRESSABLE note, not a hover tooltip (Nick/Fable, Oct 9): a hover-only tooltip is
// unreachable by keyboard and by touch. Press the "?" (Enter/Space/tap) and a short note opens; Escape, a press anywhere outside, or focus
// leaving it closes it. It is an overlay: it takes no room, so it displaces nothing, and it is NOT part of the tab it sits beside (it lives
// outside the tablist, so pressing it never changes tabs).
//
// The note's words are the theme's own (a lexicon term). A theme whose term has no explainer passes none and gets no "?" at all.
```

## DrawerNote §2

From `apps/desktop/src/components/DrawerNote.tsx`, line 17 at `ded4321b` (the comment that stays: "measured once at open: near the viewport's right edge the pop opens leftward so its text stays on screen").

```ts
// ITEM word-diet review (Fable, Oct 13, W4) — the pop's own CSS opens
// rightward from the button's left edge (max-width 260px); near the right
// edge of the viewport (the Tutor Ask box's own "?" is the measured case)
// that runs the TRUST text off-screen. Measured once at open, not tracked
// live (the button doesn't move while its own pop is open) — mirrors the
// hittable-point measurements elsewhere in this codebase: ask the real DOM,
// never assume a position from the markup alone.
```
