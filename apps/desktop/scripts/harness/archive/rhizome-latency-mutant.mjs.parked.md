# Parked records archived from rhizome-latency-mutant.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/rhizome-latency-mutant.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from rhizome-latency-mutant.mjs lines 59-62 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 635be6c34b74f9b0a77b358f7136d4815ffaa63f

```js
  // PARKED - SUPERSEDED by the reference-shift check (Fable, Nov 6; coarse-C stabilising). The line(s) that stood, verbatim (the successor is the line below this block):
//   ok(`${m.id}: the verdict - ${m.red.length ? `${m.red.join(' and ')} RED` : 'all green'}${m.red.length && m.green.length ? ', ' : ''}${m.red.length && m.green.length ? `${m.green.join(' and ')} stay green` : ''}`,
//     r.status === m.exit && m.red.every((p) => line(p).startsWith('FAIL')) && m.green.every((p) => line(p).startsWith('PASS')),
//     `exit=${r.status} | ${[...m.red, ...m.green].map((p) => line(p).slice(0, 5) + p).join(' | ')}${m.id === 'M0' ? ' | ' + JSON.stringify(info) : ''}`);
```
