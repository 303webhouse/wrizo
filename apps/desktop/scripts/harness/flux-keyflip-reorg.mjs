// FLUX KEY-FLIP WITH THE REORG ON (Fable, Nov 23, 8:20 am, the Flux live join: "keyflip with Flux's reorg on (Actions)"; the Wrizors' ship checklist B).
// keyflip-live.mjs opens its themes through the harness driver, which serves window.__wrizoReorgOff to a file that does not ask for the reorg, so its Flux has been the Flux WITHOUT the
// reorg's pieces. This file lifts that pin (WS_REORG=1, as arbor-keyflip-reorg.mjs does) and runs the same file on Flux alone, so every check in it reads the page a Flux writer gets.
//   KFR-ON  keyflip-live.mjs reads that the page it measured carries the redesign and the reorg's top rail: the wrapper is not silently the old file
// Run: node scripts/harness/flux-keyflip-reorg.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';
process.env.WS_KL_FLUX_REORG = '1';
await import('./keyflip-live.mjs');
