// AD HOC CAPTURE, not a persisted harness scenario -- Fable asked for a specific set of
// review screenshots (splash item 187): Plateau and Flux, desktop 1400x900 and phone
// 390x844, mid-hold ("no ghost" -- the front door hidden, the loading line showing) AND
// just after the fade (the front door visible again, nothing left behind) for all four
// combos -- eight frames. This reuses the SAME withHarness seam and the SAME CLASS of
// safety assertions scripts/harness/splash.mjs already proves (four-sided margin, valid
// PNG, the veil's tint actually painted) -- it does not introduce any new behavior to
// verify, so it is not added to scripts/harness/ itself.
// ITEM splash-hold ROUND 3: ALL EIGHT frames now exist per combo (mid-hold + after-fade),
// replacing round 2's asymmetric four-mid-hold-plus-one-post-fade shape.
// Run: node scripts/splash-frames-batch.mjs   (from apps/desktop, dist-web freshly
// built; needs a box turn -- it opens a real browser).
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { withHarness } from './runtime-verify.mjs';

const OUT_DIR = path.join(os.homedir(), 'Downloads', 'splash-187-frames');
mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const INK = { w: 3077, h: 2458 };
const CANVAS = { w: 3374, h: 2699 };
const FILL_X = INK.w / CANVAS.w;
const FILL_Y = INK.h / CANVAS.h;
const CAPTURE_HOLD = 60000;
const FAST_HOLD = 200; // for the after-fade shot: short hold, then wait past the fade

const COMBOS = [
  { theme: 'plateau', name: 'desktop', w: 1400, h: 900 },
  { theme: 'plateau', name: 'phone', w: 390, h: 844 },
  { theme: 'flux', name: 'desktop', w: 1400, h: 900 },
  { theme: 'flux', name: 'phone', w: 390, h: 844 },
];

// ITEM splash-hold round 2: getComputedStyle resolving a color-mix() does not always
// normalize to rgb()/rgba() -- some engines report the modern `color(srgb r g b / a)`
// form instead, whose alpha is still the last term (0..1), introduced by '/' rather
// than a fourth comma-separated value.
function veilAlphaOf(veilBackground) {
  const s = veilBackground || '';
  const rgba = /^rgba?\(([^)]+)\)$/.exec(s);
  if (rgba) return parseFloat(rgba[1].split(',')[3] ?? '1');
  const color = /^color\(srgb[^)]*\/\s*([\d.eE+-]+)\)$/.exec(s);
  return color ? parseFloat(color[1]) : NaN;
}

