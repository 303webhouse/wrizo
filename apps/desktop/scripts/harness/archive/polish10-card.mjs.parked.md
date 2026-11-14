# Parked records archived from polish10-card.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/polish10-card.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from polish10-card.mjs lines 95-98 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 32e077d93edce787f51dd37d728df5f8ecf028a4

```js
      // C5: PARKED VERBATIM (Fable, Oct 28): Esc closes the whole card - that is ruled (fx4 S5: Esc and the backdrop close the pop-up), so the card's dock does not take
      // the Esc first. Kept as written and no longer run; its successor follows (C5s: the ruled behaviour, stated).
      //   focus on a control inside the dock, then Esc:
      //   ok(`${tag} C5: Esc inside the dock closes the dock, focus returns to the grip, the card stays open (...)`, inside.focus === 'dock' && afterEsc.popup && afterEsc.open === false && afterEsc.focus === 'grip', ...);
```
