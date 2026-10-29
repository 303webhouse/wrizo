// POLISH #10, FIX items 3 + 5 (Nick released the held list, Oct 25):
//   3  A POP-OUT ON THE PAGE NEVER EXTENDS PAST THE PAGE SURFACE (the Draft Tools drawer ran below the page); it scrolls inside instead. (Card pop-outs:
//      later.)
//   5  THE ZOOM'S INK SHEET COVERS THE VISIBLE PAGE, not just the strip around the writing line: a drag anywhere on the visible page draws. And the ink
//      stays where it was drawn relative to the TEXT in both views (strokes are measured from the text, so nothing already saved moves).
// RED-FIRST, on page-size-r3 @ 243cf8f0: P3 red where the page is shorter than the stage (both drawers run to the stage's foot); P5 red above and below a
// fresh zoomed page's one line (the sheet is that line tall - FIX's item121 probe, Oct 24: 467-510 at 1366x768).
//
//   P3 (Arbor, Draft, normal view, 1366x768 + 1920x1080): each open drawer's panel ends at or above the page's own bottom edge
//   P5 (Arbor / Flux / Machina, a fresh Free Write page in the zoom, INK, 1366x768): a mouse drag ABOVE the writing line, ON it and BELOW it - each inside
//      the page and the stage - adds one stroke each
//   P5-ALIGN (Arbor): the stroke drawn above the line keeps its place relative to the text when the zoom is left: its ink's top, measured from the first
//      line's top in the page's own units, is the same in the zoom and in the normal view (within 2px)
// Mutants (Arbor): MP3 the drawers forced back to the stage's full height - P3 fails; MP5 the sheet's reach undone - the drag above the line draws
// nothing - P5 fails.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-page.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };

const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const SENTENCES = ['The rope was already there, and the well took the bucket back colder still.', 'We left the map on the stone and walked until the light went thin.'];
const PARA = (() => { let s = ''; let i = 0; while (s.length < 1600) { s += (s ? ' ' : '') + SENTENCES[i % 2]; i += 1; } return s; })();
const style = (app, id, css) => app.evalJs(css == null
  ? `(() => { document.getElementById(${J(id)})?.remove(); return true; })()`
  : `(() => { let s = document.getElementById(${J(id)}); if (!s) { s = document.createElement('style'); s.id = ${J(id)}; document.head.appendChild(s); } s.textContent = ${J(css)}; return true; })()`);
// the writer's own Typewriter control (page-size's press): the Sliver open, the pointer to the button until it is HIT, the press, the Sliver closed
// (review of turn 1, Oct 26: a Free Write page reopens zoomed though its key says off - the view is set by the control, never the key)
const setView = async (app, zoom) => {
  const zoomedNow = () => app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'");
  if ((await zoomedNow()) === zoom) return zoom;
  const grip = () => app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (!g) return null; const r = g.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  const open = () => app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!(await open())) { const g = await grip(); if (g) { await click(app, g.x, g.y); await sleep(600); } }
  const probe = () => app.evalJs(`(() => { const b = document.querySelector('[data-mode-toggle="typewriter"]'); if (!b) return null; b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = b.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y);
    return { x: Math.round(x), y: Math.round(y), hits: !!hit && (hit === b || b.contains(hit)) }; })()`);
  let at = await probe();
  for (let i = 0; at && !at.hits && i < 16; i += 1) { await app.mouseMove(at.x, at.y); await sleep(150); at = await probe(); }
  if (at && at.hits) { await click(app, at.x, at.y); await sleep(1100); }
  if (await open()) { const g = await grip(); if (g) { await click(app, g.x, g.y); await sleep(600); } }
  return zoomedNow();
};
const openPage = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.desk-frame-stage--prose .mode-page')", { label: id, timeout: 10000 });
  await sleep(900);
  return there;
};
const tabPoint = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const OPEN = { tools: "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", tutor: "document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'" };
const TAB = { tools: '.wz-sliver-grip', tutor: '.wz-tutor-grip' };
const setOpen = async (app, which, want) => {
  if ((await app.evalJs(OPEN[which])) !== want) { const p = await tabPoint(app, TAB[which]); if (p) { await click(app, p.x, p.y); await sleep(800); } }
  return (await app.evalJs(OPEN[which])) === want;
};
const P3PROBE = `(() => { const R = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; };
  return { page: R('.desk-frame-stage--prose .mode-page'), stage: R('.desk-frame-stage'), tools: R('.wz-sliver-panel'), tutor: R('.wz-tutor-panel'), sOpen: ${OPEN.tools}, tOpen: ${OPEN.tutor},
    zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null }; })()`;
