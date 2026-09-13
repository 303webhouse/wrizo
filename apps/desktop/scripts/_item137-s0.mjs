// ITEM 137 S0 — MEASURE THE TRASH'S PIN. Headful, per the brief.
//
// SCRATCH INSTRUMENT, not a harness: this exists to answer S0's question and
// is deleted before the offer. The ticket's permanent coverage is item137.mjs.
//
// THE HYPOTHESIS (Fable's, to be measured and not trusted). Cascade.tsx pins
// Trash in `.wz-strip-foot{margin-top:auto}` inside `.wz-strip{height:100%}`,
// mounted in `.desk-frame-strip{position:absolute; min-height:70vh}` which has
// NO `height` and NO `bottom`. A percentage height resolves against the
// parent's HEIGHT, and `min-height` does not make that height definite — so
// `.wz-strip` falls back to content-tall, `margin-top:auto` has no free space
// to consume, and the foot never reaches the bottom.
//
// SOURCE ALREADY AGREES (checked browserlessly before the box turn):
//   index.css:3984  .wz-strip-foot{ margin-top:auto; }
//   index.css:3976  .wz-strip{ display:flex; flex-direction:column; height:100%; ... }
//   index.css:2691  .desk-frame-strip{ position:absolute; top:-16px; ... min-height:70vh; ... }
//   DeskFrame.tsx:231  <aside class="desk-frame-strip"> { strip }   ← direct child
//   Cascade.tsx:281    <div class="wz-strip-foot"> … SECTION_TRASH </div>
//
// But source agreeing is a hypothesis with better evidence, not a measurement.
// What this reports is the RENDERED GAP between the Trash's bottom edge and
// the aside's bottom edge, at two viewport HEIGHTS — two, because the
// prediction is specifically that the strip is content-tall: a content-tall
// strip's gap GROWS as the viewport gets taller (the aside stretches with
// 70vh while the content does not), whereas a genuinely-pinned foot holds its
// gap near zero at both. One height would show a number; two show the
// mechanism.
import { withHarness } from './runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HEIGHTS = [768, 1200];
const WIDTH = 1366;

const freshProsePage = async (app, w, h) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, w, h);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor framed' });
  await sleep(350);
};

// Every box the hypothesis names, measured in one pass, plus the computed
// values that would explain the result either way.
const MEASURE = `(() => {
  const aside = document.querySelector('.desk-frame-strip');
  const strip = document.querySelector('.wz-strip');
  const foot  = document.querySelector('.wz-strip-foot');
  if (!aside || !strip || !foot) return { ok: false, aside: !!aside, strip: !!strip, foot: !!foot };
  // The Trash itself — the LAST strip item inside the foot, named not counted.
  const trash = [...foot.querySelectorAll('.wz-strip-item')].pop();
  const r = el => { const b = el.getBoundingClientRect();
    return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), height: +b.height.toFixed(1) }; };
  const cs = getComputedStyle(strip), ca = getComputedStyle(aside);
  return {
    ok: true,
    viewportH: window.innerHeight,
    aside: r(aside), strip: r(strip), foot: r(foot),
    trash: trash ? r(trash) : null,
    trashLabel: trash ? (trash.getAttribute('aria-label') || trash.textContent || '').trim().slice(0, 20) : null,
    // The gap the brief asks for: Trash's bottom edge against the aside's.
    gapPx: trash ? +(aside.getBoundingClientRect().bottom - trash.getBoundingClientRect().bottom).toFixed(1) : null,
    // The explanation, either way.
    stripComputedHeight: cs.height,
    stripDisplay: cs.display,
    asideComputedHeight: ca.height,
    asideDisplay: ca.display,
    asideMinHeight: ca.minHeight,
    // Content-tall or stretched? If the strip is shorter than the aside, the
    // percentage did not resolve and the foot has nothing to push against.
    stripShorterThanAsideBy: +(aside.getBoundingClientRect().height - strip.getBoundingClientRect().height).toFixed(1),
  };
})()`;

await withHarness(async (app) => {
  const rows = [];
  for (const h of HEIGHTS) {
    await freshProsePage(app, WIDTH, h);
    const m = await app.evalJs(MEASURE);
    rows.push({ h, m });
    // eslint-disable-next-line no-console
    console.log(`\n=== ${WIDTH}x${h} ===\n${JSON.stringify(m, null, 2)}`);
  }
  // eslint-disable-next-line no-console
  console.log('\n=== S0 VERDICT ===');
  for (const { h, m } of rows) {
    if (!m.ok) { console.log(`${h}: COULD NOT MEASURE ${JSON.stringify(m)}`); continue; }
    console.log(`${String(h).padEnd(5)} gap(aside.bottom - trash.bottom) = ${String(m.gapPx).padStart(8)}px   strip shorter than aside by ${String(m.stripShorterThanAsideBy).padStart(8)}px   strip.height=${m.stripComputedHeight} aside.height=${m.asideComputedHeight}`);
  }
  const gaps = rows.filter(r => r.m.ok).map(r => r.m.gapPx);
  if (gaps.length === 2) {
    console.log(gaps[1] > gaps[0] + 1
      ? `\nGAP GROWS WITH VIEWPORT HEIGHT (${gaps[0]} -> ${gaps[1]}) — consistent with a CONTENT-TALL strip: the aside stretches, the content does not, so margin-top:auto has nothing to consume.`
      : `\nGAP DOES NOT GROW (${gaps[0]} -> ${gaps[1]}) — the content-tall explanation does NOT hold; the hypothesis needs revising before any fix.`);
  }
  return [];
}, { label: 'item137-s0', headful: true });
