// ITEM 130 — THE CASCADE STRIP MUST BE REACHABLE BY A REAL POINTER.
//
// THE DEFECT, as PW1 measured it and as this file re-measures it:
//   `.desk-frame-strip` is `position:absolute` at
//   `left: calc(-1 * var(--frame-host-pad-x))`, width `--strip-width` (84px).
//   `.desk-frame-stagecol` is the normal-flow sibling that FOLLOWS it in the
//   DOM (DeskFrame.tsx) and begins at the host's own padding-left. Both were
//   `z-index: auto`, so painting order was DOM order and the later sibling
//   won. `--frame-host-pad-x` is `clamp(16px, 3vw, 40px)`, so at 1280px the
//   stage began at 38.4 and covered the strip's 38.4-84 band — roughly its
//   right 54%. A strip item's own CENTRE (x~42) landed inside the overlap, and
//   `document.elementFromPoint` there returned `.desk-frame-stage`.
//
// WHY NOTHING CAUGHT IT FOR SO LONG, which is the reason this file exists at
// all: every other harness reaches these controls with `.click()`, which
// dispatches straight at a node it already holds and NEVER CONSULTS THE
// HIT-TESTING STACK. A control can be completely unreachable by a human and
// still pass a `.click()` check forever. So the assertions below deliberately
// never click anything — they ask the DOCUMENT what is on top at the point a
// pointer would actually land, which is the only question a writer's finger
// asks. `pw1.mjs`'s `hittablePointBy` found the defect the same way.
//
// THE REPAIR IS STACKING, NOT GEOMETRY, and S2 exists to keep it that way.
// Moving the stage clear of the strip would move the PAPER, and paper never
// reflows for chrome. So S1 proves the strip is reachable and S2 proves the
// paper did not move to buy it — the two assertions travel together, on the
// same fixture at the same widths, so the fix can never trade one law for the
// other without this file going red.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// 1100 is the gate floor; 1280 is where PW1 measured; 1366 is the sitting's
// laptop; 1680 is wide. --frame-host-pad-x is `clamp(16px, 3vw, 40px)`, so the
// overlap's width VARIES with viewport (3vw = 33px at 1100, 38.4 at 1280,
// 40.98->40 clamped at 1366 and 1680). Testing one width would prove one
// arithmetic case, not the law.
const WIDTHS = [1100, 1280, 1366, 1680];

// The gate floor carries a PRE-EXISTING dock/paper overlap that item 130
// neither caused nor fixes — see S2's own comment below for the attribution
// and why it is measured rather than asserted away.
const GATE_FLOOR = 1100;
const GATE_FLOOR_KNOWN_DELTA = -29.69;

const freshDesk = async (app, width, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(300);
};

// The whole instrument, in one page-side expression: for every strip item, ask
// the document what sits at that item's own centre. Returns per-item verdicts
// plus the geometry that explains any miss, so a failure reports its own cause
// instead of needing a second run to diagnose.
const STRIP_HITS = `(() => {
  const strip = document.querySelector('.desk-frame-strip');
  const items = [...document.querySelectorAll('.wz-strip-item')];
  if (!strip || !items.length) return { ok: false, why: 'no strip or no items', count: items.length };
  const sb = strip.getBoundingClientRect();
  const stage = document.querySelector('.desk-frame-stage');
  const gb = stage ? stage.getBoundingClientRect() : null;
  const rows = items.map(el => {
    const b = el.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const top = document.elementFromPoint(cx, cy);
    const hit = !!top && (top === el || el.contains(top));
    return {
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24),
      cx: +cx.toFixed(1), cy: +cy.toFixed(1),
      hit,
      topClass: top ? (top.className && top.className.baseVal !== undefined ? top.className.baseVal : String(top.className)).slice(0, 60) : null,
    };
  });
  return {
    ok: true,
    stripLeft: +sb.left.toFixed(1), stripRight: +sb.right.toFixed(1),
    stageLeft: gb ? +gb.left.toFixed(1) : null,
    overlapPx: gb ? +Math.max(0, sb.right - gb.left).toFixed(1) : null,
    count: rows.length,
    missed: rows.filter(r => !r.hit),
    rows,
  };
})()`;

