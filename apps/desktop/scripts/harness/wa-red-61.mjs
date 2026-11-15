// WA-RED-61 - bug #96: the red check of #61 (the Flux caret on the page and its drawn rows) in the standing suite. Runs reds-61.mjs, reds-61-drawn.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-61', steps: [
  { script: 'reds-61.mjs', themes: ALL },
  { script: 'reds-61-drawn.mjs', themes: ['flux'] },
] });
