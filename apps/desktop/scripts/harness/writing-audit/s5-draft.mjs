// WRITING AUDIT, SESSION 5 (Fable, Nov 11): UNDO AND REDO, THE CLIPBOARD, FORMATTING, SAVE AND RELOAD on the Draft page (lib/session5.mjs). FINDS AND REPORTS; FIXES NOTHING.
// Run: node scripts/harness/writing-audit/s5-draft.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s5-draft.mjs)
const { main } = await import('./lib/session5.mjs');
await main({ title: 'S5-DRAFT' });
