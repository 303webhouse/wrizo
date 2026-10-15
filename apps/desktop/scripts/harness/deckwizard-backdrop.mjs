// DECKWIZARD BACKDROP (Fable, 2026-10-15): "the DeckWizard (board 'Templates') backdrop doesn't cover the rail - same portal-on-body +
// full backdrop fix as the card pop-up." The card pop-up's own finding (card-close-x X7): a fixed backdrop rendered inside
// `.desk-frame-stage` ranks only inside that stage's stacking context (isolation:isolate), so the fixed rail (`.desk-frame-strip`,
// z-index 1 in the ROOT context) paints over it and takes clicks meant for the backdrop. Per theme (Plateau, Flux): the wizard is
// opened from the board's own "From a deck…" tool, then two points are probed with elementFromPoint and REALLY clicked (trusted CDP
// mouse events) - one on the open backdrop clear of all chrome, one at the centre of the rail. Each must hit the backdrop, and the
// click must only close the wizard: the address and the board's cards unchanged. A missing control is a failed check, never a crash.
// Run: node scripts/harness/deckwizard-backdrop.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const click = async (app, p) => {
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, 1, 1);
  await mouse(app, 'mouseReleased', p.x, p.y, 1, 0);
};

const freshBoard = async (app, theme) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the theme premise below still records */ }
  if (theme === 'flux') { await app.evalJs("window.wrizoTheme.set('flux')"); await sleep(200); }
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'dwb-board', text: 'Deck board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
    boxes: [{ id: 'dwb-card', kind: 'text', x: 0.1, y: 0.08, w: 0.22, h: 0.14, z: 1, text: 'A card on the board' }] })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/dwb-board'");
  await app.waitFor("!!document.querySelector('[data-box-id=\"dwb-card\"]')", { label: 'the board' });
  await sleep(600);
};

// the board's own "From a deck…" tool (b3.mjs's door 2); opening is not this file's subject, so the tool is pressed as b3 presses it
const openWizard = async (app) => {
  const pressed = await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-sliver-item-btn')].find(x => x.textContent.trim() === 'From a deck…'); if (!b) return false; b.click(); return true; })()");
  if (!pressed) return false;
  try { await app.waitFor("!!document.querySelector('.deck-wizard-backdrop')", { label: 'deck wizard open', timeout: 4000 }); } catch { return false; }
  await sleep(250);
  return true;
};

const snapshot = (app) => app.evalJs("({ hash: location.hash, cards: document.querySelectorAll('.board-box').length, wizard: !!document.querySelector('.deck-wizard-backdrop') })");

await withHarness(async (app) => {
  for (const theme of ['plateau', 'flux']) {
    const T = `[${theme}]`;
    await freshBoard(app, theme);
    const themeNow = await app.evalJs("document.documentElement.getAttribute('data-theme') || 'plateau'");
    ok(`${T} (premise) the board is in the ${theme} theme`, themeNow === theme, String(themeNow));
    for (const where of ['backdrop', 'rail']) {
      const opened = await openWizard(app);
      const pt = opened ? await app.evalJs(`(() => {
        if (${JSON.stringify(where)} === 'rail') { const r = document.querySelector('.desk-frame-strip')?.getBoundingClientRect();
          return r && r.width > 0 ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; }
        return { x: Math.round(innerWidth / 2), y: innerHeight - 24 };
      })()`) : null;
      const before = await snapshot(app);
      const hit = pt ? await app.evalJs(`(() => { const e = document.elementFromPoint(${pt.x}, ${pt.y}); return e ? (e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName) : null; })()`) : null;
      if (pt) await click(app, pt);
      await sleep(400);
      const after = await snapshot(app);
      ok(`${T} (${where}): a click ${where === 'rail' ? 'at the centre of the rail' : 'on the open backdrop'} hits the deck wizard's backdrop and only closes the wizard - same address, same cards`,
        opened && !!pt && hit === 'deck-wizard-backdrop' && after.wizard === false && after.hash === before.hash && after.cards === before.cards,
        JSON.stringify({ opened, pt, hit, before, after }));
      if (after.wizard) { await app.key('Escape'); await sleep(300); }
      if (await app.evalJs("!!document.querySelector('.deck-wizard-backdrop')")) { await app.evalJs("document.querySelector('.deck-wizard-close')?.click()"); await sleep(300); }
      await sleep(300);
    }
    // the wizard's own close (X) still closes it - the portal moves where it renders, nothing about how it is dismissed
    const opened2 = await openWizard(app);
    const x = opened2 ? await app.evalJs("(() => { const b = document.querySelector('.deck-wizard-close'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()") : null;
    if (x) await click(app, x);
    await sleep(400);
    const afterX = await snapshot(app);
    ok(`${T} the wizard's own X still closes it`, opened2 && !!x && afterX.wizard === false, JSON.stringify({ opened2, x, afterX }));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nDECKWIZARD-BACKDROP VERIFY: PASS (${checks.length} checks)` : `\nDECKWIZARD-BACKDROP VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
