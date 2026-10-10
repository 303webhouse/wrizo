// AD HOC CAPTURE, not a persisted harness scenario -- Fable asked for a specific set of
// review screenshots (splash item 187): Plateau and Flux, desktop 1400x900 and phone
// 390x844, "splash over the front door" for all four combos, plus one frame just after
// the fade (app visible, nothing left behind). This reuses the SAME withHarness seam and
// the SAME CLASS of safety assertions scripts/harness/splash.mjs already proves (four-
// sided margin, valid PNG) -- it does not introduce any new behavior to verify, so it is
// not added to scripts/harness/ itself.
// ITEM splash-hold (Nick, live): the veil is a flat dimming tint now, never a backdrop-
// filter blur; the safety check below confirms the tint is actually painted (non-
// transparent) rather than confirming a blur that no longer exists.
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

const COMBOS = [
  { theme: 'plateau', name: 'desktop', w: 1400, h: 900 },
  { theme: 'plateau', name: 'phone', w: 390, h: 844 },
  { theme: 'flux', name: 'desktop', w: 1400, h: 900 },
  { theme: 'flux', name: 'phone', w: 390, h: 844 },
];

const results = [];

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    await app.emulateDpr(1, combo.w, combo.h);
    await app.goto('/');
    await app.evalJs(`(() => {
      localStorage.clear();
      localStorage.setItem('wrizo-first-run-complete', '1');
      localStorage.setItem('wrizo-splash-hold', '${CAPTURE_HOLD}');
      localStorage.setItem('wrizo-theme', '${combo.theme}');
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-splash-mark')", { label: `splash (${combo.theme}/${combo.name})` });
    await sleep(500);

    const state = await app.evalJs(`(() => {
      const el = document.querySelector('.wz-splash');
      const mark = document.querySelector('.wz-splash-mark');
      const veil = document.querySelector('.wz-splash-veil');
      const r = mark.getBoundingClientRect();
      return {
        leaving: el.getAttribute('data-leaving'),
        tone: el.getAttribute('data-tone'),
        theme: document.documentElement.getAttribute('data-theme'),
        complete: mark.complete && mark.naturalWidth > 0,
        rect: { x: r.left, y: r.top, w: r.width, h: r.height },
        veilBackground: getComputedStyle(veil).backgroundColor,
        vw: innerWidth, vh: innerHeight,
      };
    })()`);

    const inkW = state.rect.w * FILL_X;
    const inkH = state.rect.h * FILL_Y;
    const cx = state.rect.x + state.rect.w / 2;
    const cy = state.rect.y + state.rect.h / 2;
    const margins = { l: cx - inkW / 2, r: state.vw - (cx + inkW / 2), t: cy - inkH / 2, b: state.vh - (cy + inkH / 2) };
    const areaPct = ((inkW * inkH) / (state.vw * state.vh)) * 100;

    const veilAlpha = /^rgba\(([^)]+)\)$/.exec(state.veilBackground || '');
    const veilOpaque = veilAlpha ? parseFloat(veilAlpha[1].split(',')[3]) > 0.1 : false;

    if (state.theme !== combo.theme) throw new Error(`theme mismatch: wanted ${combo.theme}, got ${state.theme}`);
    if (state.leaving !== 'false') throw new Error(`${combo.theme}/${combo.name}: already leaving`);
    if (!state.complete) throw new Error(`${combo.theme}/${combo.name}: asset not decoded`);
    if (Math.min(margins.l, margins.r, margins.t, margins.b) <= 0) throw new Error(`${combo.theme}/${combo.name}: app not visible on all four sides`);
    if (!veilOpaque) throw new Error(`${combo.theme}/${combo.name}: the veil's dimming tint is not actually painted (${state.veilBackground})`);

    const shot = Buffer.from(await app.screenshot(), 'base64');
    const file = path.join(OUT_DIR, `splash-${combo.theme}-${combo.name}-${combo.w}x${combo.h}.png`);
    writeFileSync(file, shot);
    if (shot.length < 8 || shot.readUInt32BE(0) !== 0x89504e47) throw new Error(`${combo.theme}/${combo.name}: not a valid PNG`);
    results.push({ combo: `${combo.theme}/${combo.name}`, file, areaPct: areaPct.toFixed(1), margins: Object.fromEntries(Object.entries(margins).map(([k, v]) => [k, Math.round(v)])), bytes: shot.length, tone: state.tone });
  }

  // THE POST-FADE FRAME. Short hold (200ms), then wait past the 420ms fade; Splash.tsx's
  // own `live` state goes false on fade-end, which unmounts the overlay entirely -- this
  // is what "nothing left behind" means structurally, not just opacity:0.
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`(() => {
    localStorage.clear();
    localStorage.setItem('wrizo-first-run-complete', '1');
    localStorage.setItem('wrizo-splash-hold', '200');
    localStorage.setItem('wrizo-theme', 'plateau');
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-splash-mark')", { label: 'splash (pre-fade, post-fade combo)' });
  await sleep(1500); // 200ms hold + 420ms fade + buffer
  const gone = await app.evalJs("!document.querySelector('.wz-splash')");
  if (!gone) throw new Error('post-fade: .wz-splash is still in the DOM');
  const shot2 = Buffer.from(await app.screenshot(), 'base64');
  const file2 = path.join(OUT_DIR, 'splash-postfade-plateau-desktop-1400x900.png');
  writeFileSync(file2, shot2);
  if (shot2.length < 8 || shot2.readUInt32BE(0) !== 0x89504e47) throw new Error('post-fade: not a valid PNG');
  results.push({ combo: 'post-fade/plateau/desktop', file: file2, gone, bytes: shot2.length });
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(results, null, 2));
