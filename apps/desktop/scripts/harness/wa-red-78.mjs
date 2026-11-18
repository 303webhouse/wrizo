// WA-RED-78 - bug #96/#78: the Flux block caret follows the caret through a window resize cycle 1366 > 1000 > 1920 > 1366 (20 cycles, five reads each) and the Tutor's conversation box draws no block caret through 20 rounds of Backspace (Fable, Nov 18). Runs writing-audit/reds-78b.mjs in Flux, Page: Light and Page: Dark;
// RED on main: after the last step the block caret stood at a stale place (68 px off), 20 of 20 cycles, both tones; the fix redraws the caret as the layout settles. One verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-78', steps: [
  { script: 'reds-78b.mjs', themes: ['flux'], tone: 'light' },
  { script: 'reds-78b.mjs', themes: ['flux'], tone: 'dark' },
] });
