// WA-RED-65 - bug #96: the red check of #65 (Up into a wrapped paragraph) in the standing suite. Runs reds-65.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-65', steps: [
  { script: 'reds-65.mjs', themes: ALL },
] });
