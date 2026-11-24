import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// PRESETS-B item 4 (load sheet v2, section 4; content decks/content.ts): Narrow My Question (The Academy): 5 steps, no deal question. Two columns, reading across (Research Paper's own layout).
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts). [step id, title]

const COLS = 2;
const W = colWidth(COLS);

const STEPS: [string, string][] = [
  ['topic', deskTerm('deckNarrowMyQuestionTopicTitle')],
  ['curious', deskTerm('deckNarrowMyQuestionCuriousTitle')],
  ['who-cares', deskTerm('deckNarrowMyQuestionWhoCaresTitle')],
  ['one-question', deskTerm('deckNarrowMyQuestionOneQuestionTitle')],
  ['find-out', deskTerm('deckNarrowMyQuestionFindOutTitle')],
];

function layout(): DealtCardSpec[] {
  return STEPS.map(([step, title], i) => ({
    key: step,
    ...guidedStep('narrow-my-question', step, title),
    x: colX(i % 2, COLS), y: rowY(Math.floor(i / 2)), w: W, h: CARD_H,
  }));
}

export const narrowMyQuestionDeck: DeckDefinition = {
  id: 'narrow-my-question',
  room: 'academy',
  nameTerm: 'deckNameNarrowMyQuestion',
  questions: [],
  deal: () => layout(),
};
