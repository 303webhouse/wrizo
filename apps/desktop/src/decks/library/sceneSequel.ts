import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// W3 (Wrizors' game plan, wave 1; content decks/content.ts, from w3-deck-content.md) - Scene-Sequel (The Fiction Room): six steps per scene, one column per scene. Wizard: One / Three / Five scenes. A card's title names its scene ("Scene 2: Goal").
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts). [step id, title]

const STEPS: [string, string][] = [
  ['goal', deskTerm('deckSceneSequelGoalTitle')],
  ['conflict', deskTerm('deckSceneSequelConflictTitle')],
  ['disaster', deskTerm('deckSceneSequelDisasterTitle')],
  ['reaction', deskTerm('deckSceneSequelReactionTitle')],
  ['dilemma', deskTerm('deckSceneSequelDilemmaTitle')],
  ['decision', deskTerm('deckSceneSequelDecisionTitle')],
];
const LABEL = deskTerm('deckSceneSequelLabel');

function sceneCount(answers: Record<string, string>): number {
  if (answers.count === 'five') return 5;
  if (answers.count === 'three') return 3;
  return 1; // default AND the explicit 'one' answer
}

function layout(n: number): DealtCardSpec[] {
  // a single scene sits in the middle of a three-column grid (not one page-wide card); three and five scenes fill their own grid
  const cols = Math.max(n, 3);
  const marginX = cols >= 5 ? 0.02 : 0.03;
  const gap = cols >= 5 ? 0.015 : 0.02;
  const w = colWidth(cols, marginX, gap);
  const first = n === 1 ? 1 : 0;
  const specs: DealtCardSpec[] = [];
  for (let s = 0; s < n; s++) {
    STEPS.forEach(([step, title], row) => specs.push({
      key: `scene-${s}-${step}`,
      ...guidedStep('scene-sequel', step, `${LABEL} ${s + 1}: ${title}`),
      x: colX(first + s, cols, marginX, gap), y: rowY(row), w, h: CARD_H,
    }));
  }
  return specs;
}

export const sceneSequelDeck: DeckDefinition = {
  id: 'scene-sequel',
  room: 'fiction',
  nameTerm: 'deckNameSceneSequel',
  questions: [
    {
      id: 'count',
      promptTerm: 'deckSceneSequelQPrompt',
      options: [
        { id: 'one', labelTerm: 'deckSceneSequelOptOne' },
        { id: 'three', labelTerm: 'deckSceneSequelOptThree' },
        { id: 'five', labelTerm: 'deckSceneSequelOptFive' },
      ],
    },
  ],
  deal: (answers) => layout(sceneCount(answers)),
};
