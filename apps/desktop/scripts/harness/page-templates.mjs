// PAGE-TEMPLATES-MOVE (Nick, 2026-10-08, through Fable): "templates live in the tools menu now". The new page's Beginnings row
// (Screenplay / Sprout / Plan) is retired; the three are LIVE template buttons in the Draft strip's Templates section, ahead of the
// three disabled placeholders (Outline, Bibliography, Title page), each running the same act its door ran.
//   - On an EMPTY page (zero words) a template applies in place.
//   - On a page WITH words it never touches the text: it opens a NEW page in the same home and finishes there, and the new page
//     carries the "Back to <title>" chip to the page it left.
//   - The board and projection rows are not templates and are unchanged.
// Every read of storage is SETTLED (past the debounces). Buttons are found by data-template, never by label or index.
// Run: node scripts/harness/page-templates.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROWS_KEY = 'writer-studio-journal-entries';
const ED = '.forward-only-editor';
const SCRIPT = '.script-sheet, .script-page, .script-el';
const KEYS = ['screenplay', 'sprout', 'plan'];
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
  .map(e => ({ id: e.id, text: e.text, pageType: e.pageType || null, planBoardId: e.planBoardId || null, origin: e.origin ?? null, projectId: e.projectId ?? null }))`);
const hash = (app) => app.evalJs('location.hash');
const pageRow = (app) => app.evalJs("!!document.querySelector('.wz-beginnings')");
const openStrip = async (app) => {
  if (await app.evalJs("!!document.querySelector('.wz-sliver-templates')")) return true;
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  return waitSoft(app, "!!document.querySelector('.wz-sliver-templates')", { label: 'templates section', timeout: 3000 });
};
const strip = (app) => app.evalJs(`[...document.querySelectorAll('.wz-sliver-templates button')].map(b => ({
  live: b.classList.contains('wz-template-live'), key: b.dataset.template || null, name: b.getAttribute('aria-label'),
  disabled: b.getAttribute('aria-disabled'), glyph: !!b.querySelector('svg') }))`);
// press a live template with a real pointer, held long enough to read the press colour, then released ON the button
const press = async (app, key) => {
  const pt = await app.evalJs(`(() => { const b = document.querySelector('.wz-template-live[data-template="${key}"]'); if (!b) return null;
    const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  if (!pt) return { pressed: false };
  await app.mouseDown(pt.x, pt.y);
  await sleep(60);
  const during = await app.evalJs(`(() => { const b = document.querySelector('.wz-template-live[data-template="${key}"]'); if (!b) return null;
    const cs = getComputedStyle(b); return { color: cs.color, border: cs.borderTopColor,
      brass: getComputedStyle(document.documentElement).getPropertyValue('--brass').trim() }; })()`);
  await app.mouseUp(pt.x, pt.y);
  return { pressed: true, during };
};
// the brass token as an rgb() string, for comparing against computed colours
const rgbOf = (app, cssColor) => app.evalJs(`(() => { const d = document.createElement('div'); d.style.color = ${JSON.stringify(cssColor)};
  document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })()`);
const blankDraft = async (app) => {
  await app.goto('/page/new?mode=draft');
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'unborn page' });
  await sleep(500);
};
const seededDraft = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'seeded page' });
  await sleep(500);
  await app.click('Draft'); await sleep(700);
};

