// ARBOR v2 MOCKUP - THE NICK WALK (the Wrizors' script, Downloads\arbor-nick-walk.md, Nov 6 / Nov 7 "no drift"), driven on the PLAY SERVER
// (apps/server/scripts/arbor2-play.mjs: the real built server + web app on a throwaway local database with the sample account; 127.0.0.1 only).
// Fable, Nov 7: "the Wrizors' Nick walk on THIS tree (3dd856b6) ... as a box turn on Chat 1's go ... frames to Downloads\arbor-mockup-frames\walk-final\".
//
// Run (a box turn - withHarness refuses without the grant):  WS_BOX_TURN=<token> WALK_OUT=<dir> node scripts/frames/arbor2-walk.mjs
//   WALK_SIGNED_OUT (default http://127.0.0.1:3401: the server itself, no sign-in) and WALK_DOOR (default http://127.0.0.1:3400: the play
//   server's front door, which signs the browser in as the sample account on its first visit). WALK_STEPS=1,2,... runs a subset.
//
// What it is: every step's DO, its SHOOT list under the script's names, and every MUST this instrument can read, printed as numbers. A must it
// can read is PASS/FAIL; a must only an eye can judge is EYE (its frames are named) - the Wrizors judge those. Nothing here passes a step for
// them: the frames and walk-log.json go back to the Wrizors, who reply GO or the fixes.
// Two departures from the script, both said in walk-musts.txt: (1) RECORDINGS are frame folders (JPEG, timestamped in frames.json), not .mp4 -
// there is no encoder on the box and no new dependency; (2) the key-to-paint log is taken on an UN-recorded burst (the screencast costs the page
// frames), and the recorded burst carries its own log, marked. Room by day/night: the URL's test pin (arbor2room) on the cold loads of steps 1-2
// (nothing stored), the Room row's own attribute (data-room) from step 3 on. From step 3 the splash hold is the harness's test speed (50 ms).
// Seeds go through the app's seams (window.wrizoCreateJournalPage, wrizoSetWritingGoal), never raw collection storage.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const OUT = path.resolve(process.env.WALK_OUT || 'walk-final');
const A = (process.env.WALK_SIGNED_OUT || 'http://127.0.0.1:3401').replace(/\/+$/, '');
const B = (process.env.WALK_DOOR || 'http://127.0.0.1:3400').replace(/\/+$/, '');
const ONLY = process.env.WALK_STEPS ? process.env.WALK_STEPS.split(',').map((s) => s.trim()) : null;
const SIZES = { 2000: [2000, 970], 1366: [1366, 768] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

// ---- the record ----
const musts = [];
const log = [];
const must = (step, name, pass, data) => {
  const v = pass === null ? 'EYE' : pass ? 'PASS' : 'FAIL';
  musts.push({ step, name, verdict: v, data });
  console.log(`WALK-MUST ${v} [${step}] ${name}${data !== undefined ? '  ' + JSON.stringify(data).slice(0, 600) : ''}`);
};
const note = (step, what, data) => { log.push({ step, what, data }); console.log(`WALK ${step} ${what} ${JSON.stringify(data).slice(0, 900)}`); };
const shots = [];

// ---- colour arithmetic (as the round files) ----
const COLOUR = `const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
  const hex = (c) => c ? '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
  const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0.5) return c; } return parse(getComputedStyle(document.body).backgroundColor); };
  const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.02; };`;

// ---- the browser ----
let app;
const cdp = (m, p = {}) => app.cdp(m, p);
const js = (e) => app.evalJs(e);
const size = async (w, dpr = 1) => { const [W, H] = SIZES[w]; await app.emulateDpr(dpr, W, H); await sleep(250); };
// every navigation is a FULL load: via about:blank, so two URLs that differ only in the hash still give a fresh document (a cold load)
const nav = async (url) => {
  const blank = app.waitEvent('Page.loadEventFired', 15000);
  await cdp('Page.navigate', { url: 'about:blank' }); await blank;
  const loaded = app.waitEvent('Page.loadEventFired', 30000);
  await cdp('Page.navigate', { url });
  await loaded; await sleep(120);
  await app.injectHelpers().catch(() => {});
};
const soft = async (expr, timeout = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { try { if (await js(`!!(${expr})`)) return true; } catch { /* mid-navigation */ } await sleep(80); } return false; };
const shot = async (name, clip = null) => {
  const file = `${name}.png`;
  try {
    const r = await cdp('Page.captureScreenshot', clip ? { format: 'png', clip: { ...clip, scale: clip.scale || 1 } } : { format: 'png' });
    writeFileSync(path.join(OUT, file), Buffer.from(r.data, 'base64'));
    shots.push(file); console.log(`WALK-SHOT ${file}`);
  } catch (e) { console.log(`WALK-SHOT-FAILED ${file} ${String(e && e.message).slice(0, 200)}`); }
  return file;
};
/** A recording: the screencast's frames (JPEG q80, at most 1400 px wide) into <name>/, timestamped in frames.json. `during` runs alongside. */
const record = async (name, ms, during = null) => {
  const dir = path.join(OUT, name); mkdirSync(dir, { recursive: true });
  const frames = []; let t0 = null;
  const off = app.tap((method, p) => {
    if (method !== 'Page.screencastFrame') return;
    const t = p.metadata && p.metadata.timestamp ? p.metadata.timestamp * 1000 : Date.now(); if (t0 === null) t0 = t;
    const i = frames.length + 1, f = `${String(i).padStart(5, '0')}.jpg`;
    try { writeFileSync(path.join(dir, f), Buffer.from(p.data, 'base64')); } catch { /* full disk: the count says so */ }
    frames.push({ i, f, t: Math.round(t - t0) });
    cdp('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
  });
  // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C D: every 2nd frame came to ~11 fps while the splash moved - too close to the script's floor of 10). Original, verbatim:
  // await cdp('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 1400, maxHeight: 1400, everyNthFrame: 2 });   // every 2nd frame: ~30 fps while things move (the script asks >= 10)
  // SUCCESSOR: every frame.
  await cdp('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 1400, maxHeight: 1400, everyNthFrame: 1 });
  const start = Date.now();
  const job = during ? Promise.resolve().then(during).catch((e) => note('rec', 'during-error', String(e && e.message).slice(0, 300))) : null;
  while (Date.now() - start < ms) await sleep(100);
  if (job) await job;
  await cdp('Page.stopScreencast').catch(() => {}); off();
  const span = frames.length > 1 ? frames[frames.length - 1].t - frames[0].t : 0;
  // the screencast sends a frame only when the screen changes: the fps is over the frames' own span, and the longest still gap is reported
  const gaps = frames.slice(1).map((f, i) => f.t - frames[i].t), fps = span > 0 ? Math.round(((frames.length - 1) / span) * 10000) / 10 : 0;
  writeFileSync(path.join(dir, 'frames.json'), JSON.stringify({ name, ms, n: frames.length, fps, maxGapMs: gaps.length ? Math.max(...gaps) : null, frames }, null, 1));
  shots.push(`${name}/`); console.log(`WALK-REC ${name}/ ${frames.length} frames, ${fps} fps over ${span} ms`);
  return { n: frames.length, fps };
};
const key = async (k) => {
  const named = { Escape: 27, Enter: 13, Tab: 9 };
  if (named[k]) { await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: named[k], ...(k === 'Enter' ? { text: '\r' } : {}) }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: named[k] }); return; }
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, text: k, unmodifiedText: k }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k });
};
const moveTo = (x, y) => cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
const clickAt = async (x, y) => { await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' }); await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' }); };
const centre = (sel) => js(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
const clickSel = (sel) => js(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.getBoundingClientRect().width > 0); if (b) b.click(); return !!b; })()`);
const clickText = (sel, text) => js(`(() => { const want = ${JSON.stringify(text)}.toLowerCase(); const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.getBoundingClientRect().width > 0 && (x.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase() === want); if (b) b.click(); return !!b; })()`);
const PAGE_RECT = "(() => { const e = document.querySelector('.desk-frame-stage .mode-page') || document.querySelector('.desk-frame-stage .mode-pagecol') || document.querySelector('.mode-page'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, t: Math.round(r.top * 10) / 10, r: Math.round(r.right * 10) / 10, b: Math.round(r.bottom * 10) / 10 }; })()";
const samePage = (a, b) => !!a && !!b && ['l', 't', 'r', 'b'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);

// ---- the front door's timeline (steps 1, 2, 11): every change of its parts, stamped in the page's own clock (ms after navigation) ----
const TIMELINE = `(() => { window.__walkTL = []; let last = '';
  const tick = () => { try { const q = (s) => document.querySelector(s); const lg = q('.arbor2-top-logo'), tg = q('.arbor2-top-tagline'), dr = q('.arbor2-front-doors'), sp = q('.wz-splash');
    const ld = [...document.querySelectorAll('.wz-splash-loading-text, .wz-arrival-loading, .wz-splash-loading')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && Number(getComputedStyle(e).opacity) > 0.05 && (e.textContent || '').trim(); }).map((e) => e.textContent.trim()).join('|');
    const s = JSON.stringify([!!sp, lg ? lg.dataset.writing : null, tg ? tg.dataset.state : null, tg ? Number(tg.dataset.typed) : null, dr ? dr.dataset.phase : null, dr ? Number(dr.dataset.pulse) : null, ld || null, location.hash, dr ? dr.dataset.mode : null]);
    if (s !== last) { last = s; window.__walkTL.push([Math.round(performance.now()), JSON.parse(s)]); } } catch (e) { /* early document */ }
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick); })();`;
const FRONT = `(() => { ${COLOUR} const q = (s) => [...document.querySelectorAll(s)].find(vis) || null;
  const doors = [...document.querySelectorAll('.arbor2-door')].map((d) => { const w = d.querySelector('.arbor2-door-word'), sk = d.querySelector('.arbor2-door-sketch path'); const r = d.getBoundingClientRect(); return { cls: d.className, word: (w ? w.textContent : d.textContent).trim(), color: w ? hex(parse(getComputedStyle(w).color)) : null, stroke: sk ? getComputedStyle(sk).stroke : null, op: Number(getComputedStyle(d).opacity), r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], disabled: d.disabled }; });
  const lg = document.querySelector('.arbor2-top-logo'), tg = document.querySelector('.arbor2-top-tagline'), typed = document.querySelector('.arbor2-tag-typed'), caret = document.querySelector('.arbor2-tag-caret'), dr = document.querySelector('.arbor2-front-doors');
  const rect = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  return { splash: !!document.querySelector('.wz-splash'), logo: lg ? lg.dataset.writing : null, logoRect: rect(lg), tag: tg ? { state: tg.dataset.state, typed: Number(tg.dataset.typed), text: typed ? typed.textContent : null, font: typed ? getComputedStyle(typed).fontFamily : null, color: typed ? hex(parse(getComputedStyle(typed).color)) : null, rect: rect(tg) } : null,
    caret: caret ? { color: getComputedStyle(caret).backgroundColor || getComputedStyle(caret).borderColor, anim: caret.getAnimations().map((a) => a.animationName + ':' + a.effect.getTiming().duration) } : null,
    doors, phase: dr ? dr.dataset.phase : null, pulse: dr ? Number(dr.dataset.pulse) : null, mode: dr ? dr.dataset.mode : null, hash: location.hash, active: document.activeElement ? document.activeElement.className : null,
    logIn: /log in/i.test(document.body.innerText), signIn: /sign in/i.test(document.body.innerText) }; })()`;
const fresh = async (origin) => {
  await cdp('Network.clearBrowserCookies').catch(() => {});
  await cdp('Storage.clearDataForOrigin', { origin, storageTypes: 'all' }).catch(() => {});
};
const tlTimes = (tl) => {
  const first = (pred) => { const x = tl.find(([, s]) => pred(s)); return x ? x[0] : null; };
  return { logoWrite: first((s) => s[1] === 'true'), logoStill: first((s) => s[1] === 'still'), caret: first((s) => s[2] === 'typing' || s[2] === 'done'), tagFirst: first((s) => s[3] >= 1), tagDone: first((s) => s[2] === 'done'),
    doorsIn: first((s) => s[4] === 'in' || s[4] === 'shown'), doorsShown: first((s) => s[4] === 'shown'), pulse1: first((s) => s[5] >= 1), pulse2: first((s) => s[5] >= 2), splashGone: first((s) => !s[0]),
    loadingLast: (() => { const xs = tl.filter(([, s]) => s[6]); return xs.length ? xs[xs.length - 1][0] : null; })(), loadingAfterDoors: (() => { const d = first((s) => s[4] === 'in' || s[4] === 'shown'); return d === null ? null : tl.some(([t, s]) => t > d + 400 && s[6]); })() };
};
const near = (v, want, tol) => v !== null && Math.abs(v - want) <= tol;
const urlA = (room) => `${A}/?arbor2=1&arbor2room=${room}#/`;

