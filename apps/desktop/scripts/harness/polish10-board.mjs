// POLISH #10, FIX items 1 + 6 (Nick released the held list, Oct 25; docs: Downloads/polish-10-brief.md):
//   1  DRAWERS NEVER COVER A BOARD'S CARDS. Today on a Board the Tutor panel overlays the canvas from the stage's edge (the "Board exception" kept in
//      #7), and at 1366 the Tools drawer sits over the board's edge. Rule: the board area narrows to the space beside the open drawers (cards
//      reachable by scrolling - the canvas keeps its width, so no card shrinks or moves on it), with the both-or-one rule; the drawers are flush, as on
//      the page. On a board a tab rides the board's edge, so it moves exactly when the board has to narrow (on the page it never does).
//   6  NO GREY VIGNETTE BAND OVER A BOARD (seen at the foot of a light board) - the page's rule: no band over any surface.
// RED-FIRST, on page-size-r3 @ 243cf8f0 (the base this batch stacks on): D1 and D2 are expected RED at 1366 and 1920 (the Tutor overlays the canvas; the
// Tools drawer is 84px over the board's edge at 1366); BAND may already hold here (r3 put the vignette behind every surface) - it is red on main.
//
// A dealt Three-Act (Novel: nine cards) in Arbor, Flux (its Tutor is the Operator) and Machina, at 1366x768 and 1920x1080:
//   D1 in every state (shut, Tools open, Tools + Tutor or Tutor alone), no VISIBLE card (its rect cut to the board's own box) intersects an open drawer
//      (its panel and its tab)
//   D2 the drawers are FLUSH to the board: Tools - its tab's right edge on the board's left edge, its panel against its tab; Tutor - its tab's left
//      edge on the board's right edge, its panel against its tab
//   D3 the cards are not re-laid: every card's size, and the canvas's width, identical shut and open (the board narrows; its canvas does not)
//   D4 every card stays reachable: scrolled to its far side, the board shows its right-most card whole
//   D5 both-or-one: with 200px+ beside the board on each side (measured shut) both stand; else opening the Tutor after the Tools closes the Tools
//   BAND (light board, each skin, 1366): the board's foot and lower corners look the same with the vignette shown or hidden (page-size V's instrument)
// Mutants (Arbor, 1366): MD1 the board's narrowing undone (its margins forced to 0) - D1 fails; MBAND the vignette forced on top - BAND fails.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-board.mjs (apps/desktop, dist-web built)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };

// ---- the deal: the real deck engine, bundled in node (guided-w3.mjs's own pattern), persistence's id maker stubbed
const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const dealThreeAct = async () => {
  const res = await build({
    stdin: { contents: "export { DECKS } from './decks/library';\nexport { materializeDeck } from './decks/engine';", resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [path.join(DESKTOP, 'node_modules')],
    external: ['@fontsource/*', '@fontsource-variable/*'],
  });
  // the real persistence module comes along (the library reads it), so it gets a fake browser for the length of the deal
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }) };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  const M = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  const deck = M.DECKS.find((d) => d.id === 'three-act');
  const dealt = M.materializeDeck(deck, { format: 'novel' }, []).boxes;
  for (const k of ['window', 'document', 'location', 'localStorage']) delete globalThis[k];   // the fake browser goes before the real one starts
  return dealt;
};

const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const SIZES = [[1366, 768], [1920, 1080]];
const DRAWER_MIN = 200;
const TOL = 1;
const near = (a, b, t = TOL) => a != null && b != null && Math.abs(a - b) <= t;
const bid = (theme) => `p10-board-${theme}`;
const OPEN = { tools: "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", tutor: "document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'" };
const TAB = { tools: '.wz-sliver-grip', tutor: '.wz-tutor-grip' };
const SLIDE = { tools: '.wz-sliver-panel .wz-drawer-slide', tutor: '.wz-tutor-panel .wz-drawer-slide' };

// the board, its canvas, every card, both drawers (panel + tab), in one read
const GEO = `(() => { const R = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return b.width || b.height ? { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height } : null; };
  const q = (s) => document.querySelector(s);
  const wrap = q('.board-canvas-wrap'); const canvas = q('.board-canvas');
  const cards = [...document.querySelectorAll('.board-canvas .board-box')].map((el) => ({ id: el.getAttribute('data-box-id'), r: R(el) })).filter((c) => !!c.r);
  return { wrap: R(wrap), canvas: R(canvas), canvasW: canvas ? canvas.offsetWidth : null, stage: R(q('.desk-frame-stage')), cards,
    sOpen: ${OPEN.tools}, tOpen: ${OPEN.tutor}, sTab: R(q('.wz-sliver-grip')), tTab: R(q('.wz-tutor-grip')), sPanel: R(q('.wz-sliver-panel')), tPanel: R(q('.wz-tutor-panel')),
    scrollW: wrap ? wrap.scrollWidth : null, clientW: wrap ? wrap.clientWidth : null }; })()`;
