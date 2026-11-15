// WRITING AUDIT, SESSION 4 (Fable, Nov 10): FREE WRITE in each theme - Enter cases first (lib/freewrite.mjs). FINDS AND REPORTS; FIXES NOTHING.
// Run: node scripts/harness/writing-audit/s4-freewrite.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s4-freewrite.mjs)
const { main } = await import('./lib/freewrite.mjs');
await main({ title: 'S4-FREEWRITE' });
