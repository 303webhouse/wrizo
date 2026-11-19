// FOG-A (Nick, Nov 15, 6:36 pm; the Wrizors' look A, THE FOG): the board behind an open card has NO blur; the board's own paper colour lies over it at 80%, in every theme (styles/09-board-card.css: the board layer's own ::after, inside its .55 fade).
// Over the nine-card board, in Arbor (plateau), Flux and Machina, Page: Dark and Page: Light:
//   FA1  the fog is on: within 1 s of the card opening the wrap carries .board-canvas-blurred, its ::after is the board's paper colour (the computed colour of .board-canvas) at opacity >= 0.79 (it fades over .28 s), its z-index is above any card,
//        the wrap itself carries NO filter and NO dim (opacity 1), the layer takes no pointer; the popup is up and the editor focused. FOG PASS 1 (the Wrizors, Nov 16: "the .55 fade was left out"): the BOARD LAYER inside the wrap
//        (.board-canvas-dim) carries today's .55 fade. FOG PASS 3 (Nov 18: pass 2 NOT PASSED, light boards read about 146 against the drawn 95; pass 1's "veil on top" was wrong): the 80% veil is the board layer's OWN ::after, INSIDE
//        the fade, so the board and the veil fade to .55 together (FA1 reads the veil off .board-canvas-dim::after; the wrap carries no veil)
//   FA2  nothing moves: the wrap's rect and a card's rect are the same before the card opens and while it is open
//   FA3  closing gives the board back: the class is gone, the fog's opacity is 0 again (after its fade), the wrap is as it was
//   FA4  THE FOG IS 80%, MEASURED: a viewport pixel on a card (outside the popup), while it is open with the veil switched off (the faded board alone) and with it on: the share of the paper colour that lies over it is (open - faded) / ((1 - backdrop) * .55 * (paper - board)) per channel (the veil is inside the .55 fade): 0.75 to 0.85.
//        Only where the card and the paper differ by at least 30/255 in a channel (a card that IS the paper colour cannot show a fog); the run needs it measurable in at least 4 of the 6 skins
//   MUTANTS, each LANDED (the stylesheet is in the page and the measure changes): MUT-live (today's blur put back: filter blur(6px) and the dim, no fog) must make FA1's predicate FALSE; MUT-colour (a wrong fog colour) must make FA1's
//        colour check FALSE; MUT-nofog (the fog at opacity 0) must move the pixel FA4 reads; MUT-nodim (the board layer's fade removed: opacity 1) must make FA1's predicate FALSE; MUT-outside (FOG PASS 3: the veil put back on the wrap, outside the fade, pass 1's layering) must make FA1's predicate FALSE and the share leave 0.75-0.85
// Seeding goes through the app's seams (window.wrizoCreateJournalPage, wrizoPatchEntry), never raw storage. No timing line: the speed check is fog-a-speed.mjs.
// Run: node scripts/harness/fog-a.mjs   (from apps/desktop)
import { withHarness } from '../runtime-verify.mjs';

const THEMES = ['plateau', 'flux', 'machina'];
const TONES = ['dark', 'light'];
const BOARD = 'fog-board';
const SHARE_LO = 0.75, SHARE_HI = 0.85, CONTRAST_MIN = 30, DIM = 0.55;
// THE ROOM IS PINNED (Chat 1, Nov 19: 0c028eed read PASS 56 at 09:30Z and FAIL 2/56 [plateau/light] MUT-outside at 19:19Z, same bytes). Arbor's room (data-arbor2-room) follows the CLOCK, and the plateau skins' stage behind the board is the room's: at night it is
// dark (the veil-off pixel read [51,50,49] and the outside mutant moved the share to 2.07/2.23/2.51), by day it is the paper's own cream ([117,117,114], the outside mutant read 0.80/0.81/0.84, the same pixels as the inside veil), so the pixel half of MUT-outside is BLIND by day:
// the layering shows only where the paper is not the stage (see MUT-outside below). The harness pins the room with Arbor's test-only URL pin (flag.ts arbor2RoomPin: ?arbor2room=night, never stored), so the run no longer depends on the runner's hour; FA-ROOM reads that the pin took.
const ROOM = 'day';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
let measurable = 0, skins = 0, outLightMeasurable = 0, outLightLeft = 0;

