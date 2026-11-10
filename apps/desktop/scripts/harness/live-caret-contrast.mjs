// MEASUREMENT (Fable, Nov 9 7:15 pm; read-only; bug #58 if under 3:1): the LIVE typing caret against the LIGHT page in Machina and in Arbor (no ?flux3). Both draw the browser's own caret (caret-color,
// which is the text ink when 'auto'): there is no custom block, so it is read two ways, as the live-link measurement was: (1) COMPUTED: the editor's caret-color against the page's own colour
// (the sheet's background, read off a pixel beside the text); (2) RENDERED: the best contrast of any pixel in the caret's 3 px column against the page beside it over several screenshots (a native
// caret blinks, so it is sampled over ~2 s and the best is kept; if it never shows in a shot the rendered number is null and says so). Nothing is written to the app's data: a fresh profile.
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
await withHarness(async (app) => {
  for (const [name, themeId] of [['arbor', 'plateau'], ['machina', 'machina']]) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme', ${JSON.stringify(themeId)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'light', fade: 'on' })); localStorage.setItem('wrizo-ambiance-dial','50');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 }).catch(() => {});
    const id = `caret-${name}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'A line of her text', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(450);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' });
    await sleep(1200);
    await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    await app.typeKeys(' x');
    await sleep(300);
    const info = await app.evalJs(`(() => { const ed = document.querySelector('.forward-only-editor'); const cs = getComputedStyle(ed); const s = getSelection(); const r = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; let rc = r ? r.getClientRects()[0] : null;
      if (!rc || !rc.height) { const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, l = null; while ((n = w.nextNode())) l = n; if (l) { const g = document.createRange(); g.setStart(l, l.nodeValue.length - 1); g.setEnd(l, l.nodeValue.length); const q = g.getBoundingClientRect(); rc = { left: q.right, top: q.top, height: q.height }; } }
      const pg = document.querySelector('.mode-page'); const pcs = pg ? getComputedStyle(pg) : null;
      return { theme: document.documentElement.getAttribute('data-theme'), tone: document.documentElement.getAttribute('data-page'), caretColor: cs.caretColor, color: cs.color, pageBg: pcs ? pcs.backgroundColor : null, caret: rc ? { x: Math.round(rc.left), y: Math.round(rc.top), h: Math.round(rc.height) } : null }; })()`);
    const best = { rendered: null, shots: 0, board: null };
    for (let i = 0; i < 6 && info.caret; i += 1) {
      const data = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
      const r = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const D = x.getImageData(0, 0, c.width, c.height); const W = c.width;
        const P = (a, b) => { const i = (b * W + a) * 4; return [D.data[i], D.data[i + 1], D.data[i + 2]]; };
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]); const cr = (p, q) => (Math.max(lum(p), lum(q)) + 0.05) / (Math.min(lum(p), lum(q)) + 0.05);
        const c0 = ${JSON.stringify(info.caret)}; const ref = P(c0.x + 14, c0.y + Math.round(c0.h / 2)); let b = 1; for (let dx = 0; dx <= 2; dx++) for (let dy = 2; dy < c0.h - 2; dy += 3) b = Math.max(b, cr(P(c0.x + dx, c0.y + dy), ref)); return { b: +b.toFixed(2), page: ref }; })()`);
      best.shots += 1; best.board = r.page; if (best.rendered === null || r.b > best.rendered) best.rendered = r.b;
      await sleep(350);
    }
    // computed: the caret colour ('auto' = the text ink) against the page colour read off the rendered pixel beside the text (done here, in node)
    const nums = (s) => (/(d+(?:.d+)?),s*(d+(?:.d+)?),s*(d+(?:.d+)?)/.exec(s) || []).slice(1).map(Number);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
    const cc = info.caretColor === 'auto' || /rgba(0, 0, 0, 0)/.test(info.caretColor) ? info.color : info.caretColor;
    const ca = nums(cc), pb = best.board;
    const comp = { caretResolved: cc, page: pb, c: ca.length === 3 && pb ? +((Math.max(lum(ca), lum(pb)) + 0.05) / (Math.min(lum(ca), lum(pb)) + 0.05)).toFixed(2) : null };
    out[name] = { info, rendered: best, computed: comp };
  }
}).catch((e) => { out.error = String(e && e.stack || e); });
console.log('MEASUREMENT-CARET ' + JSON.stringify(out, null, 1));
for (const k of ['arbor', 'machina']) console.log(`CARET ${k} (light page): computed ${out[k] && out[k].computed ? out[k].computed.c : 'n/a'}:1 (${out[k] && out[k].computed ? out[k].computed.caretResolved : ''}) ; rendered ${out[k] ? out[k].rendered.rendered : 'n/a'}:1 over ${out[k] ? out[k].rendered.shots : 0} shots`);
