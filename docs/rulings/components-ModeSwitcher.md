# Rulings: `apps/desktop/src/components/ModeSwitcher.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ModeSwitcher §n]` points here.

## ModeSwitcher §1

From `apps/desktop/src/components/ModeSwitcher.tsx`, line 6 at `7f1c6a84` (the comment that stays: "the legacy strip below the 1100px gate: internal keys stay journal/drafting; Revise renders only where the host opts in (reviseEnabled), so QuickSprint is unchanged; Draft's sub-label is 'mark'; labels come from the shared lexicon terms").

```ts
// Mode switcher (writing-screen redesign). Top-bar tabs with stage sub-labels;
// active tab filled brass. Internal keys stay journal/drafting so the editor +
// persisted mode keep working; only the labels changed. Free write = forward-only
// (idea generation, AI sealed); Draft = free edit. Format is greyed. File actions
// (Publish today; Workshop returns when built) render inline as trailing tabs in the same strip.
//
// TH2 lexicon sweep — this is the SHARED component PageEditor/QuickSprint
// mount (JournalEntry has its own separate tab row, already swept in TH1);
// 'Free write' lived only here, un-lexiconed, so those two surfaces' tabs
// were never actually themed despite both files importing useLexicon.
// ITEM 112-A — BOTH SIDES MUST AGREE (brief §2). ModeStrip (the framed strip)
// makes Revise live; this strip is the same truth below the 1100px gate, and
// leaving it out would have produced a state it could not express: a page whose
// PER-PAGE mode persisted as 'revise' and then loaded narrow would render this
// row with NO TAB SELECTED AT ALL.
//
// GATED, because this component is shared and 112-A charters ONE surface. It is
// mounted by the unframed Page (PageEditor.tsx) AND by QuickSprint — a scratch
// surface with its own separate mode key, no DeskFrame, no hands, and no charter
// naming it. So Revise renders here only when the host opts in (`reviseEnabled`),
// exactly the lever ModeStrip already uses for Free Write on the script surface.
// QuickSprint passes nothing and is byte-identical to pre-112-A.
//
// THE SUB-LABEL — SETTLED 2026-09-05 (Fable's ruling): DRAFT MARKS, REVISE
// DRESSES. Draft's sub read 'revise', written when revise was a STAGE of Draft
// rather than a room of its own; 112-A made Revise a room and left the word
// behind, pointing at a door that had moved. It now reads 'mark', from the
// charter's own organizing sentence — "Free Write produces, Draft marks, Revise
// dresses" — the same sentence Revise's 'dress' already came from. The
// stop-and-surface raised in docs/menus/tutor/item112a-s0.md is answered.
//
// THIS TABLE IS SHARED, and the change therefore reaches BOTH of its mounts —
// PageEditor's strip below the 1100px gate AND QuickSprint's. That is deliberate
// and it is the honest outcome: the word was equally wrong on both, and Draft
// marks on every surface that has a Draft. QuickSprint.tsx itself is untouched
// (it passes no props into this and renders no Revise tab, since `reviseEnabled`
// defaults false), so what changes there is one word of a sub-label and nothing
// else. Recorded because "one line" and "reaches two surfaces" are both true and
// only one of them is obvious.
// theme-leftovers (Fable: "route the legacy strip's Draft/Revise/Format
// through the same lexicon terms the framed mode strip uses; reuse, don't
// invent") — `deskTerm` reuses ModeStrip.tsx's own terms (modeDraft/
// modeRevise, deskLexicon.ts) for the two it already has; Format has no
// top-level mode term there (ModeStrip carries no Format tab at all), so
// this reuses the Sliver's own section-heading word for the same English
// term, railFormat, rather than inventing a new lexicon key for one tab.
```

## ModeSwitcher §2

From `apps/desktop/src/components/ModeSwitcher.tsx`, line 91 at `7f1c6a84` (the comment that stays: "a separator before each action tab splits writing postures from delivery; visual only - actions still dispatch as actions").

```ts
      {/* A separator before each action tab splits the strip into three sections:
          writing (postures) | delivery (a workshop group returns when Workshop is built;
          hidden until then, Oct 23). Visual only — the actions still
          dispatch as actions, not postures. */}
```
