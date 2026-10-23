import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Feature Screenplay, the Screen Room's flagship (catalog #10):
// Save the Cat's 15 beats on the board, laid out across the method's own
// four-column act shape (5 / 4 / 3 / 3 = 15). Wizard: feature / pilot —
// per this ticket's own S2, picking Pilot "routes pilot-seekers onward in
// COPY ONLY" (the TV Pilot deck itself, catalog #11, is a second-wave
// non-goal): the SAME 15 cards deal regardless of the answer; Pilot's own
// option carries an inline `noteTerm` the engine surfaces before advancing,
// nothing more — the deal function below never even reads the answer. (W3: it now reads it for ONE thing - a "Novel" answer softens step 8's question;
// the fifteen cards, their order and their places are identical for all three answers.)

const COLS = 4;
const W = colWidth(COLS, 0.02, 0.015);

// W3: each beat is a question (decks/guided.ts, decks/content.ts). [title, step id]. The deal question is now "What is this for?" - Feature / Pilot / Novel: the SAME fifteen cards
// deal for all three; a "Novel" answer only softens step 8's question (the bracketed screen phrase "the trailer moments" drops - `form` is the content variant: novel, else screen).
const ACT1: [string, string][] = [
  [deskTerm('deckScreenplayOpeningImageTitle'), 'opening-image'],
  [deskTerm('deckScreenplayThemeStatedTitle'), 'theme-stated'],
  [deskTerm('deckScreenplaySetupTitle'), 'set-up'],
  [deskTerm('deckScreenplayCatalystTitle'), 'catalyst'],
  [deskTerm('deckScreenplayDebateTitle'), 'debate'],
];
const ACT2A: [string, string][] = [
  [deskTerm('deckScreenplayBreakTwoTitle'), 'break-into-two'],
  [deskTerm('deckScreenplayBStoryTitle'), 'b-story'],
  [deskTerm('deckScreenplayFunGamesTitle'), 'fun-and-games'],
  [deskTerm('deckScreenplayMidpointTitle'), 'midpoint'],
];
const ACT2B: [string, string][] = [
  [deskTerm('deckScreenplayBadGuysTitle'), 'bad-guys'],
  [deskTerm('deckScreenplayAllIsLostTitle'), 'all-is-lost'],
  [deskTerm('deckScreenplayDarkNightTitle'), 'dark-night'],
];
const ACT3: [string, string][] = [
  [deskTerm('deckScreenplayBreakThreeTitle'), 'break-into-three'],
  [deskTerm('deckScreenplayFinaleTitle'), 'finale'],
  [deskTerm('deckScreenplayFinalImageTitle'), 'final-image'],
];

const COLUMNS: [string, string][][] = [ACT1, ACT2A, ACT2B, ACT3];

function layout(form: string): DealtCardSpec[] {
  const variant = form === 'novel' ? 'novel' : 'screen';
  const specs: DealtCardSpec[] = [];
  COLUMNS.forEach((col, colIndex) => {
    col.forEach(([title, step], row) => {
      specs.push({
        key: `${colIndex}-${row}`,
        ...guidedStep('feature-screenplay', step, title, variant),
        x: colX(colIndex, COLS, 0.02, 0.015),
        y: rowY(row),
        w: W,
        h: CARD_H,
      });
    });
  });
  return specs;
}

export const featureScreenplayDeck: DeckDefinition = {
  id: 'feature-screenplay',
  room: 'screen',
  nameTerm: 'deckNameFeatureScreenplay',
  questions: [
    {
      id: 'form',
      promptTerm: 'deckScreenplayQPrompt',
      options: [
        { id: 'feature', labelTerm: 'deckScreenplayOptFeature' },
        { id: 'pilot', labelTerm: 'deckScreenplayOptPilot', noteTerm: 'deckScreenplayPilotNote' },
        { id: 'novel', labelTerm: 'deckScreenplayOptNovel' },
      ],
    },
  ],
  deal: (answers) => layout(answers.form ?? 'feature'),
};
