// ITEM 83 ERRATA — E1: THE FAR-LEFT OPEN MUST SHUT THE TOOL SLIVER.
//
// Nick felt this on a tablet, which is the detail that names the bug: the
// affordance a writer TAPS is the grip, and the grip was the one open path
// that never announced itself.
//
// THE DEFECT, as measured (not as read):
//   The two-drawer store (store/menusDrawers.ts) decides whether both drawers
//   may stand by measuring the band between the rail's right edge and the
//   paper's left edge. That policy was CORRECT throughout — a diagnostic run
//   with the sliver visibly open read `coexist: false` on a board at both
//   reference widths. What it also read, in the same breath, was
//   `openDrawer: null`. The store did not believe ANY drawer was open, so
//   `requestOpen('cascade')` found nothing to displace and displaced nothing.
//
//   Sliver.tsx announced its opens from inside a `setState` updater, and only
//   on the paths that went through `toggleOpen` (the Ctrl+/ shortcut). The
//   grip's own `onClick` called `setOpen(o => !o)` directly. So the law was
//   never wrong. It was never told.
//
//   This is why the first recorded diagnosis — a permissive `band <= 0`
//   return on a full-bleed canvas — was WRONG, and is corrected here rather
//   than quietly dropped: the board's band measures +50px at 1366 and +207px
//   at 1680. It is never <= 0, so that branch never ran. The lesson is the
//   lane's own and it was ignored once here: READING CODE IS A HYPOTHESIS,
//   RUNNING IT IS A MEASUREMENT.
//
// TWO MORE DEFECTS THE MEASUREMENT FOUND, both of the same family:
//   (a) `canCoexist` looked for the paper with `.mode-page, .board-canvas,
//       .script-page`. On the FRAMED screenplay surface none of those render
//       — the diagnostic read `band=null` — so the function took its `!paper`
//       early return and THE TWO-DRAWER LAW WAS DISABLED OUTRIGHT on
//       screenplay. It now uses the probe's own corrected list, single-sourced.
//   (b) `closePanel` docking a survey withdrew the panel (`data-visible=
//       "false"`) without announcing a close, so the store went on believing
//       the cascade occupied a band it had vacated.
//
// THE REPAIR IS AT THE INVARIANT. Both drawers now announce from an EFFECT
// keyed on their own open state, so every path announces — including paths
// nobody has written yet. A silent open path is no longer possible to write.
// That is the difference between fixing this bug and closing its class, and
// it is what these checks are aimed at: S1 proves the behaviour, S2 proves
// the store is TOLD (the thing that was actually broken), S3 proves the
// repair did not overshoot into "always close".
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const NARROW = [1366, 768];   // the sitting's laptop floor — and the tablet band
const WIDE = [2600, 1400];    // wide enough that the band genuinely holds both

const freshDesk = async (app, w, h) => {
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.emulateDpr(1, w, h);
  await sleep(300);
};

// Reached through the app's own doors, never a raw storage seed (AGENTS.md).
const SURFACES = {
  prose: async (app) => {
    await app.goto('/project/new');
    await app.waitFor(`!!document.querySelector('[data-kind="book"]')`, { label: 'project picker' });
    await app.evalJs(`document.querySelector('[data-kind="book"]').click()`);
    await app.click('Start writing');
    await app.waitFor(`!!document.querySelector('.forward-only-editor')`, { label: 'prose page' });
  },
  screenplay: async (app) => {
    await app.goto('/project/new');
    await app.waitFor(`!!document.querySelector('[data-kind="screenplay"]')`, { label: 'screenplay picker' });
    await app.evalJs(`document.querySelector('[data-kind="screenplay"]').click()`);
    await app.click('Start writing');
    await app.waitFor(`!!document.querySelector('.script-el-active')`, { label: 'screenplay surface' });
  },
  board: async (app) => {
    await app.evalJs(`location.hash = '#/journal'`);
    await app.waitFor(`!!document.querySelector('.board-canvas')`, { label: 'board surface' });
  },
};

const STATE = `(() => {
  const s = document.querySelector('.wz-sliver');
  const p = document.querySelector('.wz-cascade-panel');
  return {
    sliverOpen: s ? s.getAttribute('data-open') : null,
    cascadeVisible: p ? p.getAttribute('data-visible') : null,
  };
})()`;

// The band and its two tenants, measured the way the policy measures them —
// so a "both stand" verdict can be shown to be EARNED rather than merely
// observed. A test that only checks the outcome cannot tell a correct
// coexistence from a law that has stopped running.
const BAND = `(() => {
  const paper = document.querySelector('.mode-page, .board-canvas-wrap, .script-sheet');
  const rail = document.querySelector('.desk-frame-strip');
  if (!paper || !rail) return null;
  const pb = paper.getBoundingClientRect(), rb = rail.getBoundingClientRect();
  const w = (sel, f) => { const el = document.querySelector(sel);
    const x = el ? el.getBoundingClientRect().width : 0; return x > 1 ? x : f; };
  return {
    band: +(pb.left - rb.right).toFixed(1),
    tools: +w('.wz-sliver[data-open="true"]', 200).toFixed(1),
    cascade: +w('.wz-cascade-panel[data-visible="true"]', 300).toFixed(1),
    paperLaidOut: pb.width > 0 && pb.height > 0,
  };
})()`;

