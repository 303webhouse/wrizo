# Rulings: `apps/desktop/src/decks/formCounts.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[formCounts §n]` points here.

## formCounts §1

From `apps/desktop/src/decks/formCounts.ts`, line 3 at `4d6af3d9` (the comment that stays: "The deck library in Machina's dress: two pieces of DATA the panel needs, both read from the real registry. blockRangeLabel(deck) is a row's block count: a RANGE where the deal question changes it (Three-Act 6-9, Argumentative Essay 5-7), one number where it does not (Story Circle 8), nothing for a deck that deals a block per page the writer picks (From my pages); computed from the deck's own deal() over every combination of its choice questions, so it cannot drift. FORMS_GROUPS is Machina's seven group labels, each with its decks; the registry's rooms map onto them (a group's `room` is its decks' room; the label is the lexicon's), and every registered deck appears exactly once. The one hand-set figure: Character Study reads "2-4 x" (two to four characters, a count the writer chooses).").

```ts
// MACHINA FORMS (Fable's brief Oct 24; frames m7 / m8) - the deck library in Machina's dress. Two pieces of DATA the panel needs, both read from the real registry rather than typed in twice:
//   blockRangeLabel(deck)  the block count at the right of a row: a RANGE where the deal question changes it (Three-Act 6-9, Argumentative Essay 5-7), one number where it does not (Story Circle 8), nothing for a deck that
//                          deals a block per page the writer picks (From my pages). Computed from the deck's own deal() over every combination of its choice questions - so it can never drift from what the deal really makes.
//   FORMS_GROUPS           Machina's seven group labels, in the mockup's order, each with its decks in the mockup's order. The registry's rooms map onto them (a group's `room` is the room its decks live in; the label is the
//                          lexicon's - deckRoom* under Machina), and every registered deck appears exactly once.
// The ONE hand-set figure: Character Study reads "2-4 x" (two to four CHARACTERS, a count the writer chooses, not a block total) - the mockup's own wording for a deck whose size is a multiple of a number you pick.
```
