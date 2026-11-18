// WA-RED-66 - bug #96/#66: at the very end of the page SHIFT+RIGHT must not select the invisible end marker (then Left did nothing): the audit's C4 case R05 and S66a-d (reds-66b.mjs on the Draft page, reds-66b-card.mjs on the card pop-up) and the standing L66 guard (reds-66.mjs: Left, Shift+Left,
// Ctrl+Left, Enter then Left at the end of a page that ends in a newline) in Arbor, Flux and Machina; nine browsers; one verdict line (writing-audit/lib/wa-red-run.mjs). RED on main: R05 and S66b fail on the page and the card, all three themes; the fix collapses a selection that holds only the marker (store/hiddenMarksEditing.ts).
import { runReds, ALL } from './writing-audit/lib/wa-red-run.mjs';
await runReds({ name: 'WA-RED-66', steps: [
  { script: 'reds-66b.mjs', themes: ALL },
  { script: 'reds-66b-card.mjs', themes: ALL },
  { script: 'reds-66.mjs', themes: ALL },
] });
