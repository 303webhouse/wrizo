import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// W3 (Wrizors' game plan, wave 1; content decks/content.ts, from w3-deck-content.md) - Argumentative Essay (The Academy): seven steps. Wizard: Short (five - drops Counterclaim and Evidence (3)) / Full (seven). Two columns, reading across.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts). [step id, title]

const COLS = 2;
const W = colWidth(COLS);

const STEPS: [string, string][] = [
  ['claim', deskTerm('deckArgumentClaimTitle')],
  ['counterclaim', deskTerm('deckArgumentCounterclaimTitle')],
  ['evidence-1', deskTerm('deckArgumentEvidence1Title')],
  ['evidence-2', deskTerm('deckArgumentEvidence2Title')],
  ['evidence-3', deskTerm('deckArgumentEvidence3Title')],
  ['synthesis', deskTerm('deckArgumentSynthesisTitle')],
  ['so-what', deskTerm('deckArgumentSoWhatTitle')],
];
const SHORT = ['claim', 'evidence-1', 'evidence-2', 'synthesis', 'so-what'];

function layout(keep: string[]): DealtCardSpec[] {
  return STEPS.filter(([step]) => keep.includes(step)).map(([step, title], i) => ({
    key: step,
    ...guidedStep('argument-essay', step, title),
    x: colX(i % 2, COLS), y: rowY(Math.floor(i / 2)), w: W, h: CARD_H,
  }));
}

export const argumentEssayDeck: DeckDefinition = {
  id: 'argument-essay',
  room: 'academy',
  childWord: 'point',   // W-scenes: the word its "Add ...…" door and its child cards use (store/childSteps.ts)
  nameTerm: 'deckNameArgumentEssay',
  questions: [
    {
      id: 'length',
      promptTerm: 'deckArgumentQPrompt',
      options: [
        { id: 'short', labelTerm: 'deckArgumentOptShort' },
        { id: 'full', labelTerm: 'deckArgumentOptFull' },
      ],
    },
  ],
  deal: (answers) => layout(answers.length === 'short' ? SHORT : STEPS.map(([step]) => step)),
};
