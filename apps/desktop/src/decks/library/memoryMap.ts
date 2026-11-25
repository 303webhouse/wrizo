import { deskTerm } from '../../store/deskLexicon';
import { rowY } from '../layout';
import { guidedStep } from '../guided';
import { rowSlots, rowH } from './rowSlots';
import type { DeckDefinition, DealtCardSpec } from '../types';

// PRESETS-B item 4 (load sheet v2, section 4; content decks/content.ts): Memory Map (The Fiction Room): one Memory card for each the writer says (Three / Five / Seven), in one row. A dealt card is named "Memory (1)", "Memory (2)" (Feature Story's own numbering); she renames it.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts).
const TITLE = deskTerm('deckMemoryMapMemoryTitle');

function count(answers: Record<string, string>): number {
  if (answers.count === 'five') return 5;
  if (answers.count === 'seven') return 7;
  return 3; // default AND the explicit 'three' answer
}

function layout(n: number): DealtCardSpec[] {
  return rowSlots(n).map((s, i) => ({
    key: `memory-${i}`,
    ...guidedStep('memory-map', 'memory', `${TITLE} (${i + 1})`),
    x: s.x, y: rowY(0), w: s.w, h: rowH(n),
  }));
}

export const memoryMapDeck: DeckDefinition = {
  id: 'memory-map',
  room: 'fiction',
  nameTerm: 'deckNameMemoryMap',
  questions: [
    {
      id: 'count',
      promptTerm: 'deckMemoryMapQPrompt',
      options: [
        { id: 'three', labelTerm: 'deckMemoryMapOptThree' },
        { id: 'five', labelTerm: 'deckMemoryMapOptFive' },
        { id: 'seven', labelTerm: 'deckMemoryMapOptSeven' },
      ],
    },
  ],
  deal: (answers) => layout(count(answers)),
};
