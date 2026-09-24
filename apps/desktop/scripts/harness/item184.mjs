// ITEM 184 - RETIRE CONVERT TO SCREENPLAY. Run: node scripts/harness/item184.mjs (from apps/desktop, dist-web built).
//
// Nick, verbatim: "I think it's fine to expect a user to select into writing a screenplay before they
// start one. If they want to 'convert' something they've already written, they can always copy and
// paste it into a screenplay surface."
//
// STATUS AT WRITING: BUILT, NOT RUN. The box grant did not name FIX. Falsify FIRST when a turn is
// announced: against the OLD code S1 (no New Screenplay door), S2 (the Convert row is there) and S3
// (the screenplay sliver still has its zone) must go RED.
//
// THE ORDER IS THE SAFETY. The first claim is not "conversion is gone" but "a loose screenplay can still be
// MADE": the New Screenplay door, pressed by a REAL pointer, opens a screenplay that births at zero words.
// There must be no build in which the way to a screenplay is closed - so S1 comes first, and a red S1 is
// the one that halts everything else.
//
// WHAT SURVIVES, MEASURED (S4): an existing converted page. A converted page is pageType 'script' + `script`
// + the `text` shadow and is INDISTINGUISHABLE from one born a screenplay - there is no "converted" marker -
// so retiring the ACT touches none of ScriptEditor's rendering, the field, or the server column. S4 seeds
// exactly that shape and edits it.
//
// WHAT THIS FILE DOES NOT COVER, SAID UP FRONT: the Beginnings row's Screenplay door on a blank page (bg1.mjs
// S2 keeps that, and it is the empty-page path this ticket deliberately leaves); the mechanical
// prose->script mapping itself (structureConvert.ts is untouched and still used for the blank-page birth);
// and a person's eye on the Page menu with a second button in it.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROSE = 'i184-prose';
const SCRIPT = 'i184-script';
const CONVERTED_LINE = 'A line already converted.';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

// Seeded through the seam (item 129), never raw storage. The script page is the shape a pre-184
// conversion PRODUCED: pageType 'script' + script doc + the text shadow, and nothing else.
const seed = async (app) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: PROSE, text: 'A paragraph that is already written.', createdAt: '2026-06-01T00:00:00.000Z',
    origin: 'loose', pageType: 'manuscript', projectId: null,
  })})`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: SCRIPT, text: CONVERTED_LINE, createdAt: '2026-06-01T00:00:01.000Z', origin: 'loose', source: null,
    pageType: 'script',
    script: { v: 1, scenes: [{ id: 'sc1', heading: { id: 'h1', t: 'scene', text: 'INT. OFFICE - DAY' }, body: [{ id: 'a1', t: 'action', text: CONVERTED_LINE }] }] },
  })})`);
  for (let i = 0; i < 60; i += 1) {
    const both = await app.evalJs(`(() => { const r = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); return r.some(e => e.id === '${PROSE}') && r.some(e => e.id === '${SCRIPT}'); })()`);
    if (both) return true;
    await sleep(100);
  }
  return false;
};

