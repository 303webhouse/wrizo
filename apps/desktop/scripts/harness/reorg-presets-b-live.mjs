// PRESETS-B, IN THE APP (Fable, Nov 23, 5:10 pm: "run your two new checks plus the four older ones, in Machina, in Arbor and with ?flux3=1&reorg=1").
// The browserless halves are reorg-presets-b-unit.mjs and reorg-presets-b-notes-unit.mjs; this proves what only the app can: the twelve new structures and twenty new presets are on the real menus, the "?" is a real pressable note
// beside each, the rows sit side by side with it (the additive CSS of 23-reorg-top.css and 25-reorg-arbor-front.css), and a loaded structure or preset writes the words of the load sheet. Nothing is retyped: the expected words are read
// from the real planPresets.ts / docKinds.ts / presetNotes.ts and the lexicon's canonical words (transpiled), exactly as the unit checks read them.
//   M1..M5  MACHINA (?reorg=1&arbor2=0), the PARTS menu's Presets: 34 standard picks in four groups (7, 9, 7, 11); the twenty new ones each wear a "?" beside them and the live fourteen none; each "?" opens to its note (the lines, in order,
//           the lexicon's words), Escape closes it and leaves the menu open; the page's rect and editor node are unmoved by the menu and the notes; four presets, pressed in their own empty Docs, make exactly their Parts
//   P1..P4  MACHINA, the PLAN tab's Presets: fifteen (the live three, then the twelve); a "?" beside each new one and none beside the live three; each of the twelve opens to its note; three of them loaded (Story Circle, Freytag's Pyramid,
//           CARS) fill the Plan with exactly their rows and prompts
//   A1..A4  ARBOR (plateau, ?reorg=1 with the preview door): the same menu, notes and four loads on the SECTIONS tab
//   F1      FLUX (?flux3=1&reorg=1): the page mounts; where the Parts menu is present there its notes open too (what is found is recorded, never assumed)
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-presets-b-live.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 700) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => lf(fs.readFileSync(path.join(SRC, p), 'utf8'));
function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
// ---- the expected words, from the real sources ----------------------------------------------------------------------------------------------
const W = { ...load(rd('store/lexicon/canonical/chrome.ts')).CANONICAL_CHROME, ...load(rd('store/lexicon/canonical/decks.ts')).CANONICAL_DECKS };
const PLAN = load(rd('reorg/backMenu/planPresets.ts')).PLAN_PRESETS;
const KINDS = load(rd('reorg/docKinds.ts'));
const NOTES = load(rd('reorg/presetNotes.ts'));
const LIVE_PRESET_IDS = new Set(KINDS.LIVE_PRESETS.map((p) => p.id));
const NEW_PRESETS = KINDS.PRESETS.filter((p) => !LIVE_PRESET_IDS.has(p.id) && p.kind === 'standard');
const LIVE_STANDARD = KINDS.LIVE_PRESETS.filter((p) => p.kind === 'standard');
const NEW_PLAN = PLAN.filter((p) => NOTES.STRUCTURE_NOTES[p.id]);
const star = (s) => String(s).replace(/\*/g, '');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
// a note's lines as the "?" draws them, in order: [part, text]
const noteLines = (n) => {
  const L = [['line', star(W[n.line])], ['does', star(W[n.does])]];
  if (n.eg) L.push(['eg', `${W.reorgPreNoteEg}: ${star(W[n.eg])}`]);
  if (n.names) L.push(['names', `${W.reorgPreNoteNames}: ${star(W[n.names])}`]);
  if (n.must) L.push(['must', star(W[n.must])]);
  if (n.credit) L.push(['credit', `${W.reorgPreNoteCredit}: ${star(W[n.credit])}`]);
  return L.map(([k, t]) => `${k}|${norm(t)}`);
};
const SAMPLES = ['class-essay', 'poem', 'lab-report', 'flash-fiction'];   // each pressed in its own empty Doc
const PLAN_SAMPLES = ['circle', 'freytag', 'cars'];

// ---- the fixture (the app's own seams) ------------------------------------------------------------------------------------------------------
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
async function seed(app) {
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const ids = [...SAMPLES, 'menu'];
  return app.evalJs(`(() => {
    const W = window;
    const drawer = W.wrizoCreateDrawer('Presets');
    for (const id of ${q(ids)}) {
      const doc = W.wrizoCreateProject('Doc ' + id); W.wrizoSetProjectDrawer(doc.id, drawer.id);
      W.wrizoCreateJournalPage({ id: 'pb-' + id, text: id === 'menu' ? 'Chapter one' : '', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: doc.id, orderIndex: 0 });
    }
    for (const id of ['pp-1', 'pp-2', 'pp-3']) W.wrizoCreateJournalPage({ id, text: 'A page of her own words, ' + id + '.', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' });
    W.wrizoFlushNow();
    return true;
  })()`);
}

