import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--no-proxy-server'] }); const res = {};
for (const theme of ['plateau', 'flux']) {
  const c = await b.newContext({ viewport: { width: 1366, height: 768 } }); await c.addInitScript((t) => localStorage.setItem('wrizo-theme', t), theme); const p = await c.newPage();
  await p.goto('http://127.0.0.1:3200/'); await p.waitForTimeout(1500);
  const id = await p.evaluate(() => { const bn = window.wrizoCreateBinder('The Long Winter', 'novel'); return window.wrizoCreateJournalPage({ text: 'Chapter 1\n\nThe snow came early.', origin: null, source: 'page', projectId: bn.id, pageType: 'manuscript' }).id; });
  await p.evaluate((x) => { location.hash = '#/page/' + x; }, id); await p.waitForSelector('.desk-mode-tab'); await p.waitForTimeout(800);
  const measure = () => p.$$eval('.desk-mode-tab, .page-plan-door', (els) => els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.textContent.trim()} ${Math.round(r.width * 10) / 10}x${Math.round(r.height * 10) / 10} (${cs.fontSize})`; }));
  const now = await measure();
  // The pre-aa11f58 rules, restored for measurement only: 13px text, 9px 16px padding, 2px gap, no spread; the Plan door back to its 13px quiet style.
  await p.addStyleTag({ content: `.desk-mode-strip{gap:2px!important}.desk-mode-strip--spread{flex:initial!important;justify-content:flex-start!important}.desk-mode-tab{font-size:13px!important;padding:9px 16px!important}.sprint-nav .page-plan-door{font-size:13px!important;padding:5px 10px!important;text-transform:none!important;letter-spacing:normal!important}` });
  await p.waitForTimeout(300);
  res[theme] = { now, before: await measure() }; await c.close();
}
console.log(JSON.stringify(res, null, 1)); await b.close();
