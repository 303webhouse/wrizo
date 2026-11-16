// FOG-A (Nick, Nov 15, 6:36 pm; the Wrizors' look A, THE FOG): the board behind an open card has NO blur; the board's own paper colour lies over it at 80%, in every theme (styles/09-board-card.css: the wrap's ::after).
// Over the nine-card board, in Arbor (plateau), Flux and Machina, Page: Dark and Page: Light:
//   FA1  the fog is on: within 1 s of the card opening the wrap carries .board-canvas-blurred, its ::after is the board's paper colour (the computed colour of .board-canvas) at opacity >= 0.79 (it fades over .28 s), its z-index is above any card,
//        the wrap itself carries NO filter and NO dim (opacity 1), the layer takes no pointer; the popup is up and the editor focused
//   FA2  nothing moves: the wrap's rect and a card's rect are the same before the card opens and while it is open
//   FA3  closing gives the board back: the class is gone, the fog's opacity is 0 again (after its fade), the wrap is as it was
//   FA4  THE FOG IS 80%, MEASURED: a viewport pixel on a card (outside the popup), before the card opens and while it is open: the share of the paper colour that lies over it is (open - before) / (paper - before) per channel: 0.75 to 0.85.
//        Only where the card and the paper differ by at least 30/255 in a channel (a card that IS the paper colour cannot show a fog); the run needs it measurable in at least 4 of the 6 skins
//   MUTANTS, each LANDED (the stylesheet is in the page and the measure changes): MUT-live (today's blur put back: filter blur(6px) and the dim, no fog) must make FA1's predicate FALSE; MUT-colour (a wrong fog colour) must make FA1's
//        colour check FALSE; MUT-nofog (the fog at opacity 0) must make FA4's share leave 0.75-0.85
// Seeding goes through the app's seams (window.wrizoCreateJournalPage, wrizoPatchEntry), never raw storage. No timing line: the speed check is fog-a-speed.mjs.
// Run: node scripts/harness/fog-a.mjs   (from apps/desktop)
import { withHarness } from '../runtime-verify.mjs';

const THEMES = ['plateau', 'flux', 'machina'];
const TONES = ['dark', 'light'];
const BOARD = 'fog-board';
const SHARE_LO = 0.75, SHARE_HI = 0.85, CONTRAST_MIN = 30;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
let measurable = 0, skins = 0;

const MUT = {
  live: ".board-canvas-blurred{filter:blur(6px)!important;opacity:.55!important}.board-canvas-blur-wrap::after,.board-canvas-blurred::after{opacity:0!important}",
  colour: ".board-canvas-blurred::after{background:#ff00ff!important}",
  nofog: ".board-canvas-blurred::after{opacity:0!important}",
};
const makeBoxes = () => {
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [
    T('bb-a', 0.05, 0.05, 1, 'The opening: she arrives at the house after dark and finds the door already open.'), T('bb-b', 0.5, 0.05, 2, 'What she wants'),
    T('bb-c', 0.05, 0.4, 3, 'The hall, the stairs, the smell of woodsmoke'), T('bb-d', 0.5, 0.4, 4, 'The middle: she tells the lie'),
    T('bb-e', 0.05, 0.75, 5, 'Card E'), T('bb-f', 0.5, 0.75, 6, 'Card F, the turn'), T('bb-g', 0.75, 0.4, 7, 'Card G, no link'), T('bb-h', 0.75, 0.05, 8, 'The hook'),
    L('bb-ac', 'bb-a', 'bb-c', 10), L('bb-bd', 'bb-b', 'bb-d', 11), L('bb-ef', 'bb-e', 'bb-f', 12),
  ];
};
// the page's reading of the wrap and its fog
const STATE = `(() => { const w = document.querySelector('.board-canvas-blur-wrap'); if (!w) return null; const cs = getComputedStyle(w), af = getComputedStyle(w, '::after'), paper = getComputedStyle(document.querySelector('.board-canvas')).backgroundColor, r = w.getBoundingClientRect(), card = document.querySelector('.board-box[data-box-id="bb-d"]'), cr = card && card.getBoundingClientRect();
  return { cls: w.className, filter: cs.filter, opacity: parseFloat(cs.opacity), fogOpacity: parseFloat(af.opacity), fogColour: af.backgroundColor, paper, fogZ: af.zIndex, fogPointer: af.pointerEvents,
    wrap: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], card: cr ? [Math.round(cr.left * 10) / 10, Math.round(cr.top * 10) / 10, Math.round(cr.width * 10) / 10, Math.round(cr.height * 10) / 10] : null,
    popup: !!document.querySelector('.board-popup-editor'), focused: !!document.querySelector('.board-popup-editor') && document.activeElement === document.querySelector('.board-popup-editor') }; })()`;
