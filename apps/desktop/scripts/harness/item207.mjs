// ITEM 207 (207a) — THE TYPE CONTROL, RENDERED. A committed CDP scenario; needs a box turn and a fresh `pnpm run build:web`.
//   Run: node apps/desktop/scripts/harness/item207.mjs      (from the repo root, ABSOLUTE worktree path)
// item207-core.mjs proves what needs no engine (the ladder, the roster table, the build). This file proves what does:
//   · the control on each surface has EXACTLY the elements the law allows (his "as minimal as possible", made assertable);
//   · choosing writes only the keys it should and the page renders in the chosen face at the chosen size;
//   · "11 = today": an untouched page's editor style is the prior build's two strings;
//   · the paper's rect is byte-identical across every face (page primacy) - and the chars-per-line spread is RE-MEASURED
//     in the real engine against S0's table (Courier Prime reported separately, the worst case);
//   · a card's face and size write to THAT Box only.
// Every press is a hit-tested real pointer (trustedDispatch). Every fixture is seeded through the app's own seams.
// Drivers never assume existence: a missing node FAILS a check and the run goes on.
import { withHarness } from '../runtime-verify.mjs';
import { trustedDispatch, hittablePointBy } from '../trusted-point.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
// Printed AS THEY LAND: a driver that dies mid-run must not take the checks already made with it.
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 260)}]` : ''}`); };
const NINE = ['Crimson Pro', 'Lora', 'EB Garamond', 'Source Serif 4', 'Times New Roman', 'Figtree', 'Atkinson Hyperlegible', 'Arial', 'Courier Prime'];
// S0's predicted characters per line vs Crimson Pro (docs/menus/item207-s0-measure.md §2), for the real-engine re-measure.
const S0_CPL_VS_TODAY = { 'Crimson Pro': 1, Lora: 0.85, 'EB Garamond': 1.05, 'Source Serif 4': 0.84, 'Times New Roman': 0.99, Figtree: 0.90, 'Atkinson Hyperlegible': 0.91, Arial: 0.90, 'Courier Prime': 0.65 };
const PROSE = 'The garden had been quiet for a long time, and nobody who walked through it that autumn could have said exactly when the quiet began. She noticed the gate first, then the path, then the way the light fell across the wet stones. ';

const entryRow = async (app, id) => {
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()');
  const rows = (await app.localJSON('writer-studio-journal-entries')) || [];
  return rows.find((r) => r.id === id) || null;
};
const sizeOfEditor = (app) => app.evalJs(`(() => { const e = document.querySelector('.forward-only-editor'); return e ? parseFloat(getComputedStyle(e).fontSize) : null; })()`);
const familyOfEditor = (app) => app.evalJs(`(() => { const e = document.querySelector('.forward-only-editor'); return e ? getComputedStyle(e).fontFamily : null; })()`);
const scaleNow = (app) => app.evalJs(`parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--paper-scale')) || 1`);
const typeShape = (app) => app.evalJs(`(() => {
  const t = document.querySelector('.wz-type'); if (!t) return null;
  const rows = [...document.querySelectorAll('.wz-type-row')].map(r => r.textContent);
  return { present: true, buttons: t.querySelectorAll('button').length, inputs: t.querySelectorAll('input').length, listOpen: !!t.querySelector('.wz-type-list'),
    rows, text: t.textContent, stepDisabled: [...t.querySelectorAll('.wz-type-step')].map(b => b.getAttribute('aria-disabled')) };
})()`);
const rectOf = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100); })()`);
const press = (app, expr, what) => trustedDispatch(app, expr, what, { report: ok });
// FONT-SPAN: what the default section observed, for the parked leg's records (the CD4 / dispPass pattern)
const i207Parks = {};
const typeInto = async (app, value) => {
  await press(app, "document.querySelector('.wz-type-num')", 'the number field (focus)');
  await app.keyCombo('a');
  await app.type(String(value));
  await app.key('Enter');
  await sleep(250);
};
const pickFace = async (app, name) => {
  // FONT-SPAN (2026-10-15): in Draft and a card the roster is SHOWN (the approved font-choices mockup), so there is no face button to
  // open first; where one exists (Free Write, Revise) it is pressed as before. A driver change only - every assertion stands.
  // TOOLS #10 item 9: in the scoped form the list is always mounted but COLLAPSED (hidden) until the face button is pressed - so "open" means no VISIBLE list. Driver change only.
  if (await app.evalJs("!!document.querySelector('.wz-type-face') && ![...document.querySelectorAll('.wz-type-list')].some((u) => !u.hidden && u.getBoundingClientRect().height > 0)")) {
    await press(app, "document.querySelector('.wz-type-face')", `the face button (open, for ${name})`);
  }
  await sleep(120);
  await press(app, `[...document.querySelectorAll('.wz-type-row')].find(r => r.textContent === ${JSON.stringify(name)})`, `the roster row "${name}"`);
  await sleep(500);
};

const freshDesk = async (app, w, h) => {
  await app.emulateDpr(1, w, h);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
};
// A prose page in a given mode, optionally already dressed (pageSettings through the durable patch seam).
const openPage = async (app, { id, mode, w = 1280, h = 900, settings = null, text = PROSE.repeat(4) }) => {
  await freshDesk(app, w, h);
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: ${JSON.stringify(text)}, createdAt: new Date().toISOString(), origin: null, source: 'page' })`);
  if (settings) await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(id)}, { pageSettings: ${JSON.stringify(settings)} })`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)})`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `${mode} page mounted` });
  await app.emulateDpr(1, w, h);
  await sleep(500);
};
const openDrawer = async (app) => {
  // A CLOSED drawer keeps its body mounted (aria-hidden, pointer-events none), so the control's presence is not "open":
  // read the panel's own state, and press the grip only when it is shut.
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') await press(app, "document.querySelector('.wz-sliver-grip')", 'the tool drawer grip');
  await sleep(500);
};

