# Parked records archived from logout-flush.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/logout-flush.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from logout-flush.mjs lines 277-281 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
  // SUPERSEDED (item word-diet) — arrival-signin-capture.mjs's own driver
  // click moved from 'Sign out anyway' to 'Sign out and lose' (the new
  // logoutAnyway/logoutAnywayOne text).
  // ok('(F5) the second step is reached by the real button ("Sign out anyway"), and the sheet is dismissed with Esc ("Stay signed in")',
  //   /await app\.click\('Sign out anyway'\)/.test(cap) && /await app\.key\('Escape'\)/.test(cap), '');
```
