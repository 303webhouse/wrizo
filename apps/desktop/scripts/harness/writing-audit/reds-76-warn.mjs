// RED-FIRST CHECK for #76 part 2 (the quiet line): TW1-TW3, a second app instance in a same-origin iframe is a second window. The same page open in both: each shows ONE quiet line ([data-same-page-elsewhere]), no dialog, nothing that takes focus,
// typing never blocked; the line goes when the other window closes or leaves the page. RED on main today (no line anywhere). GREEN when windows signal each other.
// Run: node scripts/harness/writing-audit/reds-76-warn.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-76-warn.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'TW1,TW2,TW3,TW4';
const { main } = await import('./lib/session6.mjs');
await main({ title: 'RED-76-WARN' });
