import { stepQuestion } from './content';

// W3 - a Tier 1 deck deals a STEP as a question: the card's title is the step's name (still resolved through the deck's own lexicon term, so the Walk's rail, Grafts and the Tutor's
// "Where does this fit?" read one name), its BODY IS EMPTY, and the question the writer answers rides as `prompt` with the `deckStep` key. Spread this into a DealtCardSpec.
// `variant` is the answer id for a step whose question varies by the deal (Worldbuilding's Rules, Grant's Alignment, Feature Story's Nut Graf, the Fifteen Beats' step 8).
export function guidedStep(deck: string, step: string, title: string, variant?: string): { title: string; body: string; prompt: string; deckStep: { deck: string; step: string } } {
  return { title, body: '', prompt: stepQuestion(deck, step, variant), deckStep: { deck, step } };
}
