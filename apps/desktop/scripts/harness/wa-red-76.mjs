// WA-RED-76 - bug #96: the red check of #76 (two windows of one device) in the standing suite. Runs merge-unit.mjs, reds-76.mjs, reds-76-refresh.mjs, reds-76-merge.mjs, reds-76-warn.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-76', steps: [
  { script: 'merge-unit.mjs', themes: [] },
  { script: 'reds-76.mjs', themes: ['plateau'] },
  { script: 'reds-76-refresh.mjs', themes: ['plateau'] },
  { script: 'reds-76-merge.mjs', themes: ['plateau'] },
  { script: 'reds-76-warn.mjs', themes: ['plateau'] },
] });