// ---- opening a page in a leg ---------------------------------------------------------------------------------------------------------------
async function openParts(app, leg, id) {
  await app.emulateDpr(1, leg === 'machina' ? 1920 : 1366, leg === 'machina' ? 1080 : 768);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  if (leg === 'machina') {
    await app.evalJs("window.wrizoTheme.set('machina'); null");
    await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  } else if (leg === 'arbor') {
    await app.evalJs("window.wrizoTheme.set('plateau'); null");
    await app.evalJs(`history.replaceState(null, '', '/?reorg=1&reorglift=plateau.front,plateau.top,plateau.back#/page/${id}'); null`);
  } else {
    await app.evalJs(`history.replaceState(null, '', '/?flux3=1&reorg=1#/page/${id}'); null`);
  }
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id} (${leg})`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  if (leg === 'machina') {
    await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="draft"]')?.click(); null`); await sleep(900);
  } else {
    await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*draft\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()"); await sleep(900);
  }
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(500);
}
const openPresets = async (app) => {
  await app.evalJs("document.querySelector('.wz-sliver [data-reorg-parts] [data-doc-kind]')?.click(); null"); await sleep(300);
  await app.evalJs("document.querySelector('[data-doc-menu] [data-doc-menu-item=\"presets\"]')?.click(); null"); await sleep(300);
};
const PICKS = "[...document.querySelectorAll('[data-doc-menu] [data-preset-pick]')].map((b) => b.getAttribute('data-preset-pick'))";
const GROUPS = "[...document.querySelectorAll('[data-doc-menu] [data-preset-group]')].map((g) => [g.getAttribute('data-preset-group'), g.querySelectorAll('[data-preset-pick]').length])";
const ROWSOF = `(() => [...document.querySelectorAll('[data-doc-menu] [data-preset-pick]')].map((b) => { const row = b.closest('[data-preset-row]'); const n = row && row.querySelector('.wz-drawer-note-btn');
  const pb = b.getBoundingClientRect(), nb = n ? n.getBoundingClientRect() : null;
  return { id: b.getAttribute('data-preset-pick'), row: !!row, note: !!n, side: !!nb && nb.left >= pb.left && nb.top < pb.bottom && nb.bottom > pb.top, shown: !!nb && nb.width > 0 && nb.height > 0 }; }))()`;
const NOTEREAD = (id) => `(() => { const w = document.querySelector('[data-preset-note=${q(id)}]'); const pop = w && w.querySelector('[role=note]'); if (!pop) return null;
  return [...pop.querySelectorAll('[data-note-part]')].map((s) => s.getAttribute('data-note-part') + '|' + (s.textContent || '').replace(/\\s+/g, ' ').trim()); })()`;
const NOTEPRESS = (id) => `(() => { const b = document.querySelector('[data-preset-note=${q(id)}] .wz-drawer-note-btn'); if (!b) return false; b.focus(); b.click(); return true; })()`;
const NOTEESC = (id) => `(() => { const b = document.querySelector('[data-preset-note=${q(id)}] .wz-drawer-note-btn'); if (!b) return false; b.focus(); b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); return true; })()`;
const PARTNAMES = "[...document.querySelectorAll('.wz-sliver [data-reorg-parts] .reorg-parts-name')].map((s) => (s.textContent || '').replace(/\\s+/g, ' ').trim())";

