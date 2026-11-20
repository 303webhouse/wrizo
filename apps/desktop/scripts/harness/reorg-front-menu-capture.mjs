// reorg-front-menu in CAPTURE mode, on a tree that is origin/main plus the harness only (branch reorg-front-menu-golden): prints main's switch-off
// drawer, open (a Draft Part, a Free Write page, a screenplay, a Board; Arbor, Flux and Machina) as GOLDEN lines, for
// reorg-front-menu-off-golden.json. A wrapper so the Actions harness, which passes no environment, runs the capture as a file of its own.
process.env.REORG_FRONT_MODE = 'capture';
await import('./reorg-front-menu.mjs');
