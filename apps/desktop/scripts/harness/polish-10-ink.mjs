// DEPLOY #10 - THE POLISH BATCH, INK's items 12-15 (Fable's brief Oct 25: Downloads\polish-10-brief.md). A box turn; written BEFORE the fixes (red on main).
//   12  Boards and cards the SAME SIZE in every skin (Nick's law: a skin changes only the skin) - card rects identical across Arbor / Flux / Machina (+-1 px), at 1366 and 1400.
//   13  The Outline: (a) a card's title and its text are separated, and an unedited blur never rewrites the stored text; (b) the board stage's left chevron tab does not sit over the first column; (c) the Storyboard lane box is square.
//   14  Flux: the rail's place label "RACK > The Well" is ONE line with an ellipsis; the full name on hover / focus (title).
//   15  The Tutor's Fragments list never shows the same fragment twice (the display dedupes by id AND by text; the report says which it was - the code already deduped by id, so a repeat is two distinct entries with the same words).
// Run: node scripts/harness/polish-10-ink.mjs [outDir]   (takes the box first).  Seeding goes through the app's seams (wrizoCreateJournalPage etc.), never raw storage.
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { if (out) fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(400); return true; };
  const rectOf = (sel) => q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()`);
  const THEMES = { plateau: 'Arbor', flux: 'Flux', machina: 'Machina' };

  const fresh = async (theme, width = 1400, height = 900) => {
    await app.emulateDpr(1, width, height);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await q("window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: 'dark' })");
    await sleep(400);
  };
  // one project, one board of four plain cards (First\nOne. ...), a page with tags + two captures that share their words
  const seed = async (drawerName = 'The Well') => {
    await q(`(() => { const d = window.wrizoCreateDrawer(${JSON.stringify(drawerName)}); const p = window.wrizoCreateProject('The Well', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id);
      const t = (id, x, y, w, h, text) => ({ id, kind: 'text', x, y, w, h, z: 1, text });
      window.wrizoCreateJournalPage({ id: 'p10-board', text: 'Four cards', pageType: 'board', projectId: p.id, boxes: [t('c1', 0.05, 0.05, 0.2, 0.105, 'First\\nOne.'), t('c2', 0.4, 0.2, 0.25, 0.12, 'Second\\nTwo.'), t('c3', 0.2, 0.45, 0.3, 0.09, 'Third\\nThree.'), t('c4', 0.6, 0.5, 0.2, 0.2, 'Fourth')], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoCreateJournalPage({ id: 'p10-main', text: 'Main page', pageType: 'page', projectId: p.id, origin: 'project', source: 'page', tags: ['rope'], createdAt: '2026-01-01T00:00:02.000Z' });
      for (const [id, text, at] of [['p10-cap1', 'The rope was already there', '03'], ['p10-cap2', 'The rope was already there', '04'], ['p10-cap3', 'The map was folded wrong', '05']]) window.wrizoCreateJournalPage({ id, text, origin: 'journal', source: null, createdAt: '2026-01-01T00:00:' + at + '.000Z' });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
  };
  const open = async (id, sel) => { await q(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${sel}')`, { label: id, timeout: 8000 }); await sleep(900); };
  const tab = async (view) => click(`[data-board-mode-tab="${view}"]`);
  const sizes = {};   // theme -> { vw, cards:[[l,t,w,h]...], canvas, wrap }

  // ---- 12 - the same board in every skin: the same card rects --------------------------------------------------------------------------------------------------------------------------
  for (const [vw, vh] of [[1400, 900], [1366, 768]]) {
    for (const theme of Object.keys(THEMES)) {
      await fresh(theme, vw, vh); await seed();
      await open('p10-board', '.board-canvas');
      const m = await q(`(() => { const r = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 10) / 10); };
        const cv = document.querySelector('.board-canvas'), wr = document.querySelector('.board-canvas-wrap');
        const cards = [...document.querySelectorAll('.board-box[data-box-id]')].sort((a, b) => a.getAttribute('data-box-id') < b.getAttribute('data-box-id') ? -1 : 1).map((e) => ({ id: e.getAttribute('data-box-id'), r: r(e) }));
        const face = document.querySelector('.board-box .board-text'); const fs = face ? getComputedStyle(face) : null;
        return { canvas: cv ? r(cv) : null, wrap: wr ? r(wr) : null, cards, pad: fs ? fs.padding : null, border: fs ? fs.borderTopWidth : null }; })()`);
      sizes[`${vw}-${theme}`] = m;
      await shot(`12-board-${theme}-${vw}`);
    }
    const base = sizes[`${vw}-plateau`];
    for (const theme of ['flux', 'machina']) {
      const o = sizes[`${vw}-${theme}`];
      const dCanvas = base.canvas && o.canvas ? base.canvas.map((v, i) => Math.round((o.canvas[i] - v) * 10) / 10) : null;
      const dCards = base.cards.map((c, i) => { const oc = o.cards[i]; return oc ? c.r.map((v, k) => Math.round((oc.r[k] - v) * 10) / 10) : null; });
      ok(`[${vw}] the same board in ${THEMES[theme]} and Arbor: the canvas and every card rect are identical (+-1 px)`, !!dCanvas && dCanvas.every((d) => Math.abs(d) <= 1) && base.cards.length === 4 && o.cards.length === 4 && dCards.every((c) => !!c && c.every((d) => Math.abs(d) <= 1)), JSON.stringify({ dCanvas, dCards, base: { canvas: base.canvas, cards: base.cards }, other: { canvas: o.canvas, cards: o.cards }, pad: [base.pad, o.pad] }));
      ok(`[${vw}] the card face's own padding and border are the same in ${THEMES[theme]} as in Arbor`, base.pad === o.pad && base.border === o.border, JSON.stringify({ arbor: [base.pad, base.border], other: [o.pad, o.border] }));
    }
  }

  // ---- 13 - the Outline and the Storyboard (Arbor, at the two widths) -------------------------------------------------------------------------------------------------------------------
  for (const [vw, vh] of [[1366, 768], [1920, 1080]]) {
    await fresh('plateau', vw, vh); await seed();
    await open('p10-board', '.board-canvas');
    await tab('outline'); await waitSoft("!!document.querySelector('[data-board-projection=outline]')", { label: 'outline' }); await sleep(600);
    const ol = await q(`(() => { const row = document.querySelector('[data-outline-row=c1]'); if (!row) return null; const inp = row.querySelector('input'); const body = row.querySelector('.board-outline-body'); return { input: inp ? inp.value : null, body: body ? body.textContent : null, shown: ((inp ? inp.value : '') + ' ' + (body ? body.textContent : '')).replace(/\\s+/g, ' ').trim() }; })()`);
    ok(`[${vw}] (13a) the Outline shows a card's title and its text SEPARATED ("First One.", not "FirstOne.")`, !!ol && /First\s+One\./.test(ol.shown) && !/FirstOne/.test(ol.shown), JSON.stringify(ol));
    // an unedited focus + blur must never rewrite the card (the input cannot hold a newline: the old blur wrote "FirstOne." back over "First\nOne.")
    await q("(() => { const i = document.querySelector('[data-outline-input=c1]'); if (i) { i.focus(); i.blur(); } })()"); await sleep(500);
    const stored = (await q('window.wrizoBoard()')).find((b) => b.id === 'c1');
    ok(`[${vw}] (13a) focusing and leaving an Outline row without typing leaves the card's stored text untouched`, !!stored && stored.text === 'First\nOne.', JSON.stringify(stored && stored.text));
    await q("(() => { const i = document.querySelector('[data-outline-input=c1]'); if (i) { i.focus(); i.value = 'First EDITED'; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); } })()"); await sleep(500);
    const edited = (await q('window.wrizoBoard()')).find((b) => b.id === 'c1');
    ok(`[${vw}] (13a) editing the title in the Outline writes the new title and KEEPS the text after it`, !!edited && edited.text === 'First EDITED\nOne.', JSON.stringify(edited && edited.text));
    const gap = await q(`(() => { const g = document.querySelector('.wz-sliver-grip'); const row = document.querySelector('.board-outline-row'); const bul = document.querySelector('.board-outline-bullet'); if (!g || !row) return null; const gr = g.getBoundingClientRect(), br = (bul || row).getBoundingClientRect(), rr = row.getBoundingClientRect(); const inter = !(gr.right <= rr.left || gr.left >= rr.right || gr.bottom <= rr.top || gr.top >= rr.bottom); return { grip: [gr.left, gr.top, gr.right, gr.bottom].map(Math.round), firstCol: Math.round(br.left), rowLeft: Math.round(rr.left), inter, clear: Math.round(br.left - gr.right) }; })()`);
    ok(`[${vw}] (13b) the stage's left chevron tab clears the Outline's first column (>= 12 px, no overlap)`, !!gap && !gap.inter && gap.clear >= 12, JSON.stringify(gap));
    await shot(`13-outline-${vw}`);
    await tab('storyboard'); await waitSoft("!!document.querySelector('.board-lane')", { label: 'storyboard' }); await sleep(600);
    const sq = await q(`(() => { const l = document.querySelector('.board-lane'), c = document.querySelector('.board-sb-card'); const g = document.querySelector('.wz-sliver-grip'); const lr = l && l.getBoundingClientRect(), gr = g && g.getBoundingClientRect(); return { lane: l ? getComputedStyle(l).borderTopLeftRadius : null, card: c ? getComputedStyle(c).borderTopLeftRadius : null, laneClear: lr && gr ? Math.round(lr.left - gr.right) : null }; })()`);
    ok(`[${vw}] (13c) the Storyboard lane box and its cards are square-cornered`, !!sq && parseFloat(sq.lane) === 0 && parseFloat(sq.card) === 0, JSON.stringify(sq));
    await shot(`13-storyboard-${vw}`);
  }

  // ---- 14 - Flux's rail place label: one line, an ellipsis, the full name on hover / focus ---------------------------------------------------------------------------------------------
  for (const [name, long] of [['The Well', false], ['The Very Long Name Of My Whole Novel Project', true]]) {
    await fresh('flux'); await seed(name);
    await open('p10-board', '.board-canvas');
    const pl = await q(`(() => { const b = document.querySelector('.wz-place-block'); const n = document.querySelector('.wz-place-block .wz-place-name'); if (!b || !n) return null; const cs = getComputedStyle(n); const r = n.getBoundingClientRect(); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; return { text: n.textContent, ws: cs.whiteSpace, to: cs.textOverflow, ov: cs.overflow, lines: Math.round(r.height / lh * 10) / 10, clipped: n.scrollWidth > n.clientWidth + 1, title: b.getAttribute('title'), aria: b.getAttribute('aria-label') }; })()`);
    ok(`[Flux ${long ? 'long' : 'short'} name] (14) the rail's place label is ONE line with an ellipsis (white-space nowrap, text-overflow ellipsis, no wrapping)`, !!pl && pl.ws === 'nowrap' && pl.to === 'ellipsis' && pl.lines <= 1.3, JSON.stringify(pl));
    ok(`[Flux ${long ? 'long' : 'short'} name] (14) the full name is on hover / focus (the button's title carries it)`, !!pl && !!pl.title && pl.title.length > 0 && (pl.text.replace(/^RACK ▸ /, '') === pl.title.replace(/^RACK ▸ /, '') || pl.title.includes(pl.text.replace(/…$/, ''))) , JSON.stringify(pl));
    if (!long) await shot('14-place-label-flux');
  }

  // ---- 15 - the Tutor's Fragments list never shows the same fragment twice -----------------------------------------------------------------------------------------------------------------
  for (const theme of Object.keys(THEMES)) {
    await fresh(theme); await seed();
    await open('p10-main', '.mode-stage, .page-editor, [data-page-editor], .wz-page, textarea, [contenteditable]');
    await q("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900);
    await waitSoft("!!document.querySelector('.wz-tutor-frag-item')", { label: 'fragments', timeout: 6000 });
    const fr = await q(`[...document.querySelectorAll('.wz-tutor-frag-item')].map((b) => b.textContent.trim())`);
    const dupes = fr.filter((t, i) => fr.indexOf(t) !== i);
    ok(`[${THEMES[theme]}] (15) the Fragments list shows each fragment once (${fr.length} rows)`, fr.length >= 2 && dupes.length === 0 && fr.includes('The rope was already there') && fr.includes('The map was folded wrong'), JSON.stringify(fr));
    if (theme === 'flux') await shot('15-fragments-flux');
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nPOLISH-10-INK: FAIL - ${failed.length}/${checks.length} failed` : `\nPOLISH-10-INK: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
