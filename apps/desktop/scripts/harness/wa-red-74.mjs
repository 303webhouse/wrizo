// WA-RED-74 - bug #96: the red check of #74 (undo puts the caret at the change) in the standing suite. Runs reds-74.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-74', steps: [
  { script: 'reds-74.mjs', themes: ['plateau'] },
] });
