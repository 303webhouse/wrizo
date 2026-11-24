import { deskTerm } from '../../store/deskLexicon';
import { rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import { rowSlots } from './rowSlots';
import type { DeckDefinition, DealtCardSpec } from '../types';

// PRESETS-B item 4 (load sheet v2, section 4; content decks/content.ts): Interview Notes (The Newsroom): one Interview card for each the writer says (Two / Three / Four), in one row. A dealt card is named "Interview (1)", "Interview (2)" (Feature Story's own numbering); she renames it.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts).
const TITLE = deskTerm('deckInterviewNotesInterviewTitle');

function count(answers: Record<string, string>): number {
  if (answers.count === 'three') return 3;
  if (answers.count === 'four') return 4;
  return 2; // default AND the explicit 'two' answer
}

function layout(n: number): DealtCardSpec[] {
  return rowSlots(n).map((s, i) => ({
    key: `interview-${i}`,
    ...guidedStep('interview-notes', 'interview', `${TITLE} (${i + 1})`),
    x: s.x, y: rowY(0), w: s.w, h: CARD_H,
  }));
}

export const interviewNotesDeck: DeckDefinition = {
  id: 'interview-notes',
  room: 'newsroom',
  nameTerm: 'deckNameInterviewNotes',
  questions: [
    {
      id: 'count',
      promptTerm: 'deckInterviewNotesQPrompt',
      options: [
        { id: 'two', labelTerm: 'deckInterviewNotesOptTwo' },
        { id: 'three', labelTerm: 'deckInterviewNotesOptThree' },
        { id: 'four', labelTerm: 'deckInterviewNotesOptFour' },
      ],
    },
  ],
  deal: (answers) => layout(count(answers)),
};
