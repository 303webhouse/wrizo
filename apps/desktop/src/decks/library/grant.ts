import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Grant Application, the Business Desk's flagship (catalog #18).
// The catalog names no wizard question for this deck specifically, but
// catalog Law 5 ("every deck names its narrowing choices") binds it same as
// every other deck — a judgment call, recorded in the build report: a
// light funder-type question, tuning only the Funder Alignment card's own
// prompt (the SAME "prompts only" shape Worldbuilding's own wizard already
// establishes), never the card set or count (six cards, always).

const COLS = 2;
const W = colWidth(COLS);

const BASE: [string, string][] = [
  [deskTerm('deckGrantNeedTitle'), deskTerm('deckGrantNeedBody')],
  [deskTerm('deckGrantObjectivesTitle'), deskTerm('deckGrantObjectivesBody')],
  [deskTerm('deckGrantMethodsTitle'), deskTerm('deckGrantMethodsBody')],
  [deskTerm('deckGrantEvaluationTitle'), deskTerm('deckGrantEvaluationBody')],
  [deskTerm('deckGrantBudgetTitle'), deskTerm('deckGrantBudgetBody')],
];

const ALIGNMENT_BODY: Record<string, string> = {
  foundation: deskTerm('deckGrantAlignmentBodyFoundation'),
  government: deskTerm('deckGrantAlignmentBodyGovernment'),
  corporate: deskTerm('deckGrantAlignmentBodyCorporate'),
};

export const grantDeck: DeckDefinition = {
  id: 'grant',
  room: 'business',
  nameTerm: 'deckNameGrant',
  questions: [
    {
      id: 'funder',
      promptTerm: 'deckGrantQPrompt',
      options: [
        { id: 'foundation', labelTerm: 'deckGrantOptFoundation' },
        { id: 'government', labelTerm: 'deckGrantOptGovernment' },
        { id: 'corporate', labelTerm: 'deckGrantOptCorporate' },
      ],
    },
  ],
  deal: (answers) => {
    const funder = answers.funder === 'government' || answers.funder === 'corporate' ? answers.funder : 'foundation';
    const specs: DealtCardSpec[] = BASE.map(([title, body], i) => ({
      key: `base-${i}`, title, body,
      x: colX(i % 2, COLS), y: rowY(Math.floor(i / 2)), w: W, h: CARD_H,
    }));
    specs.push({
      key: 'alignment',
      title: deskTerm('deckGrantAlignmentTitle'),
      body: ALIGNMENT_BODY[funder],
      x: colX(BASE.length % 2, COLS), y: rowY(Math.floor(BASE.length / 2)), w: W, h: CARD_H,
    });
    return specs;
  },
};
