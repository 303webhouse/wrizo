import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Feature Story, the Newsroom's flagship (catalog #20): nut graf,
// three lede candidates, source & quote cards, scene cards, kicker
// candidates. Ten cards, catalog-counted concretely: 1 nut graf + 3 ledes +
// 2 source/quote + 2 scene + 2 kicker. Same judgment-call pattern as Grant
// (catalog names no wizard here either) — a light feature-type question
// tunes only the Nut Graf card's own prompt.

const COLS = 2;
const W = colWidth(COLS);

const NUT_GRAF_BODY: Record<string, string> = {
  profile: deskTerm('deckFeatureStoryNutGrafBodyProfile'),
  trend: deskTerm('deckFeatureStoryNutGrafBodyTrend'),
  investigative: deskTerm('deckFeatureStoryNutGrafBodyInvestigative'),
};

const COL_A: [string, string][] = [
  [deskTerm('deckFeatureStoryLedeATitle'), deskTerm('deckFeatureStoryLedeABody')],
  [deskTerm('deckFeatureStoryLedeBTitle'), deskTerm('deckFeatureStoryLedeBBody')],
  [deskTerm('deckFeatureStoryLedeCTitle'), deskTerm('deckFeatureStoryLedeCBody')],
  [deskTerm('deckFeatureStorySourceOneTitle'), deskTerm('deckFeatureStorySourceOneBody')],
];
const COL_B: [string, string][] = [
  [deskTerm('deckFeatureStorySourceTwoTitle'), deskTerm('deckFeatureStorySourceTwoBody')],
  [deskTerm('deckFeatureStorySceneOneTitle'), deskTerm('deckFeatureStorySceneOneBody')],
  [deskTerm('deckFeatureStorySceneTwoTitle'), deskTerm('deckFeatureStorySceneTwoBody')],
  [deskTerm('deckFeatureStoryKickerATitle'), deskTerm('deckFeatureStoryKickerABody')],
  [deskTerm('deckFeatureStoryKickerBTitle'), deskTerm('deckFeatureStoryKickerBBody')],
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
      title: deskTerm('deckFeatureStoryNutGrafTitle'),
      body: NUT_GRAF_BODY[kind],
      x: colX(0, COLS), y: rowY(0), w: W, h: CARD_H,
    }];
    COL_A.forEach(([title, body], i) => specs.push({
      key: `a-${i}`, title, body, x: colX(0, COLS), y: rowY(i + 1), w: W, h: CARD_H,
    }));
    COL_B.forEach(([title, body], i) => specs.push({
      key: `b-${i}`, title, body, x: colX(1, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    return specs;
  },
};
