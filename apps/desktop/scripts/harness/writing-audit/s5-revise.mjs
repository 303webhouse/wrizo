// WRITING AUDIT, SESSION 5 (Fable, Nov 11): the Page in REVISE, with the Typewriter ENGAGED - the same battery as the Draft page (Enter, typing, deleting, moving, selecting).
// Publish has no editable text (a dialog), so it is not covered; Free Write already ran with the Typewriter engaged (s4-freewrite). FINDS AND REPORTS; FIXES NOTHING.
// Run: node scripts/harness/writing-audit/s5-revise.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s5-revise.mjs)
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'on';
const { main } = await import('./lib/runner.mjs');
const { GROUPS } = await import('./lib/cases.mjs');
await main({
  groupsDef: GROUPS, order: ['enter', 'type', 'del', 'move', 'select'], title: 'S5-REVISE',
  surfaceHook: async (d) => { const orig = d.openPage.bind(d); d.openPage = (text, mode, opts) => orig(text, 'revise', opts); },
});
