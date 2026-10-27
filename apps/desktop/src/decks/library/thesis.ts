import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
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

// W3: each card is a question (decks/guided.ts, decks/content.ts). [title, step id]. The humanities chapter titles stay Chapter One / Two / Three (Fable's ruling 3).
const FOUNDATIONS: [string, string][] = [
  [deskTerm('deckThesisQuestionTitle'), 'question'],
  [deskTerm('deckThesisMethodologyTitle'), 'methodology'],
  [deskTerm('deckThesisLitReviewTitle'), 'lit-review'],
];
const LEDGER: [string, string][] = [
  [deskTerm('deckThesisEvidenceTitle'), 'evidence'],
  [deskTerm('deckThesisCitationTitle'), 'citation'],
];
const CHAPTERS_HUMANITIES: [string, string][] = [
  [deskTerm('deckThesisChapterOneTitle'), 'chapter-one'],
  [deskTerm('deckThesisChapterTwoTitle'), 'chapter-two'],
  [deskTerm('deckThesisChapterThreeTitle'), 'chapter-three'],
  [deskTerm('deckThesisConclusionTitle'), 'conclusion'],
];
const CHAPTERS_SCIENCES: [string, string][] = [
  [deskTerm('deckThesisIntroTitle'), 'introduction'],
  [deskTerm('deckThesisMethodsTitle'), 'methods'],
  [deskTerm('deckThesisResultsTitle'), 'results'],
  [deskTerm('deckThesisDiscussionTitle'), 'discussion'],
];

export const thesisDeck: DeckDefinition = {
  id: 'thesis',
  room: 'academy',
  childWord: 'section',   // W-scenes: the word its "Add ...…" door and its child cards use (store/childSteps.ts)
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
    FOUNDATIONS.forEach(([title, step], i) => specs.push({
      key: `foundation-${i}`, ...guidedStep('thesis', step, title), x: colX(0, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    chapters.forEach(([title, step], i) => specs.push({
      key: `chapter-${i}`, ...guidedStep('thesis', step, title), x: colX(1, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    LEDGER.forEach(([title, step], i) => specs.push({
      key: `ledger-${i}`, ...guidedStep('thesis', step, title), x: colX(2, COLS), y: rowY(i), w: W, h: CARD_H,
    }));
    return specs;
  },
};