// Open the sliver the way a writer does on a tablet: by tapping the GRIP.
// Using the keyboard shortcut here would have passed against the broken build
// — the shortcut was the one path that DID announce. The choice of affordance
// is the whole test.
const openSliverByGrip = async (app) => {
  await app.evalJs(`(() => { const g = document.querySelector('.wz-sliver-grip'); if (g) g.click(); })()`);
  await sleep(400);
};

const openFarLeft = (app) => app.evalJs(`(() => {
  const b = document.querySelectorAll('.wz-strip-item')[0];
  if (!b) return null;
  b.click();
  return b.getAttribute('aria-label') || b.textContent;
})()`);

await withHarness(async (app) => {
  // ---- S1: the ruled behaviour, on every surface, at the narrow width -----
  for (const [name, go] of Object.entries(SURFACES)) {
    await freshDesk(app, ...NARROW);
    await go(app);
    await sleep(400);

    await openSliverByGrip(app);
    const opened = await app.evalJs(STATE);
    ok(`E1 S1 (${name}): the grip opens the tool sliver`,
      opened.sliverOpen === 'true', JSON.stringify(opened));

    const band = await app.evalJs(BAND);
    const label = await openFarLeft(app);
    await sleep(500);
    const after = await app.evalJs(STATE);

    ok(`E1 S1 (${name} @ ${NARROW[0]}): a far-left open SHUTS the tool sliver — the two-hands rule, on the surface and at the width Nick felt it`,
      after.sliverOpen === 'false' && after.cascadeVisible === 'true',
      JSON.stringify({ rail: label, band, after }));

    // The band must be too short to hold both, or the check above proves
    // nothing about the law — it would just be reporting a coincidence.
    ok(`E1 S1 (${name} @ ${NARROW[0]}): CONTROL — the band genuinely cannot hold both, so the close above is the LAW firing and not an accident`,
      !!band && band.band < band.tools + band.cascade,
      JSON.stringify(band));
  }

  // ---- S2: the store is TOLD — the defect's actual mechanism -------------
  // A grip-opened sliver that the store does not know about is the exact
  // state the broken build sat in. There is no public read of the store, so
  // this is proven behaviourally: open by grip, then open the far left, and
  // require the displacement. If the announcement were silent again, the
  // sliver would stand and this fails — which is precisely what it did.
  await freshDesk(app, ...NARROW);
  await SURFACES.board(app);
  await sleep(400);
  await openSliverByGrip(app);
  const gripOnly = await app.evalJs(STATE);
  await openFarLeft(app);
  await sleep(500);
  const displaced = await app.evalJs(STATE);
  ok('E1 S2: an open announced ONLY through the grip still reaches the store — the silent-path class is closed, not merely this one path patched',
    gripOnly.sliverOpen === 'true' && displaced.sliverOpen === 'false',
    JSON.stringify({ gripOnly, displaced }));

  // ---- S3: the repair did not overshoot ----------------------------------
  // Nick's ruling has two halves and the second is as binding as the first:
  // "on a wider desktop screen, both can be open at the same time". A fix
  // that closed the sliver unconditionally would pass every check above.
  await freshDesk(app, ...WIDE);
  await SURFACES.prose(app);
  await sleep(400);
  await openSliverByGrip(app);
  await openFarLeft(app);
  await sleep(500);
  const wide = await app.evalJs(STATE);
  const wideBand = await app.evalJs(BAND);
  ok(`E1 S3 (prose @ ${WIDE[0]}): both drawers STAND when the band holds both — the other half of Nick's ruling, and the guard against a fix that just always closes`,
    wide.sliverOpen === 'true' && wide.cascadeVisible === 'true',
    JSON.stringify({ wide, wideBand }));
  ok(`E1 S3 (prose @ ${WIDE[0]}): CONTROL — that coexistence is EARNED: the measured band is at least as wide as both tenants together`,
    !!wideBand && wideBand.band >= wideBand.tools + wideBand.cascade,
    JSON.stringify(wideBand));

  // ---- S4: the paper is the box the writer sees --------------------------
  // The old selector list found nothing on the framed screenplay surface, so
  // the policy could not measure and the law was disabled there outright.
  await freshDesk(app, ...NARROW);
  await SURFACES.screenplay(app);
  await sleep(400);
  const scriptBand = await app.evalJs(BAND);
  ok('E1 S4 (screenplay): the paper is MEASURABLE on the framed screenplay surface — the old list named `.script-page`, which does not render here, and a policy that cannot measure cannot rule',
    !!scriptBand && scriptBand.paperLaidOut === true && Number.isFinite(scriptBand.band),
    JSON.stringify(scriptBand));

  return checks;
}, { label: 'item83e' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This file is NEW and supersedes no prior assertion: the
  // two-drawer law's own records (fx7, cd2, the probe) measured the ANCHORS
  // and the flush, never the exclusion handoff, which is why none of them
  // caught this and why none of them is falsified by the repair. The empty
  // list is the evidence that the fix was additive, not a reversal.
  // eslint-disable-next-line no-console
  console.log('\nITEM83E PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 83 errata E1 parks nothing. No prior assertion covered the exclusion handoff, so none is superseded by repairing it.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM83E VERIFY: PASS (${checks.length} checks)`
  : `\nITEM83E VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