const cut = (r, box) => { if (!r || !box) return null; const l = Math.max(r.left, box.left), t = Math.max(r.top, box.top), rr = Math.min(r.right, box.right), b = Math.min(r.bottom, box.bottom); return rr - l > 0.5 && b - t > 0.5 ? { left: l, top: t, right: rr, bottom: b } : null; };
const hits = (a, b) => !!a && !!b && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
const drawerRects = (g) => [g.sOpen ? [g.sPanel, g.sTab] : [], g.tOpen ? [g.tPanel, g.tTab] : []].flat().filter(Boolean);
// D1: the cards' VISIBLE parts never meet an open drawer
const coverings = (g) => { const out = []; for (const c of g.cards) { const v = cut(c.r, g.wrap); if (!v) continue; for (const d of drawerRects(g)) if (hits(v, d)) out.push({ card: c.id, v, d }); } return out; };
const pred2 = (g, which) => !!g && !!g.wrap && (which === 'tools'
  ? g.sOpen && !!g.sTab && !!g.sPanel && near(g.sTab.right, g.wrap.left) && near(g.sPanel.right, g.sTab.left)
  : g.tOpen && !!g.tTab && !!g.tPanel && near(g.tTab.left, g.wrap.right) && near(g.tPanel.left, g.tTab.right));
const sizesOf = (g) => Object.fromEntries(g.cards.map((c) => [c.id, [Math.round(c.r.width * 10) / 10, Math.round(c.r.height * 10) / 10]]));
const sameSizes = (a, b) => { const A = sizesOf(a); const B = sizesOf(b); const ks = Object.keys(A); return ks.length > 0 && ks.length === Object.keys(B).length && ks.every((k) => !!B[k] && near(A[k][0], B[k][0], 0.5) && near(A[k][1], B[k][1], 0.5)); };

