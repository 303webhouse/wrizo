// POLISH #10, FIX item 20 (Nick's live test of #7, Oct 25): THE TYPEWRITER'S TOP AND BOTTOM FADES BLEND INTO EACH THEME'S OWN GROUND (Flux's navy, Arbor's
// brown desk, Machina's grey), not a generic dark overlay. Check: the fade's end colour equals the theme's ground token in each theme, dark + light page.
// RED-FIRST, on main @ 28aa6aab.
//
// The zoom's band is a MASK on the page column: where it reaches 0 nothing of the page paints, so what shows there IS the fade's end colour. Each theme,
// light and dark page, 1366x768, a long Draft page zoomed, the writer at its end and the hold settled. The painted screen is sampled across the
// zoomed page's width just inside the column's top edge (the band's top end, alpha ~0) and just inside its bottom edge (past anchor + 4.4 lines, alpha
// 0), and the dominant colour of each strip is compared with the theme's ground token (--desk-ground, resolved on the stage).
//   G1  the top fade ends in the ground colour (each channel within 8)
//   G2  the bottom fade ends in the ground colour (each channel within 8)
// Each reading carries the sample, the ground, the room beside the page at the same height, and every layer stacked under the sample point with its
// own background, so a red run is also the diagnosis.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-ground.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const PARA = 'The rope was already there, and the well took the bucket back colder still. Whatever is worth carrying is already with you, and the rest the wind can have.';
const TEXT = Array.from({ length: 16 }, () => PARA).join('\n');
const TOL = 8;

const HELPERS = `(() => {
  window.__p10gLoad = async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0); window.__p10gPx = g.getImageData(0, 0, c.width, c.height); return [c.width, c.height]; };
  // the dominant colour of a strip (5-bit bins), with its share of the strip and the strip's own spread
  window.__p10gMode = (x0, y0, x1, y1) => { const P = window.__p10gPx; if (!P) return null; const W = P.width; const H = P.height; const d = P.data;
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1)); if (x1 <= x0 || y1 <= y0) return null;
    const bins = new Map(); let n = 0;
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { const i = (y * W + x) * 4; const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      const b = bins.get(k) || { c: 0, r: 0, g: 0, b: 0 }; b.c += 1; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2]; bins.set(k, b); n += 1; }
    let best = null; for (const b of bins.values()) if (!best || b.c > best.c) best = b;
    return { rgb: [Math.round(best.r / best.c), Math.round(best.g / best.c), Math.round(best.b / best.c)], share: Math.round(best.c / n * 100) / 100, bins: bins.size }; };
  // the theme's ground token, resolved where the desk resolves it
  window.__p10gGround = () => { const host = document.querySelector('.desk-frame-stage') || document.body; const p = document.createElement('div');
    p.style.cssText = 'position:absolute;width:1px;height:1px;left:-9px;top:-9px;background:var(--desk-ground)'; host.appendChild(p);
    const c = getComputedStyle(p).backgroundColor; p.remove(); const m = c.match(/[\\d.]+/g) || []; return { css: c, rgb: m.slice(0, 3).map(Number), a: m.length > 3 ? Number(m[3]) : 1 }; };
  // every layer under a point, each with its own paint
  window.__p10gStack = (x, y) => document.elementsFromPoint(x, y).slice(0, 10).map((e) => { const cs = getComputedStyle(e);
    const tag = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
    return { el: tag, bg: cs.backgroundColor, img: cs.backgroundImage === 'none' ? null : cs.backgroundImage.slice(0, 90), o: cs.opacity, mask: (cs.webkitMaskImage || cs.maskImage || 'none') === 'none' ? null : 'mask' }; });
  window.__p10gBody = () => { const b = getComputedStyle(document.body); const a = getComputedStyle(document.body, '::after'); const h = getComputedStyle(document.documentElement);
    return { html: h.backgroundColor + ' ' + h.backgroundImage.slice(0, 60), body: b.backgroundColor + ' ' + b.backgroundImage.slice(0, 120), after: a.boxShadow }; };
  return true; })()`;
