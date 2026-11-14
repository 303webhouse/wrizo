// WRITING AUDIT, SESSION 4 (Fable, Nov 10): TITLES - the board's title (breadcrumb rename) and a drawer's name (lib/titles.mjs). FINDS AND REPORTS; FIXES NOTHING.
// Run: node scripts/harness/writing-audit/s4-titles.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s4-titles.mjs)
const { main } = await import('./lib/titles.mjs');
await main({ title: 'S4-TITLES' });
