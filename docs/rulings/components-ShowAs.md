# Rulings: `apps/desktop/src/components/ShowAs.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[ShowAs §n]` points here.

## ShowAs §1

From `apps/desktop/src/components/ShowAs.tsx`, line 6 at `7f1c6a84` (the comment that stays: "Show As replaces the view tabs: icons first, words open on mouse hover or keyboard focus only (opening shifts the icons, so a tap must not open them); olive at rest, brass for the chosen view").

```ts
// W1 - "SHOW AS" (brief docs/guided-paths/w1-walk-brief.md; frame 02-walk-showas-open): it REPLACES the three view tabs. Icons first, the word on hover (the title); while the strip is open - the pointer on it, or
// focus inside it - icons AND words (data-open). A Board offers Open / Storyboard / Outline / Walk; a Book (the Journal) Flip / Thumbnails; below the DeskFrame width a Deck offers only the Walk, which is no choice, so
// nothing is drawn. Arbor words Open / Storyboard / Outline / Walk, Flip / Thumbnails; Flux Live / Sequence / Spine / Trace, Playback / Index (lexicon). "Last shown as" is the device-local memory (store/boardMode.ts).
// The words open for a MOUSE hover or KEYBOARD focus only (:focus-visible) - never for a touch or pen tap or a mouse press: opening shifts the icons, and a tap that opened the strip between pointer-down and up would land on a different icon (the first box turn: every click mis-landed).
// The icons are the frames' own (18 x 18, 1.3 stroke, currentColor); colour is the stylesheet's: olive at rest, brass for the CHOSEN view (a human choice), never brass at rest.
```

## ShowAs §2

From `apps/desktop/src/components/ShowAs.tsx`, line 47 at `7f1c6a84` (the comment that stays: "hover intent: the words open only after the mouse has rested HOVER_INTENT_MS, so a quick aim still hits the icon it aimed at; a press cancels a pending open").

```ts
      // HOVER INTENT: the words open once a mouse has RESTED on the strip for HOVER_INTENT_MS, never on arrival. Opening shifts the icons, so a pointer that lands and presses at once (a quick aim, a driver that teleports the pointer
      // and clicks) must still hit the icon it aimed at - the first box turn's clicks mis-landed, and fx11 / bm1 flaked on the same race. A press cancels a pending open.
```
