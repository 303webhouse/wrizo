// FX18 — the Chrome Aligned (docs/wrizo-alpha/p2-wave.md §FX18; item 75).
// Committed CDP scenario. Proves the three chrome faults from Nick's walk of the P1 tree:
//   S1 (SV25) — the RIGHT (Tutor) drawer arrow MIRRORS the left (Sliver): right closed '›'
//        (points right), open '‹'; left closed '‹', open '›'. One shared Tutor component,
//        so all four Tutor surfaces inherit the fix.
//   S2 (SV24/SV26) — the THREE-REGIME panel law (Fable's ruling; FX18 supersedes FX10 S1's
//        fixed-vw overlay). On a WRITING surface the panel occupies the margin and never
//        covers the sacred paper down to a ~280px usable floor (the norm); below that it
//        OVERLAYS at open-w (the documented narrow-screen degradation). On the BOARD it keeps
//        natural open-w and MAY overlay the canvas. Every regime: wholly in the room, grip
//        HIT-TESTABLE (the z-lift), no toolbar overlap where there is room. Both regimes are
//        asserted by NAME, chosen by the measured margin — the combinatorial matrix is the point.
//   S3 (SV27) — the Board's top menu parallels the Page's mode strip: ALL CAPS (computed
//        text-transform) + right-aligned (crumb left, mode bar right).
// Fixtures adopted from fx13.mjs (freshBoard) / sc1.mjs (freshScriptPage) / tu1.mjs
// (openTutor) / ab2.mjs (openSliver) — the "don't re-derive fixtures" law.
// Run: node apps/desktop/scripts/harness/fx18.mjs  (from apps/desktop, dist-web built).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WIDTHS = [[1100, 900], [1366, 768], [2200, 900]]; // 1366x768 = the canonical leg

const freshDesk = async (app, width, height) => {
  await app.goto('/');
  // Pre-seed the first-run + Tutor-disclosure flags (the versioned 'seen' key TU2 S3 checks,
  // plus the legacy boolean) so opening the Tutor does NOT raise the privacy disclosure —
  // whose full-screen backdrop (.wz-tutor-disclosure-backdrop) would otherwise cover the grip
  // and every panel-vs-paper geometry we mean to test. Mirrors fx10/tu1's own skipDisclosure.
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '3');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};
const freshProsePage = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (prose)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'prose page framed' });
  await app.emulateDpr(1, width, height); await sleep(300);
};
const freshBoard = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => { const now = new Date().toISOString();
    const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
    es.push({ id: 'fx18-board', text: 'FX18 Board', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(es)); })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/fx18-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await app.emulateDpr(1, width, height); await sleep(350);
};
const freshScriptPage = async (app, width, height) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"screenplay\"]')", { label: 'CreateProject picker (screenplay)' });
  await app.evalJs("document.querySelector('[data-kind=\"screenplay\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'screenplay surface' });
  await app.emulateDpr(1, width, height); await sleep(300);
};

const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }; })()`);
// Is the element at sel reachable at its own center — i.e. elementFromPoint there is it or a descendant (not covered by an overlay)?
const hitTestable = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const b = el.getBoundingClientRect(); const x = Math.round(b.left + b.width/2), y = Math.round(b.top + b.height/2); const hit = document.elementFromPoint(x, y); return !!hit && (el === hit || el.contains(hit) || hit.contains(el)); })()`);
// Grip reachability WITH diagnosis — what elementFromPoint returns at the grip centre, and
// the computed z-index of the grip, its anchor, and the panel anchor, so a false verdict is
// self-explaining (is the grip covered? by what? is the z-lift in effect?).
const gripDiag = (app) => app.evalJs(`(() => {
  const el = document.querySelector('.wz-tutor-grip');
  if (!el) return { reachable:false, why:'no-grip' };
  const b = el.getBoundingClientRect();
  const x = Math.round(b.left + b.width/2), y = Math.round(b.top + b.height/2);
  const hit = document.elementFromPoint(x, y);
  const desc = (n) => n ? (n.tagName.toLowerCase() + (n.className && n.className.toString ? '.' + n.className.toString().trim().split(/\\s+/).slice(0,2).join('.') : '')) : 'null';
  const anchor = el.closest('.desk-frame-tutor-anchor');
  const panelAnchor = document.querySelector('.desk-frame-tutor-panel-anchor');
  return {
    reachable: !!hit && (el === hit || el.contains(hit) || hit.contains(el)),
    hit: desc(hit), gripRect: { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top) }, x, y,
    gripZ: getComputedStyle(el).zIndex, gripPE: getComputedStyle(el).pointerEvents,
    anchorZ: anchor ? getComputedStyle(anchor).zIndex : null, anchorPE: anchor ? getComputedStyle(anchor).pointerEvents : null,
    panelAnchorZ: panelAnchor ? getComputedStyle(panelAnchor).zIndex : null,
  };
})()`);

