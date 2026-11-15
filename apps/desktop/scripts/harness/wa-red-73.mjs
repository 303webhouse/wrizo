// WA-RED-73 - bug #96: the red check of #73 (the card pop-up grows DOWNWARD only: its left, top and width stay, only its height grows) in the standing suite. Runs reds-73.mjs (writing-audit/) in all three themes, a browser per run, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
// E19, E20 (Enter in and at the end of a paragraph that wraps) and K73a, K73b (ten Enters; a long run of typed words) on the card, judged by the reader's card law (lib/verify.mjs `pageGrowsDown`). A Flux card draws the thin native caret, so the reader proof's Flux mutant is the native-caret one (`fluxBlockCaret: false`).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-73', steps: [
  { script: 'reds-73.mjs', themes: ALL },
] });
