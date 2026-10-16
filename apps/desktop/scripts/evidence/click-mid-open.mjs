// CLICK MID-OPEN - a measurement, not a check (it lives in scripts/evidence/, so run-suite does not run it). Fable, Oct 12: "confirm with one measurement that a real
// click about 100 ms into the open hits the right button on both trees. If it doesn't, it's a product bug."
//
// For each delay after the drawer's grip is pressed, on a blank Draft page: (1) where the Screenplay button's centre hit-tests (the button itself, its
// container, or something else), at what ELAPSED time since the grip press (read in the page, not assumed); then (2) a REAL press and release at that point
// (CDP mouse events, the writer's own path), and whether the template actually applied (the page became a script page).
//
// EXTENDED (Oct 12, after Chat 1's table showed Phase 1's slide moving the button ~184 px): every press now also records WHAT IT ACTUALLY HIT (the mousedown and click targets, and the
// button among their ancestors, if any, and whether that button is a live control or an inert stand-in), and the verdict is tree-aware. On a tree with the sliding layer
// (.wz-sliver-panel > .wz-drawer-slide) the rule is: a press before the slide has settled (< 190 ms) must be a CLEAN NO-OP - it applies nothing and presses no live control, whichever
// control it would have met - and a press from settle on (>= 250 ms) must land. On a tree without the layer it keeps the original rule (60-160 ms must land).
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
    // what a press ACTUALLY hits: capture-phase listeners record the mousedown and click targets, the nearest button, and whether it is a live control
    await app.evalJs(`(() => {
      window.__down = null; window.__click = null;
      const describe = (e) => e ? (e.tagName.toLowerCase() + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).trim().split(/\\s+/).join('.') : '')) : null;
      const info = (ev) => { const t = ev.target; const b = t && t.closest ? t.closest('button') : null;
        return { target: describe(t), button: b ? ((b.getAttribute('aria-label') || b.title || b.dataset.template || b.textContent || 'button').trim().slice(0, 40)) : null,
                 live: !!b && !b.disabled && b.getAttribute('aria-disabled') !== 'true' }; };
      document.addEventListener('mousedown', (ev) => { window.__down = info(ev); }, true);
      document.addEventListener('click', (ev) => { window.__click = info(ev); }, true);
    })()`);
    const hasLayer = await app.evalJs("!!document.querySelector('.wz-sliver-panel > .wz-drawer-slide')");
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
    const down = await app.evalJs('window.__down');
    const click = await app.evalJs('window.__click');
    results.push({ delay, ...hit, landed, hasLayer, down, click });
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ bundle, results }, null, 2));
  if (results.some((r) => r.hasLayer)) {
    // sliding-layer tree: before settle a CLEAN NO-OP (nothing applied, no live control pressed); from settle on, it lands
    const pressedLive = (r) => !!(r.down && r.down.button && r.down.live) || !!(r.click && r.click.button && r.click.live);
    const before = results.filter((r) => r.elapsedMs < 190);
    const after = results.filter((r) => r.elapsedMs >= 250);
    const dirty = before.filter((r) => r.landed || pressedLive(r));
    const dead = after.filter((r) => !r.landed);
    // eslint-disable-next-line no-console
    console.log(dirty.length === 0 && dead.length === 0
      ? `\nCLICK-MID-OPEN (sliding layer): every press before settle was a clean no-op (${before.length} samples; targets: ${before.map((r) => (r.down && (r.down.button || r.down.target)) || 'none').join(' | ')}) and every press from settle on landed (${after.length}) - ${bundle}`
      : `\nCLICK-MID-OPEN (sliding layer): FAIL - ${dirty.length} early press(es) were not a clean no-op (${dirty.map((r) => r.elapsedMs + 'ms->' + JSON.stringify(r.down)).join('; ')}); ${dead.length} settled press(es) missed - ${bundle}`);
  } else {
    const early = results.filter((r) => r.elapsedMs >= 60 && r.elapsedMs <= 160);
    const bad = early.filter((r) => !r.hitIsButton || !r.landed);
    // eslint-disable-next-line no-console
    console.log(bad.length === 0
      ? `\nCLICK-MID-OPEN: a real press 60-160 ms into the open hits the right button and applies it (${early.length} samples) - ${bundle}`
      : `\nCLICK-MID-OPEN: PRODUCT BUG? ${bad.length}/${early.length} presses 60-160 ms into the open missed - ${bundle}`);
  }
});
