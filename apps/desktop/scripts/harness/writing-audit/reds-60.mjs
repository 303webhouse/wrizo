// RED-FIRST CHECK for #60 (Nick's top-right caret): an empty page in Draft; the flows (a) Enter, Up, (b) Enter, Left, (f) a line, Enter, Enter, Up, each then a letter. The caret must be DRAWN at the start of the empty line,
// not at the writing area's right margin. RED on main today (Arbor, Machina); it goes GREEN when an arrow onto an empty row lands inside that row.
// Run: node scripts/harness/writing-audit/reds-60.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-60.mjs, configs plateau/machina; strict: exit 1 when red)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'NA,NB,NF';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['nick'], title: 'RED-60' });