const MUT = {
  live: ".board-canvas-blurred{filter:blur(6px)!important;opacity:.55!important}.board-canvas-blurred>.board-canvas-dim{opacity:1!important}.board-canvas-dim::after{opacity:0!important}",
  nodim: ".board-canvas-blurred>.board-canvas-dim{opacity:1!important}",
  colour: ".board-canvas-dim::after{background:#ff00ff!important}",
  nofog: ".board-canvas-dim::after{opacity:0!important}",
  // FOG PASS 3's mutant: the veil OUTSIDE the fade (pass 1's layering: the 80% veil on the wrap, over the faded board, not faded itself)
  outside: ".board-canvas-dim::after{opacity:0!important}.board-canvas-blurred::after{content:'';position:absolute;inset:0;background:var(--paper);opacity:.8;pointer-events:none;z-index:1000000000}",
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
const STATE = `(() => { const w = document.querySelector('.board-canvas-blur-wrap'); if (!w) return null; const cs = getComputedStyle(w), dm = w.querySelector(':scope > .board-canvas-dim'), af = getComputedStyle(dm || w, '::after'), paper = getComputedStyle(document.querySelector('.board-canvas')).backgroundColor, r = w.getBoundingClientRect(), card = document.querySelector('.board-box[data-box-id="bb-d"]'), cr = card && card.getBoundingClientRect();
  return { cls: w.className, filter: cs.filter, opacity: parseFloat(cs.opacity), dimOpacity: dm ? parseFloat(getComputedStyle(dm).opacity) : null, fogOpacity: parseFloat(af.opacity), fogColour: af.backgroundColor, paper, fogZ: af.zIndex, fogPointer: af.pointerEvents, room: document.documentElement.getAttribute('data-arbor2-room'), dayness: document.documentElement.getAttribute('data-arbor2-dayness'),
    wrap: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], card: cr ? [Math.round(cr.left * 10) / 10, Math.round(cr.top * 10) / 10, Math.round(cr.width * 10) / 10, Math.round(cr.height * 10) / 10] : null,
    popup: !!document.querySelector('.board-popup-editor'), focused: !!document.querySelector('.board-popup-editor') && document.activeElement === document.querySelector('.board-popup-editor') }; })()`;
const FOGGED = (s) => !!s && /board-canvas-blurred/.test(s.cls) && s.filter === 'none' && s.opacity === 1 && Math.abs(s.dimOpacity - 0.55) < 0.011 && s.fogOpacity >= 0.79 && s.fogColour === s.paper && Number(s.fogZ) >= 1000 && s.fogPointer === 'none';
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
    await ev(`history.replaceState(null, '', '/?arbor2room=${ROOM}#/page/${BOARD}')`);
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
  // the probe: the highest-contrast 3x3 block of card A (against the paper colour) in a screenshot taken BEFORE the card opens: the card's text ink, where every skin shows a difference from the paper
  const probe = async (paperRgb) => {
    const box = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"bb-a\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)), w: Math.round(r.width), h: Math.round(r.height) }; })()");
    if (!box || !paperRgb) return null;
    const shot = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } })).data;
    const at = await ev(`(async () => { const i = new Image(); await new Promise((res, rej) => { i.onload = res; i.onerror = rej; i.src = 'data:image/png;base64,' + ${JSON.stringify(shot)}; }); const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data, P = ${JSON.stringify(paperRgb)}; let best = -1, bx = 0, by = 0;
      for (let y = 1; y + 4 < cv.height; y += 3) for (let xx = 1; xx + 4 < cv.width; xx += 3) { let s = [0, 0, 0]; for (let dy = 0; dy < 3; dy += 1) for (let dx = 0; dx < 3; dx += 1) { const k = ((y + dy) * cv.width + xx + dx) * 4; s[0] += d[k]; s[1] += d[k + 1]; s[2] += d[k + 2]; } const dist = Math.abs(s[0] / 9 - P[0]) + Math.abs(s[1] / 9 - P[1]) + Math.abs(s[2] / 9 - P[2]); if (dist > best) { best = dist; bx = xx + 1; by = y + 1; } }
      return { x: bx, y: by, dist: Math.round(best) }; })()`);
    return { x: box.x + at.x, y: box.y + at.y, dist: at.dist };
  };
  const pixel = async (pt) => {
    const shot = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: pt.x - 1, y: pt.y - 1, width: 3, height: 3, scale: 1 } })).data;
    return ev(`(async () => { const i = new Image(); await new Promise((res, rej) => { i.onload = res; i.onerror = rej; i.src = 'data:image/png;base64,' + ${JSON.stringify(shot)}; }); const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data; const c = [0, 0, 0]; const n = d.length / 4; for (let k = 0; k < d.length; k += 4) { c[0] += d[k]; c[1] += d[k + 1]; c[2] += d[k + 2]; } return c.map((v) => Math.round(v / n)); })()`);
  };
  // base = the faded board alone UNDER the popup's backdrop (veil off), open = veil on, also under the backdrop (alpha b, black): open = (1-b)*s*paper + (1-s)*base, so s = (open - base) / ((1-b)*paper - base)
  // FOG PASS 3: the veil is INSIDE the fade, so the board and the veil fade to DIM together: open = (1-b) * DIM * ((1-s)*board + s*paper) + (1-b) * (1-DIM) * behind, and base (the veil off) = (1-b) * (DIM*board + (1-DIM)*behind);
  // so open - base = (1-b) * DIM * s * (paper - board), and s = (open - base) / ((1-b) * DIM * (paper - board)); board = the pixel before the card opened (no backdrop, no fade)
  const share = (base, open, paper, b, before) => { const out = []; for (let k = 0; k < 3; k += 1) { const gap = paper[k] - before[k]; if (Math.abs(gap) >= CONTRAST_MIN) out.push((open[k] - base[k]) / ((1 - b) * DIM * gap)); } return out; };
  const backdropAlpha = async () => { const c = await ev("(() => { const b = document.querySelector('.board-popup-backdrop'); return b ? getComputedStyle(b).backgroundColor : null; })()"); const m = /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/.exec(c || ''); return m ? Number(m[1]) : 0; };

  for (const tone of TONES) for (const theme of THEMES) {
    const T = `${theme}/${tone}`;
    await openBoard(theme, tone);
    const before = await ev(STATE);
    const pt = await probe(rgb(before.paper));
    const pxBefore = pt ? await pixel(pt) : null;
    await openCard();
    await sleep(900);
    const open = await ev(STATE);
    const pxOpen = pt ? await pixel(pt) : null;
    ok(`FA1 [${T}] the fog is on: .board-canvas-blurred (${open && /board-canvas-blurred/.test(open.cls)}), the fog layer is the board's paper colour (${open && open.fogColour} vs ${open && open.paper}) at opacity ${open && open.fogOpacity} (>= 0.79), z-index ${open && open.fogZ}, no pointer (${open && open.fogPointer}); the wrap has no filter (${open && open.filter}) and no dim (${open && open.opacity}); the board layer inside it carries the .55 fade (${open && open.dimOpacity}); the popup up and focused`,
      FOGGED(open) && open.popup && open.focused, JSON.stringify(open));
    ok(`FA-ROOM [${T}] the room premise: Arbor's room is pinned to ${ROOM} (read ${open && open.room}, dayness ${open && open.dayness}) in the plateau skins, so the stage behind the board does not follow the runner's clock`, theme !== 'plateau' || (!!open && open.room === ROOM && Number(open.dayness) === (ROOM === 'day' ? 1 : 0)), JSON.stringify({ room: open && open.room, dayness: open && open.dayness }));
    ok(`FA2 [${T}] nothing moves: the wrap's rect and the card's rect are the same before the card opens and while it is open`, JSON.stringify(before.wrap) === JSON.stringify(open.wrap) && JSON.stringify(before.card) === JSON.stringify(open.card), JSON.stringify({ before: [before.wrap, before.card], open: [open.wrap, open.card] }));
    // FA4: the fog is 80%, measured
    const paperRgb = rgb(open.paper), bAlpha = await backdropAlpha();
    // the faded board alone (the veil switched off): the baseline the veil's share is read from (the .55 fade lies under the veil, so "before the card opened" is no longer the layer the veil covers)
    await ev(`(() => { const s = document.createElement('style'); s.id = '__veiloff'; s.textContent = ${JSON.stringify(MUT.nofog)}; document.head.appendChild(s); return true; })()`);
    await sleep(600);
    const pxD = pt ? await pixel(pt) : null;
    await ev("(() => { const s = document.getElementById('__veiloff'); if (s) s.remove(); return true; })()");
    await sleep(500);
    const sh = pxBefore && pxD && pxOpen && paperRgb ? share(pxD, pxOpen, paperRgb, bAlpha, pxBefore) : [];
    skins += 1; if (sh.length) measurable += 1;
    ok(`FA4 [${T}] THE FOG IS 80%: a text-ink pixel of card A (contrast ${pt && pt.dist}) went ${JSON.stringify(pxBefore)} (open, veil off ${JSON.stringify(pxD)}) -> ${JSON.stringify(pxOpen)} under the paper colour ${JSON.stringify(paperRgb)} and the popup's backdrop (alpha ${bAlpha}): the share of paper over it ${sh.map((v) => v.toFixed(2)).join('/') || 'not measurable here (the card is the paper colour)'} (needs ${SHARE_LO} to ${SHARE_HI} in every channel that can show it)`,
      sh.length === 0 || sh.every((v) => v >= SHARE_LO && v <= SHARE_HI), JSON.stringify({ pxBefore, pxD, pxOpen, paperRgb, sh }));

    // the mutants, on the open card
    await ev(`(() => { const s = document.createElement('style'); s.id = '__mut'; s.textContent = ${JSON.stringify(MUT.live)}; document.head.appendChild(s); return true; })()`);
    await sleep(500);
    const liveSt = await ev(STATE);
    ok(`MUT-live [${T}] landed (the wrap filter ${liveSt.filter}, the dim ${liveSt.opacity}, the fog ${liveSt.fogOpacity}): the fog predicate reads FALSE with today's blur back`, !FOGGED(liveSt) && /blur/.test(liveSt.filter), JSON.stringify(liveSt));
    await ev("document.getElementById('__mut').textContent = " + JSON.stringify(MUT.colour));
    await sleep(500);
    const colSt = await ev(STATE);
    ok(`MUT-colour [${T}] landed (the fog colour ${colSt.fogColour} against the paper ${colSt.paper}): the fog predicate reads FALSE with a wrong colour`, colSt.fogColour !== colSt.paper && !FOGGED(colSt), JSON.stringify(colSt));
    await ev("document.getElementById('__mut').textContent = " + JSON.stringify(MUT.nodim));
    await sleep(500);
    const ndSt = await ev(STATE);
    ok(`MUT-nodim [${T}] landed (the board layer's fade ${ndSt.dimOpacity}, expected .55 without the mutant): the fog predicate reads FALSE with the .55 fade removed`, ndSt.dimOpacity === 1 && !FOGGED(ndSt), JSON.stringify(ndSt));
    await ev("document.getElementById('__mut').textContent = " + JSON.stringify(MUT.outside));
    await sleep(700);
    const outSt = await ev(STATE);
    const pxOut = pt ? await pixel(pt) : null;
    const shOut = pxBefore && pxD && pxOut && paperRgb ? share(pxD, pxOut, paperRgb, bAlpha, pxBefore) : [];
    // THE LAYERING CAN ONLY SHOW WHERE THE PAPER IS NOT THE STAGE: on a dark board the paper colour IS the colour behind the board (the page's dark stage), so a veil inside the fade and a veil outside it paint the same pixels (Actions 44339115644: flux/dark and
    // machina/dark read the share 0.80 and 0.77 under the mutant). That is the Wrizors' "dark boards must stay as they are now" in numbers. So the pixel half is judged on the LIGHT skins only (the dark ones are held by the predicate), and a power check below needs it to bite in them
    const left = shOut.length > 0 && shOut.some((v) => v < SHARE_LO || v > SHARE_HI);
    if (tone === 'light' && shOut.length > 0) { outLightMeasurable += 1; if (left) outLightLeft += 1; }
    ok(`MUT-outside [${T}] landed (the veil put back OUTSIDE the fade, on the wrap: the board layer's own veil ${outSt.fogOpacity}, its fade ${outSt.dimOpacity}): the predicate reads FALSE${tone === 'light' ? ` and, where measurable, the share (${shOut.map((v) => v.toFixed(2)).join('/') || 'not measurable'}) leaves ${SHARE_LO}-${SHARE_HI}` : ` (dark skin: the paper is the stage's own colour, so the layering cannot show in pixels; the share reads ${shOut.map((v) => v.toFixed(2)).join('/') || 'not measurable'} and is not judged)`}`,
      !FOGGED(outSt) && (tone !== 'light' || shOut.length === 0 || left), JSON.stringify({ outSt, pxOut, pxD, shOut }));
    await ev("document.getElementById('__mut').textContent = " + JSON.stringify(MUT.nofog));
    await sleep(600);
    const noSt = await ev(STATE);
    const pxNo = pt ? await pixel(pt) : null;
    const moved = pxOpen && pxNo ? Math.max(...pxOpen.map((v, k) => Math.abs(v - pxNo[k]))) : 0;
    ok(`MUT-nofog [${T}] landed (the fog opacity ${noSt.fogOpacity}): the predicate reads FALSE and, where measurable, the pixel FA4 reads moves (${moved}/255 against the veil on, needs >= 8)`, !FOGGED(noSt) && (sh.length === 0 || moved >= 8), JSON.stringify({ noSt, pxNo, pxOpen, moved }));
    await ev("(() => { const s = document.getElementById('__mut'); if (s) s.remove(); return true; })()");

    // FA3: close (Escape): the fog goes
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(900);
    let closed = await ev(STATE);
    if (closed && closed.popup) { await ev("(() => { const b = document.querySelector('.board-popup [aria-label*=\"lose\"], .board-popup-close, .board-popup .board-popup-x'); if (b) b.click(); })()"); await sleep(900); closed = await ev(STATE); }
    ok(`FA3 [${T}] closing gives the board back: popup gone (${!closed.popup}), the class gone (${!/board-canvas-blurred/.test(closed.cls)}), the fog opacity ${closed.fogOpacity} (0), no filter (${closed.filter}), the board layer back to full strength (${closed.dimOpacity}), the wrap and the card where they were`,
      !closed.popup && !/board-canvas-blurred/.test(closed.cls) && closed.fogOpacity === 0 && closed.filter === 'none' && closed.opacity === 1 && closed.dimOpacity === 1 && JSON.stringify(closed.wrap) === JSON.stringify(before.wrap) && JSON.stringify(closed.card) === JSON.stringify(before.card), JSON.stringify(closed));
  }
  ok(`MUT-outside-power the veil-outside mutant moved the share out of ${SHARE_LO}-${SHARE_HI} in every measurable LIGHT skin, and at least 2 of the 3 light skins were measurable (${outLightLeft} of ${outLightMeasurable} measurable left the range)`, outLightMeasurable >= 2 && outLightLeft === outLightMeasurable, JSON.stringify({ outLightMeasurable, outLightLeft }));
  ok(`FA4-power the measure can show a fog in at least 4 of the ${skins} skins (${measurable} measurable; the others have a card the colour of the paper)`, skins === 6 && measurable >= 4, JSON.stringify({ skins, measurable }));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFOG-A VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFOG-A VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
