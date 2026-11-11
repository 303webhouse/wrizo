// WRITING AUDIT, SESSION 4 (Fable, Nov 10): the CARD'S TEXT on a Board - the card pop-up's editor (components/board/BoardCardPopup.tsx), the same battery as the Page in Draft: Enter first, then typing, deleting, moving,
// selecting, the #61 probes, Up/Down/Home/End and the mouse. FINDS AND REPORTS; FIXES NOTHING. Run: node scripts/harness/writing-audit/s4-card.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s4-card.mjs)
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS } = await import('./lib/cases.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({
  groupsDef: { ...GROUPS, ...GROUPS2 }, order: ['enter', 'type', 'del', 'move', 'select', 'probe', 'vert', 'mouse'], title: 'S4-CARD',
  editorSel: '.board-popup-editor', pageSel: '.board-popup',
  surfaceHook: async (d) => { d.openPage = (text) => d.openCard(text); },
});
