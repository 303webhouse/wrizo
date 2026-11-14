# Parked records archived from url-search-optin-unit.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/url-search-optin-unit.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from url-search-optin-unit.mjs lines 29-45 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in f295d636ce7bfc0ab1b45dede319fce1b77acd93

```js
// U1 PARKED (r2, Nov 5) - SUPERSEDED: it compared against the merge base of HEAD and origin/main. On the opt-in's own branch that was main
// without the opt-in; once merged, on main the merge base IS main - the opt-in included - so U1 could never pass there (red on main since
// 650f9a74). Kept verbatim below, not run. Successor: U1b.
// // U1: against the merge base with main (the file as every other lane has it)
// let base = null;
// try {
//   const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
//   const mb = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: repo, encoding: 'utf8' }).trim();
//   base = norm(execFileSync('git', ['show', `${mb}:apps/desktop/scripts/runtime-verify.mjs`], { cwd: repo, encoding: 'utf8', maxBuffer: 64 << 20 }));
// } catch (e) { ok('U1 the merge base\'s runtime-verify.mjs could be read', false, String(e.message || e).slice(0, 200)); }
// if (base != null && m) {
//   const unset = now.replace(DECL, '').split('${URL_SEARCH}').join('/');
//   const same = unset === base;
//   let where = '';
//   if (!same) { const a = unset.split('\n'), b = base.split('\n'); const i = a.findIndex((l, k) => l !== b[k]); where = `first difference at line ${i + 1}: ${JSON.stringify((a[i] || '').slice(0, 90))} vs ${JSON.stringify((b[i] || '').slice(0, 90))}`; }
//   ok('U1 unset, the driver is the merge base\'s file byte for byte', same, same ? `${base.length} chars identical` : where);
// }
```
