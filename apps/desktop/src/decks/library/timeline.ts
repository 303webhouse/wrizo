import { deskTerm } from '../../store/deskLexicon';
import { rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import { rowSlots } from './rowSlots';
import type { DeckDefinition, DealtCardSpec } from '../types';

// PRESETS-B item 4 (load sheet v2, section 4; content decks/content.ts): Timeline (The Fiction Room): one Event card for each the writer says (Three / Five / Seven), in one row. A dealt card is named "Event (1)", "Event (2)" (Feature Story's own numbering); she renames it.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts).
const TITLE = deskTerm('deckTimelineEventTitle');

function count(answers: Record<string, string>): number {
  if (answers.count === 'five') return 5;
  if (answers.count === 'seven') return 7;
  return 3; // default AND the explicit 'three' answer
}

function layout(n: number): DealtCardSpec[] {
  return rowSlots(n).map((s, i) => ({
    key: `event-${i}`,
    ...guidedStep('timeline', 'event', `${TITLE} (${i + 1})`),
    x: s.x, y: rowY(0), w: s.w, h: CARD_H,
  }));
}

export const timelineDeck: DeckDefinition = {
  id: 'timeline',
  room: 'fiction',
  nameTerm: 'deckNameTimeline',
  questions: [
    {
      id: 'count',
      promptTerm: 'deckTimelineQPrompt',
      options: [
        { id: 'three', labelTerm: 'deckTimelineOptThree' },
        { id: 'five', labelTerm: 'deckTimelineOptFive' },
        { id: 'seven', labelTerm: 'deckTimelineOptSeven' },
      ],
    },
  ],
  deal: (answers) => layout(count(answers)),
};