await withHarness(async (app) => {
  // ===== T1 - the blank page: no row; the strip carries three live templates ahead of the three placeholders =====
  await freshDesk(app);
  await app.goto('/page/new');
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'unborn page, default mode' });
  await sleep(600);
  ok('T1: a blank page (its default mode) shows NO beginnings row', (await pageRow(app)) === false, String(await pageRow(app)));
  await blankDraft(app);
  ok('T1: a blank page in Draft shows NO beginnings row', (await pageRow(app)) === false);
  const opened = await openStrip(app);
  const s = await strip(app);
  ok('T1: the Templates section is reachable from the Draft strip', opened === true, JSON.stringify(s));
  ok('T1: the section reads Screenplay, Sprout, Plan (live) then Outline, Bibliography, Title page (placeholders), in that order',
    JSON.stringify(s.map((b) => b.name)) === JSON.stringify(['Screenplay', 'Sprout', 'Plan', 'Outline', 'Bibliography', 'Title page']), JSON.stringify(s.map((b) => b.name)));
  ok('T1: the three templates are LIVE (not aria-disabled), keyed screenplay/sprout/plan, each with its glyph',
    JSON.stringify(s.filter((b) => b.live).map((b) => b.key)) === JSON.stringify(KEYS) && s.filter((b) => b.live).every((b) => b.disabled === null && b.glyph), JSON.stringify(s));
  ok('T1: the three placeholders are unchanged - still aria-disabled, still not live',
    s.filter((b) => !b.live).length === 3 && s.filter((b) => !b.live).every((b) => b.disabled === 'true'), JSON.stringify(s.filter((b) => !b.live)));
  const restColor = await app.evalJs("getComputedStyle(document.querySelector('.wz-template-live[data-template=\"sprout\"]')).color");
  const brass = await rgbOf(app, 'var(--brass)');
  ok('T1: a live template is NOT brass at rest (olive rests, brass is the press)', restColor !== brass, JSON.stringify({ restColor, brass }));

  // ===== T2 - each template on an EMPTY page applies in place =====
  // Screenplay
  await freshDesk(app);
  await blankDraft(app);
  await openStrip(app);
  const sp = await press(app, 'screenplay');
  ok('T2 brass: pressing a template turns it brass while held (the press, per the standing rule)',
    !!sp.during && sp.during.color === brass && sp.during.border === brass, JSON.stringify({ during: sp.during, brass }));
  await waitSoft(app, `!!document.querySelector('${SCRIPT}')`, { label: 'script surface (empty, in place)' });
  await sleep(700);
  const r2s = await rows(app);
  ok('T2 [screenplay, empty page]: applies IN PLACE - the surface becomes the script room and exactly ONE row exists, a script',
    (await app.evalJs(`!!document.querySelector('${SCRIPT}')`)) && r2s.length === 1 && r2s[0].pageType === 'script', JSON.stringify({ rows: r2s, hash: await hash(app) }));
  // Sprout
  await freshDesk(app);
  await blankDraft(app);
  await openStrip(app);
  const h0 = await hash(app);
  await press(app, 'sprout');
  await sleep(700);
  ok('T2 [sprout, empty page]: applies IN PLACE - the first-line invitation shows on THIS page, and nothing is written',
    (await app.evalJs("!!document.querySelector('.fl-invite')")) && (await hash(app)) === h0 && (await rows(app)).length === 0,
    JSON.stringify({ invite: await app.evalJs("!!document.querySelector('.fl-invite')"), before: h0, after: await hash(app), rows: await rows(app) }));
  // Plan
  await freshDesk(app);
  await blankDraft(app);
  await openStrip(app);
  await press(app, 'plan');
  await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'plan board (empty, in place)' });
  await sleep(800);
  const r2p = await rows(app);
  const page2p = r2p.find((r) => r.pageType !== 'board');
  ok('T2 [plan, empty page]: applies IN PLACE - THIS page is born and paired with its plan board, and the writer is on the board',
    !!page2p && !!page2p.planBoardId && r2p.some((r) => r.id === page2p.planBoardId && r.pageType === 'board') && (await hash(app)).includes(page2p.planBoardId) && r2p.length === 2,
    JSON.stringify({ rows: r2p, hash: await hash(app) }));

  // ===== T3 - each template on a page WITH WORDS opens a NEW page and never rewrites this one =====
  for (const key of KEYS) {
    await freshDesk(app);
    const id = `tpl-${key}`;
    await seededDraft(app, id);
    await openStrip(app);
    const before = await rows(app);
    const r = await press(app, key);
    if (key === 'screenplay') await waitSoft(app, `!!document.querySelector('${SCRIPT}')`, { label: 'new script page' });
    else if (key === 'plan') await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'new plan board' });
    else await waitSoft(app, "!!document.querySelector('.fl-invite')", { label: 'new page with the invitation' });
    await sleep(900);
    const after = await rows(app);
    const orig = after.find((e) => e.id === id);
    const fresh = after.filter((e) => !before.some((b) => b.id === e.id));
    const where = await hash(app);
    ok(`T3 [${key}, page with words]: the current page is UNTOUCHED - same text, still prose, no plan pairing`,
      r.pressed && !!orig && orig.text === WORDS && orig.pageType === null && orig.planBoardId === null, JSON.stringify({ orig, pressed: r.pressed }));
    if (key === 'screenplay') {
      const made = fresh.find((e) => e.pageType === 'script');
      ok('T3 [screenplay, page with words]: a NEW script page is opened (one new row, a script, in the same home) and the writer is on it',
        fresh.length === 1 && !!made && made.origin === 'loose' && where.includes(made.id) && (await app.evalJs(`!!document.querySelector('${SCRIPT}')`)),
        JSON.stringify({ fresh, where }));
    } else if (key === 'sprout') {
      ok('T3 [sprout, page with words]: a NEW page opens with the invitation, and like any new page it writes nothing until the first word',
        fresh.length === 0 && where.startsWith('#/page/new') && (await app.evalJs("!!document.querySelector('.fl-invite')")), JSON.stringify({ fresh, where }));
    } else {
      const page = fresh.find((e) => e.pageType !== 'board');
      const board = fresh.find((e) => e.pageType === 'board');
      ok('T3 [plan, page with words]: a NEW page is born and paired with a NEW plan board, and the writer is on that board',
        fresh.length === 2 && !!page && !!board && page.planBoardId === board.id && page.text === '' && page.origin === 'loose' && where.includes(board.id),
        JSON.stringify({ fresh, where }));
    }
    // the way back (not for Plan: the board is reached through the new page, and is reported as such)
    if (key !== 'plan') {
      const chip = await app.evalJs("(() => { const b = document.querySelector('.wz-back-to-board'); return b ? b.textContent.trim() : null; })()");
      ok(`T3 [${key}]: the new page carries a one-tap way back that names the page left ("Back to ${WORDS.slice(0, 20)}...")`,
        typeof chip === 'string' && chip.includes('Back to') && chip.includes(WORDS.slice(0, 20)), JSON.stringify(chip));
      await app.evalJs("document.querySelector('.wz-back-to-board')?.click()");
      await waitSoft(app, `location.hash === '#/page/${id}' && !!document.querySelector('${ED}')`, { label: 'back on the original page' });
      await sleep(600);
      const back = await app.evalJs(`({ hash: location.hash, text: (document.querySelector('${ED}')?.textContent || '').replace(/\\u200b/g, '') })`);
      ok(`T3 [${key}]: the chip returns to the original page, its words intact`, back.hash === `#/page/${id}` && back.text.includes(WORDS), JSON.stringify(back));
    }
  }

  // ===== T4 - the typing path is untouched: a blank page still births on the first word =====
  await freshDesk(app);
  await blankDraft(app);
  await app.evalJs(`document.querySelector('${ED}')?.focus()`);
  await app.typeKeys('First words.');
  await waitSoft(app, `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').some(e => (e.text || '').includes('First words.'))`, { label: 'birth on the first word', timeout: 4000 });
  const born = (await rows(app)).filter((e) => (e.text || '').includes('First words.'));
  ok('T4: a blank page still births on the first word and saves what was typed (no row interfered with it)', born.length === 1 && born[0].text === 'First words.', JSON.stringify(born));

  // ===== T5 - the board's row is unchanged =====
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'tpl-board', text: 'A user board', pageType: 'board', boxes: [], createdAt: '2026-05-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/tpl-board'");
  await waitSoft(app, "!!document.querySelector('.wz-beginnings')", { label: 'board row' });
  const doors = await app.evalJs("[...document.querySelectorAll('.wz-beginning')].map(n => n.dataset.beginning)");
  ok('T5: an empty user board still shows its Beginnings row with its own four doors (newCard, newPageCard, loadDeck, connectPage)',
    JSON.stringify(doors) === JSON.stringify(['newCard', 'newPageCard', 'loadDeck', 'connectPage']), JSON.stringify(doors));
  ok('T5: and the board offers no page templates (Screenplay/Sprout/Plan are not board doors)',
    Array.isArray(doors) && !doors.some((k) => KEYS.includes(k)), JSON.stringify(doors));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPAGE-TEMPLATES VERIFY: PASS (${checks.length} checks)` : `\nPAGE-TEMPLATES VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
