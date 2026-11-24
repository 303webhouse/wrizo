import { deskTerm } from '../../store/deskLexicon';
import { rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import { rowSlots } from './rowSlots';
import type { DeckDefinition, DealtCardSpec } from '../types';

// PRESETS-B item 4 (load sheet v2, section 4.1; content decks/content.ts): Relationship Map (The Fiction Room), dealt PRE-THREADED the way Character Study is: one Person card for each person on the map, in a row, and one Tie card between each neighbouring pair, threaded to both Person cards (D3).
// A dealt card is named "Person (1)", "Person (2)" (Feature Story's own numbering) so each can be named in the rail; she renames it. Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts).
const PERSON = deskTerm('deckRelationshipMapPersonTitle');
const TIE = deskTerm('deckRelationshipMapTieTitle');

function count(answers: Record<string, string>): number {
  if (answers.count === 'four') return 4;
  if (answers.count === 'five') return 5;
  return 3; // default AND the explicit 'three' answer
}

function layout(n: number): DealtCardSpec[] {
  const slots = rowSlots(n);
  const specs: DealtCardSpec[] = slots.map((s, i) => ({
    key: `person-${i}`,
    ...guidedStep('relationship-map', 'person', `${PERSON} (${i + 1})`),
    x: s.x, y: rowY(0), w: s.w, h: CARD_H,
  }));
  for (let i = 0; i < n - 1; i++) {
    specs.push({
      key: `tie-${i}`,
      ...guidedStep('relationship-map', 'tie', `${TIE} (${i + 1})`),
      x: (slots[i].x + slots[i + 1].x) / 2, y: rowY(1), w: slots[i].w, h: CARD_H,
      threadTo: [`person-${i}`, `person-${i + 1}`],
    });
  }
  return specs;
}

export const relationshipMapDeck: DeckDefinition = {
  id: 'relationship-map',
  room: 'fiction',
  nameTerm: 'deckNameRelationshipMap',
  questions: [
    {
      id: 'count',
      promptTerm: 'deckRelationshipMapQPrompt',
      options: [
        { id: 'three', labelTerm: 'deckRelationshipMapOptThree' },
        { id: 'four', labelTerm: 'deckRelationshipMapOptFour' },
        { id: 'five', labelTerm: 'deckRelationshipMapOptFive' },
      ],
    },
  ],
  deal: (answers) => layout(count(answers)),
};
