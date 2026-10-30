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
      await q("[...document.querySelectorAll('.desk-mode-tab')].find((b) => b.textContent === 'Wire In')?.click()");
      await sleep(500);
      const hintW = await txt('.flux-readout-hint');
      ok('F1 the hint line in Wire In (Free Write) reads the ruled string', hintW === HINT_WIRE, String(hintW));
      await q("[...document.querySelectorAll('.desk-mode-tab')].find((b) => b.textContent === 'Text')?.click()");
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
      // EFFECTIVE opacity: an element's own computed opacity says nothing about a fade that lives on an ancestor (the rail's track dissolves, the strip inside it reads 1). Multiply up the chain.
      const effOpacity = "(sel) => { let e = document.querySelector(sel); if (!e) return null; let o = 1; while (e && e !== document.documentElement) { o *= parseFloat(getComputedStyle(e).opacity); e = e.parentElement; } return Math.round(o * 1000) / 1000; }";
      let rec = null;
      for (let i = 0; i < 24; i += 1) {   // the recede is a slow transition: poll up to ~6 s for it to settle
        rec = await q(`(() => { const eff = ${effOpacity}; return { readouts: eff('.flux-readouts'), rail: eff('.wz-strip') }; })()`);
        if (rec.readouts !== null && rec.rail !== null && rec.readouts <= 0.1 && rec.rail <= 0.2) break;
        await sleep(250);
      }
      ok('F5 while typing the chrome recedes AND the readouts go with it: the EFFECTIVE opacity of the rail and of the readouts both fall near 0 (all chrome fades together)', rec.readouts !== null && rec.rail !== null && rec.readouts <= 0.1 && rec.rail <= 0.2, JSON.stringify(rec));

      // ---- F6: orange is scarce: a computed-style scan of the Flux page with the rail open ---------------------------------------------------------------------------------------
      await fresh(); await seed(); await open('fx-m2');
      await click('[data-category="page"]');
      const scan = await q(`(() => { const O = /rgba?\\(\\s*255,\\s*152,\\s*0/; const bad = [];
        /* .brand-mark is SANCTIONED orange: the brief names the caret, the sprint surge, Uplink, the mark and the left bar (Fable, ledger 129) */
        const allowed = (e) => e.closest('.flux-block-caret, .mode-pfill, .mode-pfill-sparks, [data-uplink], [data-flux-mark], .wz-logo, .wz-mark, .splash-mark, .brand-mark') || (e.getAttribute && e.getAttribute('aria-current'));
        for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); const vals = [cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderLeftColor, cs.outlineColor, cs.boxShadow, cs.caretColor, cs.fill, cs.stroke];
          if (vals.some((v) => v && O.test(v)) && !allowed(e)) bad.push((e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.')).slice(0, 60)); }
        return bad.slice(0, 12); })()`);
      ok('F6 no element outside the allowed places paints in orange (caret, sprint surge, Uplink, the mark, the current item\'s left bar)', Array.isArray(scan) && scan.length === 0, JSON.stringify(scan));
      const cur = await q("(() => { const b = document.querySelector('.wz-section-open[aria-current=\"page\"]'); return b ? getComputedStyle(b).boxShadow : null; })()");
      ok('F6 the current list item wears the thin orange LEFT bar (and only that)', typeof cur === 'string' && /rgb\(255, 152, 0\)\s+2px 0px 0px 0px inset|inset/.test(cur) && /255, 152, 0/.test(cur), String(cur));
      const sel = await q("(() => { const b = document.querySelector('.wz-strip [data-category].active'); if (!b) return null; const cs = getComputedStyle(b); return [cs.color, cs.borderLeftColor, cs.backgroundColor].join(' | '); })()");
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
      // The default drawer is flagged by its born-with id (top-drawer-<uid>, deterministic); it reads Root until the writer renames it. The rail only shows a place on a page, so a page is filed in the top drawer's own set first.
      await fresh();
      const topIds = await q("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]').find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((x) => d && x.drawerId === d.id); return d && p ? { drawer: d.id, set: p.id, name: d.name } : null; })()");
      ok('F8 premise: a fresh account was given its top drawer and its one set (the default flag is its id)', !!topIds, JSON.stringify(topIds));
      if (topIds) {
        await q(`window.wrizoCreateJournalPage({ id: 'fx-root', text: 'Words of fx-root', projectId: ${JSON.stringify(topIds.set)}, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' }); window.wrizoFlushNow()`);
        await sleep(400); await open('fx-root');
        const placeName = () => q("(() => { const e = document.querySelector('.wz-place-block .wz-place-name'); return e ? e.textContent : null; })()");
        const storedName = () => q("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]').find((d) => /^top-drawer-/.test(d.id)) || {}).name ?? null");
        const rootName = await placeName();
        ok('F8 the default (flagged) top drawer is shown as Root, render-time only: its stored name is untouched', rootName === 'RACK ▸ Root' && (await storedName()) === 'Top Drawer', `${rootName} / stored ${await storedName()}`);
        await q(`window.wrizoRenameDrawer(${JSON.stringify(topIds.drawer)}, 'My Novel'); window.wrizoFlushNow()`);
        await sleep(700);
        const renamed = await placeName();
        ok('F8 a top drawer the writer RENAMED keeps its own name (not Root)', renamed === 'RACK ▸ My Novel' && (await storedName()) === 'My Novel', `${renamed} / stored ${await storedName()}`);
        await q(`window.wrizoRenameDrawer(${JSON.stringify(topIds.drawer)}, 'Top Drawer'); window.wrizoFlushNow()`);
      }

      // ---- F11: no Arbor brown in any Flux input (the Ask box, Add Note, search fields) - dark page AND light --------------------------------------------------------------------------
      const warmScan = `(() => { const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
        const out = []; for (const e of document.querySelectorAll('input, textarea, select')) { if (!vis(e)) continue; const m = /rgba?\\(([^)]+)\\)/.exec(getComputedStyle(e).backgroundColor); if (!m) continue; const p = m[1].split(',').map((x) => parseFloat(x)); const a = p.length > 3 ? p[3] : 1;
          if (a > 0.3 && p[0] - p[2] >= 6 && p[0] >= p[1]) out.push({ cls: String(e.className).slice(0, 40), bg: getComputedStyle(e).backgroundColor }); }
        return { warm: out, ask: !!document.querySelector('.wz-tutor-convo-input'), note: !!document.querySelector('.wz-tutor-bible-input'), total: document.querySelectorAll('input, textarea, select').length }; })()`;
      for (const pg of ['dark', 'light']) {
        await fresh({ page: pg }); await seed(); await open('fx-m2');
        await q("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900);
        const w = await q(warmScan);
        ok(`F11 [${pg}] the Tutor drawer's Ask box${w.note ? ' and Add Note are' : ' is'} Flux glass: NO input, textarea or select paints an Arbor brown (checked ${w.total} fields)`, !!w && w.ask && w.warm.length === 0, JSON.stringify(w));
      }

      // ---- F12: no Arbor mark in Flux: the PNG watermark is off and Flux's own WRIZO mark (orange) sits top left ---------------------------------------------------------------------------
      await fresh(); await seed(); await open('fx-m2');
      const mk = await q(`(() => { const m = document.querySelector('.brand-mark'); if (!m) return null; const cs = getComputedStyle(m); const r = m.getBoundingClientRect();
        const bad = [...document.querySelectorAll('body *')].filter((e) => { const c = getComputedStyle(e); return /wrizo-logo|wrizo-sketch/.test(c.maskImage + c.webkitMaskImage + c.backgroundImage) || (e.tagName === 'IMG' && /wrizo-logo|wrizo-sketch/.test(e.getAttribute('src') || '') && e.getBoundingClientRect().width > 0); }).map((e) => e.className || e.tagName).slice(0, 4);
        return { word: getComputedStyle(m, '::before').content, color: cs.color, mask: cs.webkitMaskImage || cs.maskImage, top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, bad }; })()`);
      ok('F12 Flux shows its own WRIZO mark (orange, top left, text) and no element paints Arbor\'s wrizo PNG', !!mk && /WRIZO/.test(mk.word) && mk.color === 'rgb(255, 152, 0)' && (mk.mask === 'none' || mk.mask === '') && mk.top < 60 && mk.left < 160 && mk.right < mk.vw / 2 && mk.bad.length === 0, JSON.stringify(mk));

      // ---- F13: a board card is a dark-glass node with a cyan edge and a cyan uppercase title, inside a framed board ---------------------------------------------------------------------------
      await q(`(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]').find((x) => x.name === 'The Late Ferry'); const p = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').find((x) => d && x.drawerId === d.id);
        window.wrizoCreateJournalPage({ id: 'fx-board', text: 'Chapter map', pageType: 'board', projectId: p ? p.id : null, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:05.000Z',
          boxes: [{ id: 'fxb1', kind: 'text', x: 0.05, y: 0.05, w: 0.22, h: 0.12, z: 1, text: 'Mara at the window' }, { id: 'fxb2', kind: 'text', x: 0.4, y: 0.05, w: 0.22, h: 0.12, z: 2, text: 'The blue cup' }] }); window.wrizoFlushNow(); })()`);
      await sleep(500);
      await q("location.hash = '#/page/fx-board'");
      const boardUp = await waitSoft("!!document.querySelector('.board-canvas .board-text')", { label: 'board cards', timeout: 9000 }); await sleep(800);
      const nd = boardUp ? await q(`(() => { const c = document.querySelector('.board-canvas .board-text'); const cs = getComputedStyle(c); const fl = getComputedStyle(c, '::first-line'); const f = document.querySelector('.flux-board-frame');
        const m = /rgba?\\(([^)]+)\\)/.exec(cs.backgroundColor); const p = m ? m[1].split(',').map((x) => parseFloat(x)) : [255, 255, 255];
        return { bg: cs.backgroundColor, lum: (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255, border: cs.borderTopColor, color: cs.color, titleColor: fl.color, titleCase: fl.textTransform, titleLetterSpacing: fl.letterSpacing,
          frame: !!f, grid: !!(f && f.querySelector('.flux-frame')), brackets: !!(f && f.querySelector('.flux-brackets')), frameClick: f ? getComputedStyle(f).pointerEvents : null }; })()`) : null;
      // ---- PARKED - SUPERSEDED by polish #10 item 12 (INK, Nick accepted it via Fable, Oct 29): a Flux card marks its first line by COLOUR ONLY - the capitals + letter-spacing + chrome font made the line wider, it wrapped, and the auto-grow made the Flux card taller than the Arbor one. F13 is kept VERBATIM below and no longer run; successor next.
      //
      // ok('F13 a board card is a dark-glass node: dark fill (not Arbor cream), a thin cyan edge, light ink, and a cyan UPPERCASE first line', !!nd && nd.lum < 0.15 && /0,\s*194,\s*255/.test(nd.border) && nd.titleColor === 'rgb(87, 208, 245)' && nd.titleCase === 'uppercase', JSON.stringify(nd));
      ok('F13 [item-12 successor] a board card is a dark-glass node: dark fill (not Arbor cream), a thin cyan edge, light ink, and a cyan first line set by colour only (no capitals)', !!nd && nd.lum < 0.15 && /0,\s*194,\s*255/.test(nd.border) && nd.titleColor === 'rgb(87, 208, 245)' && nd.titleCase === 'none' && nd.titleLetterSpacing === 'normal', JSON.stringify(nd));
      ok('F13 the board wears the frame: the grid ring and the corner brackets, click-through', !!nd && nd.frame && nd.grid && nd.brackets && nd.frameClick === 'none', JSON.stringify(nd));

      // ---- F18: the Inputs work on the board: the knob wears the INPUT glyph (through ThemeIcon), a node shows its true X / Y, the board shows its one hint, the Inputs panel is Flux glass --------------------
      await click('.board-canvas .board-text');
      const knobUp = await waitSoft("!!document.querySelector('.board-graft-knob')", { label: 'graft knob', timeout: 5000 });
      const kn = knobUp ? await q(`(() => { const k = document.querySelector('.board-graft-knob'); const g = k.querySelector('svg[data-theme-icon="input"]'); const r = g ? g.getBoundingClientRect() : null; const cs = getComputedStyle(k);
        return { glyph: !!g, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, box: Math.round(k.getBoundingClientRect().width), border: cs.borderTopColor, color: cs.color }; })()`) : null;
      ok('F18 the selected card\'s knob wears the INPUT glyph (16 x 16 in a 22 px knob, through ThemeIcon) in the choice colour on a square glass knob', !!kn && kn.glyph && kn.w === 16 && kn.h === 16 && kn.box >= 20 && kn.border === 'rgb(0, 194, 255)' && kn.color === 'rgb(0, 194, 255)', JSON.stringify(kn));
      const hdl = await q("(() => { const h = document.querySelector('.board-canvas .board-handle'); return h ? getComputedStyle(h).backgroundColor : null; })()");
      ok('F18 the selected card\'s resize / connect corner is the choice colour (cyan), not brass', hdl === 'rgb(0, 194, 255)', String(hdl));
      const bx = await q(`(() => { const c = document.querySelector('.board-canvas .flux-card-coord'); const hint = document.querySelector('.flux-board-frame .flux-readout-hint'); return { coord: c ? c.textContent : null, hint: hint ? hint.textContent : null }; })()`);
      ok('F18 a node shows its true position (the first card, stored at x .05 / y .05, reads X 050 · Y 050) and the board shows its one hint', !!bx && bx.coord === 'X 050 · Y 050' && bx.hint === 'DRAG A NODE ▪ DRAG ITS INPUT TO CONNECT', JSON.stringify(bx));
      await q("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900);
      await q("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(600);
      const ip = await q(`(() => { const a = document.querySelector('.wz-graft-add'); if (!a) return null; const cs = getComputedStyle(a); const m = /rgba?\\(([^)]+)\\)/.exec(cs.backgroundColor); const p = m ? m[1].split(',').map((x) => parseFloat(x)) : [0, 0, 0]; return { text: a.textContent.trim(), bg: cs.backgroundColor, warm: p[0] - p[2] >= 6 && p[0] >= p[1], border: cs.borderTopColor }; })()`);
      ok('F18 the Inputs panel\'s add control reads "+ Input…" on Flux glass (no Arbor brown)', !!ip && /Input…/.test(ip.text) && ip.warm === false, JSON.stringify(ip));

      // ---- F14: the rail's place block reads RACK ▸ <name> and WRAPS - never truncated -----------------------------------------------------------------------------------------------------
      await open('fx-m2');
      const pbk = await q(`(() => { const e = document.querySelector('.wz-place-block .wz-place-name'); if (!e) return null; const cs = getComputedStyle(e); return { text: e.textContent, ws: cs.whiteSpace, overflow: cs.textOverflow, clipped: e.scrollWidth > e.clientWidth + 1, h: Math.round(e.getBoundingClientRect().height) }; })()`);
      ok('F14 the place block reads "RACK ▸ The Late Ferry", wraps (white-space normal, no ellipsis) and nothing is clipped', !!pbk && pbk.text === 'RACK ▸ The Late Ferry' && pbk.ws === 'normal' && pbk.overflow !== 'ellipsis' && !pbk.clipped, JSON.stringify(pbk));


      // ---- F15: the block caret is slim (about a third of its old width) ----------------------------------------------------------------------------------------------------------------------
      await fresh(); await seed(); await open('fx-m2');
      await click('.forward-only-editor'); await app.typeKeys('x');
      const caretUp = await waitSoft("!!document.querySelector('.flux-block-caret')", { label: 'block caret', timeout: 6000 });
      const caretRect = caretUp ? await q("(() => { const e = document.querySelector('.flux-block-caret'); const r = e.getBoundingClientRect(); return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; })()") : null;
      ok('F15 the block caret is slim: its width is at most 20% of its height (it was 48%) and never under 3 px', !!caretRect && caretRect.w >= 3 && caretRect.w / caretRect.h <= 0.2, JSON.stringify(caretRect));

      // ---- F16: the rail's hover and active states are electric blue, with no Arbor brown tile (F11 extended to hover and active) ---------------------------------------------------------------
      await fresh(); await seed(); await open('fx-m2');
      const railPt = await q("(() => { const b = document.querySelector('.wz-strip [data-category=\"plan\"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
      const warm = (rgb) => { const m = /rgba?\(([^)]+)\)/.exec(rgb || ''); if (!m) return false; const p = m[1].split(',').map((x) => parseFloat(x)); const a = p.length > 3 ? p[3] : 1; return a > 0.3 && p[0] - p[2] >= 6 && p[0] >= p[1]; };
      let hov = null;
      if (railPt) { await app.mouseMove(railPt.x, railPt.y); await sleep(350); hov = await q("(() => { const b = document.querySelector('.wz-strip [data-category=\"plan\"]'); const cs = getComputedStyle(b); return { color: cs.color, bg: cs.backgroundColor }; })()"); }
      ok('F16 hovering a rail item paints it electric blue (#00C2FF) on a glass tile - not Arbor brown, not brass', !!hov && hov.color === 'rgb(0, 194, 255)' && !warm(hov.bg), JSON.stringify(hov));
      await click('.wz-strip [data-category="page"]'); await app.mouseMove(700, 500); await sleep(400);
      const act = await q("(() => { const b = document.querySelector('.wz-strip [data-category].active'); if (!b) return null; const cs = getComputedStyle(b); return { color: cs.color, edge: cs.borderLeftColor, bg: cs.backgroundColor }; })()");
      ok('F16 the active rail item is electric blue with a #00C2FF left edge and no brown tile', !!act && act.color === 'rgb(0, 194, 255)' && act.edge === 'rgb(0, 194, 255)' && !warm(act.bg), JSON.stringify(act));
      // F11 extended: with a rail pop-out open, still no input / tile of Arbor brown anywhere in the visible chrome
      const chromeWarm = await q(`(() => { const out = []; for (const e of document.querySelectorAll('.wz-strip, .wz-strip *, .wz-cascade-panel, .wz-cascade-panel *, .desk-mode-strip, .desk-mode-strip *')) { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; const m = /rgba?\\(([^)]+)\\)/.exec(getComputedStyle(e).backgroundColor); if (!m) continue; const p = m[1].split(',').map((x) => parseFloat(x)); const a = p.length > 3 ? p[3] : 1; if (a > 0.3 && p[0] - p[2] >= 6 && p[0] >= p[1]) out.push(String(e.className).slice(0, 40) + ' ' + getComputedStyle(e).backgroundColor); } return out.slice(0, 8); })()`);
      ok('F16 no rail, pop-out or mode-strip element paints an Arbor brown fill', Array.isArray(chromeWarm) && chromeWarm.length === 0, JSON.stringify(chromeWarm));

      // ---- F17: no Arbor olive anywhere: every green on a Flux screen is lime, dark and light, with the rail pop-out and the Tutor drawer open ------------------------------------------------------
      const oliveScan = `(() => { const out = []; const isOlive = (rgb) => { const m = /rgba?\\(([^)]+)\\)/.exec(rgb || ''); if (!m) return false; const p = m[1].split(',').map((x) => parseFloat(x)); if ((p.length > 3 ? p[3] : 1) < 0.2) return false; const r = p[0] / 255, g = p[1] / 255, b = p[2] / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return false;
        const d = mx - mn; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; const s = d / mx; return h >= 55 && h <= 150 && s < 0.7 && mx >= 0.25; };
        for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          const vals = [cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderLeftColor, cs.outlineColor, cs.fill, cs.stroke]; const hit = vals.find((v) => isOlive(v)); if (hit) out.push((e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.')).slice(0, 50) + ' ' + hit); } return out.slice(0, 10); })()`;
      for (const pg of ['dark', 'light']) {
        await fresh({ page: pg }); await seed(); await open('fx-m2');
        await click('.wz-strip [data-category="page"]'); await q("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900);
        const ol = await q(oliveScan);
        ok(`F17 [${pg}] no element paints an Arbor olive or muted green (any remaining green is lime #A6FF3D)`, Array.isArray(ol) && ol.length === 0, JSON.stringify(ol));
      }


      // ---- F19: the arrival wears Flux's own WRIZO wordmark, never Arbor's PNG; F20: the card tokens are glass in BOTH tones (a pop-up and the deck wizard read them) ----------------------------------------------
      await fresh();
      const arr = await q(`(() => { const l = document.querySelector('.wz-arrival .wz-logo'); const m = document.querySelector('.wz-arrival .wz-mark'); const imgs = [...document.querySelectorAll('img')].filter((i) => /wrizo-logo|wrizo-sketch/.test(i.getAttribute('src') || '') && i.getBoundingClientRect().width > 0).length;
        const w = document.querySelector('.wz-arrival-write'); return { logo: l ? l.tagName + ':' + l.textContent : null, mark: m ? m.tagName + ':' + m.textContent : null, imgs, write: w ? [getComputedStyle(w).color, getComputedStyle(w).borderTopColor] : null }; })()`);
      ok('F19 the arrival\'s Write door is the choice colour (cyan), not brass', !!arr && !!arr.write && arr.write[0] === 'rgb(0, 194, 255)' && arr.write[1] === 'rgb(0, 194, 255)', JSON.stringify(arr && arr.write));
      ok('F19 the arrival\'s logo and corner mark are Flux\'s WRIZO wordmark (text), and no Arbor wrizo PNG is drawn', !!arr && arr.logo === 'SPAN:WRIZO' && arr.mark === 'SPAN:WRIZO' && arr.imgs === 0, JSON.stringify(arr));
      for (const pg of ['dark', 'light']) {
        await q(`window.wrizoThemePrefs.set({ page: '${pg}' })`); await sleep(300);
        const tk = await q(`(() => { const cs = getComputedStyle(document.documentElement); return { stock: cs.getPropertyValue('--card-stock').trim(), ink: cs.getPropertyValue('--ink-on-card').trim(), badge: cs.getPropertyValue('--badge-on-card').trim() }; })()`);
        const dark = (h) => { const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h || ''); return !!m && (0.2126 * parseInt(m[1], 16) + 0.7152 * parseInt(m[2], 16) + 0.0722 * parseInt(m[3], 16)) / 255 < 0.2; };
        ok(`F20 [${pg}] the card, its pop-up and the deck wizard read dark glass: card stock dark, ink light, badge cyan (never Arbor olive)`, !!tk && dark(tk.stock) && !dark(tk.ink) && tk.badge.toUpperCase() === '#57D0F5', JSON.stringify(tk));
      }


      // ---- F9: light mode: page light, chrome dark; the readouts follow the page ---------------------------------------------------------------------------------------------
      await fresh({ page: 'light' }); await seed(); await open('fx-m2');
      const lm = await q("(() => { const pg = document.querySelector('.mode-page'); const rl = document.querySelector('.wz-strip'); const ro = document.querySelector('.flux-readout-doc'); return { page: pg ? getComputedStyle(pg).backgroundColor : null, rail: rl ? getComputedStyle(rl).backgroundColor : null, readout: ro ? getComputedStyle(ro).color : null }; })()");
      const lp = lumOf(lm.page), lr = lumOf(lm.rail), lro = lumOf(lm.readout);
      ok('F9 in light mode the page is light and the chrome stays dark', lp !== null && lp > 0.7 && (lr === null || lr < 0.1), JSON.stringify(lm));
      const cr = lp !== null && lro !== null ? (Math.max(lp, lro) + 0.05) / (Math.min(lp, lro) + 0.05) : 0;
      ok(`F9 the light page's readout text reads at >= 4.5:1 against the page (measured ${cr.toFixed(2)}:1)`, cr >= 4.5, cr.toFixed(2));
      // the vignette (a fixed inset shadow over the viewport) is BEHIND the content under Flux, so the empty light page carries no grey band at its top or bottom; and the lamp/room is blue
      const vgn = await q(`(() => { const v = getComputedStyle(document.body, '::after'); const g = getComputedStyle(document.documentElement).getPropertyValue('--lamp-glow'); const m = getComputedStyle(document.documentElement).getPropertyValue('--chrome-surface').trim(); return { z: v.zIndex, lamp: g.slice(0, 60), panel: m }; })()`);
      ok('F9 [light] the vignette sits behind the page (z-index -1): no grey band at the empty light page\'s top or bottom', !!vgn && vgn.z === '-1', JSON.stringify(vgn));

      // ---- F10: Arbor is untouched ---------------------------------------------------------------------------------------------------------------------------------------------
      await fresh({ theme: 'plateau', page: null }); await seed(); await open('fx-m2');
      const arbor = await q("({ readouts: !!document.querySelector('.flux-readouts'), icons: document.querySelectorAll('.wz-strip svg[data-theme-icon]').length, labels: [...document.querySelectorAll('.wz-strip [data-category] .wz-strip-label')].map((e) => e.textContent.trim()) })");
      ok('F10 Arbor: no Flux readouts, no seam icons, and the old words (Pages, Boards, Journal, Settings, Themes)', !arbor.readouts && arbor.icons === 0 && ['Pages', 'Boards', 'Journal', 'Settings'].every((w) => arbor.labels.includes(w)), JSON.stringify(arbor));
    });
  } catch (err) {
    ok('PART 2 ran to the end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | '));
  }
}
