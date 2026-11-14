// WA-RED-72 - bug #96: the red check of #72 (the card's text: select all, then Backspace, leaves no stray newline) in the standing suite. Runs reds-72.mjs (writing-audit/) in all three themes, a browser per run, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
// Flux is in since Nov 14: the audit's reader proof used to run a Flux block-caret mutant on every surface, and a Flux CARD draws the thin native caret (#73), so it read "nothing flagged" and the run exited 1; the runner now takes `fluxBlockCaret: false` for the card (reds-72.mjs) and the card's proof in Flux is the native-caret mutant (lib/runner.mjs, the superseded line parked there).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-72', steps: [
  { script: 'reds-72.mjs', themes: ALL },
] });
