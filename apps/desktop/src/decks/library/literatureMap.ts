import { deskTerm } from '../../store/deskLexicon';
import { rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import { rowSlots } from './rowSlots';
import type { DeckDefinition, DealtCardSpec } from '../types';

// PRESETS-B item 4 (load sheet v2, section 4; content decks/content.ts): Literature Map (The Academy): one Theme card for each the writer says (Three / Four / Five), in one row. A dealt card is named "Theme (1)", "Theme (2)" (Feature Story's own numbering); she renames it.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts).
const TITLE = deskTerm('deckLiteratureMapThemeTitle');

function count(answers: Record<string, string>): number {
  if (answers.count === 'four') return 4;
  if (answers.count === 'five') return 5;
  return 3; // default AND the explicit 'three' answer
}

function layout(n: number): DealtCardSpec[] {
  return rowSlots(n).map((s, i) => ({
    key: `theme-${i}`,
    ...guidedStep('literature-map', 'theme', `${TITLE} (${i + 1})`),
    x: s.x, y: rowY(0), w: s.w, h: CARD_H,
  }));
}

export const literatureMapDeck: DeckDefinition = {
  id: 'literature-map',
  room: 'academy',
  nameTerm: 'deckNameLiteratureMap',
  questions: [
    {
      id: 'count',
      promptTerm: 'deckLiteratureMapQPrompt',
      options: [
        { id: 'three', labelTerm: 'deckLiteratureMapOptThree' },
        { id: 'four', labelTerm: 'deckLiteratureMapOptFour' },
        { id: 'five', labelTerm: 'deckLiteratureMapOptFive' },
      ],
    },
  ],
  deal: (answers) => layout(count(answers)),
};
