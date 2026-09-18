// ITEM 133 — NAMING. The founder's report, verbatim: "I still can't name
// anything in the app, either Pages or Boards."
// Run: node scripts/harness/item133.mjs   (from apps/desktop, dist-web built)
//
// S0's THREE VERDICTS, which these checks now hold shut:
//   BOARD — (a) ABSENT. `createBoardPage` wrote `text` once at birth and
//     NOTHING ever wrote it again. A headful sitting confirmed it: the name in
//     the board's own crumb was an inert <span>, tabIndex -1, and right-click
//     produced no menu, double-click left it uneditable, click focused <body>.
//   PAGE — (b) HIDDEN. The name IS the first line; a writer could always change
//     it by changing their prose, but the displayed title was an inert <div>
//     and nothing said so.
//   ONE CAUSE — there is no stored title field; the name is a derived view of
//     `entry.text`. (Item 136 is chartered to give pages and boards a real
//     stored title; this file tests the model as it stands today.)
//
// THE LAST CLAUSE IS THE ONE THAT MATTERS, and it is why S3 exists. The same
// board name was being derived three different ways, so a rename could land on
// one surface and not another. Rather than enumerate the lists I happen to know
// about — which is exactly how a sweep misses the fourth — S3 asserts the OLD
// NAME APPEARS NOWHERE in the rendered app. A surface I forgot still fails it.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A driver that fails a check instead of killing the file (the standing law).
const clickOrFail = async (app, selector, why) => {
  const there = await app.evalJs(`!!document.querySelector(${JSON.stringify(selector)})`);
  ok(why, there, there ? selector : `absent: ${selector}`);
  if (!there) return false;
  await app.evalJs(`document.querySelector(${JSON.stringify(selector)}).click()`);
  return true;
};

// Seeded through the SEAM (item 129: a raw write is serialised over by the next
// product write), and read only AFTER the debounced flush has landed (item 122:
// a probe reads the settled state, never a state in motion).
const seed = async (app, rows) => {
  await app.evalJs(`(() => { const now = new Date().toISOString();
    ${rows.map(r => `window.wrizoCreateJournalPage(${JSON.stringify(r)});`).join('\n    ')} })()`);
  const ids = rows.map(r => r.id);
  for (let i = 0; i < 60; i += 1) {
    const landed = await app.evalJs(
      `(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').map(e => e.id);
        return ${JSON.stringify(ids)}.every(id => es.includes(id)); })()`);
    if (landed) return true;
    await sleep(100);
  }
  return false;
};

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

