// CLICK MID-OPEN - a measurement, not a check (it lives in scripts/evidence/, so run-suite does not run it). Fable, Oct 12: "confirm with one measurement that a real
// click about 100 ms into the open hits the right button on both trees. If it doesn't, it's a product bug."
//
// For each delay after the drawer's grip is pressed, on a blank Draft page: (1) where the Screenplay button's centre hit-tests (the button itself, its
// container, or something else), at what ELAPSED time since the grip press (read in the page, not assumed); then (2) a REAL press and release at that point
// (CDP mouse events, the writer's own path), and whether the template actually applied (the page became a script page).
//
// It reports the tree it ran against (the built bundle name) so the same file can be pointed at the base, the fix and Phase 1 builds in turn.
// Needs a box turn (withHarness refuses without WS_BOX_TURN). Run: WS_BOX_TURN=<token> node scripts/evidence/click-mid-open.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const SCRIPT = '.script-sheet, .script-page, .script-el';
const SCREENPLAY = '.wz-template-live[data-template="screenplay"]';
const DELAYS = [0, 30, 60, 100, 150, 250, 450];

const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const freshBlankDraft = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.goto('/page/new');
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'unborn page' });
  await sleep(600);
  await app.click('Draft');
  await sleep(700);
};

const results = [];
await withHarness(async (app) => {
  const bundle = await app.evalJs("[...document.scripts].map(s => s.src).filter(Boolean).map(s => s.split('/').pop()).join(',')");
  for (const delay of DELAYS) {
    await freshBlankDraft(app);
    // scroll the Templates button into view while the drawer is still SHUT (it is mounted but not showing), so the only thing moving afterwards is the drawer's own arrival
    await app.evalJs(`document.querySelector(${JSON.stringify(SCREENPLAY)})?.scrollIntoView({ block: 'center', inline: 'nearest' })`);
    await app.evalJs("window.__t0 = performance.now(); document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(delay);
    const hit = await app.evalJs(`(() => {
      const b = document.querySelector(${JSON.stringify(SCREENPLAY)}); if (!b) return { error: 'no screenplay button' };
      const r = b.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      const h = document.elementFromPoint(x, y);
      const desc = (e) => e ? (e.tagName.toLowerCase() + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).trim().split(/\\s+/).join('.') : '')) : null;
      return { x, y, elapsedMs: Math.round(performance.now() - window.__t0), hit: desc(h), hitIsButton: !!h && (h === b || b.contains(h)),
               open: document.querySelector('.wz-sliver')?.getAttribute('data-open'), panelOpacity: getComputedStyle(document.querySelector('.wz-sliver-panel')).opacity };
    })()`);
    let landed = null;
    if (hit && !hit.error) {
      await app.mouseDown(hit.x, hit.y);
      await sleep(120);
      await app.mouseUp(hit.x, hit.y);
      landed = await waitSoft(app, `!!document.querySelector('${SCRIPT}')`, { label: 'screenplay applied', timeout: 2500 });
    }
    results.push({ delay, ...hit, landed });
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ bundle, results }, null, 2));
  const early = results.filter((r) => r.elapsedMs >= 60 && r.elapsedMs <= 160);
  const bad = early.filter((r) => !r.hitIsButton || !r.landed);
  // eslint-disable-next-line no-console
  console.log(bad.length === 0
    ? `\nCLICK-MID-OPEN: a real press 60-160 ms into the open hits the right button and applies it (${early.length} samples) - ${bundle}`
    : `\nCLICK-MID-OPEN: PRODUCT BUG? ${bad.length}/${early.length} presses 60-160 ms into the open missed - ${bundle}`);
});
