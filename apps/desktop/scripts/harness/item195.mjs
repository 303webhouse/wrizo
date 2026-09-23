// ITEM 195 — the sliver grip under the strip.
// Run: node apps/desktop/scripts/harness/item195.mjs   (from the repo root,
// with dist-web freshly built via `pnpm run build:web`).
//
// Diagnosis (Fable, item 176 pair 4 / pw.md §7, reproduced here): on a
// board at 1280px, 15 of the sliver grip's 16px sit under the strip and
// hit-test TO the strip. `.desk-frame-stage` carries `isolation:isolate`
// (FX4 S2), which seals a stacking context — every z-index inside the
// stage (the sliver anchor's 5, the grip's 2) is trapped INSIDE it, below
// `.desk-frame-strip`'s own 1, a sibling of the stagecol outside that
// context. No z-index inside the stage can ever outrank the strip; the two
// numbers were never being compared. This is item 130's own class of
// defect, introduced by item 130's z-index fix, invisible to every harness
// that reaches the sliver with `.click()` (bypasses hit-testing) — item
// 151's point-scanning driver was the first instrument that could see it.
//
// THE RULE (Fable, 2026-09-23): no interactive control inside the stage
// ever sits in a strip's band, at any tested width, in prose, screenplay
// or board. Proof by real hit-test at each control's center across that
// matrix.
//
// THE FIX (index.css, `.desk-frame-sliver-anchor`, additive, geometry
// only — the ratified stacking is UNCHANGED, isolation/z-index untouched):
// `.wz-sliver-grip{right:0}` means the grip's screen position is set
// ENTIRELY by the anchor's own right edge, never by --sliver-anchor-w.
// Before the fix, that right edge tracked only the paper's own edge plus
// whatever --sliver-overflow's padding-dip allowed — zero by construction
// for `--board` (no padding to dip into), so the grip's clearance from the
// strip was an accident of the OTHER terms, not a guarantee. The fix adds
// --sliver-anchor-right: a MAX of the existing formula and an explicit
// floor stated directly in terms of the strip's own already-known
// position (the same stage-relative translation --sliver-margin already
// applies) plus one grip-width plus the grid's own gap — see the CSS
// comment at the fix site for the full derivation.
//
// This file proves the rule across the full matrix the diagnosis itself
// named as unmeasured: both reference widths (1280/2200) + the
// DESKFRAME_MIN_WIDTH floor (1100), all three page kinds. Two independent
// proofs per cell, matching this project's own dual-proof style: (1) a
// REAL hit-test via trustedDispatch — the grip is reachable by an actual
// pointer, not merely present in the DOM (item 151's own law: a synthetic
// `.click()` cannot see this class of bug); (2) a geometry read — the
// grip's rect and the strip's rect never intersect, closed AND reopened.
// Scope, honestly bounded per the diagnosis's own caveat: only the board
// case was measured failing pre-fix; prose/screenplay are included here
// because the fix's own floor is unconditional (one rule, not a per-kind
// special case) and the rule names all three explicitly — not because a
// second failure was ever observed in them.
import { withHarness } from '../runtime-verify.mjs';
import { hittablePointBy, trustedDispatch } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Both reference widths this arc's harnesses already use (fx2/fx4/fx5) +
// the DESKFRAME_MIN_WIDTH floor — the one width band fx2's own S1 comment
// found is where a clamp-mechanism regression actually shows (1280/2200
// alone can produce byte-identical geometry whether or not a clamp fires).
const WIDTHS = [1100, 1280, 2200];

