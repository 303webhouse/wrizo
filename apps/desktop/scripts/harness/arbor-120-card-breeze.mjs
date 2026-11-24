// #120 (ARBOR, Nov 24; Fable's orders-nov24.md 10:33 am): "typing into a card's pop-up on an Arbor Board costs about 170-184 ms a key to paint by day (24 at
// night ...). It breaks the typing bar on Boards." FOUND (arbor-120-probe.mjs, runs 45462428088 / 45463631893 / 45464626805): by day the room's shade is r19's
// pergola (src/arbor2/pergola.ts), a live blurred SVG whose 115 leaves breeze (arbor2-breeze, 115 running animations by day, none by night). Nick's ruling B
// ("the leaves shiver only when she is not typing") cuts the live drawing to its still picture on <html data-wz-writing>, which ModeStage (a page) alone sets:
// typing in a Board card never cut it, so every key waited for the blurred shade's repaint.
// THE RULE THIS CHECKS: typing in a card's pop-up on an Arbor Board by day stills the shade as a page does, with nothing visible changing, and the breeze is back
// when she leaves the card.
//   P0  (premise) Arbor, the day room (pinned through arbor2/flag.ts's test pin, read back), the board drawn, the card's pop-up open and focused; at rest the
//       room's shade is drawn with its live drawing in style work (.arbor2-live content-visibility visible) and its breeze running
//   C1  after her keys, every shade layer (the room's and each copy) carries data-live-off and its live drawing is out of style work (content-visibility hidden)
//   C2  nothing visible changed in the shade: the room layer's opacity is its rest value (no writing fade) and its still picture shows (a bitmap, opacity > 0)
//   C3  every key reached the card (it grew by the keys typed)
//   C4  she leaves the card (Escape closes the pop-up): within a second the room's live drawing is back (no data-live-off, content-visibility visible)
//   T   (information; a timing line gates only on a box turn) Event Timing per key in the card, day, keys 2..N: median / p95, beside the same keys by night
//   MUT-cardCut  the fix's input hook made blind in the BUILT bundle (its '.board-popup-editor' look in pergola's input listener matches nothing): it LANDS
//                (one anchor) and C1 goes RED
// Run: node scripts/harness/arbor-120-card-breeze.mjs (from apps/desktop; Actions or a box turn)
import { withHarness } from '../runtime-verify.mjs';

const { isOnBox, timingGate } = await import('../lib/timing-gate.mjs');
const KEYS = 24, GAP = 90;
const VIEW = [1920, 1080];
const BOARD = 'a120-breeze';
const DAY = '/?arbor2=1&arbor2room=day', NIGHT = '/?arbor2=1&arbor2room=night';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });
const ON_BOX = isOnBox();
const timing = (name, pass, detail = '') => { const g = timingGate(ON_BOX, pass); checks.push({ name: g.info ? `${name} [INFORMATION on Actions: the measure ${g.actual ? 'PASSED' : 'did NOT pass'}; this line gates nothing here]` : name, pass: g.pass, detail }); };
const stat = (xs) => { const s = (xs || []).filter((x) => x != null).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, med: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
// the mutant: pergola's input listener looks for the card's editor with e.target.closest('.board-popup-editor') (the only target.closest() of that class in the bundle)
const MUTANTS = { cardCut: [/target\.closest\("\.board-popup-editor"\)\)return;/g, 'target.closest(".board-popup-editor-MUT"))return;'] };
const countOf = (re, t) => (t.match(re) || []).length;

