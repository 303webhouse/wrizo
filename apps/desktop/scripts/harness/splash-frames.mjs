// THE SPLASH'S ONE FRAME (item 187) — for the COMPOSITING CHECK.
//
// The earlier two-frame pass (area vs width, for Nick to choose between) is
// WITHDRAWN: he was not picky about the size, so there is nothing to pick
// (Fable, 2026-09-23). What remains is ONE frame of the shipping build, to see
// with eyes what splash.mjs can only measure: that the backdrop-filter — the
// first in this stylesheet — actually composites (the app soft behind, the
// emblem sharp on top) and that the blurred app shows on all four sides.
//
// The frame is rendered by THE SHIPPING COMPONENT, not a copy of it. The hold
// override (localStorage, read at call time) keeps the emblem up long enough
// to photograph it instead of racing the dismissal timer.
//
// This is a CAPTURE pass, not a verification pass: it asserts only what it
// must to know the picture is honest (splash live, art decoded, four-sided
// margin real), then writes the PNG. splash.mjs is where behaviour is proven.
//
// Run: node scripts/harness/splash-frames.mjs   (from apps/desktop; needs a box
// turn — it opens a real browser)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { withHarness } from '../runtime-verify.mjs';

const OUT_DIR = path.join(os.homedir(), 'Downloads');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEW = { w: 1920, h: 1080 };
const CAPTURE_HOLD = 60000;

const INK = { w: 3077, h: 2458 };
const CANVAS = { w: 3374, h: 2699 };
const FILL_X = INK.w / CANVAS.w;
const FILL_Y = INK.h / CANVAS.h;

let note;

await withHarness(async (app) => {
  await app.emulateDpr(1, VIEW.w, VIEW.h);
  await app.goto('/');
  await app.evalJs(`(() => {
    localStorage.clear();
    localStorage.setItem('wrizo-first-run-complete', '1');
    localStorage.setItem('wrizo-splash-hold', '${CAPTURE_HOLD}');
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-splash-mark')", { label: 'splash' });
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
      rect: { x: r.left, y: r.top, w: r.width, h: r.height },
      backdrop: getComputedStyle(veil).backdropFilter || getComputedStyle(veil).webkitBackdropFilter,
      vw: innerWidth, vh: innerHeight,
    };
  })()`);

  const inkW = state.rect.w * FILL_X;
  const inkH = state.rect.h * FILL_Y;
  const cx = state.rect.x + state.rect.w / 2;
  const cy = state.rect.y + state.rect.h / 2;
  const margins = { l: cx - inkW / 2, r: state.vw - (cx + inkW / 2), t: cy - inkH / 2, b: state.vh - (cy + inkH / 2) };
  const widthPct = (inkW / state.vw) * 100;

  if (state.leaving !== 'false') throw new Error('frame: the splash was already leaving');
  if (!state.complete) throw new Error(`frame: the asset had not decoded (${state.src})`);
  const areaPct = ((inkW * inkH) / (state.vw * state.vh)) * 100;
  if (areaPct < 22 || areaPct > 28) throw new Error(`frame: ink is ${areaPct.toFixed(1)}% of area - outside the band around a quarter`);
  if (!/blur\(/.test(state.backdrop || '')) throw new Error(`frame: no backdrop blur is computed (${state.backdrop})`);
  if (Math.min(margins.l, margins.r, margins.t, margins.b) <= 0) throw new Error('frame: the app does not show on all four sides');

  // `app.screenshot()` returns BASE64 TEXT (CDP's Page.captureScreenshot `data`), not bytes: writing it
  // as-is would leave a text file named .png that no viewer opens. Decode first.
  const shot = Buffer.from(await app.screenshot(), 'base64');
  const file = path.join(OUT_DIR, `wrizo-splash-${VIEW.w}x${VIEW.h}.png`);
  writeFileSync(file, shot);
  if (shot.length < 8 || shot.readUInt32BE(0) !== 0x89504e47) throw new Error('frame: the captured bytes are not a PNG');
  note = { file, widthPct: widthPct.toFixed(1), areaPct: areaPct.toFixed(1), inkW: Math.round(inkW), inkH: Math.round(inkH),
    margins: Object.fromEntries(Object.entries(margins).map(([k, v]) => [k, Math.round(v)])),
    tone: state.tone, backdrop: state.backdrop, bytes: shot.length };
});

// eslint-disable-next-line no-console
console.log('SPLASH FRAME — rendered by the shipping component\n');
// eslint-disable-next-line no-console
console.log(`  ink ${note.inkW}x${note.inkH} = ${note.widthPct}% of width, ${note.areaPct}% of area; margins ${JSON.stringify(note.margins)}`);
// eslint-disable-next-line no-console
console.log(`  tone=${note.tone}  backdrop=${note.backdrop}  ${(note.bytes / 1024).toFixed(0)}KB`);
// eslint-disable-next-line no-console
console.log(`  ${note.file}`);
