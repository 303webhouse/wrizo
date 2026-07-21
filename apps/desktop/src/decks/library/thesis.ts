import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Thesis / Dissertation, the Academy's flagship (catalog #13).
// Wizard: humanities / sciences — five foundation cards deal always
// (research question, lit-review clusters, methodology, evidence parking
// lot, citation ledger); the sciences branch swaps the four generic
// chapter cards for IMRaD chapter shapes (catalog's own wording) — same
// total card count (9) either way, a genuinely different chapter SET, not
// just different prompts.

const COLS = 3;
const W = colWidth(COLS);

const FOUNDATIONS: [string, string][] = [
  [deskTerm('deckThesisQuestionTitle'), deskTerm('deckThesisQuestionBody')],
  [deskTerm('deckThesisMethodologyTitle'), deskTerm('deckThesisMethodologyBody')],
  [deskTerm('deckThesisLitReviewTitle'), deskTerm('deckThesisLitReviewBody')],
];
const LEDGER: [string, string][] = [
  [deskTerm('deckThesisEvidenceTitle'), deskTerm('deckThesisEvidenceBody')],
  [deskTerm('deckThesisCitationTitle'), deskTerm('deckThesisCitationBody')],
];
const CHAPTERS_HUMANITIES: [string, string][] = [
  [deskTerm('deckThesisChapterOneTitle'), deskTerm('deckThesisChapterOneBody')],
  [deskTerm('deckThesisChapterTwoTitle'), deskTerm('deckThesisChapterTwoBody')],
  [deskTerm('deckThesisChapterThreeTitle'), deskTerm('deckThesisChapterThreeBody')],
  [deskTerm('deckThesisConclusionTitle'), deskTerm('deckThesisConclusionBody')],
];
const CHAPTERS_SCIENCES: [string, string][] = [
  [deskTerm('deckThesisIntroTitle'), deskTerm('deckThesisIntroBody')],
  [deskTerm('deckThesisMethodsTitle'), deskTerm('deckThesisMethodsBody')],
  [deskTerm('deckThesisResultsTitle'), deskTerm('deckThesisResultsBody')],
  [deskTerm('deckThesisDiscussionTitle'), deskTerm('deckThesisDiscussionBody')],
];

export const thesisDeck: DeckDefinition = {
  id: 'thesis',
  room: 'academy',
  nameTerm: 'deckNameThesis',
  questions: [
    {
      id: 'field',
      promptTerm: 'deckThesisQPrompt',
      options: [
        { id: 'humanities', labelTerm: 'deckThesisOptHumanities' },
        { id: 'sciences', labelTerm: 'deckThesisOptSciences' },
      ],
    },
  ],
  deal: (answers) => {
    const chapters = answers.field === 'sciences' ? CHAPTERS_SCIENCES : CHAPTERS_HUMANITIES;
    const specs: DealtCardSpec[] = [];
    FOUNDATIONS.forEach(([title, body], i) => specs.push({
      key: `foundation-${i}`, title, body, x: colX(0, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    chapters.forEach(([title, body], i) => specs.push({
      key: `chapter-${i}`, title, body, x: colX(1, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    LEDGER.forEach(([title, body], i) => specs.push({
      key: `ledger-${i}`, title, body, x: colX(2, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    return specs;
  },
};
