// THE SPLASH (item 187) — Nick's hand-drawn Wrizo over the live app.
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
import { readFile } from 'node:fs/promises';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// S8 (harness-only): the browser's own computed `transitionDuration` under reduced
// motion is not always the literal string "0s" — a near-zero value can compute as
// scientific notation ("1e-05s", 0.01ms), which is the app's own "no animation"
// value, not a leftover transition. Parse the FIRST comma-separated duration (one
// per transitioned property) to milliseconds rather than string-matching "0s".
function firstDurationMs(str) {
  const first = String(str).split(',')[0].trim();
  const m = /^([\d.eE+-]+)(m?s)$/.exec(first);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  return m[2] === 'ms' ? n : n * 1000;
}

// ITEM splash-hold round 2 (harness-only): getComputedStyle resolving a color-mix()
// does not always normalize to legacy rgb()/rgba() — some engines report the modern
// `color(srgb r g b / a)` form instead, whose r/g/b are FRACTIONS (0..1), not 0..255.
// Parses either shape to the same { r, g, b, a } (r/g/b always 0..255, a always 0..1).
function parseComputedColor(str) {
  const s = String(str).trim();
  let m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    if (parts.length < 3) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  m = /^color\(srgb\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)(?:\s*\/\s*([\d.eE+-]+))?\)$/.exec(s);
  if (m) {
    return { r: parseFloat(m[1]) * 255, g: parseFloat(m[2]) * 255, b: parseFloat(m[3]) * 255, a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  }
  return null;
}

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

