// WRITING AUDIT, SESSION 2, part 1 (Fable, Nov 10): Enter with the TYPEWRITER ENGAGED, in each theme, and the #61 probe. Nick's own bug is "Enter, then the caret in the page's top-left corner": look for it here first.
// FINDS AND REPORTS; FIXES NOTHING. Run: node scripts/harness/writing-audit/s2-typewriter.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s2-typewriter.mjs)
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'on';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['enterTw', 'enterLong', 'enterKeys', 'probe'], title: 'S2-TYPEWRITER' });
