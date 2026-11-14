// RED-FIRST CHECK for #76 part 3 (KEEP BOTH): TM1-TM5. Two or three windows type into one page at once; every word typed anywhere must be in the stored page, every window must end on it, nothing written twice, and the quiet line says both versions were kept.
// RED on main today: the window that saves last wins and the others' words are gone. GREEN when two windows' words are merged, never overwritten. (store/textMerge.ts's own unit check is merge-unit.mjs.)
// Run: node scripts/harness/writing-audit/reds-76-merge.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-76-merge.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_MERGELOG = process.env.WA_MERGELOG || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'TM1,TM2,TM3,TM4,TM5,TM6';
const { main } = await import('./lib/tabs-merge.mjs');
await main({ title: 'RED-76-MERGE' });
