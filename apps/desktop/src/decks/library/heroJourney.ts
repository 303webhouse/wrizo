import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// W3 (Wrizors' game plan, wave 1; content decks/content.ts, from w3-deck-content.md) - Hero's Journey (The Fiction Room): twelve steps in one sequence. Wizard: Novel (12) / Short story (8 - drops Refusal of the Call, Approach to the Inmost Cave, Reward, The Road Back).
// Dealt in three columns, reading down: the departure, the initiation, the return.
// Every card is a QUESTION: its body is empty, the question rides as `prompt` and `deckStep` names the step (decks/guided.ts). [step id, title]

const COLS = 3;
const W = colWidth(COLS);

const STEPS: [string, string][] = [
  ['ordinary-world', deskTerm('deckHeroOrdinaryWorldTitle')],
  ['call', deskTerm('deckHeroCallTitle')],
  ['refusal', deskTerm('deckHeroRefusalTitle')],
  ['mentor', deskTerm('deckHeroMentorTitle')],
  ['threshold', deskTerm('deckHeroThresholdTitle')],
  ['tests', deskTerm('deckHeroTestsTitle')],
  ['approach', deskTerm('deckHeroApproachTitle')],
  ['ordeal', deskTerm('deckHeroOrdealTitle')],
  ['reward', deskTerm('deckHeroRewardTitle')],
  ['road-back', deskTerm('deckHeroRoadBackTitle')],
  ['resurrection', deskTerm('deckHeroResurrectionTitle')],
  ['return', deskTerm('deckHeroReturnTitle')],
];
const SHORT = ['ordinary-world', 'call', 'mentor', 'threshold', 'tests', 'ordeal', 'resurrection', 'return'];

function layout(keep: string[]): DealtCardSpec[] {
  const cards = STEPS.filter(([step]) => keep.includes(step));
  const perCol = Math.ceil(cards.length / COLS);
  return cards.map(([step, title], i) => ({
    key: step,
    ...guidedStep('hero-journey', step, title),
    x: colX(Math.floor(i / perCol), COLS), y: rowY(i % perCol), w: W, h: CARD_H,
  }));
}

export const heroJourneyDeck: DeckDefinition = {
  id: 'hero-journey',
  room: 'fiction',
  nameTerm: 'deckNameHeroJourney',
  questions: [
    {
      id: 'format',
      promptTerm: 'deckHeroQPrompt',
      options: [
        { id: 'novel', labelTerm: 'deckHeroOptNovel' },
        { id: 'short-story', labelTerm: 'deckHeroOptShortStory' },
      ],
    },
  ],
  deal: (answers) => layout(answers.format === 'short-story' ? SHORT : STEPS.map(([step]) => step)),
};