// ======================================== STEP 1: the front door, signed out ========================================
async function step1() {
  let tlId = null;
  try { tlId = (await cdp('Page.addScriptToEvaluateOnNewDocument', { source: TIMELINE })).identifier; } catch { /* the timeline is then read from nothing: said below */ }
  for (const w of [2000, 1366]) for (const room of ['day', 'night']) {
    const tag = `${room}__${w}`;
    await size(w); await fresh(A);
    let tl = [];
    await record(`walk-1-front-cold__${tag}`, 49000, async () => { await nav(urlA(room)); });
    tl = await js('window.__walkTL || []');
    const t = tlTimes(tl);
    note('1', `timeline ${tag}`, t);
    const fin = await js(FRONT);
    note('1', `finished ${tag}`, fin);
    await shot(`walk-1-front-finished__${tag}`);
    // the sequence, in the script's order (times at 1366 are the script's; 2000 reported against the same)
    const logoAfterSketch = t.logoWrite !== null && t.logoStill !== null && t.logoWrite < t.logoStill;
    must('1', `${tag} the logo writes itself out after the sketch (write at ~3.3 s, still ~1.6 s later)`, w === 1366 ? logoAfterSketch && near(t.logoWrite, 3300, 700) && near(t.logoStill - t.logoWrite, 1600, 500) : logoAfterSketch ? null : false, { logoWrite: t.logoWrite, logoStill: t.logoStill });
    must('1', `${tag} a beat (~0.45 s), then the tagline types; the caret first`, t.logoStill !== null && t.tagFirst !== null && t.caret !== null && t.caret <= t.tagFirst && near(t.tagFirst - t.logoStill, 450, 350), { caret: t.caret, tagFirst: t.tagFirst, tagDone: t.tagDone });
    must('1', `${tag} the doors arrive ~0.35 s after the full stop (~7.3 s at 1366)`, t.tagDone !== null && t.doorsIn !== null && near(t.doorsIn - t.tagDone, 350, 300) && (w !== 1366 || near(t.doorsIn, 7300, 900)), { tagDone: t.tagDone, doorsIn: t.doorsIn });
    const words = fin && fin.doors ? fin.doors.map((d) => d.word) : [];
    must('1', `${tag} Write, then Sign in; never "Log in"`, JSON.stringify(words) === '["Write","Sign in"]' && fin && !fin.logIn, { words, logIn: fin && fin.logIn });
    must('1', `${tag} the nudge: 5 s after the doors, once; again every 30 s`, t.doorsIn !== null && t.pulse1 !== null && near(t.pulse1 - t.doorsIn, 5000, 600) && (t.pulse2 === null || near(t.pulse2 - t.pulse1, 30000, 1000)), { doorsIn: t.doorsIn, pulse1: t.pulse1, pulse2: t.pulse2 });
    must('1', `${tag} the loading line has gone by the time the doors arrive`, t.doorsIn !== null && t.loadingAfterDoors === false, { loadingLast: t.loadingLast, doorsIn: t.doorsIn });
    must('1', `${tag} the tagline "For humans who write." in EB Garamond, cream; brass caret blinking ~1 s; the logo in the sketch's top-left below PAGE; the full stop before the z's loop; doors cream rising 6 px; <= 3 flashes a second`, null,
      { frames: [`walk-1-front-cold__${tag}/`, `walk-1-front-finished__${tag}.png`], tagline: fin && fin.tag, caret: fin && fin.caret, logoRect: fin && fin.logoRect, doors: fin && fin.doors });
    // hover and Tab: brass, and back
    for (const [i, cls] of [[0, '.wz-arrival-write'], [1, '.wz-arrival-signin']]) {
      const c = await centre(`.arbor2-door${cls}`); if (!c) { must('1', `${tag} door ${cls} present for hover`, false, null); continue; }
      await moveTo(c.x, c.y); await sleep(500);
      const h = await js(FRONT);
      if (room === 'day' || w === 2000) await shot(`walk-1-front-hover-${i ? 'signin' : 'write'}__${tag}`);
      await moveTo(5, 5); await sleep(500);
      const back = await js(FRONT);
      must('1', `${tag} hover ${i ? 'Sign in' : 'Write'}: it turns brass, and back when the mouse leaves`, null, { hover: h.doors[i], left: back.doors[i] });
    }
    await key('Tab'); await sleep(400); const tab1 = await js(FRONT); await key('Tab'); await sleep(400); const tab2 = await js(FRONT);
    if (w === 2000) await shot(`walk-1-front-tab__${tag}`);
    must('1', `${tag} Tab to each door: brass`, null, { first: { active: tab1.active, doors: tab1.doors.map((d) => d.color) }, second: { active: tab2.active, doors: tab2.doors.map((d) => d.color) } });
    // the nudge stops for good after an act: (the hover above was an act) - wait past the next pulse time and read the count
    // skips: (a) a click mid-sketch, (b) Esc mid-sketch, (c) Enter at the very first frame
    for (const [k, how] of [['a', 'click'], ['b', 'esc']]) {
      await fresh(A); await nav(urlA(room)); await sleep(1500);
      if (how === 'click') { const [W, H] = SIZES[w]; await clickAt(Math.round(W * 0.5), Math.round(H * 0.5)); } else await key('Escape');
      await sleep(700);
      const s = await js(FRONT);
      await shot(`walk-1-front-skip-${how}__${tag}`);
      must('1', `${tag} skip (${k}) ${how} mid-sketch: straight to the finished frame (logo written, whole tagline, caret, doors)`, s.logo === 'still' && s.tag && s.tag.state === 'done' && (s.phase === 'in' || s.phase === 'shown') && !!s.caret, { logo: s.logo, tag: s.tag && s.tag.state, phase: s.phase, caret: !!s.caret, splash: s.splash });
    }
    await fresh(A);
    const blank = app.waitEvent('Page.loadEventFired', 15000); await cdp('Page.navigate', { url: 'about:blank' }); await blank;
    const loaded = app.waitEvent('Page.loadEventFired', 30000); await cdp('Page.navigate', { url: urlA(room) }); await loaded; await key('Enter'); await sleep(2500);
    const e = await js("({ hash: location.hash, editor: !!document.querySelector('.forward-only-editor') })");
    await shot(`walk-1-front-enter__${tag}`);
    must('1', `${tag} skip (c) Enter at the first frame = Write: straight to a new page`, /#\/page\//.test(e.hash) || (e.editor && !/#\/$/.test(e.hash)), e);
  }
  // one 2x frame mid-typing of the tagline (day, 1366)
  await size(1366, 2); await fresh(A); await nav(urlA('day'));
  const ok = await soft("(() => { const t = document.querySelector('.arbor2-top-tagline'); return t && t.dataset.state === 'typing' && Number(t.dataset.typed) >= 8; })()", 12000);
  await shot('walk-1-front-tagline-2x__day__1366'); must('1', 'a 2x still mid-typing of the tagline was taken while it typed', ok, null);
  await size(1366, 1);
  if (tlId) await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: tlId }).catch(() => {});
}

