// FLUX V2 - PART 2 (a box turn): the real app. Loaded by flux-v2.mjs; exports part2({ ok, sleepMs }).
// DOM contract the build meets:
//   frame      .mode-page > .flux-readouts.chrome-fade (Flux only) > .flux-frame + .flux-brackets[data-acquire] + .flux-readout-head (> .flux-readout-doc, .flux-readout-trk) + .flux-readout-hint
//   rail       .wz-strip [data-category] items; each draws svg[data-theme-icon] (Flux) - docs / circuits / log / config / skin / trash; the place block draws rack (or log)
//   pop-out    .wz-sections > .wz-sections-place (> .wz-sections-place-name: "RACK ▸ <name>" in Flux)
// Written to PROBE, never assume: a missing node fails its check, it never crashes the run.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function part2({ ok, sleepMs }) {
  process.env.WS_PLACE = '1';
  const { withHarness } = await import('../runtime-verify.mjs');
  const HINT_PROSE = 'TYPE — THE CHROME RECEDES ▪ PASTE MEETS THE FIREWALL';
  const HINT_WIRE = 'FORWARD ONLY — NO WAY BACK ▪ PASTE MEETS THE FIREWALL';
  try {
    await withHarness(async (app) => {
      const sleep = sleepMs;
      const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
      const q = (js) => app.evalJs(js);
      const click = async (sel) => {
        const pt = await q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const h = document.elementFromPoint(x, y); return h && (h === b || b.contains(h)) ? { x, y } : null; })()`);
        if (!pt) return false;
        await app.mouseMove(pt.x, pt.y); await app.mouseDown(pt.x, pt.y); await sleep(50); await app.mouseUp(pt.x, pt.y); await sleep(350);
        return true;
      };
      const fresh = async ({ theme = 'flux', page = 'dark', dial = null } = {}) => {
        await app.emulateDpr(1, 1400, 900);
        await app.goto('/');
        await q(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); ${dial === null ? '' : `localStorage.setItem('wrizo-ambiance-dial', '${dial}');`}`);
        await app.reload();
        await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
        await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
        await sleep(700);
        if (theme === 'flux') await q("window.wrizoTheme && window.wrizoTheme.set('flux')");
        if (page === 'dark' || page === 'light') await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
        await sleep(300);
      };
      // The Ferry: a drawer with two sets; Manuscript holds three pages (so a page has a real DOC number and a TRK n/3)
      const seed = async () => {
        await q(`(() => { const d = window.wrizoCreateDrawer('The Late Ferry');
          const man = window.wrizoCreateProject('Manuscript', 'creative'); const wor = window.wrizoCreateProject('Worldbuilding', 'creative');
          window.wrizoSetProjectDrawer(man.id, d.id); window.wrizoSetProjectDrawer(wor.id, d.id);
          [['fx-m1', man.id, 1], ['fx-m2', man.id, 2], ['fx-m3', man.id, 3], ['fx-w1', wor.id, 4]].forEach(([id, pid, at]) => window.wrizoCreateJournalPage({ id, text: 'Words of ' + id, projectId: pid, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:0' + at + '.000Z' }));
          window.wrizoFlushNow(); })()`);
        await sleep(500);
      };
      const open = async (id) => { await q(`location.hash = '#/page/${id}'`); await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'page ' + id }); await sleep(900); };
      const rect = (sel) => q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, t: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; })()`);
      const txt = (sel) => q(`(document.querySelector(${JSON.stringify(sel)}) || {}).textContent ?? null`);
      const lumOf = (rgb) => { const m = /rgba?\(([^)]+)\)/.exec(rgb || ''); if (!m) return null; const [r, g, b] = m[1].split(',').map((x) => parseFloat(x)).slice(0, 3).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

      // ---- F1: the true readouts on a live Flux page ---------------------------------------------------------------------------------------------------------------------
      await fresh(); await seed(); await open('fx-m2');
      const has = await q("!!document.querySelector('.mode-page .flux-readouts')");
      ok('F1 premise: the Flux page carries the readouts inside the lit page', has, String(has));
      const doc = await txt('.flux-readout-doc'), trk = await txt('.flux-readout-trk');
      ok('F1 DOC nn // title is the page\'s true reading (the second page of the place, "Words of fx-m2")', doc === 'DOC 02 // Words of fx-m2', String(doc));
      ok('F1 TRK n/m is the section\'s real position in its set (2 of the 3 in Manuscript)', trk === 'TRK 2/3', String(trk));
      await open('fx-w1');
      const trkW = await txt('.flux-readout-trk'), docW = await txt('.flux-readout-doc');
      ok('F1 a page in the second set reads TRK 1/1 and DOC 04 (the fourth page of the rack) - the TRK is its set\'s, the DOC its rack\'s', trkW === 'TRK 1/1' && docW === 'DOC 04 // Words of fx-w1', `${docW} | ${trkW}`);
      await open('fx-m2');
      const hintP = await txt('.flux-readout-hint');
      ok('F1 the hint line on a prose page reads the ruled string', hintP === HINT_PROSE, String(hintP));
      await q("[...document.querySelectorAll('.desk-mode-tab')].find((b) => b.textContent === 'Free Write')?.click()");
      await sleep(500);
      const hintW = await txt('.flux-readout-hint');
      ok('F1 the hint line in Wire In (Free Write) reads the ruled string', hintW === HINT_WIRE, String(hintW));
      await q("[...document.querySelectorAll('.desk-mode-tab')].find((b) => b.textContent === 'Draft')?.click()");
      await sleep(400);

      // ---- F2: the readouts are an overlay: the page does not move or resize ---------------------------------------------------------------------------------------------
      const pageA = await rect('.mode-page'), edA = await rect('.forward-only-editor');
      await q("(() => { const r = document.querySelector('.flux-readouts'); if (r) r.style.display = 'none'; })()");
      await sleep(120);
      const pageB = await rect('.mode-page'), edB = await rect('.forward-only-editor');
      await q("(() => { const r = document.querySelector('.flux-readouts'); if (r) r.style.display = ''; })()");
      ok('F2 PAGE IS PRIMARY: with the readouts removed the page and the editor keep exactly the same rects', !!pageA && same(pageA, pageB) && same(edA, edB), JSON.stringify({ pageA, pageB, edA, edB }));

      // ---- F3: the grid and brackets live on the frame ring, never under text -----------------------------------------------------------------------------------------------
      const fr = await q(`(() => { const f = document.querySelector('.flux-frame'); if (!f) return null; const cs = getComputedStyle(f); const pr = document.querySelector('.mode-page').getBoundingClientRect(); const ed = document.querySelector('.forward-only-editor').getBoundingClientRect();
        const ring = parseFloat(cs.paddingLeft) || 0; return { pe: cs.pointerEvents, mask: (cs.maskImage || cs.webkitMaskImage || 'none') !== 'none', ring,
          editorInside: ed.left >= pr.left + ring - 0.5 && ed.right <= pr.right - ring + 0.5 && ed.top >= pr.top + ring - 0.5 && ed.bottom <= pr.bottom - ring + 0.5 }; })()`);
      ok('F3 the frame ring is masked, click-through, and the editor\'s text box sits wholly inside the ring\'s clear middle (the grid is never under text)', !!fr && fr.pe === 'none' && fr.mask && fr.ring > 0 && fr.editorInside, JSON.stringify(fr));
      const hit = await q(`(() => { const ed = document.querySelector('.forward-only-editor'); const r = ed.getBoundingClientRect(); const els = document.elementsFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + 20)); return els.some((e) => e.closest('.flux-readouts')); })()`);
      ok('F3 no readout element is stacked at a point inside the writing area', hit === false, String(hit));

      // ---- F4: the acquire: once per page open, 300 ms; still under reduced motion and at Ambiance 0 ------------------------------------------------------------------------
      await open('fx-m1');
      const acq = await q(`(() => { const b = document.querySelector('.flux-brackets'); if (!b) return null; const cs = getComputedStyle(b); return { attr: b.dataset.acquire, name: cs.animationName, dur: cs.animationDuration }; })()`);
      ok('F4 opening a page closes the brackets in: data-acquire=true, flux-acquire, 0.3s', !!acq && acq.attr === 'true' && /flux-acquire/.test(acq.name) && acq.dur === '0.3s', JSON.stringify(acq));
      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await sleep(200);
      await open('fx-m3');
      const still = await q(`(() => { const b = document.querySelector('.flux-brackets'); if (!b) return null; const cs = getComputedStyle(b); return { attr: b.dataset.acquire, name: cs.animationName, visible: cs.opacity !== '0' }; })()`);
      ok('F4 under reduced motion the brackets are STILL: no acquire, no animation, drawn', !!still && still.attr === 'false' && still.name === 'none' && still.visible, JSON.stringify(still));
      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
      await fresh({ dial: 0 }); await seed(); await open('fx-m1');
      const dial0 = await q(`(() => { const b = document.querySelector('.flux-brackets'); return b ? { attr: b.dataset.acquire, name: getComputedStyle(b).animationName } : null; })()`);
      ok('F4 at Ambiance 0 the brackets are still: no acquire', !!dial0 && dial0.attr === 'false', JSON.stringify(dial0));

      // ---- F5: the recede takes the readouts with the rest of the chrome ----------------------------------------------------------------------------------------------------------
      await fresh(); await seed(); await open('fx-m2');
      await click('.forward-only-editor');
      await app.typeKeys('word ');
      await waitSoft("document.querySelector('[data-chrome-receded]')?.getAttribute('data-chrome-receded') === 'true'", { label: 'chrome receded', timeout: 8000 });
      await sleep(900);
      const rec = await q("(() => { const r = document.querySelector('.flux-readouts'); const rail = document.querySelector('.wz-strip'); return { readouts: r ? parseFloat(getComputedStyle(r).opacity) : null, rail: rail ? parseFloat(getComputedStyle(rail).opacity) : null }; })()");
      ok('F5 while typing the chrome recedes AND the readouts go with it (their opacity falls to match the rail\'s, near 0)', rec.readouts !== null && rec.readouts <= 0.15, JSON.stringify(rec));

      // ---- F6: orange is scarce: a computed-style scan of the Flux page with the rail open ---------------------------------------------------------------------------------------
      await fresh(); await seed(); await open('fx-m2');
      await click('[data-category="page"]');
      const scan = await q(`(() => { const O = /rgba?\\(\\s*255,\\s*152,\\s*0/; const bad = [];
        const allowed = (e) => e.closest('.flux-block-caret, .mode-pfill, .mode-pfill-sparks, [data-uplink], [data-flux-mark], .wz-logo, .wz-mark, .splash-mark') || (e.getAttribute && e.getAttribute('aria-current'));
        for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); const vals = [cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderLeftColor, cs.outlineColor, cs.boxShadow, cs.caretColor, cs.fill, cs.stroke];
          if (vals.some((v) => v && O.test(v)) && !allowed(e)) bad.push((e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.')).slice(0, 60)); }
        return bad.slice(0, 12); })()`);
      ok('F6 no element outside the allowed places paints in orange (caret, sprint surge, Uplink, the mark, the current item\'s left bar)', Array.isArray(scan) && scan.length === 0, JSON.stringify(scan));
      const cur = await q("(() => { const b = document.querySelector('.wz-section-open[aria-current=\"page\"]'); return b ? getComputedStyle(b).boxShadow : null; })()");
      ok('F6 the current list item wears the thin orange LEFT bar (and only that)', typeof cur === 'string' && /rgb\(255, 152, 0\)\s+2px 0px 0px 0px inset|inset/.test(cur) && /255, 152, 0/.test(cur), String(cur));
      const sel = await q("(() => { const b = document.querySelector('.wz-strip-item.active'); if (!b) return null; const cs = getComputedStyle(b); return [cs.color, cs.borderLeftColor, cs.backgroundColor].join(' | '); })()");
      ok('F6 the selected rail item is cyan, not orange', typeof sel === 'string' && !/255, 152, 0/.test(sel), String(sel));

      // ---- F7: the rail and place block draw the pixel icons (16 px, 44 px targets) -------------------------------------------------------------------------------------------
      const icons = await q(`(() => { const out = {}; for (const [cat, id] of [['page','docs'],['plan','circuits'],['journal','log'],['settings','config'],['theme','skin'],['trash','trash']]) { const b = document.querySelector('.wz-strip [data-category="' + cat + '"]'); const s = b && b.querySelector('svg[data-theme-icon]'); const r = b ? b.getBoundingClientRect() : null; const sr = s ? s.getBoundingClientRect() : null;
        out[cat] = { id: s ? s.getAttribute('data-theme-icon') : null, want: id, icon: sr ? [Math.round(sr.width), Math.round(sr.height)] : null, target: r ? Math.round(Math.min(r.width, r.height)) : null }; }
        const pb = document.querySelector('.wz-place-block svg[data-theme-icon]'); out.place = pb ? pb.getAttribute('data-theme-icon') : null; return out; })()`);
      const iconBad = Object.entries(icons).filter(([k, v]) => k !== 'place' && (!v || v.id !== v.want || !v.icon || v.icon[0] !== 16 || v.icon[1] !== 16)).map(([k]) => k);
      ok('F7 every rail item draws its Flux icon (docs, circuits, log, config, skin, trash) at 16 x 16', iconBad.length === 0, JSON.stringify(icons));
      const small = Object.entries(icons).filter(([k, v]) => k !== 'place' && v && v.target !== null && v.target < 44).map(([k, v]) => `${k}:${v.target}`);
      ok('F7 each rail item is at least a 44 px target', small.length === 0 && Object.keys(icons).length > 1, small.join(' '));
      ok('F7 the place block draws the rack icon', icons.place === 'rack', String(icons.place));

      // ---- F8: the words and Root: render-time only --------------------------------------------------------------------------------------------------------------------------
      const labels = await q("[...document.querySelectorAll('.wz-strip [data-category] .wz-strip-label')].map((e) => e.textContent.trim())");
      ok('F8 the rail reads the Flux words: Docs, Circuits, Log, Config, Skin, Trash', ['Docs', 'Circuits', 'Log', 'Config', 'Skin', 'Trash'].every((w) => (labels || []).includes(w)), JSON.stringify(labels));
      const head = await txt('.wz-sections-place-name');
      ok('F8 the Docs pop-out header reads RACK ▸ <the rack\'s name>', head === 'RACK ▸ The Late Ferry', String(head));
      const trackHd = await txt('.wz-sections-heading');
      ok('F8 the list heading reads Tracks', trackHd === 'Tracks', String(trackHd));
      await fresh();
      const rootName = await q("(() => { const e = document.querySelector('.wz-place-block .wz-place-name'); return e ? e.textContent : null; })()");
      const stored = await q("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]').find((d) => /^top-drawer-/.test(d.id)) || {}).name ?? null");
      ok('F8 a fresh account\'s top drawer is shown as Root while its stored name is still "Top Drawer" (render-time only: nothing was renamed)', rootName === 'Root' && stored === 'Top Drawer', `${rootName} / stored ${stored}`);

      // ---- F9: light mode: page light, chrome dark; the readouts follow the page ---------------------------------------------------------------------------------------------
      await fresh({ page: 'light' }); await seed(); await open('fx-m2');
      const lm = await q("(() => { const pg = document.querySelector('.mode-page'); const rl = document.querySelector('.wz-strip'); const ro = document.querySelector('.flux-readout-doc'); return { page: pg ? getComputedStyle(pg).backgroundColor : null, rail: rl ? getComputedStyle(rl).backgroundColor : null, readout: ro ? getComputedStyle(ro).color : null }; })()");
      const lp = lumOf(lm.page), lr = lumOf(lm.rail), lro = lumOf(lm.readout);
      ok('F9 in light mode the page is light and the chrome stays dark', lp !== null && lp > 0.7 && (lr === null || lr < 0.1), JSON.stringify(lm));
      const cr = lp !== null && lro !== null ? (Math.max(lp, lro) + 0.05) / (Math.min(lp, lro) + 0.05) : 0;
      ok(`F9 the light page's readout text reads at >= 4.5:1 against the page (measured ${cr.toFixed(2)}:1)`, cr >= 4.5, cr.toFixed(2));

      // ---- F10: Arbor is untouched ---------------------------------------------------------------------------------------------------------------------------------------------
      await fresh({ theme: 'plateau', page: null }); await seed(); await open('fx-m2');
      const arbor = await q("({ readouts: !!document.querySelector('.flux-readouts'), icons: document.querySelectorAll('.wz-strip svg[data-theme-icon]').length, labels: [...document.querySelectorAll('.wz-strip [data-category] .wz-strip-label')].map((e) => e.textContent.trim()) })");
      ok('F10 Arbor: no Flux readouts, no seam icons, and the old words (Pages, Boards, Journal, Settings, Themes)', !arbor.readouts && arbor.icons === 0 && ['Pages', 'Boards', 'Journal', 'Settings'].every((w) => arbor.labels.includes(w)), JSON.stringify(arbor));
    });
  } catch (err) {
    ok('PART 2 ran to the end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | '));
  }
}
