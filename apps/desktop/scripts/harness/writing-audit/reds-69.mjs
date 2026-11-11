// RED-FIRST CHECK for #69 (the 60-character board name): TT14 (the rename box opens on the name AS DISPLAYED, cut at 60) and TT15 (the second commit: an 81-character name, change one character, commit: the stored name must keep all 82).
// RED on main today (Arbor, Flux, Machina, board only); GREEN when the rename box opens on the full stored name.
// Run: node scripts/harness/writing-audit/reds-69.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-69.mjs; strict)
process.env.WA_STRICT = process.env.WA_STRICT || '1';
process.env.WA_ONLY = process.env.WA_ONLY || 'TT14,TT15';
const { main } = await import('./lib/titles.mjs');
await main({ title: 'RED-69' });
