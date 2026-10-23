import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// W3 (Wrizors' game plan, wave 1; content decks/content.ts, from w3-deck-content.md) - Story Circle (The Fiction Room; the hidden story_circle.json's eight steps): no deal question. The eight cards sit round a circle, You at the top, going clockwise, and
// each is threaded to the next (the last back to the first) so the circle reads as one.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts). [step id, title]

const CARD_W = 0.2;
const CX = 0.5;
const CY = 0.33;
const RX = 0.3;
const RY = 0.25;

const STEPS: [string, string][] = [
  ['you', deskTerm('deckCircleYouTitle')],
  ['need', deskTerm('deckCircleNeedTitle')],
  ['go', deskTerm('deckCircleGoTitle')],
  ['search', deskTerm('deckCircleSearchTitle')],
  ['find', deskTerm('deckCircleFindTitle')],
  ['take', deskTerm('deckCircleTakeTitle')],
  ['return', deskTerm('deckCircleReturnTitle')],
  ['change', deskTerm('deckCircleChangeTitle')],
];

const r4 = (n: number) => Math.round(n * 10000) / 10000;

function layout(): DealtCardSpec[] {
  return STEPS.map(([step, title], i) => {
    const a = (i / STEPS.length) * Math.PI * 2;
    return {
      key: step,
      ...guidedStep('story-circle', step, title),
      x: r4(CX + RX * Math.sin(a) - CARD_W / 2), y: r4(CY - RY * Math.cos(a) - CARD_H / 2), w: CARD_W, h: CARD_H,
      threadTo: [STEPS[(i + 1) % STEPS.length][0]],
    };
  });
}

export const storyCircleDeck: DeckDefinition = {
  id: 'story-circle',
  room: 'fiction',
  nameTerm: 'deckNameStoryCircle',
  questions: [],
  deal: () => layout(),
};
