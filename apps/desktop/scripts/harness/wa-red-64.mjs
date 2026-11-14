// WA-RED-64 - bug #96: the red check of #64 (Typewriter speed on a long page, and a wrapped line) in the standing suite. Runs reds-64.mjs, reds-64-wrap.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-64', steps: [
  { script: 'reds-64.mjs', themes: ALL },
  { script: 'reds-64-wrap.mjs', themes: ALL },
] });
