# Rulings: `apps/desktop/src/store/pageHome.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[pageHome §n]` points here.

## pageHome §1

From `apps/desktop/src/store/pageHome.ts`, line 5 at `e2898deb` (the comment that stays: "the location line says "in <drawer>", and in ONE reader: three spellings of one fact drifted, so they are now three callers of this").

```ts
// ITEM 163 — THE LOCATION LINE SAYS "IN", AND IT SAYS IT IN ONE PLACE.
//
// Nick read "BOARD #2 / TEST BOARD" as a subtitle, because a bare name is a
// subtitle: nothing in it says TEST BOARD is the DRAWER the board lives in.
// Ruled: **the second line takes the CAPTION FORM, "in TEST BOARD."**
// WIDENED to the canvas board-card, *"same swap, same lexicon term."*
//
// ⛔ AND IT IS ONE READER, WHICH IS 131(a)'s SHAPE — *fix the class.* Before
// this, the same fact was spelled THREE times in two files: `drawerNameFor`
// (the Plan panel's board ROW, bare), `drawerCaptionFor` (the zone's CAPTION,
// already "in <drawer>") and `boardDrawerLine` (the canvas BOARD-CARD, bare).
// Two of the three were already wrong and the third was already right, which is
// exactly what three copies of one rule produce. Fixing them in place would have
// left three copies to drift again, so they are now three callers of this.
//
// It is the same lesson PW1's own errata earned with `getBoardsConnecting`: one
// NAMED READER, never the same rule re-expressed at each call site.
//
// ⚠ THE SCOPE IS DRAWER-NAMING LINES ONLY (ratified). The other two forms this
// second line can take are NOT touched and must not be:
//   · `cascadePlanRelationOwn` — the page's OWN plan board. A relation, not a
//     location; prefixing it with "in" would make it a lie.
//   · `cascadePlanNoDrawer` ("Not in a drawer") — it says there is NO drawer, so
//     "in Not in a drawer" would be nonsense. A board with no drawer says so
//     rather than borrowing a name.
// A harness must assert those two BY NAME, or it could pass on their ABSENCE
// while claiming the swap was scoped.
```

## pageHome §2

From `apps/desktop/src/store/pageHome.ts`, line 66 at `e2898deb` (the comment that stays: ""just the location", in the lexicon; pageHomeProject's {drawer name} is a placeholder substituted here").

```ts
  // ITEM word-diet (Nick, Oct 13) — "just the location", found hardcoded
  // during the census and moved into the lexicon: pageHomeLoose/
  // pageHomeJournal/pageHomeProject/pageHomeAlso. pageHomeProject's own
  // "{drawer name}" is a literal placeholder token in the lexicon value,
  // substituted here the same way syncNotice.ts's own {title}/{n} are —
  // read as "interpolate the place name" rather than a rename to a
  // different underlying entity (today that's still the project's own
  // title; flagged for confirmation in the report).
```
