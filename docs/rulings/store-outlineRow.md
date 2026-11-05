# Rulings: `apps/desktop/src/store/outlineRow.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[outlineRow §n]` points here.

## outlineRow §1

From `apps/desktop/src/store/outlineRow.ts`, line 1 at `7f1c6a84` (the comment that stays: "the Outline row's reading of a card's text: an <input> cannot hold a newline, so it shows the title and the rest sits beside it read-only; pure, so the editing rule is proved without a browser").

```ts
// The Outline row's reading of a card's text (BM1 S7, repaired Oct 25 - deploy #8's data bug). A card's text is `Title\nbody`: the Outline row is an <input>, which cannot hold a newline, so it shows the TITLE (the first line)
// and the text after it sits beside the input, read-only. Pure functions, no imports - the editing rule lives here so it can be proved without a browser.
```
