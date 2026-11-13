// WA-RED-63 - bug #96: the red check of #63 (the page turn without its animation, and its sound) in the standing suite. Runs reds-63.mjs, reds-63-sound.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-63', steps: [
  { script: 'reds-63.mjs', themes: ALL },
  { script: 'reds-63-sound.mjs', themes: ALL },
] });
