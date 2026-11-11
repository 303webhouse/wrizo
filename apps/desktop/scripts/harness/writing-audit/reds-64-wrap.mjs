// GUARD for #64 (Fable's condition): one LONG PARAGRAPH typed at the foot of a 13-line page, a sentence per step, so it wraps onto new rows past the sheet's foot (R10). After every step the caret's line must be inside the sheet
// (judged at a wrap to a new row, not at every character). Typing scrolls natively, so this is GREEN on main as well as on the fix: it guards that revealCaret never moves a typed character's line out of view.
// 'drawn' is ignored here: Machina paints its caret 3 px left of the text's own caret after a space that ends a row, on main exactly as on the fix (not #64's).
// Run: node scripts/harness/writing-audit/reds-64-wrap.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-64-wrap.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'R10';
process.env.WA_IGNORE = process.env.WA_IGNORE || 'page,drawn';
process.env.WA_INSHEET = '1';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['repro'], title: 'GUARD-64-WRAP' });