// the menu laws, for a leg whose Parts layer is mounted
async function menuLaws(app, leg, tag) {
  const L = leg.toUpperCase();
  await openParts(app, leg, 'pb-menu');
  const page0 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__pbMark = 1; return null; })()");
  await openPresets(app);
  const picks = await app.evalJs(PICKS), groups = await app.evalJs(GROUPS), rows = await app.evalJs(ROWSOF);
  const wantIds = new Set(NEW_PRESETS.map((p) => p.id));
  ok(`${tag}1 ${L}: the Presets list holds the ${LIVE_STANDARD.length + NEW_PRESETS.length} standard picks in four groups (7, 9, 7, 11), the twenty new among them`,
    Array.isArray(picks) && picks.length === LIVE_STANDARD.length + NEW_PRESETS.length && [...wantIds].every((id) => picks.includes(id)) && LIVE_STANDARD.every((p) => picks.includes(p.id))
      && JSON.stringify(groups) === JSON.stringify([['academic', 7], ['business', 9], ['web', 7], ['creative', 11]]), { n: picks && picks.length, groups });
  const bad = (rows || []).filter((r) => (wantIds.has(r.id) ? !(r.row && r.note && r.shown && r.side) : (r.row || r.note)));
  ok(`${tag}2 ${L}: each of the twenty new presets wears a "?" beside its name, on the same line and drawn; the live fourteen stay a lone button`,
    (rows || []).length === picks.length && bad.length === 0, { bad: bad.slice(0, 4) });
  const wrong = [];
  let escFails = 0;
  for (const p of NEW_PRESETS) {
    const want = noteLines(NOTES.PRESET_NOTES[p.id]);
    await app.evalJs(NOTEPRESS(p.id)); await sleep(150);
    const got = await app.evalJs(NOTEREAD(p.id));
    const expanded = await app.evalJs(`document.querySelector('[data-preset-note=${q(p.id)}] .wz-drawer-note-btn')?.getAttribute('aria-expanded')`);
    if (JSON.stringify(got) !== JSON.stringify(want) || expanded !== 'true') wrong.push({ id: p.id, got: got && got.slice(0, 2), want: want.slice(0, 2) });
    await app.evalJs(NOTEESC(p.id)); await sleep(120);
    const after = await app.evalJs(`(() => ({ pop: !!document.querySelector('[data-preset-note=${q(p.id)}] [role=note]'), menu: !!document.querySelector('[data-doc-menu]') }))()`);
    if (after.pop || !after.menu) escFails += 1;
  }
  ok(`${tag}3 ${L}: each of the twenty "?" opens to its note (the lines in order, the lexicon's words); Escape closes the note and leaves the menu open`, wrong.length === 0 && escFails === 0, { wrong: wrong.slice(0, 2), escFails });
  const page1 = await app.evalJs(PAGE);
  const same = await app.evalJs("document.querySelector('.forward-only-editor')?.__pbMark === 1");
  ok(`${tag}4 ${L}: PAGE IS PRIMARY: the page's rect and the editor's node are unmoved by the menu and twenty notes`, page0 === page1 && same === true && !/-/.test(page0.split('|')[2] || '-'), { page0, page1, same });
  await app.evalJs("document.querySelector('.wz-sliver [data-reorg-parts] [data-doc-kind]')?.click(); null"); await sleep(200);
  // the loads, each in its own empty Doc
  const made = [];
  for (const id of SAMPLES) {
    const preset = KINDS.PRESETS.find((p) => p.id === id);
    await openParts(app, leg, 'pb-' + id);
    await openPresets(app);
    await app.evalJs(`document.querySelector('[data-doc-menu] [data-preset-pick=${q(id)}]')?.click(); null`); await sleep(900);
    const names = await app.evalJs(PARTNAMES);
    made.push({ id, ok: JSON.stringify(names) === JSON.stringify(preset.parts), names: names && names.slice(0, 4), want: preset.parts.slice(0, 4), n: names && names.length, wantN: preset.parts.length });
  }
  ok(`${tag}5 ${L}: ${SAMPLES.join(', ')}, each pressed in its own empty Doc, make exactly their Parts, in order`, made.every((m) => m.ok), made.filter((m) => !m.ok));
}

