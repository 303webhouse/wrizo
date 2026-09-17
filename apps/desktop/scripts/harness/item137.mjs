// ITEM 137 — THE TRASH IS PINNED TO THE RAIL'S FOOT.
//
// Founder: "on my UI, the trash has never been aligned at the bottom of the
// rail — it's inline with the rest of the menu options."
//
// THE DEFECT, measured headful at S0 before anything changed
// (docs/menus/item137-s0-measurement.md):
//
//   1366x768   gap 8.8px    .wz-strip 544.4px   aside 545.2px
//   1366x1200  gap 303.6px  .wz-strip 544.4px   aside 840.0px
//
// `.wz-strip{height:100%}` resolves against `.desk-frame-strip`'s HEIGHT, and
// that element had only `min-height:70vh` — a min-height does not make a height
// definite, so the percentage fell back to `auto`, the strip went CONTENT-TALL
// (the same 544.4px at both viewport heights, while the aside tracked 70vh
// exactly), and `.wz-strip-foot{margin-top:auto}` had no free space to consume.
//
// WHY IT READ AS "INLINE" RATHER THAN AS A BROKEN PIN: at 768 the gap is only
// 8.8px. The eye sees Trash sitting after the last item, not stranded. The
// defect is that Trash was never pinned AT ALL, and it strands further the
// taller the window gets — 303.6px at 1200.
//
// ── WHAT THIS FILE ASSERTS, AND WHY IT IS NOT "THE GAP IS SMALL" ───────────
// A single small gap at one height is exactly what the DEFECTIVE build
// produced (8.8px at 768). So a check that only bounded the gap would have
// passed against the bug. What separates pinned from accidentally-close is
// BEHAVIOUR ACROSS HEIGHTS:
//
//   S1  the gap is the SAME at both heights (a pin holds; a content-tall
//       strip's gap grows with the viewport).
//   S2  the strip STRETCHES to its parent at both heights — the mechanism
//       itself, measured, so a future change that restores the bug is named
//       by the check rather than merely detected by it.
//
// ── AND ITEM 130 TRAVELS WITH IT ──────────────────────────────────────────
// The fix adds `display:flex; flex-direction:column` to the very element that
// carries item 130's `z-index:1`. S3 re-runs item 130's own question — does
// every strip item's centre hit-test to the item — on this fixture, so the two
// repairs cannot trade places silently. Neither is allowed to buy the other.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const WIDTH = 1366;
const HEIGHTS = [768, 1200];
// The residual gap is structural, not slack: `.wz-strip` carries `padding:8px 0`
// and the aside a 1px border, so a perfectly pinned Trash still sits ~8.8px
// above the aside's own bottom edge. The bound allows that and nothing like the
// 303.6px the defect produced.
const PIN_CEILING_PX = 14;
const PIN_STABILITY_PX = 1.5;   // how far the gap may differ BETWEEN heights
const STRETCH_SLACK_PX = 2;     // aside.height - strip.height, border/padding only

const freshProsePage = async (app, w, h) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, w, h);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(350);
};

const MEASURE = `(() => {
  const aside = document.querySelector('.desk-frame-strip');
  const strip = document.querySelector('.wz-strip');
  const foot  = document.querySelector('.wz-strip-foot');
  if (!aside || !strip || !foot) return { ok: false, aside: !!aside, strip: !!strip, foot: !!foot };
  const trash = [...foot.querySelectorAll('.wz-strip-item')].pop();
  if (!trash) return { ok: false, why: 'no strip item inside the foot' };
  const ab = aside.getBoundingClientRect(), sb = strip.getBoundingClientRect(), tb = trash.getBoundingClientRect();
  return {
    ok: true,
    label: (trash.getAttribute('aria-label') || trash.textContent || '').trim().slice(0, 20),
    gapPx: +(ab.bottom - tb.bottom).toFixed(1),
    asideH: +ab.height.toFixed(1),
    stripH: +sb.height.toFixed(1),
    stretchShortfallPx: +(ab.height - sb.height).toFixed(1),
  };
})()`;

