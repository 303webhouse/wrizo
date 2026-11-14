// RED-FIRST CHECK for #72 (the card's text: select all, then Backspace, leaves a stray newline; the browser's own empty line was read as a newline of the writer's): the card pop-up's editor on a Board, strict, Typewriter off.
// S04 Ctrl+A, then Backspace (the text must be empty) · K72a then type x (the text must be "x", not "x" and a newline) · K72b Backspace again (still empty) · K72c Enter, then x (one newline, the writer's own: "\nx").
// RED on main: S04 reads "\n", K72a reads "x\n", K72b "\n", K72c "\n\nx" - all three themes. Run: node scripts/harness/writing-audit/reds-72.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-72.mjs)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'S04,K72a,K72b,K72c';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS } = await import('./lib/cases.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({
  groupsDef: { ...GROUPS, ...GROUPS2 }, order: ['select', 'card72'], title: 'RED-72',
  editorSel: '.board-popup-editor', pageSel: '.board-popup',
  surfaceHook: async (d) => { d.openPage = (text) => d.openCard(text); },
});
