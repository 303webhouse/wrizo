import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Feature Screenplay, the Screen Room's flagship (catalog #10):
// Save the Cat's 15 beats on the board, laid out across the method's own
// four-column act shape (5 / 4 / 3 / 3 = 15). Wizard: feature / pilot —
// per this ticket's own S2, picking Pilot "routes pilot-seekers onward in
// COPY ONLY" (the TV Pilot deck itself, catalog #11, is a second-wave
// non-goal): the SAME 15 cards deal regardless of the answer; Pilot's own
// option carries an inline `noteTerm` the engine surfaces before advancing,
// nothing more — the deal function below never even reads the answer.

const COLS = 4;
const W = colWidth(COLS, 0.02, 0.015);

const ACT1: [string, string][] = [
  [deskTerm('deckScreenplayOpeningImageTitle'), deskTerm('deckScreenplayOpeningImageBody')],
  [deskTerm('deckScreenplayThemeStatedTitle'), deskTerm('deckScreenplayThemeStatedBody')],
  [deskTerm('deckScreenplaySetupTitle'), deskTerm('deckScreenplaySetupBody')],
  [deskTerm('deckScreenplayCatalystTitle'), deskTerm('deckScreenplayCatalystBody')],
  [deskTerm('deckScreenplayDebateTitle'), deskTerm('deckScreenplayDebateBody')],
];
const ACT2A: [string, string][] = [
  [deskTerm('deckScreenplayBreakTwoTitle'), deskTerm('deckScreenplayBreakTwoBody')],
  [deskTerm('deckScreenplayBStoryTitle'), deskTerm('deckScreenplayBStoryBody')],
  [deskTerm('deckScreenplayFunGamesTitle'), deskTerm('deckScreenplayFunGamesBody')],
  [deskTerm('deckScreenplayMidpointTitle'), deskTerm('deckScreenplayMidpointBody')],
];
const ACT2B: [string, string][] = [
  [deskTerm('deckScreenplayBadGuysTitle'), deskTerm('deckScreenplayBadGuysBody')],
  [deskTerm('deckScreenplayAllIsLostTitle'), deskTerm('deckScreenplayAllIsLostBody')],
  [deskTerm('deckScreenplayDarkNightTitle'), deskTerm('deckScreenplayDarkNightBody')],
];
const ACT3: [string, string][] = [
  [deskTerm('deckScreenplayBreakThreeTitle'), deskTerm('deckScreenplayBreakThreeBody')],
  [deskTerm('deckScreenplayFinaleTitle'), deskTerm('deckScreenplayFinaleBody')],
  [deskTerm('deckScreenplayFinalImageTitle'), deskTerm('deckScreenplayFinalImageBody')],
];

const COLUMNS: [string, string][][] = [ACT1, ACT2A, ACT2B, ACT3];

function layout(): DealtCardSpec[] {
  const specs: DealtCardSpec[] = [];
  COLUMNS.forEach((col, colIndex) => {
    col.forEach(([title, body], row) => {
      specs.push({
        key: `${colIndex}-${row}`,
        title, body,
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
      ],
    },
  ],
  deal: () => layout(),
};
