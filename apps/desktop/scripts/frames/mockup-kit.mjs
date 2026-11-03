// MOCKUP KIT - the checks and pictures both theme mockups share (the same file in arbor-mockup and machina-mockup; a screens file imports it).
// THE DRAWER ALIGNMENT (Nick, via Fable, Nov 1; all themes): CLOSED, the opener tab at the page's edge (today's rect), its arrow pointing out.
// OPEN, the drawer FLUSH against the page (no gap), the tab on the drawer's OUTER edge, its arrow pointing back toward the page ("close"). The
// tab moves with the drawer's motion (the same tokens; reduced motion = a cut). The page never moves; the drawers stay mirrored, both-or-one.
// drawerProof() throws with its numbers when a check fails. walkScreens() are THE NICK WALK's pictures: both drawers, each room x page (the
// job's two tones are the page), at 2000 and 1366 wide - a 2000 screen sets its own window (the job's widths are 1366/1920 only), so run the
// walk with -f widths=1366. Nothing here writes storage; the page comes from the caller's own seam-seeded open().
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const raf2 = 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))';

// every rect the checks read, in CSS px (getBoundingClientRect includes the sliding layer's transform)
const RECTS = `(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, r: Math.round(r.right * 10) / 10, t: Math.round(r.top * 10) / 10, b: Math.round(r.bottom * 10) / 10, w: Math.round(r.width * 10) / 10 }; };
  const ed = document.querySelector('${ED}');
  return { page: q('.desk-frame-stage .mode-page') || q('.desk-frame-stage .mode-pagecol'), lt: q('.wz-sliver-grip'), rt: q('.wz-tutor-grip'), lp: q('.wz-sliver-panel'), rp: q('.wz-tutor-panel'),
    ls: q('.wz-sliver-panel .wz-drawer-slide'), rs: q('.wz-tutor-panel .wz-drawer-slide'), la: document.querySelector('.wz-sliver-grip-glyph')?.textContent.trim() ?? null, ra: document.querySelector('.wz-tutor-grip-glyph')?.textContent.trim() ?? null,
    lo: document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true', ro: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true',
    lanchor: q('.desk-frame-sliver-anchor'), ranchor: q('.desk-frame-tutor-anchor'), sameEditor: !!ed && ed.__kitMark === 1, w: innerWidth, zoom: !!document.querySelector(".mode-pagecol[data-zoom='true']") }; })()`;
const STRIPS = `(() => { const one = (p, b) => { const pe = document.querySelector(p), be = document.querySelector(b); if (!pe || !be) return null; const sc = String(getComputedStyle(pe).scrollbarColor); const at = sc.lastIndexOf('rgb'); const m = at >= 0 ? [null, sc.slice(at)] : null;
  return { strip: pe.offsetWidth - pe.clientWidth, track: m ? m[1] : sc, ground: getComputedStyle(be).backgroundColor }; };
  return { l: one('.wz-sliver-panel', '.wz-sliver-panel > .wz-drawer-slide'), r: one('.wz-tutor-panel', '.wz-tutor-panel > .wz-drawer-slide') }; })()`;
const MARK = `(() => { const ed = document.querySelector('${ED}'); if (ed) ed.__kitMark = 1; document.querySelector('${ED}')?.blur(); getSelection()?.removeAllRanges(); return !!ed; })()`;
const FINISH = `(() => { document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); return true; })()`;
// pause every running animation at half its own duration (the drawer's transitions all start in the same frame, so they stand at one moment)
const HALF = `(() => { const out = []; document.getAnimations().filter((a) => a.playState === 'running').forEach((a) => { a.pause(); const d = Number(a.effect?.getTiming().duration) || 0; a.currentTime = d / 2;
  out.push([a.transitionProperty || a.animationName || '?', String(a.effect?.target?.className || '').split(' ')[0], d]); }); return out; })()`;