// Item 130's own question, asked again on this fixture.
const STRIP_HITS = `(() => {
  const items = [...document.querySelectorAll('.wz-strip-item')];
  if (!items.length) return { ok: false, count: 0 };
  const rows = items.map(el => {
    const b = el.getBoundingClientRect();
    const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 20),
             hit: !!top && (top === el || el.contains(top)),
             topClass: top ? String(top.className).slice(0, 50) : null };
  });
  return { ok: true, count: rows.length, missed: rows.filter(r => !r.hit) };
})()`;

await withHarness(async (app) => {
  const seen = [];
  for (const h of HEIGHTS) {
    await freshProsePage(app, WIDTH, h);

    const m = await app.evalJs(MEASURE);
    ok(`ITEM137 S1 @ ${WIDTH}x${h}: the strip, its foot and the Trash are present to measure`,
      !!m && m.ok === true, JSON.stringify(m));
    if (!m || !m.ok) continue;
    seen.push({ h, ...m });

    ok(`ITEM137 S1 @ ${WIDTH}x${h}: the Trash sits at the rail's foot — its bottom edge within ${PIN_CEILING_PX}px of the aside's own (the residual is .wz-strip's 8px padding plus the 1px border, not slack)`,
      m.gapPx >= 0 && m.gapPx <= PIN_CEILING_PX, JSON.stringify(m));

    ok(`ITEM137 S2 @ ${WIDTH}x${h}: THE MECHANISM — the strip STRETCHES to its parent (shortfall <= ${STRETCH_SLACK_PX}px). Before the fix it rendered a content-tall 544.4px at every height while the aside tracked 70vh, which is why margin-top:auto had nothing to push against`,
      Math.abs(m.stretchShortfallPx) <= STRETCH_SLACK_PX, JSON.stringify(m));

    // ITEM 130 rides along — the fix touched the element carrying its z-index.
    const s = await app.evalJs(STRIP_HITS);
    ok(`ITEM137 S3 @ ${WIDTH}x${h}: ITEM 130 UNCHANGED — every strip item's centre still hit-tests to the item, so making the aside a flex column did not buy the pin with the strip's reachability`,
      !!s && s.ok === true && s.missed.length === 0, JSON.stringify(s));
  }

  // The check the defect could not have passed. One height proves nothing: the
  // broken build produced a small gap at 768 too. A pin is a gap that does not
  // care how tall the window is.
  if (seen.length === HEIGHTS.length) {
    const drift = Math.abs(seen[1].gapPx - seen[0].gapPx);
    ok(`ITEM137 S1 (the discriminating check): the gap is the SAME at ${HEIGHTS[0]} and ${HEIGHTS[1]} (within ${PIN_STABILITY_PX}px). The defective build read 8.8px then 303.6px — a bounded gap at ONE height would have passed against the bug, so stability across heights is the assertion that actually distinguishes pinned from accidentally-close`,
      drift <= PIN_STABILITY_PX,
      JSON.stringify({ at: seen.map(s => ({ h: s.h, gapPx: s.gapPx, stripH: s.stripH, asideH: s.asideH })), drift: +drift.toFixed(1) }));
  }

  return checks;
}, { label: 'item137' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. No prior assertion covered the Trash's vertical position
  // — which is precisely why a founder had to report it — so the repair
  // falsifies nothing. The empty list is the evidence, not an omission.
  // EMIT THE ARRAY, even empty. The park counter reads the JSON records, not
  // the human line below it — so a harness that prints only prose declares a
  // park count nothing can audit, and the day this file DOES park something
  // it would be parked invisibly. The empty array is the auditable form of
  // "nothing parked"; the sentence after it is for a reader, not the counter.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nITEM137 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 137 parks nothing. No existing check asserted where the Trash sits, so none is superseded by pinning it.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM137 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM137 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
