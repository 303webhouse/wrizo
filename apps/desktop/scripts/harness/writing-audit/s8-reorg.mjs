// WRITING AUDIT, SESSION 8 (Fable, Nov 22, 2:30 pm): the writing surfaces with the REORG ON, in Machina and Arbor, as Nick tests Monday: Parts, the split, Find,
// footnotes, Sup/Sub, the Typewriter, long pages (lib/session8.mjs). FINDS AND REPORTS; FIXES NOTHING.
// Run: node scripts/harness/writing-audit/s8-reorg.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s8-reorg.mjs; WA_LIFT=all previews Arbor's unlit cells)
const { main } = await import('./lib/session8.mjs');
await main({ title: 'S8-REORG' });
