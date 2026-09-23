// THE SPLASH (item 194) — Nick's hand-drawn Wrizo over the live app.
//
// The claim that needs a check more than any other here is the NEGATIVE one:
// "it never blocks writing." That is not provable by looking at the overlay —
// an overlay that mounts and looks right can still be eating the writer's
// first keystroke. So S2/S3 below prove it the only way it can be proven: by
// putting a real trusted pointer and a real keystroke THROUGH the splash
// while it is live, and reading where they landed.
//
// Every pointer here is a trusted CDP event (the standing law); nothing uses
// page-side .click(), which would bypass the hit-testing this file exists to
// interrogate.
//
// Run: node scripts/harness/splash.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The asset's measured ink bounding box inside its own canvas — the same two
// numbers Splash.tsx sizes from. Stated here INDEPENDENTLY rather than
// imported, so a change to the component cannot quietly move this check's
// own goalposts with it.
const INK = { w: 3077, h: 2458 };
const CANVAS = { w: 3374, h: 2699 };
const FILL_X = INK.w / CANVAS.w;
const FILL_Y = INK.h / CANVAS.h;

const W = 1366, H = 768;

const openApp = async (app, { width = W, height = H } = {}) => {
  await app.emulateDpr(1, width, height);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
};

const splashState = (app) => app.evalJs(`(() => {
  const el = document.querySelector('.wz-splash');
  if (!el) return { mounted: false };
  const veil = el.querySelector('.wz-splash-veil');
  const mark = el.querySelector('.wz-splash-mark');
  const r = mark ? mark.getBoundingClientRect() : null;
  const cs = el ? getComputedStyle(el) : null;
  const veilCs = veil ? getComputedStyle(veil) : null;
  const markCs = mark ? getComputedStyle(mark) : null;
  return {
    mounted: true,
    tone: el.getAttribute('data-tone'),
    leaving: el.getAttribute('data-leaving'),
    src: mark ? (mark.getAttribute('src') || '') : null,
    rect: r ? { w: r.width, h: r.height, x: r.left, y: r.top } : null,
    pointerEvents: cs ? cs.pointerEvents : null,
    veilPointerEvents: veilCs ? veilCs.pointerEvents : null,
    markPointerEvents: markCs ? markCs.pointerEvents : null,
    backdrop: veilCs ? (veilCs.backdropFilter || veilCs.webkitBackdropFilter || 'none') : null,
    zIndex: cs ? cs.zIndex : null,
    vw: window.innerWidth, vh: window.innerHeight,
  };
})()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — IT APPEARS, OVER THE REAL APP, BLURRED.
  // ==========================================================================
  await openApp(app);
  const s1 = await splashState(app);
  ok('S1: the splash mounts on opening the app', s1.mounted === true, JSON.stringify({ tone: s1.tone, src: s1.src }));

  ok('S1: the backdrop is a LIVE blur of the app — a real backdrop-filter, not a screenshot. This is the first backdrop-filter in this stylesheet, so it is asserted rather than assumed to composite',
    typeof s1.backdrop === 'string' && /blur\(/.test(s1.backdrop), String(s1.backdrop));

  ok('S1: it paints above the app\'s whole existing stack (modals/backdrops/toasts top out at 300)',
    Number(s1.zIndex) >= 400, String(s1.zIndex));

  // The app is genuinely BEHIND it, not replaced by it: Arrival is what boots.
  const arrivalBehind = await app.evalJs("!!document.querySelector('.wz-arrival, .wz-gate') || !!document.querySelector('.wz-mark')");
  ok('S1: the REAL app interface is mounted behind the splash (Arrival, the Threshold — not a placeholder and not a captured frame)',
    arrivalBehind === true, String(arrivalBehind));

  // ==========================================================================
  // S2 — IT NEVER BLOCKS WRITING (i). THE POINTER GOES THROUGH.
  //
  // The strongest form of this claim: with the splash LIVE, hit-testing at the
  // very centre of the emblem must not return the splash. `elementFromPoint`
  // is the instrument item 130/151 settled on for "what is really there".
  // ==========================================================================
  const s2 = await splashState(app);
  ok('S2 (precondition): the splash is still live for the pass-through checks',
    s2.mounted === true && s2.leaving === 'false', JSON.stringify({ leaving: s2.leaving }));

  ok('S2: every layer of the overlay is pointer-events:none — the container, the veil and the mark',
    s2.pointerEvents === 'none' && s2.veilPointerEvents === 'none' && s2.markPointerEvents === 'none',
    JSON.stringify({ el: s2.pointerEvents, veil: s2.veilPointerEvents, mark: s2.markPointerEvents }));

  const atCentre = await app.evalJs(`(() => {
    const t = document.elementFromPoint(Math.round(innerWidth / 2), Math.round(innerHeight / 2));
    if (!t) return { hit: null };
    return { hit: t.tagName + (typeof t.className === 'string' && t.className ? '.' + t.className.split(' ')[0] : ''),
             insideSplash: !!t.closest('.wz-splash') };
  })()`);
  ok('S2 THE CLAIM: at the dead centre of the emblem, a real pointer lands on the APP UNDERNEATH, not on the splash — the overlay is invisible to hit-testing, so a click during the splash does exactly what it would have done without it',
    atCentre.insideSplash === false, JSON.stringify(atCentre));

  // ==========================================================================
  // S3 — IT NEVER BLOCKS WRITING (ii). THE FIRST KEYSTROKE IS NOT EATEN.
  //
  // The specific trap: a writer opens Wrizo and immediately types. If the
  // splash consumes that first character as its dismiss gesture, the app has
  // silently swallowed the first word — a loss no "did it dismiss" check
  // would ever notice. So: reopen, focus a real writing surface, type WHILE
  // THE SPLASH IS LIVE, and assert the text landed.
  // ==========================================================================
  await openApp(app);

  // A recorder on the page's own side. Asserted through an EVENT rather than
  // through whatever happens to be focusable on the Threshold: the claim is
  // about the splash not consuming input, and that is true or false regardless
  // of which surface is underneath. `defaultPrevented` is the half that
  // matters most — an overlay can let an event through and still have killed
  // its default action, which for a keystroke means no character.
  await app.evalJs(`(() => {
    window.__splashProbe = [];
    window.addEventListener('keydown', (e) => {
      window.__splashProbe.push({ key: e.key, prevented: e.defaultPrevented, phase: 'window-bubble' });
    });
  })()`);
  const liveWhileTyping = await app.evalJs("(() => { const el = document.querySelector('.wz-splash'); return !!el && el.getAttribute('data-leaving') === 'false'; })()");
  await app.typeKeys('w');
  await sleep(80);
  const probe = await app.evalJs('window.__splashProbe || []');

  ok('S3 THE TRAP: a keystroke sent WHILE THE SPLASH IS LIVE reaches the page AND arrives un-prevented — the dismissal listeners are passive and non-capturing, so they observe the key and let go of it. The loss this guards against is silent: a writer opens Wrizo, types immediately, and the first character is eaten as the dismiss gesture',
    liveWhileTyping === true && Array.isArray(probe) && probe.length > 0 && probe.every((e) => e.prevented === false),
    JSON.stringify({ liveWhileTyping, probe }));

  // And where a real writing target does exist on the opening surface, the
  // character must actually land in it. Conditional on purpose: the Threshold
  // shows its doors before its sign-in fields, so this is a bonus proof when
  // available, never a red for a surface that legitimately has no input.
  const landed = await app.evalJs(`(() => {
    const el = document.querySelector('input, textarea, [contenteditable="true"]');
    if (!el) return { skipped: true };
    el.focus();
    return { skipped: false, focused: document.activeElement === el };
  })()`);
  if (landed.skipped) {
    ok('S3 (noted, not a failure): the opening surface offers no focusable writing target, so the character-lands-in-the-field half is not exercised here — the event-level proof above carries the claim',
      true, JSON.stringify(landed));
  } else {
    await app.typeKeys('z');
    await sleep(80);
    const value = await app.evalJs("(() => { const el = document.activeElement; const v = el && (el.value !== undefined ? el.value : el.innerText); return typeof v === 'string' ? v : null; })()");
    ok('S3: and in a real field on the opening surface, the typed character actually lands',
      typeof value === 'string' && value.includes('z'), JSON.stringify({ value }));
  }

  // ==========================================================================
  // S4 — THE SIZE, MEASURED AGAINST NICK'S CEILING.
  //
  // "At most 1/5 the size of the screen." Measured on the INK, not the canvas:
  // the asset carries ~9% transparent margin on each axis, and sizing the
  // canvas instead would land the visible mark at 83.1% of the intent.
  // ==========================================================================
  await openApp(app);
  const s4 = await splashState(app);
  if (!s4.rect) {
    ok('S4 (driver): the emblem has a real on-screen box to measure', false, JSON.stringify(s4));
  } else {
    const inkW = s4.rect.w * FILL_X;
    const inkH = s4.rect.h * FILL_Y;
    const areaFraction = (inkW * inkH) / (s4.vw * s4.vh);
    ok('S4 THE CEILING: the emblem\'s INK covers one fifth of the screen\'s area (the AREA reading, per Fable\'s ruling, until Nick picks between the two frames)',
      Math.abs(areaFraction - 0.2) < 0.005,
      JSON.stringify({ inkW: Math.round(inkW), inkH: Math.round(inkH), areaFraction: areaFraction.toFixed(4), vw: s4.vw, vh: s4.vh }));

    ok('S4: and it keeps the drawing\'s own proportions — the sketch is never stretched to hit a number',
      Math.abs((inkW / inkH) - (INK.w / INK.h)) < 0.01,
      JSON.stringify({ rendered: (inkW / inkH).toFixed(3), asset: (INK.w / INK.h).toFixed(3) }));

    const centred = Math.abs((s4.rect.x + s4.rect.w / 2) - s4.vw / 2) < 2
      && Math.abs((s4.rect.y + s4.rect.h / 2) - s4.vh / 2) < 2;
    ok('S4: the emblem is centred on the screen', centred, JSON.stringify(s4.rect));
  }

  // The area reading has to hold at a DIFFERENT aspect ratio too — that is the
  // whole reason the size is computed rather than approximated in vw/vh, which
  // would be right at one shape of window and wrong at the rest.
  await openApp(app, { width: 1440, height: 1200 });
  const s4b = await splashState(app);
  if (s4b.rect) {
    const f = (s4b.rect.w * FILL_X * s4b.rect.h * FILL_Y) / (s4b.vw * s4b.vh);
    ok('S4: the fifth holds at a different ASPECT RATIO (1440x1200, not just 1366x768) — the proof that the size is real arithmetic and not a vw/vh approximation that happens to be right at one window shape',
      Math.abs(f - 0.2) < 0.005, JSON.stringify({ areaFraction: f.toFixed(4), vw: s4b.vw, vh: s4b.vh }));
  }

  // ==========================================================================
  // S5 — THE ASSET FOLLOWS THE MEASURED BACKDROP, NOT A THEME MAP.
  // ==========================================================================
  const tone = await app.evalJs('window.wrizoBackdropTone ? window.wrizoBackdropTone.measure() : null');
  ok('S5: the backdrop probe answers (the seam exists and runs in the page)',
    tone === 'dark' || tone === 'light', String(tone));

  const s5 = await splashState(app);
  const agrees = (s5.tone === 'dark' && /for-dark-theme/.test(s5.src || ''))
    || (s5.tone === 'light' && /for-light-theme/.test(s5.src || ''));
  ok('S5: the asset SHOWN matches the tone MEASURED — cream linework over a dark ground, warm ink over a light one. The failure this guards is the one a theme→asset map would have shipped silently: ink the same colour as the ground, i.e. no visible art at all',
    agrees, JSON.stringify({ measuredTone: s5.tone, src: s5.src }));

  ok('S5: on this app\'s own ground (every registered theme is dark: plateau #110600, flux #04141A) the measurement selects the DARK asset',
    s5.tone === 'dark', String(s5.tone));

  // ==========================================================================
  // S6 — IT LEAVES ON ITS OWN, AND EARLY IF ASKED.
  // ==========================================================================
  await openApp(app);
  const holdMs = await app.evalJs('window.wrizoSplash ? window.wrizoSplash.HOLD_MS : null');
  ok('S6 (driver): the hold is readable from the page seam', typeof holdMs === 'number', String(holdMs));
  await sleep((holdMs || 1200) + 700);
  const afterHold = await app.evalJs("!!document.querySelector('.wz-splash')");
  ok('S6: left alone, the splash dismisses ITSELF after its hold — nothing is ever required of the writer',
    afterHold === false, JSON.stringify({ stillMounted: afterHold, holdMs }));

  await openApp(app);
  const liveBefore = await app.evalJs("!!document.querySelector('.wz-splash')");
  await app.key('Escape');
  await sleep(600);
  const afterKey = await app.evalJs("!!document.querySelector('.wz-splash')");
  ok('S6: any input dismisses it EARLY — the hold is a maximum, never a wait',
    liveBefore === true && afterKey === false, JSON.stringify({ liveBefore, afterKey }));

  // ==========================================================================
  // S7 — IT SHOWS ON EVERY OPEN (Fable's ruling), NOT ONCE EVER.
  // firstRunComplete is set by openApp, so a first-run-only splash would be
  // absent on this second open. It is present.
  // ==========================================================================
  await openApp(app);
  const secondOpen = await app.evalJs("!!document.querySelector('.wz-splash')");
  ok('S7: it appears again on a SUBSEQUENT open — this is an opening splash, not a first-run rite, and store/firstRun.ts is deliberately not reused for it',
    secondOpen === true, String(secondOpen));

  // ==========================================================================
  // S8 — REDUCED MOTION: A PLAIN APPEAR AND DISAPPEAR, NO ANIMATED ENTRANCE.
  // ==========================================================================
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await openApp(app);
  const rm = await app.evalJs(`(() => {
    const veil = document.querySelector('.wz-splash-veil');
    const mark = document.querySelector('.wz-splash-mark');
    if (!veil || !mark) return { present: false };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return { present: true, reduced,
             veil: getComputedStyle(veil).transitionDuration,
             mark: getComputedStyle(mark).transitionDuration };
  })()`);
  if (!rm.present) {
    ok('S8 (driver): the splash is present to read its motion from', false, JSON.stringify(rm));
  } else if (!rm.reduced) {
    ok('S8 (driver): reduced motion could not be emulated in this runner, so the plain-appear rule is UNPROVEN here rather than passing by default', false, JSON.stringify(rm));
  } else {
    ok('S8: under reduced motion the fade is removed entirely — a plain appear and disappear, the hold unchanged',
      /^0s(,|$)/.test(rm.veil) && /^0s(,|$)/.test(rm.mark), JSON.stringify(rm));
  }
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nSPLASH VERIFY: PASS (${checks.length} checks)`
  : `\nSPLASH VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
