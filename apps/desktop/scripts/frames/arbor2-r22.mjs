// ARBOR v2 MOCKUP, ROUND r22 - as named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor2-r22.mjs).
// Source: Nick's walk of the play server (Nov 8), his notes relayed by Fable the same day:
//   2. "On a Board, the Tutor drawer opens INSIDE the board; it must open at the surface's edge, as on the Page."
//   4. "The day sage logo is nearly invisible: darker green, >= 3:1 vs the day room; before/after frames."
//   5. "Splash: the flow chart cycles faster and ONLY the arrows animate (orange = the writer's acts)."
//   7. "Enter drops a block, the screen fades, but the Tools strip's tabs stayed. Rule: tabs follow their drawer."
// and Fable's rulings on notes 1 and 3 (Nov 8): 1. "while Typewriter is on, Arbor's page draws no fill or edge of its own; the words sit on the
//   room's ground under the lamplight glow; the text floors hold, measured on the room; leaving restores the page exactly." 3. "ALL night-room
//   browns step darker together (the room ground, rails, panels, the dark page), keeping the lamplight's warm gradient. Three steps."
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R22 <screen> {...}"). Seeds go through window.wrizo*.
// Pictures (-pic-) are for the eye: the board with each drawer open, the corner logo by day before and after, the splash mid-run.
import { guarded } from './mockup-kit.mjs';
import { zoomProof, holeOf, stopsOf } from './arbor2.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-R22 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R22-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { if (a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); } catch {} }); return true; })()";
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const DRAWER_MIN = 200;   // store/menusDrawers.ts: below this margin a drawer overlays, on the Page and now on the Board
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(700); };
const caretEnd = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()";
const key = async (app, k, code, vk, text) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text, unmodifiedText: text } : {}) });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};
const go = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const openPage = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300); await go(app, `#/page/${id}`);
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 10000 }))) fail('R22-OPEN-PAGE', { id, editor: false });
  await sleep(900);
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
  await app.mouseMove(600, 300); await sleep(700);
};
const openBoard = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'R22 board', pageType: 'board', boxes: [{ id: `${id}-box`, kind: 'text', x: 0.62, y: 0.12, w: 0.34, h: 0.16, z: 1, text: 'A card near the right edge' }], createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
  await sleep(300); await go(app, `#/page/${id}`);
  if (!(await waitSoft(app, "!!document.querySelector('.board-canvas-wrap, .board-canvas')", { label: 'board', timeout: 10000 }))) fail('R22-OPEN-BOARD', { id, board: false });
  await sleep(1200); await app.mouseMove(600, 300); await sleep(500);
};
// the board's rect, the stage's, and every visible drawer panel's (the board area is what useBoardBox sizes; the wrap is what Tutor.tsx measures)
const BOARD = `(() => { const rr = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, r: Math.round(r.right * 10) / 10, t: Math.round(r.top), w: Math.round(r.width * 10) / 10 }; };
  const wrap = document.querySelector('.board-canvas-wrap') || document.querySelector('.board-canvas'); const stage = document.querySelector('.desk-frame-stage');
  const vis = (s) => [...document.querySelectorAll(s)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 4 && getComputedStyle(e).visibility !== 'hidden'; }) || null;
  const tp = document.querySelector('.wz-tutor-panel'), sp = document.querySelector('.wz-sliver-panel');
  const slideR = tp && tp.querySelector('.wz-drawer-slide'), slideL = sp && sp.querySelector('.wz-drawer-slide');
  return { wrap: rr(wrap), stage: rr(stage), tutor: tp ? { open: tp.getAttribute('data-open'), panel: rr(tp), slide: rr(slideR) } : null, tools: sp ? { open: sp.getAttribute('data-open'), panel: rr(sp), slide: rr(slideL) } : null,
    boardL: stage ? stage.style.getPropertyValue('--board-l') : null, boardR: stage ? stage.style.getPropertyValue('--board-r') : null, card: rr(vis('.board-box')) }; })()`;
const same = (a, b) => !!a && !!b && Math.abs(a.l - b.l) <= 0.5 && Math.abs(a.r - b.r) <= 0.5 && Math.abs(a.w - b.w) <= 0.5;
// effective opacity (the element's times every ancestor's; display:none / visibility:hidden = 0)
const EFF = "const eff = (e) => { if (!e) return null; let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= Number(cs.opacity); } return Math.round(o * 100) / 100; };";

// ── r22 notes 1 and 3 (Fable's rulings, Nov 8) ──
const clickMode = async (app, word) => {
  const hit = await app.evalJs(`(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(word)}); if (b) b.click(); return !!b; })()`);
  if (!hit) fail('R22-MODE', { word, found: false });
  await sleep(1200);
};
const openFree = async (app, id) => {
  await openPage(app, id); await clickMode(app, 'free write');
  if (!(await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 6000 }))) fail('R22-OPEN-FREE', { id, zoomed: false });
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
  await app.mouseMove(600, 300); await sleep(700);
};
const openTools = async (app) => { await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(300); };
// the page as drawn (for "leaving restores the page exactly")
const PAGEREAD = `(() => { const p = document.querySelector('.mode-page'), ed = document.querySelector('.forward-only-editor'); if (!p || !ed) return null; const cs = getComputedStyle(p), r = p.getBoundingClientRect();
  return { bg: cs.backgroundColor, shadow: cs.boxShadow, ink: getComputedStyle(ed).color, zoom: p.closest('.mode-pagecol')?.getAttribute('data-zoom') ?? null,
    rect: { l: Math.round(r.left * 10) / 10, r: Math.round(r.right * 10) / 10, w: Math.round(r.width * 10) / 10 } }; })()`;
