// #142 (Nick, Nov 26, 11:17 pm, via Fable: "A pop-out from the left rail (the theme picker, Docs, the others) never covers the page surface, margins included: it
// uses the room beside the page, and the page yields from that side as for the Front menu"). THE REAL APP in each theme's own look, a Draft page,
// 1280x800 (where the two layers cannot both stand), 1366x768, 1536x864 and 1920x1080. Every button on the rail is pressed; what comes out is read once it has come to rest.
//   C  no pop-out (nor its second layer) covers the page: each ends at or before the page's left edge
//   W  each is at least 200 px wide
//   L  the page's lines are not re-laid: its layout width is as at rest
//   Z  closed again, the page stands where it stood
//   K  typing with a pop-out open does not move or resize the page
//   E  where the second layer stands alone (no room for both), Escape brings the first back
// Not read here: the zoomed page (Free Write / Wire In), which waits with #138's Q1.
// Run: node scripts/harness/page-142.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const THEMES = ['plateau', 'flux', 'machina'];
const SIZES = [[1280, 800], [1366, 768], [1536, 864], [1920, 1080]];

const PROBE = `(() => {
  const box = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n * 10) / 10); };
  const seen = (e) => { const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.01 && b.width > 20 && b.height > 20; };
  const page = document.querySelector('.desk-frame-stage .mode-page');
  return { page: page ? box(page) : null, laid: page ? page.offsetWidth : 0,
    layers: [...document.querySelectorAll('.wz-cascade-panel:not([data-visible="false"]):not([data-leaving]), .wz-cascade-survey')].filter(seen).map((e) => ({ kind: e.classList.contains('wz-cascade-survey') ? 'second' : (e.getAttribute('data-category') || 'panel'), box: box(e) })),
    hash: location.hash, words: (document.querySelector('.forward-only-editor')?.textContent || '') };
})()`;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  const pressAt = async (js) => { const p = await ev(`(() => { const b = ${js}; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); await sleep(1200); return true; };
  const HANDLES = "[...document.querySelectorAll('.desk-frame-strip button.wz-strip-item')].map((b) => b.dataset.category ? '[data-category=' + b.dataset.category + ']' : b.hasAttribute('data-reorg-where') ? '[data-reorg-where]' : '')";
  const BUTTON = (handle) => `document.querySelector('.desk-frame-strip button${handle}')`;
  const ESC = "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))";
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await ev(`window.wrizoCreateJournalPage(${J({ id: 'p142', text: 'The lamp burned low over the harbour.', createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-p142', 'drafting'); window.wrizoFlushNow()`);
  const open = async () => {
    await ev("location.hash = '#/'"); await sleep(300);
    await ev("location.hash = '#/page/p142'");
    await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 15000 });
    await app.mouseMove(700, 20);
    await sleep(1500);
  };

  for (const theme of THEMES) {
    await ev("location.hash = '#/'");
    await ev(`localStorage.setItem('wrizo-theme', '${theme}')`);
    await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    for (const [w, h] of SIZES) {
      const at = `${theme} ${w}x${h}`;
      await app.emulateDpr(1, w, h);
      await open();
      const handles = await ev(HANDLES);
      const covered = [], narrow = [], relaid = [], notBack = [], outs = [], noWayBack = [];
      let second = 0, alone = 0;
      for (const [i, handle] of handles.entries()) {
        const rest = await S();
        if (!await pressAt(BUTTON(handle))) continue;
        let s = await S();
        if (s.hash !== rest.hash) { await open(); continue; }   // a rail button that goes somewhere is not a pop-out
        if (!s.layers.length) continue;
        const read = async (label) => {
          s = await S();
          outs.push(label);
          for (const l of s.layers) {
            if (l.box[2] > s.page[0] + 0.5) covered.push({ out: label, layer: l.kind, ends: l.box[2], pageLeft: s.page[0] });
            if (l.box[2] - l.box[0] < 199.5) narrow.push({ out: label, layer: l.kind, width: l.box[2] - l.box[0] });
          }
          if (s.laid !== rest.laid) relaid.push({ out: label, laid: [rest.laid, s.laid] });
        };
        const label = `${i}:${s.layers[0].kind}`;
        await read(label);
        // the second layer, where a pop-out offers one
        if (await pressAt("document.querySelector('.wz-cascade-panel .wz-cascade-link')")) {
          const t = await S();
          if (t.hash === rest.hash && t.layers.some((l) => l.kind === 'second')) {
            second += 1; await read(`${label}>second`);
            if (s.layers.every((l) => l.kind === 'second')) { alone += 1; await ev(ESC); await sleep(1200); const back = await S(); if (!(back.layers.length === 1 && back.layers[0].kind !== 'second')) noWayBack.push({ out: label, layers: back.layers.map((l) => l.kind) }); }
          }
          if (t.hash !== rest.hash) { await open(); continue; }
        }
        await pressAt(BUTTON(handle));
        if ((await S()).layers.length) await pressAt(BUTTON(handle));
        await app.mouseMove(700, 20); await sleep(900);
        const after = await S();
        if (after.layers.length || J(after.page) !== J(rest.page)) notBack.push({ out: label, page: [rest.page, after.page], still: after.layers.map((l) => l.kind) });
      }
      ok(`${at} (premise): every rail button has a handle, and the pop-outs opened (${outs.length}, ${second} with a second layer, ${alone} of those alone)`, handles.every(Boolean) && new Set(handles).size === handles.length && outs.length >= 5, { handles, outs });
      ok(`${at} E: where the second layer stands alone, Escape brings the first back`, noWayBack.length === 0 && (w !== 1280 || second === 0 || alone >= 1), { second, alone, noWayBack });
      ok(`${at} C: no pop-out covers the page`, covered.length === 0, covered.slice(0, 6));
      ok(`${at} W: each is at least 200 px wide`, narrow.length === 0, narrow.slice(0, 4));
      ok(`${at} L: the page's lines are not re-laid`, relaid.length === 0, relaid.slice(0, 4));
      ok(`${at} Z: closed again, the page stands where it stood`, notBack.length === 0, notBack.slice(0, 3));
      if (w === 1366) {
        await open();
        await pressAt(BUTTON(handles[1]));
        const before = await S();
        await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()");
        await app.typeKeys(' and on');
        await sleep(900);
        const typed = await S();
        ok(`${at} K: typing with a pop-out open does not move or resize the page`, before.layers.length > 0 && typed.words !== before.words && J(typed.page) === J(before.page), { page: [before.page, typed.page] });
      }
    }
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-142 VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
