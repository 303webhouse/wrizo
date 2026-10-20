// HELP-BUTTONS x PAGE-TEMPLATES-R2 — one frame per theme of the five-row
// Templates picker with its "?"s placed (Fable, Oct 18). Authored, NOT run:
// it needs a box turn.
//
// Arbor's own five words (Blank/Screenplay/Outline/Title Page/Bibliography)
// are the CANONICAL baseline — none renamed, so the Arbor frame shows ZERO
// "?"s. Flux renames every one of them (Raw/Script/Spine/Cover/Sources), so
// the Flux frame shows all five. Both frames are the expected, correct
// result of the same rule, not a partial capture.
//
// Run: WS_BOX_TURN=<token> node scripts/harness/templates-picker-capture.mjs   (from apps/desktop, dist-web freshly built)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'templates-picker');
fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function save(app, theme) {
  const b64 = (await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80 })).data;
  const file = path.join(OUT, `${theme}-templates-picker.jpg`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  const line = `${theme}-templates-picker.jpg — captured`;
  console.log('  wrote: ' + line); // eslint-disable-line no-console
  manifest.push(line);
}

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  for (const theme of ['plateau', 'flux']) {
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk (${theme})` });
    // FIX (Fable, Oct 18-19) — .wz-splash and .wz-arrival coexist in the DOM
    // (the splash is an overlay; Arrival's own content is only HIDDEN behind
    // it, via data-splash-hold, never unmounted) — waiting for .wz-arrival
    // alone proves nothing about whether the splash has actually cleared.
    // Without this, the capture could seed/navigate/screenshot while the
    // hold is still up. Same timeout page-templates-r2.mjs's own fresh()
    // uses (MAX_HOLD_MS=10000 + buffer).
    await app.waitFor("!document.querySelector('.wz-splash')", { label: `splash gone (${theme})`, timeout: 14000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `tpc-${theme}`, text: 'A page for the Templates picker frame.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
    await sleep(300);
    await app.evalJs(`location.hash = '#/page/tpc-${theme}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the page (${theme})` });
    await sleep(300);
    await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft')?.click()");
    await sleep(300);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(400);
    await app.waitFor("!!document.querySelector('.wz-sliver-templates')", { label: `Templates section (${theme})` });
    await app.evalJs("document.querySelector('.wz-sliver-templates')?.scrollIntoView({ block: 'center' })");
    await sleep(200);
    await save(app, theme);
  }
});

fs.writeFileSync(path.join(OUT, 'manifest.log.txt'), manifest.join('\n') + '\n');
console.log(`TEMPLATES-PICKER CAPTURE: wrote ${manifest.length} frames to ${OUT}`); // eslint-disable-line no-console
