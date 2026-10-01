import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3200';
const b = await chromium.launch({ args: ['--no-proxy-server'] });
const c = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p = await c.newPage();
await p.goto(BASE + '/'); await p.waitForTimeout(1500);
// local-first: no account needed for the editor
const id = await p.evaluate(() => window.wrizoCreateJournalPage({ text: 'Chapter 1\n\nThe snow came early.', origin: null, source: 'page' }).id);
await p.evaluate((x) => { location.hash = '#/page/' + x; }, id); await p.waitForSelector('.forward-only-editor'); await p.waitForTimeout(800);
const who = () => p.evaluate(() => { const e = document.activeElement; return e === document.body ? 'body' : (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 30) + ' <' + e.className.toString().slice(0, 30) + '>'; });
const out = {};
for (const mode of ['freewrite', 'draft']) {
  if (mode === 'draft') { await p.locator('.desk-mode-tab', { hasText: /draft/i }).first().click(); await p.waitForTimeout(500); }
  await p.locator('.forward-only-editor').click(); await p.keyboard.press('End');
  const r = { start: await who() };
  const t0 = await p.evaluate(() => document.querySelector('.forward-only-editor').innerText);
  await p.keyboard.press('Tab'); await p.waitForTimeout(150); r.afterTab = await who();
  r.textChangedByTab = (await p.evaluate(() => document.querySelector('.forward-only-editor').innerText)) !== t0;
  await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(150); r.afterShiftTab = await who();
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); r.afterEscape = await who();
  await p.keyboard.press('Tab'); await p.waitForTimeout(150); r.escThenTab = await who();
  await p.locator('.forward-only-editor').click(); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(150); r.escThenShiftTab = await who();
  // F6 / Ctrl+Tab style exits are browser-level; record only what the page does
  out[mode] = r;
}
console.log(JSON.stringify(out, null, 1));
await b.close();
