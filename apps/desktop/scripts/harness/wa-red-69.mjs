// WA-RED-69 - bug #96: the red check of #69 (the Typewriter's caret) in the standing suite. Runs reds-69.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-69', steps: [
  { script: 'reds-69.mjs', themes: ALL },
] });