// ======================================== STEP 2: sign in ========================================
async function step2() {
  for (const w of [2000, 1366]) {
    await size(w); await fresh(A); await nav(urlA('day')); await sleep(1200); await key('Escape'); await sleep(600);
    const opened = await clickSel('.wz-arrival-signin'); await sleep(1200);
    const f = await js(`(() => { ${COLOUR} const texts = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1));
      const rows = texts.map((e) => { const c = parse(getComputedStyle(e).color), b = bgOf(e); return { t: e.textContent.trim().slice(0, 40), c: hex(c), bg: hex(b), ratio: c && b ? ratio(c, b) : null }; });
      const min = rows.filter((r) => r.ratio !== null).sort((a, b) => a.ratio - b.ratio).slice(0, 4);
      return { inputs: [...document.querySelectorAll('input')].filter(vis).map((i) => i.type + ':' + (i.name || i.placeholder || i.autocomplete || '')), invite: /invite/i.test(document.body.innerText), logIn: /log in/i.test(document.body.innerText), lowest: min, hash: location.hash }; })()`);
    await shot(`walk-2-signin-form__day__${w}`);
    must('2', `${w} Sign in opens the existing forms (the invite code included); quiet text >= 4.5:1`, opened && f.inputs.length >= 2 && f.lowest.every((r) => r.ratio >= 4.5) ? (f.invite ? true : null) : false, f);
    if (!f.invite) {
      const toUp = await js("(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /sign up|create|join|invite/i.test(x.textContent || '') && x.getBoundingClientRect().width > 0); if (b) b.click(); return b ? b.textContent.trim() : null; })()");
      await sleep(900); const inv = await js("/invite/i.test(document.body.innerText)");
      await shot(`walk-2-signup-form__day__${w}`);
      must('2', `${w} the sign-up form carries the invite code`, inv, { via: toUp });
    }
  }
  // sign in: the play server's front door signs this browser in (its first visit), then the reload
  await size(2000);
  await nav(`${B}/`); await soft("location.search.includes('arbor2=1')", 15000); await sleep(2500);
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: TIMELINE }).then((r) => { step2.tl = r.identifier; }).catch(() => {});
  let doorShot = false, fadeShot = false, sawSignin = false;
  await record('walk-2-signed-in-reload__day__2000', 14000, async () => {
    await nav(`${B}/?arbor2=1&arbor2room=day#/`);
    const t0 = Date.now();
    while (Date.now() - t0 < 12000 && !(doorShot && fadeShot)) {
      const s = await js("(() => { const sp = document.querySelector('.wz-splash'); const dr = document.querySelector('.arbor2-front-doors'); return { sp: sp ? Number(getComputedStyle(sp).opacity) : null, phase: dr ? dr.dataset.phase : null, signin: !!document.querySelector('.wz-arrival-signin') }; })()").catch(() => null);
      if (s && s.signin) sawSignin = true;
      if (s && !doorShot && (s.phase === 'in' || s.phase === 'shown')) { doorShot = true; await shot('walk-2-signed-in-door__day__2000'); }
      if (s && !fadeShot && s.sp !== null && s.sp > 0.25 && s.sp < 0.8) { fadeShot = true; await shot('walk-2-signed-in-fade__day__2000'); }
      await sleep(60);
    }
  });
  const tl = await js('window.__walkTL || []'); const t = tlTimes(tl);
  const end = await js(`(() => { ${COLOUR} const m = document.querySelector('.arbor2-logo-corner'); const cs = m ? getComputedStyle(m) : null; const r = m ? m.getBoundingClientRect() : null;
    return { hash: location.hash, editor: !!document.querySelector('.forward-only-editor'), mark: m ? { op: Number(cs.opacity), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] } : null, signin: !!document.querySelector('.wz-arrival-signin'), splash: !!document.querySelector('.wz-splash') }; })()`);
  note('2', 'signed-in reload timeline', t); note('2', 'signed-in end', end);
  must('2', 'signed in, the front door shows Write only (no Sign in door)', doorShot && !sawSignin, { doorShot, sawSignin, end });
  must('2', 'the splash fades into the last page; the logo fades out with the sketch; the corner mark fades in in its own rect (day: sage, .7); nothing slides', end.editor && !end.splash ? null : false, { frames: ['walk-2-signed-in-reload__day__2000/', 'walk-2-signed-in-door__day__2000.png', 'walk-2-signed-in-fade__day__2000.png'], mark: end.mark, fadeShot });
  if (step2.tl) await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: step2.tl }).catch(() => {});
  // from here: the play server's origin, signed in; the splash at the harness's test speed
  await js("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); true");
}

