// RED-FIRST CHECK for #76 (two tabs lose words): TB1-TB3, a second app instance in a same-origin iframe. Every word typed in either tab must be in the stored page and survive each tab's reload. RED on main today (all themes):
// the tab that saved last wins and the other tab's words are gone. GREEN when a stale tab can never overwrite newer words.
// Run: node scripts/harness/writing-audit/reds-76.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-76.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'TB1,TB2,TB3';
const { main } = await import('./lib/session6.mjs');
await main({ title: 'RED-76' });
