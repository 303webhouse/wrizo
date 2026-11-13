# Parked records archived from item85c.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/item85c.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from item85c.mjs lines 358-378 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cef75c4a2e26ec2bafa2ef233576bfe201223d45

```js
  // === ITEM 85-C — SUPERSEDED (the seeded updatedAt) =========================
  // ORIGINAL, verbatim:
  //
  //   ok('S1: the seven new seed fields all reach the row through the real birth path — script, starred, tags, shelved, orderIndex, and a createdAt/updatedAt that DIFFER (the one thing b2.mjs needs and the only reason updatedAt is in the list)',
  //     s.starred === true && JSON.stringify(s.tags) === '["85c"]' && s.shelved === true
  //     && s.orderIndex === 7 && s.hasScript === true
  //     && s.createdAt === '2020-01-01T00:00:00.000Z' && s.updatedAt === '2021-02-03T00:00:00.000Z', seeded);
  //
  // WHY IT CANNOT STAND. `upsert` stamps `updatedAt` from the wall clock on
  // every write — persistence.ts's single write path — so a seeded value was
  // overwritten before the row reached storage. It was never true of STORAGE;
  // it was true only of the object the seam returned, and the seam was
  // returning its own input. Once the seam reported storage instead, the check
  // went red, having passed for a day on a value nobody had written. Making
  // `upsert` honour a supplied `updatedAt` was REFUSED (2026-09-15) as house
  // work — it changes the write semantics of every product path — so the seed
  // key was removed rather than the store bent to it, and b2.mjs establishes
  // its recency order by TOUCHING (`wrizoTouchInOrder`) instead.
  //
  // Re-asserted below as the same experiment with its true verdict; the live
  // successor is in S1 above.
```

## Record 2 · from item85c.mjs lines 395-412 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2c4d6ecb1a7c47b8c028189da9b01d7a7a2924d6

```js
    // === ITEM 85-C — SUPERSEDED (the unseeded row's equal timestamps) ========
    // ORIGINAL, verbatim:
    //
    //   ok('S1 (the control): an UNSEEDED call is untouched by the widening — none of the seven fields appears, source is still page, origin still journal, and updatedAt still equals createdAt. Zero behaviour change, demonstrated rather than asserted',
    //     u.starred === undefined && u.tags === undefined && u.shelved === undefined
    //     && u.orderIndex === undefined && u.script === undefined && u.sameTimes === true
    //     && u.source === 'page' && u.origin === 'journal', unseeded);
    //
    // WHY IT CANNOT STAND. `createdAt` is stamped at createJournalPage's entry
    // and `updatedAt` by `upsert` a few microseconds later: TWO clock reads.
    // While the seam echoed its input the check compared the object it was
    // handed, where both came from the same value, so it could not see them
    // apart. Now that the seam reports STORAGE, the two agree only when both
    // land in the same millisecond — nearly always, and not always. It was
    // never falsified; it was made a check that can pass by luck of timing,
    // which the house's empty known-flake list will not carry.
    //
    // Re-asserted as the ORDER it always meant. Live successor in S1 above.
```
