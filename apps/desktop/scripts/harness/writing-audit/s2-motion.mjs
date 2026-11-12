// WRITING AUDIT, SESSION 2, part 2 (Fable, Nov 10): the #61 probe with the Typewriter OFF, then Up / Down / PageUp / PageDown and Home / End on wrapped lines, judged against the page's own layout (lib/geom.mjs).
// FINDS AND REPORTS; FIXES NOTHING. Run: node scripts/harness/writing-audit/s2-motion.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s2-motion.mjs)
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['probe', 'vert'], title: 'S2-MOTION' });
