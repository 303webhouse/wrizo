// CARD CLOSE X (Nick's live test, 2026-10-13; Fable's brief): "replace the pop-up's 'Close' button with an 'X' in its top-right
// corner, in both themes. Esc and click-outside behave as today. Give the X an accessible label."
// Every press is a trusted CDP mouse event (the popup opens on a real double-click, the X and the backdrop are really clicked), and
// the whole walk runs once per theme (Plateau, then Flux). A missing X is RECORDED as a failed check, never a crash, so the
// red-first run on main reports every check.
// Run: node scripts/harness/card-close-x.mjs   (from apps/desktop, dist-web built, box turn granted)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

// CCX_FRAMES=<dir>: also save one frame per theme of the open pop-up (for review; no check reads them).
const FRAMES = process.env.CCX_FRAMES || null;

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CARD = '[data-box-id="ccx-card"]';
const X = '.board-popup .board-popup-close';

const mouse = (app, type, x, y, clickCount, buttons) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount, pointerType: 'mouse' });
const click = async (app, p, clickCount = 1) => {
  await mouse(app, 'mouseMoved', p.x, p.y, 0, 0);
  await mouse(app, 'mousePressed', p.x, p.y, clickCount, 1);
  await mouse(app, 'mouseReleased', p.x, p.y, clickCount, 0);
};
const centerOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const popupOpen = (app) => app.evalJs("!!document.querySelector('.board-popup')");
const closedState = (app) => app.evalJs(`(() => ({
  popupGone: !document.querySelector('.board-popup'),
  blurGone: !document.querySelector('.board-canvas-blur-wrap')?.classList.contains('board-canvas-blurred'),
  text: (window.wrizoBoard() || []).find(b => b.id === 'ccx-card')?.text ?? null,
}))()`);

// a real double-click on the card's body: the first click, then the second click of a double-click
const openPopup = async (app) => {
  const c = await centerOf(app, CARD);
  if (!c) return false;
  await click(app, c, 1);
  await sleep(60);
  await click(app, c, 2);
  try { await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'card popup open', timeout: 4000 }); } catch { return false; }
  await sleep(250);
  return true;
};

const freshBoard = async (app, theme) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the theme premise below still records */ }
  if (theme === 'flux') { await app.evalJs("window.wrizoTheme.set('flux')"); await sleep(200); }
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'ccx-board', text: 'Close board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
    boxes: [{ id: 'ccx-card', kind: 'text', x: 0.1, y: 0.08, w: 0.22, h: 0.14, z: 1, text: 'A card to close' }] })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/ccx-board'");
  await app.waitFor(`!!document.querySelector('${CARD}')`, { label: 'the card' });
  await sleep(600);
};

