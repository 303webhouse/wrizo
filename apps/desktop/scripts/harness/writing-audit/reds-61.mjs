// RED-FIRST CHECK for #61 (Flux: Enter on an empty middle line, the next typed letter lands in the wrong place): P61 and P62 judged on TEXT and CARET OFFSET only (the painted caret is #60's, so 'drawn' is ignored here).
// RED on main today on Flux ("Onex", "One\nxy"); GREEN on Arbor and Machina already and must stay green. Goes GREEN on Flux when Enter on an empty line leaves the caret on the new line.
// Run: node scripts/harness/writing-audit/reds-61.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-61.mjs, configs flux (red) and plateau/machina (control); strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'P61,P62';
process.env.WA_IGNORE = process.env.WA_IGNORE || 'drawn';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['probe'], title: 'RED-61' });
