// ITEM 151 (Shape A) — THE FALSIFICATION.
//
// Fable's own condition, carried by this file rather than only by prose in
// an offer: a green regression suite proves nothing broke, not that the fix
// does anything. This file proves it does. Two claims, both demonstrated
// against a synthetic fixture (no app/journal state — this tests the
// INSTRUMENT, not a feature):
//
//   1. UNMUTATED — a real, reachable target — the helper proceeds and
//      actually dispatches.
//   2. MUTATED — the SAME target, now covered by a second real element at
//      the identical rect — the helper fails BY NAME and does not dispatch
//      onto the wrong element. Removing the cover restores dispatch, so the
//      fix is not simply refusing every site.
//
// `assertHittable`'s narrower, already-documented limit is proven too, not
// only asserted: it has no identity to check against, so a point covered by
// a DIFFERENT real element reads as "not empty" and it proceeds — correctly,
// by its own stated guarantee, and that limit is exactly why `trustedClick`-
// family sites use `trustedDispatch` wherever a selector still exists.
//
// Run: node scripts/harness/tp1.mjs   (from apps/desktop, dist-web freshly
// built).
import { withHarness } from '../runtime-verify.mjs';
import { hittablePointBy, trustedDispatch, assertHittable } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RECT = { left: 120, top: 160, width: 160, height: 60 };

const buildTarget = (app) => app.evalJs(`(() => {
  document.querySelectorAll('[data-tp1]').forEach(n => n.remove());
  window.__tpHits = 0;
  const t = document.createElement('div');
  t.id = 'tp1-target';
  t.className = 'tp1-target-el';
  t.setAttribute('data-tp1', '1');
  Object.assign(t.style, { position: 'fixed', left: '${RECT.left}px', top: '${RECT.top}px', width: '${RECT.width}px', height: '${RECT.height}px', background: '#4a7', zIndex: 1000 });
  t.addEventListener('mousedown', () => { window.__tpHits += 1; });
  document.body.appendChild(t);
  return true;
})()`);

const coverTarget = (app) => app.evalJs(`(() => {
  const c = document.createElement('div');
  c.id = 'tp1-cover';
  c.className = 'tp1-cover-el';
  c.setAttribute('data-tp1', '1');
  Object.assign(c.style, { position: 'fixed', left: '${RECT.left}px', top: '${RECT.top}px', width: '${RECT.width}px', height: '${RECT.height}px', background: '#a44', zIndex: 2000 });
  document.body.appendChild(c);
  return true;
})()`);

const removeCover = (app) => app.evalJs("(() => { const c = document.getElementById('tp1-cover'); if (c) c.remove(); return true; })()");
const hits = (app) => app.evalJs('window.__tpHits');
const centreOf = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);

const tryDispatch = async (app, label) => {
  try { await trustedDispatch(app, "document.getElementById('tp1-target')", label); return null; }
  catch (e) { return e.message; }
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1200, 800);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });

  // ===== S1 — trustedDispatch, UNMUTATED: must proceed =====
  await buildTarget(app);
  const pt = await centreOf(app, '#tp1-target');
  const threw1 = await tryDispatch(app, 'tp1 S1');
  await sleep(80);
  const hitsAfter1 = await hits(app);
  ok('S1 UNMUTATED: trustedDispatch proceeds and actually dispatches at a reachable target (no cover)',
    threw1 === null && hitsAfter1 === 1, JSON.stringify({ threw1, hitsAfter1 }));

  // ===== S2 — trustedDispatch, MUTATED (covered by a real element): must
  // fail BY NAME and must NOT dispatch onto the covering element =====
  await coverTarget(app);
  const threw2 = await tryDispatch(app, 'tp1 S2');
  await sleep(80);
  const hitsAfter2 = await hits(app);
  ok('S2 THE FALSIFICATION: trustedDispatch fails by name when a real element covers the target, and does not silently dispatch onto it',
    typeof threw2 === 'string' && /occluded/.test(threw2) && hitsAfter2 === 1,
    JSON.stringify({ threw2, hitsAfter2 }));

  const p2 = await hittablePointBy(app, "document.getElementById('tp1-target')");
  ok('S2b: hittablePointBy itself reports found:false, why:occluded — the named reason the throw above carries, not a bare rejection',
    !!p2 && p2.found === false && p2.why === 'occluded', JSON.stringify(p2));

  await removeCover(app);

  // ===== S3 — cover removed: proceeds again (the fix does not simply
  // refuse every site once tripped) =====
  const threw3 = await tryDispatch(app, 'tp1 S3');
  await sleep(80);
  const hitsAfter3 = await hits(app);
  ok('S3: removing the cover restores dispatch — the fix reports the true state at each call, it does not latch',
    threw3 === null && hitsAfter3 === 2, JSON.stringify({ threw3, hitsAfter3 }));

  // ===== S4 — assertHittable, UNMUTATED: must proceed =====
  let threw4 = null; let tag4 = null;
  try { tag4 = await assertHittable(app, pt.x, pt.y, 'tp1 S4'); } catch (e) { threw4 = e.message; }
  ok('S4 UNMUTATED: assertHittable proceeds at a real, reachable point and returns the target’s own tag',
    threw4 === null && tag4 === 'DIV.tp1-target-el', JSON.stringify({ threw4, tag4 }));

  // ===== S5 — assertHittable, MUTATED (genuinely empty point): fails by
  // name — this is the defect class assertHittable DOES cover =====
  // (5, 5) was tried first and PASSED WRONGLY — a full-bleed app layout
  // paints something under nearly every on-screen point, so "empty" has to
  // mean OUTSIDE THE VIEWPORT, where elementFromPoint is specified to
  // return null, not merely an unused corner of the page.
  let threw5 = null;
  try { await assertHittable(app, 50000, 50000, 'tp1 S5 (outside the viewport)'); } catch (e) { threw5 = e.message; }
  ok('S5 THE FALSIFICATION (assertHittable): fails by name at a point with nothing under it',
    typeof threw5 === 'string' && /hits nothing/.test(threw5), JSON.stringify({ threw5 }));

  // ===== S6 — assertHittable's DOCUMENTED LIMIT, proven rather than only
  // asserted: covered by a DIFFERENT real element, it has no identity to
  // compare against, so it reads "not empty" and proceeds — returning the
  // COVER's tag, not the target's. Not a defect in assertHittable; the
  // reason trustedDispatch exists as the stronger of the two primitives. =====
  await coverTarget(app);
  let threw6 = null; let tag6 = null;
  try { tag6 = await assertHittable(app, pt.x, pt.y, 'tp1 S6'); } catch (e) { threw6 = e.message; }
  ok('S6 THE DOCUMENTED LIMIT: assertHittable does not notice the target is now a different real element underneath — it proceeds and returns the COVER element’s tag, confirming the narrower guarantee is real, not just asserted in a comment',
    threw6 === null && tag6 === 'DIV.tp1-cover-el', JSON.stringify({ threw6, tag6 }));
  await removeCover(app);

  await app.evalJs("document.querySelectorAll('[data-tp1]').forEach(n => n.remove())");
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nTP1 VERIFY: PASS (${checks.length} checks)`
  : `\nTP1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