// ITEM splash-hold round 3: the theme must be set BEFORE the reload (clearing storage
// first resets it to Arbor's own default) — the clear + theme + first-run-complete
// write is one evalJs call for exactly that reason.
const openAppThemed = async (app, theme, { width = W, height = H } = {}) => {
  await app.emulateDpr(1, width, height);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
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
    veilBackground: veilCs ? veilCs.backgroundColor : null,
    zIndex: cs ? cs.zIndex : null,
    vw: window.innerWidth, vh: window.innerHeight,
  };
})()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — IT APPEARS, OVER THE REAL APP, DIMMED.
  // ==========================================================================
  await openApp(app);
  const s1 = await splashState(app);
  ok('S1: the splash mounts on opening the app', s1.mounted === true, JSON.stringify({ tone: s1.tone, src: s1.src }));

  // SUPERSEDED (item splash-hold, Nick live: "the background should be faded out,
  // not blurred") — the backdrop-filter blur retires whole; there is none to assert.
  // ok('S1: the backdrop is a LIVE blur of the app — a real backdrop-filter, not a screenshot. This is the first backdrop-filter in this stylesheet, so it is asserted rather than assumed to composite', typeof s1.backdrop === 'string' && /blur\(/.test(s1.backdrop), String(s1.backdrop));
  ok('S1 (item splash-hold successor): no backdrop-filter remains on the veil — the retirement, proven inert, not just unasserted',
    s1.backdrop === 'none', String(s1.backdrop));

  const s1Tint = await app.evalJs(`(() => {
    const m = getComputedStyle(document.documentElement).getPropertyValue('--ink-950').trim();
    const n = parseInt(m.replace('#', ''), 16);
    return { ground: { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 } };
  })()`);
  const veilColor = parseComputedColor(s1.veilBackground);
  const closeEnough = (a, b) => Math.abs(a - b) <= 2; // color-mix rounding across engines
  // SUPERSEDED (item splash-hold ROUND 6, Nick live: "make it a solid block" —
  // nothing of the app shows through at all) — ~90% let a sliver of the app
  // through on purpose; that purpose retired. Parked verbatim; see the
  // successor just below.
  // ok('S1 (item splash-hold, round 2): the veil is a flat dimming tint in the THEME\'s own ground colour (--ink-950) at ~90% opacity — never one fixed colour painted over every theme',
  //   !!veilColor
  //     && closeEnough(veilColor.r, s1Tint.ground.r) && closeEnough(veilColor.g, s1Tint.ground.g) && closeEnough(veilColor.b, s1Tint.ground.b)
  //     && Math.abs(veilColor.a - 0.90) <= 0.03,
  //   JSON.stringify({ veilBackground: s1.veilBackground, parsed: veilColor, expectedGround: s1Tint.ground }));
  ok('S1 (ROUND 6 successor): the veil is a SOLID block in the THEME\'s own ground colour (--ink-950) — 100% opaque, nothing of the app showing through, never one fixed colour painted over every theme',
    !!veilColor
      && closeEnough(veilColor.r, s1Tint.ground.r) && closeEnough(veilColor.g, s1Tint.ground.g) && closeEnough(veilColor.b, s1Tint.ground.b)
      && Math.abs(veilColor.a - 1) <= 0.01,
    JSON.stringify({ veilBackground: s1.veilBackground, parsed: veilColor, expectedGround: s1Tint.ground }));

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

  ok('S3 THE TRAP: a keystroke sent WHILE THE SPLASH IS LIVE reaches the page AND arrives un-prevented — the window listeners are passive and non-capturing (item splash-hold: they no longer dismiss anything either, but the pass-through claim is unchanged). The loss this guards against is silent: a writer opens Wrizo, types immediately, and the first character is eaten by anything the splash does',
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
  // S4 - THE SIZE (item 187): ABOUT A QUARTER OF THE AREA, AND THE APP SHOWS
  // ON ALL FOUR SIDES.
  //
  // Nick: "OK, let's make it ~1/4 the screen size. Doesn't need to be exact,
  // but that should be big enough to see the text a bit better, no?" So the
  // size is asserted as a BAND, not a pixel. THE LOAD-BEARING CHECK IS HIS
  // EARLIER PURPOSE, unchanged: "smaller than the background so it's clear it's
  // just a popup over the real app" - at every tested screen size the dimmed
  // app shows on ALL FOUR SIDES of the emblem (each margin >= 10% of its axis).
  // Measured on the INK, not the canvas (~9% transparent margin per axis).
  // Two caps (height 60%, width 70%) keep that true at extreme shapes; they
  // only ever make the emblem smaller, so where one binds the band check is
  // one-sided. Whether a cap binds is derived HERE, independently of the
  // component, from the same stated fractions.
  // ==========================================================================
  const SIZES = [
    { w: 1366, h: 768 }, { w: 1440, h: 1200 }, { w: 1100, h: 900 },
    { w: 1920, h: 1080 }, { w: 2200, h: 1300 }, { w: 900, h: 1200 },
    { w: 390, h: 844 },  // portrait phone: the width cap binds
    { w: 2560, h: 400 }, // extreme aspect: the height cap binds
  ];
  const ASPECT_INK = INK.w / INK.h;
  for (const { w, h } of SIZES) {
    await openApp(app, { width: w, height: h });
    const s = await splashState(app);
    if (!s.rect) {
      ok(`S4 (driver) ${w}x${h}: the emblem has a real on-screen box to measure`, false, JSON.stringify(s));
      continue;
    }
    const inkW = s.rect.w * FILL_X;
    const inkH = s.rect.h * FILL_Y;
    const cx = s.rect.x + s.rect.w / 2;
    const cy = s.rect.y + s.rect.h / 2;
    const margin = {
      left: cx - inkW / 2,
      right: s.vw - (cx + inkW / 2),
      top: cy - inkH / 2,
      bottom: s.vh - (cy + inkH / 2),
    };
    const sidesOk = margin.left >= 0.1 * s.vw && margin.right >= 0.1 * s.vw
      && margin.top >= 0.1 * s.vh && margin.bottom >= 0.1 * s.vh;
    ok(`S4 THE PURPOSE @ ${w}x${h}: the dimmed app is visible on ALL FOUR SIDES of the emblem (each margin >= 10% of its axis) - it reads as a popup over the real app, not a takeover`,
      sidesOk, JSON.stringify({ margin: { l: Math.round(margin.left), r: Math.round(margin.right), t: Math.round(margin.top), b: Math.round(margin.bottom) }, vw: s.vw, vh: s.vh }));

    const areaFraction = (inkW * inkH) / (s.vw * s.vh);
    const uncappedInkW = Math.sqrt(s.vw * s.vh * 0.25 * ASPECT_INK);
    const capBinds = uncappedInkW > s.vh * 0.6 * ASPECT_INK + 0.5 || uncappedInkW > s.vw * 0.7 + 0.5;
    const inBand = areaFraction >= 0.22 && areaFraction <= 0.28;
    ok(`S4 @ ${w}x${h}: about a quarter of the area - ${capBinds ? 'a cap binds here, so the band is one-sided (never MORE than a quarter)' : 'within the 22-28% band around a quarter (not a pixel)'}`,
      capBinds ? areaFraction <= 0.28 : inBand, JSON.stringify({ areaFraction: areaFraction.toFixed(4), capBinds }));

    ok(`S4 @ ${w}x${h}: the drawing keeps its own proportions (never stretched) and sits centred`,
      Math.abs((inkW / inkH) - (INK.w / INK.h)) < 0.01
        && Math.abs(cx - s.vw / 2) < 2 && Math.abs(cy - s.vh / 2) < 2,
      JSON.stringify({ ratio: (inkW / inkH).toFixed(3), cx, cy }));
  }

  // ==========================================================================
  // S5 — THE ASSET FOLLOWS THE MEASURED BACKDROP, NOT A THEME MAP.
  // ==========================================================================
  // ITEM 141 (harness-only): the SIZES loop's last `openApp` navigates with no
  // settle after it — a window.wrizo* seam read right here raced the reload.
  await app.waitFor("!!document.querySelector('.wz-splash')", { label: 'S5 settle' });
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
  // S6 — IT LEAVES ON ITS OWN, AFTER THE FLOOR (item splash-hold).
  // ==========================================================================
  await openApp(app);
  // ITEM 141 (harness-only): same shape as S5 above — openApp navigates with no
  // settle of its own, so the seam read right after it needs its own waitFor.
  await app.waitFor("!!document.querySelector('.wz-splash')", { label: 'S6 settle' });
  const holdMs = await app.evalJs('window.wrizoSplash ? window.wrizoSplash.HOLD_MS : null');
  // SUPERSEDED (item splash-hold ROUND 3): "minimum 5s per app load" raised the floor
  // from round 1's 3000ms.
  // ok('S6 (driver): the hold is readable from the page seam, and is the item splash-hold floor (>= 3000ms, Nick live: "visible for at least 3 seconds")', typeof holdMs === 'number' && holdMs >= 3000, String(holdMs));
  ok('S6 (driver, ROUND 3 successor): the hold is readable from the page seam, and is the item splash-hold floor (>= 5000ms, Nick live: "minimum 5s per app load")',
    typeof holdMs === 'number' && holdMs >= 5000, String(holdMs));
  const mountedAt = Date.now();
  // A fixed sleep raced the app's OWN readiness (round 3: the hold now also waits for
  // authState to resolve past 'loading', which a slow harness/CI tick could overrun a
  // sleep(holdMs+700) by) — waitFor polls instead, with real headroom.
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'S6 self-dismiss after the floor', timeout: (holdMs || 5000) + 8000 });
  const elapsedMs = Date.now() - mountedAt;
  ok('S6: left alone, the splash dismisses ITSELF after its hold (and only once the app is ready) — nothing is ever required of the writer',
    elapsedMs >= (holdMs || 5000) - 150, String(elapsedMs));

  await openApp(app);
  const liveBefore = await app.evalJs("!!document.querySelector('.wz-splash')");
  await app.key('Escape');
  await sleep(600);
  const stillLiveAfterKey = await app.evalJs("!!document.querySelector('.wz-splash')");
  ok('S6 (item splash-hold): input does not dismiss it early, nor shorten the hold — the gesture is retired whole, proven inert (Escape mid-hold does nothing; only the floor\'s own timer, above, ever ends it)',
    liveBefore === true && stillLiveAfterKey === true, JSON.stringify({ liveBefore, stillLiveAfterKey }));

  // ==========================================================================
  // S9 — ROUND 3: "NO GHOST" (the front door stays hidden through the hold,
  // fades in as the splash leaves) AND THE LOADING LINE (from the lexicon,
  // per theme) — both themes.
  // ==========================================================================
  for (const theme of ['plateau', 'flux']) {
    await openAppThemed(app, theme);
    await app.waitFor("!!document.querySelector('.wz-splash')", { label: `S9 settle (${theme})` });

    const duringHold = await app.evalJs(`(() => {
      const logo = document.querySelector('.wz-logo');
      const tagline = document.querySelector('.wz-tagline');
      const doors = document.querySelector('.wz-arrival-doors');
      const lineEl = document.querySelector('.wz-splash-loading');
      const textEl = document.querySelector('.wz-splash-loading-text');
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        splashHoldAttr: document.documentElement.getAttribute('data-splash-hold'),
        logoOpacity: logo ? getComputedStyle(logo).opacity : null,
        taglineOpacity: tagline ? getComputedStyle(tagline).opacity : null,
        doorsOpacity: doors ? getComputedStyle(doors).opacity : null,
        loadingRole: lineEl ? lineEl.getAttribute('role') : null,
        loadingText: textEl ? textEl.textContent : null,
      };
    })()`);
    ok(`S9 (${theme}): "no ghost" — the front door's own wordmark/tagline/doors are invisible while the splash holds`,
      duringHold.splashHoldAttr === 'true'
        && duringHold.logoOpacity === '0' && duringHold.taglineOpacity === '0' && duringHold.doorsOpacity === '0',
      JSON.stringify(duringHold));
    ok(`S9 (${theme}): the loading line carries role="status" and its text is one of this theme's own lexicon phrases, never a hardcoded string`,
      duringHold.loadingRole === 'status' && typeof duringHold.loadingText === 'string' && duringHold.loadingText.length > 0,
      JSON.stringify(duringHold));

    const lexiconLines = await app.evalJs(`(() => {
      const t = window.wrizoDeskLexicon ? window.wrizoDeskLexicon.t : null;
      if (!t) return null;
      return [1, 2, 3, 4].map((n) => t('splashLoading' + n));
    })()`);
    ok(`S9 (${theme}): the rendered line is genuinely ONE OF this theme's four lexicon phrases (not coincidentally matching text written elsewhere)`,
      Array.isArray(lexiconLines) && lexiconLines.includes(duringHold.loadingText),
      JSON.stringify({ lexiconLines, rendered: duringHold.loadingText }));

    await app.waitFor("!document.querySelector('.wz-splash')", { label: `S9 dismiss (${theme})`, timeout: 14000 });
    const afterFade = await app.evalJs(`(() => {
      const logo = document.querySelector('.wz-logo');
      const tagline = document.querySelector('.wz-tagline');
      const doors = document.querySelector('.wz-arrival-doors');
      return {
        splashHoldAttr: document.documentElement.getAttribute('data-splash-hold'),
        logoOpacity: logo ? getComputedStyle(logo).opacity : null,
        taglineOpacity: tagline ? getComputedStyle(tagline).opacity : null,
        doorsOpacity: doors ? getComputedStyle(doors).opacity : null,
      };
    })()`);
    ok(`S9 (${theme}): and visible again once the splash has fully left — the content faded IN as the splash faded out, never a jump cut`,
      afterFade.splashHoldAttr === null
        && afterFade.logoOpacity === '1' && parseFloat(afterFade.taglineOpacity) > 0.9 && afterFade.doorsOpacity === '1',
      JSON.stringify(afterFade));
  }

  // ==========================================================================
  // S10 — ROUND 4 (Fable's review): NO INVISIBLE CLICKS. opacity:0 never gates
  // hit-testing on its own — Write and Open must be genuinely unclickable, not
  // just unseen.
  // ==========================================================================
  await openApp(app);
  await app.waitFor("!!document.querySelector('.wz-arrival-doors')", { label: 'S10 settle' });
  const doorsState = await app.evalJs(`(() => {
    const doors = document.querySelector('.wz-arrival-doors');
    const write = document.querySelector('.wz-arrival-write');
    const r = write ? write.getBoundingClientRect() : null;
    const hit = r ? document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)) : null;
    return {
      splashHoldAttr: document.documentElement.getAttribute('data-splash-hold'),
      doorsPointerEvents: doors ? getComputedStyle(doors).pointerEvents : null,
      hitInsideDoors: !!(hit && hit.closest('.wz-arrival-doors')),
    };
  })()`);
  ok('S10 (item splash-hold round 4): the hidden Write/Open doors cannot be clicked mid-hold — pointer-events:none, confirmed by hit-testing at the Write button\'s own centre (a real press there resolves to something OUTSIDE .wz-arrival-doors, never the button)',
    doorsState.splashHoldAttr === 'true' && doorsState.doorsPointerEvents === 'none' && doorsState.hitInsideDoors === false,
    JSON.stringify(doorsState));

  // Keystrokes are unaffected (pointer-events only ever gates the mouse/touch
  // hit-test, never keydown) — re-derive S3's own claim, scoped to confirm it
  // still holds after this CSS change specifically.
  await app.evalJs(`(() => {
    window.__splashProbeS10 = [];
    window.addEventListener('keydown', (e) => { window.__splashProbeS10.push({ key: e.key, prevented: e.defaultPrevented }); });
  })()`);
  await app.typeKeys('k');
  await sleep(80);
  const probeS10 = await app.evalJs('window.__splashProbeS10 || []');
  ok('S10: keystrokes still pass through untouched — pointer-events:none on the doors changes hit-testing only, never keydown',
    Array.isArray(probeS10) && probeS10.length > 0 && probeS10.every((e) => e.prevented === false),
    JSON.stringify(probeS10));

  // ==========================================================================
  // S11 — ROUND 4 (Fable's review): THE READY CEILING. "/auth/me has no time
  // limit (api.ts), so a hung network keeps ready false indefinitely" — the
  // hold must still end, by ~10s, regardless. The force-not-ready seam (test-
  // only) stands in for the hang without actually hanging a real request.
  // ==========================================================================
  await app.emulateDpr(1, W, H);
  await app.goto('/');
  await app.evalJs(`(() => {
    localStorage.clear();
    localStorage.setItem('wrizo-first-run-complete', '1');
    localStorage.setItem('wrizo-splash-hold', '500');
    localStorage.setItem('wrizo-splash-force-not-ready', '1');
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-splash')", { label: 'S11 settle' });
  const maxHoldMs = await app.evalJs('window.wrizoSplash ? window.wrizoSplash.MAX_HOLD_MS : null');
  ok('S11 (driver): the ceiling is readable from the page seam (>= 10000ms, Fable\'s review: "/auth/me has no time limit")',
    typeof maxHoldMs === 'number' && maxHoldMs >= 10000, String(maxHoldMs));

  const s11MountedAt = Date.now();
  await sleep(1200); // well past the 500ms floor, well short of the ceiling
  const stillUpPastFloor = await app.evalJs("!!document.querySelector('.wz-splash')");
  ok('S11: with the floor long past and `ready` forced false, the splash is STILL up — readiness alone, not the floor, is what is holding it',
    stillUpPastFloor === true, String(stillUpPastFloor));

  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'S11 ceiling fires', timeout: maxHoldMs + 5000 });
  const elapsedFromMount = Date.now() - s11MountedAt;
  ok(`S11: ready held false -> gone by ~${maxHoldMs}ms anyway (Arrival's own boot bar takes over signalling "still working" from there)`,
    elapsedFromMount >= maxHoldMs - 200 && elapsedFromMount <= maxHoldMs + 2000,
    String(elapsedFromMount));

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
      firstDurationMs(rm.veil) <= 1 && firstDurationMs(rm.mark) <= 1, JSON.stringify(rm));
  }

  // ==========================================================================
  // S12 — ROUND 6 (Nick, live): THE SOLID BLOCK USES THE WRITER'S OWN THEME,
  // ARBOR BY DEFAULT, AND IT IS THERE BEFORE THE SPLASH'S FIRST PAINT — a
  // Flux writer must never see an Arbor-coloured flash.
  //
  // "Before first paint" cannot be read back from a frame that was never
  // painted, so this proves the strongest available form: the attribute and
  // the veil's own resolved colour are read at the EARLIEST moment anything
  // is observable at all (the instant `.wz-splash` exists in the DOM, polled
  // by waitFor rather than guessed at with a sleep) — if a themeless/Arbor
  // flash were reachable, THIS is the read that would catch it, since
  // nothing downstream ever re-corrects the attribute once set (store/
  // theme.ts's only two writers are initTheme() at boot and setTheme() on a
  // user action; there is no "set wrong, fix later" path to race).
  // ==========================================================================
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.goto('/');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-splash')", { label: 'S12 settle (default)' });
  const s12Default = await app.evalJs("document.documentElement.getAttribute('data-theme')");
  ok('S12: with no stored preference, the default is Arbor (\'plateau\') — the writer\'s own ground colour rule, applied correctly to the one writer who has never chosen',
    s12Default === 'plateau', String(s12Default));

  for (const theme of ['flux', 'plateau']) {
    await openAppThemed(app, theme);
    await app.waitFor("!!document.querySelector('.wz-splash')", { label: `S12 settle (${theme})` });
    const s12 = await app.evalJs(`(() => {
      const veil = document.querySelector('.wz-splash-veil');
      const groundHex = getComputedStyle(document.documentElement).getPropertyValue('--ink-950').trim();
      const n = parseInt(groundHex.replace('#', ''), 16);
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        veilBackground: veil ? getComputedStyle(veil).backgroundColor : null,
        ground: { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 },
      };
    })()`);
    const close = (a, b) => Math.abs(a - b) <= 2;
    const parsed = parseComputedColor(s12.veilBackground);
    ok(`S12 (${theme}): the attribute already names this theme the instant the splash exists — never a moment caught reading the OTHER theme first`,
      s12.theme === theme, JSON.stringify(s12));
    ok(`S12 (${theme}): and the veil's own resolved colour is already THIS theme's ground (--ink-950), not the other theme's, at that same earliest moment`,
      !!parsed && close(parsed.r, s12.ground.r) && close(parsed.g, s12.ground.g) && close(parsed.b, s12.ground.b),
      JSON.stringify({ veilBackground: s12.veilBackground, parsed, ground: s12.ground }));
  }

  // The architectural reason no flash is reachable at all: initTheme() runs
  // in main.tsx BEFORE React ever renders anything, not inside an effect
  // that could let one frame paint first (ROUND 5 paid for exactly this
  // mistake once already, with data-splash-hold). A source check, not a
  // runtime one — there is no DOM observation that could distinguish "ran
  // first" from "ran first and finished before the only frame anyone could
  // ever catch," so the ordering itself is asserted directly.
  const mainSrc = await readFile(new URL('../../src/main.tsx', import.meta.url), 'utf8');
  const initIdx = mainSrc.indexOf('initTheme()');
  const renderIdx = mainSrc.indexOf('.render(');
  ok('S12 (source): main.tsx calls initTheme() BEFORE ReactDOM...render() — the attribute lands on <html> before React mounts anything, Splash included',
    initIdx >= 0 && renderIdx >= 0 && initIdx < renderIdx,
    JSON.stringify({ initIdx, renderIdx }));
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
