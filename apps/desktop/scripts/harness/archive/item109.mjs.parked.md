# Parked records archived from item109.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item109.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item109.mjs lines 136-150 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 79899d0c2d930fc7761c4e60035eb5ca90b4990c

```js
  // ---- PARKED - SUPERSEDED by PAGE-TEMPLATES-MOVE (Nick's rulings, 2026-10-08: the page row keeps ONE door, Sprout, on a blank
  // Free Write page). Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block below.
  //
  // ok('S2: THE INVITATION IS DRAWN — the beginnings row offers its doors on the empty page (Sprout / Plan / Screenplay). This is what a writer is offered at a fresh page today; the F6 first-line invite is NOT asserted, because FX15 put it to sleep by default and requiring it would gate a behaviour that was retired on purpose',
  //   cold.beginnings.length >= 3 && cold.flInvite === false,
  //   JSON.stringify({ beginnings: cold.beginnings, flInvite: cold.flInvite }));
  // ------------------------------------------------------------------
  // ---- PARKED - RETIRED by #13 step 12f (Fable, Nov 1): the Sprout door and the first-line invite are deleted, everywhere,
  // forever. Kept VERBATIM and no longer run; its record is in the HARNESS_PARKED block below; successor next, and in full
  // c13-12f-sprout-invite.mjs.
  //
  // ok('S2 [page-templates successor]: THE INVITATION IS DRAWN — the blank Free Write page\'s row offers its ONE door, Sprout (Screenplay is the Draft strip\'s template, Plan the PLAN bar\'s door), and the F6 first-line invite still sleeps',
  //   JSON.stringify(cold.beginnings) === JSON.stringify(['Sprout']) && cold.flInvite === false,
  //   JSON.stringify({ beginnings: cold.beginnings, flInvite: cold.flInvite }));
  // ------------------------------------------------------------------
```
