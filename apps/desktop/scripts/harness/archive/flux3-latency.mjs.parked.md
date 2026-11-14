# Parked records archived from flux3-latency.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/flux3-latency.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from flux3-latency.mjs lines 322-328 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e67e555a4a20a9c267d2c6f6cfe90c7d4a0cd16f

```js
  // PARKED 2026-10-31 (SUPERSEDED, first run, Actions 41247909453: the frame floor assumed the display's 60 fps, but an undamped layer at 1920 is
  // what SLOWS the frames - 35-52 frames in 1.5 s on the runner, every one of them drawing - so the floor measured the layer's cost, not whether it
  // animated). Original, verbatim:
  // const animated = loaded.filter((r) => r.idle.n >= 45 && r.idle.drawFrames >= 0.8 * r.idle.n);
  // ok(`P3 the stand-in really animated at rest (>= 45 frames in ${IDLE_MS} ms, >= 80% of them drawing) in every loaded arm-round: ${animated.length}/${loaded.length}`,
  //   loaded.length > 0 && animated.length === loaded.length, JSON.stringify(loaded.map((r) => ({ arm: r.name, round: r.round, frames: r.idle.n, drew: r.idle.drawFrames }))));
  // SUCCESSOR P3b: it animated (>= 80% of the rest frames drew) at any frame rate above 13 fps (>= 20 frames in 1.5 s); its cost is COST's to report.
```

## Record 2 · from flux3-latency.mjs lines 345-351 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 38a58ca8a9790587f82d971e3140b05db98878f2

```js
  // PARKED 2026-10-31 (SUPERSEDED, box turn 22:32-22:45Z and Actions 41248449604, e67e555a: D counted a draw on ANY canvas as the layer's. Every
  // T round showed exactly 2 drawing frames: the one in flight at the first key (0 ms) and one ~3.1 s into the typing, in every round on both
  // machines - not the stand-in, which was holding (90 ms between keys, 600 ms to resume). D could not say whose frame it was). Original, verbatim:
  // ok(`D${MUTANT_RUN ? ' (FLUX3_MUTANT=1)' : ''} the drawing layer damps while she types: ${t.xDraws} frame(s) drew while T's keys landed (control ${t.cDraws}; allowed control + ${res.T.length}, one in flight per round)`,
  //   t.damp, JSON.stringify(res.T.map((r) => ({ round: r.round, typingFrames: r.typing.n, drew: r.typing.drawFrames, drewAtMsFromFirstKey: r.typing.drawAt, standin: r.standin }))));
  // SUCCESSOR D2: the frames in which THE LAYER'S OWN canvas drew while the keys landed, at most the one in flight per round; every other canvas
  // that drew is named in OTHER below.
```

## Record 3 · from flux3-latency.mjs lines 363-366 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 38a58ca8a9790587f82d971e3140b05db98878f2

```js
    // PARKED 2026-10-31 (SUPERSEDED with D, whose any-canvas count it reused; see D's park above). Original, verbatim:
    // ok(`MUT the no-damping mutant FAILS the probe (caught by L: ${m.lat ? 'no' : 'YES'}; caught by D: ${m.damp ? 'no' : 'YES'}) - M median ${r1(m.X.median)} p95 ${r1(m.X.p95)} max ${r1(m.X.max)}, ${m.xDraws} drawing frame(s) while typing`,
    //   mLanded && !(m.lat && m.damp), `C ${show(m.C)} | M ${show(m.X)}`);
    // SUCCESSOR MUT-b: the mutant fails L or D2.
```
