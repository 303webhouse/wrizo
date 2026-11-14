# Parked records archived from hide-workshop-source.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/hide-workshop-source.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from hide-workshop-source.mjs lines 102-106 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6ba919fdc9606dab283aaf745dd002ecff4422e0

```js
  // ---- PARKED - RETIRED by #13 step 11, with T3 (above): its subject, JournalEntry's row, is deleted. Kept VERBATIM and no longer run.
  //
  // const m3 = je.replace("['Draft', 'Format', lex('publish')]", "['Draft', 'Format', 'Workshop', lex('publish')]");
  // ok('MUTANT: Workshop re-added to JournalEntry\'s row - T3 must go RED', m3 !== je && /Workshop/i.test(journalRow(m3)), journalRow(m3));
  // ------------------------------------------------------------------
```
