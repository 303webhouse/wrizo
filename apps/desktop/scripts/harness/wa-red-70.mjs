// WA-RED-70 - bug #96: the red check of #70 (Free Write: the first Enter after a word puts the caret on the new line; the guard character never reaches the saved text, the count or a copy) in the standing suite. Runs reds-70.mjs and checks-70.mjs (writing-audit/) in Arbor and Machina, a browser per run, and prints one verdict line (writing-audit/lib/wa-red-run.mjs). Flux is left out of reds-70 as that check leaves it out (its block caret is #71).
import { runReds } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-70', steps: [
  { script: 'reds-70.mjs', themes: ['plateau', 'machina'] },
  { script: 'checks-70.mjs', themes: ['plateau', 'machina'] },
] });
