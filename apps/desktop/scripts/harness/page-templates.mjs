// PAGE-TEMPLATES-MOVE (Nick's rulings, 2026-10-08, through Fable): "templates live in the tools menu now".
//   1. The Draft strip's TEMPLATES read, in order: Screenplay (LIVE) - Outline - Title page - Bibliography - Custom, the last four
//      grayed "Coming soon" (Custom is new). There is NO Sprout template and NO Plan template; Plan stays on the PLAN bar only.
//   2. Templates live in Draft and later strips only, NEVER in Free Write.
//   3. Sprout (the spark deck) stays the ONE door on a blank Free Write page, with the row's same vanish rule.
//   4. Screenplay on a page WITH words opens a NEW screenplay page and never touches the text; the new page carries the
//      "Back to <title>" chip. On an empty page it applies in place.
// The board and projection rows are unchanged. Every read of storage is SETTLED. Buttons are found by data-template / data-
// beginning key, never by label or index.
// Run: node scripts/harness/page-templates.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROWS_KEY = 'writer-studio-journal-entries';
const ED = '.forward-only-editor';
const SCRIPT = '.script-sheet, .script-page, .script-el';
const WORDS = 'Words already here on this page.';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const rows = (app) => app.evalJs(`JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').filter(e => !e.deletedAt)
  .map(e => ({ id: e.id, text: e.text, pageType: e.pageType || null, planBoardId: e.planBoardId || null, origin: e.origin ?? null }))`);
const hash = (app) => app.evalJs('location.hash');
const pageDoors = (app) => app.evalJs("[...document.querySelectorAll('.wz-beginnings .wz-beginning')].map(b => b.dataset.beginning)");
const activeMode = (app) => app.evalJs("document.querySelector('.desk-mode-tab.active')?.getAttribute('data-mode-key') || null");
const openStrip = async (app) => {
  if (await app.evalJs("!!document.querySelector('.wz-sliver-body')")) return true;
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  return waitSoft(app, "!!document.querySelector('.wz-sliver-body')", { label: 'strip open', timeout: 3000 });
};
const strip = (app) => app.evalJs(`[...document.querySelectorAll('.wz-sliver-templates button')].map(b => ({
  live: b.classList.contains('wz-template-live'), key: b.dataset.template || null, name: b.getAttribute('aria-label'),
  title: b.title, disabled: b.getAttribute('aria-disabled'), glyph: !!b.querySelector('svg') }))`);
// The point a writer would press: the control scrolled into view in its own scroller (the strip scrolls - Templates sit below its
// fold at 1400x900), and only if that point hit-tests to the control itself. A press on anything else is NOT a press (the box
// turn of 2026-10-08 measured the centre of an unscrolled template hitting .wz-sliver, and a press that did nothing passed as one).
const centreOf = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null;
  b.scrollIntoView({ block: 'center', inline: 'nearest' });
  const r = b.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const hit = document.elementFromPoint(x, y);
  return hit && (hit === b || b.contains(hit)) ? { x, y } : null; })()`);
// a real press, held long enough to read the press colour, released ON the button
const press = async (app, sel) => {
  const pt = await centreOf(app, sel);
  if (!pt) return { pressed: false };
  await app.mouseDown(pt.x, pt.y);
  await sleep(60);
  const during = await app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null;
    const cs = getComputedStyle(b); return { color: cs.color, border: cs.borderTopColor }; })()`);
  await app.mouseUp(pt.x, pt.y);
  return { pressed: true, during };
};
const SCREENPLAY = '.wz-template-live[data-template="screenplay"]';
const rgbOf = (app, cssColor) => app.evalJs(`(() => { const d = document.createElement('div'); d.style.color = ${JSON.stringify(cssColor)};
  document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })()`);
// `draft`: switch by the mode TAB. The `?mode=draft` address no longer opens Draft (item 87's amendment retired the door's mode).
const blank = async (app, draft = false) => {
  await app.goto('/page/new');
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'unborn page' });
  await sleep(600);
  if (draft) { await app.click('Draft'); await sleep(600); }
};
const seeded = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'seeded page' });
  await sleep(500);
  await app.click('Draft'); await sleep(700);
};

