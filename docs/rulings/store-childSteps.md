# Rulings: `apps/desktop/src/store/childSteps.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[childSteps §n]` points here.

## childSteps §1

From `apps/desktop/src/store/childSteps.ts`, line 7 at `f079d49e` (the comment that stays: "child cards under a step, pure: an ordinary text card nested with the existing parentId (no new data), titled "<Word> n", carrying the word's question as `prompt`; one level deep").

```ts
// "ADD SCENES..." (brief Downloads\add-scenes-brief.md; Nick approved the design and the word table) - CHILD CARDS UNDER A STEP, as PURE model. A child is an ordinary text card that nests under its step with the EXISTING
// `parentId` (already synced, already read by Storyboard / Outline / the Walk's order): NO new data. It lives in the step's lane, is ordered right after the step (after any children it already has), is titled
// "<Word> n" continuing the numbering, and carries the word's question as `prompt` - W3's placeholder, shown in the empty body and never part of `text`. One level deep: a sub-step has no door. The WORD changes with the
// deck (the registry's optional `childWord`; the words themselves live in the lexicon). components/ScenesPopover.tsx asks "How many?"; the board calls addChildren on Add.
```