const makeBoxes = () => {
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  return [T('b-a', 0.05, 0.05, 1, 'Card A'), T('b-b', 0.5, 0.05, 2, 'Card B'), T('b-d', 0.5, 0.4, 3, 'Card D'), T('b-e', 0.05, 0.75, 4, 'Card E'),
    { id: 'b-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 2400 }];
};
const SHADE = `(() => { const room = document.querySelector('.arbor2-pergola'), live = room && room.querySelector('.arbor2-live'), still = room && room.querySelector('.arbor2-still');
  const layers = [...document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh')].filter((l) => getComputedStyle(l).display !== 'none');
  return { room: room ? getComputedStyle(room).display : null, roomOpacity: room ? getComputedStyle(room).opacity : null,
    live: live ? getComputedStyle(live).contentVisibility : null, stillOpacity: still ? getComputedStyle(still).opacity : null, stillImg: still ? /url\\(/.test(getComputedStyle(still).backgroundImage) : false,
    breeze: room ? room.getAnimations({ subtree: true }).filter((a) => a.animationName === 'arbor2-breeze' && a.playState === 'running').length : 0,
    layers: layers.map((l) => ({ c: l.className, off: l.getAttribute('data-live-off'), live: l.querySelector('.arbor2-live') ? getComputedStyle(l.querySelector('.arbor2-live')).contentVisibility : 'none' })),
    room2: document.documentElement.getAttribute('data-arbor2-room'), theme: document.documentElement.getAttribute('data-theme') }; })()`;

let mutant = null;
const landed = {};
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/*.js', requestStage: 'Response' }] });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      if (mutant) { const [re, to] = MUTANTS[mutant]; const n = countOf(re, text); if (n) landed[mutant] = (landed[mutant] || 0) + n; if (n === 1) text = text.replace(re, to); }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* gone */ } }
  });
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'light', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  const seeded = await ev(`!!window.wrizoCreateJournalPage(${J({ id: BOARD, text: 'Breeze 120', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);

  // open the board in a room, the card's pop-up open and focused, at rest
  const openCard = async (url) => {
    await ev("location.hash = '#/'"); await sleep(300);
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${J(BOARD)}, { boxes: ${J(makeBoxes())} })`);
    await ev(`history.replaceState(null, '', ${J(url)} + '#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"b-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await sleep(1500);
    const b = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"b-d\"]'); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
    await sleep(500);
    const b2 = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"b-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
    if (b2 || b) { const r = b2 || b; await app.doubleClick(Math.round(r.l + r.w * 0.5), Math.round(r.t + r.h * 0.4)); }
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    await sleep(1500);
  };
  // her keys in the card, each read by Event Timing (keydown -> the next paint)
  const typeKeys = async (n) => {
    const before = await ev("(() => { const e = document.querySelector('.board-popup-editor'); return e ? e.textContent.length : -1; })()");
    await ev("(() => { window.__et = []; if (window.__p120Off) window.__p120Off(); const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'keydown') window.__et.push(e.duration); }); po.observe({ type: 'event', durationThreshold: 16, buffered: false }); window.__p120Off = () => po.disconnect(); return true; })()");
    const word = 'the leaves hold still while she writes ';
    for (let i = 0; i < n; i += 1) { await app.typeKeys(word[i % word.length]); await sleep(GAP); }
    await sleep(500);
    const after = await ev("(() => { const e = document.querySelector('.board-popup-editor'); return e ? e.textContent.length : -1; })()");
    const et = await ev("(() => { const x = window.__et.slice(); if (window.__p120Off) window.__p120Off(); return x; })()");
    return { grew: after - before, et };
  };

  // ---- by day
  await openCard(DAY);
  const rest = await ev(SHADE);
  ok('P0 (premise) Arbor in the day room (read back), the card\'s pop-up open and focused, and at rest the room\'s shade drawn with its live drawing in style work and its breeze running',
    seeded && rest.theme === 'plateau' && rest.room2 === 'day' && rest.room === 'block' && rest.live === 'visible' && rest.breeze > 0 && (await ev("document.activeElement === document.querySelector('.board-popup-editor')")), rest);
  const day = await typeKeys(KEYS);
  const typing = await ev(SHADE);
  const c1 = typing.layers.length > 0 && typing.layers.every((l) => l.off === 'true' && l.live !== 'visible');
  ok(`C1 after her keys in the card every shade layer is cut to its still picture (data-live-off, its live drawing content-visibility hidden): ${typing.layers.length} layer(s)`, c1, typing.layers);
  ok(`C2 nothing visible changed in the shade: the room's opacity is its rest value (${rest.roomOpacity} -> ${typing.roomOpacity}, no writing fade) and its still picture shows (a bitmap, opacity ${typing.stillOpacity})`,
    typing.roomOpacity === rest.roomOpacity && typing.stillImg && parseFloat(typing.stillOpacity) > 0, { rest, typing });
  ok(`C3 every key reached the card (it grew by ${day.grew} of ${KEYS})`, day.grew === KEYS, day);
  await app.key('Escape');
  await sleep(1000);
  const left = await ev(SHADE);
  const gone = await ev("!document.querySelector('.board-popup-editor')");
  ok('C4 she leaves the card (Escape closes the pop-up) and within a second the room\'s live drawing is back (no data-live-off, content-visibility visible) with its breeze running',
    gone && left.layers.length > 0 && left.layers.every((l) => l.off !== 'true') && left.live === 'visible' && left.breeze > 0, { gone, left });

  // ---- by night, the same keys (the floor, information)
  await openCard(NIGHT);
  const night = await typeKeys(KEYS);
  const sd = stat(day.et.slice(1)), sn = stat(night.et.slice(1));
  console.log(`T120 Event Timing keydown keys 2..${KEYS} (ms): day n ${sd.n} med ${sd.med} p95 ${sd.p95} max ${sd.max} | night n ${sn.n} med ${sn.med} p95 ${sn.p95} max ${sn.max}`);
  timing(`T the card by day paints a key as the card by night does: day median ${sd.med} <= night ${sn.med} + 16, p95 ${sd.p95} <= night ${sn.p95} + 24`, sd.n >= KEYS - 4 && sn.n >= KEYS - 4 && sd.med <= sn.med + 16 && sd.p95 <= sn.p95 + 24, { sd, sn });

  // ---- the mutant: the card hook blind in the built bundle -> C1 goes red
  mutant = 'cardCut'; landed.cardCut = 0;
  let mres = { pass: true, detail: '' };
  try {
    await openCard(DAY);
    await typeKeys(6);
    const m = await ev(SHADE);
    mres = { pass: m.layers.length > 0 && m.layers.every((l) => l.off === 'true' && l.live !== 'visible'), detail: J(m.layers) };
  } catch (e) { mres = { pass: false, detail: 'threw ' + String(e.message || e).slice(0, 160) }; }
  mutant = null;
  ok(`MUT-cardCut (the card's input hook blind in the built bundle): the mutant LANDED (${landed.cardCut} anchor) and C1 goes RED`, landed.cardCut === 1 && mres.pass === false, `landed ${landed.cardCut}; ${mres.detail}`);
}); } catch (e) { ok('the run reached its end', false, String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ')); }

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 1600)}`);
const EXPECTED = 7;
const failed = checks.filter((c) => !c.pass);
console.log(failed.length || checks.length !== EXPECTED ? `\nARBOR-120-CARD-BREEZE VERIFY: FAIL - ${failed.length}/${checks.length} failed${checks.length !== EXPECTED ? ` (expected ${EXPECTED} checks)` : ''}` : `\nARBOR-120-CARD-BREEZE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length || checks.length !== EXPECTED ? 1 : 0);
