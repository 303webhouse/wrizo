// RED-FIRST CHECK for #62 (the vertical keys keep the writer's column): the audit's V03 (Down, Down, Up, Up: the caret goes down through a SHORTER paragraph and must come back up to the column it started from, not the column the short line cut it to) and
// V04 (Down through an empty line: from the empty line, Down reaches the paragraph below at the column the run started from; today the caret stays in the empty line), strict, Typewriter off, judged against the page's own layout. RED on main in all three themes.
// V05 (Flux: Up on the first line, then Down: the column ended at the page's start, the Flux page kept the old one and Down went to the old column of the second line). RED on main: V03 and V04 in all three themes, V05 in Flux.
// Run: node scripts/harness/writing-audit/reds-62.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-62.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'V03,V04,V05,V10,V11,V12';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['vert'], title: 'RED-62' });
