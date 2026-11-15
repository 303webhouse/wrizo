// BLUR-B (Nick's pick, Nov 14 5:29 pm; Fable's ruling 6:18 pm): the board behind a card's popup is blurred ONCE when the popup opens, then held still (components/board/blurSnapshot.ts, useBoardBlurSnap.ts; styles/09-board-card.css).
// What this holds, in Arbor (plateau), Flux and Machina, over the nine-card board:
//   BB1  the snapshot arrives: within 4 s of the card opening the wrap says data-blur="snap", its slot holds a canvas at least the wrap's size, the wrap's computed filter is NONE (the live blur is dropped: no double blur)
//        and its opacity is still the dim (< 0.7), the live board under it is hidden (visibility), the popup is up and the editor focused
//   BB2  held still: she types 12 keys; the same canvas node is still in the slot, data-blur still "snap", the live board still hidden (nothing re-blurs or re-paints under her)
//   BB3  nothing moves: the wrap's rect and a card's rect are the same before the card opens, while it is open (snapped) and after it closes (the Page-is-primary self-check: the board is not a writing surface, the rule is kept anyway)
//   BB4  closing gives the board back: data-blur gone, the slot empty, the live board visible again, no filter, no dim
//   BB5  FIDELITY: the snapshot looks like today's blur. Two viewport shots of the wrap, one snapped, one with TODAY'S live filter forced (a stylesheet), compared in the page: mean absolute difference per channel <= FID_MAX
//   BB6  the fallback: with the 2D context's `filter` missing (as in an older Safari) the snapshot is not made and the LIVE blur stays: data-blur absent, the wrap's filter includes blur (today's look, unchanged)
//   MUT  the mutants, each LANDED: MUT-blank (the snapshot canvas hidden: the board reads as blank under the popup) must push BB5 over FID_MAX; MUT-both-off (data-blur removed AND the live filter off) must make the shared
//        "is the board blurred" predicate (the one b3.mjs and fx4.mjs now use: a live filter OR a snapshot in the slot) read FALSE
// Seeding goes through the app's seams (window.wrizoCreateJournalPage, wrizoPatchEntry), never raw storage. No timing line: the speed check is blur-b-speed.mjs.
// Run: node scripts/harness/blur-b.mjs   (from apps/desktop)
import { withHarness } from '../runtime-verify.mjs';

const THEMES = ['plateau', 'flux', 'machina'];
const FID_MAX = 6, BLANK_MIN = 3;   // PROVISIONAL until the clipped light-and-dark reading (mean abs diff per channel, 0-255)
const TONES = ['dark', 'light'];
let measurable = 0, skins = 0;
const BOARD = 'bb-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const LIVE_CSS = ".board-blur-snap-slot{display:none!important}.board-canvas-blur-wrap[data-blur='snap']{filter:blur(6px)!important;transition:none!important}.board-canvas-blur-wrap[data-blur='snap'] > :not(.board-blur-snap-slot){visibility:visible!important}";

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
// the shared predicate (b3.mjs / fx4.mjs): the board behind a popup is blurred when its wrap carries the live filter OR holds the snapshot
const BLURRED = `(() => { const w = document.querySelector('.board-canvas-blur-wrap'); if (!w) return null; const cs = getComputedStyle(w); return (cs.filter !== 'none' && cs.filter.includes('blur')) || (w.getAttribute('data-blur') === 'snap' && !!w.querySelector('.board-blur-snap-slot > *')); })()`;
const STATE = `(() => { const w = document.querySelector('.board-canvas-blur-wrap'); if (!w) return null; const cs = getComputedStyle(w), r = w.getBoundingClientRect(), slot = w.querySelector('.board-blur-snap-slot'), cv = slot && slot.firstElementChild, card = document.querySelector('.board-box[data-box-id="bb-d"]');
  const first = w.firstElementChild, cr = card && card.getBoundingClientRect();
  return { dataBlur: w.getAttribute('data-blur'), filter: cs.filter, opacity: parseFloat(cs.opacity), cls: w.className, wrap: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10],
    card: cr ? [Math.round(cr.left * 10) / 10, Math.round(cr.top * 10) / 10, Math.round(cr.width * 10) / 10, Math.round(cr.height * 10) / 10] : null,
    canvas: cv ? { w: cv.width, h: cv.height, css: cv.style.width + 'x' + cv.style.height, lw: cv.offsetWidth, lh: cv.offsetHeight, tag: cv.tagName } : null, slotKids: slot ? slot.childElementCount : null, boardVisibility: first ? getComputedStyle(first).visibility : null,
    popup: !!document.querySelector('.board-popup-editor'), focused: !!document.querySelector('.board-popup-editor') && document.activeElement === document.querySelector('.board-popup-editor') }; })()`;