await withHarness(async (app) => {
  await seed(app);

  // ---- MACHINA: the PARTS menu ----
  await menuLaws(app, 'machina', 'M');

  // ---- MACHINA: the PLAN tab ----
  const planOpen = async (id) => {
    await app.emulateDpr(1, 1920, 1080);
    await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
    await app.evalJs(`window.wrizoTheme.set('machina'); localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); null`);
    await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
    await sleep(900);
    if ((await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'")) !== true) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
    await app.evalJs("document.getElementById('wz-tutor-tab-plan')?.click(); null"); await sleep(500);
    await app.evalJs("document.querySelector('[data-plan-presets]')?.click(); null"); await sleep(300);
  };
  await planOpen('pp-1');
  const planNames = await app.evalJs("[...document.querySelectorAll('[data-plan-preset]')].map((b) => b.textContent.trim())");
  const planRows = await app.evalJs(`(() => [...document.querySelectorAll('[data-plan-preset]')].map((b) => { const li = b.closest('li'); const n = li && li.querySelector('[data-preset-note]'); return { id: b.getAttribute('data-plan-preset'), note: n ? n.getAttribute('data-preset-note') : null }; }))()`);
  const newIds = new Set(NEW_PLAN.map((p) => p.id));
  ok('P1 PLAN: the Presets list holds fifteen (the live three, then the twelve); a "?" beside each new one and none beside the live three',
    Array.isArray(planNames) && planNames.length === 15 && planRows.every((r) => (newIds.has(r.id) ? r.note === r.id : r.note === null)) && planRows.filter((r) => r.note).length === 12, { planNames, noted: planRows.filter((r) => r.note).length });
  const planWrong = [];
  for (const p of NEW_PLAN) {
    const want = noteLines(NOTES.STRUCTURE_NOTES[p.id]);
    await app.evalJs(NOTEPRESS(p.id)); await sleep(150);
    const got = await app.evalJs(NOTEREAD(p.id));
    await app.evalJs(NOTEESC(p.id)); await sleep(120);
    const after = await app.evalJs(`(() => ({ pop: !!document.querySelector('[data-preset-note=${q(p.id)}] [role=note]'), list: !!document.querySelector('[data-plan-preset-list]') }))()`);
    if (JSON.stringify(got) !== JSON.stringify(want) || after.pop || !after.list) planWrong.push({ id: p.id, got: got && got.slice(0, 2), want: want.slice(0, 2), after });
  }
  ok('P2 PLAN: each of the twelve "?" opens to its note (the lines in order, the lexicon\'s words); Escape closes the note and leaves the Presets list open', planWrong.length === 0, planWrong.slice(0, 2));

  const ROWS = `(() => [...document.querySelectorAll('[data-back-plan] [data-plan-row]')].map((r) => ({ depth: Number(r.dataset.planDepth), name: (r.querySelector('[data-plan-name]')?.value ?? r.querySelector('[data-plan-name]')?.textContent), hint: (r.querySelector('[data-plan-hint]') || {}).textContent || '' })))()`;
  const loaded = [];
  for (let i = 0; i < PLAN_SAMPLES.length; i += 1) {
    const id = PLAN_SAMPLES[i];
    const preset = PLAN.find((p) => p.id === id);
    await planOpen('pp-' + (i + 1));
    await app.evalJs(`document.querySelector('[data-plan-preset=${q(id)}]')?.click(); null`); await sleep(1000);
    const rows = await app.evalJs(ROWS);
    const want = preset.rows.map((r) => `${r.depth}|${norm(W[r.title])}|${norm(W[r.prompt] || '')}`);
    const got = (rows || []).map((r) => `${r.depth}|${norm(r.name)}|${norm(r.hint)}`);
    loaded.push({ id, ok: JSON.stringify(got) === JSON.stringify(want), n: got.length, wantN: want.length, got: got.slice(0, 2), want: want.slice(0, 2) });
  }
  ok(`P3 PLAN: ${PLAN_SAMPLES.join(', ')} loaded onto an empty Plan fill it with exactly their rows and grey prompts, in order`, loaded.every((l) => l.ok), loaded.filter((l) => !l.ok));

  // ---- ARBOR ----
  await menuLaws(app, 'arbor', 'A');

  // ---- FLUX ----
  await openParts(app, 'flux', 'pb-menu');
  const fx = await app.evalJs("(() => ({ editor: !!document.querySelector('.forward-only-editor') || !!document.querySelector('[contenteditable=true]'), flux: !!document.querySelector('[data-flux3]') || !!document.documentElement.hasAttribute('data-flux3'), kind: !!document.querySelector('[data-doc-kind]') }))()");
  let fxNotes = null;
  if (fx.kind) {
    await openPresets(app);
    const wrong = [];
    for (const p of NEW_PRESETS) {
      await app.evalJs(NOTEPRESS(p.id)); await sleep(120);
      const got = await app.evalJs(NOTEREAD(p.id));
      await app.evalJs(NOTEESC(p.id)); await sleep(80);
      if (JSON.stringify(got) !== JSON.stringify(noteLines(NOTES.PRESET_NOTES[p.id]))) wrong.push(p.id);
    }
    fxNotes = { wrong };
  }
  ok('F1 FLUX (?flux3=1&reorg=1): the page mounts' + (fx.kind ? '; its Parts menu is present and all twenty notes open to their words' : '; the Parts menu is ABSENT here (recorded: nothing to prove there)'),
    fx.editor && (!fx.kind || (fxNotes && fxNotes.wrong.length === 0)), { fx, fxNotes });
});

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-PRESETS-B-LIVE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PRESETS-B-LIVE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
