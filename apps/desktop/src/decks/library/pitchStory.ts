import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// PRESETS-B item 4 (load sheet v2, section 4; content decks/content.ts): Pitch Story (The Business Desk): 5 steps, no deal question. Two columns, reading across (Research Paper's own layout).
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts). [step id, title]

const COLS = 2;
const W = colWidth(COLS);

const STEPS: [string, string][] = [
  ['problem', deskTerm('deckPitchStoryProblemTitle')],
  ['why-now', deskTerm('deckPitchStoryWhyNowTitle')],
  ['solution', deskTerm('deckPitchStorySolutionTitle')],
  ['proof', deskTerm('deckPitchStoryProofTitle')],
  ['ask', deskTerm('deckPitchStoryAskTitle')],
];

function layout(): DealtCardSpec[] {
  return STEPS.map(([step, title], i) => ({
    key: step,
    ...guidedStep('pitch-story', step, title),
    x: colX(i % 2, COLS), y: rowY(Math.floor(i / 2)), w: W, h: CARD_H,
  }));
}

export const pitchStoryDeck: DeckDefinition = {
  id: 'pitch-story',
  room: 'business',
  nameTerm: 'deckNamePitchStory',
  questions: [],
  deal: () => layout(),
};
