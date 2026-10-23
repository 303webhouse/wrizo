import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Worldbuilding, the Speculative Annex's crown (catalog #7). Wizard:
// fantasy / SF / other — tunes card PROMPTS only (catalog's own wording),
// never the card set or count: all seven cards deal every time; only the
// Rules of the World card's own body varies with the answer. Includes the
// Iceberg card (catalog's own naming).

const COLS = 2;
const W = colWidth(COLS);

// W3: each step is a question (decks/guided.ts, decks/content.ts); the Rules step's question varies with the genre answer (fantasy / sf / other).
const COL_A: { title: string; step: string }[] = [
  { title: deskTerm('deckWorldbuildingHistoryTitle'), step: 'history' },
  { title: deskTerm('deckWorldbuildingPlacesTitle'), step: 'places' },
  { title: deskTerm('deckWorldbuildingCulturesTitle'), step: 'cultures' },
];
const COL_B: { title: string; step: string }[] = [
  { title: deskTerm('deckWorldbuildingPowerTitle'), step: 'power' },
  { title: deskTerm('deckWorldbuildingLanguageTitle'), step: 'language' },
  { title: deskTerm('deckWorldbuildingIcebergTitle'), step: 'iceberg' },
];

export const worldbuildingDeck: DeckDefinition = {
  id: 'worldbuilding',
  room: 'speculative',
  nameTerm: 'deckNameWorldbuilding',
  questions: [
    {
      id: 'genre',
      promptTerm: 'deckWorldbuildingQPrompt',
      options: [
        { id: 'fantasy', labelTerm: 'deckWorldbuildingOptFantasy' },
        { id: 'sf', labelTerm: 'deckWorldbuildingOptSF' },
        { id: 'other', labelTerm: 'deckWorldbuildingOptOther' },
      ],
    },
  ],
  deal: (answers) => {
    const genre = answers.genre === 'sf' || answers.genre === 'other' ? answers.genre : 'fantasy';
    const specs: DealtCardSpec[] = [];
    specs.push({
      key: 'rules',
      ...guidedStep('worldbuilding', 'rules', deskTerm('deckWorldbuildingRulesTitle'), genre),
      x: colX(0, COLS), y: rowY(0), w: W, h: CARD_H,
    });
    COL_A.forEach((card, i) => specs.push({
      key: `a-${i}`, ...guidedStep('worldbuilding', card.step, card.title),
      x: colX(0, COLS), y: rowY(i + 1), w: W, h: CARD_H,
    }));
    COL_B.forEach((card, i) => specs.push({
      key: `b-${i}`, ...guidedStep('worldbuilding', card.step, card.title),
      x: colX(1, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    return specs;
  },
};