await withHarness(async (app) => {
  // ── S1 — the arrow mirrors (on a framed prose page, both grips, both states) ──
  {
    await freshProsePage(app, 1366, 768);
    const sliverClosed = await app.evalJs("document.querySelector('.wz-sliver-grip-glyph')?.textContent ?? null");
    const tutorClosed = await app.evalJs("document.querySelector('.wz-tutor-grip-glyph')?.textContent ?? null");
    ok("S1 (SV25): at rest, the LEFT (sliver) grip points left '‹' and the RIGHT (tutor) grip points right '›' — the right arrow no longer lies about its direction",
      sliverClosed === '‹' && tutorClosed === '›', JSON.stringify({ sliverClosed, tutorClosed }));
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(250);
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(250);
    const sliverOpen = await app.evalJs("document.querySelector('.wz-sliver-grip-glyph')?.textContent ?? null");
    const tutorOpen = await app.evalJs("document.querySelector('.wz-tutor-grip-glyph')?.textContent ?? null");
    ok("S1: open, the grips still mirror — LEFT '›' (inward), RIGHT '‹' (inward) — a true mirror in both states",
      sliverOpen === '›' && tutorOpen === '‹', JSON.stringify({ sliverOpen, tutorOpen }));
  }

  // ── S2 — the THREE-REGIME panel law (Fable's ruling, 2026-07-29; FX18 supersedes ──
  //    FX10 S1). Each writing-surface leg MEASURES its margin and asserts, by NAME, the
  //    regime that margin selects — because the screenplay's wider 8.5in paper drops it
  //    below the usable floor earlier than prose (script@1100 is already degradation while
  //    page@1100 is still the wide law), so which width is which regime is surface-dependent
  //    and must be measured, not assumed. Both regimes therefore appear explicitly across the
  //    matrix; a forced narrow leg (900px) guarantees the degradation is exercised on prose too.
  const USABLE_FLOOR = 280;                                     // mirrors Tutor.tsx USABLE_PANEL_FLOOR_PX
  const openW = (w) => Math.max(320, Math.min(w * 0.34, 460));  // mirrors --tutor-panel-open-w: clamp(320px,34vw,460px)
  const writingPaperSel = '.mode-pagecol, .entry-full';
  const marginOf = (a) => a.evalJs(`(() => {
    const stage = document.querySelector('.desk-frame-stage');
    const paper = document.querySelector('.mode-pagecol, .entry-full, .board-canvas-wrap');
    if (!stage || !paper) return null;
    const s = stage.getBoundingClientRect(), p = paper.getBoundingClientRect();
    return Math.round(s.right - p.right); // TRUE geometric margin (no +frame-gap) — matches Tutor.tsx's measure-effect regime decision
  })()`);
  const inRoomOf = (panel, w) => !!panel && panel.r <= w + 1 && panel.l >= -1 && panel.w > 0;

  // Writing surfaces (page, script): the paper is SACRED — the panel must never cover it
  // while a usable panel fits the margin; below that it overlays "as before" (degradation).
  const writingSurfaces = [
    { name: 'Page', setup: freshProsePage },
    { name: 'Script', setup: freshScriptPage },
  ];
  const writingLegs = [...WIDTHS]; // 1100/1366/2200 — all >= DESKFRAME_MIN_WIDTH (1100); page@1100
  // (margin ~237) and script@1100/1366 (~137/~263) already exercise the degradation regime, so no
  // sub-floor leg is needed (900px is below the app's supported minimum — the frame does not render).
  for (const s of writingSurfaces) {
    for (const [w, h] of writingLegs) {
      await s.setup(app, w, h);
      await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(200);
      await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(300);
      const panel = await rectOf(app, '.wz-tutor-panel');
      const paper = await rectOf(app, writingPaperSel);
      const margin = await marginOf(app);
      const gd = await gripDiag(app); const grip = gd.reachable;
      const inRoom = inRoomOf(panel, w);
      const ow = openW(w);
      if (margin != null && margin >= USABLE_FLOOR) {
        // Regime (1) — the WIDE LAW (the norm): occupy the margin, NEVER cover the paper.
        ok(`S2 WIDE LAW (${s.name} @ ${w}x${h}, margin ${margin}px >= ${USABLE_FLOOR}): the OPEN panel OCCUPIES the margin and NEVER covers the paper (panel.left >= paper.right), stays wholly in the room, grip reachable`,
          !!panel && !!paper && panel.l >= paper.r - 2 && inRoom && grip === true,
          JSON.stringify({ panel, paper, margin, grip, gd, w }));
        // SV26 — the wide regime has room, so the two open panels must not overlap.
        const sliverPanel = await rectOf(app, '.wz-sliver-panel');
        ok(`S2 WIDE LAW (${s.name} @ ${w}x${h}): the open left toolbar and the open right panel DO NOT overlap — every control under them stays reachable (SV26)`,
          !!sliverPanel && !!panel && sliverPanel.r <= panel.l + 1,
          JSON.stringify({ sliverPanel, tutorPanel: panel }));
      } else {
        // Regime (2) — the DOCUMENTED NARROW-SCREEN DEGRADATION (not the norm): overlay the
        // paper at natural open-w, "as before" — and the grip STAYS reachable atop it (z-lift).
        ok(`S2 DEGRADATION (${s.name} @ ${w}x${h}, margin ${margin}px < ${USABLE_FLOOR} — the documented narrow-screen mode, NOT the norm): the OPEN panel OVERLAYS the paper at natural open-w (~${ow.toFixed(0)}px), stays in the room, grip STAYS reachable atop it`,
          !!panel && !!paper && panel.l < paper.r - 2 && Math.abs(panel.w - ow) < 2 && inRoom && grip === true,
          JSON.stringify({ panel, paper, margin, expectedOpenW: ow, grip, gd, w }));
      }
    }
  }

  // Regime (3) — the BOARD overlay exception: an arrangement surface with its own scroll, so
  // its panel keeps natural open-w and MAY overlay the canvas (Nick's board fault was the
  // edge-overrun + buried grip, never canvas coverage) — but stays IN THE ROOM, grip atop.
  for (const [w, h] of WIDTHS) {
    await freshBoard(app, w, h);
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(300);
    const panel = await rectOf(app, '.wz-tutor-panel');
    const gd = await gripDiag(app); const grip = gd.reachable;
    const ow = openW(w);
    ok(`S2 BOARD OVERLAY EXCEPTION (@ ${w}x${h}): the board panel keeps natural open-w (~${ow.toFixed(0)}px), MAY overlay the canvas, but stays WHOLLY in the room (right <= ${w}) and its grip is reachable atop it (the z-lift)`,
      !!panel && Math.abs(panel.w - ow) < 2 && inRoomOf(panel, w) && grip === true,
      JSON.stringify({ panel, expectedOpenW: ow, grip, gd, w }));
  }

  // ── S3 — the Board's top menu parallels the Page's (ALL CAPS + right-aligned) ──
  {
    await freshBoard(app, 1366, 768);
    const s3 = await app.evalJs(`(() => {
      const tab = document.querySelector('.board-mode-tab');
      const bar = document.querySelector('.board-mode-strip');
      const crumb = document.querySelector('.sprint-crumb');
      const nav = document.querySelector('.desk-frame-host .sprint-nav');
      const navRect = nav?.getBoundingClientRect();
      const barRect = bar?.getBoundingClientRect();
      const crumbRect = crumb?.getBoundingClientRect();
      return {
        transform: tab ? getComputedStyle(tab).textTransform : null,
        barLeft: barRect ? Math.round(barRect.left) : null,
        navCenter: navRect ? Math.round(navRect.left + navRect.width/2) : null,
        crumbLeft: crumbRect ? Math.round(crumbRect.left) : null,
        navLeft: navRect ? Math.round(navRect.left) : null,
      };
    })()`);
    ok("S3 (SV27): the Board's mode tabs render ALL CAPS (computed text-transform: uppercase) — mirroring the Page's mode strip; the words/DOM text are unchanged",
      s3.transform === 'uppercase', JSON.stringify(s3));
    ok("S3: the Board's mode bar is RIGHT-aligned (its left edge is past the nav's centre) while the crumb stays on the left — the two top menus read as siblings",
      s3.barLeft != null && s3.navCenter != null && s3.barLeft > s3.navCenter && s3.crumbLeft != null && s3.navLeft != null && s3.crumbLeft - s3.navLeft < 60,
      JSON.stringify(s3));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// FX18's own harness parks nothing: S1 adds fresh arrow assertions (no prior direction
// check); S3 is paint + inline-alignment (no assertion pinned the board bar to title-case/
// centre). But FX18's S2 DOES falsify 5 fx10.mjs "the OPEN panel = full open-w" assertions
// (Fable's ruling: FX18's occupy-margin law supersedes FX10 S1's fixed-vw overlay) — those
// take full A4 parks IN fx10.mjs (verbatim originals + SV24/SV26 as the superseding
// authority + successors asserting the new law), landed in this same commit at verify.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX18 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; FX18 parks nothing of its own.`
    : `\nFX18 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX18 VERIFY: PASS (${checks.length} checks)` : `\nFX18 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
