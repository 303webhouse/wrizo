#!/usr/bin/env node
/**
 * MENUS PROBE — item 83's build-wave acceptance instrument (M0).
 *
 * WHAT IT ASSERTS, and why it is shaped this way.
 * The menus wave's constitutional law is: ANCHORS ARE LAYOUT; A POLICY
 * QUESTION MAY MEASURE, AN ANCHOR MAY NOT. That law exists because the
 * pre-wave chrome anchored the Tools drawer by RE-DERIVING where the paper
 * is (`--sliver-paper-half: min(380px*scale, 30ch)`, hand-synced against
 * `.mode-pagecol{width:min(700px,64vw)}`) — two formulas for one number,
 * which drift apart silently and move again when a webfont fails to load.
 *
 * So this probe never computes an expected position. It measures TWO
 * INDEPENDENTLY RENDERED BOXES and asserts they touch:
 *   (a) paper.left  − toolsDock.right  === 0  (±0.6)   when a dock exists
 *   (b) cascadePanel.left − rail.right   === 0  (±0.6)   when a panel is open
 * A check that compares a rendered box against a JS constant would be
 * tautological — it would only prove the browser honoured an assignment.
 * Both checks here can fail, and did fail against the pre-M1 tree, which is
 * the only evidence that an acceptance instrument is real.
 *
 * UNIT DISCIPLINE. getBoundingClientRect returns CSS px in the viewport's
 * frame. No stage transform exists in the app (unlike the mockups), so
 * layout px === rect px here; the normalisation is still written out
 * explicitly so a future zoom/transform cannot silently invalidate a
 * comparison — the same species of error the wave was called to remove.
 *
 * USAGE
 *   node scripts/menus-probe.mjs                     # full matrix
 *   node scripts/menus-probe.mjs --surface prose     # one surface
 *   node scripts/menus-probe.mjs --shots docs/menus/build-shots
 * Exit code 0 = every check green; 1 = any red (so it can gate a commit).
 *
 * Runs against the BUILT bundle via the house harness (runtime-verify.mjs),
 * not `pnpm dev`: that is the repo's own proven path, it spawns and reaps
 * its own Chrome with a PID-keyed profile dir, and it is what every other
 * harness in this suite uses. Deviation from the brief's "against pnpm dev"
 * is deliberate and recorded in the night's report.
 */
