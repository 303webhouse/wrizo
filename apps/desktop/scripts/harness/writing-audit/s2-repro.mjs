// WRITING AUDIT, SESSION 3 follow-up: the random writer's shrunk finds replayed as scripted cases, so each step's verdict is printed (lib/cases2.mjs group `repro`).
// FINDS AND REPORTS; FIXES NOTHING. Run: node scripts/harness/writing-audit/s2-repro.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s2-repro.mjs)
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['repro'], title: 'S3-REPRO' });
