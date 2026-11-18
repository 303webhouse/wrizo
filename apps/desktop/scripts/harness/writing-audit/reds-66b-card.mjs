// RED-FIRST CHECK for #66 (Fable's wording, Nov 18): at the very END of the page, SHIFT+RIGHT selects the invisible end marker, and then Left does nothing (the audit's C4, case R05). R05 itself (Shift+Enter, Down, Shift+Right, Left on an empty page) plus S66a-d: Shift+Right at the end of 'abc' and of 'abc\n' (the marker), then Left, and then typing x.
// THE CARD POP-UP'S TWIN of reds-66b.mjs. Expected: Shift+Right at the very end selects nothing, Left moves one place, typing lands where the caret is. Strict, Typewriter off, judged against the page's own model on the Draft page. The card pop-up's twin is reds-66b-card.mjs. Run on Actions via writing-audit.yml, script=reds-66b-card.mjs, all three themes.
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'R05,S66a,S66b,S66c,S66d';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['repro', 'end66'], title: 'RED-66B-CARD',
  editorSel: '.board-popup-editor', pageSel: '.board-popup', fluxBlockCaret: false,
  surfaceHook: async (d) => { d.openPage = (text) => d.openCard(text); },
});