import { withHarness } from './runtime-verify.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const args = process.argv.slice(2);
const argOf = (flag, dflt = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const ONLY = argOf('--surface');
const SHOTS = argOf('--shots');
const WIDTHS = [[1366, 768], [1680, 1050]];
const TOL = 0.6;

/* ---------- measurement helpers: rendered boxes only ---------- */

const rect = (app, sel) => app.evalJs(
  `(() => { const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null; const b = el.getBoundingClientRect();
    return { l:b.left, r:b.right, t:b.top, b:b.bottom, w:b.width, h:b.height }; })()`);

// The paper: the actual sheet, not its column. The pre-wave defect was
// precisely that these differ (SC1 S4 measured a 66-115px gap), so the probe
// asks for the sheet the writer sees.
// The sheet the writer actually sees, per surface. `.script-sheet` (not
// `.script-page`, which is the outer wrapper) is the screenplay's own paper —
// index.css single-sources its geometry there for both the framed and legacy
// branches. Asking for the wrapper measured a box the writer never sees.
// On a board the sheet the writer sees — and the box the dock is anchored
// against — is `.board-canvas-wrap`, which carries the 1px border;
// `.board-canvas` is the element INSIDE that border. Measuring the inner one
// reported a 1.00px gap at both widths that was simply the border itself
// (proven: wrap.left 133.0, canvas.left 134.0, dock.right 133.0 — flush on the
// wrapper, one pixel short of the canvas). Third time this probe has asked for
// the wrong box; the rule that keeps catching it is "name the box the writer
// sees, not the nearest one with a matching class".
const PAPER_SEL = '.mode-page, .board-canvas-wrap, .script-sheet';
// The dock/handle resolve to the wave's own markers FIRST and fall back to
// the pre-wave classes. That fallback is deliberate: it is what lets this
// probe run RED against today's tree (the sliver exists, and is not flush),
// which is the only proof an acceptance instrument can fail at all.
const DOCK_SEL = '[data-menus-dock], .wz-sliver';
const HANDLE_SEL = '[data-menus-handle], .wz-sliver-grip';
const PANEL_SEL = '.wz-cascade-panel';
const CAT_SEL = '[data-cascade-cat], .wz-strip-item';
// R10(i) names the RAIL as what the cascade drawer opens from, so the rail's
// own rendered right edge is the reference — not the stage column's left,
// which an earlier draft of this probe used and which is a different box
// (measured 40.0 vs the rail's 84.0). Comparing against the wrong box is the
// same error class as comparing against a constant: it reports a number that
// is not the invariant.
const RAIL_SEL = '.desk-frame-strip';

async function checkSurface(app, surface, width, height, out) {
  const add = (name, pass, detail) => out.push({ surface, width, name, pass, detail });

  await app.emulateDpr(1, width, height);
  await sleep(350);

  const paper = await rect(app, PAPER_SEL);
  if (!paper) { add('paper present', false, `no element matched ${PAPER_SEL}`); return; }
  add('paper present', true, `w=${paper.w.toFixed(1)}`);

  /* (a) the Tools dock's right edge IS the paper's left edge */
  const dock = await rect(app, DOCK_SEL);
  if (dock) {
    const d = paper.l - dock.r;
    add('dock flush at paper (open)', Math.abs(d) <= TOL,
        `paper.left ${paper.l.toFixed(1)} − dock.right ${dock.r.toFixed(1)} = ${d.toFixed(2)}px`);

    // and again with the drawer closed — R11's "closed, the handle rests on
    // the paper's edge" is a separate state, not the same assertion twice.
    const toggled = await app.evalJs(
      `(() => { const h = document.querySelector(${JSON.stringify(HANDLE_SEL)}); if (!h) return false; h.click(); return true; })()`);
    if (toggled) {
      await sleep(420);                       // the slide
      const p2 = await rect(app, PAPER_SEL), d2 = await rect(app, DOCK_SEL);
      if (p2 && d2) {
        const dd = p2.l - d2.r;
        add('dock flush at paper (closed)', Math.abs(dd) <= TOL,
            `paper.left ${p2.l.toFixed(1)} − dock.right ${d2.r.toFixed(1)} = ${dd.toFixed(2)}px`);
        add('paper rect invariant under dock toggle', Math.abs(p2.l - paper.l) <= TOL && Math.abs(p2.w - paper.w) <= TOL,
            `left ${paper.l.toFixed(1)}→${p2.l.toFixed(1)}, w ${paper.w.toFixed(1)}→${p2.w.toFixed(1)}`);
      }
      await app.evalJs(`(() => { const h=document.querySelector(${JSON.stringify(HANDLE_SEL)}); h && h.click(); })()`);
      await sleep(420);
    }
  } else {
    add('dock absent (lawful on this surface)', true, 'no [data-menus-dock] — board/absence surfaces');
  }

  /* (b) the cascade drawer sits flush on the rail it opened from (R10.i) */
  const opened = await app.evalJs(
    `(() => { const c = document.querySelector(${JSON.stringify(CAT_SEL)});
      if (!c) return false; c.click(); return true; })()`);
  if (opened) {
    await sleep(420);
    const panel = await rect(app, PANEL_SEL), rail = await rect(app, RAIL_SEL);
    if (panel && rail) {
      const d = panel.l - rail.r;
      add('cascade panel flush at rail', Math.abs(d) <= TOL,
          `panel.left ${panel.l.toFixed(1)} − rail.right ${rail.r.toFixed(1)} = ${d.toFixed(2)}px`);
      const p3 = await rect(app, PAPER_SEL);
      if (p3) add('paper rect invariant under cascade open', Math.abs(p3.w - paper.w) <= TOL,
                  `w ${paper.w.toFixed(1)}→${p3.w.toFixed(1)}`);
    } else {
      add('cascade panel flush at rail', false, `panel=${!!panel} rail=${!!rail}`);
    }
  }

  await checkFoot(app, surface, width, add);

  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    const png = await app.screenshot();
    const f = path.join(SHOTS, `${surface}-${width}x${height}.png`);
    writeFileSync(f, Buffer.from(png, 'base64'));
    out.push({ surface, width, name: 'screenshot', pass: true, detail: path.basename(f) });
  }
}

