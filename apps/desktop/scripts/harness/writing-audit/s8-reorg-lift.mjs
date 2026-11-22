// WRITING AUDIT, SESSION 8, THE PREVIEW: s8-reorg.mjs with Arbor's (or any theme's) unlit reorg cells lit through the gate's own preview door (?reorglift=theme.top,
// .front,.back,.split,.uplink). What Arbor will be once its cells pass, NOT what ships today: its findings are reported apart from the live run's. FINDS AND REPORTS; FIXES NOTHING.
process.env.WA_LIFT = 'all';
const { main } = await import('./lib/session8.mjs');
await main({ title: 'S8-REORG-LIFT' });
