import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Character Study, promoted onto B3's ship set on Fable's own call
// (item 36): "once the engine exists a deck's marginal cost is a
// definition file, and Character Study is the threads demonstration the
// whole system deserves." Dealt PRE-THREADED (catalog #6's own wording):
// each character gets the same four self cards (want vs. need, the wound,
// the contradiction, voice notes — catalog verbatim), composed titles
// ("<Label> <letter>: <type title>", both halves resolved via deskTerm(),
// the letter alone is generated, non-lexicon data); each ADJACENT pair of
// characters gets one Relationship card, threaded (the engine's own
// 'connection' Box kind, materialized by decks/engine.ts) to both sides'
// own Want vs. Need card — "wire the cast together on the board," the
// catalog's own words.
//
// Wizard: how many characters (two / three / four) — "One" is deliberately
// NOT offered: a study with a single character can carry no relationship
// card at all, which would make "dealt pre-threaded" false for that
// answer, contradicting the very reason this deck was promoted. A judgment
// call, recorded in the build report.

const SELF_TYPES: { key: string; title: string; body: string }[] = [
  { key: 'wantneed', title: deskTerm('deckCharacterStudyWantNeedTitle'), body: deskTerm('deckCharacterStudyWantNeedBody') },
  { key: 'wound', title: deskTerm('deckCharacterStudyWoundTitle'), body: deskTerm('deckCharacterStudyWoundBody') },
  { key: 'contradiction', title: deskTerm('deckCharacterStudyContradictionTitle'), body: deskTerm('deckCharacterStudyContradictionBody') },
  { key: 'voice', title: deskTerm('deckCharacterStudyVoiceTitle'), body: deskTerm('deckCharacterStudyVoiceBody') },
];

const LABEL = deskTerm('deckCharacterStudyLabel');
const REL_TITLE = deskTerm('deckCharacterStudyRelationshipTitle');
const REL_BODY = deskTerm('deckCharacterStudyRelationshipBody');
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
        title: `${LABEL} ${letter}: ${type.title}`,
        body: type.body,
        x, y: rowY(row), w, h: CARD_H,
      });
    });
  }

  for (let i = 0; i < n - 1; i++) {
    const xa = colX(i, n, marginX, gap);
    const xb = colX(i + 1, n, marginX, gap);
    specs.push({
      key: `rel-${i}-${i + 1}`,
      title: `${REL_TITLE}: ${LETTERS[i]} ↔ ${LETTERS[i + 1]}`,
      body: REL_BODY,
      x: (xa + xb) / 2, y: rowY(SELF_TYPES.length), w, h: CARD_H,
      threadTo: [`char-${i}-wantneed`, `char-${i + 1}-wantneed`],
    });
  }

  return specs;
}

export const characterStudyDeck: DeckDefinition = {
  id: 'character-study',
  room: 'fiction',
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
