# Parked records archived from item139.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item139.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item139.mjs lines 145-160 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 69d63fdf58a401352fa455b749e6ea0e257f33b5

```js
  // === ITEM 140 — SUPERSEDED (S2: the 'granted' sentinel as a grant) =========
  // ORIGINAL, verbatim:
  //
  //   const out = runChild({ WS_BOX_TURN: 'granted', WS_REAPER_PREFLIGHT_DONE: '1' });
  //   ok('S2 (the control): WITH a granted turn the box guards pass and the run proceeds to its NEXT check (the missing bundle) — so S1 and S3 are not passing on a guard that refuses everything unconditionally',
  //     /No built bundle/.test(out) && !/BOX TURN NOT GRANTED/.test(out) && !/LIVE FOREIGN RUN/.test(out), out.slice(0, 200));
  //
  // WHY IT CANNOT STAND. It passed only because 139 asked whether the variable
  // was SET. Under 140 the token must MATCH the grant file, and 'granted' matches
  // no grant chat 1 writes — so the run is refused as "BOX TURN HELD BY ANOTHER
  // LANE" before the bundle check it asserts is ever reached. The same
  // experiment now yields the opposite verdict, and that verdict is 140's point.
  //
  // (Caught by 140's own gate pair, 2026-09-16, which came back NOT CLEAN on it:
  // a change to a guard's semantics falsifies every test that encodes the old
  // semantics, and item140.mjs was swept while this file was not.)
```

## Record 2 · from item139.mjs lines 166-181 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 69d63fdf58a401352fa455b749e6ea0e257f33b5

```js
  // === ITEM 140 — SUPERSEDED (S3: the foreign-run refusal behind 'granted') ===
  // ORIGINAL, verbatim:
  //
  //   const out = runChild({ WS_BOX_TURN: 'granted' });
  //   ...
  //   ok('S3: with a LIVE FOREIGN RUN on the box, withHarness refuses even WITH a granted turn — a grant is permission to take the box, never permission to contend for it',
  //     /LIVE FOREIGN RUN PRESENT/.test(out), out.slice(0, 200));
  //
  // WHY IT CANNOT STAND. Its claim is still true — a grant never licenses
  // contention — but with the 'granted' sentinel the GRANT check now refuses
  // first, so the foreign-run refusal it names is never reached. It would be
  // asserting a message the run no longer gets far enough to print. Its sibling
  // ("the scenario never runs") was not falsified and stays live, unchanged.
  //
  // Re-asserted as the ordering 140 creates: with the old sentinel, the grant
  // refusal fires and the foreign-run refusal does not.
```
