// WRITING AUDIT, SESSION 6 (Fable, Nov 11): two tabs on the same page, a 10,000-word page, window resize and blur (lib/session6.mjs). FINDS AND REPORTS; FIXES NOTHING.
// Run: node scripts/harness/writing-audit/s6-session.mjs (from apps/desktop; on Actions via writing-audit.yml, script=s6-session.mjs)
const { main } = await import('./lib/session6.mjs');
await main({ title: 'S6-SESSION' });
