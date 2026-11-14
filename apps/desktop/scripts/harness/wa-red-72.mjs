// WA-RED-72 - bug #96: the red check of #72 (the card's text: select all, then Backspace, leaves no stray newline) in the standing suite. Runs reds-72.mjs (writing-audit/) in Arbor and Machina, a browser per run, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
// Flux is left out of the wrapper: the audit's reader proof has a Flux mutant for the block caret at the page corner, and a Flux CARD draws no block caret (the thin caret stays there, #73), so the proof reads "nothing flagged" and the run exits 1 on main and on the fix alike; the Flux cases themselves pass 4 of 4 on the fix.
import { runReds } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-72', steps: [
  { script: 'reds-72.mjs', themes: ['plateau', 'machina'] },
] });
