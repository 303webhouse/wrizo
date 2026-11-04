# Rulings: `apps/desktop/src/decks/library/characterStudy.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[characterStudy §n]` points here.

## characterStudy §1

From `apps/desktop/src/decks/library/characterStudy.ts`, line 6 at `4d6af3d9` (the comment that stays: "Character Study, dealt PRE-THREADED: each character gets the same four self cards (want vs. need, the wound, the contradiction, voice notes), with composed titles ("<Label> <letter>: <type title>", both halves through deskTerm(), the letter generated); each ADJACENT pair of characters gets one Relationship card, threaded to both sides' Want vs. Need card. The wizard offers two, three or four characters: one would carry no relationship card, so the deal would not be pre-threaded.").

```ts
// B3 S2 — Character Study, promoted onto B3's ship set on Fable's own call
// (item 36): "once the engine exists a deck's marginal cost is a
// definition file, and Character Study is the threads demonstration the
// whole system deserves." Dealt PRE-THREADED (catalog #6's own wording):
// each character gets the same four self cards (want vs. need, the wound,
// the contradiction, voice notes — catalog verbatim), composed titles
// ("<Label> <letter>: <type title>", both halves resolved via deskTerm(),
// the letter alone is generated, non-lexicon data); each ADJACENT pair of
// characters gets one Relationship card, threaded (the engine's own
// 'connection' Box kind, materialized by decks/engine.ts) to both sides'
// own Want vs. Need card — "wire the cast together on the board," the
// catalog's own words.
//
// Wizard: how many characters (two / three / four) — "One" is deliberately
// NOT offered: a study with a single character can carry no relationship
// card at all, which would make "dealt pre-threaded" false for that
// answer, contradicting the very reason this deck was promoted. A judgment
// call, recorded in the build report.
```
