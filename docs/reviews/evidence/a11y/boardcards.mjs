import fs from 'node:fs'; import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3200'; const AXE = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const b = await chromium.launch({ args: ['--no-proxy-server'] }); const out = {};
for (const theme of ['plateau', 'flux']) {
  const c = await b.newContext({ viewport: { width: 1366, height: 768 } }); await c.addInitScript((t) => localStorage.setItem('wrizo-theme', t), theme);
  const p = await c.newPage(); await p.goto(BASE + '/'); await p.waitForTimeout(1500);
  const board = await p.evaluate(() => { const bn = window.wrizoCreateBinder('The Long Winter', 'novel'); return window.wrizoCreateJournalPage({ text: 'Chapter beats', origin: null, source: 'page', projectId: bn.id, pageType: 'board', boxes: [] }).id; });
  await p.evaluate((x) => { location.hash = '#/page/' + x; }, board); await p.waitForTimeout(1200);
  // First card through the real UI: New Card -> type -> Escape
  await p.locator('.wz-beginning', { hasText: /^New Card$/ }).first().click(); await p.waitForTimeout(500);
  await p.keyboard.type('The snow comes early'); out.popupButtons = await p.$$eval('.board-popup button', (e) => e.map((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().slice(0, 20)));
  await p.locator('.board-popup-foot .btn-brass').first().click(); await p.waitForTimeout(700);
  // Two more, cloned from the stored shape of the first, through the seam
  await p.evaluate((id) => { const e = window.wrizoPatchEntry(id, {}); if (!e.boxes || !e.boxes.length) return 'NO BOXES'; const b0 = e.boxes[e.boxes.length - 1];
    const more = ['Mara counts the logs', 'The road is gone'].map((t, i) => ({ ...b0, id: b0.id + '-' + (i + 2), x: (b0.x || 0) + 260 * (i + 1), text: t }));
    window.wrizoPatchEntry(id, { boxes: [...e.boxes, ...more] }); }, board);
  await p.evaluate(() => { location.hash = '#/shelf'; }); await p.waitForTimeout(600); await p.evaluate((x) => { location.hash = '#/page/' + x; }, board); await p.waitForTimeout(1200);
  await p.mouse.click(1300, 740); await p.waitForTimeout(500);
  await p.screenshot({ path: `board-cards-${theme}.png` });
  await p.addScriptTag({ content: AXE });
  const ax = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n').slice(1, 2).join('').slice(0, 160)) })));
  const cards = await p.evaluate(() => [...document.querySelectorAll('.board-box')].filter((e) => e.getBoundingClientRect().width > 40).slice(0, 5).map((e) => { const r = e.getBoundingClientRect(); return { cls: e.className.toString().slice(0, 50), role: e.getAttribute('role'), tabIndex: e.tabIndex, name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), focusables: [...e.querySelectorAll('button, [tabindex], a, input, textarea, [contenteditable=true]')].map((f) => (f.getAttribute('aria-label') || f.getAttribute('title') || f.textContent || f.tagName).trim().slice(0, 18) + ':' + Math.round(f.getBoundingClientRect().width) + 'x' + Math.round(f.getBoundingClientRect().height)) }; }));
  // keyboard: can Tab reach a card, and can the keyboard open/move it?
  await p.evaluate(() => document.activeElement?.blur());
  const reached = []; for (let i = 0; i < 45; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(60); const w = await p.evaluate(() => { const e = document.activeElement; return e && e !== document.body ? { cls: e.className.toString().slice(0, 40), name: (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '').trim().slice(0, 24), inCard: !!e.closest('.board-box') } : null; }); if (w && w.inCard) reached.push(w); }
  out[theme] = { axe: ax, cards, cardStopsReachedByTab: reached.slice(0, 8), cardCount: cards.length };
  await c.close();
}
console.log(JSON.stringify(out, null, 1)); fs.writeFileSync('boardcards.json', JSON.stringify(out, null, 1)); await b.close();
