import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// W3 (Wrizors' game plan, wave 1; content decks/content.ts, from w3-deck-content.md) - Business Proposal (The Business Desk): seven steps, no deal question. Two columns, reading across.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts). [step id, title]

const COLS = 2;
const W = colWidth(COLS);

const STEPS: [string, string][] = [
  ['problem', deskTerm('deckProposalProblemTitle')],
  ['solution', deskTerm('deckProposalSolutionTitle')],
  ['market', deskTerm('deckProposalMarketTitle')],
  ['ask', deskTerm('deckProposalAskTitle')],
  ['timeline', deskTerm('deckProposalTimelineTitle')],
  ['budget', deskTerm('deckProposalBudgetTitle')],
  ['objections', deskTerm('deckProposalObjectionsTitle')],
];

function layout(keep: string[]): DealtCardSpec[] {
  return STEPS.filter(([step]) => keep.includes(step)).map(([step, title], i) => ({
    key: step,
    ...guidedStep('business-proposal', step, title),
    x: colX(i % 2, COLS), y: rowY(Math.floor(i / 2)), w: W, h: CARD_H,
  }));
}

export const businessProposalDeck: DeckDefinition = {
  id: 'business-proposal',
  room: 'business',
  childWord: 'part',   // W-scenes: the word its "Add ...…" door and its child cards use (store/childSteps.ts)
  nameTerm: 'deckNameBusinessProposal',
  questions: [],
  deal: () => layout(STEPS.map(([step]) => step)),
};
