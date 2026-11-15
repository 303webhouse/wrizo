// RED-FIRST CHECK for #66, the card pop-up's twin of reds-66.mjs: the same eight cases (L66a-h) on a Board card's editor (the card reuses the Draft engine on a plain contenteditable). Strict, Typewriter off. A Flux card draws the thin native caret (#73),
// so the reader proof runs its native-caret mutant there (fluxBlockCaret: false, lib/runner.mjs).
// Run: node scripts/harness/writing-audit/reds-66-card.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-66-card.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'L66a,L66b,L66c,L66d,L66e,L66f,L66g,L66h';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({
  groupsDef: GROUPS2, order: ['left66'], title: 'RED-66-CARD',
  editorSel: '.board-popup-editor', pageSel: '.board-popup', fluxBlockCaret: false,
  surfaceHook: async (d) => { d.openPage = (text) => d.openCard(text); },
});
