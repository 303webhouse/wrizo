# Parked records archived from blank-page-click.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/blank-page-click.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from blank-page-click.mjs lines 130-133 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 956613114277a3c062d834546c3f48d6521f7e21

```js
    // ---- PARKED - SUPERSEDED (the lane on 28c3d619): the words LANDED on the Screenplay ("HELLO PAPER", focus true) - this expected the typed case
    // on a scene heading. Kept VERBATIM and no longer run; the successor reads a Screenplay heading case-insensitively, prose exactly as before.
    // ok(`${m.name} B: a press on the EMPTY PAPER of a blank page, then typing - the words land on the page`,
    //   focus && !!row && /Hello paper/.test(row.text || ''), JSON.stringify({ focus, stored: row && row.text, p }));
```

## Record 2 · from blank-page-click.mjs lines 271-290 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 956613114277a3c062d834546c3f48d6521f7e21

```js
  // ---- PARKED - SUPERSEDED (the lane on 28c3d619: M SURVIVED - the press reached the editor with the flex column gone, because ModeStage's
  // scroller hands every press on the paper to the editor). The flex column is removed; M is kept VERBATIM below and no longer run. Its successor,
  // M2, removes what really makes the prose half work: the scroller's click.
  // const mm = MODES[1];
  // await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId(mm, 'blank'))}, { text: '' })`);
  // await app.evalJs('window.wrizoFlushNow()');
  // await sleep(300);
  // if (await openPage(app, mm, 'blank')) {
  //   await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'bpc-mutant'; s.textContent = '.wz-ink-sheet{ display:block !important; }'; document.head.appendChild(s); return true; })()");
  //   await sleep(300);
  //   const landed = await app.evalJs("(() => { const s = document.querySelector('.wz-ink-sheet'); return !!s && getComputedStyle(s).display === 'block'; })()");
  //   const p = await pressPoint(app, false);
  //   let reached = null;
  //   if (p && p.y > p.lineBottom + 10) { await click(app, p.x, p.y); await sleep(300); reached = await focusedIn(app, false); }
  //   ok('M (mutant): with the sheet\'s flex column taken away (the injected style LANDED: display block), a press on the blank paper no longer reaches the editor - the check depends on the fix',
  //     landed === true && reached === false, JSON.stringify({ landed, reached, p }));
  //   await app.evalJs("document.getElementById('bpc-mutant')?.remove()");
  // } else ok('M fixture: the Draft blank page reopened', false, '');
  // ---- M2: the scroller's click swallowed before the app sees it (a document capture listener on clicks inside .mode-scroll but outside the
  // editor; it COUNTS them, so its landing is asserted) - the Draft blank-page press must then no longer reach the editor
```
