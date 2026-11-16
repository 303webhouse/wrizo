// WA-RED-103 - bug #96/#103: the open card's words read in every theme and both Page tones (Machina, Page: Dark, used to read 1.13:1: #E6E9F1 on the cream card #FBF6EA). Runs writing-audit/card-contrast.mjs (the card's words >= 4.5:1, its eyebrow and close X >= 3:1, from the browser's computed styles) for Arbor, Flux and Machina, Page: Light and Page: Dark - six browsers - and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-103', steps: [
  { script: 'card-contrast.mjs', themes: ALL, tone: 'light' },
  { script: 'card-contrast.mjs', themes: ALL, tone: 'dark' },
] });
