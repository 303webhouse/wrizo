// WRITING AUDIT, SESSION 2, part 4 (Fable, Nov 10): the SMOKE set for the dark tone and the 1920 width (the full cross stays in Arbor, light, 1366): the cases that found something, plus a clean control of each kind.
// FINDS AND REPORTS; FIXES NOTHING. Run: node scripts/harness/writing-audit/s2-smoke.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s2-smoke.mjs, configs with dark or 1920)
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['smoke'], title: 'S2-SMOKE' });
