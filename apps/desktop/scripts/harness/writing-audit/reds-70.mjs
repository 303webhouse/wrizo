// RED-FIRST CHECK for #70 (Free Write: the first Enter after a word does not move the caret to the new line): the audit's Free Write Enter cases, strict, Arbor and Machina.
// FW02 type Hello, Enter · FW03 Enter twice · FW05 Shift+Enter · FW07 Enter then Backspace · FW09 Enter at the end of three paragraphs, then a letter · FW11 three Enters · FW12 Nick's first page.
// RED on main today: after the Enter the caret is painted at the end of the line above (or nowhere), not on the new line. Flux is left out: its block caret at the start of a word is #71, a different bug.
// Run: node scripts/harness/writing-audit/reds-70.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-70.mjs; strict; configs plateau and machina)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'FW02,FW03,FW05,FW07,FW09,FW11,FW12';
const { main } = await import('./lib/freewrite.mjs');
await main({ title: 'RED-70' });