// the mockup bar's Night browns row, pressed as Nick would (the bar opens if it is folded); true when the step's button reads pressed afterwards
const pickBrown = (app, s) => app.evalJs(`(async () => { const word = ${JSON.stringify({ now: 'Now', a: 'A', b: 'B', c: 'C' })}[${JSON.stringify(s)}];
  const head = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => h.textContent.trim() === 'Arbor mockup'); if (head && head.getAttribute('aria-expanded') !== 'true') { head.click(); await new Promise((r) => setTimeout(r, 100)); }
  const row = document.querySelector('.arbor2-bar-row[aria-label="Night browns"]'); const b = row && [...row.querySelectorAll('.arbor2-bar-opt')].find((x) => x.textContent.trim() === word);
  if (!b) return false; b.click(); await new Promise((r) => setTimeout(r, 150)); return b.getAttribute('aria-pressed') === 'true'; })()`);
// every token the steps move, as computed (the values as the stylesheet writes them)
const BROWNREAD = `(() => { const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim().toUpperCase();
  const room = {}; for (const n of ['--ink-950', '--ink-900', '--ink-800', '--ink-border', '--ink-border-strong', '--arbor2-bar', '--arbor2-bar-line']) room[n] = v(n);
  const page = {}; for (const n of ['--paper', '--paper-dim', '--paper-border']) page[n] = v(n);
  const sp = document.querySelector('.wz-sliver-panel');
  return { room, page, glow: cs.getPropertyValue('--lamp-glow').trim(), drawer: sp ? getComputedStyle(sp).getPropertyValue('--desk-ground').trim().toUpperCase() : null,
    tone: document.documentElement.getAttribute('data-page'), brown: document.documentElement.getAttribute('data-arbor2-brown') }; })()`;
const parseHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const contrast = (a, b) => { const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const L = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
  const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// the four steps, as styles/arbor-v2.css writes them (Now = today's palette; A / B / C = OKLab L -.02 / -.04 / -.06 on every night brown)
const BROWNS = {
  now: {"room":{"--ink-950":"#120A06","--ink-900":"#1B120C","--ink-800":"#261A12","--ink-border":"#3A2A1C","--ink-border-strong":"#4A3726","--arbor2-bar":"#241912","--arbor2-bar-line":"#35271C"},"glow":["#2E1D0E","#20140B","#170E08","#120A06"],"drawer":"#2E2118","page":{"--paper":"#1A1510","--paper-dim":"#150F0B","--paper-border":"#3A2D22"}},
  a: {"room":{"--ink-950":"#0D0704","--ink-900":"#160E09","--ink-800":"#20160F","--ink-border":"#342519","--ink-border-strong":"#443222","--arbor2-bar":"#1F150E","--arbor2-bar-line":"#2F2218"},"glow":["#28190B","#1A1008","#120A06","#0D0704"],"drawer":"#281D14","page":{"--paper":"#15110C","--paper-dim":"#100B08","--paper-border":"#34281E"}},
  b: {"room":{"--ink-950":"#080402","--ink-900":"#110A06","--ink-800":"#1B120B","--ink-border":"#2E2115","--ink-border-strong":"#3E2D1F","--arbor2-bar":"#19110B","--arbor2-bar-line":"#291E15"},"glow":["#221509","#150C06","#0D0704","#080402"],"drawer":"#231811","page":{"--paper":"#100C09","--paper-dim":"#0B0705","--paper-border":"#2F241A"}},
  c: {"room":{"--ink-950":"#050201","--ink-900":"#0C0604","--ink-800":"#160D08","--ink-border":"#281C12","--ink-border-strong":"#38291B","--arbor2-bar":"#140C08","--arbor2-bar-line":"#241911"},"glow":["#1C1006","#100804","#080402","#050201"],"drawer":"#1D140D","page":{"--paper":"#0C0806","--paper-dim":"#070403","--paper-border":"#291F17"}}};

const screens = {
  // ── 2. THE BOARD KEEPS ITS RECT; EACH DRAWER OPENS AT ITS EDGE (flush where the margin holds a drawer, over it where it does not, as on the Page)
  'r22-board-drawers': async (app) => {
    await openBoard(app, 'arbor-r22-board'); await setRoom(app, 'day');
    const shut = await app.evalJs(BOARD);
    if (!shut.wrap || !shut.stage) fail('R22-BOARD-DRAWERS', { blind: true, shut });
    const margin = Math.round((shut.stage.r - shut.wrap.r) * 10) / 10, marginL = Math.round((shut.wrap.l - shut.stage.l) * 10) / 10;
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900); await app.evalJs(FINISH); await sleep(200);
    const tut = await app.evalJs(BOARD);
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900); await app.evalJs(FINISH);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); await app.evalJs(FINISH); await sleep(200);
    const tools = await app.evalJs(BOARD);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); await app.evalJs(FINISH);
    const back = await app.evalJs(BOARD);
    const tutorVisL = tut.tutor && tut.tutor.slide ? tut.tutor.slide.l : null, toolsVisR = tools.tools && tools.tools.slide ? tools.tools.slide.r : null;
    const ok = {
      tutorOpened: !!tut.tutor && tut.tutor.open === 'true', toolsOpened: !!tools.tools && tools.tools.open === 'true',
      boardStillWithTutor: same(shut.wrap, tut.wrap), boardStillWithTools: same(shut.wrap, tools.wrap), boardBack: same(shut.wrap, back.wrap),
      // where the margin holds a drawer it stands at the board's edge, never over it; where it does not, it overlays (the Page's rule)
      tutorAtEdge: margin >= DRAWER_MIN ? tutorVisL !== null && Math.abs(tutorVisL - shut.wrap.r) <= 2 : tutorVisL !== null,
      toolsAtEdge: marginL >= DRAWER_MIN + 60 ? toolsVisR !== null && Math.abs(toolsVisR - shut.wrap.l) <= 2 : toolsVisR !== null,
    };
    const data = { ok, margin, marginL, shut: shut.wrap, withTutor: tut.wrap, tutorSlide: tut.tutor && tut.tutor.slide, withTools: tools.wrap, toolsSlide: tools.tools && tools.tools.slide, vars: [tut.boardL, tut.boardR, tools.boardL, tools.boardR], win: await app.evalJs('[innerWidth, innerHeight]') };
    if (Object.values(ok).some((x) => !x)) fail('R22-BOARD-DRAWERS', data);
    say('r22-board-drawers', data);
  },
  'r22-pic-board-tutor': async (app) => { await openBoard(app, 'arbor-r22-pbt'); await setRoom(app, 'day'); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900); await app.evalJs(FINISH); },
  'r22-pic-board-tutor-night': async (app) => { await openBoard(app, 'arbor-r22-pbtn'); await setRoom(app, 'night'); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900); await app.evalJs(FINISH); },
  'r22-pic-board-tools': async (app) => { await openBoard(app, 'arbor-r22-pbl'); await setRoom(app, 'day'); await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); await app.evalJs(FINISH); },

  // ── 7. TABS FOLLOW THEIR DRAWER: Enter (any key) fades the open Tools drawer and its folder tabs together; Esc brings both back
  'r22-tabs-follow': async (app) => {
    await openPage(app, 'arbor-r22-tabs'); await setRoom(app, 'day');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); await app.evalJs(FINISH); await sleep(200);
    const R = `(() => { ${EFF} const tabs = document.querySelector('.arbor2-c2--left'), panel = document.querySelector('.wz-sliver-panel');
      return { tabs: tabs ? { op: eff(tabs), pe: getComputedStyle(tabs).pointerEvents, n: tabs.querySelectorAll('.wz-drawer-tab').length } : null, panel: panel ? { op: eff(panel), open: panel.getAttribute('data-open') } : null,
        writing: document.documentElement.getAttribute('data-wz-writing') }; })()`;
    const rest = await app.evalJs(R);
    await app.evalJs(caretEnd); await key(app, 'Enter', 'Enter', 13, '\r'); await sleep(300); await key(app, 'w', 'KeyW', 87, 'w');
    await sleep(3500); await app.evalJs(FINISH); await sleep(200);
    const wr = await app.evalJs(R);
    // PARKED 2026-11-08 (SUPERSEDED - Actions frames 42522633708, 4 of 4 red on this line only: Esc returns the chrome AND closes the open Tools
    // drawer, so the tabs rightly left with it (back: tabs at 0, taking the pointer again - not writing). The return that keeps the drawer open is
    // the writer reaching for the chrome: the pointer resting at the top edge, as the walk drives it). Original, verbatim:
    // await key(app, 'Escape', 'Escape', 27); await sleep(1500); await app.evalJs(FINISH); await sleep(200);
    // SUCCESSOR: the edge dwell brings the chrome back with the drawer still open (panel and tabs both return); then Esc closes the drawer and
    // the tabs go with it (they follow their drawer that way too).
    const [W] = await app.evalJs('[innerWidth, innerHeight]'); const x = Math.round(W * 0.5);
    await app.mouseMove(x, 300); await sleep(60); for (let i = 0; i < 8; i++) { await app.mouseMove(x + (i % 2 ? 2 : -2), 18); await sleep(90); }
    await sleep(1500); await app.evalJs(FINISH); await sleep(200);
    const back = await app.evalJs(R);
    await key(app, 'Escape', 'Escape', 27); await sleep(1200); await app.evalJs(FINISH); await sleep(200);
    const shut = await app.evalJs(R);
    const ok = {
      seen: !!rest.tabs && rest.tabs.n >= 2 && rest.tabs.op === 1 && !!rest.panel && rest.panel.open === 'true' && rest.panel.op === 1,
      writing: wr.writing === 'true',
      panelFaded: !!wr.panel && wr.panel.op === 0,
      tabsFollow: !!wr.tabs && wr.tabs.op === 0 && wr.tabs.pe === 'none',
      // PARKED 2026-11-08 (SUPERSEDED - as the Esc line above: it read the return after Esc, which closes the drawer). Original, verbatim:
      // returned: back.writing !== 'true' && !!back.tabs && back.tabs.op === 1 && !!back.panel && back.panel.op === 1,
      // SUCCESSOR: after the edge dwell, the drawer still open and both back at full
      returned: back.writing !== 'true' && !!back.tabs && back.tabs.op === 1 && back.tabs.pe !== 'none' && !!back.panel && back.panel.open === 'true' && back.panel.op === 1,
      closedTogether: !!shut.panel && shut.panel.open !== 'true' && !!shut.tabs && shut.tabs.op === 0,
    };
    if (Object.values(ok).some((x) => !x)) fail('R22-TABS-FOLLOW', { ok, back, shut, wr: wr.tabs });
    say('r22-tabs-follow', { ok, back, shut, wr: wr.tabs });
  },

  // ── 4. THE DAY LOGO, DARKER: the corner mark's ink as drawn (at .7) against the plaster around it, read from the screen, >= 3:1
  'r22-day-logo': async (app) => {
    await openPage(app, 'arbor-r22-logo'); await setRoom(app, 'day');
    await app.evalJs("document.documentElement.setAttribute('data-arbor2-off', ((document.documentElement.getAttribute('data-arbor2-off') || '') + ' shadows').trim())"); await sleep(500);
    const m = await app.evalJs(`(() => { const e = [...document.querySelectorAll('.brand-mark')].find((x) => x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(), a = getComputedStyle(e, '::after');
      return { rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], op: Number(getComputedStyle(e).opacity), dayImg: a.backgroundImage, dayOp: Number(a.opacity), room: document.documentElement.getAttribute('data-arbor2-room') }; })()`);
    if (!m) fail('R22-DAY-LOGO', { mark: false });
    const png = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
    const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode(); const dpr = img.width / innerWidth;
      const [x, y, w, h] = ${JSON.stringify(m.rect)}.map((v) => Math.round(v * dpr)); const c = document.createElement('canvas'); c.width = w; c.height = h; const cx = c.getContext('2d'); cx.drawImage(img, -x, -y);
      const d = cx.getImageData(0, 0, w, h).data; const cnt = new Map(); const at = (i) => d[i] + ',' + d[i + 1] + ',' + d[i + 2];
      for (let i = 0; i < w; i++) { for (const j of [0, h - 1]) { const k = at((j * w + i) * 4); cnt.set(k, (cnt.get(k) || 0) + 1); } }
      const g = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const L = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
      const ink = new Map(); let inked = 0;
      for (let i = 0; i < d.length; i += 4) { const p = [d[i], d[i + 1], d[i + 2]]; if (Math.max(...p.map((v, k) => Math.abs(v - g[k]))) < 24) continue; inked++; const q = p.map((v) => Math.round(v / 6) * 6).join(','); ink.set(q, (ink.get(q) || 0) + 1); }
      const top = [...ink.entries()].sort((a, b) => b[1] - a[1])[0]; const t = top ? top[0].split(',').map(Number) : null;
      const ratio = t ? (Math.max(L(t), L(g)) + 0.05) / (Math.min(L(t), L(g)) + 0.05) : null;
      return { ground: g, ink: t, inked, ratio: ratio ? Math.round(ratio * 100) / 100 : null }; })()`);
    const ok = { dayRoom: m.room === 'day', file: /wrizo-logo-day-green-all\.png/.test(m.dayImg) && m.dayOp === 1, drawnAt7: Math.abs(m.op - 0.7) < 0.01, seen: px.inked >= 200, contrast: px.ratio !== null && px.ratio >= 3 };
    if (Object.values(ok).some((x) => !x)) fail('R22-DAY-LOGO', { ok, m, px });
    say('r22-day-logo', { ok, m, px });
  },
  // before / after, the same corner, the same room (before = the r21 sage copy put back for this frame only)
  'r22-pic-logo-day-before': async (app) => { await openPage(app, 'arbor-r22-plb'); await setRoom(app, 'day'); await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = \":root[data-arbor2][data-theme='plateau'] .brand-mark::after{ background-image:url('/brand/arbor2/wrizo-logo-sage-all.png') !important; }\"; document.head.appendChild(s); return true; })()"); await sleep(500); },
  'r22-pic-logo-day-after': async (app) => { await openPage(app, 'arbor-r22-pla'); await setRoom(app, 'day'); await sleep(500); },

  // ── 5. THE SPLASH: only the arrows animate (the five stage outlines never light), and the run is faster (the arrows done in <= 1.5 s)
  'r22-splash-arrows': async (app) => {
    // PARKED 2026-11-08 (SUPERSEDED - Actions frames 42522633708, 4 of 4 red: a requestAnimationFrame sampler during the page's load got 5-10
    // samples, so it never saw an arrow start or finish (first/done null) while the frames show the arrows drawn; the instrument, not the app.
    // It also read only the splash, and the front door's own finished drawing (Arrival.tsx, the same mark `reduced`) still lit the outlines -
    // the app fix is in SplashMark.tsx). Original, verbatim:
    // const SAMPLER = `(() => { const t0 = performance.now(); window.__r22 = { outlinesMax: 0, first: null, done: null, edges: 0, sketchDone: null, samples: 0 };
      // const tick = () => { const s = window.__r22; const svg = document.querySelector('.wz-splash .wz-splash-arbor');
        // if (svg) { s.samples++; const st = [...svg.querySelectorAll('g[data-stage]')]; st.forEach((g) => { const o = Number(getComputedStyle(g).opacity); if (o > s.outlinesMax) s.outlinesMax = o; });
          // const ps = [...svg.querySelectorAll('mask path')]; s.edges = ps.length; const offs = ps.map((p) => Number(getComputedStyle(p).strokeDashoffset.replace('px', '')));
          // const now = Math.round(performance.now() - t0); if (s.first === null && offs.some((v) => v < 0.98)) s.first = now; if (s.done === null && ps.length && offs.every((v) => v <= 0.001)) s.done = now; }
        // const f = window.wrizoArborFront; if (f && f.sketchDone && s.sketchDone === null) s.sketchDone = Math.round(f.sketchDone - t0);
        // if (performance.now() - t0 < 12000) requestAnimationFrame(tick); };
      // requestAnimationFrame(tick); })();`;
    // const { identifier } = await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: SAMPLER });
    // try {
      // await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      // await waitSoft(app, "!!window.__r22 && window.__r22.done !== null", { label: 'arrows done', timeout: 15000 }); await sleep(1500);
    // } finally { await app.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier }).catch(() => {}); }
    // const s = await app.evalJs('window.__r22');
    // const run = s && s.first !== null && s.done !== null ? s.done - s.first : null;
    // const ok = { sampled: !!s && s.samples > 20 && s.edges === 6, outlinesNeverLight: !!s && s.outlinesMax === 0, arrowsDrew: !!s && s.first !== null && s.done !== null, faster: run !== null && run <= 1500 };
    // if (Object.values(ok).some((x) => !x)) fail('R22-SPLASH-ARROWS', { ok, s, run });
    // say('r22-splash-arrows', { ok, s, run });
    // SUCCESSOR: read the plan, not the paint. From document start a 16 ms interval (not a frame callback) records the six arrows' own animation
    // timings (delay + duration, already scaled) the moment they exist, the stage outlines' animation count and their highest opacity; then,
    // with the splash gone, the front door's finished drawing: every arrow drawn, every outline still at 0 (cream).
    const SAMPLER = `(() => { const t0 = performance.now(); window.__r22b = { plan: null, outlineAnims: 0, outlinesMax: 0, samples: 0 };
      const iv = setInterval(() => { const s = window.__r22b; const svg = document.querySelector('.wz-splash .wz-splash-arbor'); if (!svg) { if (performance.now() - t0 > 12000) clearInterval(iv); return; }
        s.samples++; const st = [...svg.querySelectorAll('g[data-stage]')]; st.forEach((g) => { const o = Number(getComputedStyle(g).opacity); if (o > s.outlinesMax) s.outlinesMax = o; s.outlineAnims = Math.max(s.outlineAnims, g.getAnimations().length); });
        const ps = [...svg.querySelectorAll('mask path')];
        if (!s.plan && ps.length === 6 && ps.every((p) => p.getAnimations().length)) s.plan = ps.map((p) => { const t = p.getAnimations()[0].effect.getTiming(); return [Math.round(Number(t.delay)), Math.round(Number(t.duration))]; });
        if (performance.now() - t0 > 12000) clearInterval(iv); }, 16); })();`;
    const { identifier } = await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: SAMPLER });
    try {
      await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      await waitSoft(app, '!!window.__r22b && !!window.__r22b.plan', { label: 'the arrows planned', timeout: 15000 });
      await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }); await sleep(800);
    } finally { await app.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier }).catch(() => {}); }
    const s = await app.evalJs('window.__r22b');
    const door = await app.evalJs("(() => { const svg = document.querySelector('.arbor2-front-mark .wz-splash-arbor'); if (!svg) return null; return { outlines: [...svg.querySelectorAll('g[data-stage]')].map((g) => Number(getComputedStyle(g).opacity)), arrows: [...svg.querySelectorAll('mask path')].map((p) => Number(getComputedStyle(p).strokeDashoffset.replace('px', ''))) }; })()");
    const span = s && s.plan ? Math.max(...s.plan.map(([d, u]) => d + u)) - Math.min(...s.plan.map(([d]) => d)) : null;
    const ok = { planned: !!s && !!s.plan && s.plan.length === 6 && s.samples > 0, outlinesNeverAnimate: !!s && s.outlineAnims === 0 && s.outlinesMax === 0,
      faster: span !== null && span <= 1500, doorArrowsDrawn: !!door && door.arrows.length === 6 && door.arrows.every((v) => v <= 0.001), doorOutlinesCream: !!door && door.outlines.length === 5 && door.outlines.every((o) => o === 0) };
    if (Object.values(ok).some((x) => !x)) fail('R22-SPLASH-ARROWS', { ok, span, s, door });
    say('r22-splash-arrows', { ok, span, s, door });
  },
  // PARKED 2026-11-08 (SUPERSEDED - Actions frames 42523455219: the frames job refuses any frame while the opening splash is on screen ("the
  // opening splash is still on screen"), so a mid-run splash picture cannot be a frames-job screen). Original, verbatim:
  // // mid-run: the arrows part-drawn in brass, every stage outline still Nick's cream
  // 'r22-pic-splash-mid': async (app) => {
    // await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
    // // PARKED 2026-11-08 (SUPERSEDED - Actions frames 42522633708: the 100 ms poll missed the ~1.1 s run, so the frame was the finished front door,
    // // not mid-run). Original, verbatim:
    // // await waitSoft(app, "(() => { const ps = [...document.querySelectorAll('.wz-splash .wz-splash-arbor mask path')]; return ps.length === 6 && ps.some((p) => Number(getComputedStyle(p).strokeDashoffset.replace('px', '')) <= 0.001) && ps.some((p) => Number(getComputedStyle(p).strokeDashoffset.replace('px', '')) > 0.5); })()", { label: 'mid-run', timeout: 10000 });
    // // await app.evalJs("document.getAnimations().forEach((a) => { try { a.pause(); } catch {} }); true");
    // // SUCCESSOR: as soon as the six arrows' animations exist, pause every animation and set the splash's to the run's middle moment (all six
    // // start together, so one currentTime is one moment; the delays are inside it).
    // await waitSoft(app, "(() => { const ps = [...document.querySelectorAll('.wz-splash .wz-splash-arbor mask path')]; return ps.length === 6 && ps.every((p) => p.getAnimations().length); })()", { label: 'arrows planned', timeout: 10000 });
    // const mid = await app.evalJs("(() => { document.getAnimations().forEach((a) => { try { a.pause(); } catch {} }); const as = [...document.querySelectorAll('.wz-splash .wz-splash-arbor mask path')].map((p) => p.getAnimations()[0]); const t = as.map((a) => a.effect.getTiming()); const lo = Math.min(...t.map((x) => Number(x.delay))), hi = Math.max(...t.map((x) => Number(x.delay) + Number(x.duration))); const m = (lo + hi) / 2; as.forEach((a) => { a.currentTime = m; }); return { lo, hi, m }; })()");
    // say('r22-pic-splash-mid', { mid });
  // },
  // SUCCESSOR: the mid-run splash is seen in the box recording (scripts/frames/arbor2-walk.mjs step 1, every frame, day and night, both sizes), and
  // r22-splash-arrows above reads its plan and the front door's finished drawing.
  // ── 1. TYPEWRITER ON THE ROOM (Fable's ruling 1, Nov 8: "while Typewriter is on, Arbor's page draws no fill or edge of its own; the words sit on
  // the room's ground under the lamplight glow; the text floors hold, measured on the room; leaving restores the page exactly"). The page opens in
  // Draft (read), goes to Free Write (Typewriter's zoom), then back to Draft (read again). Per room, zoomed:
  //   proof   zoomProof V7 (scripts/frames/arbor2.mjs): no sheet, the page bare, the room's shade unbroken over it, the words the room's ink, and by
  //           day no slat on the prose or the count
  //   floor   the words' ink against the room's own PIXELS (a screenshot) in the writing band - the page's margin either side of the prose, from
  //           the writing line to 1.4 lines below it, where the band is whole - >= 13.9 at every sample (the page-text floor, docs/MAP.md)
  //   caret   by day the caret is the ink (the dark page's brass is 2:1 on plaster)
  //   back    Draft again: the page's background, shadow, ink and rect exactly as before Free Write
  'r22-typewriter': async (app) => {
    const out = {};
    for (const room of ['night', 'day']) {
      await openPage(app, `arbor-r22-tw-${room}`); await setRoom(app, room);
      const before = await app.evalJs(PAGEREAD);
      await clickMode(app, 'free write');
      const zoomed = await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 6000 });
      if (!zoomed) fail('R22-TYPEWRITER', { room, zoomed: false });
      await app.evalJs(caretEnd); await sleep(900);
      const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
      // PARKED 2026-11-08 (SUPERSEDED - Actions frames 42537140287, 4 of 4 red on "floor": the instrument read the page's MARGINS, not the ground
      // under the words - its worst night and day samples, 8 px inside the page's right edge, were the page's scrollbar thumb (#B9AA8C / #6B5F4E,
      // the low ink); it also caught the day pergola crossing the bare page, a real miss fixed in paper.ts). Original, verbatim:
      // const m = await app.evalJs(`(() => { const col = document.querySelector('.mode-pagecol'), p = col.querySelector('.mode-page'), ed = p.querySelector('.forward-only-editor');
        // const pr = p.getBoundingClientRect(), er = ed.getBoundingClientRect(), cr = col.getBoundingClientRect();
        // const lh = parseFloat(getComputedStyle(col).getPropertyValue('--tw-lh')) || 43.52, y0 = cr.top + cr.height * 0.5;
        // const xs = [pr.left + 8, (pr.left + er.left) / 2, er.left - 8, er.right + 8, (er.right + pr.right) / 2, pr.right - 8].filter((x) => x > pr.left && x < pr.right && (x < er.left - 2 || x > er.right + 2));
        // return { xs, ys: [-0.1, 0.3, 0.7, 1.1, 1.4].map((k) => y0 + k * lh), ink: getComputedStyle(ed).color, caret: getComputedStyle(ed).caretColor, page: document.documentElement.getAttribute('data-page') }; })()`);
      // const png = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
      // const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode(); const dpr = img.width / innerWidth;
        // const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
        // const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const L = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
        // const ink = ${JSON.stringify(m.ink)}.match(/\\d+/g).slice(0, 3).map(Number);
        // const rows = []; for (const y of ${JSON.stringify(m.ys)}) for (const x of ${JSON.stringify(m.xs)}) { const d = cx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data; const g = [d[0], d[1], d[2]];
          // rows.push({ x: Math.round(x), y: Math.round(y), g, r: Math.round(((Math.max(L(ink), L(g)) + 0.05) / (Math.min(L(ink), L(g)) + 0.05)) * 100) / 100 }); }
        // const min = rows.reduce((a, b) => (b.r < a.r ? b : a), rows[0]);
        // return { n: rows.length, min, grounds: [...new Set(rows.map((q) => q.g.join(',')))].slice(0, 6) }; })()`);
      // SUCCESSOR: the ground UNDER THE WORDS. For one screenshot the words (and the caret) are made transparent - the page, the room, the glow,
      // the vignette and the pergola stay as they are - and the ground is read on a grid across the words' own column (the editor's rect, 8 x 5)
      // in the writing band, from the writing line to 1.4 lines below it, where the band is whole. The words' ink against every sample >= 13.9.
      const m = await app.evalJs(`(() => { const col = document.querySelector('.mode-pagecol'), p = col.querySelector('.mode-page'), ed = p.querySelector('.forward-only-editor');
        const er = ed.getBoundingClientRect(), cr = col.getBoundingClientRect(), pr = p.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(col).getPropertyValue('--tw-lh')) || 43.52, y0 = cr.top + cr.height * 0.5;
        const l = Math.max(er.left, pr.left) + 4, r = Math.min(er.right, pr.right - 24) - 4;
        return { xs: Array.from({ length: 8 }, (_, i) => l + (r - l) * i / 7), ys: [0, 0.35, 0.7, 1.05, 1.4].map((k) => y0 + k * lh), ink: getComputedStyle(ed).color, caret: getComputedStyle(ed).caretColor, page: document.documentElement.getAttribute('data-page') }; })()`);
      await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'r22-tw-hide'; s.textContent = '.forward-only-editor, .forward-only-editor *{ color:transparent !important; caret-color:transparent !important; -webkit-text-fill-color:transparent !important; }'; document.head.appendChild(s); return true; })()");
      await sleep(250);
      const png = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
      await app.evalJs("document.getElementById('r22-tw-hide')?.remove()");
      const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode(); const dpr = img.width / innerWidth;
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const L = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
        const ink = ${JSON.stringify(m.ink)}.match(/\d+/g).slice(0, 3).map(Number);
        const rows = []; for (const y of ${JSON.stringify(m.ys)}) for (const x of ${JSON.stringify(m.xs)}) { const d = cx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data; const g = [d[0], d[1], d[2]];
          rows.push({ x: Math.round(x), y: Math.round(y), g, r: Math.round(((Math.max(L(ink), L(g)) + 0.05) / (Math.min(L(ink), L(g)) + 0.05)) * 100) / 100 }); }
        const min = rows.reduce((a, b) => (b.r < a.r ? b : a), rows[0]);
        return { n: rows.length, min, grounds: [...new Set(rows.map((q) => q.g.join(',')))].slice(0, 6) }; })()`);
      await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
      await clickMode(app, 'draft'); await sleep(1200);
      const after = await app.evalJs(PAGEREAD);
      const back = !!before && !!after && before.bg === after.bg && before.shadow === after.shadow && before.ink === after.ink && same(before.rect, after.rect) && after.zoom !== 'true';
      out[room] = { ok: { proof: !!z && z.pass, floor: px.n >= 10 && px.min.r >= 13.9, caret: room === 'night' || m.caret === m.ink, back },
        z: z && { noSheet: z.noSheet, bare: z.bare, unbroken: z.unbroken, inkOk: z.inkOk, sunEdge: z.sunEdge, ink: z.ink, want: z.want, vMask: z.vMask }, page: m.page, ink: m.ink, caret: m.caret, px, before, after };
    }
    const bad = Object.entries(out).flatMap(([room, v]) => Object.entries(v.ok).filter(([, x]) => !x).map(([k]) => `${room} ${k}`));
    if (bad.length) fail('R22-TYPEWRITER', { bad, ...out });
    say('r22-typewriter', out);
  },
  // for the eye: Typewriter by night and by day (the job's two tones give each a light and a dark Page setting - the words are the room's either way)
  'r22-pic-typewriter-night': async (app) => { await openFree(app, 'arbor-r22-ptn'); await setRoom(app, 'night'); await sleep(900); },
  'r22-pic-typewriter-day': async (app) => { await openFree(app, 'arbor-r22-ptd'); await setRoom(app, 'day'); await sleep(900); },

  // ── 3. THREE DARKER NIGHT BROWNS (Fable's ruling 2, Nov 8: "ALL night-room browns step darker together (the room ground, rails, panels, the
  // dark page), keeping the lamplight's warm gradient. Three steps, floors measured, frames for Nick"). For Now, A, B, C by night: the mockup bar's
  // Night browns row is pressed (as Nick would), every token reads its step's value (the room, its surfaces and hairlines, the glow, the bars, the
  // drawers' ground; the dark page with the dark tone), the room's own pixels in a corner are that step's ground (liveness: the step paints),
  // and every lettering pair holds its floor on the measured grounds. By day nothing changes (the day tokens read the same at every step).
  'r22-browns': async (app) => {
    await openPage(app, 'arbor-r22-browns');
    const rows = {};
    for (const s of ['now', 'a', 'b', 'c']) {
      await setRoom(app, 'night');
      const pressed = await pickBrown(app, s);
      await sleep(500);
      const t = await app.evalJs(BROWNREAD);
      const png = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
      const corner = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode(); const dpr = img.width / innerWidth;
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
        const page = document.querySelector('.mode-page').getBoundingClientRect();
        // the darkest of five points in the room's margin left of the page (a vine or a leaf only lightens a point; the vignette only darkens it)
        const pts = [0.35, 0.45, 0.55, 0.65, 0.75].map((f) => { const d = cx.getImageData(Math.round((page.left - 24) * dpr), Math.round(innerHeight * f * dpr), 1, 1).data; return [d[0], d[1], d[2]]; });
        return pts.reduce((a, b) => (a[0] + a[1] + a[2] <= b[0] + b[1] + b[2] ? a : b)); })()`);
      await setRoom(app, 'day'); await sleep(300);
      const day = await app.evalJs(BROWNREAD);
      rows[s] = { pressed, t, corner, day };
    }
    await pickBrown(app, 'now'); await setRoom(app, 'night');
    const dark = rows.now.t.tone === 'dark';
    const ok = {}, floors = [];
    for (const [s, r] of Object.entries(rows)) {
      const want = BROWNS[s];
      ok[`${s} pressed`] = r.pressed === true;
      ok[`${s} tokens`] = Object.entries(want.room).every(([k, v]) => r.t.room[k] === v) && r.t.drawer === want.drawer && (!dark || Object.entries(want.page).every(([k, v]) => r.t.page[k] === v));
      ok[`${s} glow`] = want.glow.every((g) => r.t.glow.toUpperCase().includes(g));
      // the vignette darkens the room's edge, so the corner reads at or a little under the ground - never over it
      const g = parseHex(want.room['--ink-950']);
      ok[`${s} paints`] = r.corner.every((v, i) => v <= g[i] + 2 && v >= g[i] - 10);
      ok[`${s} day unchanged`] = JSON.stringify(r.day.room) === JSON.stringify(rows.now.day.room);
      for (const [label, ink, ground, floor] of [['cream / room', '#EFE4CB', want.room['--ink-950'], 4.5], ['cream / bar', '#EFE4CB', want.room['--arbor2-bar'], 4.5],
        ['cream / drawer', '#EFE4CB', want.drawer, 4.5], ['quiet / room', '#B9AA8C', want.room['--ink-950'], 4.5], ['quiet / bar', '#B9AA8C', want.room['--arbor2-bar'], 4.5],
        ['quiet / drawer', '#B9AA8C', want.drawer, 4.5], ['olive text / raised', '#85914C', want.room['--ink-800'], 4.5], ['olive text / drawer', '#85914C', want.drawer, 4.5],
        ['olive mark / room', '#6B7A3A', want.room['--ink-950'], 3], ['cream / dark page', '#EFE4CB', want.page['--paper'], 13.9], ['cream / glow top', '#EFE4CB', want.glow[0], 4.5]]) {
        const ratio = contrast(parseHex(ink), parseHex(ground));
        floors.push([s, label, Math.round(ratio * 100) / 100]);
        if (ratio < floor) ok[`${s} ${label}`] = false;
      }
    }
    const brief = { ok, dark, corners: Object.fromEntries(Object.entries(rows).map(([s, r]) => [s, r.corner])), floors };
    if (Object.values(ok).some((x) => !x)) fail('R22-BROWNS', { bad: Object.keys(ok).filter((k) => !ok[k]), ...brief, rows });
    say('r22-browns', brief);
  },
  // for Nick to pick: each step by night with the Tools drawer open (the room, the bars, a drawer, the page), and by day (unchanged, to compare)
  ...Object.fromEntries(['now', 'a', 'b', 'c'].flatMap((s) => [
    [`r22-pic-browns-${s}-night`, async (app) => { await openPage(app, `arbor-r22-pbn-${s}`); await setRoom(app, 'night'); await pickBrown(app, s); await openTools(app); await sleep(900); await app.evalJs(FINISH); await app.mouseMove(600, 300); await sleep(300); }],
    [`r22-pic-browns-${s}-day`, async (app) => { await openPage(app, `arbor-r22-pbd-${s}`); await setRoom(app, 'day'); await pickBrown(app, s); await openTools(app); await sleep(900); await app.evalJs(FINISH); await app.mouseMove(600, 300); await sleep(300); }],
  ])),
};

export default guarded(screens, { verdict: ['ARBOR-R22'] });
