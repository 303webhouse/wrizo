// WA-RED-60 - bug #96: the red check of #60 (the Typewriter's centre line) in the standing suite. Runs reds-60.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-60', steps: [
  { script: 'reds-60.mjs', themes: ALL },
] });
