// WRITING AUDIT, SESSION 3 (Fable, Nov 10): the RANDOM WRITER on the Page editor - seeded sequences of a writer's actions against the reference model, shrunk when one fails (lib/random.mjs).
// FINDS AND REPORTS; FIXES NOTHING. Run: node scripts/harness/writing-audit/s3-random.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s3-random.mjs, groups=n60s1 = 60 sequences, seed base 1)
const { main } = await import('./lib/random.mjs');
await main({ title: 'S3-RANDOM' });
