# Parked records archived from machina-intake.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/machina-intake.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from machina-intake.mjs lines 81-83 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in a874f9fc2a42ae6ab2c8bf3e120f3ca134fb0446

```js
      // ---- PARKED VERBATIM - SUPERSEDED by Fable's ruling (Oct 28): Intake REPLACES the Forms content inside the Forms dialog, so it has no border of its own and is the dialog's width (<= 600), not 520. Successor follows; the original is not run.
      // ok(`P1 [${label}]: square, a 1px hairline, no shadow, 520 wide at most (${m ? m.w : '?'})`, !!m && parseFloat(m.radius) === 0 && m.shadow === 'none' && m.border === '1px 1px' && m.w <= 520, JSON.stringify(m && { radius: m.radius, shadow: m.shadow, border: m.border, w: m.w }));
      // ------------------------------------------------------------------
```
