# Parked records archived from writing-r1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/writing-r1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from writing-r1.mjs lines 79-90 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 84ff95c5f157c1393d2784ed6f7cf194c5e699de

```js
      // ---- PARKED - SUPERSEDED by PR #7 (19a4676: the bullet token no longer reveals), 2026-10-02 ----
      // Kept VERBATIM and no longer run. A click at the mark used to show the hyphen so it could be deleted by hand.
      // Hollow and square store `-+ ` and `-= `, and showing those puts punctuation on the page. The glyph stays; the same
      // style button removes the list, and Backspace after the token removes it whole (item211.mjs TOKENS).
      //
      // // reveal: a real click into the bullet line un-collapses its prefix, and the glyph gives way to the literal hyphen
      // const pt = await app.evalJs(`(() => { const b = document.querySelector('${ED} .md-bullet'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + 2), y: Math.round(r.top + r.height / 2) }; })()`);
      // if (pt) await realClick(app, pt);
      // const rv = await app.evalJs(`(() => { const b = document.querySelector('${ED} .md-bullet'); return b ? { revealed: b.classList.contains('md-revealed'), glyph: getComputedStyle(b, '::before').content, mark: b.querySelector('.md-mark').className } : null; })()`);
      // ok('[Draft] a real click at the START of a bullet line (where its prefix is) reveals its "- " (the writer can reach and delete it), and the glyph steps aside', !!rv && rv.revealed && rv.glyph === 'none' && !/hidden/.test(rv.mark), JSON.stringify(rv));
      // ok('[Draft] the reveal did not touch the stored text', (await stored(app)) === FIX);
      // ----------------------------------------------------------------------
```
