// THE OUTDENT PARTNER — item 83 errata E3's held seam, ruled by Nick
// (2026-09-05): "a symmetric outdent arrow, the exact decrement of E3's
// paragraph indent, levels on F3's convention."
// Run: node scripts/harness/outdent.mjs   (from apps/desktop, dist-web built)
//
// THIS FILE COVERS THE PAIR, NOT JUST THE NEW HALF. E3's indent shipped with
// NO harness anywhere — grepping every file in this directory for 'indent',
// draftIndent or indentParagraphs found nothing before this one. So the
// round-trip checks below are the first coverage the indent has ever had, and
// they are written as claims about the PAIR: what indent does, outdent undoes.
//
// WHY THE PARTNER EXISTS, in one line, because it is the reason the checks are
// shaped this way: `indent` used to run through toggleLinePrefix, so a second
// press removed the tab and the writer's way back WAS the button. E3 made
// indent repeatable, which spent that. Undo still walks a level back
// (applyRailFormat records an atomic step per rail click, FX6 S1) — but undo is
// a general way back, not a dedicated one, and it is not discoverable from the
// drawer. A repeatable one-way door is a door this drawer BUILDS, not one it
// merely finds.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

const freshDraftPage = async (app) => {
  await freshDesk(app);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor framed' });
  await sleep(250);
  await app.click('Draft');
  await sleep(400);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(250);
};

// A press that FAILS A CHECK instead of killing the file. Against a product
// without the partner there is no Outdent button, and a bare .click() on a
// missing node throws — which aborts the run and reports nothing about the
// round-trip, the levels or the floor. The falsification pass is exactly when
// this file most needs to stay legible. (Third time this lane has met the
// class: ab2.mjs's label-coupled drivers, e4.mjs's absent grip, and now this.)
const press = async (app, title) => {
  const there = await app.evalJs(
    `!!document.querySelector('.wz-sliver-format .mode-tbtn[title=${JSON.stringify(title)}]')`);
  if (!there) {
    ok(`the Draft drawer offers a ${title} control to press`, false, `absent: .mode-tbtn[title="${title}"]`);
    return false;
  }
  await app.evalJs(
    `document.querySelector('.wz-sliver-format .mode-tbtn[title=${JSON.stringify(title)}]').click()`);
  return true;
};
const text = (app) => app.evalJs("document.querySelector('.forward-only-editor').innerText");

