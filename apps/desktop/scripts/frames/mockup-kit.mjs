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
  await app.evalJs(raf2);
  // (instrument fix after red leg 41343731092: a cut is about TRAVEL - the tab's 0.01 ms colour change (olive to brass as it opens) was caught
  // mid-frame once; only the properties that move the tab are read now. Original, verbatim:
  // const rmRun = await app.evalJs("document.getAnimations().filter((a) => a.playState === 'running' && /wz-(sliver|tutor)-grip/.test(String(a.effect?.target?.className || ''))).map((a) => [a.transitionProperty, Number(a.effect.getTiming().duration)])");
  const rmRun = await app.evalJs("document.getAnimations().filter((a) => a.playState === 'running' && /wz-(sliver|tutor)-grip/.test(String(a.effect?.target?.className || '')) && /^(right|left|transform|translate|inset)/.test(String(a.transitionProperty || ''))).map((a) => [a.transitionProperty, Number(a.effect.getTiming().duration)])");
  const rm = await app.evalJs(RECTS);
  await app.evalJs(FINISH); await app.evalJs(click('.wz-sliver-grip')); await app.evalJs(FINISH);
  await app.emulateMedia([]); await sleep(300);

  const rgbOf = (x) => (String(x).match(/d+(.d+)?/g) || []).slice(0, 3).map((v) => Math.round(Number(v))).join(',');
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
  if (Object.values(ok).some((x) => !x)) fail(name, { ...brief, midL: { lt: midL.lt, ls: midL.ls }, midR: { rt: midR.rt, rs: midR.rs }, midRc: { rt: midRc.rt, rs: midRc.rs }, oL: { lt: oL.lt, lp: oL.lp, ls: oL.ls }, one: { lt: one.lt, rt: one.rt, lo: one.lo, ro: one.ro } });
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
export function walkScreens(prefix, open, setRoom) {
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
  return screens;
}
