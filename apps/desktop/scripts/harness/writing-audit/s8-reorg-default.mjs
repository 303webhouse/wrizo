// WRITING AUDIT, SESSION 8, THE DEFAULT: s8-reorg.mjs with NO ?reorg=1 in the URL (train K, Fable, Nov 22, 6:20 pm: the reorg on by default in Machina
// and Arbor). The INFO reorg line names what lit (the top rail, the theme); a case whose door is missing reads "not covered", so on a tree where the
// default is off this run shows it as a column of not-covered lines. FINDS AND REPORTS; FIXES NOTHING.
process.env.WA_NOASK = '1';
// lift the harness's driver pin (runtime-verify.mjs serves window.__wrizoReorgOff unless WS_REORG=1, so a file that does not ask opens as before the
// switch-over): without this, run 45100647210 read the PIN, not the default (nothing lit in Machina either)
process.env.WS_REORG = '1';
const { main } = await import('./lib/session8.mjs');
await main({ title: 'S8-REORG-DEFAULT' });
