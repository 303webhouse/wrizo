// WA-RED-62 - bug #96: the red check of #62 (the vertical keys keep the writer's column; Up and Down through an empty line) in the standing suite. Runs reds-62.mjs (Typewriter off) and reds-62-tw.mjs (Typewriter on) (writing-audit/), a browser per run, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-62', steps: [
  { script: 'reds-62.mjs', themes: ALL },
  { script: 'reds-62-tw.mjs', themes: ALL },
] });
