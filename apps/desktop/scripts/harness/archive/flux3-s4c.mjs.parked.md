# Parked records archived from flux3-s4c.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/flux3-s4c.mjs`. The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

Note (INK, Nov 12): this record was parked on Nov 12 by the Wire In branch, not after two deploys, and the original is makeL's control configuration, not an `ok(` call (its `ok` lines come from `scripts/lib/l-method.mjs`). Step 14's `check` will therefore not count it as a qualifying record until it has been green for two deploys; it is placed here, in the archive form, at Fable's word (Nov 12, 7:40 pm).

## Record 1 · from flux3-s4c.mjs lines 113-124 at 8d10bd885b0c99272d2602fdb835a3f32aec4d9e · parked in 1370a28058f9588954578bf09afb12d73ae3ff13

```js
// SUPERSEDED (Nov 12, Wire In on its own): the L control. The control was Flux with the flag OFF and the paper Typewriter ON; flag-off Flux's free-writing mode is Wire In now and the paper Typewriter is retired in Flux, so that open no longer produces a control.
//   // J: Jacked In with the Corridor. C: the control (Flux, flag off, the Typewriter on). On `main` (ONLY_L) the method runs alone: the control against itself, then the +5 / +10 ms mutants.
//   await open({ id, tone: 'dark', flag: jacked, prefs: jacked ? {} : { typewriter: true } });
//   stoodRight: (arm, on, stood) => !!stood && (arm === 'J' && on ? stood.flag && stood.jacked : !stood.flag) && stood.zoom === 'true',
```
