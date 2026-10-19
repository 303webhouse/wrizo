// SPLASH-SWEEP — frames for Fable's review. Authored, NOT run: it needs a box
// turn. Captures, for Arbor (plateau) and Flux, 3 moments each: the sweep
// just beginning (IDEAS/the first tiles lighting, FINAL DRAFT not yet),
// mid-sweep (connectors mid-draw), and the settled end (FINAL DRAFT's own
// pop landed). 6 frames total, JPEG q80 (the evidence-commit rule: commit
// only frames asked for, compressed, never raw PNG).
//
// The moments below are timed from SplashMark.tsx's own constants (SPEED,
// Flux's literal finalAt=3230) where they are exact (Flux), and from this
// file's own estimate of the brief's stated "about 3.7s" total where they
// are not (Arbor's connector lengths depend on the real rendered geometry —
// not knowable without a browser). Compare the Arbor frames against the
// mockup artifact once captured; the moments may want retiming.
//
// Run: WS_BOX_TURN=<token> node scripts/harness/splash-sweep-capture.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'splash-sweep');
fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SPEED = 0.7;
const FLUX_FLOOR_MS = (3230 + 260 + 480 + 500) * SPEED;        // ~3129ms, exact from SplashMark.tsx's own literal constants
const ARBOR_FLOOR_MS_ESTIMATE = 3700 - 450;                     // brief: "about 3.7s" total, fade (0.45s) not part of the floor

const MOMENTS = {
  plateau: [
    { name: 'ideas-lit', at: Math.round(ARBOR_FLOOR_MS_ESTIMATE * 0.2) },
    { name: 'mid-sweep', at: Math.round(ARBOR_FLOOR_MS_ESTIMATE * 0.5) },
    { name: 'final-pop', at: Math.round(ARBOR_FLOOR_MS_ESTIMATE * 0.95) },
  ],
  flux: [
    { name: 'ideas-lit', at: 450 },
    { name: 'mid-sweep', at: Math.round(FLUX_FLOOR_MS * 0.45) },
    { name: 'final-pop', at: Math.round(FLUX_FLOOR_MS * 0.92) },
  ],
};

async function save(app, theme, moment) {
  const b64 = (await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80 })).data;
  const file = path.join(OUT, `${theme}-${moment}.jpg`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  const line = `${theme}-${moment}.jpg — captured`;
  console.log('  wrote: ' + line); // eslint-disable-line no-console
  manifest.push(line);
}

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  for (const theme of ['plateau', 'flux']) {
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-splash')", { label: `settle (${theme})` });
    const mountedAt = Date.now();
    for (const { name, at } of MOMENTS[theme]) {
      const wait = at - (Date.now() - mountedAt);
      if (wait > 0) await sleep(wait);
      await save(app, theme, name);
    }
  }
});

fs.writeFileSync(path.join(OUT, 'manifest.log.txt'), manifest.join('\n') + '\n');
console.log(`SPLASH-SWEEP CAPTURE: wrote ${manifest.length} frames to ${OUT}`); // eslint-disable-line no-console