const FOGGED = (s) => !!s && /board-canvas-blurred/.test(s.cls) && s.filter === 'none' && s.opacity === 1 && s.fogOpacity >= 0.79 && s.fogColour === s.paper && Number(s.fogZ) >= 1000 && s.fogPointer === 'none';
const rgb = (s) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s || ''); return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null; };

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };

  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, 1366, 768);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Fog', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const openBoard = async (theme, tone) => {
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the board', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BOARD)}, { boxes: ${JSON.stringify(makeBoxes())} })`);
    await ev(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${JSON.stringify(tone)}, fade: 'on' }));`);
    await ev(`history.replaceState(null, '', '/#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"bb-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await sleep(900);
  };
  const openCard = async () => {
    const p = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"bb-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.4) }; })()");
    if (p) await app.doubleClick(p.x, p.y);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 5000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
  };
  // a pixel of the viewport on a card OUTSIDE the popup (the card's top-left corner area, inside the card), as [r, g, b]
  const probe = () => ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"bb-a\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + 14), y: Math.round(r.bottom - 12) }; })()");
  const pixel = async (pt) => {
    const shot = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: pt.x - 2, y: pt.y - 2, width: 5, height: 5, scale: 1 } })).data;
    return ev(`(async () => { const i = new Image(); await new Promise((res, rej) => { i.onload = res; i.onerror = rej; i.src = 'data:image/png;base64,' + ${JSON.stringify(shot)}; }); const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data; const c = [0, 0, 0]; const n = d.length / 4; for (let k = 0; k < d.length; k += 4) { c[0] += d[k]; c[1] += d[k + 1]; c[2] += d[k + 2]; } return c.map((v) => Math.round(v / n)); })()`);
  };
  const share = (before, open, paper) => { const out = []; for (let k = 0; k < 3; k += 1) { const span = paper[k] - before[k]; if (Math.abs(span) >= CONTRAST_MIN) out.push((open[k] - before[k]) / span); } return out; };

  for (const tone of TONES) for (const theme of THEMES) {
    const T = `${theme}/${tone}`;
    await openBoard(theme, tone);
    const before = await ev(STATE);
    const pt = await probe();
    const pxBefore = pt ? await pixel(pt) : null;
    await openCard();
    await sleep(900);
    const open = await ev(STATE);
    const pxOpen = pt ? await pixel(pt) : null;
    ok(`FA1 [${T}] the fog is on: .board-canvas-blurred (${open && /board-canvas-blurred/.test(open.cls)}), the fog layer is the board's paper colour (${open && open.fogColour} vs ${open && open.paper}) at opacity ${open && open.fogOpacity} (>= 0.79), z-index ${open && open.fogZ}, no pointer (${open && open.fogPointer}); the wrap has no filter (${open && open.filter}) and no dim (${open && open.opacity}); the popup up and focused`,
      FOGGED(open) && open.popup && open.focused, JSON.stringify(open));
    ok(`FA2 [${T}] nothing moves: the wrap's rect and the card's rect are the same before the card opens and while it is open`, JSON.stringify(before.wrap) === JSON.stringify(open.wrap) && JSON.stringify(before.card) === JSON.stringify(open.card), JSON.stringify({ before: [before.wrap, before.card], open: [open.wrap, open.card] }));
    // FA4: the fog is 80%, measured
    const paperRgb = rgb(open.paper);
    const sh = pxBefore && pxOpen && paperRgb ? share(pxBefore, pxOpen, paperRgb) : [];
    skins += 1; if (sh.length) measurable += 1;
    ok(`FA4 [${T}] THE FOG IS 80%: a card pixel went ${JSON.stringify(pxBefore)} -> ${JSON.stringify(pxOpen)} under the paper colour ${JSON.stringify(paperRgb)}: the share of paper over it ${sh.map((v) => v.toFixed(2)).join('/') || 'not measurable here (the card is the paper colour)'} (needs ${SHARE_LO} to ${SHARE_HI} in every channel that can show it)`,
      sh.length === 0 || sh.every((v) => v >= SHARE_LO && v <= SHARE_HI), JSON.stringify({ pxBefore, pxOpen, paperRgb, sh }));

    // the mutants, on the open card
    await ev(`(() => { const s = document.createElement('style'); s.id = '__mut'; s.textContent = ${JSON.stringify(MUT.live)}; document.head.appendChild(s); return true; })()`);
    await sleep(500);
    const liveSt = await ev(STATE);
    ok(`MUT-live [${T}] landed (the wrap filter ${liveSt.filter}, the dim ${liveSt.opacity}, the fog ${liveSt.fogOpacity}): the fog predicate reads FALSE with today's blur back`, !FOGGED(liveSt) && /blur/.test(liveSt.filter), JSON.stringify(liveSt));
    await ev("document.getElementById('__mut').textContent = " + JSON.stringify(MUT.colour));
    await sleep(500);
    const colSt = await ev(STATE);
    ok(`MUT-colour [${T}] landed (the fog colour ${colSt.fogColour} against the paper ${colSt.paper}): the fog predicate reads FALSE with a wrong colour`, colSt.fogColour !== colSt.paper && !FOGGED(colSt), JSON.stringify(colSt));
    await ev("document.getElementById('__mut').textContent = " + JSON.stringify(MUT.nofog));
    await sleep(600);
    const noSt = await ev(STATE);
    const pxNo = pt ? await pixel(pt) : null;
    const shNo = pxBefore && pxNo && paperRgb ? share(pxBefore, pxNo, paperRgb) : [];
    ok(`MUT-nofog [${T}] landed (the fog opacity ${noSt.fogOpacity}): the predicate reads FALSE and, where measurable, the share (${shNo.map((v) => v.toFixed(2)).join('/') || 'not measurable'}) leaves ${SHARE_LO}-${SHARE_HI}`, !FOGGED(noSt) && (shNo.length === 0 || shNo.some((v) => v < SHARE_LO)), JSON.stringify({ noSt, pxNo, shNo }));
    await ev("(() => { const s = document.getElementById('__mut'); if (s) s.remove(); return true; })()");

    // FA3: close (Escape): the fog goes
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(900);
    let closed = await ev(STATE);
    if (closed && closed.popup) { await ev("(() => { const b = document.querySelector('.board-popup [aria-label*=\"lose\"], .board-popup-close, .board-popup .board-popup-x'); if (b) b.click(); })()"); await sleep(900); closed = await ev(STATE); }
    ok(`FA3 [${T}] closing gives the board back: popup gone (${!closed.popup}), the class gone (${!/board-canvas-blurred/.test(closed.cls)}), the fog opacity ${closed.fogOpacity} (0), no filter (${closed.filter}), the wrap and the card where they were`,
      !closed.popup && !/board-canvas-blurred/.test(closed.cls) && closed.fogOpacity === 0 && closed.filter === 'none' && closed.opacity === 1 && JSON.stringify(closed.wrap) === JSON.stringify(before.wrap) && JSON.stringify(closed.card) === JSON.stringify(before.card), JSON.stringify(closed));
  }
  ok(`FA4-power the measure can show a fog in at least 4 of the ${skins} skins (${measurable} measurable; the others have a card the colour of the paper)`, skins === 6 && measurable >= 4, JSON.stringify({ skins, measurable }));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFOG-A VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFOG-A VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