const open = async (app, id, selector) => {
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`, { label: `${id} mounted` });
  await sleep(400);
};

const centerOf = (app, expr) => app.evalJs(`(() => {
  const el = ${expr};
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);

// A real pointer, moved first as a writer moves it. Returns false (never throws) if the target is absent.
const press = async (app, pt) => {
  if (!pt) return false;
  await app.mouseMove(pt.x, pt.y);
  await sleep(60);
  await app.mouseDown(pt.x, pt.y);
  await app.mouseUp(pt.x, pt.y);
  await sleep(300);
  return true;
};

const pageCategoryButton = (label) => `[...document.querySelectorAll('.wz-cascade-panel button')].find(b => b.textContent.trim() === ${JSON.stringify(label)})`;

const openPageCategory = async (app) => {
  await app.evalJs("document.querySelector('.wz-strip-item[data-category=page]')?.click()");
  await sleep(300);
};

const scriptRows = (app) => app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').filter(e => e.pageType === 'script' && !e.deletedAt).map(e => ({ id: e.id, text: e.text, origin: e.origin }))`);
const flush = (app) => app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()');

await withHarness(async (app) => {
  await freshDesk(app);
  ok('setup: a written prose page and a converted-shape screenplay page are seeded through the seam and landed', await seed(app));

  // ==========================================================================
  // S1 - THE DOOR (the safety claim, and the first). A loose screenplay can still be MADE.
  // ==========================================================================
  await open(app, PROSE, '.forward-only-editor');
  await openPageCategory(app);
  const doorPt = await centerOf(app, pageCategoryButton('New Screenplay'));
  ok('S1: the Page menu carries a "New Screenplay" door (the way to a screenplay now that conversion is gone)', !!doorPt, JSON.stringify(doorPt));
  const before = await scriptRows(app);
  const pressed = await press(app, doorPt);
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 'a screenplay opens from the door' }).catch(() => null);
  await sleep(400);
  const hashAfter = await app.evalJs('location.hash');
  const sheet = await app.evalJs("!!document.querySelector('.script-sheet') && !document.querySelector('.forward-only-editor')");
  ok('S1 THE ORDER IS THE SAFETY: a REAL press on the door opens a screenplay room (script sheet mounts, no prose editor) at the address that asked for it',
    pressed && sheet === true && /structure=screenplay/.test(hashAfter), JSON.stringify({ pressed, sheet, hashAfter }));
  await flush(app);
  const after = await scriptRows(app);
  const born = after.filter((r) => !before.some((b) => b.id === r.id));
  ok('S1: it is BORN - exactly one new screenplay row, at zero words, loose (not filed to the Journal): choosing before starting is a durable commitment, made at the door',
    born.length === 1 && born[0].text === '' && born[0].origin !== 'journal', JSON.stringify({ before: before.length, after: after.length, born }));

  // The other door still gives paper: a plain New Page opens prose and writes NOTHING until the first word (PB1).
  await open(app, PROSE, '.forward-only-editor');
  await openPageCategory(app);
  const rowsBeforeNewPage = await scriptRows(app);
  const newPagePt = await centerOf(app, pageCategoryButton('New Page'));
  await press(app, newPagePt);
  await sleep(700);
  const plain = await app.evalJs("!!document.querySelector('.forward-only-editor') && !document.querySelector('.script-sheet')");
  const rowsAfterNewPage = await scriptRows(app);
  ok('S1: the plain "New Page" door is unchanged - it opens PROSE, and no screenplay row is written',
    !!newPagePt && plain === true && rowsAfterNewPage.length === rowsBeforeNewPage.length, JSON.stringify({ newPagePt: !!newPagePt, plain, before: rowsBeforeNewPage.length, after: rowsAfterNewPage.length }));

  // ==========================================================================
  // S2 - NO CONVERSION on a written prose page. Nothing offers it, nothing gates it.
  // ==========================================================================
  await open(app, PROSE, '.forward-only-editor');
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft')?.click()");
  await sleep(500);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(400);
  const prose = await app.evalJs(`(() => {
    const zone = document.querySelector('.wz-sliver-structure-zone');
    const texts = [...document.querySelectorAll('button, [role=button], a')].map(b => (b.textContent || '').trim());
    return {
      zone: !!zone,
      kindChips: document.querySelectorAll('[data-page-kind]').length,
      actionInZone: zone ? !!zone.querySelector('.wz-cascade-action') : null,
      ruleInZone: zone ? !!zone.querySelector('.wz-sliver-rule') : null,
      subs: zone ? [...zone.querySelectorAll('.wz-sliver-sub')].map(s => s.textContent) : null,
      convertAnywhere: texts.some((t) => /^Convert to (Screenplay|Prose)/.test(t)),
      modal: !!document.querySelector('.structure-confirm-modal'),
    };
  })()`);
  ok('S2: on a WRITTEN prose page the Structure zone still exists (it holds the page\'s kind chips) but carries NO conversion row, no rule and no "Change the page itself" label',
    prose.zone === true && prose.kindChips > 0 && prose.actionInZone === false && prose.ruleInZone === false
      && Array.isArray(prose.subs) && !prose.subs.includes('Change the page itself'), JSON.stringify(prose));
  ok('S2: no control anywhere on the page reads "Convert to Screenplay..." / "Convert to Prose...", and no confirmation dialog is in the DOM',
    prose.convertAnywhere === false && prose.modal === false, JSON.stringify(prose));

  // ==========================================================================
  // S3 - a screenplay has no Structure zone at all (it held only the conversion row).
  // ==========================================================================
  await open(app, SCRIPT, '.script-sheet');
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(400);
  const script = await app.evalJs(`(() => {
    const texts = [...document.querySelectorAll('button, [role=button], a')].map(b => (b.textContent || '').trim());
    return {
      zone: !!document.querySelector('.wz-sliver-structure-zone'),
      kindChips: document.querySelectorAll('[data-page-kind]').length,
      convertAnywhere: texts.some((t) => /^Convert to (Screenplay|Prose)/.test(t)),
      modal: !!document.querySelector('.structure-confirm-modal'),
    };
  })()`);
  ok('S3: a screenplay\'s sliver has NO Structure zone (a heading over nothing is not a zone), no kind chips, no Convert row, no dialog',
    script.zone === false && script.kindChips === 0 && script.convertAnywhere === false && script.modal === false, JSON.stringify(script));

  // ==========================================================================
  // S4 - AN EXISTING CONVERTED PAGE KEEPS WORKING. Same shape as one born a screenplay, edited the same way.
  // ==========================================================================
  const lineShown = await app.evalJs(`[...document.querySelectorAll('.script-el')].some(e => (e.textContent || '').includes(${JSON.stringify(CONVERTED_LINE)}))`);
  ok('S4: the converted-shape page renders its screenplay - the converted line is on the sheet', lineShown === true, String(lineShown));
  const focusable = await app.evalJs("(() => { const el = document.querySelector('.script-el-active'); if (!el) return false; el.focus(); return true; })()");
  if (focusable) { await app.typeKeys(' And one more.'); await sleep(250); }
  await sleep(2400);   // the script autosave is debounced; read only after it has run
  await flush(app);
  const stored = (await scriptRows(app)).find((r) => r.id === SCRIPT);
  ok('S4: a converted page is still EDITABLE and its text shadow follows - typing lands in the stored row (no "converted" marker, nothing about the act was needed)',
    focusable === true && !!stored && /And one more\./.test(stored.text || ''), JSON.stringify({ focusable, stored }));
});

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  [' + c.detail + ']' : ''}`);
console.log(`\nITEM184 VERIFY: ${failed.length ? `FAIL — ${failed.length}/${checks.length} failed` : `PASS (${checks.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
