// WA-RED-79 - bug #96: the red check of #79 (two devices, one page) in the standing suite. Runs sync-devices-79.mjs, sync-open-editor-79.mjs (writing-audit/), a browser per run where there is a page, and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-79', steps: [
  { script: 'sync-devices-79.mjs', themes: [] },
  { script: 'sync-open-editor-79.mjs', themes: ['plateau'] },
] });
