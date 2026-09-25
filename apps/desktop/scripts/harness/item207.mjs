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
const typeInto = async (app, value) => {
  await press(app, "document.querySelector('.wz-type-num')", 'the number field (focus)');
  await app.keyCombo('a');
  await app.type(String(value));
  await app.key('Enter');
  await sleep(250);
};
const pickFace = async (app, name) => {
  await press(app, "document.querySelector('.wz-type-face')", `the face button (open, for ${name})`);
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
    ok('FREE WRITE: the roster lists the nine faces, in order, and has NO "Add a font…" row (his Q2)', open && JSON.stringify(open.rows) === JSON.stringify(NINE) && !/add a font/i.test(open.text), JSON.stringify(open && open.rows));
    const rowFonts = await app.evalJs(`[...document.querySelectorAll('.wz-type-row')].map(r => [r.textContent, getComputedStyle(r).fontFamily])`);
    ok('FREE WRITE: each roster row is SET IN ITS OWN FACE', Array.isArray(rowFonts) && rowFonts.length === 9 && rowFonts.every(([n, f]) => f.replace(/["']/g, '').includes(n === 'Crimson Pro' ? 'Crimson Pro' : n === 'Lora' ? 'Lora' : n === 'EB Garamond' ? 'EB Garamond' : n === 'Source Serif 4' ? 'Source Serif 4' : n)), JSON.stringify(rowFonts));
    await app.key('Escape');
    await sleep(100);
  }

  await openPage(app, { id: 'i207-dr', mode: 'drafting' });
  await openDrawer(app);
  const dr = await typeShape(app);
  ok('DRAFT: the Type control is mounted, full form — a face button, `-` `+` (3 buttons) and ONE number field', !!dr && dr.buttons === 3 && dr.inputs === 1, JSON.stringify(dr && { buttons: dr.buttons, inputs: dr.inputs }));

  await openPage(app, { id: 'i207-rv', mode: 'revise' });
  await openDrawer(app);
  const rv = await typeShape(app);
  ok('REVISE: the Type control is mounted, full form (112-A\'s empty drawer takes its one tenant)', !!rv && rv.buttons === 3 && rv.inputs === 1, JSON.stringify(rv && { buttons: rv.buttons, inputs: rv.inputs }));

  // ==== 2 · "11 = TODAY" — an untouched page's editor style is the prior build's two strings =======================
  await openPage(app, { id: 'i207-untouched', mode: 'drafting' });
  const untouched = await app.evalJs(`(() => { const w = document.querySelector('.forward-only-editor-wrap'); return w ? { ff: w.style.fontFamily, fs: w.style.fontSize } : null; })()`);
  ok('11 = TODAY: a page that never chose keeps the editor\'s two prior style strings (`var(--font-prose)` and `calc(17px * var(--paper-scale))`) byte-for-byte',
    untouched && untouched.ff === 'var(--font-prose)' && untouched.fs === 'calc(17px * var(--paper-scale))', JSON.stringify(untouched));
  const scale = await scaleNow(app);
  const base = await sizeOfEditor(app);
  ok('11 = TODAY: the untouched editor renders at 17px x the paper scale (computed)', base !== null && Math.abs(base - 17 * scale) < 0.05, `${base}px at scale ${scale}`);
  const row0 = await entryRow(app, 'i207-untouched');
  ok('11 = TODAY: an untouched page carries NO face or size key on disk', row0 && !(row0.pageSettings && ('face' in row0.pageSettings || 'size' in row0.pageSettings)), JSON.stringify(row0 && row0.pageSettings));

  // ==== 3 · SIZE — the buttons, the typed number, the limits, and what is written ===================================
  await openDrawer(app);
  const numAt = () => app.evalJs("(document.querySelector('.wz-type-num') || {}).value");
  const labelNow = await app.evalJs(`(() => { const b = document.querySelector('.wz-type-face'); const e = document.querySelector('.forward-only-editor'); if (!b || !e) return null;
    const first = getComputedStyle(e).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/ Variable$/, '');
    return { label: b.textContent, rendered: first, buttonFamily: getComputedStyle(b).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').replace(/ Variable$/, '') }; })()`);
  ok('LABEL: on a page that never chose, the face button names the face that ACTUALLY renders (the first family the editor computes) and is set in it',
    labelNow && labelNow.label === labelNow.rendered && labelNow.buttonFamily === labelNow.rendered, JSON.stringify(labelNow));
  ok('SIZE: the number field opens at 11', (await numAt()) === '11', String(await numAt()));
  await press(app, "document.querySelectorAll('.wz-type-step')[1]", 'the `+` button');
  await sleep(300);
  ok('SIZE: `+` from 11 shows 12, and the editor renders 17 x 12/11 x the scale', (await numAt()) === '12' && Math.abs((await sizeOfEditor(app)) - 17 * (12 / 11) * scale) < 0.06, `${await numAt()} / ${await sizeOfEditor(app)}px`);
  const r12 = await entryRow(app, 'i207-untouched');
  ok('SIZE: choosing wrote pageSettings.size = 12 (points, not a step index) and NO face key', r12 && r12.pageSettings && r12.pageSettings.size === 12 && !('face' in r12.pageSettings), JSON.stringify(r12 && r12.pageSettings));
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
  ok('EVERY MODE: a page dressed in Lora at 14 renders in Lora at 14 in Free Write, Draft and Revise — identically', Object.values(inMode).every((m) => /Lora/.test(m.family) && Math.abs(m.size - 17 * (14 / 11) * m.scale) < 0.06), JSON.stringify(inMode));

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
    ok('CARD: the styling dock carries the smallest form — a face button and `-` `+` (3 buttons), no number field', cs && cs.buttons === 3 && cs.inputs === 0, JSON.stringify(cs));
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
  // Parks nothing: 207a adds a control and falsifies no earlier assertion. (Item 83's "the sought door is never offered" and
  // 177-Q3's "typeface hidden with Typewriter ON" are superseded by the design, but no committed check asserts either; the
  // count is printed from the array so a later park cannot be added without this line seeing it.)
  console.log(parkedChecks.every((c) => c.pass)
    ? `\nITEM207 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; nothing parked`
    : `\nITEM207 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
console.log(pass ? `\nITEM207 VERIFY: PASS (${all.length} checks)` : `\nITEM207 VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
