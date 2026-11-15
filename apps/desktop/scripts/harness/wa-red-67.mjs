// WA-RED-67 - bug #96: the red check of #67 (the Flux block on the start of a wrapped line) in the standing suite. Runs reds-67.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-67', steps: [
  { script: 'reds-67.mjs', themes: ALL },
] });
