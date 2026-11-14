// reorg-rails in CAPTURE mode, on a tree that is origin/main plus the harness only (branch reorg-rails-golden): prints main's switch-off DOM
// (the strip and its seven pop-outs, in Arbor, Flux and Machina) as GOLDEN lines, for reorg-rails-off-golden.json. A wrapper so the Actions
// harness, which passes no environment, runs the capture as a file of its own. It lives on that branch only, never in the standing suite.
process.env.REORG_RAILS_MODE = 'capture';
await import('./reorg-rails.mjs');
