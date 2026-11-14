// RED-FIRST CHECK for #67 (Flux: the block caret is drawn at the END of the line above when the caret is at the START of a soft-wrapped line, after Down or Home): the audit's V01 (Down four times from the start of a wrapped page) and V06 (Home
// and End on a wrapped line), strict, Typewriter off, judged against the page's own layout. RED on main in Flux today (V01 step 1 and V06 step 1 draw the block at x 873 on the line above, the text puts the caret at x 447 on the wrap's second line).
// Arbor and Machina draw the native caret and are the controls (they pass these cases). Run: node scripts/harness/writing-audit/reds-67.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-67.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'V01,V06';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['vert'], title: 'RED-67' });
