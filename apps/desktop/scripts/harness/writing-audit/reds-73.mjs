// RED-FIRST CHECK for #73 (the card pop-up grows DOWNWARD only - Nick's ruling): the card is centred on the screen, so every line it grows by moves its top edge up by half a line and the writer's own lines jump. E19 and E20 (Enter in and at the end of a paragraph that wraps) and K73a
// (ten Enters at the end of a short card) and K73b (a long run of words typed into a card) hold the card's rectangle to "same left, top and width; the height only grows" (lib/verify.mjs `pageGrowsDown`). Strict, Typewriter off.
// RED on main: the top moves. Run: node scripts/harness/writing-audit/reds-73.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-73.mjs). A Flux card draws the thin native caret (#73's other half), so the reader proof's Flux block-caret mutant does not apply (fluxBlockCaret: false).
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'E19,E20,K73a,K73b';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS } = await import('./lib/cases.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({
  groupsDef: { ...GROUPS, ...GROUPS2 }, order: ['enter', 'card73'], title: 'RED-73',
  editorSel: '.board-popup-editor', pageSel: '.board-popup', fluxBlockCaret: false, pageGrowsDown: true,
  surfaceHook: async (d) => { d.openPage = (text) => d.openCard(text); },
});
