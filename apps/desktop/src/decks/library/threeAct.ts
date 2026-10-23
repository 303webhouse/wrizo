import { deskTerm } from '../../store/deskLexicon';
import { colX, colWidth, rowY, CARD_H } from '../layout';
import { guidedStep } from '../guided';
import type { DeckDefinition, DealtCardSpec } from '../types';

// B3 S2 — Three-Act Structure, the fiction room's workhorse (catalog #1).
// Wizard: novel / novella / short story, "dealing proportionately" (the
// catalog's own words, no exact per-format count given — the judgment call
// this file resolves, recorded in the build report): Act III (climax,
// resolution, final image — every story needs an ending) always deals
// whole; Act II (the rising action) is the first to compress for a shorter
// form, then Act I. Novel = all nine catalog beats; novella drops the
// Midpoint Reversal (8); short story further drops First Threshold and
// Darkest Point, keeping only Rising Complications for Act II (6).

const COLS = 3;
const W = colWidth(COLS);

type BeatKey = 'hook' | 'inciting' | 'threshold' | 'complications' | 'midpoint' | 'darkest' | 'climax' | 'resolution' | 'finalImage';

// W3: a step is dealt as a QUESTION (decks/guided.ts) - the card's body is empty and decks/content.ts holds the question, the "?" sentence and the example under `step`.
// The old one-line bodies (deckThreeAct*Body) are no longer dealt; they stay in the lexicon, unused, for cards already on boards.
const BEAT: Record<BeatKey, { title: string; step: string; col: 0 | 1 | 2 }> = {
  hook: { title: deskTerm('deckThreeActHookTitle'), step: 'hook', col: 0 },
  inciting: { title: deskTerm('deckThreeActIncitingTitle'), step: 'inciting', col: 0 },
  threshold: { title: deskTerm('deckThreeActThresholdTitle'), step: 'threshold', col: 0 },
  complications: { title: deskTerm('deckThreeActComplicationsTitle'), step: 'complications', col: 1 },
  midpoint: { title: deskTerm('deckThreeActMidpointTitle'), step: 'midpoint', col: 1 },
  darkest: { title: deskTerm('deckThreeActDarkestTitle'), step: 'darkest', col: 1 },
  climax: { title: deskTerm('deckThreeActClimaxTitle'), step: 'climax', col: 2 },
  resolution: { title: deskTerm('deckThreeActResolutionTitle'), step: 'resolution', col: 2 },
  finalImage: { title: deskTerm('deckThreeActFinalImageTitle'), step: 'final-image', col: 2 },
};

const NOVEL: BeatKey[] = ['hook', 'inciting', 'threshold', 'complications', 'midpoint', 'darkest', 'climax', 'resolution', 'finalImage'];
const NOVELLA: BeatKey[] = ['hook', 'inciting', 'threshold', 'complications', 'darkest', 'climax', 'resolution', 'finalImage'];
const SHORT_STORY: BeatKey[] = ['hook', 'inciting', 'complications', 'climax', 'resolution', 'finalImage'];

function layout(keys: BeatKey[]): DealtCardSpec[] {
  const colCounts = [0, 0, 0];
  return keys.map(key => {
    const beat = BEAT[key];
    const row = colCounts[beat.col]++;
    return {
      key,
      ...guidedStep('three-act', beat.step, beat.title),
      x: colX(beat.col, COLS),
      y: rowY(row),
      w: W,
      h: CARD_H,
    };
  });
}

export const threeActDeck: DeckDefinition = {
  id: 'three-act',
  room: 'fiction',
  nameTerm: 'deckNameThreeAct',
  questions: [
    {
      id: 'format',
      promptTerm: 'deckThreeActQPrompt',
      options: [
        { id: 'novel', labelTerm: 'deckThreeActOptNovel' },
        { id: 'novella', labelTerm: 'deckThreeActOptNovella' },
        { id: 'short-story', labelTerm: 'deckThreeActOptShortStory' },
      ],
    },
  ],
  deal: (answers) => {
    const format = answers.format;
    const keys = format === 'novella' ? NOVELLA : format === 'short-story' ? SHORT_STORY : NOVEL;
    return layout(keys);
  },
};
