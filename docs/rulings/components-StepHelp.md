# Rulings: `apps/desktop/src/components/StepHelp.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[StepHelp §n]` points here.

## StepHelp §1

From `apps/desktop/src/components/StepHelp.tsx`, line 10 at `ded4321b` (the comment that stays: "the "?" on a dealt step: a portal popover anchored at the "?" (sentence, example, more -> Tutor); `more` stages an ask and sends nothing; Esc returns focus; it is outside .board-text, so the board's pointer machine stands down for it").

```ts
// W3 / W11a - THE "?" ON A DEALT STEP. A card dealt from a Tier 1 deck carries `deckStep` ({ deck, step }); this puts a small "?" at the END OF ITS TITLE. Pressing it opens a popover
// ANCHORED at the "?" (Fable's frame 06): the step's one plain sentence, one italic example, and "more -> Tutor". The words are local content shipped with the app (decks/content.ts), never
// stored on the card; the example is a public-domain or invented specimen, never a line for the writer's own work.
//
//  - "more" STAGES an ask in the Tutor composer ("What does <step> do?", store/tutorStage.ts) and sends nothing - the writer reads it, edits it and presses Send, or doesn't.
//  - FOCUS: opening moves focus to "more" (the one control inside); Esc closes the popover and RETURNS focus to the "?" (capture phase, so the board's own Esc handling never sees it);
//    a press outside closes it too. Staging a Tutor ask closes it and lets the Tutor's composer take focus (it is what the writer asked to go to).
//  - THE PAGE IS PRIMARY: the popover is a portal overlay positioned from the "?"'s rect - it never moves, resizes or unmounts the card or the board.
//  - The "?" lives inside the card but is NOT part of its text (a sibling of .board-text): the board's pointer machine stands down for it exactly as it does for .board-layer-toggle.
//  - Words: Arbor "?" / "more"; Flux "[?]" / "MORE" (lexicon: deckStepHelpGlyph / deckStepHelpMore); the target is the theme's own Tutor word (tutorTitle: "The Tutor" / "The Operator").
```