const GEOM = `(() => { const col = document.querySelector('.mode-pagecol'); const p = document.querySelector('.mode-page'); if (!col || !p) return null;
  const c = col.getBoundingClientRect(); const r = p.getBoundingClientRect(); const cs = getComputedStyle(col);
  return { zoom: col.getAttribute('data-zoom'), col: { t: c.top, b: c.bottom, l: c.left, r: c.right }, page: { l: r.left, r: r.right, t: r.top, b: r.bottom },
    anchor: cs.getPropertyValue('--tw-anchor').trim(), lh: parseFloat(cs.getPropertyValue('--tw-lh')) || null, vh: innerHeight }; })()`;
const near = (a, b) => !!a && !!b && a.length >= 3 && b.length >= 3 && [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= TOL);

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const th of THEMES) {
    for (const tone of ['light', 'dark']) {
      const tag = `${th.name} ${tone} page`;
      const id = `p10g-${th.id}-${tone}`;
      await app.evalJs("location.hash = '#/'"); await sleep(300);
      await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}'); localStorage.setItem('wrizo-theme-prefs', ${J(J({ voice: 'serif', page: tone, fade: 'on' }))})`);
      await app.reload();
      await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
      await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: TEXT, createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
      await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'on')`);
      await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
      await app.evalJs(`location.hash = '#/page/${id}'`);
      if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: id, timeout: 10000 }))) { ok(`${tag} fixture: the page opened`, false); continue; }
      await sleep(900);
      await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
      await app.typeKeys('x');
      // the hold pays the deep first engage one line per glide: wait for the scroller to hold still (1s; capped at 20s)
      const t0 = Date.now(); let last = null; let still = 0; let settled = false;
      while (Date.now() - t0 < 20000) { await sleep(200); const top = await app.evalJs("(() => { const s = document.querySelector('.mode-scroll'); return s ? Math.round(s.scrollTop) : null; })()");
        if (top != null && top === last) { still += 200; if (still >= 1000) { settled = true; break; } } else { still = 0; last = top; } }
      // the pointer off the page, and the chrome left to recede as it does while the writer writes
      await app.mouseMove(2, 2); await sleep(1500);
      await app.evalJs(HELPERS);
      const g = await app.evalJs(GEOM);
      const theme = await app.evalJs("document.documentElement.getAttribute('data-theme')");
      const prem = !!g && g.zoom === 'true' && settled && theme === th.id && !!g.lh;
      ok(`${tag} (premise): the theme is applied, the page is zoomed with its band, and the hold has settled`, prem, J({ theme, settled, g }));
      if (!prem) continue;
      const ground = await app.evalJs('window.__p10gGround()');
      await app.evalJs(`window.__p10gLoad(${J(await app.screenshot())})`);
      const x0 = g.page.l + 24; const x1 = g.page.r - 24;
      const yTop = Math.max(g.col.t, 0) + 2; const yBot = Math.min(g.col.b, g.vh) - 3;
      const top = await app.evalJs(`window.__p10gMode(${x0}, ${yTop}, ${x1}, ${yTop + 5})`);
      const bot = await app.evalJs(`window.__p10gMode(${x0}, ${yBot - 5}, ${x1}, ${yBot})`);
      const roomTop = await app.evalJs(`window.__p10gMode(${Math.max(0, g.page.l - 60)}, ${yTop}, ${Math.max(1, g.page.l - 30)}, ${yTop + 5})`);
      const roomBot = await app.evalJs(`window.__p10gMode(${Math.max(0, g.page.l - 60)}, ${yBot - 5}, ${Math.max(1, g.page.l - 30)}, ${yBot})`);
      const cx = Math.round((x0 + x1) / 2);
      const stackTop = await app.evalJs(`window.__p10gStack(${cx}, ${Math.round(yTop + 2)})`);
      const stackBot = await app.evalJs(`window.__p10gStack(${cx}, ${Math.round(yBot - 2)})`);
      const body = await app.evalJs('window.__p10gBody()');
      ok(`${tag} G1: the top fade ends in the theme's ground (${top && top.rgb} vs ${ground && ground.rgb})`, !!top && !!ground && near(top.rgb, ground.rgb),
        J({ top, ground, roomTop, stackTop, body, at: { x0, x1, y: yTop } }));
      ok(`${tag} G2: the bottom fade ends in the theme's ground (${bot && bot.rgb} vs ${ground && ground.rgb})`, !!bot && !!ground && near(bot.rgb, ground.rgb),
        J({ bot, ground, roomBot, stackBot, at: { x0, x1, y: yBot } }));
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 2000)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-GROUND PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-GROUND VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-GROUND VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