const openBoard = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas-wrap') && !!document.querySelector('.desk-frame-stage') && document.querySelectorAll('.board-canvas .board-box').length > 0", { label: id, timeout: 10000 });
  await sleep(900);
  return there;
};
const tabPoint = (app, which) => app.evalJs(`(() => { const b = document.querySelector(${J(TAB[which])}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const settled = (which) => `(() => { const l = document.querySelector(${J(SLIDE[which])}); return !l || getComputedStyle(l).transform === 'none'; })()`;
const press = async (app, which) => { const p = await tabPoint(app, which); if (!p) return false; await click(app, p.x, p.y); await sleep(250); await waitSoft(app, settled(which), { timeout: 2500 }); await sleep(400); return true; };
const setOpen = async (app, which, want) => { if ((await app.evalJs(OPEN[which])) !== want) await press(app, which); return (await app.evalJs(OPEN[which])) === want; };
const style = (app, id, css) => app.evalJs(css == null
  ? `(() => { document.getElementById(${J(id)})?.remove(); return true; })()`
  : `(() => { let s = document.getElementById(${J(id)}); if (!s) { s = document.createElement('style'); s.id = ${J(id)}; document.head.appendChild(s); } s.textContent = ${J(css)}; return true; })()`);

// page-size V's paint instrument: two screenshots decoded in the page, a mean/max diff over a rectangle
const PAINT = `(() => {
  window.__bLoad = async (b64) => { const img = new Image(); await new Promise((res) => { img.onload = res; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); window.__bPx = g.getImageData(0, 0, c.width, c.height); return [c.width, c.height]; };
  window.__bKeep = () => { window.__bPxA = window.__bPx; return !!window.__bPxA; };
  window.__bDiff = (x0, y0, x1, y1) => { const A = window.__bPxA; const P = window.__bPx; if (!A || !P || A.width !== P.width) return null; const W = P.width; const H = P.height;
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1)); if (x1 <= x0 || y1 <= y0) return null;
    let sum = 0, max = 0, n = 0; for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { const i = (y * W + x) * 4; for (let k = 0; k < 3; k += 1) { const d = Math.abs(A.data[i + k] - P.data[i + k]); sum += d; if (d > max) max = d; n += 1; } }
    return { mean: Math.round((sum / n) * 100) / 100, max }; };
  return true; })()`;
const VIG_HIDE = 'body::after { display:none !important; }';
const VIG_TOP = 'body::after { z-index:2147483647 !important; }';
const VIG_MEAN = 0.6;

const boxes = await dealThreeAct();
const dealtCards = boxes.filter((b) => b.kind === 'text').length;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const now = new Date().toISOString();
  for (const th of THEMES) await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: bid(th.id), text: '', pageType: 'board', boxes, createdAt: now, origin: null, source: null })})`);
  await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
  ok(`fixture: a dealt Three-Act (Novel) - ${dealtCards} cards from the real deck engine - seeded as one board per skin through the seams`, dealtCards === 9, J({ dealtCards, boxes: boxes.length }));

  for (const th of THEMES) {
    for (const tone of ['dark', 'light']) {
      await app.evalJs("location.hash = '#/'"); await sleep(300);
      await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}'); localStorage.setItem('wrizo-theme-prefs', ${J(J({ voice: 'serif', page: tone, fade: 'on' }))})`);
      await app.reload();
      await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
      const applied = await app.evalJs("document.documentElement.getAttribute('data-theme')");
      ok(`${th.name} ${tone} (premise): the skin is applied`, applied === th.id, String(applied));

      if (tone === 'light') {
        // ---- BAND (item 6): the light board's foot and lower corners, vignette shown vs hidden
        await app.emulateDpr(1, 1366, 768);
        const tag = `${th.name} light board 1366x768`;
        if (!(await openBoard(app, bid(th.id)))) { ok(`${tag} BAND fixture: the board opened`, false, ''); continue; }
        await setOpen(app, 'tutor', false); await setOpen(app, 'tools', false);
        await app.evalJs(PAINT);
        await app.mouseMove(5, 5); await app.evalJs('(() => { const a = document.activeElement; if (a && a.blur) a.blur(); return true; })()'); await sleep(300);
        const g = await app.evalJs(GEO); const vh = await app.evalJs('innerHeight');
        if (!g || !g.wrap) { ok(`${tag} BAND (premise): the board is measurable`, false, J(g)); continue; }
        const b = Math.min(g.wrap.bottom, vh) - 3;
        const strips = [[g.wrap.left + 3, b - 24, g.wrap.right - 3, b], [g.wrap.left + 3, b - 60, g.wrap.left + 63, b], [g.wrap.right - 63, b - 60, g.wrap.right - 3, b]];
        const diff = async (css) => {
          await sleep(200); await app.evalJs(`window.__bLoad(${J(await app.screenshot())})`); await app.evalJs('window.__bKeep()');
          await style(app, 'p10-vig', css); await sleep(250); await app.evalJs(`window.__bLoad(${J(await app.screenshot())})`); await style(app, 'p10-vig', null);
          return app.evalJs(`(${J(strips)}).map((s) => window.__bDiff(...s))`);
        };
        const shown = await diff(VIG_HIDE);
        ok(`${tag} BAND: no vignette band over the board - its foot and lower corners look the same with the vignette shown or hidden (mean diff <= ${VIG_MEAN})`,
          shown.every((d) => !!d && d.mean <= VIG_MEAN), J({ shown, wrap: g.wrap }));
        if (th.id === 'plateau') {
          await style(app, 'p10-vig-top', VIG_TOP); await sleep(250);
          const landed = await app.evalJs("getComputedStyle(document.body, '::after').zIndex");
          const onTop = await diff(VIG_HIDE);
          await style(app, 'p10-vig-top', null);
          ok(`MBAND (mutant): with the vignette forced ON TOP (LANDED: z-index ${landed}), the board's foot CHANGES when it is hidden - BAND fails`,
            landed === '2147483647' && !onTop.every((d) => !!d && d.mean <= VIG_MEAN), J({ onTop }));
        }
        continue;
      }

      // ---- D1-D5 (item 1), dark board, both sizes
      for (const [w, h] of SIZES) {
        const tag = `${th.name} ${w}x${h}`;
        await app.emulateDpr(1, w, h);
        if (!(await openBoard(app, bid(th.id)))) { ok(`${tag} fixture: the board opened`, false, ''); continue; }
        await setOpen(app, 'tutor', false); await setOpen(app, 'tools', false);
        const g0 = await app.evalJs(GEO);
        const roomL = g0.wrap && g0.stage ? g0.wrap.left - g0.stage.left : null; const roomR = g0.wrap && g0.stage ? g0.stage.right - g0.wrap.right : null;
        ok(`${tag} (premise): the board, its ${dealtCards} cards and both tabs are measurable, both drawers shut`, !!g0.wrap && g0.cards.length === dealtCards && !!g0.sTab && !!g0.tTab && !g0.sOpen && !g0.tOpen,
          J({ wrap: g0.wrap, cards: g0.cards.length, roomL, roomR }));
        await press(app, 'tools'); const g1 = await app.evalJs(GEO);
        await press(app, 'tutor'); const g2 = await app.evalJs(GEO);
        const both = roomL != null && roomL >= DRAWER_MIN && roomR >= DRAWER_MIN;
        // the Tutor alone, too (at 1366 it is the state the both-or-one rule leaves; at 1920 close the Tools to read it)
        if (g2.sOpen) await press(app, 'tools');
        const g3 = await app.evalJs(GEO);
        ok(`${tag} D5: both-or-one - ${both ? 'with 200px+ beside the board on each side BOTH stand' : 'with under 200px beside the board, opening the Tutor after the Tools CLOSES the Tools'} (${Math.round(roomL)} / ${Math.round(roomR)}px)`,
          !!g1.sOpen && !!g2.tOpen && (both ? g2.sOpen : !g2.sOpen), J({ roomL, roomR, after: { sOpen: g2.sOpen, tOpen: g2.tOpen } }));
        for (const [state, g] of [['Tools open', g1], ['Tools + Tutor (or the Tutor alone)', g2], ['the Tutor alone', g3]]) {
          const cov = coverings(g);
          ok(`${tag} D1 (${state}): no visible card meets an open drawer`, (g.sOpen || g.tOpen) && cov.length === 0, J({ covered: cov.slice(0, 3), wrap: g.wrap, sOpen: g.sOpen, tOpen: g.tOpen }));
        }
        ok(`${tag} D2 (Tools): the open drawer is flush to the board - its tab on the board's left edge, its panel against its tab`, pred2(g1, 'tools'), J({ wrap: g1.wrap, tab: g1.sTab, panel: g1.sPanel }));
        ok(`${tag} D2 (Tutor): the open drawer is flush to the board - its tab on the board's right edge, its panel against its tab`, pred2(g3, 'tutor'), J({ wrap: g3.wrap, tab: g3.tTab, panel: g3.tPanel }));
        ok(`${tag} D3: the cards are not re-laid - every card's size and the canvas's width identical shut and with each drawer open (the board narrows; its canvas does not)`,
          sameSizes(g0, g1) && sameSizes(g0, g2) && sameSizes(g0, g3) && g0.canvasW === g1.canvasW && g0.canvasW === g3.canvasW, J({ canvasW: [g0.canvasW, g1.canvasW, g2.canvasW, g3.canvasW] }));
        // D4: scrolled to its far side (the Tutor open, the narrowest board), the right-most card shows whole inside the board
        const reach = await app.evalJs(`(() => { const w = document.querySelector('.board-canvas-wrap'); if (!w) return null; w.scrollLeft = w.scrollWidth; const wr = w.getBoundingClientRect();
          const cs = [...document.querySelectorAll('.board-canvas .board-box')].map((el) => el.getBoundingClientRect()); const right = cs.reduce((m, r) => (r.right > m.right ? r : m), cs[0]);
          return right ? { cardLeft: right.left, cardRight: right.right, wrapLeft: wr.left, wrapRight: wr.right, scrollW: w.scrollWidth, clientW: w.clientWidth } : null; })()`);
        await app.evalJs("(() => { const w = document.querySelector('.board-canvas-wrap'); if (w) w.scrollLeft = 0; return true; })()");
        ok(`${tag} D4: every card stays reachable - scrolled to its far side, the narrowed board shows its right-most card whole`, !!reach && reach.cardLeft >= reach.wrapLeft - 0.5 && reach.cardRight <= reach.wrapRight + 0.5, J(reach));
        // MD1 (Arbor, 1366): the board's narrowing undone - its box forced back to the full width - D1 must fail
        if (th.id === 'plateau' && w === 1366) {
          await style(app, 'p10-md1', '.desk-frame-stage--board .board-area{ margin-left:0 !important; margin-right:0 !important; width:min(100%, 1100px) !important; }');
          await sleep(400);
          const gm = await app.evalJs(GEO);
          await style(app, 'p10-md1', null); await sleep(300);
          ok(`MD1 (mutant): with the board's narrowing undone (LANDED: the board ${g3.wrap && Math.round(g3.wrap.width)} -> ${gm.wrap && Math.round(gm.wrap.width)} wide), an open drawer covers cards - D1 fails`,
            !!gm.wrap && !!g3.wrap && gm.wrap.width > g3.wrap.width + 20 && coverings(gm).length > 0, J({ covered: coverings(gm).length, wrap: gm.wrap }));
        }
        await setOpen(app, 'tutor', false); await setOpen(app, 'tools', false);
      }
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-BOARD PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-BOARD VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-BOARD VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
