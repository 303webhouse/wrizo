import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--no-proxy-server'] }); const c = await b.newContext({ viewport: { width: 1366, height: 768 } }); const p = await c.newPage();
await p.goto('http://127.0.0.1:3200/'); await p.waitForTimeout(1500);
const id = await p.evaluate(() => { const bn = window.wrizoCreateBinder('The Long Winter', 'novel'); return window.wrizoCreateJournalPage({ text: 'Chapter beats', origin: null, source: 'page', projectId: bn.id, pageType: 'board', boxes: [] }).id; });
await p.evaluate((x) => { location.hash = '#/page/' + x; }, id); await p.waitForTimeout(1200);
await p.locator('.wz-beginning', { hasText: /^New Card$/ }).first().click(); await p.waitForTimeout(500);
await p.keyboard.type('The snow comes early'); await p.locator('.board-popup-foot .btn-brass').first().click(); await p.waitForTimeout(700);
const res = {};
for (const view of ['Storyboard', 'Outline']) {
  await p.locator('.board-mode-tab', { hasText: new RegExp('^' + view + '$', 'i') }).first().click(); await p.waitForTimeout(800);
  await p.evaluate(() => document.activeElement?.blur());
  const hits = []; for (let i = 0; i < 45; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(50); const w = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const t = (e.getAttribute('aria-label') || e.textContent || e.value || '').trim(); return /snow comes early/i.test(t) || /snow comes early/i.test(e.closest('[class]')?.textContent || '') && e.closest('.board-outline, [class*="outline"], [class*="story"]') ? { cls: e.className.toString().slice(0, 40), tag: e.tagName, name: t.slice(0, 30) } : null; }); if (w) hits.push(w); }
  res[view] = { reached: hits.slice(0, 4), count: hits.length };
  await p.screenshot({ path: `board-${view.toLowerCase()}.png` });
}
console.log(JSON.stringify(res, null, 1)); await b.close();
