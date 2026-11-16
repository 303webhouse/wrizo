// BUG #103 (carry for the Wrizors, Fable Nov 15): on Machina's LIGHT page the OPEN card is cream while the card on the board is white. Two FRAMES (not a check; it passes nothing): the open card's pop-up, and the board with the same card in place, in the audit's theme and Page tone (env WA_THEME, WA_TONE), plus the two backgrounds read from the browser.
// Pictures: WA_OUT/shots/<theme>-<tone>-open-card.png and -board-card.png. One line: `FRAMES103 {json}`. Run: on Actions via writing-audit.yml, script=frames-103.mjs, configs machina/off/light/1366 (and dark for reference); the pictures are in the run's artifact.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'machina', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const shotDir = cfg.out ? path.join(cfg.out, 'shots') : null;
if (shotDir) mkdirSync(shotDir, { recursive: true });
const save = (name, b64) => { if (shotDir) writeFileSync(path.join(shotDir, `${cfg.theme}-${cfg.tone}-${name}.png`), Buffer.from(b64, 'base64')); };

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  await d.boot();
  await d.openCard('Hello world, the words on this card must read.');
  await sleep(500);
  const bgs = (sel) => d.ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const c = getComputedStyle(e); return { bg: c.backgroundColor, color: c.color }; })()`);
  const open = await bgs('.board-popup');
  const words = await bgs('.board-popup-editor');
  save('open-card', (await app.cdp('Page.captureScreenshot', { format: 'png' })).data);
  // close the pop-up with its own X, then the board shows the same card
  await d.ev(`document.querySelector('.board-popup-close').click()`);
  await sleep(900);
  const board = await d.ev(`(() => { const e = document.querySelector('[data-box-id="wa-card"]'); if (!e) return null; const c = getComputedStyle(e); return { bg: c.backgroundColor, color: c.color }; })()`);
  save('board-card', (await app.cdp('Page.captureScreenshot', { format: 'png' })).data);
  console.log(`FRAMES103 ${JSON.stringify({ theme: cfg.theme, tone: cfg.tone, openCardBg: open && open.bg, openWords: words && words.color, boardCardBg: board && board.bg, boardCardInk: board && board.color })}`);
});
