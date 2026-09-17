// ITEM 140 — CHAT 1'S HALF: the grant writer and the clear-at-stamp step.
//
//   node scripts/box-turn.mjs grant <lane> <token>   — at the announcement
//   node scripts/box-turn.mjs clear                  — at the stamp
//   node scripts/box-turn.mjs show                   — what the box holds now
//
// THIS FILE SPELLS NO FORMAT. Every read and write of the grant goes through
// box-grant.mjs, the lane's half. Before this file existed chat 1 wrote grant
// files by hand, and they had ALREADY DRIFTED from the module — a `granted`
// field where the module writes `time`. The matcher only reads `token`, so
// nothing broke; the point is that it could have. A format two halves each
// spell agrees only until one of them is edited.
//
// It lands in the SAME COMMIT as item 140. 140's absent-refuses-everything
// means that if the guard reached `main` without a writer, every run on the box
// would refuse until someone hand-wrote a grant — in whatever format they
// remembered.

import { writeGrant, clearGrant, GRANT_PATH } from './box-grant.mjs';
import { existsSync, readFileSync } from 'node:fs';

const [, , cmd, lane, token] = process.argv;

function show() {
  if (!existsSync(GRANT_PATH)) { console.log(`NO GRANT on the box (${GRANT_PATH})`); return; }
  // Displayed raw rather than parsed: this is for a human reading the box,
  // and chat 1 should not be the second place that knows the field names.
  console.log(`GRANT at ${GRANT_PATH}:\n${readFileSync(GRANT_PATH, 'utf8')}`);
}

if (cmd === 'grant') {
  if (!lane || !token) { console.error('usage: box-turn.mjs grant <lane> <token>'); process.exit(2); }
  // A grant that REPLACES a live one means the previous turn was never cleared.
  // writeGrant will overwrite it regardless; this makes the overwrite visible.
  if (existsSync(GRANT_PATH)) {
    console.log('WARNING: a grant was ALREADY on the box — the previous turn was not cleared at its stamp:');
    show();
  }
  const p = writeGrant(lane, token);
  console.log(`GRANTED lane=${lane} token=${token}`);
  console.log(`  -> ${p}`);
} else if (cmd === 'clear') {
  // clearGrant() is idempotent and reports success either way — correct for the
  // module, whose question is "is a turn granted now?". Chat 1's question at a
  // stamp is different: "WAS a turn granted?" An already-absent grant here is a
  // forgotten or duplicate clear, and this is the one moment chat 1 is
  // guaranteed to be looking. So the check happens BEFORE the clear.
  const wasPresent = existsSync(GRANT_PATH);
  const cleared = clearGrant();
  if (!wasPresent) console.log('WARNING: NO GRANT WAS PRESENT at the stamp — a forgotten or duplicate clear.');
  console.log(cleared ? 'CLEARED — no turn is granted.' : 'CLEAR FAILED — a grant is still on the box.');
  if (!cleared) process.exit(1);
} else if (cmd === 'show') {
  show();
} else {
  console.error('usage: box-turn.mjs grant <lane> <token> | clear | show');
  process.exit(2);
}
