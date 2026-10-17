// THEME-LEFTOVERS — screenshots for Chat 1 (Fable, Oct 16). Authored, NOT
// run: it needs a box turn.
//
// Three frames:
//   flux-loose-page      a loose page under Flux, unframed (<1100px, so
//                         DeskRail + body's own backdrop show) — the lamp-glow
//                         fix's own subject. There is no code-level "before"
//                         to capture alongside it (the fix is a token value,
//                         not a toggle); production today is the before.
//   flux-light-freewrite-ink   Free Write, Flux theme, light page — the
//                         default pen ink, now Flux's own #14231F.
//   arbor-font-heading    the Sliver's type section open on Arbor (Draft,
//                         framed) — the heading now reads "Font".
//
// Run: WS_BOX_TURN=<token> node scripts/harness/theme-leftovers-capture.mjs   (from apps/desktop, dist-web freshly built)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'theme-leftovers');
fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function save(app, name) {
  const b64 = (await app.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80 })).data;
  const file = path.join(OUT, `${name}.jpg`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  const line = `${name}.jpg — captured`;
  console.log('  wrote: ' + line); // eslint-disable-line no-console
  manifest.push(line);
}

await withHarness(async (app) => {
  // ---- flux-loose-page: unframed, so the body backdrop (lamp-glow) and
  // DeskRail both show around the page. ---------------------------------
  await app.emulateDpr(1, 900, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', 'flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk, for seeding' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tl-flux-page', text: 'A loose page under Flux.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await sleep(300);
  await app.evalJs("location.hash = '#/page/tl-flux-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' });
  await sleep(500);
  await save(app, 'flux-loose-page');

  // ---- flux-light-freewrite-ink: Free Write, Flux, light page — the
  // default pen ink's own colour. ----------------------------------------
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'light', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk, for seeding (2)' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tl-flux-ink', text: 'Free Write, Flux light — this line should read in Flux\'s own ink.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await sleep(300);
  await app.evalJs("location.hash = '#/page/tl-flux-ink'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' });
  await sleep(500);
  await save(app, 'flux-light-freewrite-ink');

  // ---- arbor-font-heading: Draft, framed (>=1100px), Sliver's type
  // section open — the heading itself, now "Font" on Arbor. ---------------
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk, for seeding (3)' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tl-arbor-font', text: 'A page to open in Draft.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await sleep(300);
  await app.evalJs("location.hash = '#/page/tl-arbor-font'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' });
  await sleep(500);
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft')?.click()");
  await sleep(400);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(400);
  await save(app, 'arbor-font-heading');
});

fs.writeFileSync(path.join(OUT, 'manifest.log.txt'), manifest.join('\n') + '\n');
console.log(`THEME-LEFTOVERS CAPTURE: wrote ${manifest.length} frames to ${OUT}`); // eslint-disable-line no-console