const strokes = (app, id) => app.evalJs(`(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = l.find((x) => x.id === ${J(id)}); return ((e && e.strokes) || []).length; })()`);
const drag = async (app, x0, x1, y) => {
  await app.mouseDown(x0, y);
  for (let i = 1; i <= 8; i += 1) { await app.mouseMove(x0 + ((x1 - x0) * i) / 8, y + (i % 2)); await sleep(16); }
  await app.mouseUp(x1, y);
  await sleep(800);
};
// where the text starts and where a fresh page's line is, the visible box, the zoom, the paint scale
const P5PROBE = `(() => { const ed = document.querySelector('.forward-only-editor'); const page = document.querySelector('.desk-frame-stage--prose .mode-page'); const st = document.querySelector('.desk-frame-stage');
  if (!ed || !page || !st) return null; const rg = document.createRange(); rg.selectNodeContents(ed); const ls = [...rg.getClientRects()].filter((q) => q.height >= 4);
  const pr = page.getBoundingClientRect(); const sr = st.getBoundingClientRect(); const er = ed.getBoundingClientRect();
  return { lineTop: ls.length ? Math.min(...ls.map((q) => q.top)) : er.top, lineBottom: ls.length ? Math.max(...ls.map((q) => q.bottom)) : er.bottom, textLeft: er.left, textRight: er.right,
    page: { top: pr.top, bottom: pr.bottom }, stage: { top: sr.top, bottom: sr.bottom }, vh: innerHeight, scale: page.offsetWidth ? pr.width / page.offsetWidth : 1,
    zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null }; })()`;