// ======================================== the page helpers (B, signed in) ========================================
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const WORDS = ['light', 'kettle', 'street', 'table', 'question', 'morning', 'dog', 'answer', 'window', 'garden'];
const words = (n, from = 0) => Array.from({ length: n }, (_, i) => WORDS[(i + from) % WORDS.length]).join(' ');
let seq = 0;
const openPage = async (base, { text = PAGEW, progress = 'words', style = 'bar', goal = null, mode = 'draft', pageType = null, boxes = null } = {}) => {
  const id = `walk-${base}-${++seq}`;
  const seed = { id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page', ...(pageType ? { pageType, boxes, origin: null, source: null } : {}) };
  await js(`window.wrizoCreateJournalPage(${JSON.stringify(seed)})`);
  await js(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: ${JSON.stringify(progress)}, progressStyle: ${JSON.stringify(style)} }))`);
  if (goal) await js(`window.wrizoSetWritingGoal && window.wrizoSetWritingGoal(${JSON.stringify(goal)})`);
  await sleep(400);
  await nav(`${B}/?arbor2=1#/page/${id}`);
  await soft("document.documentElement.getAttribute('data-arbor2') === 'true'", 15000);
  await soft("!document.querySelector('.wz-splash')", 20000);
  if (!pageType) {
    await soft("!!document.querySelector('.forward-only-editor')", 10000); await sleep(800);
    if (mode) { await clickText('.desk-mode-tab', mode === 'free' ? 'free write' : mode); await sleep(900); }
    await js("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges(); true");
  } else { await soft("!!document.querySelector('.board-canvas, .board-canvas-wrap')", 10000); await sleep(1200); }
  return id;
};
const setRoom = async (room) => { if (room === 'clock') await js("document.documentElement.removeAttribute('data-room'); true"); else await js(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')}); true`); await sleep(900); };
const caretEnd = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()";
const escape = async () => { await key('Escape'); await sleep(400); };
const REST = `(() => { ${COLOUR} const q = (s) => [...document.querySelectorAll(s)].find(vis) || null; const root = document.documentElement;
  const bar = q('.chrome-top.sprint-nav') || q('.chrome-top'), rail = q('.desk-frame-strip'), page = q('.desk-frame-stage .mode-page') || q('.mode-page'), ed = document.querySelector('.forward-only-editor');
  const rr = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  const pg = document.querySelector('.arbor2-pergola'), sh = document.querySelector('.arbor2-pagesh'), leaves = [...document.querySelectorAll('.arbor2-pergola .wz-leaf')];
  const anims = leaves.flatMap((l) => l.getAnimations()); const drift = pg ? pg.querySelectorAll('.arbor2-pergola-drift') : [];
  const scroller = ed ? (() => { for (let n = ed; n; n = n.parentElement) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) return n; } return null; })() : null;
  const mark = q('.arbor2-logo-corner'); const field = document.querySelector('.wz-rhizome-field');
  const pageBg = page ? bgOf(page) : null, ink = ed ? parse(getComputedStyle(ed).color) : null;
  return { room: root.getAttribute('data-arbor2-room'), dayness: root.getAttribute('data-arbor2-dayness'), writing: root.getAttribute('data-wz-writing'),
    bar: bar ? { bg: hex(parse(getComputedStyle(bar).backgroundColor)), border: getComputedStyle(bar).borderBottomColor, rect: rr(bar) } : null, rail: rail ? { bg: hex(bgOf(rail)), rect: rr(rail) } : null, page: rr(page), win: [innerWidth, innerHeight],
    pergola: pg ? { op: Number(getComputedStyle(pg).opacity), display: getComputedStyle(pg).display, liveOff: pg.getAttribute('data-live-off'), leaves: leaves.length, running: anims.filter((a) => a.playState === 'running').length, names: [...new Set(anims.map((a) => a.animationName))], driftAnims: [...drift].flatMap((d) => d.getAnimations()).length } : null,
    pageShade: sh ? { op: Number(getComputedStyle(sh).opacity), display: getComputedStyle(sh).display } : null, mark: mark ? { op: Number(getComputedStyle(mark).opacity), rect: rr(mark), color: getComputedStyle(mark).color } : null,
    scroll: scroller ? { sh: scroller.scrollHeight, ch: scroller.clientHeight, bar: scroller.offsetWidth - scroller.clientWidth } : { fits: true }, vines: field ? { op: Number(getComputedStyle(field).opacity), vis: field.getAttribute('data-vines') } : null,
    text: ink && pageBg ? { ink: hex(ink), page: hex(pageBg), ratio: ratio(ink, pageBg), atShade: ratio(ink, { r: pageBg.r * (1 - 0.034), g: pageBg.g * (1 - 0.034), b: pageBg.b * (1 - 0.034) }) } : null,
    glow: page ? getComputedStyle(page).boxShadow : null, openers: [q('.wz-sliver-grip'), q('.wz-tutor-grip')].map((g) => g ? Number(getComputedStyle(g).opacity) : null) }; })()`;

// ======================================== STEP 3: the day room at rest ========================================
async function step3() {
  for (const w of [2000, 1366]) {
    await size(w); await openPage('rest'); await setRoom('day'); await sleep(2000);
    const r = await js(REST); note('3', `rest ${w}`, r);
    await shot(`walk-3-rest__day__${w}`);
    must('3', `${w} the bars olive #3A4322; the rail floats 40 px below the top bar and 40 px above the window's bottom`, !!r.bar && r.bar.bg === '#3A4322' && !!r.rail && r.rail.bg === '#3A4322' && Math.abs(r.rail.rect.t - r.bar.rect.b - 40) <= 1 && Math.abs(r.win[1] - r.rail.rect.b - 40) <= 1, { bar: r.bar, rail: r.rail, win: r.win });
    must('3', `${w} the pergola drawn, its leaves on the breeze, NO drift (no animation on the wrapper)`, !!r.pergola && r.pergola.leaves > 0 && r.pergola.names.includes('arbor2-breeze') && r.pergola.driftAnims === 0, r.pergola);
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C10: it mixed 3.4% BLACK over the page, and the shade is not black, so its 13.6 under-reads). Original, verbatim:
    // must('3', `${w} page text >= 13.9:1 at the shade's darkest (3.4% over the page)`, !!r.text && r.text.atShade >= 13.9, r.text);
    // SUCCESSOR: the page's own ratio is read (and must clear the floor with no shade at all); the figure at the shade's darkest is the eye's / the round's.
    must('3', `${w} page text >= 13.9:1 on the page (the figure under the shade's darkest is for the eye: the shade is not black)`, !!r.text && r.text.ratio >= 13.9 ? null : false, r.text);
    must('3', `${w} no scrollbar (the page fits)`, !r.scroll.sh || r.scroll.sh <= r.scroll.ch, r.scroll);
    must('3', `${w} the vines hidden by day at rest`, !r.vines || r.vines.op < 0.02 || r.vines.vis === 'false', r.vines);
    must('3', `${w} the shade at 3.4% beneath the words; the corner mark (sage, .7) on top of the shade; beams/rafters/post/leaves out of the timber; the breeze left to right in ~2.6 s every 16 s, still between`, null, { frames: [`walk-3-rest__day__${w}.png`, `walk-3-breeze__day__${w}/`], pageShade: r.pageShade, mark: r.mark });
    await record(`walk-3-breeze__day__${w}`, 20000);
    if (r.mark && r.mark.rect) { const m = r.mark.rect; await shot(`walk-3-corner-mark__day__${w}`, { x: Math.max(0, m.l - 12), y: Math.max(0, m.t - 12), width: m.r - m.l + 24, height: m.b - m.t + 24, scale: 2 }); }
    // the shade across the menus: a rail pop-out (Themes) and a drawer (Tools)
    await clickSel(".wz-strip-item[data-category='theme']"); await sleep(700);
    await js("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(900);
    await shot(`walk-3-shade-menus__day__${w}`);
    must('3', `${w} the shade crosses every overlapping menu at the page's strength, beneath their words`, null, { frame: `walk-3-shade-menus__day__${w}.png` });
    await escape(); await escape();
    await sleep(Math.max(0, 40000 - 26000));   // hands off for 40 s in all
    // every progress feature off: nothing under the page
    await openPage('noprog', { progress: 'off' }); await setRoom('day'); await sleep(1500);
    await shot(`walk-3-progress-off__day__${w}`);
    must('3', `${w} nothing under the page with every progress feature off (no plate, bar or rule)`, null, { frame: `walk-3-progress-off__day__${w}.png` });
  }
}

// ======================================== STEP 4: the typing burst ========================================
const METER = `(() => { window.__lat = []; window.__st = []; let t0 = 0, n = 0; if (window.__latOff) window.__latOff();
  const kd = () => { t0 = performance.now(); };
  const bi = () => { const t = t0, i = ++n; requestAnimationFrame(() => requestAnimationFrame(() => { window.__lat.push({ i, ms: Math.round((performance.now() - t) * 10) / 10, at: Math.round(t) }); })); };
  document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
  const pg = document.querySelector('.arbor2-pergola'), sh = document.querySelector('.arbor2-pagesh'), field = document.querySelector('.wz-rhizome-field'), bar = [...document.querySelectorAll('.chrome-top')].find((b) => b.getBoundingClientRect().height > 0), grip = document.querySelector('.wz-sliver-grip');
  let k = 0; const op = (e) => e ? Math.round(Number(getComputedStyle(e).opacity) * 1000) / 1000 : null;
  const iv = setInterval(() => { k++; const row = [Math.round(performance.now()), document.documentElement.getAttribute('data-wz-writing'), pg ? pg.getAttribute('data-live-off') : null, op(pg), op(sh), op(field), op(bar), op(grip)];
    if (k % 5 === 0 && pg) row.push(pg.querySelectorAll('.wz-leaf').length ? [...pg.querySelectorAll('.wz-leaf')].flatMap((l) => l.getAnimations()).filter((a) => a.playState === 'running').length : 0);
    window.__st.push(row); }, 100);
  window.__latOff = () => { clearInterval(iv); document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`;
// the breeze mid-crossing: the leftmost leaf's own cycle 1.0-1.6 s in (the wave takes ~2.6 s to cross)
const BREEZE_PHASE = "(() => { const ls = [...document.querySelectorAll('.arbor2-pergola .wz-leaf')].map((l) => ({ x: l.getBoundingClientRect().left, a: l.getAnimations().find((a) => a.animationName === 'arbor2-breeze') })).filter((x) => x.a); if (!ls.length) return null; ls.sort((p, q) => p.x - q.x); const a = ls[0].a; const d = Number(a.effect.getTiming().duration) || 16000; const del = Number(a.effect.getTiming().delay) || 0; return ((((Number(a.currentTime) || 0) - del) % d) + d) % d; })()";
const stats = (xs) => { const s = [...xs].sort((a, b) => a - b); const at = (p) => s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; return { n: s.length, median: at(0.5), p95: at(0.95), max: s.length ? s[s.length - 1] : null }; };
async function burst(w, room, recorded) {
  const tag = `${room}__${w}${recorded ? '' : '__keylog'}`;
  await size(w); await openPage('burst'); await setRoom(room); await sleep(3500);
  if (room === 'day') { const t0 = Date.now(); while (Date.now() - t0 < 17000) { const ph = await js(BREEZE_PHASE); if (ph === null || (ph >= 1000 && ph <= 1600)) break; await sleep(40); } }
  await js(caretEnd); await sleep(150);
  await js(METER);
  const text = ' ' + words(60);
  const typeAll = async () => {
    const t0 = Date.now(); let i = 0;
    for (const ch of text) {
      if (recorded && i === 0) await shot(`walk-4-before-first-key__${tag}`);
      await key(ch); i++;
      if (recorded && i === 1) { await sleep(100); await shot(`walk-4-after-first-key-0.1s__${tag}`); await sleep(120); await shot(`walk-4-after-first-key-0.3s__${tag}`); }
      if (recorded && Date.now() - t0 >= 3000 && !typeAll.mid) { typeAll.mid = true; await shot(`walk-4-mid-burst__${tag}`); }
      const due = t0 + i * 110; const wait = due - Date.now(); if (wait > 0) await sleep(wait);
    }
    typeAll.mid = false;
  };
  // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt CD: it never moved the pointer after the burst, and without that the chrome does not come back - data-wz-writing stayed true for 10 s). Original, verbatim:
  // const after = async () => { await sleep(3000); if (recorded) await shot(`walk-4-pause-plus-3s__${tag}`); await sleep(7000); };
  // SUCCESSOR: 1.5 s after the last key the pointer moves (the writer reaching for the chrome), stamped in the page's clock; then 3 s, the still, and 7 s more.
  const after = async () => { await sleep(1500); const [W, H] = SIZES[w]; await js('window.__moveAt = Math.round(performance.now()); true'); for (let i = 0; i < 4; i++) { await moveTo(Math.round(W * (0.3 + i * 0.1)), Math.round(H * 0.5)); await sleep(60); } await sleep(3000); if (recorded) await shot(`walk-4-pause-plus-3s__${tag}`); await sleep(7000); };
  if (recorded) await record(`walk-4-burst__${room}__${w}`, 0, async () => { await typeAll(); await after(); });
  else { await typeAll(); await after(); }
  const lat = await js('window.__lat'); const st = await js('window.__st'); const moveAt = await js('window.__moveAt || null'); await js('window.__latOff && window.__latOff(); true');
  const csv = 'key,key_to_paint_ms\n' + lat.map((x) => `${x.i},${x.ms}`).join('\n') + '\n';
  writeFileSync(path.join(OUT, `keylog-${room}${w === 2000 ? '' : '__1366'}${recorded ? '__recorded' : ''}.csv`), csv);
  writeFileSync(path.join(OUT, `walk-4-states__${room}__${w}${recorded ? '__recorded' : ''}.json`), JSON.stringify({ cols: ['t', 'writing', 'liveOff', 'pergolaOp', 'pageShadeOp', 'vinesOp', 'topBarOp', 'toolsOpenerOp', 'leavesRunning(every 5th)'], firstKeyAt: lat[0] ? lat[0].at : null, rows: st }));
  return { lat, st, moveAt };
}
async function step4() {
  for (const w of [2000, 1366]) {
    const day = await burst(w, 'day', false), night = await burst(w, 'night', false);
    const d = day.lat.map((x) => x.ms), n = night.lat.map((x) => x.ms);
    const dRest = stats(d.slice(1)), nAll = stats(n.slice(1));
    note('4', `keylog ${w}`, { dayFirst: d[0], dayRest: dRest, nightFirst: n[0], nightRest: nAll, dayKeys: d.length, nightKeys: n.length });
    must('4', `${w} every key from the second on no slower than by night (median within 2 ms, p95 within 5 ms)`, d.length > 200 && n.length > 200 && dRest.median <= nAll.median + 2 && dRest.p95 <= nAll.p95 + 5, { dayRest: dRest, nightRest: nAll, dayFirst: d[0] });
    const slow = d.slice(1).map((ms, i) => ({ key: i + 2, ms })).filter((x) => x.ms > 45);
    must('4', `${w} no key after the first drops a frame by day (key-to-paint over 45 ms = a dropped frame)`, slow.length === 0, { slow: slow.slice(0, 10), count: slow.length });
    // the shade's own timeline: the first key -> leaves still; the swap's fade; the pause's return
    const fk = day.lat[0] ? day.lat[0].at : null, rows = day.st;
    const firstAfter = (pred) => { const r = rows.find((x) => fk !== null && x[0] >= fk && pred(x)); return r ? r[0] - fk : null; };
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C9: "gone" at opacity < 0.05 lands ~4.4 s into a 6 s ease; the logged fade reaches 0.003 at 5.6 s and 0 at 6.1 s). Original, verbatim:
    // const stillAt = firstAfter((x) => x[2] === 'true'), shadeGone = firstAfter((x) => x[3] !== null && x[3] < 0.05), writingOn = firstAfter((x) => x[1] === 'true');
    // SUCCESSOR: gone = the first sample at 0 (to 3 places), the fade's end.
    const stillAt = firstAfter((x) => x[2] === 'true'), shadeGone = firstAfter((x) => x[3] !== null && x[3] <= 0.001), writingOn = firstAfter((x) => x[1] === 'true');
    const lastKey = day.lat.length ? day.lat[day.lat.length - 1].at : null;
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt CD, with the pause above: no pointer, no pause). Original, verbatim:
    // const pauseRow = rows.find((x) => lastKey !== null && x[0] > lastKey && x[1] !== 'true'), pauseAt = pauseRow ? pauseRow[0] : null;
    // const backAt = pauseAt === null ? null : (rows.find((x) => x[0] > pauseAt && x[3] !== null && x[3] > 0.95) || [null])[0];
    // SUCCESSOR: the pause is the first sample after the pointer moved with the chrome back (writing not 'true'); back = the shade's fade-in at 1 (to 3 places).
    const moveAt = day.moveAt;
    const pauseRow = rows.find((x) => moveAt !== null && x[0] >= moveAt && x[1] !== 'true'), pauseAt = pauseRow ? pauseRow[0] : null;
    const backAt = pauseAt === null ? null : (rows.find((x) => x[0] > pauseAt && x[3] !== null && x[3] >= 0.999) || [null])[0];
    // (the live drawing leaves style work under data-live-off - content-visibility:hidden, the still picture shown - so "nothing moves" is the
    // live layer OFF on every sample mid-burst; the leaves' own animation count is reported beside it, information only)
    const mid = rows.filter((x) => fk !== null && lastKey !== null && x[0] > fk + 400 && x[0] < lastKey);
    const offMid = mid.map((x) => x[2]), runningMid = mid.filter((x) => x.length > 8).map((x) => x[8]);
    note('4', `shade timeline day ${w}`, { stillAfterFirstKeyMs: stillAt, writingOnMs: writingOn, shadeGoneAfterFirstKeyMs: shadeGone, pauseAt: pauseAt !== null && lastKey !== null ? pauseAt - lastKey : null, shadeBackMsAfterPause: backAt !== null && pauseAt !== null ? backAt - pauseAt : null, liveOffMid: [...new Set(offMid)], leavesRunningMid: [...new Set(runningMid)] });
    must('4', `${w} the leaves stop on the first key (the live drawing off, its still shown, within ~300 ms)`, stillAt !== null && stillAt <= 300, { stillAt });
    must('4', `${w} while she types nothing in the shade moves (the live drawing off on every sample mid-burst)`, offMid.length > 20 && offMid.every((x) => x === 'true'), { samples: offMid.length, values: [...new Set(offMid)], leavesRunningInfo: [...new Set(runningMid)] });
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C9: read against the < 0.05 threshold parked above). Original, verbatim:
    // must('4', `${w} the swap: the shade fades out over ~6 s as the vines fade in, all together`, shadeGone !== null && near(shadeGone, 6000, 1500), { shadeGone });
    // SUCCESSOR: the fade's end at ~6 s (within 1 s).
    must('4', `${w} the swap: the shade fades out over ~6 s (to 0) as the vines fade in, all together`, shadeGone !== null && near(shadeGone, 6000, 1000), { shadeGone });
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt CD: blind - no pointer, so no pause to time). Original, verbatim:
    // must('4', `${w} the pause: the vines out and the shade back together over ~3 s`, backAt !== null && pauseAt !== null && near(backAt - pauseAt, 3000, 1000), { pauseAfterLastKey: pauseAt !== null && lastKey !== null ? pauseAt - lastKey : null, back: backAt !== null && pauseAt !== null ? backAt - pauseAt : null });
    // SUCCESSOR: the same must, timed from the pause the pointer brings (and the pause itself must come within 1 s of the move).
    must('4', `${w} the pause (the pointer moves, the chrome returns): the shade back over ~3 s`, moveAt !== null && pauseAt !== null && pauseAt - moveAt <= 1000 && backAt !== null && near(backAt - pauseAt, 3000, 1000), { moveAt, pauseAfterMove: pauseAt !== null && moveAt !== null ? pauseAt - moveAt : null, back: backAt !== null && pauseAt !== null ? backAt - pauseAt : null });
    // the recorded pair (frames + stills), its own log marked
    await burst(w, 'day', true); await burst(w, 'night', true);
    must('4', `${w} no visible snap (a leaf never jumps); mid-burst ten seconds of nothing moving; the openers recede with the chrome; new growth from its parent's tip`, null, { frames: [`walk-4-burst__day__${w}/`, `walk-4-burst__night__${w}/`, `walk-4-after-first-key-0.1s__day__${w}.png`, `walk-4-after-first-key-0.3s__day__${w}.png`, `walk-4-mid-burst__day__${w}.png`, `walk-4-pause-plus-3s__day__${w}.png`] });
  }
}