const rectOf = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom}; })()`;

// Two rects "never intersect" — the same 0.5px epsilon fx2.mjs's own
// `disjoint` uses, for the same reason (sub-pixel calc()/ch-unit rounding
// noise this layout's nested min()/calc() math produces, confirmed
// harmless and pre-existing).
const disjoint = (a, b, eps = 0.5) =>
  a && b && (a.right <= b.left + eps || b.right <= a.left + eps || a.bottom <= b.top + eps || b.bottom <= a.top + eps);

const freshDesk = async (app, width, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

const freshScriptPage = async (app, width, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const headingId = 'item195-script-heading';
    window.wrizoCreateJournalPage({ id: 'item195-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: headingId, heading: { id: headingId, t: 'scene', text: '' }, body: [] }] }, createdAt: now, source: null, origin: null });
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after script seed' });
  await app.evalJs("location.hash = '#/page/item195-script'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Script framed' });
  await sleep(250);
};

const freshBoardPage = async (app, width, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'item195-board', text: 'ITEM 195 Board', pageType: 'board', boxes: [], createdAt: now, origin: null });
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after board seed' });
  await app.evalJs("location.hash = '#/page/item195-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'Board framed' });
  await sleep(300);
};

const KINDS = [
  { name: 'prose', mount: freshProsePage },
  { name: 'screenplay', mount: freshScriptPage },
  { name: 'board', mount: freshBoardPage },
];

await withHarness(async (app) => {
  for (const { name: kind, mount } of KINDS) {
    for (const width of WIDTHS) {
      await mount(app, width, 900);

      // (1) REAL hit-test, sliver CLOSED: the grip must be reachable by an
      // actual pointer at its own on-screen point, not merely present in
      // the DOM. This is the exact instrument that missed the failure
      // before item 151 (a `.click()` bypasses it entirely) and the exact
      // one that measured it (item 176 pair 4's own diagnostic used the
      // same `elementFromPoint`-based check this call performs).
      const pressed = await trustedDispatch(app, "document.querySelector('.wz-sliver-grip')",
        `${kind}@${width}px sliver grip press (closed -> open)`, { report: ok });
      if (!pressed) continue; // a failed press already reported its own named check; nothing further to open

      await sleep(200);
      const openState = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open')");
      ok(`${kind}@${width}px: the trusted press actually opened the sliver (functional confirmation, not just an unoccluded pixel)`,
        openState === 'true', String(openState));

      // (2) Geometry, sliver OPEN: the grip's rect and the strip's rect
      // never intersect — the redundant, non-hit-test proof of the same
      // rule, matching fx2.mjs's own dual style for this exact anchor.
      const gripOpen = await app.evalJs(rectOf('.wz-sliver-grip'));
      const stripOpen = await app.evalJs(rectOf('.desk-frame-strip'));
      ok(`${kind}@${width}px: the grip's rect and the strip's rect never intersect, sliver OPEN`,
        disjoint(gripOpen, stripOpen), JSON.stringify({ gripOpen, stripOpen }));

      // (3) REAL hit-test, sliver OPEN -> CLOSE: the grip stays reachable
      // with the panel open too (the panel is the visible half of the
      // original complaint's own class — fx2 S1 tests this symmetry for
      // the text-column law; this is the same symmetry for the strip law).
      const pressedAgain = await trustedDispatch(app, "document.querySelector('.wz-sliver-grip')",
        `${kind}@${width}px sliver grip press (open -> closed)`, { report: ok });
      if (!pressedAgain) continue;

      await sleep(200);
      const closedState = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open')");
      ok(`${kind}@${width}px: the trusted press actually closed the sliver`,
        closedState === 'false', String(closedState));

      // (4) Geometry, sliver CLOSED (post-toggle): the same disjointness
      // law, re-proved after the round trip.
      const gripClosed = await app.evalJs(rectOf('.wz-sliver-grip'));
      const stripClosed = await app.evalJs(rectOf('.desk-frame-strip'));
      ok(`${kind}@${width}px: the grip's rect and the strip's rect never intersect, sliver CLOSED`,
        disjoint(gripClosed, stripClosed), JSON.stringify({ gripClosed, stripClosed }));
    }
  }

  // The diagnosis's own exact reproduction case, named explicitly: board
  // @ 1280px, the width/kind item 176 pair 4 actually measured failing
  // (grip x 69..85 inside strip x 0..84, 15 of 16px occluded, "found:
  // false, why: occluded, by: wz-strip-item"). Already covered by the
  // matrix loop above (kind='board', width=1280) — this block re-asserts
  // it standalone so the specific finding has its own named, greppable
  // check rather than existing only as one iteration of a loop.
  await freshBoardPage(app, 1280, 900);
  const board1280Point = await hittablePointBy(app, "document.querySelector('.wz-sliver-grip')");
  ok('the exact reproduction case (item 176 pair 4): board @ 1280px, grip hit-tests to ITSELF, not to .desk-frame-strip',
    !!(board1280Point && board1280Point.found), JSON.stringify(board1280Point));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// None. Item 195 is a new item; it falsifies no prior assertion (the prior
// coverage of this anchor, fx2.mjs's own S1 sliver-clearance check, tested
// PROSE ONLY at 1100px and remains true and unedited — it simply never
// exercised the board case that failed, which is exactly the gap this file
// closes). The array is still emitted, per this lane's own standing law:
// park COUNT, not green — a sweep that skips pushing an empty array is
// indistinguishable from one that forgot to look.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nITEM195 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, nothing parked in this file`);
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM195 VERIFY: PASS (${allChecks.length} checks)` : `\nITEM195 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
