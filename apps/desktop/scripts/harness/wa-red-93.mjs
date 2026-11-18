// WA-RED-93 - bug #96/#93: the page's caret is not drawn over an open rail pop-out (Fable, Nov 18), in every theme and both Page tones. Runs reds-93.mjs (writing-audit/): a long page in Draft, the rail's settings and theme pop-outs opened, a caret place under the pop-out (the window is narrowed until the page sits under it),
// the caret taken by difference, a difference inside the pop-out is the caret drawn through it. Six browsers (Arbor, Flux, Machina x Page: Light, Page: Dark); one verdict line (writing-audit/lib/wa-red-run.mjs). RED on main in Flux (the block caret, z-index 60, showed through the pop-out); the fix is one CSS rule.
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-93', steps: [
  { script: 'reds-93.mjs', themes: ALL, tone: 'light' },
  { script: 'reds-93.mjs', themes: ALL, tone: 'dark' },
] });
