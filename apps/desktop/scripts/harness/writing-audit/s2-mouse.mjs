// WRITING AUDIT, SESSION 2, part 3 (Fable, Nov 10): the mouse - click, click past a line's end, below the last line, in the margin, double and triple click, drag - judged against the page's own layout (lib/geom.mjs).
// FINDS AND REPORTS; FIXES NOTHING. Run: node scripts/harness/writing-audit/s2-mouse.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s2-mouse.mjs)
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['mouse'], title: 'S2-MOUSE' });