// The paper-flush invariant, measured exactly as menus-probe.mjs measures it:
// two independently rendered boxes, the dock's right edge against the paper's
// left. This is the law the repair must not have bought its fix with.
const PAPER_FLUSH = `(() => {
  const paper = document.querySelector('.mode-page, .board-canvas-wrap, .script-sheet');
  const dock = document.querySelector('[data-menus-dock], .wz-sliver');
  if (!paper || !dock) return null;
  const p = paper.getBoundingClientRect(), d = dock.getBoundingClientRect();
  return { paperLeft: +p.left.toFixed(2), dockRight: +d.right.toFixed(2), delta: +(p.left - d.right).toFixed(2) };
})()`;

await withHarness(async (app) => {
  for (const w of WIDTHS) {
    await freshProsePage(app, w);

    // ---- S1 — every strip item is reachable by a real pointer -------------
    const s = await app.evalJs(STRIP_HITS);
    ok(`ITEM130 S1 @ ${w}: the strip and its items are present to measure`,
      !!s && s.ok === true && s.count > 0, JSON.stringify({ count: s && s.count, why: s && s.why }));

    if (s && s.ok) {
      ok(`ITEM130 S1 @ ${w}: EVERY strip item's own centre hit-tests to the item — elementFromPoint returns the control a finger would land on, not the stage painted over it`,
        s.missed.length === 0,
        JSON.stringify({ missed: s.missed, stripLeft: s.stripLeft, stripRight: s.stripRight, stageLeft: s.stageLeft, overlapPx: s.overlapPx, count: s.count }));

      // The control that keeps the check honest. The stage still OVERLAPS the
      // strip geometrically — that is by design, the repair is stacking, not
      // geometry — so if this ever reads 0 the fixture has stopped exercising
      // the condition and S1's green would mean nothing.
      ok(`ITEM130 S1 @ ${w}: CONTROL — the stage still overlaps the strip's band, so the hit-test above is answering the real question and not a geometry change that quietly removed it`,
        s.overlapPx !== null && s.overlapPx > 0,
        JSON.stringify({ overlapPx: s.overlapPx, stripRight: s.stripRight, stageLeft: s.stageLeft }));
    }

    // ---- S2 — and the paper did not move to buy it -----------------------
    const f = await app.evalJs(PAPER_FLUSH);
    if (w === GATE_FLOOR) {
      // A PRE-EXISTING DEFECT, SURFACED NOT FIXED, AND DELIBERATELY NOT
      // ASSERTED AS CORRECT. At the 1100 gate floor the dock is NOT flush:
      // it overlaps the paper by ~29.7px (paperLeft 242.31, dockRight 272).
      // This is not item 130's doing — the reading is IDENTICAL on a bundle
      // built from the pre-fix source, which is how it was attributed rather
      // than assumed. It surfaced only because this file added 1100 to the
      // matrix; menus-probe.mjs measures 1366 and 1680 and has never covered
      // the gate floor, so nothing was watching this width.
      //
      // Asserting 0.00 here would make this file permanently red for someone
      // else's defect; asserting the overlap would ratify a bug as law. So it
      // asserts the only thing THIS ticket actually owes: that the repair did
      // not move the paper at this width either. Owed to Fable for a number.
      ok(`ITEM130 S2 @ ${w}: SURFACED, NOT FIXED — the dock overlaps the paper by ~29.7px at the gate floor (pre-existing; identical pre-fix and post-fix). This check asserts only that item 130's repair did NOT move it`,
        !!f && Math.abs(f.delta - GATE_FLOOR_KNOWN_DELTA) < 0.6,
        JSON.stringify({ ...f, knownPreExisting: GATE_FLOOR_KNOWN_DELTA }));
    } else {
      ok(`ITEM130 S2 @ ${w}: the dock is still flush at the paper (0.00 +/- 0.6) — the repair bought reachability WITHOUT reflowing the paper for chrome`,
        !!f && Math.abs(f.delta) < 0.6, JSON.stringify(f));
    }
  }

  return checks;
}, { label: 'item130' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This file is NEW and supersedes no assertion: the strip's
  // existing coverage asserts what it CONTAINS and how it is DRESSED, never
  // whether a pointer can reach it, which is exactly why the defect survived.
  // The empty list is the evidence that the repair falsified nothing.
  // eslint-disable-next-line no-console
  console.log('\nITEM130 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 130 parks nothing. No prior assertion covered real-pointer reachability of the strip, so none is superseded by restoring it.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM130 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM130 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
