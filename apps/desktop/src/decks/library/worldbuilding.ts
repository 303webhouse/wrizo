import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Worldbuilding, the Speculative Annex's crown (catalog #7). Wizard:
// fantasy / SF / other — tunes card PROMPTS only (catalog's own wording),
// never the card set or count: all seven cards deal every time; only the
// Rules of the World card's own body varies with the answer. Includes the
// Iceberg card (catalog's own naming).

const COLS = 2;
const W = colWidth(COLS);

const COL_A: { title: string; body: string }[] = [
  { title: deskTerm('deckWorldbuildingHistoryTitle'), body: deskTerm('deckWorldbuildingHistoryBody') },
  { title: deskTerm('deckWorldbuildingPlacesTitle'), body: deskTerm('deckWorldbuildingPlacesBody') },
  { title: deskTerm('deckWorldbuildingCulturesTitle'), body: deskTerm('deckWorldbuildingCulturesBody') },
];
const COL_B: { title: string; body: string }[] = [
  { title: deskTerm('deckWorldbuildingPowerTitle'), body: deskTerm('deckWorldbuildingPowerBody') },
  { title: deskTerm('deckWorldbuildingLanguageTitle'), body: deskTerm('deckWorldbuildingLanguageBody') },
  { title: deskTerm('deckWorldbuildingIcebergTitle'), body: deskTerm('deckWorldbuildingIcebergBody') },
];

const RULES_BODY: Record<string, string> = {
  fantasy: deskTerm('deckWorldbuildingRulesBodyFantasy'),
  sf: deskTerm('deckWorldbuildingRulesBodySF'),
  other: deskTerm('deckWorldbuildingRulesBodyOther'),
};

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
      title: deskTerm('deckWorldbuildingRulesTitle'),
      body: RULES_BODY[genre],
      x: colX(0, COLS), y: rowY(0), w: W, h: CARD_H,
    });
    COL_A.forEach((card, i) => specs.push({
      key: `a-${i}`, title: card.title, body: card.body,
      x: colX(0, COLS), y: rowY(i + 1), w: W, h: CARD_H,
    }));
    COL_B.forEach((card, i) => specs.push({
      key: `b-${i}`, title: card.title, body: card.body,
      x: colX(1, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    return specs;
  },
};