const results = [];

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    // --- MID-HOLD: the splash over the front door, "no ghost". ---------------------
    await app.emulateDpr(1, combo.w, combo.h);
    await app.goto('/');
    await app.evalJs(`(() => {
      localStorage.clear();
      localStorage.setItem('wrizo-first-run-complete', '1');
      localStorage.setItem('wrizo-splash-hold', '${CAPTURE_HOLD}');
      localStorage.setItem('wrizo-theme', '${combo.theme}');
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-splash-mark')", { label: `splash mid-hold (${combo.theme}/${combo.name})` });
    await sleep(500);

    const state = await app.evalJs(`(() => {
      const el = document.querySelector('.wz-splash');
      const mark = document.querySelector('.wz-splash-mark');
      const veil = document.querySelector('.wz-splash-veil');
      const logo = document.querySelector('.wz-logo');
      const tagline = document.querySelector('.wz-tagline');
      const doors = document.querySelector('.wz-arrival-doors');
      const r = mark.getBoundingClientRect();
      return {
        leaving: el.getAttribute('data-leaving'),
        tone: el.getAttribute('data-tone'),
        theme: document.documentElement.getAttribute('data-theme'),
        splashHoldAttr: document.documentElement.getAttribute('data-splash-hold'),
        // splash-sweep: the mark is SplashMark's own per-theme SVG now, not a
        // single decoded <img> — "complete" means the right theme's root
        // actually mounted inside it.
        complete: !!mark.querySelector('.wz-splash-arbor, .wz-splash-flux'),
        rect: { x: r.left, y: r.top, w: r.width, h: r.height },
        veilBackground: getComputedStyle(veil).backgroundColor,
        logoOpacity: logo ? getComputedStyle(logo).opacity : null,
        taglineOpacity: tagline ? getComputedStyle(tagline).opacity : null,
        doorsOpacity: doors ? getComputedStyle(doors).opacity : null,
        vw: innerWidth, vh: innerHeight,
      };
    })()`);

    const inkW = state.rect.w * FILL_X;
    const inkH = state.rect.h * FILL_Y;
    const cx = state.rect.x + state.rect.w / 2;
    const cy = state.rect.y + state.rect.h / 2;
    const margins = { l: cx - inkW / 2, r: state.vw - (cx + inkW / 2), t: cy - inkH / 2, b: state.vh - (cy + inkH / 2) };
    const areaPct = ((inkW * inkH) / (state.vw * state.vh)) * 100;
    const veilAlpha = veilAlphaOf(state.veilBackground);

    if (state.theme !== combo.theme) throw new Error(`theme mismatch: wanted ${combo.theme}, got ${state.theme}`);
    if (state.leaving !== 'false') throw new Error(`${combo.theme}/${combo.name}: already leaving`);
    if (!state.complete) throw new Error(`${combo.theme}/${combo.name}: asset not decoded`);
    if (Math.min(margins.l, margins.r, margins.t, margins.b) <= 0) throw new Error(`${combo.theme}/${combo.name}: app not visible on all four sides`);
    if (!(veilAlpha > 0.1)) throw new Error(`${combo.theme}/${combo.name}: the veil's dimming tint is not actually painted (${state.veilBackground})`);
    if (state.splashHoldAttr !== 'true' || state.logoOpacity !== '0' || state.taglineOpacity !== '0' || state.doorsOpacity !== '0') {
      throw new Error(`${combo.theme}/${combo.name}: "no ghost" failed -- the front door is not actually hidden (${JSON.stringify(state)})`);
    }

    const shot = Buffer.from(await app.screenshot(), 'base64');
    const file = path.join(OUT_DIR, `splash-${combo.theme}-${combo.name}-${combo.w}x${combo.h}-midhold.png`);
    writeFileSync(file, shot);
    if (shot.length < 8 || shot.readUInt32BE(0) !== 0x89504e47) throw new Error(`${combo.theme}/${combo.name}: not a valid PNG`);
    results.push({ combo: `${combo.theme}/${combo.name}/midhold`, file, areaPct: areaPct.toFixed(1), veilAlpha, margins: Object.fromEntries(Object.entries(margins).map(([k, v]) => [k, Math.round(v)])), bytes: shot.length, tone: state.tone });

    // --- AFTER-FADE: short hold, wait past it, the front door visible again. -------
    await app.emulateDpr(1, combo.w, combo.h);
    await app.goto('/');
    await app.evalJs(`(() => {
      localStorage.clear();
      localStorage.setItem('wrizo-first-run-complete', '1');
      localStorage.setItem('wrizo-splash-hold', '${FAST_HOLD}');
      localStorage.setItem('wrizo-theme', '${combo.theme}');
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-splash-mark')", { label: `splash pre-fade (${combo.theme}/${combo.name})` });
    await sleep(FAST_HOLD + 490 + 300); // hold + the .45s fade (CSS, splash-sweep) + buffer

    const after = await app.evalJs(`(() => {
      const logo = document.querySelector('.wz-logo');
      const tagline = document.querySelector('.wz-tagline');
      const doors = document.querySelector('.wz-arrival-doors');
      return {
        gone: !document.querySelector('.wz-splash'),
        splashHoldAttr: document.documentElement.getAttribute('data-splash-hold'),
        logoOpacity: logo ? getComputedStyle(logo).opacity : null,
        taglineOpacity: tagline ? getComputedStyle(tagline).opacity : null,
        doorsOpacity: doors ? getComputedStyle(doors).opacity : null,
      };
    })()`);
    if (!after.gone) throw new Error(`${combo.theme}/${combo.name}: after-fade -- .wz-splash is still in the DOM`);
    if (after.splashHoldAttr !== null || after.logoOpacity !== '1' || !(parseFloat(after.taglineOpacity) > 0.9) || after.doorsOpacity !== '1') {
      throw new Error(`${combo.theme}/${combo.name}: after-fade -- the front door did not come back (${JSON.stringify(after)})`);
    }

    const shot2 = Buffer.from(await app.screenshot(), 'base64');
    const file2 = path.join(OUT_DIR, `splash-${combo.theme}-${combo.name}-${combo.w}x${combo.h}-afterfade.png`);
    writeFileSync(file2, shot2);
    if (shot2.length < 8 || shot2.readUInt32BE(0) !== 0x89504e47) throw new Error(`${combo.theme}/${combo.name}: after-fade not a valid PNG`);
    results.push({ combo: `${combo.theme}/${combo.name}/afterfade`, file: file2, bytes: shot2.length });
  }
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(results, null, 2));
