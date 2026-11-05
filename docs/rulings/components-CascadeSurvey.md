# Rulings: `apps/desktop/src/components/CascadeSurvey.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[CascadeSurvey §n]` points here.

## CascadeSurvey §1

From `apps/desktop/src/components/CascadeSurvey.tsx`, line 24 at `7f1c6a84` (the comment that stays: "carried on the item so every other caller stays one ungrouped grid; a heading renders whenever this value changes, so the builder's order is the sectioning").

```ts
  // PW1 S2 — TWO SECTIONS (Nick, Q4): a board's own Cards, then the Pages
  // linked to it. Carried on the ITEM rather than as a separate `sections`
  // prop so every existing caller stays byte-identical (all undefined → one
  // ungrouped grid, exactly as before) and so ordering stays `buildSurvey`'s
  // single responsibility. A heading renders whenever this value CHANGES from
  // the previous item's, which means the builder's order IS the sectioning.
```

## CascadeSurvey §2

From `apps/desktop/src/components/CascadeSurvey.tsx`, line 37 at `7f1c6a84` (the comment that stays: "shape teaches the kind: a board is wider than tall, a page taller than wide - no colour, no badge").

```ts
  // PW2 S2 AMENDMENT (Nick, verbatim: "use a different thumbnail —
  // horizontal rectangles for Boards, vertical rectangles for Pages").
  // SHAPE TEACHES THE KIND, in the rail as it already does on the canvas:
  // a board is WIDER THAN TALL, a page TALLER THAN WIDE. It costs no colour
  // and needs no badge — the silhouette is legible before the text is read.
```

## CascadeSurvey §3

From `apps/desktop/src/components/CascadeSurvey.tsx`, line 73 at `7f1c6a84` (the comment that stays: "the drag half of the display acts: the builder supplies the payload (it alone knows the board and box), and a row that returns null is not draggable").

```ts
  // PW1 S3 — the drag half of the two display acts (Nick, Q4): drag a row onto
  // the canvas and it lands WHERE DROPPED. The BUILDER supplies the payload
  // (it alone knows which board and which box a row stands for), and a row that
  // returns null is simply not draggable — a card, or a row with no lawful
  // drop. Optional because the drag needs a canvas and so exists only on a
  // board; the MENU act is the one that must be complete everywhere, and it is
  // (`renderMenu`).
```

## CascadeSurvey §4

From `apps/desktop/src/components/CascadeSurvey.tsx`, line 138 at `7f1c6a84` (the comment that stays: "a right-click opens the row's one menu (the same `⋯`), so the gesture is a shortcut and never the only path").

```ts
      // PW1 S3 — right-click is the SECOND display act (Nick, Q4), and it is
      // deliberately not a second menu: it opens the one the row already
      // carries. Every act stays reachable by the keyboard and the unfamiliar
      // hand through that same `⋯`, which is the whole point of the twin law
      // (PW22) — a gesture may be a shortcut, never the only path.
```
