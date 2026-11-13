# Parked records archived from a11y-tutor-live-region.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/a11y-tutor-live-region.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from a11y-tutor-live-region.mjs lines 61-66 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 57bf56a5ec3928e66226f94cb70b423398bcd056

```js
// ---- PARKED - SUPERSEDED by Phase 1 (the Tutor panel's only child is now the sliding layer, <SideDrawer>, which holds the tab row and the bodies; "the FIRST thing inside .wz-tutor-panel" is no longer literal, the CLAIM it guarded is unchanged), 2026-10-12 ----
// Kept VERBATIM and no longer run. The successor follows.
//
// ok('A8: the live region is the FIRST thing inside .wz-tutor-panel (aria-hidden={!open}) — an aria-hidden ancestor already keeps a live region silent while the Tutor is closed, so no new closed-state guard was needed',
//   !!panelOpenTag, '');
// ----------------------------------------------------------------------
```