/* ---------- the foot (item 83 errata E2) ----------------------------------
 * TWO INDEPENDENTLY RENDERED BOXES, again. Nick's walkthrough ruling — "Full
 * screen ALIGNS WITH THE PROGRESS BAR" — is a claim about two elements whose
 * positions nothing computes: the hairline and the toggle are flex siblings
 * under `align-items:center`, so the assertion below genuinely fails if that
 * layout is ever replaced by a hand-tuned margin, which is the whole point.
 * Comparing either box against a JS constant would prove only that the browser
 * honoured an assignment.
 *
 * THE OTHER ASSERTION IS A GUARD, AND IS LABELLED AS ONE. Structure was
 * ALREADY the tab's last zone before the foot at this wave's branch point
 * (docs/menus/item83-errata-s0-survey.md (c)), so it passes against unmodified
 * `main`. It earns its place because E4 grows that zone with kind buttons and
 * style guides, and because a later hand could drop a section beneath it — but
 * a reader must not mistake its green for evidence that E2 moved anything. The
 * offer record says the same thing in the same words.
 *
 * The drawer is OPENED first. A closed panel still has a real rect (it is
 * absolutely positioned and merely faded), so these numbers can be read off a
 * shut drawer — and would then be measuring a box the writer never sees, which
 * is the error this probe's own PAPER_SEL comment has already had to correct
 * three times.
 */
const FOOT_SEL = {
  hairline: '.wz-sliver-goal-hairline',
  fullscreen: '[data-foot-fullscreen] button',
  structure: '.wz-sliver-structure-zone',
  goal: '.wz-sliver-goal',
};

const centreY = (b) => b.t + b.h / 2;

async function checkFoot(app, surface, width, add) {
  const setDrawer = (open) => app.evalJs(
    `(() => { const d = document.querySelector('[data-menus-dock], .wz-sliver');
      if (!d) return false;
      if ((d.dataset.open === 'true') === ${open}) return true;
      const h = document.querySelector(${JSON.stringify(HANDLE_SEL)}); if (!h) return false;
      h.click(); return true; })()`);

  if (!(await setDrawer(true))) {
    add('foot absent (lawful on this surface)', true, 'no tools dock — nothing to measure');
    return;
  }
  await sleep(420);

  const bar = await rect(app, FOOT_SEL.hairline);
  const fs = await rect(app, FOOT_SEL.fullscreen);
  if (bar && fs) {
    const d = centreY(fs) - centreY(bar);
    add('Full Screen shares the progress bar line', Math.abs(d) <= TOL,
        `fullScreen.centreY ${centreY(fs).toFixed(2)} − bar.centreY ${centreY(bar).toFixed(2)} = ${d.toFixed(2)}px`);
  } else {
    add('Full Screen shares the progress bar line', false,
        `hairline=${!!bar} fullScreen=${!!fs} — both must render for the claim to mean anything`);
  }

  // Structure lives on Draft, which is a MODE of the prose page — reached
  // through the strip the writer uses, never by writing the mode key.
  if (surface === 'prose') {
    const switched = await app.evalJs(
      `(() => { const t = [...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft');
        if (!t) return false; t.click(); return true; })()`);
    if (switched) {
      await app.waitFor(`!!document.querySelector('${FOOT_SEL.structure}')`, { label: 'Draft Structure zone' });
      await sleep(250);
      const st = await rect(app, FOOT_SEL.structure);
      const goal = await rect(app, FOOT_SEL.goal);
      if (st && goal) {
        add('Structure is the last zone before the foot (GUARD - already true at the branch point)',
            st.b <= goal.t + TOL,
            `structure.bottom ${st.b.toFixed(1)} <= goal.top ${goal.t.toFixed(1)} (${(goal.t - st.b).toFixed(2)}px clear)`);
      } else {
        add('Structure is the last zone before the foot (GUARD - already true at the branch point)', false,
            `structure=${!!st} goal=${!!goal}`);
      }
      // PUT THE SURFACE BACK. Reaching Structure means switching the page to
      // DRAFT, and this probe also takes the wave's SHOTS — so without this the
      // prose shots would silently change from Free Write to Draft and every
      // future comparison against the wave's own set would be against a
      // different picture of a different mode. Caught by taking the shots and
      // finding all six changed on a wave that moved almost no pixels.
      await app.evalJs(
        `(() => { const t = [...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Free Write');
          if (t) t.click(); return !!t; })()`);
      await sleep(400);
    }
  }

  await setDrawer(false);
  await sleep(420);
}

