# Rulings: `apps/desktop/src/store/fontSize.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[fontSize §n]` points here.

## fontSize §1

From `apps/desktop/src/store/fontSize.ts`, line 1 at `e2898deb` (the comment that stays: "type size in points: the lattice is computed, never listed; 11 is today's rendering exactly; stored as points, never a step index, so the lattice can change without touching a page").

```ts
// ITEM 207 — page and card type SIZE, in points. Pure: no imports, no store, no DOM.
//
// THE LATTICE (Nick, 2026-09-24): steps start at 11 and move one point at a time between 6 and 18, then two
// points up to 30, then four points to a reasonable top. Computed, never listed, so the rule stays the rule:
//   6, 7, 8 ... 18   (1 pt)   ·   20, 22 ... 30   (2 pt)   ·   34, 38, 42 ... 118   (4 pt)
// `+` stops at 118 (four-point steps from 30 land on 118, never 120); a TYPED size may go to 120, and `-` from 119
// or 120 returns to 118 (PLAN desk's default for the 118/120 wrinkle - vetoable, and Nick's "120pt, maybe?").
//
// WHAT THE NUMBER MEANS (Fable's ruling, 2026-09-24): the number is the size the page PRINTS at; the screen is a
// uniform zoom of it. 11 IS TODAY'S RENDERING exactly (17px at scale 1), so a page that never chose is untouched:
//     px = 17 x (n / 11) x --paper-scale
// Stored as the NUMBER OF POINTS, never a step index, so the lattice can change later without touching a page.
//
// PAGE-SIZE (Fable's ruling a, Oct 23) - ON THE PAGE the number is now REAL POINTS IN PAGE UNITS: 12 pt = 16px at page scale 1, scaled with the page
// (index.css `--wz-pt`, one point of the letter page as it is drawn):  px = n x --wz-pt. A NEW page defaults to 12 (PAGE_SIZE_DEFAULT). NO data
// rewrite: a page that never chose reads through the new default; a page that stored a size keeps its number, now in real points (a stored 11
// draws 14.7px where it drew 17px - the deploy note tells the writer to press + if a page looks small). CARDS are untouched: they keep their own
// default 11 and their own formula (cardTypeStyle), so SIZE_DEFAULT below stays the CARD default and PROSE_BASE_PX stays its pre-page-size record.
```
