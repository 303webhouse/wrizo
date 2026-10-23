import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Feature Story, the Newsroom's flagship (catalog #20): nut graf,
// three lede candidates, source & quote cards, scene cards, kicker
// candidates. Ten cards, catalog-counted concretely: 1 nut graf + 3 ledes +
// 2 source/quote + 2 scene + 2 kicker. Same judgment-call pattern as Grant
// (catalog names no wizard here either) — a light feature-type question
// tunes only the Nut Graf card's own prompt.

const COLS = 2;
const W = colWidth(COLS);

// W3: each step is a question (decks/guided.ts, decks/content.ts); the Nut Graf question varies with the kind answer. [title, step id]
const COL_A: [string, string][] = [
  [deskTerm('deckFeatureStoryLedeATitle'), 'lede-a'],
  [deskTerm('deckFeatureStoryLedeBTitle'), 'lede-b'],
  [deskTerm('deckFeatureStoryLedeCTitle'), 'lede-c'],
  [deskTerm('deckFeatureStorySourceOneTitle'), 'source-1'],
];
const COL_B: [string, string][] = [
  [deskTerm('deckFeatureStorySourceTwoTitle'), 'source-2'],
  [deskTerm('deckFeatureStorySceneOneTitle'), 'scene-1'],
  [deskTerm('deckFeatureStorySceneTwoTitle'), 'scene-2'],
  [deskTerm('deckFeatureStoryKickerATitle'), 'kicker-a'],
  [deskTerm('deckFeatureStoryKickerBTitle'), 'kicker-b'],
];

export const featureStoryDeck: DeckDefinition = {
  id: 'feature-story',
  room: 'newsroom',
  nameTerm: 'deckNameFeatureStory',
  questions: [
    {
      id: 'kind',
      promptTerm: 'deckFeatureStoryQPrompt',
      options: [
        { id: 'profile', labelTerm: 'deckFeatureStoryOptProfile' },
        { id: 'trend', labelTerm: 'deckFeatureStoryOptTrend' },
        { id: 'investigative', labelTerm: 'deckFeatureStoryOptInvestigative' },
      ],
    },
  ],
  deal: (answers) => {
    const kind = answers.kind === 'trend' || answers.kind === 'investigative' ? answers.kind : 'profile';
    const specs: DealtCardSpec[] = [{
      key: 'nut-graf',
      ...guidedStep('feature-story', 'nut-graf', deskTerm('deckFeatureStoryNutGrafTitle'), kind),
      x: colX(0, COLS), y: rowY(0), w: W, h: CARD_H,
    }];
    COL_A.forEach(([title, step], i) => specs.push({
      key: `a-${i}`, ...guidedStep('feature-story', step, title), x: colX(0, COLS), y: rowY(i + 1), w: W, h: CARD_H,
    }));
    COL_B.forEach(([title, step], i) => specs.push({
      key: `b-${i}`, ...guidedStep('feature-story', step, title), x: colX(1, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    return specs;
  },
};
