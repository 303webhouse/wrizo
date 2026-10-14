// CARD RESIZE RELOCK (Nick's live test, 2026-10-13): "after a card resize, an immediate second resize or a click on the corner does
// nothing. The card stays locked until he clicks another card or double-clicks in and out."
// A real mouse makes a quick second press on the corner the SECOND CLICK OF A DOUBLE-CLICK (clickCount 2). Every press here is a
// trusted CDP mouse event; the second press carries clickCount 2, as hardware does within the double-click interval (the facade's
// mouseDown always sends 1, which is why no earlier harness could reach this). Each step records the state that could hold the
// card: an open popup, an armed thread, the selection, the handle's presence.
// Run: node scripts/harness/card-resize-relock.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CARD = '[data-box-id="crr-card"]';

const state = (app) => app.evalJs(`(() => {
  const card = document.querySelector('${CARD}'); const h = card && card.querySelector('.board-handle');
  return { w: card ? Math.round(card.getBoundingClientRect().width) : null, handle: !!h,
    popup: !!document.querySelector('.board-popup'), threadArmed: document.querySelector('.board-connections')?.dataset.threadArmed || null,
    selected: !!card && (card.classList.contains('selected') || card.getAttribute('aria-selected') === 'true' || !!h) };
})()`);
const handleAt = (app) => app.evalJs(`(() => { const h = document.querySelector('${CARD} .board-handle'); if (!h) return null;
  const r = h.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
// a real drag of the corner: press (with the click count the hardware would send), move with the button held, release
const dragCorner = async (app, dx, dy, clickCount = 1) => {
  const p = await handleAt(app);
  if (!p) return false;
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  for (let i = 1; i <= 5; i += 1) { await mouse(app, 'mouseMoved', p.x + (dx * i) / 5, p.y + (dy * i) / 5, 0, 1); await sleep(16); }
  await mouse(app, 'mouseReleased', p.x + dx, p.y + dy, clickCount, 0);
  return true;
};
const clickCorner = async (app, clickCount = 1) => {
  const p = await handleAt(app);
  if (!p) return false;
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  await mouse(app, 'mouseReleased', p.x, p.y, clickCount, 0);
  return true;
};

const freshBoard = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded below */ }
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'crr-board', text: 'Resize board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
    boxes: [{ id: 'crr-card', kind: 'text', x: 0.1, y: 0.08, w: 0.22, h: 0.14, z: 1, text: 'A card to resize' }] })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/crr-board'");
  await app.waitFor(`!!document.querySelector('${CARD}')`, { label: 'the card' });
  await sleep(500);
  // select it with a real click on its body (the handle shows on the selected card)
  const c = await app.evalJs(`(() => { const r = document.querySelector('${CARD}').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await mouse(app, 'mousePressed', c.x, c.y, 1, 1); await mouse(app, 'mouseReleased', c.x, c.y, 1, 0);
  await sleep(700);   // past the double-click interval, so the first resize's press is a FIRST click
};

await withHarness(async (app) => {
  // ---- the bug: resize, then resize again at once (the second press is the second click of a double-click)
  await freshBoard(app);
  const s0 = await state(app);
  ok('(premise) the card is selected and shows its resize handle, no popup open', s0.handle && !s0.popup, JSON.stringify(s0));
  await dragCorner(app, 60, 30, 1);
  await sleep(150);
  const s1 = await state(app);
  ok('R1 (premise): a real resize of the corner grows the card', s1.w > s0.w + 20, JSON.stringify({ before: s0.w, after: s1.w }));
  await dragCorner(app, 60, 30, 2);   // at once: the second click of a double-click
  await sleep(400);
  const s2 = await state(app);
  ok('R2 THE BUG: an IMMEDIATE second resize grows the card again (no lock)', s2.w > s1.w + 20, JSON.stringify({ before: s1.w, after: s2.w, state: s2 }));
  ok('R2: and nothing took the card - no popup opened, no thread armed, the handle is still there', !s2.popup && s2.threadArmed !== 'true' && s2.handle, JSON.stringify(s2));
  if (s2.popup) { await app.key('Escape'); await sleep(300); }

  // ---- a click on the corner right after a resize, then a resize
  await freshBoard(app);
  await dragCorner(app, 50, 20, 1);
  await sleep(150);
  const t1 = await state(app);
  await clickCorner(app, 2);           // the click lands within the double-click interval
  await sleep(400);
  const t2 = await state(app);
  ok('R3: a click on the corner right after a resize leaves the card as it was - no popup, still selected with its handle', !t2.popup && t2.handle && t2.threadArmed !== 'true', JSON.stringify(t2));
  if (t2.popup) { await app.key('Escape'); await sleep(300); }
  await sleep(600);
  await dragCorner(app, 40, 20, 1);
  await sleep(300);
  const t3 = await state(app);
  ok('R3: and the next resize works', t3.w > t1.w + 15, JSON.stringify({ before: t1.w, after: t3.w, state: t3 }));

  // ---- the control: the same immediate second resize sent as clickCount 1 (what every earlier harness sent)
  await freshBoard(app);
  await dragCorner(app, 60, 30, 1);
  await sleep(150);
  const u1 = await state(app);
  await dragCorner(app, 60, 30, 1);
  await sleep(400);
  const u2 = await state(app);
  ok('CONTROL: the same second resize WITHOUT the double-click count grows the card (the count is the variable)', u2.w > u1.w + 20 && !u2.popup, JSON.stringify({ before: u1.w, after: u2.w, state: u2 }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCARD-RESIZE-RELOCK VERIFY: PASS (${checks.length} checks)` : `\nCARD-RESIZE-RELOCK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
