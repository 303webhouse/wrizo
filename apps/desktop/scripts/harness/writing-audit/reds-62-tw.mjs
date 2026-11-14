// CHECK for #62 with the Typewriter ENGAGED (the page scrolls to keep the caret on the centre line): the same cases as reds-62.mjs (V03, V04, V05 and the Up-from-an-empty-row cases V10, V11, V12), strict, judged against the page's own layout.
// Run: node scripts/harness/writing-audit/reds-62-tw.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-62-tw.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'V03,V04,V05,V10,V11,V12';
process.env.WA_TYPEWRITER = 'on';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['vert'], title: 'RED-62-TW' });