await withHarness(async (app) => {
 try {
  // ==== 1 · THE SHAPE OF THE CONTROL ON EACH SURFACE (his law, made assertable) ====================================
  await openPage(app, { id: 'i207-fw', mode: 'journal' });
  await openDrawer(app);
  const fw = await typeShape(app);
  ok('FREE WRITE: the Type control is mounted', !!fw, JSON.stringify(fw));
  if (fw) {
    ok('FREE WRITE: EXACTLY the smallest form — a face button and a `-` `+` pair (3 buttons), NO number field', fw.buttons === 3 && fw.inputs === 0, JSON.stringify({ buttons: fw.buttons, inputs: fw.inputs }));
    ok('FREE WRITE: no visible caption or helper text — the control\'s text is the face name and the two step glyphs, nothing else', /^[A-Za-z0-9 ]+−\+$/.test(fw.text.replace(/\s+/g, ' ').trim().replace(/ (?=−)/, '')) || fw.text.length < 40, JSON.stringify(fw.text));
    await press(app, "document.querySelector('.wz-type-face')", 'the face button (Free Write roster)');
    await sleep(150);
    const open = await typeShape(app);
// ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: the font list's first row is "Default (<face>)", and Source Sans 3 + Titillium Web join the roster). Kept VERBATIM below, no longer run; successor follows. ----
    // ok('FREE WRITE: the roster lists the nine faces, in order, and has NO "Add a font…" row (his Q2)', open && JSON.stringify(open.rows) === JSON.stringify(NINE) && !/add a font/i.test(open.text), JSON.stringify(open && open.rows));
    // ------------------------------------------------------------------
    const ELEVEN = ['Crimson Pro', 'Lora', 'EB Garamond', 'Source Serif 4', 'Times New Roman', 'Figtree', 'Source Sans 3', 'Titillium Web', 'Atkinson Hyperlegible', 'Arial', 'Courier Prime'];
    ok('FREE WRITE [item-10 successor]: the list opens on "Default (<face>)", then the eleven faces in order, and has NO "Add a font..." row (his Q2)', open && /^Default \(.+\)$/.test(open.rows[0] || '') && JSON.stringify(open.rows.slice(1)) === JSON.stringify(ELEVEN) && !/add a font/i.test(open.text), JSON.stringify(open && open.rows));
    const rowFonts = await app.evalJs(`[...document.querySelectorAll('.wz-type-row')].map(r => [r.textContent, getComputedStyle(r).fontFamily])`);
// ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: the font list's first row is "Default (<face>)", and Source Sans 3 + Titillium Web join the roster). Kept VERBATIM below, no longer run; successor follows. ----
    // ok('FREE WRITE: each roster row is SET IN ITS OWN FACE', Array.isArray(rowFonts) && rowFonts.length === 9 && rowFonts.every(([n, f]) => f.replace(/["']/g, '').includes(n === 'Crimson Pro' ? 'Crimson Pro' : n === 'Lora' ? 'Lora' : n === 'EB Garamond' ? 'EB Garamond' : n === 'Source Serif 4' ? 'Source Serif 4' : n)), JSON.stringify(rowFonts));
    // ------------------------------------------------------------------
    ok('FREE WRITE [item-10 successor]: each roster row is SET IN ITS OWN FACE (the Default row in the theme\'s own prose face)', Array.isArray(rowFonts) && rowFonts.length === 12 && rowFonts.slice(1).every(([n, f]) => f.replace(/["']/g, '').includes(n)) && /Garamond|Crimson|Titillium|Source Sans/.test(rowFonts[0][1].replace(/["']/g, '')), JSON.stringify(rowFonts));
    await app.key('Escape');
    await sleep(100);
  }

  await openPage(app, { id: 'i207-dr', mode: 'drafting' });
  await openDrawer(app);
  const dr = await typeShape(app);
  // ---- PARKED - SUPERSEDED by font-span (Nick approved the font-choices mockup, cursor/font-choices @ 6cc5f529, 2026-10-15) ----
  // Kept VERBATIM and no longer run. Draft is the mode with styling tools, so its Typeface section now carries the two scopes
  // ("Selection" / "Whole document") over the roster SHOWN as a list - no face button. Record in this file's parked section.
  // ok('DRAFT: the Type control is mounted, full form — a face button, `-` `+` (3 buttons) and ONE number field', !!dr && dr.buttons === 3 && dr.inputs === 1, JSON.stringify(dr && { buttons: dr.buttons, inputs: dr.inputs }));
  // ------------------------------------------------------------------
  const drScoped = await app.evalJs(`(() => { const t = document.querySelector('.wz-sliver .wz-type'); if (!t) return null; return { buttons: t.querySelectorAll('button').length, inputs: t.querySelectorAll('input').length,
    faceButton: !!t.querySelector('.wz-type-face'), scopes: [...t.querySelectorAll('.wz-type-scope')].map(b => b.textContent), rows: t.querySelectorAll('.wz-type-list-inline .wz-type-row').length }; })()`);
  i207Parks.draftForm = drScoped;
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 9 (the font list is collapsed by default): the scoped form now has a face button that opens the list. Kept VERBATIM, no longer run:
  // ok('DRAFT [font-span successor]: the Typeface control is the scoped form - "Selection" / "Whole document" over the nine faces shown as a list, `-` `+` and ONE number field, no face button',
  //   !!drScoped && drScoped.buttons === 4 && drScoped.inputs === 1 && !drScoped.faceButton && JSON.stringify(drScoped.scopes) === JSON.stringify(['Selection', 'Whole document']) && drScoped.rows === 9, JSON.stringify(drScoped));
  // ------------------------------------------------------------------
  ok('DRAFT [item-9 successor]: the Typeface control is the scoped form - "Selection" / "Whole document", a face button, Default + the eleven faces as a list COLLAPSED by default, `-` `+` and ONE number field',
    !!drScoped && drScoped.buttons === 5 && drScoped.inputs === 1 && drScoped.faceButton && JSON.stringify(drScoped.scopes) === JSON.stringify(['Selection', 'Whole document']) && drScoped.rows === 12, JSON.stringify(drScoped));
  const collapsed = await app.evalJs(`(() => { const t = document.querySelector('.wz-sliver .wz-type'); const ul = t.querySelector('.wz-type-list-inline'); const b = t.querySelector('.wz-type-face'); return { shown: !!ul && ul.getBoundingClientRect().height > 0, hidden: ul && ul.hidden, expanded: b && b.getAttribute('aria-expanded') }; })()`);
  ok('DRAFT [item 9]: the face list is COLLAPSED by default - hidden, no height, the face button aria-expanded=false', !!collapsed && !collapsed.shown && collapsed.hidden === true && collapsed.expanded === 'false', JSON.stringify(collapsed));
  await app.evalJs("document.querySelector('.wz-sliver .wz-type-face').click()"); await sleep(250);
  const expanded = await app.evalJs(`(() => { const t = document.querySelector('.wz-sliver .wz-type'); const ul = t.querySelector('.wz-type-list-inline'); const rows = [...ul.querySelectorAll('.wz-type-row')]; return { shown: ul.getBoundingClientRect().height > 0, rows: rows.filter((r) => r.getBoundingClientRect().height > 0).length, expanded: t.querySelector('.wz-type-face').getAttribute('aria-expanded') }; })()`);
  ok('DRAFT [item 9]: pressing the face button opens the list (the twelve rows - Default + eleven - have height, aria-expanded=true)', !!expanded && expanded.shown && expanded.rows === 12 && expanded.expanded === 'true', JSON.stringify(expanded));
  await app.key('Escape'); await sleep(250);
  const closedAgain = await app.evalJs("(() => { const ul = document.querySelector('.wz-sliver .wz-type .wz-type-list-inline'); return { hidden: ul.hidden, h: Math.round(ul.getBoundingClientRect().height) }; })()");
  ok('DRAFT [item 9]: Esc closes it again', !!closedAgain && closedAgain.hidden === true && closedAgain.h === 0, JSON.stringify(closedAgain));

  await openPage(app, { id: 'i207-rv', mode: 'revise' });
  await openDrawer(app);
  const rv = await typeShape(app);
  ok('REVISE: the Type control is mounted, full form (112-A\'s empty drawer takes its one tenant)', !!rv && rv.buttons === 3 && rv.inputs === 1, JSON.stringify(rv && { buttons: rv.buttons, inputs: rv.inputs }));

  // ==== 2 · "11 = TODAY" — an untouched page's editor style is the prior build's two strings =======================
  await openPage(app, { id: 'i207-untouched', mode: 'drafting' });
  const untouched = await app.evalJs(`(() => { const w = document.querySelector('.forward-only-editor-wrap'); return w ? { ff: w.style.fontFamily, fs: w.style.fontSize } : null; })()`);
  // ---- PARKED - SUPERSEDED by page-size (Fable's ruling a, Oct 23: the page's number is REAL POINTS IN PAGE UNITS - 12 = 16px at page scale 1, a NEW
  // page defaults to 12, and the page LAYS OUT at scale 1 and is PAINTED at its scale by a transform, so the editor's computed size is n x 4/3 px at
  // every screen). An untouched page now writes `calc(12 * var(--wz-pt, 1.33333px))` and computes 16px. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  //
  // ok('11 = TODAY: a page that never chose keeps the editor\'s two prior style strings (`var(--font-prose)` and `calc(17px * var(--paper-scale))`) byte-for-byte',
  //   untouched && untouched.ff === 'var(--font-prose)' && untouched.fs === 'calc(17px * var(--paper-scale))', JSON.stringify(untouched));
  // const scale = await scaleNow(app);
  // const base = await sizeOfEditor(app);
  // ok('11 = TODAY: the untouched editor renders at 17px x the paper scale (computed)', base !== null && Math.abs(base - 17 * scale) < 0.05, `${base}px at scale ${scale}`);
  // ------------------------------------------------------------------
  const scale = await scaleNow(app); void scale;   // (kept: the parked SIZE line below read it; the prose page no longer scales by --paper-scale)
  const base = await sizeOfEditor(app);
  i207Parks.untouched = { untouched, base };
  ok('12 = THE PAGE DEFAULT [page-size successor]: a page that never chose writes the editor\'s prose face and 12 page points - `var(--font-prose)` and `calc(12 * var(--wz-pt, 1.33333px))`',
    !!untouched && untouched.ff === 'var(--font-prose)' && untouched.fs === 'calc(12 * var(--wz-pt, 1.33333px))', JSON.stringify(untouched));
  ok('12 = THE PAGE DEFAULT [page-size successor]: the untouched editor computes 16px - 12 points laid out at page scale 1 (the page is painted at its scale)', base !== null && Math.abs(base - 16) < 0.05, `${base}px`);
  const row0 = await entryRow(app, 'i207-untouched');
  ok('11 = TODAY: an untouched page carries NO face or size key on disk', row0 && !(row0.pageSettings && ('face' in row0.pageSettings || 'size' in row0.pageSettings)), JSON.stringify(row0 && row0.pageSettings));

  // ==== 3 · SIZE — the buttons, the typed number, the limits, and what is written ===================================
  await openDrawer(app);
  const numAt = () => app.evalJs("(document.querySelector('.wz-type-num') || {}).value");
  const labelNow = await app.evalJs(`(() => { const b = document.querySelector('.wz-type-face'); const e = document.querySelector('.forward-only-editor'); if (!b || !e) return null;
    const first = getComputedStyle(e).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/ Variable$/, '');
    return { label: b.textContent, rendered: first, buttonFamily: getComputedStyle(b).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/ Variable$/, '') }; })()`);
  // ---- PARKED - SUPERSEDED by font-span (the approved mockup, 2026-10-15): Draft has no face button now; the current face is the
  // roster row in brass. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  // ok('LABEL: on a page that never chose, the face button names the face that ACTUALLY renders (the first family the editor computes) and is set in it',
  //   labelNow && labelNow.label === labelNow.rendered && labelNow.buttonFamily === labelNow.rendered, JSON.stringify(labelNow));
  // ------------------------------------------------------------------
  void labelNow;
  const brassNow = await app.evalJs(`(() => { const r = document.querySelector('.wz-type-row[data-current="true"]'); const e = document.querySelector('.forward-only-editor'); if (!r || !e) return null;
    const first = getComputedStyle(e).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/ Variable$/, '');
    return { label: r.textContent, rendered: first, rowFamily: getComputedStyle(r).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/ Variable$/, ''), color: getComputedStyle(r).color,
      brass: getComputedStyle(document.documentElement).getPropertyValue('--brass').trim() }; })()`);
  i207Parks.label = brassNow;
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: the list's first row is "Default (<face>)"): on a page that never chose, the brass row is now the DEFAULT row, not a roster row.
  // Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it must now fail, for exactly that reason).
  // ok('LABEL [font-span successor]: on a page that never chose, the BRASS row of the roster names the face that ACTUALLY renders and is set in it',
  // !!brassNow && brassNow.label === brassNow.rendered && brassNow.rowFamily === brassNow.rendered, JSON.stringify(brassNow));
  // ------------------------------------------------------------------
  ok('LABEL [item-10 successor]: on a page that never chose, the BRASS row is the Default row, it reads "Default (<the face that ACTUALLY renders>)", and it is set in that face',
    !!brassNow && brassNow.label === `Default (${brassNow.rendered})` && brassNow.rowFamily === brassNow.rendered, JSON.stringify(brassNow));
  // Fable's ruling 1 (Oct 28): the label must NAME a face - never "Default ()". The line above builds its expectation from the DOM read, so a blank read would pass it; this pins the per-theme table (THEME_DEFAULT_FACE).
  ok('LABEL [Oct 28 ruling 1]: the Default row is never empty - it names EB Garamond / Titillium Web / Source Sans 3 (serif voice, by theme) or Figtree / Chakra Petch / Atkinson Hyperlegible (sans voice)',
    !!brassNow && /^Default \((EB Garamond|Titillium Web|Source Sans 3|Figtree|Chakra Petch|Atkinson Hyperlegible)\)$/.test(brassNow.label || ''), JSON.stringify(brassNow));
  ok('LABEL [parked record]: the ORIGINAL (the brass row\'s text IS the face name) now fails ONLY because the brass row is "Default (<face>)"', !!brassNow && brassNow.label !== brassNow.rendered && brassNow.label === `Default (${brassNow.rendered})`, JSON.stringify(brassNow));
  // ---- PARKED - SUPERSEDED by page-size (Fable's ruling a, Oct 23: the page's number is REAL POINTS IN PAGE UNITS - 12 = 16px at page scale 1, a NEW
  // page defaults to 12, and the page LAYS OUT at scale 1 and is PAINTED at its scale by a transform, so the editor's computed size is n x 4/3 px at
  // every screen). The field opens at 12; `+` goes to 13, drawn 13 x 4/3 px; 13 is written. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  //
  // ok('SIZE: the number field opens at 11', (await numAt()) === '11', String(await numAt()));
  // await press(app, "document.querySelectorAll('.wz-type-step')[1]", 'the `+` button');
  // await sleep(300);
  // ok('SIZE: `+` from 11 shows 12, and the editor renders 17 x 12/11 x the scale', (await numAt()) === '12' && Math.abs((await sizeOfEditor(app)) - 17 * (12 / 11) * scale) < 0.06, `${await numAt()} / ${await sizeOfEditor(app)}px`);
  // const r12 = await entryRow(app, 'i207-untouched');
  // ok('SIZE: choosing wrote pageSettings.size = 12 (points, not a step index) and NO face key', r12 && r12.pageSettings && r12.pageSettings.size === 12 && !('face' in r12.pageSettings), JSON.stringify(r12 && r12.pageSettings));
  // ------------------------------------------------------------------
  const opens = await numAt();
  ok('SIZE [page-size successor]: the number field opens at 12 (the page default)', opens === '12', String(opens));
  await press(app, "document.querySelectorAll('.wz-type-step')[1]", 'the `+` button');
  await sleep(300);
  const n13 = await numAt(); const px13 = await sizeOfEditor(app);
  ok('SIZE [page-size successor]: `+` from 12 shows 13, and the editor computes 13 page points (13 x 4/3 px)', n13 === '13' && px13 !== null && Math.abs(px13 - 13 * 4 / 3) < 0.06, `${n13} / ${px13}px`);
  const r12 = await entryRow(app, 'i207-untouched');
  ok('SIZE [page-size successor]: choosing wrote pageSettings.size = 13 (points, not a step index) and NO face key', !!r12 && !!r12.pageSettings && r12.pageSettings.size === 13 && !('face' in r12.pageSettings), JSON.stringify(r12 && r12.pageSettings));
  i207Parks.size = { opens, n13, px13, written: r12 && r12.pageSettings };
  await typeInto(app, '24');
  ok('SIZE: a typed 24 is taken', (await numAt()) === '24' && ((await entryRow(app, 'i207-untouched')) || {}).pageSettings?.size === 24, String(await numAt()));
  await press(app, "document.querySelectorAll('.wz-type-step')[1]", 'the `+` button (from 24)');
  await sleep(250);
  ok('SIZE: `+` from a typed 24 goes to 26 (the two-point band)', (await numAt()) === '26', String(await numAt()));
  await typeInto(app, '10.26');
  ok('SIZE: a typed 10.26 rounds to the nearest half point, 10.5', (await numAt()) === '10.5', String(await numAt()));
  await typeInto(app, '119');
  ok('SIZE: a typed 119 is accepted; `+` is INERT there (aria-disabled) and `-` returns 118', (await numAt()) === '119' && (await typeShape(app)).stepDisabled[1] === 'true', JSON.stringify((await typeShape(app)).stepDisabled));
  await press(app, "document.querySelectorAll('.wz-type-step')[0]", 'the `-` button (from 119)');
  await sleep(250);
  ok('SIZE: `-` from 119 lands on 118', (await numAt()) === '118', String(await numAt()));
  await typeInto(app, '5');
  ok('SIZE: a typed 5 clamps to the floor, 6, and `-` is then inert', (await numAt()) === '6' && (await typeShape(app)).stepDisabled[0] === 'true', String(await numAt()));
  await typeInto(app, 'abc');
  ok('SIZE: a non-number is refused and the previous value (6) is kept', (await numAt()) === '6', String(await numAt()));

  // ==== 4 · FACE — choosing writes the face, the page renders in it, and a non-eager face is fetched on choose ======
  await pickFace(app, 'Lora');
  const lora = await entryRow(app, 'i207-untouched');
  ok('FACE: choosing Lora wrote pageSettings.face = { name: Lora, generic: serif, source: bundled }', lora && lora.pageSettings && lora.pageSettings.face && lora.pageSettings.face.name === 'Lora' && lora.pageSettings.face.generic === 'serif' && lora.pageSettings.face.source === 'bundled', JSON.stringify(lora && lora.pageSettings && lora.pageSettings.face));
  ok('FACE: the editor renders in Lora (computed font-family)', /Lora/.test(String(await familyOfEditor(app))), String(await familyOfEditor(app)));
  ok('FACE: Lora\'s CSS was fetched ON CHOOSE — the family is now loaded in the document', await app.evalJs(`document.fonts.check('16px "Lora Variable"')`), '');
  await pickFace(app, 'Times New Roman');
  const tnr = await entryRow(app, 'i207-untouched');
  ok('FACE: Times New Roman is stored as source "named" with fallback Tinos (installed-first; never shipped)', tnr && tnr.pageSettings && tnr.pageSettings.face && tnr.pageSettings.face.name === 'Times New Roman' && tnr.pageSettings.face.source === 'named' && tnr.pageSettings.face.fallback === 'Tinos', JSON.stringify(tnr && tnr.pageSettings));
  ok('FACE: the editor\'s font-family names Times New Roman first, Tinos next', /^"?'?Times New Roman/.test(String(await familyOfEditor(app)).replace(/^["']/, '')) && /Tinos/.test(String(await familyOfEditor(app))), String(await familyOfEditor(app)));

  // ==== 5 · RENDERING IN EVERY MODE (206: rendering is not styling) =================================================
  const dressed = { margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' },
    face: { name: 'Lora', generic: 'serif', source: 'bundled' }, size: 14 };
  const inMode = {};
  for (const mode of ['journal', 'drafting', 'revise']) {
    await openPage(app, { id: 'i207-modes', mode, settings: dressed });
    inMode[mode] = { family: await familyOfEditor(app), size: await sizeOfEditor(app), scale: await scaleNow(app) };
  }
  // ---- PARKED - SUPERSEDED by page-size (Fable's ruling a, Oct 23: the page's number is REAL POINTS IN PAGE UNITS - 12 = 16px at page scale 1, a NEW
  // page defaults to 12, and the page LAYS OUT at scale 1 and is PAINTED at its scale by a transform, so the editor's computed size is n x 4/3 px at
  // every screen). Lora at 14 computes 14 x 4/3 px in every mode. Kept VERBATIM and no longer run; record in this file's parked section, successor below.
  //
  // ok('EVERY MODE: a page dressed in Lora at 14 renders in Lora at 14 in Free Write, Draft and Revise — identically', Object.values(inMode).every((m) => /Lora/.test(m.family) && Math.abs(m.size - 17 * (14 / 11) * m.scale) < 0.06), JSON.stringify(inMode));
  // ------------------------------------------------------------------
  i207Parks.modes = inMode;
  ok('EVERY MODE [page-size successor]: a page dressed in Lora at 14 renders in Lora at 14 page points (14 x 4/3 px) in Free Write, Draft and Revise - identically',
    Object.values(inMode).every((m) => /Lora/.test(m.family) && Math.abs(m.size - 14 * 4 / 3) < 0.06), JSON.stringify(inMode));

  // ==== 6 · THE PAPER NEVER MOVES, AND THE MEASURE IS RE-MEASURED IN THE REAL ENGINE ================================
  for (const w of [1100, 1280, 1920]) {
    await openPage(app, { id: `i207-rect-${w}`, mode: 'drafting', w, h: 900 });
    await openDrawer(app);
    const before = await rectOf(app, '.mode-pagecol');
    const cpl = {};
    let rectStable = true; const rects = [];
    for (const name of NINE) {
      await pickFace(app, name);
      const r = await rectOf(app, '.mode-pagecol'); rects.push(r);
      if (JSON.stringify(r) !== JSON.stringify(before)) rectStable = false;
      // characters per line, AVERAGED over the first 8 lines: a single first line moves by a whole word (about 6 characters,
      // ~8%), which is wider than the tolerance this check asserts.
      cpl[name] = await app.evalJs(`(() => {
        const ed = document.querySelector('.forward-only-editor'); if (!ed) return null;
        const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n = null, t; while ((t = w.nextNode())) { if ((t.textContent || '').length > 120) { n = t; break; } }
        if (!n) return null;
        const rg = document.createRange(); rg.setStart(n, 0); rg.setEnd(n, 1); let top = rg.getBoundingClientRect().top; const starts = [0];
        for (let i = 1; i < n.textContent.length && starts.length < 9; i++) { rg.setStart(n, i); rg.setEnd(n, i + 1); const tp = rg.getBoundingClientRect().top; if (Math.abs(tp - top) > 4) { starts.push(i); top = tp; } }
        if (starts.length < 9) return null;
        return Math.round((starts[8] / 8) * 10) / 10;
      })()`);
    }
    ok(`PAGE PRIMACY @${w}: the paper's rect is byte-identical across all nine faces`, rectStable, JSON.stringify({ before, differing: rects.filter((r) => JSON.stringify(r) !== JSON.stringify(before)).slice(0, 2) }));
    const crimson = cpl['Crimson Pro'];
    ok(`MEASURE @${w}: characters per line was measured for every face (a null is a blind probe, not a pass)`, NINE.every((n) => typeof cpl[n] === 'number'), JSON.stringify(cpl));
    if (typeof crimson === 'number') {
      const off = NINE.filter((n) => typeof cpl[n] === 'number' && Math.abs(cpl[n] / crimson - S0_CPL_VS_TODAY[n]) > 0.06);
      ok(`MEASURE @${w}: every face's characters per line is within 6% of S0's browserless prediction (relative to Crimson Pro)`, off.length === 0, JSON.stringify({ off, cpl }));
    }
    // eslint-disable-next-line no-console
    console.log(`REPORT @${w}: chars per line ${JSON.stringify(cpl)}  ·  Courier Prime (the worst case) ${cpl['Courier Prime']} vs Crimson Pro ${crimson}`);
  }

  // ==== 7 · THE CARD ================================================================================================
  await freshDesk(app, 1280, 900);
  await app.evalJs(`window.wrizoCreateJournalPage({ id: 'i207-board', text: 'Board', pageType: 'board', createdAt: new Date().toISOString(), origin: null,
    boxes: [ { id: 'c1', kind: 'text', x: 0.05, y: 0.06, w: 0.26, h: 0.14, z: 1, text: 'First card' }, { id: 'c2', kind: 'text', x: 0.40, y: 0.06, w: 0.26, h: 0.14, z: 2, text: 'Second card' } ] })`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/i207-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await app.emulateDpr(1, 1280, 900);
  await sleep(500);
  const cardBase = await app.evalJs(`(() => { const e = document.querySelector('.board-text'); return e ? { fs: parseFloat(getComputedStyle(e).fontSize), attr: e.getAttribute('style') } : null; })()`);
  ok('CARD: a card that never chose renders at 15px with NO style attribute at all (11 = today, byte-identical)', cardBase && cardBase.fs === 15 && !cardBase.attr, JSON.stringify(cardBase));
  const cardPt = await hittablePointBy(app, "document.querySelector('.board-box .board-text')");
  if (cardPt && cardPt.found) {
    await app.doubleClick(cardPt.x, cardPt.y);
    await sleep(500);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'card popup open' }).catch(() => ok('DRIVER: the card popup opened', false, 'timed out'));
    if (!(await app.evalJs("!!document.querySelector('.board-popup-dock .wz-type')"))) await press(app, "document.querySelector('.board-popup-dock-grip')", "the card's styling dock grip");
    await sleep(300);
    const cs = await app.evalJs(`(() => { const t = document.querySelector('.board-popup-dock .wz-type'); return t ? { buttons: t.querySelectorAll('button').length, inputs: t.querySelectorAll('input').length } : null; })()`);
    // ---- PARKED - SUPERSEDED by font-span (the approved mockup's card scene, 2026-10-15): the dock's Typeface control carries the two
    // scopes ("Selection" / "Whole card") over the roster shown as a list - no face button. Kept VERBATIM, no longer run.
    // ok('CARD: the styling dock carries the smallest form — a face button and `-` `+` (3 buttons), no number field', cs && cs.buttons === 3 && cs.inputs === 0, JSON.stringify(cs));
    // ------------------------------------------------------------------
    void cs;
    const csScoped = await app.evalJs(`(() => { const t = document.querySelector('.board-popup-dock .wz-type'); if (!t) return null; return { buttons: t.querySelectorAll('button').length, inputs: t.querySelectorAll('input').length,
    faceButton: !!t.querySelector('.wz-type-face'), scopes: [...t.querySelectorAll('.wz-type-scope')].map(b => b.textContent), rows: t.querySelectorAll('.wz-type-list-inline .wz-type-row').length }; })()`);
    i207Parks.cardForm = csScoped;
    // ---- PARKED - SUPERSEDED by TOOLS #10 item 9 (the list is collapsed by default; the scoped form has a face button). Kept VERBATIM, no longer run:
    // ok('CARD [font-span successor]: the dock carries the scoped small form - "Selection" / "Whole card" over the nine faces, `-` `+`, no number field, no face button',
    //   !!csScoped && csScoped.buttons === 4 && csScoped.inputs === 0 && !csScoped.faceButton && JSON.stringify(csScoped.scopes) === JSON.stringify(['Selection', 'Whole card']) && csScoped.rows === 9, JSON.stringify(csScoped));
    // ------------------------------------------------------------------
    ok('CARD [item-9 successor]: the dock carries the scoped small form - "Selection" / "Whole card", a face button (Default + the eleven faces COLLAPSED behind it), `-` `+`, no number field',
      !!csScoped && csScoped.buttons === 5 && csScoped.inputs === 0 && csScoped.faceButton && JSON.stringify(csScoped.scopes) === JSON.stringify(['Selection', 'Whole card']) && csScoped.rows === 12, JSON.stringify(csScoped));
    await press(app, "document.querySelectorAll('.board-popup-dock .wz-type-step')[1]", "the card's `+`");
    await sleep(300);
    await pickFace(app, 'Atkinson Hyperlegible');
    const popupFs = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.board-popup-editor')).fontSize)");
    ok('CARD: the popup editor renders 16 x 12/11 px after one `+`', Math.abs(popupFs - 16 * (12 / 11)) < 0.06, String(popupFs));
    await press(app, "document.querySelector('.board-popup-done')", 'Close the card popup');
    // The board editor saves on its own debounce and flushNow does not save the editor: poll the STORED row for the write.
    let row = null;
    for (let i = 0; i < 30; i += 1) { await sleep(200); row = await entryRow(app, 'i207-board'); if (row && (row.boxes || []).some((b) => b.fontSize === 12)) break; }
    const c1 = row && (row.boxes || []).find((b) => b.id === 'c1'); const c2 = row && (row.boxes || []).find((b) => b.id === 'c2');
    ok('CARD: fontSize 12 and the face were written to THAT Box only — the other card carries neither key', c1 && c1.fontSize === 12 && c1.fontFace && c1.fontFace.name === 'Atkinson Hyperlegible' && c2 && !('fontSize' in c2) && !('fontFace' in c2), JSON.stringify({ c1: c1 && [c1.fontSize, c1.fontFace && c1.fontFace.name], c2: c2 && [c2.fontSize, c2.fontFace] }));
    const after = await app.evalJs(`(() => { const els = [...document.querySelectorAll('.board-box .board-text')]; return els.map(e => [parseFloat(getComputedStyle(e).fontSize), getComputedStyle(e).fontFamily, e.getAttribute('style')]); })()`);
    ok('CARD: on the canvas the styled card renders at 15 x 12/11 in Atkinson Hyperlegible, and the other card is unchanged (15px, no style attribute)',
      Array.isArray(after) && after.length >= 2 && Math.abs(after[0][0] - 15 * (12 / 11)) < 0.06 && /Atkinson/.test(after[0][1]) && after[1][0] === 15 && !after[1][2], JSON.stringify(after));
  } else ok('DRIVER: a text card is reachable by a real pointer', false, JSON.stringify(cardPt));
 } catch (e) { ok('DRIVER: the scenario ran to its end without a thrown error', false, String(e && e.stack || e).slice(0, 400)); }
});

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // FONT-SPAN (2026-10-15) - THREE parks, each record frozen with its original name and re-verifying the NEW truth from the default
  // section's own observations (i207Parks). The line just below said this file parks nothing; it is kept as it was.
  const pk = (name, pass, detail) => parkedChecks.push({ name, pass, detail });
  const d = i207Parks.draftForm, l = i207Parks.label, c = i207Parks.cardForm;
  // (the two records below follow the NEWEST truth - TOOLS #10 items 9 + 10: the scoped form has a face button over a COLLAPSED list of Default + eleven faces = 5 buttons, 12 rows)
  pk('PARKED (was "DRAFT: the Type control is mounted, full form — a face button, `-` `+` (3 buttons) and ONE number field") - font-span: the scoped form, no face button; live successor: DRAFT [font-span successor]',
    !!d && d.buttons === 5 && d.inputs === 1 && d.faceButton && d.rows === 12, JSON.stringify(d));
  // (the LABEL record below follows the NEWEST truth - TOOLS #10 item 10: the brass row of a never-chose page is "Default (<face>)")
  pk('PARKED (was "LABEL: on a page that never chose, the face button names the face that ACTUALLY renders (the first family the editor computes) and is set in it") - font-span: the brass roster row does; live successor: LABEL [font-span successor]',
    !!l && l.label === `Default (${l.rendered})` && l.rowFamily === l.rendered, JSON.stringify(l));
  pk('PARKED (was "CARD: the styling dock carries the smallest form — a face button and `-` `+` (3 buttons), no number field") - font-span: the scoped small form; live successor: CARD [font-span successor]',
    !!c && c.buttons === 5 && c.inputs === 0 && c.faceButton && c.rows === 12, JSON.stringify(c));
  // PAGE-SIZE (Oct 23, Fable's ruling a) - SIX more parks, each frozen with its original name, re-verifying the NEW truth from the default leg's
  // observations (i207Parks.untouched / .size / .modes).
  const u = i207Parks.untouched, s = i207Parks.size, m = i207Parks.modes;
  pk('PARKED (was "11 = TODAY: a page that never chose keeps the editor\'s two prior style strings (`var(--font-prose)` and `calc(17px * var(--paper-scale))`) byte-for-byte") - page-size ruling a: 12 page points',
    !!u && !!u.untouched && u.untouched.fs === 'calc(12 * var(--wz-pt, 1.33333px))', JSON.stringify(u));
  pk('PARKED (was "11 = TODAY: the untouched editor renders at 17px x the paper scale (computed)") - page-size ruling a: 16px computed', !!u && Math.abs(u.base - 16) < 0.05, JSON.stringify(u));
  pk('PARKED (was "SIZE: the number field opens at 11") - page-size ruling a: 12', !!s && s.opens === '12', JSON.stringify(s));
  pk('PARKED (was "SIZE: `+` from 11 shows 12, and the editor renders 17 x 12/11 x the scale") - page-size ruling a: 12 -> 13, 13 x 4/3 px', !!s && s.n13 === '13' && Math.abs(s.px13 - 13 * 4 / 3) < 0.06, JSON.stringify(s));
  pk('PARKED (was "SIZE: choosing wrote pageSettings.size = 12 (points, not a step index) and NO face key") - page-size ruling a: 13 written', !!s && !!s.written && s.written.size === 13, JSON.stringify(s));
  pk('PARKED (was "EVERY MODE: a page dressed in Lora at 14 renders in Lora at 14 in Free Write, Draft and Revise - identically") - page-size ruling a: 14 x 4/3 px', !!m && Object.values(m).every((x) => Math.abs(x.size - 14 * 4 / 3) < 0.06), JSON.stringify(m));
  // Parks nothing: 207a adds a control and falsifies no earlier assertion. (Item 83's "the sought door is never offered" and
  // 177-Q3's "typeface hidden with Typewriter ON" are superseded by the design, but no committed check asserts either; the
  // count is printed from the array so a later park cannot be added without this line seeing it.)
  console.log(parkedChecks.every((c) => c.pass)
    ? `\nITEM207 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; font-span's three parks and page-size's six re-verified`
    : `\nITEM207 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
console.log(pass ? `\nITEM207 VERIFY: PASS (${all.length} checks)` : `\nITEM207 VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