const click = (sel) => `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`;
// the transition on one property of one element: [duration, easing]
const TRANS = (sel, prop) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const cs = getComputedStyle(e); const ps = cs.transitionProperty.split(',').map((x) => x.trim());
  const ds = cs.transitionDuration.split(',').map((x) => x.trim()), fs = cs.transitionTimingFunction.split(/,(?![^(]*\\))/).map((x) => x.trim()); const i = ps.indexOf(${JSON.stringify(prop)}); const j = i < 0 ? ps.indexOf('all') : i;
  return j < 0 ? null : [ds[j % ds.length], fs[j % fs.length]]; })()`;
const near = (a, b, tol = 1) => a != null && b != null && Math.abs(a - b) <= tol;
const samePage = (a, b) => !!a && !!b && ['l', 'r', 't', 'b'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);

/** The whole drawer check on the page the caller opened. ctx: { name, say, fail } */
export async function drawerProof(app, { name, say, fail }) {
  await app.evalJs(MARK);
  await app.evalJs(FINISH); await sleep(200);
  const c = await app.evalJs(RECTS);
  if (!c.lt || !c.rt || !c.page) fail(name, { missing: { leftTab: !!c.lt, rightTab: !!c.rt, page: !!c.page } });
  if (c.lo || c.ro) fail(name, { startsOpen: { left: c.lo, right: c.ro } });
  // the left drawer opens: stopped at half its slide, then finished
  await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(raf2);
  const paused = await app.evalJs(HALF); const midL = await app.evalJs(RECTS);
  await app.evalJs(FINISH); await sleep(250);
  const oL = await app.evalJs(RECTS);
  const sL = await app.evalJs(STRIPS);
  // the right drawer opens beside it
  await app.evalJs(click('.wz-tutor-grip')); await app.evalJs(raf2);
  await app.evalJs(HALF); const midR = await app.evalJs(RECTS);
  await app.evalJs(FINISH); await sleep(250);
  const o = await app.evalJs(RECTS);
  const sO = await app.evalJs(STRIPS);
  const both = o.lo && o.ro;
  // closing: the right one, stopped at half, then finished (both-or-one: the left stays as it was)
  await app.evalJs(click('.wz-tutor-grip')); await app.evalJs(raf2);
  await app.evalJs(HALF); const midRc = await app.evalJs(RECTS);
  await app.evalJs(FINISH); await sleep(350);
  const one = await app.evalJs(RECTS);
  const tokL = await app.evalJs(TRANS('.wz-sliver-grip', 'right')), tokLs = await app.evalJs(TRANS('.wz-sliver-panel .wz-drawer-slide', 'transform'));
  const tokR = await app.evalJs(TRANS('.wz-tutor-grip', 'left')), tokRs = await app.evalJs(TRANS('.wz-tutor-panel .wz-drawer-slide', 'transform'));
  await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(FINISH); await sleep(350);
  const shut = await app.evalJs(RECTS);
  // THE TAB ALWAYS TOUCHES ITS DRAWER (Fable's ruling, Nov 1): a drawer that scrolls keeps its scrollbar on its INNER side (the page's side),
  // never between the drawer and its tab. So that both drawers scroll at every width, a tall block is put at the end of each drawer's sliding
  // box for this check only (removed after); then each opens, is stopped at half its slide, and is read at rest: the visible box's outer
  // edge must meet the tab, and the scrollbar's strip must lie between the box and the page.
  await app.evalJs("(() => { for (const b of document.querySelectorAll('.wz-sliver-panel > .wz-drawer-slide, .wz-tutor-panel > .wz-drawer-slide')) { const d = document.createElement('div'); d.className = 'kit-tall'; d.style.height = '3000px'; b.appendChild(d); } return true; })()");
  await sleep(500);
  await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(raf2);
  await app.evalJs(HALF); const tMidL = await app.evalJs(RECTS);
  await app.evalJs(FINISH); await sleep(250);
  await app.evalJs(click('.wz-tutor-grip')); await app.evalJs(raf2);
  await app.evalJs(HALF); const tMidR = await app.evalJs(RECTS);
  await app.evalJs(FINISH); await sleep(250);
  const tall = await app.evalJs(RECTS);
  const strips = await app.evalJs("(() => { const s = (q) => { const p = document.querySelector(q); return p ? p.offsetWidth - p.clientWidth : null; }; return { l: s('.wz-sliver-panel'), r: s('.wz-tutor-panel') }; })()");
  await app.evalJs(click('.wz-tutor-grip')); await app.evalJs(FINISH); await sleep(300);
  await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(FINISH); await sleep(300);
  await app.evalJs("(() => { document.querySelectorAll('.kit-tall').forEach((d) => d.remove()); return true; })()"); await sleep(300);
  const touch = {
    scrolls: strips.l > 0 && strips.r > 0,
    stripInner: !!tall.ls && !!tall.rs && near(tall.ls.l, tall.lp.l) && near(tall.lp.r - tall.ls.r, strips.l) && near(tall.rs.r, tall.rp.r) && near(tall.rs.l - tall.rp.l, strips.r),
    touchAtRest: tall.lo && tall.ro && near(tall.lt.r, tall.ls.l) && near(tall.rt.l, tall.rs.r),
    touchMoving: tMidL.lo && near(tMidL.lt.r, tMidL.ls.l, 1.5) && tMidR.ro && near(tMidR.rt.l, tMidR.rs.r, 1.5),
  };

  // reduced motion: the tab cuts (no travel, no running transition on it) - the slide has no travel either
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(150);
  await app.evalJs(click('.wz-sliver-grip'));
  // (driver fix after green leg g5, runs 41348481835 / 41348508284 / 41352272894: the read came in the very frame the drawer turned open - the
  // reading showed it open, its arrow flipped, its tab still at the closed place and nothing running - so the cut had not been drawn yet. The
  // read now waits for the drawer to report open, then lets two frames pass; a cut is drawn by then, travel would still be on its way.)
  await app.evalJs(`new Promise((done) => { const t0 = performance.now(); const f = () => (document.querySelector(".wz-sliver[data-open='true']") || performance.now() - t0 > 1000) ? done(true) : requestAnimationFrame(f); f(); })`);
  await app.evalJs(raf2);
  // (instrument fix after red leg 41343731092: a cut is about TRAVEL - the tab's 0.01 ms colour change (olive to brass as it opens) was caught
  // mid-frame once; only the properties that move the tab are read now. Original, verbatim:
  // const rmRun = await app.evalJs("document.getAnimations().filter((a) => a.playState === 'running' && /wz-(sliver|tutor)-grip/.test(String(a.effect?.target?.className || ''))).map((a) => [a.transitionProperty, Number(a.effect.getTiming().duration)])");
  const rmRun = await app.evalJs("document.getAnimations().filter((a) => a.playState === 'running' && /wz-(sliver|tutor)-grip/.test(String(a.effect?.target?.className || '')) && /^(right|left|transform|translate|inset)/.test(String(a.transitionProperty || ''))).map((a) => [a.transitionProperty, Number(a.effect.getTiming().duration)])");
  // (instrument fix after red leg 41347601929: the global reduced-motion floor makes every transition 0.01 ms - that IS the cut - and one was
  // caught mid-frame; a cut is read as no travel transition longer than 1 ms)
  // (diagnostics only, after green leg g7 run 41360046032 - the tab still at its closed place, the drawer open, nothing running: every
  // animation on the grip as it stands, the grip's computed right, and the same reading 300 ms later. No check reads these.)
  const rmAll = await app.evalJs("document.getAnimations().filter((a) => /wz-(sliver|tutor)-grip/.test(String(a.effect?.target?.className || ''))).map((a) => [a.transitionProperty || a.animationName, a.playState, Math.round(Number(a.currentTime) * 100) / 100, Number(a.effect.getTiming().duration), Number(a.effect.getTiming().delay)])");
  const rmRight = await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); return g ? [getComputedStyle(g).right, getComputedStyle(g).transitionDuration, getComputedStyle(g).transitionProperty] : null; })()");
  rmRun.splice(0, rmRun.length, ...rmRun.filter((x) => x[1] > 1));
  const rm = await app.evalJs(RECTS);
  await sleep(300);
  const rmLater = await app.evalJs(RECTS);
  const rmDiag = { rmAll, rmRight, later: rmLater.lt };
  await app.evalJs(FINISH); await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(FINISH);
  await app.emulateMedia([]); await sleep(300);

  const rgbOf = (x) => (String(x).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map((v) => Math.round(Number(v))).join(',');
  // (instrument fix after red leg 41347631930: rgbOf was written without its backslashes, read every colour as '' and so passed blind; this
  // liveness check refuses to run on a reader that cannot tell two colours apart)
  if (rgbOf('rgb(1, 2, 3)') !== '1,2,3' || rgbOf('rgba(0, 0, 0, 0)') === rgbOf('rgb(244, 245, 246)')) fail(name, { instrument: 'rgbOf is blind' });
  // a strip between the box and the page is only allowed as the drawer's own scrollbar, its track in the drawer's own ground
  const stripOk = (gap, st) => near(gap, 0) || (!!st && near(gap, st.strip) && rgbOf(st.track) === rgbOf(st.ground));
  const travelL = c.lt.r - oL.lt.r;                 // how far the left tab went out
  // (instrument fix after the first green look, runs 41336024311 / 41336050132: when a drawer's content scrolls, its sliding box is inset by the
  // panel's scrollbar strip on the OUTER side, so the drawer's outer edge is the PANEL's; the strip is measured at rest and the moving box's
  // edge is read through it. Originals, verbatim: leftRides near(oL.lt.r, oL.ls.l); rightRides near(o.rt.l, o.rs.r); leftMoves
  // near(midL.lt.r, midL.ls.l, 1.5); rightMoves / rightClosing near(mid.rt.l, mid.rs.r, 1.5).)
  const gl = oL.ls && oL.lp ? oL.ls.l - oL.lp.l : 0, gr = o.rs && o.rp ? o.rp.r - o.rs.r : 0;
  const progL = travelL ? (c.lt.r - midL.lt.r) / travelL : null;
  const ok = {
    // closed: today's place - each tab on its own anchor's page-side edge, the arrows pointing out
    closedLeft: near(c.lt.r, c.lanchor?.r) && c.la === '‹',
    closedRight: near(c.rt.l, c.ranchor?.l) && c.ra === '›',
    // open: the drawer meets the page where the closed tab's inner edge stood (no gap), the tab on its OUTER edge, the arrow back to the page
    // PARKED 2026-11-01 (SUPERSEDED by Fable's ruling, Nov 1: "the drawer's scrollbar goes on its inner side" - a scrolling drawer's box now
    // stands a scrollbar's strip off the page by design; green leg g3, runs 41344014235 / 41344039911). Original, verbatim:
    // leftFlush: oL.lo && near(oL.lp.r, c.lt.r) && near(oL.ls.r, c.lt.r),
    // SUCCESSOR leftFlushB: the panel meets the page; between the box and the page only the drawer's own scrollbar, in the drawer's ground.
    leftFlushB: oL.lo && near(oL.lp.r, c.lt.r) && stripOk(oL.lp.r - oL.ls.r, sL.l),
    leftRides: oL.lo && near(oL.lt.r, oL.lp.l) && near(oL.lt.t, c.lt.t) && oL.la === '›',
    // PARKED 2026-11-01 (the same ruling and runs). Original, verbatim:
    // rightFlush: o.ro && near(o.rp.l, c.rt.l) && near(o.rs.l, c.rt.l),
    // SUCCESSOR rightFlushB: the same on the right.
    rightFlushB: o.ro && near(o.rp.l, c.rt.l) && stripOk(o.rs.l - o.rp.l, sO.r),
    rightRides: o.ro && near(o.rt.l, o.rp.r) && near(o.rt.t, c.rt.t) && o.ra === '‹',
    // the tab travels WITH the drawer: at half the slide it is part way and still on the sliding edge
    leftMoves: midL.lo && progL != null && progL > 0.05 && progL < 0.95 && near(midL.lt.r, midL.ls.l - gl, 1.5),
    rightMoves: midR.ro && near(midR.rt.l, midR.rs.r + gr, 1.5) && midR.rt.l > c.rt.l + 2 && midR.rt.l < o.rt.l - 2,
    rightClosing: near(midRc.rt.l, midRc.rs.r + gr, 1.5) && midRc.rt.l > c.rt.l + 2 && midRc.rt.l < o.rt.l - 2,
    sameTokens: !!tokL && !!tokLs && !!tokR && !!tokRs && tokL[0] === tokLs[0] && tokL[1] === tokLs[1] && tokR[0] === tokRs[0] && tokR[1] === tokRs[1],
    // both-or-one: closing the right leaves the left open where it was; then each tab is back at its closed place
    bothOrOne: !one.ro && one.lo && near(one.lt.r, oL.lt.r) && near(one.rt.l, c.rt.l) && one.ra === '›',
    shutAgain: !shut.lo && !shut.ro && near(shut.lt.r, c.lt.r) && near(shut.rt.l, c.rt.l),
    // mirrored: [tab][drawer][page] on the left, [page][drawer][tab] on the right
    mirrored: !both || (o.lt.r <= o.lp.l + 1 && o.lp.r <= o.page.l + 16 && o.rp.l >= o.page.r - 16 && o.rt.l >= o.rp.r - 1),
    reducedCut: rm.lo && rmRun.length === 0 && near(rm.lt.r, oL.lt.r),
    // the tab always touches its drawer (the checks above, with both drawers scrolling)
    ...touch,
    // the page never moves and the editor is never replaced
    pageStill: [oL, midL, o, midR, midRc, one, shut, rm].every((x) => samePage(x.page, c.page)) && [oL, o, one, shut, rm].every((x) => x.sameEditor),
  };
  const brief = { ok, w: c.w, both, page: c.page, closed: { lt: c.lt, rt: c.rt }, open: { lt: o.lt, lp: o.lp, rp: o.rp, rt: o.rt }, gapToPaintedPage: { left: Math.round((c.page.l - c.lt.r) * 10) / 10, right: Math.round((c.rt.l - c.page.r) * 10) / 10 },
    drawerW: { left: o.lp ? Math.round((o.lp.w + 16) * 10) / 10 : null, right: o.rp ? Math.round((o.rp.w + 16) * 10) / 10 : null }, progL: progL != null ? Math.round(progL * 100) / 100 : null, strips: { gl: Math.round(gl * 10) / 10, gr: Math.round(gr * 10) / 10 }, zoom: c.zoom, tokens: { tokL, tokLs, tokR, tokRs }, paused: paused.length, rmRun, strips: { sL, sO }, scrolling: { strips, lt: tall.lt, ls: tall.ls, lp: tall.lp, rt: tall.rt, rs: tall.rs, rp: tall.rp, midL: [tMidL.lt?.r, tMidL.ls?.l], midR: [tMidR.rt?.l, tMidR.rs?.r] } };
  if (Object.values(ok).some((x) => !x)) fail(name, { ...brief, rm: { lo: rm.lo, lt: rm.lt, la: rm.la, rmRun, ...rmDiag }, midL: { lt: midL.lt, ls: midL.ls }, midR: { rt: midR.rt, rs: midR.rs }, midRc: { rt: midRc.rt, rs: midRc.rs }, oL: { lt: oL.lt, lp: oL.lp, ls: oL.ls }, one: { lt: one.lt, rt: one.rt, lo: one.lo, ro: one.ro } });
  say(name, brief);
  return brief;
}

/** TYPEWRITER'S ZOOM keeps today's drawers: the zoomed page is wider than the margins, so a drawer overlays it and cannot stand flush beside
 *  it; the build leaves the zoom's own drawer rule alone. On the zoomed page: each tab stays at its closed rect while its drawer opens and
 *  closes (today's rule), the arrows flip, and the page and the editor never move. */
export async function zoomDrawerProof(app, { name, say, fail }) {
  await app.evalJs(MARK); await app.evalJs(FINISH); await sleep(200);
  const c = await app.evalJs(RECTS);
  if (!c.zoom) fail(name, { zoom: false, note: 'the page did not open in Typewriter zoom' });
  await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(FINISH); await sleep(300);
  const l = await app.evalJs(RECTS);
  await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(FINISH); await sleep(300);
  await app.evalJs(click('.wz-tutor-grip')); await app.evalJs(FINISH); await sleep(300);
  const r = await app.evalJs(RECTS);
  await app.evalJs(click('.wz-tutor-grip')); await app.evalJs(FINISH); await sleep(300);
  const shut = await app.evalJs(RECTS);
  const same = (a, b) => !!a && !!b && ['l', 'r', 't', 'b'].every((k) => Math.abs(a[k] - b[k]) <= 1);
  const ok = { leftTabStays: l.lo && same(l.lt, c.lt) && l.la === '›', rightTabStays: r.ro && same(r.rt, c.rt) && r.ra === '‹', shut: !shut.lo && !shut.ro && same(shut.lt, c.lt) && same(shut.rt, c.rt),
    pageStill: [l, r, shut].every((x) => samePage(x.page, c.page) && x.sameEditor) };
  const brief = { ok, w: c.w, page: c.page, closed: { lt: c.lt, rt: c.rt }, leftOpen: { lt: l.lt, lp: l.lp }, rightOpen: { rt: r.rt, rp: r.rp } };
  if (Object.values(ok).some((x) => !x)) fail(name, brief);
  say(name, brief);
  return brief;
}

/** THE NICK WALK: closed and open (both drawers) x each room x 2000 and 1366; the job's tones give the page. open(app) = the caller's page. */
export function walkScreens(prefix, open, setRoom, openZoom = null) {
  const screens = {};
  for (const size of [2000, 1366]) for (const room of ['day', 'night']) for (const state of ['closed', 'open']) {
    screens[`${prefix}-${state}-${room}-${size}`] = async (app) => {
      if (size === 2000) await app.emulateDpr(1, 2000, 1125);
      await open(app);
      await setRoom(app, room);
      await app.evalJs(MARK);
      if (state === 'open') {
        await app.evalJs(click('.wz-sliver-grip')); await sleep(80); await app.evalJs(click('.wz-tutor-grip'));
        await app.evalJs(FINISH); await sleep(500); await app.evalJs(FINISH);
      }
      // the mockups' own control panels (never shipped) are hidden for the pictures: at 1366 they lie over the page's foot and the right drawer
      await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar, .machina2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); return true; })()");
      await sleep(400);
      const r = await app.evalJs(RECTS);
      console.log(`WALK ${prefix}-${state}-${room}-${size} ${JSON.stringify({ w: r.w, lo: r.lo, ro: r.ro, page: r.page, lt: r.lt, rt: r.rt })}`);
    };
  }
  // EVERY WALK REPEATS THE REDUCED-MOTION OPEN (Fable, Nov 1: ">= 20x per drawer per room. One more miss = a real bug"): see reducedRepeat
  screens[`${prefix}-reduced-repeat`] = async (app) => { await open(app); await reducedRepeat(app, { name: `${prefix.toUpperCase()}-REDUCED-REPEAT`, setRoom }); };
  // ...and its liveness: on Typewriter's zoomed page the tab never travels (today's drawers, ruled), so the same reading must call every open
  // there a miss. The screen passes only if the repeat FAILS there with stuck tabs - a reader that cannot fail is not run.
  if (openZoom) screens[`${prefix}-reduced-repeat-liveness`] = async (app) => {
    await openZoom(app);
    if (!(await app.evalJs("!!document.querySelector(\".mode-pagecol[data-zoom='true']\")"))) throw new Error(`${prefix.toUpperCase()}-REDUCED-LIVENESS FAILED {"zoom":false}`);
    let caught = null;
    try { await reducedRepeat(app, { name: `${prefix.toUpperCase()}-REDUCED-LIVENESS-PROBE`, setRoom, n: 2 }); } catch (e) { caught = String(e.message || e); }
    const ok = !!caught && /"misses":8\b/.test(caught) && /"stuck":true/.test(caught);
    if (!ok) throw new Error(`${prefix.toUpperCase()}-REDUCED-LIVENESS FAILED ${JSON.stringify({ caught: caught ? caught.slice(0, 300) : null })}`);
    console.log(`${prefix.toUpperCase()}-REDUCED-LIVENESS {"ok":true,"probe":"8 of 8 opens on the zoom page called stuck"}`);
  };
  return screens;
}

/** THE REDUCED-MOTION OPEN, REPEATED (Fable, Nov 1, after one miss in 92 readings: "every walk repeats the reduced-motion open >= 20x per
 *  drawer per room. One more miss = a real bug; chase it with your fuller readings"). Under reduced motion, each drawer is opened n times in
 *  each room: the read waits for the drawer to report open, lets two frames pass, and asks that the tab already stands where it settles (read
 *  again 300 ms later) with no travel transition longer than 1 ms running - a cut. Each miss carries the fuller readings: every animation on the
 *  grip, its computed position and transition, the rects at the read and settled, and how many frames it took to arrive. Throws on any miss. */
export async function reducedRepeat(app, { name, setRoom, n = 20 }) {
  const misses = [], counts = {};
  await app.evalJs(MARK);
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(200);
  try {
    for (const room of ['day', 'night']) {
      await setRoom(app, room);
      for (const side of ['left', 'right']) {
        const grip = side === 'left' ? '.wz-sliver-grip' : '.wz-tutor-grip';
        const openSel = side === 'left' ? ".wz-sliver[data-open='true']" : ".wz-tutor-panel[data-open='true']";
        const prop = side === 'left' ? 'right' : 'left';
        const key = `${room}-${side}`; counts[key] = 0;
        for (let i = 0; i < n; i++) {
          // where the tab stands shut: an open tab that never left it is the worst miss (a tab stuck shut would also "settle" there)
          const shutX = await app.evalJs(`(() => { const g = document.querySelector(${JSON.stringify(grip)}); if (!g) return null; const r = g.getBoundingClientRect(); return Math.round((${JSON.stringify(side)} === 'left' ? r.right : r.left) * 10) / 10; })()`);
          await app.evalJs(click(grip));
          await app.evalJs(`new Promise((done) => { const t0 = performance.now(); const f = () => (document.querySelector(${JSON.stringify(openSel)}) || performance.now() - t0 > 1000) ? done(true) : requestAnimationFrame(f); f(); })`);
          await app.evalJs(raf2);
          const at = await app.evalJs(`(() => { const g = document.querySelector(${JSON.stringify(grip)}); if (!g) return null; const r = g.getBoundingClientRect(), cs = getComputedStyle(g);
            const anims = document.getAnimations().filter((a) => a.effect?.target === g).map((a) => [a.transitionProperty || a.animationName, a.playState, Math.round(Number(a.currentTime) * 100) / 100, Number(a.effect.getTiming().duration), Number(a.effect.getTiming().delay)]);
            return { open: !!document.querySelector(${JSON.stringify(openSel)}), x: Math.round((${JSON.stringify(side)} === 'left' ? r.right : r.left) * 10) / 10, pos: cs[${JSON.stringify(prop)}], dur: cs.transitionDuration, props: cs.transitionProperty, anims }; })()`);
          // how many more frames until the tab stands where it settles (0 = it was already there)
          const settle = await app.evalJs(`new Promise((done) => { const g = document.querySelector(${JSON.stringify(grip)}); const first = Math.round((${JSON.stringify(side)} === 'left' ? g.getBoundingClientRect().right : g.getBoundingClientRect().left) * 10) / 10; let k = 0, last = first;
            const f = () => { const x = Math.round((${JSON.stringify(side)} === 'left' ? g.getBoundingClientRect().right : g.getBoundingClientRect().left) * 10) / 10; if (x !== last) { last = x; } if (++k >= 18) return done({ settled: last }); requestAnimationFrame(f); }; f(); })`);
          const travel = (at?.anims || []).filter((a) => a[1] === 'running' && /^(right|left|transform|translate|inset)/.test(String(a[0])) && a[3] > 1);
          const stuck = shutX == null || Math.abs(settle.settled - shutX) <= 1;
          const miss = !at || !at.open || stuck || Math.abs(at.x - settle.settled) > 1 || travel.length > 0;
          if (miss) misses.push({ room, side, i, shutX, at, settled: settle.settled, stuck, travel });
          else counts[key]++;
          await app.evalJs(click(grip));
          await app.evalJs(`new Promise((done) => { const t0 = performance.now(); const f = () => (!document.querySelector(${JSON.stringify(openSel)}) || performance.now() - t0 > 1000) ? done(true) : requestAnimationFrame(f); f(); })`);
          await app.evalJs(FINISH); await sleep(120);
        }
      }
    }
  } finally { await app.emulateMedia([]); }
  const brief = { n, counts, misses: misses.length, total: Object.values(counts).reduce((a, b) => a + b, 0) + misses.length };
  if (misses.length) { console.log(`${name}-FAIL ${JSON.stringify({ ...brief, detail: misses.slice(0, 6) })}`); throw new Error(`${name} FAILED ${JSON.stringify({ ...brief, detail: misses.slice(0, 3) })}`.slice(0, 1200)); }
  console.log(`${name} ${JSON.stringify(brief)}`);
  return brief;
}

/** r17 / r8 (Fable, Nov 2: "Room control: put it right beside Page in the Themes menu (both mockups; it can stay in Mood too). Nick couldn't find
 *  'light mode'"). In the Themes pop-out the room's row is the row right after Page, with the theme's own words; picking Day, Night and the
 *  clock there moves the room at once and the mockup's own row (Mood / the panel) agrees. ctx: { name, say, fail, label, words: [[value, text]],
 *  roomAttr, roomOf: { clock?, day: 'value', night: 'value' }, otherRow: css selector of the mockup's own row group }. */
export async function themeRoomCheck(app, { name, say, fail, label, words, roomAttr, roomOf, otherRow }) {
  const open = await app.evalJs("(() => { const b = document.querySelector(\".wz-strip-item[data-category='theme']\"); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!b; })()");
  await app.evalJs(`new Promise((done) => { const t0 = performance.now(); const f = () => (document.querySelector('.wz-theme-picker') || performance.now() - t0 > 3000) ? done(true) : requestAnimationFrame(f); f(); })`);
  const READ = `(() => { const field = document.querySelector('.wz-theme-picker .wz-theme-picker-field'); if (!field) return null;
    const rows = [...field.querySelectorAll('.mode-crow')].map((r) => ({ label: r.querySelector(':scope > span')?.textContent.trim() ?? null, opts: [...r.querySelectorAll('.mode-seg button')].map((b) => [b.textContent.trim(), b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true']) }));
    const other = ${JSON.stringify(otherRow)} ? document.querySelector(${JSON.stringify(otherRow)}) : null;
    return { rows, attr: document.documentElement.getAttribute('data-room'), room: document.documentElement.getAttribute(${JSON.stringify(roomAttr)}), other: other ? [...other.querySelectorAll('button[aria-pressed]')].map((b) => [b.textContent.trim(), b.getAttribute('aria-pressed')]) : null }; })()`;
  const before = await app.evalJs(READ);
  if (!before) fail(name, { open, picker: false });
  const pick = (text) => app.evalJs(`(() => { const r = [...document.querySelectorAll('.wz-theme-picker .wz-theme-picker-field .mode-crow')].find((x) => x.querySelector(':scope > span')?.textContent.trim() === ${JSON.stringify(label)}); const b = r && [...r.querySelectorAll('.mode-seg button')].find((x) => x.textContent.trim() === text); if (b) b.click(); return !!b; })()`);
  const steps = [];
  for (const [value, text] of [...words.filter(([v]) => v !== 'clock'), ...words.filter(([v]) => v === 'clock')]) {
    const pressed = await pick(text); await sleep(500);
    steps.push({ value, text, pressed, ...(await app.evalJs(READ)) });
  }
  const idx = before.rows.findIndex((r) => r.label === 'Page');
  const row = before.rows[idx + 1];
  const chosen = (s, text) => !!s.other && s.other.some(([t, p]) => t === text && p === 'true');
  const ok = {
    besidePage: idx >= 0 && !!row && row.label === label,
    words: !!row && JSON.stringify(row.opts.map(([t]) => t)) === JSON.stringify(words.map(([, t]) => t)),
    moves: steps.every((s) => s.pressed && (s.value === 'clock' ? s.attr === null : s.room === roomOf[s.value])),
    agrees: !otherRow || steps.every((s) => chosen(s, s.text)),
    marked: steps.every((s) => { const r = s.rows.find((x) => x.label === label); return !!r && r.opts.some(([t, on]) => t === s.text && on); }),
  };
  const brief = { ok, rows: before.rows.map((r) => [r.label, r.opts.map(([t]) => t).join('/')]), steps: steps.map((s) => [s.text, s.attr, s.room, s.other && s.other.filter(([, p]) => p === 'true').map(([t]) => t).join('|')]) };
  if (Object.values(ok).some((x) => !x)) fail(name, brief);
  say(name, brief);
  return brief;
}

/** r17 / r8 (Fable, Nov 2, Nick: "The font-size box: an editable number box between - and + in both mockups. Whole numbers 6-72; Enter or blur
 *  applies; a bad value reverts; default 11; the same scope as -/+"). On the caller's page (whose Tools drawer this opens): the box stands between
 *  - and +, shows the size in effect, and a whole number applies on Enter and on blur; 5, 73, 11.5 and a word revert (the size and the box keep
 *  the last good value); with words highlighted the box sizes only those words, as - and + do. ctx: { name, say, fail, form: 'small'|'full',
 *  selection: true to run the highlighted-words part }. */
export async function sizeBoxCheck(app, { name, say, fail, selection = false }) {
  await app.evalJs("(() => { if (!document.querySelector(\".wz-sliver[data-open='true']\")) document.querySelector('.wz-sliver-grip')?.click(); return true; })()");
  await app.evalJs(FINISH); await sleep(600); await app.evalJs(FINISH);
  const BOX = `(() => { const box = document.querySelector('.wz-sliver-panel .wz-type-size'); if (!box) return null; const kids = [...box.children]; const input = box.querySelector('input.wz-type-num');
    const steps = [...box.querySelectorAll('.wz-type-step')]; const x = (e) => e ? Math.round(e.getBoundingClientRect().left) : null;
    const ed = document.querySelector('${ED}'); const p = ed && (ed.querySelector('p, div') || ed);
    return { order: kids.map((k) => k.tagName === 'INPUT' ? 'box' : k.textContent.trim()), x: [x(steps[0]), x(input), x(steps[1])], value: input ? input.value : null, shown: !!input && input.getBoundingClientRect().width > 0,
      editorPx: ed ? parseFloat(getComputedStyle(p).fontSize) : null }; })()`;
  const type = (v, how) => app.evalJs(`(() => { const i = document.querySelector('.wz-sliver-panel input.wz-type-num'); if (!i) return false; i.focus(); const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(i, ${JSON.stringify(v)}); i.dispatchEvent(new Event('input', { bubbles: true }));
    ${how === 'enter' ? "i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));" : 'i.blur();'} return true; })()`);
  const start = await app.evalJs(BOX);
  if (!start) fail(name, { box: false });
  const rows = [];
  for (const [v, how, want] of [['14', 'enter', 14], ['5', 'enter', null], ['73', 'enter', null], ['11.5', 'enter', null], ['abc', 'blur', null], ['16', 'blur', 16], ['72', 'enter', 72], ['6', 'enter', 6]]) {
    const prev = await app.evalJs(BOX);
    await type(v, how); await sleep(450);
    const s = await app.evalJs(BOX);
    rows.push({ v, how, want, value: s.value, prevValue: prev.value, px: s.editorPx, prevPx: prev.editorPx });
  }
  const applied = (r) => r.value === String(r.want) && r.px !== r.prevPx;
  const reverted = (r) => r.value === r.prevValue && r.px === r.prevPx;
  const ok = {
    between: start.shown && JSON.stringify(start.order) === JSON.stringify(['−', 'box', '+']) && start.x[0] < start.x[1] && start.x[1] < start.x[2],
    showsSize: /^\d+$/.test(start.value || ''),
    applies: rows.filter((r) => r.want !== null).every(applied),
    reverts: rows.filter((r) => r.want === null).every(reverted),
  };
  let sel = null;
  if (selection) {
    // highlight the first word, then type a size: only the highlighted words change (as - and + do)
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const tw = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const n = tw.nextNode(); const r = document.createRange(); r.setStart(n, 0); r.setEnd(n, 3); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); return n.textContent.slice(0, 3); })()`);
    await sleep(400);
    const scope = await app.evalJs("(() => { const b = document.querySelector(\".wz-sliver-panel .wz-type-scope[data-scope='selection']\"); return b ? b.getAttribute('data-on') : null; })()");
    const sizeOf = `(() => { const ed = document.querySelector('${ED}'); const tw = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const first = tw.nextNode(); let last = first; for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.textContent.trim()) last = n; return [parseFloat(getComputedStyle(first.parentElement).fontSize), parseFloat(getComputedStyle(last.parentElement).fontSize)]; })()`;
    const b0 = await app.evalJs(sizeOf);
    // (report only, after runs 41572629767 / 41572661391 - typing with words highlighted changed nothing: the selection, the focus and the page's
    // first markup around the step)
    const DIAG = `(() => { const s = getSelection(); const ed = document.querySelector('${ED}'); return { sel: s ? s.toString().slice(0, 12) : null, collapsed: s ? s.isCollapsed : null, inEditor: !!(s && s.anchorNode && ed && ed.contains(s.anchorNode)), active: document.activeElement ? (document.activeElement.className || document.activeElement.tagName).toString().slice(0, 30) : null, html: ed ? ed.innerHTML.slice(0, 160) : null, input: document.querySelector('.wz-sliver-panel input.wz-type-num')?.value ?? null }; })()`;
    const d0 = await app.evalJs(DIAG);
    await type('30', 'enter'); await sleep(500);
    const d1 = await app.evalJs(DIAG);
    const b1 = await app.evalJs(sizeOf);
    sel = { scope, before: b0, after: b1, d0, d1 };
    ok.sameScope = scope === 'true' && b1[0] > b0[0] + 0.5 && Math.abs(b1[1] - b0[1]) < 0.01;
  }
  const brief = { ok, start: { order: start.order, value: start.value }, rows: rows.map((r) => [r.v, r.how, r.prevValue, '->', r.value, r.prevPx, '->', r.px]), sel };
  if (Object.values(ok).some((x) => !x)) fail(name, brief);
  say(name, brief);
  return brief;
}
