// RED-FIRST CHECK for #64 (the line she is writing is always in view with its caret drawn): R10 - one LONG PARAGRAPH typed at the foot of a 13-line page, a sentence per step, so it wraps onto new rows past the sheet's foot; after every step the caret's line must be inside the sheet (a wrap to a new row, not every character). R08 - a page of 14 lines, then Shift+Enter four times, so the text passes the bottom of the sheet. After EVERY step the caret's line must
// lie inside the SHEET (the scroller's own rectangle) and its caret must be painted. RED on main today (the new line sits below the sheet and, on Arbor and Machina, no caret is painted). The page-turn's bump (#63) is another bug: 'page' is ignored here.
// Run: node scripts/harness/writing-audit/reds-64.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-64.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'R08,R10';
process.env.WA_IGNORE = process.env.WA_IGNORE || 'page';
process.env.WA_INSHEET = '1';
process.env.WA_TYPEWRITER = process.env.WA_TYPEWRITER || 'off';
const { main } = await import('./lib/runner.mjs');
const { GROUPS2 } = await import('./lib/cases2.mjs');
await main({ groupsDef: GROUPS2, order: ['repro'], title: 'RED-64' });