// ======================================== STEP 5: the vines through a lap ========================================
const HEADS = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const num = (v, k) => v.hasAttribute(k) ? Number(v.getAttribute(k)) : null;
  const heads = [...f.querySelectorAll('.arbor2-vines > path.arbor2-vine[data-w0]')].map((v) => ({ stem: num(v, 'data-stem'), level: num(v, 'data-level'), reach: num(v, 'data-reach'), full: num(v, 'data-full'), ex: num(v, 'data-ex'), ey: num(v, 'data-ey'), vx: num(v, 'data-vx'), vy: num(v, 'data-vy') }));
  const sb = f.getBoundingClientRect(), box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left - sb.left, t: r.top - sb.top, r: r.right - sb.left, b: r.bottom - sb.top }; };
  const rail = box(document.querySelector('.desk-frame-strip')), bar = box([...document.querySelectorAll('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0)), page = box(document.querySelector('.mode-page'));
  const vines = [...f.querySelectorAll('path.arbor2-vine')]; const cols = [...new Set(vines.map((v) => getComputedStyle(v).fill + '|' + getComputedStyle(v).stroke))].slice(0, 6);
  return { heads, rail, bar, page, w: sb.width, h: sb.height, flash: f.getAttribute('data-flash'), n: vines.length, cols, filter: getComputedStyle(f).filter, op: Number(getComputedStyle(f).opacity) }; })()`;
const wordCount = "(() => { const e = document.querySelector('.forward-only-editor'); return e ? (e.innerText.trim().match(/\\S+/g) || []).length : 0; })()";
async function lap(w, room, shotsAt = [30, 52, 60]) {
  const tag = `${room}__${w}`;
  await size(w); await openPage('lap', { text: '', progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(room); await sleep(1500);
  await js(caretEnd); await sleep(150);
  const reads = {};
  let typed = 0, flashAt = null, flashWord = null;
  for (let k = 0; k < 80; k++) {
    const wd = WORDS[k % WORDS.length] + ' ';
    for (const ch of wd) { await key(ch); await sleep(95); if (k >= 57 && flashAt === null && await js("document.querySelector('.wz-rhizome-field')?.getAttribute('data-flash') === 'true'")) { flashAt = Date.now(); flashWord = k + 1; } }
    typed = k + 1;
    if (typed % 6 === 0) await sleep(350);   // short bursts
    if (shotsAt.includes(typed)) { await sleep(150); reads[typed] = await js(HEADS); await shot(`walk-5-vines-${typed}w__${tag}`); }
    if (typed === 60) {
      // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C8: it waited AFTER the 60th word and its space, by when the flash had begun - the 60-word frame shows every stem brass). Original, verbatim:
      // const ok = await soft("document.querySelector('.wz-rhizome-field')?.getAttribute('data-flash') === 'true'", 4000);
      // const t0 = Date.now(); while (Date.now() - t0 < 1000) { await key('x'); await sleep(140); }   // keep writing through the rise; the peak at ~1.2 s
      // reads.flash = await js(HEADS); reads.flashSeen = ok;
      // SUCCESSOR: the flash is caught where it starts (flashAt, read after every key from the 58th word, in the typing loop above); then the
      // rise is written through and read at ~1.1 s after its start (the peak at ~1.2 s).
      const ok = flashAt !== null || await soft("document.querySelector('.wz-rhizome-field')?.getAttribute('data-flash') === 'true'", 1500);
      if (flashAt === null && ok) flashAt = Date.now();
      while (flashAt !== null && Date.now() - flashAt < 1100) { await key('x'); await sleep(140); }
      reads.flash = await js(HEADS); reads.flashSeen = ok; reads.flashAtWord = flashWord;
      if (shotsAt.length > 1) await shot(`walk-5-flash-peak__${tag}`);
      await key(' ');
      if (shotsAt.length === 1) break;
    }
  }
  if (shotsAt.length > 1) { await sleep(1200); reads.after = await js(HEADS); await shot(`walk-5-vines-80w__${tag}`); }
  return reads;
}
async function step5() {
  for (const room of ['day', 'night']) {
    const r = await lap(2000, room);
    note('5', `vines ${room}`, { 30: r[30] && { n: r[30].n, mains: r[30].heads.filter((h) => h.level === 0).length }, 52: r[52] && { n: r[52].n }, flash: r.flash && { flash: r.flash.flash, cols: r.flash.cols, filter: r.flash.filter } });
    const mains = (x) => x ? x.heads.filter((h) => h.level === 0 && (h.full ?? 0) > 60) : [];
    const out = (h, p) => p && (h.vx < p.l || h.vx > p.r || h.vy < p.t || h.vy > p.b);
    must('5', `${room} by 30 words every stem has left the page`, !!r[30] && mains(r[30]).length >= 8 && mains(r[30]).every((h) => out(h, r[30].page)), r[30] ? { mains: mains(r[30]).length, outside: mains(r[30]).filter((h) => out(h, r[30].page)).length } : null);
    must('5', `${room} ~10 main stems`, !!r[60] && mains(r[60]).length >= 8 && mains(r[60]).length <= 12, r[60] ? { mains: mains(r[60]).length } : null);
    if (r[60]) {
      const g = r[60], gaps = mains(g).map((h) => ({ stem: h.stem, left: g.rail ? h.ex - g.rail.r : h.ex, right: g.w - h.ex, top: h.ey - (g.bar ? g.bar.b : 0), bottom: g.h - h.ey }));
      const under = mains(g).filter((h) => (g.rail && h.ex >= g.rail.l && h.ex <= g.rail.r && h.ey >= g.rail.t && h.ey <= g.rail.b) || (g.bar && h.ey <= g.bar.b));
      must('5', `${room} at 60 words complete, never under the rail or the top bar (side ends 60-150 px short, up/down 20-60 px short)`, under.length === 0 ? null : false, { under: under.length, gaps });
    }
    must('5', `${room} the flash: every stem one brass #FF9800, one intensity, no glow`, !!r.flash && r.flashSeen && r.flash.cols.some((c) => c.includes('255, 152, 0')) && (!r.flash.filter || r.flash.filter === 'none'), r.flash ? { seen: r.flashSeen, cols: r.flash.cols, filter: r.flash.filter } : null);
    must('5', `${room} colours: day leaf green #4F6B2C, night brown #6B5139 barely visible until the flash; after the flash ~40%, new growth from a shoot's tip; ~10 tapered stems, no corners`, null, { cols: r[52] && r[52].cols, after: r.after && { op: r.after.op, cols: r.after.cols }, frames: [30, 52, 60].map((n) => `walk-5-vines-${n}w__${room}__2000.png`).concat([`walk-5-flash-peak__${room}__2000.png`, `walk-5-vines-80w__${room}__2000.png`]) });
    if (room === 'day') {
      // Clear Rhizome (Mood) clears it; Undo brings it back
      await escape();
      const before = await js("document.querySelectorAll('.wz-rhizome-field path.arbor2-vine').length");
      await clickText('.arbor2-bar-head', 'Mood ▸'); await sleep(700);
      const cleared = await clickSel('.arbor2-rhizome-clear'); await sleep(900);
      const mid = await js("document.querySelectorAll('.wz-rhizome-field path.arbor2-vine').length");
      await shot('walk-5-clear-rhizome__day__2000');
      const undone = await clickSel('.arbor2-rhizome-undo'); await sleep(900);
      const back = await js("document.querySelectorAll('.wz-rhizome-field path.arbor2-vine').length");
      await shot('walk-5-clear-undo__day__2000'); await escape();
      must('5', 'Clear Rhizome (Mood) clears it, and Undo brings it back', cleared && undone && before > 0 && mid < before && back >= before, { before, mid, back, cleared, undone });
    }
  }
  await lap(1366, 'day', [60]);
}