await withHarness(async (app) => {
  for (const theme of ['plateau', 'flux']) {
    const T = `[${theme}]`;
    await freshBoard(app, theme);
    const themeNow = await app.evalJs("document.documentElement.getAttribute('data-theme') || 'plateau'");
    ok(`${T} (premise) the board is in the ${theme} theme`, themeNow === theme, String(themeNow));
    const opened = await openPopup(app);
    ok(`${T} (premise) a real double-click on the card opens its pop-up`, opened);
    if (!opened) continue;
    if (FRAMES) { mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `card-close-x-${theme}.png`), Buffer.from(await app.screenshot(), 'base64')); }

    // X1 - the X is the close control: one button named "Close", showing an X glyph, and no "Close" button left in a foot
    const shape = await app.evalJs(`(() => {
      const pop = document.querySelector('.board-popup'); const x = document.querySelector(${JSON.stringify(X)});
      const named = [...pop.querySelectorAll('button')].filter(b => b.getAttribute('aria-label') === 'Close');
      const glyph = x ? x.querySelector('[aria-hidden="true"]') : null;
      return { x: !!x, ariaLabel: x?.getAttribute('aria-label') ?? null, title: x?.getAttribute('title') ?? null, shown: x ? x.textContent.trim() : null,
        glyphHidden: !!glyph && glyph.textContent.trim() === '\\u00d7', namedClose: named.length, isX: named[0] === x,
        textClose: [...pop.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Close').length,
        foot: !!pop.querySelector('.board-popup-foot') };
    })()`);
    ok(`${T} X1: the pop-up's close control is an X named "Close" for assistive tech (aria-label + title; the glyph itself aria-hidden)`,
      shape.x && shape.ariaLabel === 'Close' && shape.title === 'Close' && shape.shown === '×' && shape.glyphHidden && shape.namedClose === 1 && shape.isX, JSON.stringify(shape));
    ok(`${T} X1: the "Close" text button is gone - no button reads "Close", and the foot that held it is gone`, shape.textClose === 0 && shape.foot === false, JSON.stringify(shape));

    // X2 - top-right corner: inside the card's rect, hard against its top and right edges, and nothing covers it
    const place = await app.evalJs(`(() => {
      const pop = document.querySelector('.board-popup'); const x = document.querySelector(${JSON.stringify(X)}); if (!x) return null;
      const p = pop.getBoundingClientRect(), r = x.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { right: Math.round(p.right - r.right), top: Math.round(r.top - p.top), inside: r.left >= p.left && r.right <= p.right && r.top >= p.top && r.bottom <= p.bottom,
        upperRight: r.left > p.left + p.width / 2 && r.bottom < p.top + p.height / 2, w: Math.round(r.width), h: Math.round(r.height),
        onTop: !!hit && !!hit.closest('.board-popup-close') };
    })()`);
    ok(`${T} X2: the X sits in the pop-up's top-right corner (inside the card, within 16px of its top and right edges, upper-right quadrant, not covered)`,
      !!place && place.inside && place.upperRight && place.right >= 0 && place.right <= 16 && place.top >= 0 && place.top <= 16 && place.onTop, JSON.stringify(place));
    ok(`${T} X2: the X is a real target (at least 24x24 px)`, !!place && place.w >= 24 && place.h >= 24, JSON.stringify(place));

    // X3 - in this theme's own card ink: the X paints in --ink-on-paper-low, which is not the card's background
    const paint = await app.evalJs(`(() => {
      const pop = document.querySelector('.board-popup'); const x = document.querySelector(${JSON.stringify(X)}); if (!x) return null;
      const probe = document.createElement('span'); probe.style.color = 'var(--ink-on-paper-low)'; pop.appendChild(probe);
      const token = getComputedStyle(probe).color; probe.remove();
      return { x: getComputedStyle(x).color, token, card: getComputedStyle(pop).backgroundColor };
    })()`);
    ok(`${T} X3: the X paints in the theme's card ink (--ink-on-paper-low), never the card's own background`,
      !!paint && paint.x === paint.token && paint.x !== paint.card, JSON.stringify(paint));

    // X4 - a real click on the X closes the pop-up, un-blurs the board, and commits the edit (what the old Close did)
    await app.evalJs(`(() => { const el = document.querySelector('.board-popup-editor'); el.focus();
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    await app.typeKeys(' edited');
    await sleep(200);
    const xc = await centerOf(app, X);
    if (xc) await click(app, xc, 1);
    await sleep(400);
    const afterX = await closedState(app);
    ok(`${T} X4: a real click on the X closes the pop-up, un-blurs the board, and commits the edit`,
      !!xc && afterX.popupGone && afterX.blurGone && typeof afterX.text === 'string' && afterX.text.includes('edited') && afterX.text.includes('A card to close'),
      JSON.stringify({ clicked: !!xc, ...afterX }));
    if (!afterX.popupGone) { await app.key('Escape'); await sleep(300); }

    // X5 - Esc closes, as today
    await sleep(600);
    const opened2 = await openPopup(app);
    if (opened2) { await app.key('Escape'); await sleep(400); }
    const afterEsc = await closedState(app);
    ok(`${T} X5: Esc still closes the pop-up and un-blurs the board`, opened2 && afterEsc.popupGone && afterEsc.blurGone, JSON.stringify({ opened2, ...afterEsc }));

    // X6 - a click outside the card (on the backdrop) closes, as today
    await sleep(600);
    const opened3 = await openPopup(app);
    const outside = { x: 24, y: 450 };
    const outsideHit = opened3 ? await app.evalJs(`document.elementFromPoint(${outside.x}, ${outside.y})?.className || null`) : null;
    if (opened3) await click(app, outside, 1);
    await sleep(400);
    const afterOutside = await closedState(app);
    ok(`${T} X6: a click outside the card (the backdrop) still closes the pop-up`,
      opened3 && outsideHit === 'board-popup-backdrop' && afterOutside.popupGone && afterOutside.blurGone, JSON.stringify({ opened3, outsideHit, ...afterOutside }));
    if (!afterOutside.popupGone) { await app.key('Escape'); await sleep(300); }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCARD-CLOSE-X VERIFY: PASS (${checks.length} checks)` : `\nCARD-CLOSE-X VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
