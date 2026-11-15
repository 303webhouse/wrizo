// #61, the same two cases as reds-61.mjs, with the DRAWN check back ON (nothing ignored): on Flux the block caret is an element, so where it stands is judged as well as the text and the caret offset.
// Run: node scripts/harness/writing-audit/reds-61-drawn.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-61-drawn.mjs, config flux; strict)
process.env.WA_IGNORE = 'none';
await import('./reds-61.mjs');