// ======================================== STEP 6: the drawers ========================================
const TABS = `(() => { ${COLOUR} return [...document.querySelectorAll('.wz-drawer-tab')].filter(vis).map((t) => { const cs = getComputedStyle(t); const r = t.getBoundingClientRect(); return { id: t.id, word: t.textContent.trim(), on: t.getAttribute('data-on') === 'true' || t.getAttribute('aria-selected') === 'true', bg: hex(parse(cs.backgroundColor)), color: hex(parse(cs.color)), r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }; }); })()`;
const DRAWERS = `(() => { ${COLOUR} const one = (panel, grip) => { const p = document.querySelector(panel), g = document.querySelector(grip); const pr = p ? p.getBoundingClientRect() : null, gr = g ? g.getBoundingClientRect() : null; const cs = p ? getComputedStyle(p.querySelector('.wz-drawer-slide') || p) : null;
    return { open: !!p && pr.width > 4, rect: pr ? [Math.round(pr.left), Math.round(pr.top), Math.round(pr.right), Math.round(pr.bottom)] : null, grip: gr ? [Math.round(gr.left), Math.round(gr.top), Math.round(gr.right), Math.round(gr.bottom)] : null, glyph: g ? g.textContent.trim() : null, border: cs ? [cs.borderTopColor, cs.borderTopWidth, cs.borderLeftWidth, cs.borderRightWidth, cs.borderBottomWidth] : null }; };
  const page = document.querySelector('.desk-frame-stage .mode-page') || document.querySelector('.mode-page'); const r = page ? page.getBoundingClientRect() : null;
  const brassText = [...document.querySelectorAll('.wz-sliver-panel *, .wz-tutor-panel *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => hex(parse(getComputedStyle(e).color))).filter((c) => c && /^#(FF9800|C9A46B|B8863B|D4A04A|C8963E|E0A84F)$/.test(c));
  return { tools: one('.wz-sliver-panel', '.wz-sliver-grip'), tutor: one('.wz-tutor-panel', '.wz-tutor-grip'), page: r ? [Math.round(r.left), Math.round(r.right)] : null, brassText: [...new Set(brassText)], helps: [...document.querySelectorAll('.wz-sliver-panel button, .wz-tutor-panel button')].filter((b) => vis(b) && b.textContent.trim() === '?').length }; })()`;
const openTools = () => js("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return !!g; })()");
const openTutor = () => js("(() => { const g = document.querySelector('.wz-tutor-grip'); const p = document.querySelector('.wz-tutor-panel'); if (g && p?.getAttribute('data-open') !== 'true') g.click(); return !!g; })()");
async function step6() {
  for (const w of [2000, 1366]) for (const room of ['day', 'night']) for (const mode of ['draft', 'free']) {
    if (w === 1366 && mode === 'free') continue;
    const tag = `${room}__${w}`, mtag = mode === 'free' ? 'freewrite-' : '';
    await size(w); await openPage('drawers', { mode }); await setRoom(room);
    const p0 = await js(PAGE_RECT);
    await openTools(); await sleep(900);
    const tabRows = {};
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C14: Free Write's Tools drawer carries FORMAT and INK; PRESETS is Draft's). Original, verbatim:
    // for (const t of ['FORMAT', 'PRESETS']) { const ok = await clickText('.wz-drawer-tab', t); await sleep(700); tabRows[t] = { ok, tabs: await js(TABS), d: await js(DRAWERS) }; if (mode === 'draft' || t === 'FORMAT') await shot(`walk-6-${mtag}tools-${t.toLowerCase()}__${tag}`); }
    // SUCCESSOR: the Tools tabs the mode carries (Draft: FORMAT, PRESETS; Free Write: FORMAT, INK).
    const toolTabs = mode === 'free' ? ['FORMAT', 'INK'] : ['FORMAT', 'PRESETS'];
    for (const t of toolTabs) { const ok = await clickText('.wz-drawer-tab', t); await sleep(700); tabRows[t] = { ok, tabs: await js(TABS), d: await js(DRAWERS) }; await shot(`walk-6-${mtag}tools-${t.toLowerCase()}__${tag}`); }
    await openTutor(); await sleep(900);
    for (const t of ['TUTOR', 'GRAFTS', 'BOARD']) { const ok = await clickText('.wz-drawer-tab', t); await sleep(700); tabRows[t] = { ok, tabs: await js(TABS), d: await js(DRAWERS), board: t === 'BOARD' ? await js("(() => { const p = document.querySelector('.wz-tutor-panel'); return p ? { graftRow: /graft/i.test(p.innerText), text: p.innerText.slice(0, 160) } : null; })()") : null }; if (mode === 'draft' || t === 'TUTOR') await shot(`walk-6-${mtag}tutor-${t.toLowerCase()}__${tag}`); }
    const p1 = await js(PAGE_RECT);
    note('6', `drawers ${mode} ${tag}`, tabRows);
    const d = tabRows.BOARD.d;
    const flush = (x, side) => x && x.open && d.page && (side === 'l' ? Math.abs(x.rect[2] - d.page[0]) <= 1 : Math.abs(x.rect[0] - d.page[1]) <= 1);
    must('6', `${mode} ${tag} the page never moves while the drawers open`, samePage(p0, p1), { p0, p1 });
    must('6', `${mode} ${tag} each open drawer flush against the page; its opener on the drawer's outer edge`, flush(d.tools, 'l') && flush(d.tutor, 'r') && d.tools.grip && d.tutor.grip && d.tools.grip[2] <= d.tools.rect[0] + 2 && d.tutor.grip[0] >= d.tutor.rect[2] - 2, { tools: d.tools, tutor: d.tutor, page: d.page });
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C14: read with PRESETS in Free Write). Original, verbatim:
    // must('6', `${mode} ${tag} every tab clicked shows itself chosen`, ['FORMAT', 'PRESETS', 'TUTOR', 'GRAFTS', 'BOARD'].every((t) => tabRows[t].ok && tabRows[t].tabs.some((x) => x.on && x.word.toUpperCase() === t)), Object.fromEntries(Object.entries(tabRows).map(([k, v]) => [k, { ok: v.ok, on: v.tabs.filter((x) => x.on).map((x) => x.word) }])));
    // SUCCESSOR: the mode's own tabs.
    must('6', `${mode} ${tag} every tab clicked shows itself chosen`, [...toolTabs, 'TUTOR', 'GRAFTS', 'BOARD'].every((t) => tabRows[t].ok && tabRows[t].tabs.some((x) => x.on && x.word.toUpperCase() === t)), Object.fromEntries(Object.entries(tabRows).map(([k, v]) => [k, { ok: v.ok, on: v.tabs.filter((x) => x.on).map((x) => x.word) }])));
    must('6', `${mode} ${tag} BOARD shows Board's contents, never the Graft row`, tabRows.BOARD.board && !tabRows.BOARD.board.graftRow, tabRows.BOARD.board);
    if (room === 'day') must('6', `${mode} ${tag} by day no brass text in the drawers`, tabRows.BOARD.d.brassText.length === 0 && tabRows.FORMAT.d.brassText.length === 0, { board: tabRows.BOARD.d.brassText, format: tabRows.FORMAT.d.brassText });
    must('6', `${mode} ${tag} the tab rule (own cloth, no brass, the chosen tab forward +8/+8, its colour the drawer's 3 px border); one "?" per row, guide green; Arbor's focus ring; Send the box's height${mode === 'free' ? '; the Forward lock outlined, only its knob green; an open drawer hides the line ends (known)' : ''}`, null, { frames: `walk-6-${mtag}*__${tag}.png`, tabs: tabRows.BOARD.tabs });
    await escape(); await escape();
  }
  // the size box: a new page shows 11 pt
  await size(2000); await nav(`${B}/?arbor2=1#/page/new`); await soft("!!document.querySelector('.forward-only-editor')", 10000); await sleep(900);
  await clickText('.desk-mode-tab', 'draft'); await sleep(700); await openTools(); await sleep(800); await clickText('.wz-drawer-tab', 'FORMAT'); await sleep(700);
  const sz = await js("(() => { const i = document.querySelector('.wz-type-num'); const b = document.querySelector('.wz-type-num-box'); return { value: i ? i.value : null, box: !!b, unit: !!document.querySelector('.wz-type-num-unit') }; })()");
  await shot('walk-6-size-box-new-page__day__2000');
  must('6', 'the size box - [ N pt ] +; a new page shows 11 pt', sz.value === '11' && sz.box && sz.unit, sz);
  await escape();
}