// the committed canvas's ink, as a viewport-px bounding box (the first and last rows with any alpha)
const INKBOX = `(() => { const c = document.querySelector('.wz-ink-sheet .ink-committed'); if (!c || !c.width) return null; const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height).data;
  let y0 = -1, y1 = -1; for (let y = 0; y < c.height; y += 1) { let any = false; for (let x = 0; x < c.width; x += 1) if (d[(y * c.width + x) * 4 + 3] > 40) { any = true; break; } if (any) { if (y0 < 0) y0 = y; y1 = y; } }
  if (y0 < 0) return null; const r = c.getBoundingClientRect(); const k = r.height / c.height; return { top: r.top + y0 * k, bottom: r.top + (y1 + 1) * k }; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const now = new Date().toISOString();
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: 'p10p-draft', text: PARA, createdAt: now, origin: null, source: 'page' })})`);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-p10p-draft', 'drafting'); localStorage.setItem('wrizo-typewriter-page-p10p-draft', 'off')");
  for (const th of THEMES) {
    const fid = `p10p-ink-${th.id}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: fid, text: 'One line to start.', createdAt: now, origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${fid}', 'journal'); localStorage.setItem('wrizo-typewriter-page-${fid}', 'on')`);
  }
  await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
  ok('fixture: a Draft page full of text and one fresh Free Write page per skin, seeded through the seams', true);

  // ---- P3 (Arbor): each open drawer ends at or above the page's own bottom edge
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    await app.emulateDpr(1, w, h);
    const tag = `Arbor Draft ${w}x${h}`;
    if (!(await openPage(app, 'p10p-draft'))) { ok(`${tag} P3 fixture: the page opened`, false, ''); continue; }
    await setOpen(app, 'tutor', false); await setOpen(app, 'tools', false);
    for (const which of ['tools', 'tutor']) {
      await setOpen(app, which, true);
      const g = await app.evalJs(P3PROBE);
      const panel = g && g[which];
      ok(`${tag} P3 (${which === 'tools' ? 'Tools' : 'Tutor'}): the open drawer ends at or above the page's own bottom edge - it scrolls inside, never past the page`,
        !!g && g.zoom !== 'true' && (which === 'tools' ? g.sOpen : g.tOpen) && !!panel && !!g.page && panel.bottom <= g.page.bottom + 0.5, J({ panel, page: g && g.page, stage: g && g.stage }));
      if (which === 'tools' && w === 1920) {
        await style(app, 'p10-mp3', '.desk-frame-stage--prose .desk-frame-sliver-anchor{ height:100% !important; }'); await sleep(300);
        const gm = await app.evalJs(P3PROBE);
        await style(app, 'p10-mp3', null); await sleep(200);
        ok(`MP3 (mutant): with the Tools drawer forced back to the stage's full height (LANDED: its foot ${gm && gm.tools && Math.round(gm.tools.bottom)} vs the stage's ${gm && gm.stage && Math.round(gm.stage.bottom)}), P3 fails`,
          !!gm && !!gm.tools && !!gm.stage && Math.abs(gm.tools.bottom - gm.stage.bottom) < 1 && !(gm.tools.bottom <= gm.page.bottom + 0.5), J(gm));
      }
      await setOpen(app, which, false);
    }
  }

  // ---- P5: the zoom's ink sheet covers the visible page
  await app.emulateDpr(1, 1366, 768);
  for (const th of THEMES) {
    const fid = `p10p-ink-${th.id}`;
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`); await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
    const tag = `${th.name} 1366x768 zoom, INK`;
    if (!(await openPage(app, fid))) { ok(`${tag} P5 fixture: the page opened`, false, ''); continue; }
    await setView(app, true); await sleep(400);   // the zoom is entered through the writer's own control (a stored key alone does not hold across the skins)
    await app.evalJs("document.querySelector('#wz-sliver-tab-ink')?.click()"); await sleep(300);
    await setOpen(app, 'tools', false); await sleep(300);
    const g = await app.evalJs(P5PROBE);
    const inkOn = await app.evalJs("document.querySelector('#wz-sliver-tab-ink')?.getAttribute('aria-selected')");
    ok(`${tag} P5 (premise): a fresh page in the zoom, INK chosen, its one line measurable`, !!g && g.zoom === 'true' && inkOn === 'true', J({ g, inkOn }));
    if (!g) continue;
    const top = Math.max(g.page.top, g.stage.top, 0) + 8; const bottom = Math.min(g.page.bottom, g.stage.bottom, g.vh) - 8;
    const x0 = g.textLeft + 40; const x1 = Math.min(g.textRight - 40, x0 + 260);
    const ys = { above: Math.round(Math.max(top + 10, g.lineTop - 120)), on: Math.round((g.lineTop + g.lineBottom) / 2), below: Math.round(Math.min(bottom - 10, g.lineBottom + 60)) };
    const counts = { start: await strokes(app, fid) };
    for (const where of ['above', 'on', 'below']) {
      const before = await strokes(app, fid); await drag(app, x0, x1, ys[where]); counts[where] = (await strokes(app, fid)) - before;
    }
    for (const where of ['above', 'on', 'below']) {
      ok(`${tag} P5 (${where} the writing line, y=${ys[where]}): a drag on the visible page draws one stroke`, ys[where] > top - 1 && ys[where] < bottom + 1 && counts[where] === 1, J({ ys, counts, top, bottom }));
    }
    if (th.id !== 'plateau') continue;
    // P5-ALIGN: the stroke above the line keeps its place relative to the text when the zoom is left (the three strokes are on the canvas; the first row
    // of ink is the top of the 'above' stroke)
    const zInk = await app.evalJs(INKBOX); const zg = await app.evalJs(P5PROBE);
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${fid}', 'off')`);
    let nInk = null; let ng = null;
    let viewNormal = null;
    if (await openPage(app, fid)) { viewNormal = (await setView(app, false)) === false; await app.evalJs("document.querySelector('#wz-sliver-tab-ink')?.click()"); await sleep(400); nInk = await app.evalJs(INKBOX); ng = await app.evalJs(P5PROBE); }
    const dz = zInk && zg ? (zInk.top - zg.lineTop) / zg.scale : null; const dn = nInk && ng ? (nInk.top - ng.lineTop) / ng.scale : null;
    ok(`${tag} P5-ALIGN: the stroke drawn above the line keeps its place relative to the text in both views - its ink's top, from the first line's top in page units, zoom ${dz && dz.toFixed(1)} vs normal ${dn && dn.toFixed(1)} (within 2px)`,
      dz != null && dn != null && dz < -20 && Math.abs(dz - dn) <= 2 && !!ng && ng.zoom !== 'true', J({ zInk, zg, nInk, ng, viewNormal }));
    // MP5: the sheet's reach undone (a fresh page, zoomed again) - the drag above the line draws nothing
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    const mid = `p10p-ink-mut`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: mid, text: 'One line to start.', createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${mid}', 'journal'); localStorage.setItem('wrizo-typewriter-page-${mid}', 'on')`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
    if (await openPage(app, mid)) {
      await app.evalJs("document.querySelector('#wz-sliver-tab-ink')?.click()"); await sleep(300); await setOpen(app, 'tools', false);
      await style(app, 'p10-mp5', '.wz-ink-sheet{ margin-top:0 !important; padding-top:0 !important; margin-bottom:0 !important; padding-bottom:0 !important; }'); await sleep(400);
      const gm = await app.evalJs(P5PROBE); const landed = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.wz-ink-sheet')).paddingTop) || 0");
      const b = await strokes(app, mid); await drag(app, gm.textLeft + 40, gm.textLeft + 300, Math.round(gm.lineTop - 120)); const a = await strokes(app, mid);
      await style(app, 'p10-mp5', null);
      ok(`MP5 (mutant): with the sheet's reach undone (LANDED: its padding-top ${landed}px), a drag above the writing line draws NOTHING - P5 fails`, landed === 0 && a === b, J({ before: b, after: a }));
    } else ok('MP5 fixture: the fresh page opened', false, '');
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-PAGE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-PAGE VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-PAGE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
