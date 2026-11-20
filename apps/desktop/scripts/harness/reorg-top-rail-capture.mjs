// reorg-top-rail in CAPTURE mode, on a tree that is origin/main cbbffef3 plus the harness only (branch reorg-top-rail-golden-b): prints main's switch-off
// header row (a Part, a one-Part Doc, a screenplay, a Board; Arbor, Flux and Machina) as GOLDEN lines, for reorg-top-rail-off-golden.json. A
// wrapper so the Actions harness, which passes no environment, runs the capture as a file of its own. It lives on that branch only.
process.env.REORG_TOP_MODE = 'capture';
await import('./reorg-top-rail.mjs');
