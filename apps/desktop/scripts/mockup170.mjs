// ITEM 170 — THE TWO FRAMES NICK ASKED FOR, from the built branch.
// Not a harness, and deliberately NOT in scripts/harness/, so run-suite's
// auto-discovery never sees it. It renders the real product — nothing here is
// drawn or faked — so what he approves is what ships.
//   frame 1: the Page hand's "Your pages" list on a PAGE surface
//   frame 2: the same list on a BOARD, with one row's ⋯ open
// Run: node scripts/mockup170.mjs <outDirA> [outDirB]
import { writeFileSync } from 'node:fs';
import { withHarness } from './runtime-verify.mjs';

const OUTS = process.argv.slice(2).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (app, name) => {
  const buf = Buffer.from(await app.screenshot(), 'base64');
  for (const dir of OUTS) writeFileSync(`${dir}/${name}.png`, buf);
  console.log('frame', name, `(${(buf.length / 1024).toFixed(0)} KB)`);
};

// A believable desk: two Journal pages, two Loose ones, and a board to place onto.
const rows = [
  { id: 'm-a', text: 'Chapter one opening', createdAt: '2026-05-04T00:00:00.000Z', origin: 'loose' },
  { id: 'm-b', text: 'Research notes on tides', createdAt: '2026-05-03T00:00:00.000Z', origin: 'journal' },
  { id: 'm-c', text: 'Letter to the editor', createdAt: '2026-05-02T00:00:00.000Z', origin: 'journal' },
  { id: 'm-d', text: 'Loose idea about a lighthouse', createdAt: '2026-05-01T00:00:00.000Z', origin: 'loose' },
  { id: 'm-board', text: 'Story wall', createdAt: '2026-04-30T00:00:00.000Z',
    origin: 'loose', pageType: 'board', projectId: null, boxes: [] },
];

await withHarness(async (app) => {
  // DPR 2 — the frames are for a person to read, not a selector to measure.
  await app.emulateDpr(2, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.evalJs(`(() => { ${rows.map(r => `window.wrizoCreateJournalPage(${JSON.stringify(r)});`).join('\n')} })()`);
  await sleep(1600);
  await app.reload();

  // FRAME 1 — a writer is on a page and opens the Page hand.
  await app.evalJs("location.hash = '#/page/m-a'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page' });
  await sleep(700);
  await app.evalJs("document.querySelector('.wz-strip-item[data-category=\"page\"]')?.click()");
  await app.waitFor("!!document.querySelector('.wz-your-pages')", { label: 'Your pages (page surface)' });
  await sleep(500);
  await shot(app, 'item170-1-your-pages-on-a-page');

  // FRAME 2 — the same list on a board, with a row's ⋯ open. A middle row, so
  // the secondary act reads as a row-level option rather than an edge case.
  await app.evalJs("location.hash = '#/page/m-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board' });
  await sleep(800);
  if (!(await app.evalJs("!!document.querySelector('.wz-your-pages')"))) {
    await app.evalJs("document.querySelector('.wz-strip-item[data-category=\"page\"]')?.click()");
    await app.waitFor("!!document.querySelector('.wz-your-pages')", { label: 'Your pages (board)' });
  }
  await sleep(400);
  await app.evalJs("document.querySelector('.wz-your-pages-row[data-page-id=\"m-b\"] .wz-your-pages-more')?.click()");
  await app.waitFor("!!document.querySelector('.wz-your-pages-menu')", { label: 'the row menu' });
  await sleep(400);
  await shot(app, 'item170-2-place-on-this-board');
});