await withHarness(async (app) => {
  // ===== T1 - a blank page in FREE WRITE: the row carries ONE door, Sprout; the strip carries NO templates =====
  await freshDesk(app);
  await blank(app);
  const fwMode = await activeMode(app);
  const fwDoors = await pageDoors(app);
  ok('T1 [Free Write, blank page]: the page opens in Free Write (the premise of the next checks)', fwMode === 'freewrite', String(fwMode));
  ok('T1 [Free Write, blank page]: the beginnings row offers ONE door, Sprout - no Screenplay door, no Plan door', JSON.stringify(fwDoors) === JSON.stringify(['sprout']), JSON.stringify(fwDoors));
  const fwOpen = await openStrip(app);
  const fwStrip = await app.evalJs("({ body: !!document.querySelector('.wz-sliver-body'), templates: !!document.querySelector('.wz-sliver-templates'), live: document.querySelectorAll('.wz-template-live').length })");
  ok('T1 [Free Write]: the strip is OPEN (so the next check can see) and carries NO Templates section and no template button at all',
    fwOpen === true && fwStrip.body === true && fwStrip.templates === false && fwStrip.live === 0, JSON.stringify(fwStrip));

  // ===== T1 - a blank page in DRAFT: no row; the Templates read Screenplay (live), Outline, Title page, Bibliography, Custom =====
  await blank(app, true);
  ok('T1 [Draft, blank page]: the beginnings row is NOT drawn (Sprout is the blank Free Write page\'s door)', JSON.stringify(await pageDoors(app)) === '[]', JSON.stringify(await pageDoors(app)));
  await openStrip(app);
  const s = await strip(app);
  ok('T1 [Draft]: the Templates read Screenplay, Outline, Title page, Bibliography, Custom - in that order, and nothing else',
    JSON.stringify(s.map((b) => b.name)) === JSON.stringify(['Screenplay', 'Outline', 'Title page', 'Bibliography', 'Custom']), JSON.stringify(s.map((b) => b.name)));
  ok('T1 [Draft]: Screenplay is the ONE live template (not aria-disabled, keyed screenplay, with its glyph) - there is no Sprout and no Plan template',
    JSON.stringify(s.filter((b) => b.live).map((b) => b.key)) === JSON.stringify(['screenplay']) && s.filter((b) => b.live).every((b) => b.disabled === null && b.glyph)
      && (await app.evalJs("!document.querySelector('[data-template=\"sprout\"], [data-template=\"plan\"]')")), JSON.stringify(s));
  ok('T1 [Draft]: the four after it are grayed placeholders - aria-disabled, titled "Coming soon", each with its glyph',
    s.filter((b) => !b.live).length === 4 && s.filter((b) => !b.live).every((b) => b.disabled === 'true' && b.title === 'Coming soon' && b.glyph), JSON.stringify(s.filter((b) => !b.live)));
  ok('T1 [Draft]: Plan stays on the PLAN bar', (await app.evalJs("!!document.querySelector('.desk-mode-strip [data-page-plan-door]')")) === true);
  const brass = await rgbOf(app, 'var(--brass)');
  const rest = await app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(SCREENPLAY)}); return b ? { color: getComputedStyle(b).color, pressed: b.getAttribute('aria-pressed') } : null; })()`);
  ok('T1 [Draft, a PROSE page]: the Screenplay template is NOT chosen here - aria-pressed false, and not brass at rest (brass marks a choice made)',
    !!rest && rest.pressed === 'false' && rest.color !== brass, JSON.stringify({ rest, brass }));

  // ===== T2 - Screenplay on an EMPTY page applies in place; brass on the press =====
  await freshDesk(app);
  await blank(app, true);
  await openStrip(app);
  const sp = await press(app, SCREENPLAY);
  ok('T2: pressing the template turns it brass while held (the press, per the standing rule)',
    !!sp.during && sp.during.color === brass && sp.during.border === brass, JSON.stringify({ during: sp.during, brass }));
  await waitSoft(app, `!!document.querySelector('${SCRIPT}')`, { label: 'script surface (empty, in place)' });
  await sleep(700);
  const r2 = await rows(app);
  ok('T2 [Screenplay, empty page]: applies IN PLACE - the surface becomes the script room and exactly ONE row exists, a script',
    (await app.evalJs(`!!document.querySelector('${SCRIPT}')`)) && r2.length === 1 && r2[0].pageType === 'script', JSON.stringify({ rows: r2, hash: await hash(app) }));
  // Nick's standing rule (Fable, 2026-10-08): brass marks a choice the writer has MADE, at rest. The page IS a screenplay now, so
  // its strip shows the Screenplay template chosen - read with no press and the pointer parked far from it.
  await app.mouseMove(5, 5); await sleep(200);
  await openStrip(app);
  await waitSoft(app, `!!document.querySelector(${JSON.stringify(SCREENPLAY)})`, { label: 'screenplay page strip', timeout: 3000 });
  const chosen = await app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(SCREENPLAY)}); if (!b) return null;
    const cs = getComputedStyle(b); return { pressed: b.getAttribute('aria-pressed'), color: cs.color, border: cs.borderTopColor, active: b.matches(':active') }; })()`);
  ok('T2 [chosen]: on a screenplay page the Screenplay template is drawn CHOSEN - aria-pressed, and brass AT REST (no press: not :active)',
    !!chosen && chosen.pressed === 'true' && chosen.active === false && chosen.color === brass && chosen.border === brass, JSON.stringify({ chosen, brass }));

  // ===== T3 - Sprout on a blank Free Write page: the same door, the same vanish rule =====
  await freshDesk(app);
  await blank(app);
  const h0 = await hash(app);
  const sprout = await press(app, '.wz-beginning[data-beginning="sprout"]');
  await sleep(600);
  const sprouted = await app.evalJs("({ invite: !!document.querySelector('.fl-invite'), row: !!document.querySelector('.wz-beginnings') })");
  ok('T3 [Sprout, blank Free Write page]: the door draws the first-line invitation on THIS page, the row goes, and nothing is written',
    sprout.pressed && sprouted.invite && !sprouted.row && (await hash(app)) === h0 && (await rows(app)).length === 0, JSON.stringify({ sprouted, h0, now: await hash(app), rows: await rows(app) }));
  await freshDesk(app);
  await blank(app);
  const rowBefore = JSON.stringify(await pageDoors(app));
  await app.evalJs(`document.querySelector('${ED}')?.focus()`);
  await app.typeKeys('First words.');
  await sleep(400);
  ok('T3 [vanish rule]: the first keystroke on a blank Free Write page takes the row away', rowBefore === '["sprout"]' && JSON.stringify(await pageDoors(app)) === '[]', JSON.stringify({ rowBefore, after: await pageDoors(app) }));
  await waitSoft(app, `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').some(e => (e.text || '').includes('First words.'))`, { label: 'birth on the first word', timeout: 4000 });
  const born = (await rows(app)).filter((e) => (e.text || '').includes('First words.'));
  ok('T3 [typing path untouched]: the page births on the first word and saves exactly what was typed', born.length === 1 && born[0].text === 'First words.', JSON.stringify(born));

  // ===== T4 - Screenplay on a page WITH words opens a NEW page and never rewrites this one; the chip returns =====
  await freshDesk(app);
  const id = 'tpl-screenplay';
  await seeded(app, id);
  await openStrip(app);
  const before = await rows(app);
  const r = await press(app, SCREENPLAY);
  await waitSoft(app, `!!document.querySelector('${SCRIPT}')`, { label: 'new script page' });
  await sleep(900);
  const after = await rows(app);
  const orig = after.find((e) => e.id === id);
  const fresh = after.filter((e) => !before.some((b) => b.id === e.id));
  const where = await hash(app);
  ok('T4 [Screenplay, page with words]: the current page is UNTOUCHED - same text, still prose',
    r.pressed && !!orig && orig.text === WORDS && orig.pageType === null, JSON.stringify({ orig, pressed: r.pressed }));
  const made = fresh.find((e) => e.pageType === 'script');
  ok('T4 [Screenplay, page with words]: a NEW script page opens (one new row, a script, in the same home) and the writer is on it',
    fresh.length === 1 && !!made && made.origin === 'loose' && where.includes(made.id) && (await app.evalJs(`!!document.querySelector('${SCRIPT}')`)), JSON.stringify({ fresh, where }));
  const chip = await app.evalJs("(() => { const b = document.querySelector('.wz-back-to-board'); return b ? b.textContent.trim() : null; })()");
  ok(`T4: the new page carries a one-tap way back that names the page left ("Back to ${WORDS.slice(0, 20)}...")`,
    typeof chip === 'string' && chip.includes('Back to') && chip.includes(WORDS.slice(0, 20)), JSON.stringify(chip));
  const chipPt = await centreOf(app, '.wz-back-to-board');
  if (chipPt) { await app.mouseDown(chipPt.x, chipPt.y); await app.mouseUp(chipPt.x, chipPt.y); }
  await waitSoft(app, `location.hash === '#/page/${id}' && !!document.querySelector('${ED}')`, { label: 'back on the original page' });
  await sleep(600);
  const back = await app.evalJs(`({ hash: location.hash, text: (document.querySelector('${ED}')?.textContent || '').replace(/\\u200b/g, '') })`);
  ok('T4: the chip returns to the original page, its words intact', back.hash === `#/page/${id}` && back.text.includes(WORDS), JSON.stringify(back));

  // ===== T5 - the board's row is unchanged =====
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tpl-board', text: 'A user board', pageType: 'board', boxes: [], createdAt: '2026-05-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/tpl-board'");
  await waitSoft(app, "!!document.querySelector('.wz-beginnings')", { label: 'board row' });
  const doors = await app.evalJs("[...document.querySelectorAll('.wz-beginning')].map(n => n.dataset.beginning)");
  ok('T5: an empty user board still shows its Beginnings row with its own four doors (newCard, newPageCard, loadDeck, connectPage)',
    JSON.stringify(doors) === JSON.stringify(['newCard', 'newPageCard', 'loadDeck', 'connectPage']), JSON.stringify(doors));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPAGE-TEMPLATES VERIFY: PASS (${checks.length} checks)` : `\nPAGE-TEMPLATES VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
