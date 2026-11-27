// GLITCH v2 - THE IDLE RAMP (the flourish spec draft 2 §1.1-1.2; Nick ruled the ramp as drawn, Nov 26). What a still writer sees, by how long she has been still. Pure and with no imports: the
// browserless check (scripts/harness/glitch-ramp-unit.mjs) loads it as it is.
//   - Nothing for the first 30 s; then one BEAT at a time, closer together the longer she is still; the ceiling at 15 minutes holds until she moves.
//   - A beat is two changes: it comes on, then it goes. Stronger never means faster flashing: more words, a taller band, more slip, more split, a longer hold.
export type Reach = 'page' | 'chrome' | 'all';   // her words only; her words and the chrome; everywhere
export interface Stage {
  fromS: number;
  everyMs: number;                 // beat to beat
  words: [number, number];         // words in one beat
  reach: Reach;
  screenEvery: number;             // the screen glitches every n-th beat (0: never)
  bandPx: [number, number];        // the band's height; a share of the window where bandShare is set
  bandShare: number;
  slip: number;                    // px the chrome slips inside the band
  split: number;                   // px of colour split
  bandMs: number;                  // how long a screen beat holds
  menuDrop: number;                // px one open menu may drop (vertical hold)
}
export const WORD_HOLD_MS = 600;   // a beat with no band holds its words this long
export const STAGES: readonly Stage[] = [
  { fromS: 30, everyMs: 2600, words: [1, 1], reach: 'page', screenEvery: 0, bandPx: [0, 0], bandShare: 0, slip: 0, split: 0, bandMs: 0, menuDrop: 0 },
  { fromS: 120, everyMs: 2000, words: [1, 2], reach: 'chrome', screenEvery: 3, bandPx: [6, 12], bandShare: 0, slip: 2, split: 0, bandMs: 120, menuDrop: 0 },
  { fromS: 300, everyMs: 1600, words: [2, 3], reach: 'all', screenEvery: 2, bandPx: [16, 48], bandShare: 0, slip: 6, split: 1, bandMs: 200, menuDrop: 0 },
  { fromS: 900, everyMs: 1200, words: [3, 4], reach: 'all', screenEvery: 1, bandPx: [48, 48], bandShare: 0.25, slip: 16, split: 3, bandMs: 300, menuDrop: 4 },
];

/** The stage for this much stillness, or null (nothing yet). */
export function stageAt(idleS: number): Stage | null {
  let at: Stage | null = null;
  for (const s of STAGES) if (idleS >= s.fromS) at = s;
  return at;
}
/** The n-th beat of a stage (counted from 0): whether the screen glitches in it, and how long it holds. Its words and its band leave together. */
export function beatOf(stage: Stage, n: number): { screen: boolean; holdMs: number } {
  const screen = stage.screenEvery > 0 && n % stage.screenEvery === stage.screenEvery - 1;
  return { screen, holdMs: screen ? stage.bandMs : WORD_HOLD_MS };
}
/** The band's height in a window this tall; `pick` is 0..1 (a random number). */
export function bandHeight(stage: Stage, windowHeight: number, pick: number): number {
  if (!stage.screenEvery) return 0;
  const [low, high] = stage.bandPx;
  const top = stage.bandShare ? Math.max(low, windowHeight * stage.bandShare) : high;
  const px = low + (top - low) * pick;
  return Math.min(Math.floor(px + (stage.bandShare ? 1 : 0.5)), Math.floor(top));
}
/** How many words this beat covers; `pick` is 0..1. */
export const wordCountFor = (stage: Stage, pick: number): number => stage.words[0] + Math.floor(pick * (stage.words[1] - stage.words[0] + 1));
