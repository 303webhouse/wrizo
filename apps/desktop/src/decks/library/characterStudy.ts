import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// Character Study, dealt PRE-THREADED: each character gets the same four self cards (want vs. need, the wound, the contradiction, voice notes), with composed titles ("<Label> <letter>: <type title>", both halves through deskTerm(), the letter generated); each ADJACENT pair of characters gets one Relationship card, threaded to both sides' Want vs. Need card. The wizard offers two, three or four characters: one would carry no relationship card, so the deal would not be pre-threaded. [characterStudy §1]

// W3: each card is a question (decks/guided.ts, decks/content.ts). `step` is the content key shared by every character's copy of that card; the card's own title still names its character.
const SELF_TYPES: { key: string; title: string; step: string }[] = [
  { key: 'wantneed', title: deskTerm('deckCharacterStudyWantNeedTitle'), step: 'want-need' },
  { key: 'wound', title: deskTerm('deckCharacterStudyWoundTitle'), step: 'wound' },
  { key: 'contradiction', title: deskTerm('deckCharacterStudyContradictionTitle'), step: 'contradiction' },
  { key: 'voice', title: deskTerm('deckCharacterStudyVoiceTitle'), step: 'voice' },
];

const LABEL = deskTerm('deckCharacterStudyLabel');
const REL_TITLE = deskTerm('deckCharacterStudyRelationshipTitle');
const LETTERS = ['A', 'B', 'C', 'D'];

function characterCount(answers: Record<string, string>): number {
  if (answers.count === 'three') return 3;
  if (answers.count === 'four') return 4;
  return 2; // default AND the explicit 'two' answer
}

function layout(n: number): DealtCardSpec[] {
  const marginX = n >= 4 ? 0.02 : 0.03;
  const gap = n >= 4 ? 0.015 : 0.02;
  const w = colWidth(n, marginX, gap);
  const specs: DealtCardSpec[] = [];

  for (let i = 0; i < n; i++) {
    const letter = LETTERS[i];
    const x = colX(i, n, marginX, gap);
    SELF_TYPES.forEach((type, row) => {
      specs.push({
        key: `char-${i}-${type.key}`,
        ...guidedStep('character-study', type.step, `${LABEL} ${letter}: ${type.title}`),
        x, y: rowY(row), w, h: CARD_H,
      });
    });
  }

  for (let i = 0; i < n - 1; i++) {
    const xa = colX(i, n, marginX, gap);
    const xb = colX(i + 1, n, marginX, gap);
    specs.push({
      key: `rel-${i}-${i + 1}`,
      ...guidedStep('character-study', 'relationship', `${REL_TITLE}: ${LETTERS[i]} ↔ ${LETTERS[i + 1]}`),
      x: (xa + xb) / 2, y: rowY(SELF_TYPES.length), w, h: CARD_H,
      threadTo: [`char-${i}-wantneed`, `char-${i + 1}-wantneed`],
    });
  }

  return specs;
}

export const characterStudyDeck: DeckDefinition = {
  id: 'character-study',
  room: 'fiction',
  childWord: 'moment',   // W-scenes: the word its "Add ...…" door and its child cards use (store/childSteps.ts)
  nameTerm: 'deckNameCharacterStudy',
  questions: [
    {
      id: 'count',
      promptTerm: 'deckCharacterStudyQPrompt',
      options: [
        { id: 'two', labelTerm: 'deckCharacterStudyOptTwo' },
        { id: 'three', labelTerm: 'deckCharacterStudyOptThree' },
        { id: 'four', labelTerm: 'deckCharacterStudyOptFour' },
      ],
    },
  ],
  deal: (answers) => layout(characterCount(answers)),
};
