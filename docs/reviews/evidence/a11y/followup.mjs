import fs from 'node:fs'; import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3200';
const b = await chromium.launch({ args: ['--no-proxy-server'] });
const out = {};
const who = (p) => p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'body'; return { name: (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 30), cls: e.className.toString().slice(0, 40), tag: e.tagName, tabIndex: e.tabIndex, inDialog: !!e.closest('[role=dialog]'), inTutor: !!e.closest('.wz-tutor-zone, .wz-tutor-panel') }; });
for (const theme of ['plateau', 'flux']) {
  // phone publish dialog (local-first, no account needed)
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); await c.addInitScript((t) => localStorage.setItem('wrizo-theme', t), theme);
  const p = await c.newPage(); await p.goto(BASE + '/'); await p.waitForTimeout(1500);
  const id = await p.evaluate(() => window.wrizoCreateJournalPage({ text: 'Chapter 1\n\nThe snow came early.', origin: null, source: 'page' }).id);
  await p.evaluate((x) => { location.hash = '#/page/' + x; }, id); await p.waitForSelector('.forward-only-editor'); await p.waitForTimeout(800);
  const pub = p.locator('.mode-tab--action', { hasText: /publish|connect|relay/i }).first();
  const r = { publishButton: await pub.count() };
  await pub.focus(); r.focusBefore = await who(p); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  r.opened = !!(await p.$('[role=dialog]')); r.focusOnOpen = await who(p);
  r.tabs = []; for (let i = 0; i < 5; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(80); r.tabs.push(await who(p)); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(400); r.closedByEsc = !(await p.$('[role=dialog]'));
  await p.screenshot({ path: `followup-${theme}-phone-publish.png` });
  r.tutorOpener = await p.evaluate(() => [...document.querySelectorAll('.wz-tutor-grip, [aria-label*="Tutor" i], [title*="Tutor" i]')].map((e) => { const q = e.getBoundingClientRect(); return { name: e.getAttribute('aria-label') || e.getAttribute('title'), w: q.width, h: q.height, x: q.x }; }));
  out[theme + '-phone'] = r; await c.close();
  // desktop Tutor: Esc from inside
  const d = await b.newContext({ viewport: { width: 1366, height: 768 } }); await d.addInitScript((t) => localStorage.setItem('wrizo-theme', t), theme);
  const q = await d.newPage(); await q.goto(BASE + '/'); await q.waitForTimeout(1500);
  const id2 = await q.evaluate(() => window.wrizoCreateJournalPage({ text: 'Chapter 1\n\nThe snow came early.', origin: null, source: 'page' }).id);
  await q.evaluate((x) => { location.hash = '#/page/' + x; }, id2); await q.waitForSelector('.forward-only-editor'); await q.waitForTimeout(800);
  const t = {}; const isOpen = () => q.evaluate(() => !!document.querySelector('.wz-tutor-panel[data-open=true]'));
  await q.locator('.wz-tutor-grip').first().focus(); await q.keyboard.press('Enter'); await q.waitForTimeout(500);
  t.firstFocus = await who(q);
  t.disclosureRole = await q.evaluate(() => { const a = document.querySelector('.wz-tutor-disclosure-ack'); const dlg = a && a.closest('[role]'); return dlg ? { role: dlg.getAttribute('role'), modal: dlg.getAttribute('aria-modal'), label: dlg.getAttribute('aria-label') || dlg.getAttribute('aria-labelledby') } : null; });
  if (String(t.firstFocus.cls).includes('disclosure-ack')) { await q.keyboard.press('Enter'); await q.waitForTimeout(500); }
  t.afterAck = await who(q); t.openAfterAck = await isOpen();
  const inp = q.locator('.wz-tutor-convo-input').first(); await inp.focus(); t.inInput = await who(q);
  await q.keyboard.press('Escape'); await q.waitForTimeout(300); t.escFromInsideCloses = !(await isOpen());
  t.tutorLive = await q.evaluate(() => [...document.querySelectorAll('.wz-tutor-panel [aria-live], .wz-tutor-panel [role=log], .wz-tutor-panel [role=status]')].map((e) => e.className.toString().slice(0, 30) + ':' + (e.getAttribute('aria-live') || e.getAttribute('role'))));
  t.inputLabel = await q.evaluate(() => { const i = document.querySelector('.wz-tutor-convo-input'); return { aria: i.getAttribute('aria-label'), labelled: !!(i.labels && i.labels.length), placeholder: i.placeholder }; });
  out[theme + '-desktop-tutor'] = t; await d.close();
}
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync('followup.json', JSON.stringify(out, null, 1));
await b.close();
