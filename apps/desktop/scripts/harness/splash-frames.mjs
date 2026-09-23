// THE SPLASH'S TWO FRAMES — for Nick to choose between.
//
// "at most 1/5 the size of the screen" has two readings, and S0 measured that
// they are 5.00x apart in area (2.24x linear):
//
//   AREA  — the emblem's ink covers a fifth of the screen's AREA. Sits exactly
//           at the ceiling by that reading; spans 37.5-45.7% of the screen's
//           WIDTH, and the handwritten labels stay readable (~10-16px).
//   WIDTH — the emblem's ink spans a fifth of the screen's WIDTH. That is a
//           twenty-fifth of the area, and the labels drop to ~5-9px, which is
//           where a hand-drawn stroke stops resolving as a word. The brief
//           predicted exactly this ("his handwritten labels become texture");
//           the arithmetic agrees, and this frame is what it looks like.
//
// BOTH FRAMES ARE RENDERED BY THE SHIPPING COMPONENT, not by a copy of it —
// via the documented frame seam in Splash.tsx (localStorage, read at module
// init so it survives the reload each render needs). A script that drew its
// own version of the emblem would be showing Nick a picture of something that
// does not exist.
//
// This is a CAPTURE pass, not a verification pass: it asserts only what it
// must to know the picture is honest (the splash is live, and at the size it
// claims), then writes the PNGs. splash.mjs is where the behaviour is proven.
//
// Run: node scripts/harness/splash-frames.mjs   (from apps/desktop, needs a
// box turn — it opens a real browser)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { withHarness } from '../runtime-verify.mjs';

const OUT_DIR = path.join(os.homedir(), 'Downloads');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A representative full screen. Both frames use the SAME viewport, because the
// whole point is to compare the two SIZES against one another — a different
// window for each would confound the comparison it exists to make.
const VIEW = { w: 1920, h: 1080 };

// Long enough that the capture never races the dismissal.
const CAPTURE_HOLD = 60000;

const INK = { w: 3077, h: 2458 };
const CANVAS = { w: 3374, h: 2699 };
const FILL_X = INK.w / CANVAS.w;
const FILL_Y = INK.h / CANVAS.h;

const notes = [];

await withHarness(async (app) => {
  for (const mode of ['area', 'width']) {
    await app.emulateDpr(1, VIEW.w, VIEW.h);
    await app.goto('/');
    // Set the seam, then RELOAD so the component reads it at module init.
    await app.evalJs(`(() => {
      localStorage.clear();
      localStorage.setItem('wrizo-first-run-complete', '1');
      localStorage.setItem('wrizo-splash-sizing', ${JSON.stringify(mode)});
      localStorage.setItem('wrizo-splash-hold', '${CAPTURE_HOLD}');
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-splash-mark')", { label: `splash (${mode})` });
    await sleep(500); // the asset decodes; a half-drawn PNG would photograph as a blank

    const state = await app.evalJs(`(() => {
      const el = document.querySelector('.wz-splash');
      const mark = document.querySelector('.wz-splash-mark');
      const veil = document.querySelector('.wz-splash-veil');
      const r = mark.getBoundingClientRect();
      return {
        leaving: el.getAttribute('data-leaving'),
        tone: el.getAttribute('data-tone'),
        src: mark.getAttribute('src'),
        complete: mark.complete && mark.naturalWidth > 0,
        rect: { w: r.width, h: r.height },
        backdrop: getComputedStyle(veil).backdropFilter || getComputedStyle(veil).webkitBackdropFilter,
        vw: innerWidth, vh: innerHeight,
      };
    })()`);

    const inkW = state.rect.w * FILL_X;
    const inkH = state.rect.h * FILL_Y;
    const areaPct = ((inkW * inkH) / (state.vw * state.vh)) * 100;
    const widthPct = (inkW / state.vw) * 100;

    // The picture must be honest about the three things it is showing: the
    // emblem is actually up, the art actually decoded, and the size is the one
    // this frame is named after. A blank or half-loaded capture that Nick
    // chose from would be worse than no frame at all.
    if (state.leaving !== 'false') throw new Error(`frame ${mode}: the splash was already leaving`);
    if (!state.complete) throw new Error(`frame ${mode}: the asset had not decoded (${state.src})`);
    const expected = mode === 'area' ? Math.abs(areaPct - 20) < 0.5 : Math.abs(widthPct - 20) < 0.5;
    if (!expected) throw new Error(`frame ${mode}: size is ${areaPct.toFixed(1)}% area / ${widthPct.toFixed(1)}% width — not the ${mode} reading`);

    const shot = await app.screenshot();
    const file = path.join(OUT_DIR, `wrizo-splash-${mode}-${VIEW.w}x${VIEW.h}.png`);
    writeFileSync(file, shot);

    notes.push({ mode, file, areaPct: areaPct.toFixed(1), widthPct: widthPct.toFixed(1),
      inkW: Math.round(inkW), inkH: Math.round(inkH), tone: state.tone, backdrop: state.backdrop,
      bytes: shot.length });
  }
});

// eslint-disable-next-line no-console
console.log('SPLASH FRAMES — both rendered by the shipping component\n');
for (const n of notes) {
  // eslint-disable-next-line no-console
  console.log(`  ${n.mode.toUpperCase().padEnd(6)} ink ${n.inkW}x${n.inkH}  =  ${n.areaPct}% of area, ${n.widthPct}% of width`);
  // eslint-disable-next-line no-console
  console.log(`         tone=${n.tone}  backdrop=${n.backdrop}  ${(n.bytes / 1024).toFixed(0)}KB`);
  // eslint-disable-next-line no-console
  console.log(`         ${n.file}\n`);
}
// eslint-disable-next-line no-console
console.log('Both at the same viewport, so the comparison is of SIZE and nothing else.');