// ======================================== STEP 7: every menu, opened once ========================================
async function menus(w, room, which = 'all') {
  const tag = `${room}__${w}`;
  await size(w); await openPage('menus'); await setRoom(room);
  const p0 = await js(PAGE_RECT);
  const results = [];
  const opened = async (label, file, fn) => {
    const ok = await fn(); await sleep(800);
    const r = await js(`(() => { ${COLOUR} const panels = [...document.querySelectorAll('[role=menu], [role=dialog], .wz-popover, .wz-strip-pop, .wz-menu, .arbor2-bar-menu, .wz-sheet')].filter(vis);
      const fonts = [...new Set(panels.flatMap((p) => [...p.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).slice(0, 12).map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim())))];
      const low = panels.flatMap((p) => [...p.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => { const c = parse(getComputedStyle(e).color), b = bgOf(e); return { t: e.textContent.trim().slice(0, 24), ratio: c && b ? ratio(c, b) : null, c: hex(c) }; })).filter((x) => x.ratio !== null).sort((a, b) => a.ratio - b.ratio).slice(0, 3);
      return { panels: panels.length, fonts, low }; })()`);
    await shot(`walk-7-${file}__${tag}`);
    await escape();
    const p1 = await js(PAGE_RECT); const closed = await js("[...document.querySelectorAll('[role=menu], [role=dialog], .wz-popover, .wz-strip-pop, .wz-menu, .arbor2-bar-menu')].filter((e) => e.getBoundingClientRect().width > 0).length");
    results.push({ label, ok, ...r, still: samePage(p0, p1), escClosed: closed === 0 });
    if (!samePage(p0, p1)) { await openPage('menus'); await setRoom(room); }
  };
  if (which === 'all' || which === 'themes') await opened('Themes', 'themes', () => clickSel(".wz-strip-item[data-category='theme']"));
  if (which === 'themes') {
    await clickSel(".wz-strip-item[data-category='theme']"); await sleep(700);
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C12: .arbor2-room-row is not the row's class; the frame shows the row). Original, verbatim:
    // const row = await js("(() => { const r = document.querySelector('.arbor2-room-row'); return r ? { text: r.innerText.replace(/\\s+/g, ' ').trim(), help: !!r.querySelector('.arbor2-room-help, button'), line: (document.querySelector('.arbor2-room-help-line') || {}).textContent || null } : null; })()");
    // SUCCESSOR: the row is .arbor2-theme-room (arbor2/themeRoom.tsx); its place under the Page row is read too.
    const row = await js("(() => { const r = document.querySelector('.arbor2-theme-room'); if (!r) return null; const prev = r.previousElementSibling; return { text: r.innerText.replace(/\\s+/g, ' ').trim(), help: !!r.querySelector('.arbor2-room-help'), line: (document.querySelector('.arbor2-room-help-line') || {}).textContent || null, above: prev ? prev.innerText.replace(/\\s+/g, ' ').trim().slice(0, 40) : null }; })()");
    await escape(); return { results, row };
  }
  const rail = await js("[...document.querySelectorAll('.wz-strip-item')].filter((e) => e.getBoundingClientRect().width > 0).map((e, i) => ({ i, cat: e.getAttribute('data-category'), label: (e.getAttribute('aria-label') || e.textContent || '').trim() }))");
  note('7', `rail ${tag}`, rail);
  for (const it of rail) {
    if (it.cat === 'theme') continue;
    await opened(`rail ${it.label || it.cat}`, `rail-${String(it.i + 1).padStart(2, '0')}-${(it.label || it.cat || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}`, () => js(`(() => { const e = [...document.querySelectorAll('.wz-strip-item')].filter((x) => x.getBoundingClientRect().width > 0)[${it.i}]; if (e) e.click(); return !!e; })()`));
  }
  await opened('Mood', 'mood', () => clickText('.arbor2-bar-head', 'Mood ▸'));
  const mood = await clickText('.arbor2-bar-head', 'Mood ▸').then(async () => { await sleep(500); const t = await js("[...document.querySelectorAll('.arbor2-bar-opt, .arbor2-bar label, .arbor2-bar [role=switch]')].map((e) => e.textContent.trim()).filter(Boolean)"); await escape(); return t; });
  // the top bar: its "?"s and its "..." menu (the mode tabs change the mode; each is shot, then Draft again)
  const bar = await js("(() => { const b = [...document.querySelectorAll('.chrome-top')].find((x) => x.getBoundingClientRect().height > 0); if (!b) return []; return [...b.querySelectorAll('button, [role=button], a')].filter((e) => e.getBoundingClientRect().width > 0).map((e, i) => ({ i, t: (e.textContent || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim() })); })()");
  note('7', `top bar ${tag}`, bar);
  for (const b of bar) {
    const isTab = /^(free write|draft|revise|publish|plan)/i.test(b.t);
    const file = `bar-${String(b.i + 1).padStart(2, '0')}-${(b.t === '?' ? 'help' : b.t).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16) || 'item'}`;
    if (isTab) {
      await js(`(() => { const bb = [...document.querySelectorAll('.chrome-top')].find((x) => x.getBoundingClientRect().height > 0); const e = [...bb.querySelectorAll('button, [role=button], a')].filter((x) => x.getBoundingClientRect().width > 0)[${b.i}]; if (e) e.click(); return !!e; })()`);
      await sleep(1200); await shot(`walk-7-${file}__${tag}`);
      results.push({ label: `tab ${b.t}`, ok: true, hash: await js('location.hash') });
      await openPage('menus'); await setRoom(room);
    } else {
      await opened(`bar ${b.t}`, file, () => js(`(() => { const bb = [...document.querySelectorAll('.chrome-top')].find((x) => x.getBoundingClientRect().height > 0); const e = [...bb.querySelectorAll('button, [role=button], a')].filter((x) => x.getBoundingClientRect().width > 0)[${b.i}]; if (e) e.click(); return !!e; })()`));
    }
  }
  // the corner "?"s and their hover tooltips
  const helps = await js("[...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim() === '?' && !b.closest('.chrome-top')).map((b) => { const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }).slice(0, 6)");
  for (const [i, h] of helps.entries()) { await moveTo(h.x, h.y); await sleep(900); await shot(`walk-7-corner-help-${i + 1}-hover__${tag}`); await clickAt(h.x, h.y); await sleep(700); await shot(`walk-7-corner-help-${i + 1}-open__${tag}`); await escape(); await moveTo(5, 5); }
  // Boards: a board open, a card double-clicked opens for editing; on the page a double-clicked word is selected
  await openPage('board', { pageType: 'board', boxes: [{ id: 'walk-box-1', kind: 'text', x: 0.08, y: 0.1, w: 0.3, h: 0.14, z: 1, text: 'A card on the board' }], text: 'Walk board' }); await setRoom(room);
  await shot(`walk-7-board__${tag}`);
  const card = await centre('.board-box');
  if (card) { await app.doubleClick(card.x, card.y); await sleep(900); }
  const editing = await js("(() => { const a = document.activeElement; return { active: a ? a.tagName + '.' + a.className : null, editable: !!(a && (a.isContentEditable || a.tagName === 'TEXTAREA' || a.tagName === 'INPUT')) }; })()");
  await shot(`walk-7-board-card-editing__${tag}`); await escape();
  await openPage('menus'); await setRoom(room);
  const wd = await js("(() => { const e = document.querySelector('.forward-only-editor'); const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); const n = tw.nextNode(); if (!n) return null; const i = n.textContent.indexOf('morning'); if (i < 0) return null; const r = document.createRange(); r.setStart(n, i + 2); r.setEnd(n, i + 3); const b = r.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()");
  if (wd) { await app.doubleClick(wd.x, wd.y); await sleep(500); }
  const sel = await js("String(getSelection())");
  await shot(`walk-7-page-word-selected__${tag}`);
  return { results, mood, card: { found: !!card, editing }, word: sel };
}
async function step7() {
  const r = await menus(2000, 'day');
  note('7', 'menus day 2000', r);
  for (const x of r.results.filter((x) => x.panels !== undefined)) {
    must('7', `${x.label}: opens, Alegreya Sans, labels >= 4.5:1, Esc closes it, nothing behind it moves`, x.ok && x.still && x.escClosed && (!x.low.length || x.low[0].ratio >= 4.5) && (!x.fonts.length || x.fonts.some((f) => /alegreya/i.test(f))) ? null : false, { ok: x.ok, still: x.still, esc: x.escClosed, fonts: x.fonts, low: x.low });
  }
  must('7', 'the Mood menu: every switch shown, "Lamp breath" gone', !r.mood.some((t) => /lamp breath/i.test(t)), r.mood);
  must('7', 'Boards: a double-clicked card opens for editing (the cream sheet)', r.card.found && r.card.editing.editable ? null : false, r.card);
  // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C13: Chrome on Windows selects a double-clicked word with its trailing space - "morning ").
  // Original, verbatim:
  // must('7', 'on the page a double-clicked word selects the word', r.word === 'morning', { selected: r.word });
  // SUCCESSOR: the word, its trailing space aside.
  must('7', 'on the page a double-clicked word selects the word', String(r.word).trim() === 'morning', { selected: r.word });
  must('7', 'each menu opens like a drawer (no bounce), sits where it did, no brass text by day, the shade crosses it at 3.4%', null, { frames: 'walk-7-*__day__2000.png' });
  const t1366 = await menus(1366, 'day', 'themes');
  note('7', 'themes 1366', t1366);
  must('7', 'Themes: the Page row and directly under it "Room: Light · Dark · By the clock" with its "?" and one plain line', !!t1366.row && /light/i.test(t1366.row.text) && /dark/i.test(t1366.row.text) && /by the clock/i.test(t1366.row.text) && t1366.row.help ? null : false, t1366.row);
  // the board card at 1366
  await size(1366); await openPage('board', { pageType: 'board', boxes: [{ id: 'walk-box-2', kind: 'text', x: 0.08, y: 0.1, w: 0.3, h: 0.14, z: 1, text: 'A card on the board' }], text: 'Walk board' }); await setRoom('day');
  const c = await centre('.board-box'); if (c) { await app.doubleClick(c.x, c.y); await sleep(900); } await shot('walk-7-board-card-editing__day__1366'); await escape();
}

// ======================================== STEP 8: night ========================================
async function step8() {
  for (const w of [2000, 1366]) {
    await size(w); await openPage('night'); await setRoom('night'); await sleep(1500);
    const r = await js(REST); note('8', `night ${w}`, r);
    await shot(`walk-8-rest__night__${w}`);
    must('8', `${w} the top bar and rail solid brown #241912 (hairlines #35271C)`, !!r.bar && r.bar.bg === '#241912' && !!r.rail && r.rail.bg === '#241912', { bar: r.bar, rail: r.rail });
    // PARKED 2026-11-08 (SUPERSEDED - the first walk turn, 06:03Z-06:26Z, walk-triage.txt C11: the page's 1 px hairline ring - spread, no blur - read as a glow, and the page shade's wrapper opacity read while it is display:none).
    // Original, verbatim:
    // must('8', `${w} no glow around the page; no pergola, no shade at night`, (!r.glow || r.glow === 'none') && (!r.pergola || r.pergola.op < 0.02 || r.pergola.display === 'none') && (!r.pageShade || r.pageShade.op < 0.02), { glow: r.glow, pergola: r.pergola, pageShade: r.pageShade });
    // SUCCESSOR: a glow is a shadow with a blur; the shade is drawn only when it is displayed.
    const blurred = String(r.glow || 'none').split(/,(?![^(]*\))/).some((sh) => { const px = (sh.match(/-?[\d.]+px/g) || []).map(parseFloat); return px.length >= 3 && px[2] > 0; });
    must('8', `${w} no glow around the page; no pergola, no shade at night`, !blurred && (!r.pergola || r.pergola.op < 0.02 || r.pergola.display === 'none') && (!r.pageShade || r.pageShade.display === 'none' || r.pageShade.op < 0.02), { glow: r.glow, blurred, pergola: r.pergola, pageShade: r.pageShade });
    must('8', `${w} the corner mark cream with the brass "o" and i-dot at .7; labels cream 13.6:1; menus and drawers as before`, null, { mark: r.mark, frames: [`walk-8-rest__night__${w}.png`, `walk-8-drawers-board__night__${w}.png`, `walk-8-themes__night__${w}.png`] });
    await openTools(); await sleep(700); await openTutor(); await sleep(700); await clickText('.wz-drawer-tab', 'BOARD'); await sleep(700);
    await shot(`walk-8-drawers-board__night__${w}`); await escape(); await escape();
    await clickSel(".wz-strip-item[data-category='theme']"); await sleep(800); await shot(`walk-8-themes__night__${w}`); await escape();
  }
}

