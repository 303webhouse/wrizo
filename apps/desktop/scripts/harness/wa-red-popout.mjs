// WA-RED-POPOUT - the sign-in pop-out (the Wrizors' spec, Nov 18) in the standing suite. Runs writing-audit/signin-popout.mjs (signed out) in Arbor, Flux and Machina, Page: Light and Page: Dark - six browsers - and prints one verdict line (writing-audit/lib/wa-red-run.mjs).
// P1 the door opens ONE panel over the picture; P2 the lexicon's words per theme and the swap in place; P3 #107's edge (1 px, >= 3:1 against the field and the panel); P4 the 18+ tick (no tick, no call, nothing stored); P5 a signed-out device opens on the panel with no back.
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-POPOUT', steps: [
  { script: 'signin-popout.mjs', themes: ALL, tone: 'light' },
  { script: 'signin-popout.mjs', themes: ALL, tone: 'dark' },
] });
