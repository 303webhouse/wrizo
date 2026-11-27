// VISUAL 1a - THE FRAMES (the orders, "Done means"): a Page and a Board, the INK tab closed and open, at 1366 x 768, 1536 x 864 and 1920 x 1080, in Machina, Arbor and Flux, both tones.
// For frames.yml:  -f ref=visual/1-pen -f screens_file=apps/desktop/scripts/frames/visual-ink-screens.mjs -f themes=machina,plateau,flux -f widths=1366 -f screens=<the names below>
// The workflow takes only 1366 and 1920, so each screen sets its own window and carries its width in its name. Closed = the tab open on its face with Studio shut; open = Studio open, Brushes out.
import fs from 'node:fs';

const PAGE = fs.readFileSync(new URL('../harness/visual-ink/page.js', import.meta.url), 'utf8');
const PAGE3 = fs.readFileSync(new URL('../harness/visual-ink/page-1a3.js', import.meta.url), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);
const SIZES = { 1366: 768, 1536: 864, 1920: 1080 };
const WORDS = 'The morning light came in low across the table, and she began to write.\nThe coat was on the train.';

// the live defaults (reorg on, the redesigns): the driver pins them off, so the screen names its own address before it starts
const live = async (app, width) => {
  await app.emulateDpr(1, width, SIZES[width]);
  await app.evalJs("history.replaceState(null, '', '/?reorg=1#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk (live defaults)' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await app.evalJs(PAGE);
  await app.evalJs(PAGE3);
};

const page = async (app, ctx, open) => {
  await run(app, `await window.__vi3.buildPage(${JSON.stringify(ctx.theme)}, ${JSON.stringify(WORDS)}); await window.__vi.sleep(1500);
    await window.__vi3.tab('ink'); await window.__vi3.until(() => !!document.querySelector('.wz-ink-face')); await window.__vi.sleep(900);
    await window.__vi.draw([{ x: 0.2, y: 0.45 }, { x: 0.35, y: 0.5 }, { x: 0.5, y: 0.44 }, { x: 0.66, y: 0.5 }]);
    ${open ? "await window.__vi.openRow('brushes');" : 'await window.__vi.setStudio(false);'}`);
  await sleep(900);
};

const board = async (app, open) => {
  await run(app, `location.hash = '#/'; await window.__vi.sleep(700); const b = window.wrizoCreateJournalPage({ pageType: 'board', text: 'Sketch board', boxes: [] }); location.hash = '#/page/' + b.id; await window.__vi.sleep(2500);
    await window.__vi.openDrawer(); await window.__vi3.tab('ink'); await window.__vi3.until(() => !!document.querySelector('.wz-board-ink-sheet')); await window.__vi.sleep(900);
    await window.__vi3.drawOnBoard();
    ${open ? "await window.__vi.openRow('brushes');" : 'await window.__vi.setStudio(false);'}`);
  await sleep(900);
};

const screens = {};
for (const width of Object.keys(SIZES).map(Number)) {
  screens[`ink-page-closed-${width}`] = async (app, ctx) => { await live(app, width); await page(app, ctx, false); };
  screens[`ink-page-open-${width}`] = async (app, ctx) => { await live(app, width); await page(app, ctx, true); };
  screens[`ink-board-closed-${width}`] = async (app) => { await live(app, width); await board(app, false); };
  screens[`ink-board-open-${width}`] = async (app) => { await live(app, width); await board(app, true); };
}
export default screens;