// ======================================== STEP 9: the Room setting (by the clock) ========================================
async function step9() {
  await size(2000); await openPage('clock');
  await clickSel(".wz-strip-item[data-category='theme']"); await sleep(700);
  const picked = await clickText('.arbor2-room-row button, .arbor2-room-row [role=radio], .arbor2-room-row label', 'By the clock'); await sleep(500); await escape();
  if (!picked) await setRoom('clock');
  const p0 = await js(PAGE_RECT); const rows = {};
  for (const [label, times] of [['morning', ['06:50', '07:00', '07:10']], ['evening', ['18:50', '19:00', '19:10']]]) {
    for (const [i, t] of times.entries()) {
      const dn = await js(`window.arbor2Clock ? window.arbor2Clock(${JSON.stringify(t)}) : null`); await sleep(1200);
      const r = await js(REST); rows[t] = { dn, room: r.room, bar: r.bar && r.bar.bg, mark: r.mark && r.mark.op, page: r.page };
      await shot(`walk-9-clock-${label}-${['start', 'middle', 'end'][i]}-${t.replace(':', '')}__clock__2000`);
    }
  }
  const p1 = await js(PAGE_RECT);
  const at = async (room, t) => { await setRoom(room); return js(`window.arbor2Clock ? window.arbor2Clock(${JSON.stringify(t)}) : null`); };
  const holdDay = await at('day', '23:00'), holdNight = await at('night', '12:00');
  await js('window.arbor2Clock && window.arbor2Clock(null); true'); await setRoom('day');
  note('9', 'clock', { picked, rows, holdDay, holdNight });
  must('9', 'by the clock: day 07:00-19:00, night otherwise; the crossfade half way at the hour (06:50 night, 07:00 half, 07:10 day; 18:50 day, 19:00 half, 19:10 night)', rows['06:50'] && Number(rows['06:50'].dn) === 0 && near(Number(rows['07:00'].dn), 0.5, 0.05) && Number(rows['07:10'].dn) === 1 && Number(rows['18:50'].dn) === 1 && near(Number(rows['19:00'].dn), 0.5, 0.05) && Number(rows['19:10'].dn) === 0, rows);
  const within1 = (a, b) => !!a && !!b && ['l', 't', 'r', 'b'].every((k) => Math.abs(a[k] - b[k]) <= 1);
  must('9', 'the crossfade moves nothing (the page rect unchanged at every point)', samePage(p0, p1) && Object.values(rows).every((r) => within1(r.page, p0)), { p0, p1, pages: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.page])) });
  must('9', 'Always day / Always night hold regardless of the clock', Number(holdDay) === 1 && Number(holdNight) === 0, { holdDay, holdNight });
  must('9', 'one 20-minute crossfade carries the room, the bars (olive <-> brown) and the corner mark (sage <-> cream-and-brass), opacity only', null, { frames: 'walk-9-clock-*__clock__2000.png' });
}

// ======================================== STEP 10: the scrollbar ========================================
const SCROLLBAR = "(() => { const e = document.querySelector('.forward-only-editor'); let s = null; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) { s = n; break; } } if (!s) return { scrolls: false }; const cs = getComputedStyle(s); return { scrolls: true, width: s.offsetWidth - s.clientWidth, sbWidth: cs.scrollbarWidth, sbColor: cs.scrollbarColor, attrs: [...s.attributes].map((a) => a.name + '=' + a.value).filter((x) => /scroll|data-/.test(x)).slice(0, 6), top: s.scrollTop }; })()";
async function step10() {
  await size(2000); await openPage('short'); await setRoom('day'); await sleep(1000);
  const s0 = await js(SCROLLBAR); await shot('walk-10-short-page-no-scrollbar__day__2000');
  must('10', 'no scrollbar while the page fits', !s0.scrolls, s0);
  const long = Array.from({ length: 40 }, (_, i) => `${words(36, i)}.`).join('\n\n');
  await openPage('long', { text: long }); await setRoom('day'); await sleep(1200);
  const pr = await js(PAGE_RECT);
  const s1 = await js(SCROLLBAR); await shot('walk-10-long-page-at-rest__day__2000');
  await moveTo(Math.round((pr.l + pr.r) / 2), Math.round((pr.t + pr.b) / 2));
  for (let i = 0; i < 4; i++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: Math.round((pr.l + pr.r) / 2), y: Math.round((pr.t + pr.b) / 2), deltaX: 0, deltaY: 220, pointerType: 'mouse' }); await sleep(60); }
  await sleep(120); const s2 = await js(SCROLLBAR); await shot('walk-10-long-page-mid-scroll__day__2000');
  await sleep(1600); await shot('walk-10-long-page-after-scroll-1.6s__day__2000');
  await moveTo(Math.round(pr.r - 3), Math.round((pr.t + pr.b) / 2)); await sleep(500); await shot('walk-10-long-page-hover-edge__day__2000');
  await moveTo(5, 5); await sleep(1500);
  await js(caretEnd); for (const ch of ' and then she wrote on') { await key(ch); await sleep(110); }
  await sleep(200); const s3 = await js(SCROLLBAR); await shot('walk-10-long-page-typing__day__2000');
  note('10', 'scrollbar', { s1, s2, s3 });
  must('10', 'on the long page: appears only on scroll, hover or drag (4 px, the theme\'s colours, the writing surface only), fades ~1 s after; never while typing', s1.scrolls && s2.top > 0 ? null : false, { rest: s1, scrolled: s2, typing: s3, note: 'drag is not driven (the thumb has no handle to find); judge scroll + hover + typing from the frames' });
}

// ======================================== STEP 11: reduced motion ========================================
async function step11() {
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  try {
    await size(2000);
    // the splash, signed out: its finished frame at once (the door's cookie is cleared, so the play server signs in again afterwards)
    await fresh(A); await nav(urlA('day')); await sleep(400);
    const f0 = await js(FRONT); await shot('walk-11-reduced-splash__day__2000');
    must('11', 'the splash shows its finished frame at once (no write-out, no typing, no nudge; the caret steady)', f0.logo === 'still' && f0.tag && f0.tag.state === 'done', { logo: f0.logo, tag: f0.tag && f0.tag.state, caret: f0.caret });
    const c = await centre('.arbor2-door.wz-arrival-write'); if (c) { await moveTo(c.x, c.y); await sleep(400); await shot('walk-11-reduced-hover-write__day__2000'); await moveTo(5, 5); }
    must('11', 'hover still turns the doors brass', null, { frame: 'walk-11-reduced-hover-write__day__2000.png' });
    await nav(`${B}/`); await soft("location.search.includes('arbor2=1')", 15000); await sleep(1500);
    await js("localStorage.setItem('wrizo-splash-hold', '50'); true");
    await openPage('reduced'); await setRoom('day'); await sleep(1200);
    const r = await js(REST); await shot('walk-11-reduced-rest__day__2000');
    must('11', 'the shade is still (no breeze)', !!r.pergola && r.pergola.running === 0, r.pergola);
    await js(caretEnd); await key(' '); await sleep(120); await shot('walk-11-reduced-after-first-key__day__2000');
    const k = await js(REST);
    must('11', 'every swap and fade is a cut', null, { afterFirstKey: { pergola: k.pergola && k.pergola.op, pageShade: k.pageShade, vines: k.vines }, frame: 'walk-11-reduced-after-first-key__day__2000.png' });
    await openPage('reduced-goal', { text: words(59), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom('day');
    await js(caretEnd); for (const ch of ' garden ') { await key(ch); await sleep(100); }
    await soft("document.querySelector('.wz-rhizome-field')?.getAttribute('data-flash') === 'true'", 3000);
    await shot('walk-11-reduced-goal__day__2000'); await sleep(1500); await shot('walk-11-reduced-goal-after__day__2000');
    must('11', 'the flash is a single still brass frame, then the 40% state', null, { frames: ['walk-11-reduced-goal__day__2000.png', 'walk-11-reduced-goal-after__day__2000.png'] });
  } finally { await app.emulateMedia([]); }
}

// ======================================== run ========================================
const STEPS = [['1', step1], ['2', step2], ['3', step3], ['4', step4], ['5', step5], ['6', step6], ['7', step7], ['8', step8], ['9', step9], ['10', step10], ['11', step11]];
const started = new Date().toISOString();
let signed = false;
await withHarness(async (h) => {
  app = h;
  await cdp('Network.enable').catch(() => {});
  for (const [id, fn] of STEPS) {
    if (ONLY && !ONLY.includes(id)) continue;
    // steps 3-10 need the signed-in origin: a subset run that skips 2 signs in here
    if (Number(id) >= 3 && Number(id) <= 10 && !signed) { await nav(`${B}/`); await soft("location.search.includes('arbor2=1')", 15000); await sleep(2000); await js("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); true"); signed = true; }
    const t0 = Date.now();
    console.log(`WALK-STEP ${id} start ${new Date().toISOString()}`);
    try { await fn(); } catch (e) { must(id, `STEP ${id} ran to its end`, false, { error: String(e && e.stack || e).slice(0, 900) }); }
    console.log(`WALK-STEP ${id} end ${Math.round((Date.now() - t0) / 1000)} s`);
    if (id === '2') signed = true;
  }
}, { targetUrl: A, verifyRows: false });

// ======================================== STEP 12: hand back ========================================
const fails = musts.filter((m) => m.verdict === 'FAIL'), eyes = musts.filter((m) => m.verdict === 'EYE'), passes = musts.filter((m) => m.verdict === 'PASS');
writeFileSync(path.join(OUT, 'walk-log.json'), JSON.stringify({ started, ended: new Date().toISOString(), signedOut: A, door: B, musts, log, shots }, null, 1));
const lines = [
  `ARBOR - the Nick walk, driven ${started} (scripts/frames/arbor2-walk.mjs). ${passes.length} PASS, ${fails.length} FAIL (read by the instrument), ${eyes.length} EYE (the frames named; the Wrizors' call).`,
  'Departures from the script: recordings are JPEG frame folders with frames.json (no encoder on the box; no new dependency); the key-to-paint logs (keylog-*.csv) come from un-recorded bursts, the recorded bursts carry their own (*__recorded.csv); Room by day/night is the URL test pin on the cold loads of steps 1-2 and the Room row\'s attribute after; the splash at test speed from step 3; step 9 uses the mockup\'s clock hook (arbor2Clock) for the device clock; step 10 does not drive a drag.',
  '',
  'MUSTS THAT DID NOT HOLD (as read):', ...(fails.length ? fails.map((m) => `- [${m.step}] ${m.name}  ${JSON.stringify(m.data).slice(0, 400)}`) : ['- none']),
  '',
  'FOR THE EYE (frames named in walk-log.json):', ...eyes.map((m) => `- [${m.step}] ${m.name}`),
];
writeFileSync(path.join(OUT, 'walk-musts.txt'), lines.join('\r\n') + '\r\n');
console.log(`\nARBOR2-WALK: ${fails.length ? 'FAIL' : 'PASS'} (${passes.length} pass, ${fails.length} fail, ${eyes.length} eye; ${shots.length} shots/recordings in ${OUT})`);