// the in-page pixel comparison of two PNG data URLs over a rect: mean absolute difference per channel
const DIFF = (a, b) => `(async () => { const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const A = await load('data:image/png;base64,' + ${JSON.stringify(a)}), B = await load('data:image/png;base64,' + ${JSON.stringify(b)});
  const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, w, h).data; x.clearRect(0, 0, w, h); x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, w, h).data;
  let s = 0, n = 0; for (let i = 0; i < da.length; i += 4) { s += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]); n += 3; }
  return Math.round((s / n) * 100) / 100; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };
  const rectOfWrap = () => ev("(() => { const r = document.querySelector('.board-canvas-blur-wrap').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()");

  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, 1366, 768);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Look B', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const openBoard = async (theme, extra = '', tone = 'dark') => {
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the board', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BOARD)}, { boxes: ${JSON.stringify(makeBoxes())} })`);
    await ev(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${JSON.stringify(tone)}, fade: 'on' }));`);
    await ev(`history.replaceState(null, '', '/#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"bb-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await sleep(900);
    if (extra) await ev(extra);
  };
  const openCard = async () => {
    const p = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"bb-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.4) }; })()");
    if (p) await app.doubleClick(p.x, p.y);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 5000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
  };
  const shot = async () => { const w = await rectOfWrap(); return (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, w.x), y: Math.max(0, w.y), width: w.w, height: w.h, scale: 1 } })).data; };

  for (const tone of TONES) for (const theme of THEMES) {
    const T = `${theme}/${tone}`;
    await openBoard(theme, '', tone);
    const before = await ev(STATE);
    await openCard();
    const snapped = await app.waitFor("document.querySelector('.board-canvas-blur-wrap')?.getAttribute('data-blur') === 'snap'", { timeout: 4000, label: 'the snapshot' }).then(() => true).catch(() => false);
    await sleep(700);
    const open = await ev(STATE);
    const wrapRect = await rectOfWrap();
    ok(`BB1 [${T}] the snapshot arrives within 4 s: data-blur="snap" (${open && open.dataBlur}), a canvas in the slot laid out at least the wrap's size (its layout ${open && open.canvas && open.canvas.css}, backing ${open && open.canvas && open.canvas.w}x${open && open.canvas && open.canvas.h}, vs ${Math.round(wrapRect.w)}x${Math.round(wrapRect.h)}), the live filter dropped (${open && open.filter}), the dim kept (${open && open.opacity}), the live board hidden (${open && open.boardVisibility}), the popup up and focused`,
      snapped && open && open.dataBlur === 'snap' && open.canvas && open.canvas.tag === 'IMG' && open.canvas.lw >= wrapRect.w && open.canvas.lh >= wrapRect.h && open.filter === 'none' && open.opacity < 0.7 && open.boardVisibility === 'hidden' && open.popup && open.focused, JSON.stringify(open));
    ok(`BB3 [${T}] nothing moves: the wrap's rect and the card's rect are the same before the card opens and while it is open and snapped`,
      JSON.stringify(before.wrap) === JSON.stringify(open.wrap) && JSON.stringify(before.card) === JSON.stringify(open.card), JSON.stringify({ before: [before.wrap, before.card], open: [open.wrap, open.card] }));

    // BB2: typing under the snapshot
    const nodeId = await ev("(() => { const c = document.querySelector('.board-blur-snap-slot > *'); if (!c) return null; window.__bbCanvas = c; return true; })()");
    await app.typeKeys('and then she lied');
    await sleep(500);
    const typed = await ev(STATE);
    const same = await ev("window.__bbCanvas === document.querySelector('.board-blur-snap-slot > *')");
    ok(`BB2 [${T}] held still: after 17 keys the same canvas node is in the slot (${same}), data-blur is still "snap" (${typed.dataBlur}), the live board is still hidden (${typed.boardVisibility})`, !!nodeId && same === true && typed.dataBlur === 'snap' && typed.boardVisibility === 'hidden' && typed.slotKids === 1, JSON.stringify(typed));

    // BB5: fidelity against TODAY'S live blur (the same open card, the same theme)
    await sleep(300);
    const snapShot = await shot();
    await ev(`(() => { const s = document.createElement('style'); s.id = '__livecss'; s.textContent = ${JSON.stringify(LIVE_CSS)}; document.head.appendChild(s); return true; })()`);
    await sleep(600);
    const liveShot = await shot();
    const diff = await ev(DIFF(snapShot, liveShot));
    await ev("(() => { const s = document.getElementById('__livecss'); if (s) s.remove(); return true; })()");
    await sleep(300);
    // MUT-blank: the snapshot canvas hidden (the board reads as blank under the popup): BB5's measure must go over FID_MAX
    await ev("(() => { const s = document.createElement('style'); s.id = '__mutblank'; s.textContent = '.board-blur-snap-slot > *{display:none!important}'; document.head.appendChild(s); return true; })()");
    await sleep(400);
    const blankShot = await shot();
    const blankDiff = await ev(DIFF(blankShot, liveShot));
    ok(`BB5 [${T}] FIDELITY (the board's own rect, snapshot against TODAY'S live blur): mean absolute difference ${diff} per channel (<= ${FID_MAX}) and closer to the live blur than a blank board is (${blankDiff}: needs ${diff} * 2 <= ${blankDiff})`, typeof diff === 'number' && typeof blankDiff === 'number' && diff <= FID_MAX && (blankDiff < BLANK_MIN || diff * 2 <= blankDiff), JSON.stringify({ diff, blankDiff }));
    skins += 1; if (blankDiff >= BLANK_MIN) measurable += 1;
    ok(`MUT-blank [${T}] with the snapshot canvas hidden the board reads ${blankDiff} against the live blur (the snapshot's own ${diff}): ${blankDiff >= BLANK_MIN ? 'measurable, at least twice the snapshot figure and at least ' + BLANK_MIN + ': BB5 would be RED' : 'EQUIVALENT here (a blank board reads the same as the blurred one in this skin: below ' + BLANK_MIN + '), counted below'}`, typeof blankDiff === 'number' && (blankDiff < BLANK_MIN || blankDiff >= 2 * diff), JSON.stringify({ blankDiff, diff }));
    await ev("(() => { const s = document.getElementById('__mutblank'); if (s) s.remove(); return true; })()");

    // MUT-both-off: data-blur removed AND the live filter off: the shared predicate must read false
    const predOn = await ev(BLURRED);
    await ev("(() => { const w = document.querySelector('.board-canvas-blur-wrap'); w.removeAttribute('data-blur'); const s = document.createElement('style'); s.id = '__mutoff'; s.textContent = '.board-canvas-blur-wrap{filter:none!important}'; document.head.appendChild(s); return true; })()");
    await sleep(300);
    const predOff = await ev(BLURRED);
    ok(`MUT-both-off [${T}] the predicate b3.mjs and fx4.mjs share ("the board is blurred": the live filter OR a snapshot in the slot) reads true as shipped (${predOn}) and FALSE with both off (${predOff})`, predOn === true && predOff === false, JSON.stringify({ predOn, predOff }));
    await ev("(() => { const s = document.getElementById('__mutoff'); if (s) s.remove(); return true; })()");

    // BB4: closing gives the board back (Escape closes the popup)
    await openBoard(theme, '', tone);
    await openCard();
    await app.waitFor("document.querySelector('.board-canvas-blur-wrap')?.getAttribute('data-blur') === 'snap'", { timeout: 4000, label: 'the snapshot again' }).catch(() => {});
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await sleep(900);
    let closed = await ev(STATE);
    if (closed && closed.popup) {   // Escape did not close it here: the popup's own close control
      await ev("(() => { const b = document.querySelector('.board-popup [aria-label*=\"lose\"], .board-popup-close, .board-popup .board-popup-x'); if (b) b.click(); })()");
      await sleep(900); closed = await ev(STATE);
    }
    ok(`BB4 [${T}] closing gives the board back: popup gone (${!closed.popup}), data-blur gone (${closed.dataBlur}), the slot empty (${closed.slotKids}), the live board visible (${closed.boardVisibility}), no filter (${closed.filter}), no dim (${closed.opacity}), the wrap and the card where they were`,
      !closed.popup && closed.dataBlur === null && closed.slotKids === 0 && closed.boardVisibility === 'visible' && closed.filter === 'none' && closed.opacity === 1 && JSON.stringify(closed.wrap) === JSON.stringify(before.wrap) && JSON.stringify(closed.card) === JSON.stringify(before.card), JSON.stringify(closed));
  }

  ok(`MUT-blank-power the fidelity measure can tell a snapshot from nothing in at least 4 of the ${skins} skins (${measurable} measurable; the others are dark boards on dark grounds where a blank board reads the same)`, skins === 6 && measurable >= 4, JSON.stringify({ skins, measurable }));

  // BB6: the fallback (no 2D-context filter): the live blur stays
  await openBoard('plateau', "(() => { try { delete window.SVGFEGaussianBlurElement; } catch (e) {} return typeof window.SVGFEGaussianBlurElement !== 'undefined'; })()");
  const hasFilter = await ev("typeof window.SVGFEGaussianBlurElement !== 'undefined'");
  await openCard();
  await sleep(2500);
  const fb = await ev(STATE);
  ok(`BB6 the fallback: with the SVG blur filter missing (premise: ${hasFilter ? 'STILL THERE' : 'gone'}) no snapshot is made (data-blur ${fb.dataBlur}, slot ${fb.slotKids}) and TODAY'S live blur stays (filter ${fb.filter}), the board visible (${fb.boardVisibility})`,
    hasFilter === false && fb.dataBlur === null && fb.slotKids === 0 && /blur/.test(fb.filter) && fb.boardVisibility === 'visible', JSON.stringify(fb));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBLUR-B VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBLUR-B VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
