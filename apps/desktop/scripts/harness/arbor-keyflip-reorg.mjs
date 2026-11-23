// ARBOR KEY-FLIP WITH THE REORG ON (Fable, Nov 22, 3:20 pm, train K: "arbor-keyflip with the reorg on green"; Arbor is on by default now: REORG_DEFAULT_ON.plateau = true, all six cells on).
// arbor-keyflip.mjs (ARBOR's bug #80 read, with INK's ::highlight fix of Nov 22) opens Arbor through the harness driver, which serves window.__wrizoReorgOff to a file that does not ask for the
// reorg, so its Arbor has been the Arbor WITHOUT the reorg's pieces: the top bar, the rail, the Front and Back menus, the split and Publish. This file lifts that pin (WS_REORG=1, as
// reorg-switchover.mjs does) and runs the same file unchanged, so every check in it (KF-PREMISE, KF-FLIP, MUT-KF-FLIP, KF-READ, KF-FLIP-SP, the mutants) reads the page a writer gets in Arbor today.
//   KFR-ON  arbor-keyflip.mjs's KF-PREMISE reads, when WS_REORG=1, that the page it measures carries the reorg (the top rail is drawn): the wrapper is not silently the old file
// Run: node scripts/harness/arbor-keyflip-reorg.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';
await import('./arbor-keyflip.mjs');