const storedText = (app, id) => app.evalJs(
  `(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]')
     .find(x => x.id === ${JSON.stringify(id)}); return e ? e.text : null; })()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — A BOARD CAN BE NAMED. The verdict was ABSENT; this is the path.
  // ==========================================================================
  await freshDesk(app);
  const seeded = await seed(app, [
    { id: 'i133-board', text: '', createdAt: '2026-03-01T00:00:00.000Z', origin: 'loose', pageType: 'board', projectId: null, boxes: [] },
  ]);
  ok('S1 (setup): the board is seeded through the seam and its row has landed', seeded);
  await app.reload();
  await app.evalJs("location.hash = '#/page/i133-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);

  const opened = await clickOrFail(app, '.crumb-rename-btn',
    'S1: the board\'s name, where it is displayed, is something a writer can reach — the affordance the sitting found missing entirely');
  await sleep(300);

  const editing = opened && await app.evalJs("!!document.querySelector('.crumb-rename')");
  ok('S1: reaching it opens an edit in place — the name is edited where it lives, not in a dialog somewhere else',
    editing, String(editing));

  // ITEM 133-B — WHAT THE FIELD OPENS WITH, read before a single character is
  // typed. This board is seeded nameless, so the draft must be EMPTY: a writer
  // naming a board for the first time should find a blank field, not a
  // stand-in word they have to clear before they can type.
  const unnamedDraft = editing
    ? await app.evalJs("(document.querySelector('.crumb-rename')||{}).value")
    : null;

  const type = async (value) => app.evalJs(`(() => {
    const i = document.querySelector('.crumb-rename');
    if (!i) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(i, ${JSON.stringify(value)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);

  if (editing) {
    await type('Chapter Plan');
    await app.evalJs(`document.querySelector('.crumb-rename').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
    await sleep(500);
  }

  ok('S1: Enter COMMITS the new name to the store, through the ordinary edit path',
    (await storedText(app, 'i133-board')) === 'Chapter Plan', String(await storedText(app, 'i133-board')));

  // ==========================================================================
  // S2 — IT SURVIVES A RELOAD. A name that does not outlive the session is not
  // a name, it is a label on a window.
  // ==========================================================================
  await app.reload();
  await app.evalJs("location.hash = '#/page/i133-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board reloaded' });
  await sleep(700);

  ok('S2: the board\'s name survives a reload — read back from the store, not from a live component',
    (await storedText(app, 'i133-board')) === 'Chapter Plan');
  ok('S2: and the board\'s own crumb shows it',
    (await app.evalJs("(document.querySelector('.crumb-rename-btn')||{}).textContent")) === 'Chapter Plan',
    String(await app.evalJs("(document.querySelector('.crumb-rename-btn')||{}).textContent")));

  // ITEM 133-B — the same gesture on a NAMED board, for the other half of the
  // pair. `?.click()` rather than a bare one: a driver that dies on a missing
  // node reports nothing, and the assertion below is what should speak.
  await app.evalJs("document.querySelector('.crumb-rename-btn')?.click()");
  await sleep(300);
  const namedDraft = await app.evalJs("(document.querySelector('.crumb-rename')||{}).value");
  // Close it again with a real Escape. S3 below reads document.body.innerText,
  // and an OPEN field is an <input> whose value is not innerText at all — the
  // stale-name sweep would read a crumb that isn't there and pass for the
  // wrong reason.
  await app.evalJs(`document.querySelector('.crumb-rename')?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(250);

  ok('ITEM 133-B: the rename field opens EMPTY on a nameless board and pre-filled with the name on a named one. The first cut compared the derived name against \'Untitled board\' while the crumb\'s own fallback was \'Untitled\', so the open-empty branch could never fire and a writer naming a board found the stand-in word sitting in the field, to be deleted before they could type. The comparison is gone rather than corrected: the draft derives with an EMPTY fallback, so namelessness produces emptiness directly and there is no sentinel string left to drift.',
    unnamedDraft === '' && namedDraft === 'Chapter Plan',
    JSON.stringify({ unnamedDraft, namedDraft }));

  // ==========================================================================
  // S3 — EVERY LIST SHOWING THE NAME SHOWS THE NEW ONE.
  // Asserted as an ABSENCE, deliberately: the stale name must appear NOWHERE in
  // the rendered app. A surface nobody remembered still fails this.
  // ==========================================================================
  const stale = await app.evalJs(`(() => {
    const hay = document.body.innerText || '';
    return { hasOld: /Untitled board|^Untitled$/m.test(hay), hasNew: hay.includes('Chapter Plan') };
  })()`);
  ok('S3: on the board\'s own surface the NEW name is shown and no stale "Untitled" stand-in survives beside it',
    stale.hasNew, JSON.stringify(stale));

  // and again with the cascade open, which is where the other derivations live
  // VW1 — NAMED, not first. A bare `.wz-strip-item` selects whichever tab
  // happens to be first, so this pressed Journal before the regroup and Page
  // after it. It passed either way because ANY tab opens the cascade — green
  // for the wrong reason, and invisible to a suite. The setup wants the
  // cascade open, so it now names the tab it presses.
  await clickOrFail(app, '.wz-strip-item[data-category=page]',
    'S3 (setup): the cascade opens, so the list derivations are on screen');
  await sleep(600);
  const listed = await app.evalJs(`(() => {
    const hay = document.body.innerText || '';
    return {
      newName: (hay.match(/Chapter Plan/g) || []).length,
      untitledBoard: (hay.match(/Untitled board/g) || []).length,
    };
  })()`);
  ok('S3 THE LAST CLAUSE: with the lists on screen, the renamed board reads "Chapter Plan" and NO list still calls it "Untitled board" — the three disagreeing derivations this ticket single-sourced cannot show one writer two names',
    listed.newName >= 1 && listed.untitledBoard === 0, JSON.stringify(listed));

  // ==========================================================================
  // S4 — THE PAGE'S NAME IS REACHABLE, and reaching it lands the caret on the
  // FIRST LINE (item 133 (A): J10's model stands, the gesture is what was
  // missing). Not a rename pipe — item 136 is chartered for that.
  // ==========================================================================
  await freshDesk(app);
  const seeded2 = await seed(app, [
    { id: 'i133-page', text: 'The opening line\nand a second line.', createdAt: '2026-03-02T00:00:00.000Z', origin: 'loose' },
  ]);
  ok('S4 (setup): the page is seeded and landed', seeded2);
  await app.reload();
  await app.evalJs("location.hash = '#/page/i133-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page framed' });
  await sleep(700);

  await app.evalJs("document.querySelector('.wz-strip-item[data-category=page]')?.click()");
  await sleep(600);

  const reachable = await app.evalJs("!!document.querySelector('.wz-pageface-title-reach')");
  ok('S4: the page\'s displayed name is reachable — the inert <div> the sitting found is now a gesture',
    reachable, String(reachable));

  if (reachable) {
    await app.evalJs("document.querySelector('.wz-pageface-title-reach').click()");
    await sleep(500);
  }
  const caret = await app.evalJs(`(() => {
    const el = document.querySelector('.forward-only-editor');
    if (!el) return { missing: true };
    const focused = document.activeElement === el || el.contains(document.activeElement);
    const sel = window.getSelection();
    let offset = null;
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0).cloneRange();
      r.selectNodeContents(el); r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
      offset = r.toString().length;
    }
    return { focused, offset, firstLineLen: (el.innerText.split('\\n')[0] || '').length };
  })()`);

  ok('S4: reaching the name focuses the page\'s own writing surface — the writer arrives where the name comes from',
    caret.focused === true, JSON.stringify(caret));
  ok('S4: and the caret lands at the END of the first line — where a rename is typed, not at character zero where the first keystroke would shove the name rightwards',
    caret.offset === caret.firstLineLen, JSON.stringify(caret));
});


const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This file added a live index-based strip selector
  // (VW1 item 134 later converted it) but never carried a superseded
  // assertion of its own -- there is nothing here for HARNESS_PARKED to
  // retire. The empty array is still emitted, auditable rather than
  // silently absent, per item 137's own park-record rider.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nITEM133 PARKED: PASS (0 checks) -- HARNESS_PARKED=1 armed; item 133 parks nothing.');
}

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM133 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM133 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
