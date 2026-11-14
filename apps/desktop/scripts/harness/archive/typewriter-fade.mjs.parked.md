# Parked records archived from typewriter-fade.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/typewriter-fade.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from typewriter-fade.mjs lines 134-157 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in cf2e9d250debbf90e8196ccb5afd1601e3f557d6

```js
  // ---- PARKED - SUPERSEDED by page-size (Fable + Nick, Oct 23; Cursor's final mockup @ e3c4e462): Typewriter is now the ZOOM, and its fade is ONE
  // band mask on the page COLUMN (.mode-pagecol[data-zoom]) anchored at the writing line - the top-of-box mask on .mode-scroll these five read stands
  // down while zoomed. On the page-size build two went red and three passed BLIND (no mask -> every line alpha 1 -> "no inversion" held vacuously).
  // All five are kept VERBATIM and no longer run; records in this file's parked section; successors (the same five claims, read from the band) follow.
  //
  // ok('(premise) the page is a typewriter page whose history has scrolled, with a fade mask and several lines on screen',
  //   !!m && !m.missing && m.typewriter === 'true' && m.scrolled === 'true' && (m.stops || []).length >= 2 && lines.length >= 6, JSON.stringify({ typewriter: m && m.typewriter, scrolled: m && m.scrolled, stops: m && m.stops, lines: lines.length }));
  // // THE PREMISE THAT MAKES THE ORDER MEASURABLE (Fable, 2026-10-12): at least 3 lines inside the fade band, and the oldest line in
  // // the box's first line (where FX5's lead-in lived). Without it the checks below pass or fail on nothing.
  // const pxOf = (v) => parseFloat(String(v || '').trim()) || 0;
  // const bandEnd = m && m.geo ? pxOf(m.geo.fadeStart) + pxOf(m.geo.fadeBand) : 0;
  // const fadeStart = m && m.geo ? pxOf(m.geo.fadeStart) : 0;
  // const inBand = lines.filter((l) => l.y >= -((m && m.geo && m.geo.lineHeight) || 28) / 2 && l.y <= bandEnd);
  // ok('(premise) the fade band is FULL: at least 3 lines sit inside it, and the oldest visible line sits in the box\'s first line (y < --tw-fade-start)',
  //   bandEnd > 0 && inBand.length >= 3 && lines.length > 0 && lines[0].y < fadeStart,
  //   JSON.stringify({ bandEnd, fadeStart, inBand: inBand.length, top: lines[0] || null, aligned }));
  // ok('THE ORDER: going down the page no line is fainter than the older line above it (Nick: "a newer line dims while the older one above it stays dark")',
  //   lines.length >= 6 && inversions.length === 0, JSON.stringify({ inversions: inversions.slice(0, 4), lines: lines.slice(0, 8) }));
  // const minAlpha = lines.length ? Math.min(...lines.map((l) => l.alpha)) : null;
  // ok('THE OLDEST IS THE FAINTEST: the topmost visible line carries the lowest strength of all, and it is genuinely faded (< 0.5)',
  //   lines.length >= 6 && lines[0].alpha === minAlpha && lines[0].alpha < 0.5, JSON.stringify({ top: lines[0], minAlpha, geo: m && m.geo }));
  // ok('THE NEWEST IS WHOLE: the last visible line (where the writer is) is fully shown',
  //   lines.length >= 6 && lines[lines.length - 1].alpha >= 0.99, JSON.stringify(lines[lines.length - 1]));
  // ------------------------------------------------------------------
```