/* ---------- surface setups (seams, never raw storage — AGENTS.md) ---------- */

const freshDesk = async (app, w, h) => {
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.emulateDpr(1, w, h);
  await sleep(300);
};

const SURFACES = {
  prose: async (app, w, h) => {
    await freshDesk(app, w, h);
    await app.goto('/project/new');
    await app.waitFor(`!!document.querySelector('[data-kind="book"]')`, { label: 'project picker' });
    await app.evalJs(`document.querySelector('[data-kind="book"]').click()`);
    await app.click('Start writing');
    await app.waitFor(`!!document.querySelector('.forward-only-editor')`, { label: 'prose page' });
  },
  screenplay: async (app, w, h) => {
    await freshDesk(app, w, h);
    await app.goto('/project/new');
    await app.waitFor(`!!document.querySelector('[data-kind="screenplay"]')`, { label: 'screenplay picker' });
    await app.evalJs(`document.querySelector('[data-kind="screenplay"]').click()`);
    await app.click('Start writing');
    await app.waitFor(`!!document.querySelector('.script-el-active')`, { label: 'screenplay surface' });
  },
  board: async (app, w, h) => {
    await freshDesk(app, w, h);
    // Reach a board through the APP'S OWN DOOR, never a raw localStorage seed.
    // `#/journal` is JournalBoardGate, which mints the Journal system board via
    // getOrCreateSystemBoard — a real product path, so the row enters the
    // module-init cache and no flush can erase it (AGENTS.md's successor law).
    //
    // An earlier draft called window.wrizoCreateJournalPage({pageType:'board'}).
    // That seam takes NO ARGUMENTS — it hardcodes a journal-origin prose page —
    // so the object was silently ignored and the probe waited for a
    // `.board-canvas` on a prose page until it timed out. Passing options to a
    // zero-arg function is invisible in JS; the diagnosis came from the
    // waitFor's own diag dump showing a Free Write strip.
    await app.evalJs(`location.hash = '#/journal'`);
    await app.waitFor(`!!document.querySelector('.board-canvas')`, { label: 'board surface (Journal system board)' });
  },
};

/* ---------- run ---------- */

const results = await withHarness(async (app) => {
  const out = [];
  for (const [name, setup] of Object.entries(SURFACES)) {
    if (ONLY && ONLY !== name) continue;
    for (const [w, h] of WIDTHS) {
      try {
        const r = await setup(app, w, h);
        if (r && r.skip) { out.push({ surface: name, width: w, name: 'setup', pass: true, detail: 'SKIP: ' + r.skip }); continue; }
        await checkSurface(app, name, w, h, out);
      } catch (e) {
        out.push({ surface: name, width: w, name: 'setup', pass: false, detail: String(e.message || e).slice(0, 200) });
      }
    }
  }
  return out;
});

let red = 0;
for (const r of results) {
  if (!r.pass) red++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.surface.padEnd(11)} ${String(r.width).padEnd(5)} ${r.name.padEnd(38)} ${r.detail}`);
}
console.log(`\n${results.length - red}/${results.length} checks green` + (red ? `  — ${red} RED` : ''));
process.exit(red ? 1 : 0);