// Put the caret in the editor at a known place, then type a paragraph.
const write = async (app, body) => {
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(body);
  await sleep(300);
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the control exists, is named, and does not wear another control's mark
  // ==========================================================================
  await freshDraftPage(app);

  // The drawer has SEVERAL `.wz-sliver-format` rows (styling, line directives,
  // alignment). Find each row by what it CONTAINS rather than by index — an
  // index would silently start describing a different row the next time a row
  // is added above it, and then pass while asserting nothing.
  const controls = await app.evalJs(`(() => {
    const rows = [...document.querySelectorAll('.wz-sliver-format')];
    const row = rows.find(r => r.querySelector('.mode-tbtn[title="Indent"]'));
    const btns = row ? [...row.querySelectorAll('.mode-tbtn')] : [];
    const align = rows.find(r => r.querySelector('.mode-tbtn[title="Align left"]'))
      || rows.find(r => (r.getAttribute('aria-label') || '').toLowerCase().includes('align'));
    const alignBtns = align ? [...align.querySelectorAll('.mode-tbtn')] : [];
    return {
      rowCount: rows.length,
      titles: btns.map(b => b.title),
      glyphs: btns.map(b => (b.textContent || '').trim()),
      alignTitles: alignBtns.map(b => b.title),
      alignGlyphs: alignBtns.map(b => (b.textContent || '').trim()),
      outdentIndex: btns.findIndex(b => b.title === 'Outdent'),
      indentIndex: btns.findIndex(b => b.title === 'Indent'),
      sameRow: !!(row && row.querySelector('.mode-tbtn[title="Outdent"]')),
    };
  })()`);

  ok('S1: the Draft drawer offers an Outdent control, named in the lexicon (never a literal in JSX), in the SAME row as the Indent it partners',
    controls.outdentIndex >= 0 && controls.sameRow, JSON.stringify(controls));

  ok('S1: it sits immediately BEFORE Indent, so the pair reads left-to-right as a pair — the order the legacy bar has always used, and the direction this drawer\'s own alignment row already reads',
    controls.outdentIndex >= 0 && controls.indentIndex === controls.outdentIndex + 1,
    JSON.stringify({ outdentIndex: controls.outdentIndex, indentIndex: controls.indentIndex }));

  // THE GLYPH COLLISION CHECK. The legacy bar's outdent is ⇤ — but ⇤ is already
  // Align left's mark in THIS drawer. A control wearing another control's mark
  // in the same panel is a defect however correct its behaviour, so the partner
  // takes ← , mirroring Indent's own → .
  const outGlyph = controls.outdentIndex >= 0 ? controls.glyphs[controls.outdentIndex] : null;
  ok('S1: and it does NOT wear a glyph already spoken for elsewhere in the same panel — the alignment row owns ⇤/⇥, so the partner mirrors Indent\'s arrow instead of borrowing the legacy bar\'s mark',
    outGlyph !== null && !controls.alignGlyphs.includes(outGlyph),
    JSON.stringify({ outdentGlyph: outGlyph, alignGlyphs: controls.alignGlyphs }));

  // ==========================================================================
  // S2 — THE ROUND TRIP. What indent does, outdent undoes, exactly.
  // ==========================================================================
  await write(app, 'One paragraph of prose.');
  const plain = await text(app);

  await press(app, 'Indent');
  await sleep(300);
  const indented = await text(app);
  ok('S2 (the pair, indent half — first coverage this control has ever had): one press adds one leading tab',
    indented === '\t' + plain, JSON.stringify({ plain, indented }));

  await press(app, 'Outdent');
  await sleep(300);
  const back = await text(app);
  ok('S2 THE ROUND TRIP: indent then outdent returns the paragraph to EXACTLY what it was, character for character — the way back is the drawer again, not undo alone',
    back === plain, JSON.stringify({ plain, back }));

  // ==========================================================================
  // S3 — LEVELS, on F3's leading-tab convention: the level IS the tab count.
  // ==========================================================================
  await press(app, 'Indent');
  await press(app, 'Indent');
  await sleep(350);
  const twice = await text(app);
  ok('S3: indent is repeatable — two presses are two tabs (the level is the tab count, nothing stored)',
    twice === '\t\t' + plain, JSON.stringify({ twice }));

  await press(app, 'Outdent');
  await sleep(300);
  const oneBack = await text(app);
  ok('S3: outdent removes exactly ONE level per press — it decrements, never flattens to zero in one go',
    oneBack === '\t' + plain, JSON.stringify({ oneBack }));

  // ==========================================================================
  // S4 — THE FLOOR. Zero is a floor, not a cliff: pressing past it must not
  // eat real text. This is the check that would catch a slice() off by one.
  // ==========================================================================
  await press(app, 'Outdent');
  await sleep(250);
  const atZero = await text(app);
  await press(app, 'Outdent');
  await press(app, 'Outdent');
  await sleep(350);
  const belowZero = await text(app);

  ok('S4: outdent lands the paragraph back at zero indentation',
    atZero === plain, JSON.stringify({ atZero }));

  ok('S4 THE FLOOR HOLDS: pressing Outdent again at zero is a NO-OP — it does not eat the paragraph\'s first characters, which is exactly what an unguarded slice() of the tab length would do',
    belowZero === plain, JSON.stringify({ plain, belowZero }));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nOUTDENT VERIFY: PASS (${checks.length} checks)`
  : `\nOUTDENT VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
