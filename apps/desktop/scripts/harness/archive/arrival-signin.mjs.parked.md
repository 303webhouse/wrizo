# Parked records archived from arrival-signin.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/arrival-signin.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from arrival-signin.mjs lines 230-237 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 3756765422a1ca56e531ab9793f6b5f9f8ae1d60

```js
  // SUPERSEDED (item word-diet, Nick) — logoutBlockedBody/logoutAnyway/
  // logoutAnywayConfirm all shortened; see the successors just below.
  // ok('(F11) the body is the approved sentence, with the count in it',
  //   w3.body === "3 changes haven’t saved to your account yet. Stay signed in until they save, or sign out anyway and lose them.", w3.body);
  // ok('(F12) the second step reads "Sign out anyway (N changes will be lost)"', w3.anyway === 'Sign out anyway (3 changes will be lost)', w3.anyway);
  // const w1 = guard.logoutWords(1, t);
  // ok('(F13) a single change reads as one (no "1 changes")',
  //   !/1 changes/.test(w1.body + w1.anyway + w1.confirm) && /1 change /.test(w1.body) && /\(1 change will be lost\)/.test(w1.anyway), JSON.stringify(w1));
```
