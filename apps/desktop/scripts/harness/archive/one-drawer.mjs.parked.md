# Parked records archived from one-drawer.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/one-drawer.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from one-drawer.mjs lines 139-144 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c4f0365dea3c1ecf5631495cab6ca8666de27cf1

```js
// ---- PARKED - SUPERSEDED by page-size (Fable's ruling, Oct 23: the measured rule replaces Oct 12's one-drawer-at-every-width) ----
// Kept VERBATIM and no longer run. The measured successors (O1m, O2m) follow.
//
// ok('(O1) opening the TUTOR while the Tools drawer is open closes the Tools drawer, through its own registered close path - at any width (no measuring is involved)', v.toolsThenTutor, JSON.stringify(base.toolsThenTutor));
// ok('(O2) and the reverse: opening the Tools drawer while the Tutor is open closes the Tutor', v.tutorThenTools, JSON.stringify(base.tutorThenTools));
// ----------------------------------------------------------------------
```

## Record 2 · from one-drawer.mjs lines 163-167 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in c4f0365dea3c1ecf5631495cab6ca8666de27cf1

```js
  // ---- PARKED - SUPERSEDED by page-size (Fable, Oct 23): its Tutor half read the Oct 12 rule (Tools closes the Tutor whatever the room). Kept VERBATIM, no longer run.
  // Successor: O5m above (the cascade half unchanged; the Tutor half measured).
  //
  // ok('(O5b) the sequence cascade -> Tutor -> Tools: Tools closes the Tutor AND the width law still sees the cascade standing and closes it where the band cannot hold both (the check tests the store\'s own record of what stands, not only the most recent opener)', v.cascadeSeen, JSON.stringify(base.cascadeTutorTools));
  // ----------------------------------------------------------------------
```
