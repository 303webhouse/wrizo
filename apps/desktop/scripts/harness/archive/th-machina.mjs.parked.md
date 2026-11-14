# Parked records archived from th-machina.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/th-machina.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from th-machina.mjs lines 295-299 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 4ebc44d8671dbcf250a7bd2b13ad57b27eb35d9c

```js
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: Machina's default writing face is Source Sans 3). The ORIGINAL waited for, and required, IBM Plex Serif - the prose slot - to be LOADED; the prose slot is Source Sans 3 now, so
  // Plex Serif is still declared (the theme still registers it) but nothing paints in it. Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it must now fail, for exactly that reason).
  // for (let i = 0; i < 40 && !(fnMachina.loaded.includes('IBM Plex Mono') && fnMachina.loaded.includes('IBM Plex Sans') && fnMachina.loaded.includes('IBM Plex Serif')); i += 1) { await sleep(250); fnMachina = await fontState(); }
  // ok('FN2: choosing Machina DECLARES its faces (IBM Plex Mono / Sans / Serif and Atkinson Hyperlegible in document.fonts) and LOADS the three Plex slots the chrome and the prose use, with font requests on the wire', ['IBM Plex Mono', 'IBM Plex Sans', 'IBM Plex Serif', 'Atkinson Hyperlegible'].every((f) => fnMachina.declared.includes(f)) && ['IBM Plex Mono', 'IBM Plex Sans', 'IBM Plex Serif'].every((f) => fnMachina.loaded.includes(f)) && fnMachina.requests > 0, JSON.stringify(fnMachina));
  // ------------------------------------------------------------------
```
