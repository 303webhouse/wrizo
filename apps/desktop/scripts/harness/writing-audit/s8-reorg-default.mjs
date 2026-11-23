// WRITING AUDIT, SESSION 8, THE DEFAULT: s8-reorg.mjs with NO ?reorg=1 in the URL (train K, Fable, Nov 22, 6:20 pm: the reorg on by default in Machina
// and Arbor). The INFO reorg line names what lit (the top rail, the theme); a case whose door is missing reads "not covered", so on a tree where the
// default is off this run shows it as a column of not-covered lines. FINDS AND REPORTS; FIXES NOTHING.
process.env.WA_NOASK = '1';
const { main } = await import('./lib/session8.mjs');
await main({ title: 'S8-REORG-DEFAULT' });
