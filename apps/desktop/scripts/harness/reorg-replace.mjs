// FIND AND REPLACE INSIDE THE CURRENT DOC (POLISH; reorg plan draft 2, section 3 item 4; Fable, Nov 20, 11:45 am: "offered once a term is searched
// (replace all, or one by one)"). Machina only, behind ?reorg=1, in the reorg's search menu (reorg/search/). The prototype's replace box: a
// "Find and Replace, in this Doc" line, offered only once the search has found something in the Doc she is in (and kept while there is a replace to
// undo); opened, a WITH field, "Replace all N in this Doc", and a Replace on each find of this Doc (one by one); each press is one step to Undo. A
// find that starts with a capital keeps it ("Tolls" becomes "Fees"; PROPOSED, Fable Nov 14). Only the words of the Doc she is in are replaced
// (across a Project is later); every write goes through the store, and the open page adopts it (#76).
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer):
//   Harbor (a Drawer)  "Tolls", a set: t-1 "The tolls rose at dawn. Tolls again." / t-2 "Nothing here about it" / t-3 "A toll booth stood empty"
//                      "Ferry", a set: f-1 "The ferry paid its toll"
// The open page is t-1 (Tolls' Part 1).
//
// OFFER  R0  no line while the word finds nothing in this Doc ("ferry", found only in Ferry), even with This Project showing it
//        R1  "toll": the line is offered, closed; opened, a WITH field and "Replace all 3 in this Doc", which waits for a WITH word
// ONE    R2  WITH "fee", Replace on Part 3's find: t-3 is "A fee booth stood empty", every other text the same; it says one was replaced
//        R3  Undo: t-3 is its old words again, exactly
// ALL    R4  Replace all: t-1 "The fees rose at dawn. Fees again." (the capital kept), t-3 "A fee booth stood empty", t-2 and Ferry untouched; the
//            open page shows its new words
//        R5  Undo: every text as it was, exactly; the open page shows them
// SCOPE  R6  out in This Project, only this Doc's finds carry a Replace (none on Ferry's)
// STALE  R7  an Undo after the words changed since refuses and says so, writing nothing
// WORDS  WD  every word of the replace box is a lexicon key, and the search's components write none themselves
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-replace.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

const T1 = 'The tolls rose at dawn. Tolls again.', T2 = 'Nothing here about it', T3 = 'A toll booth stood empty', F1 = 'The ferry paid its toll';
const TEXTS = "(() => { const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const of = (id) => (all.find((e) => e.id === id) || {}).text ?? null; return { t1: of('t-1'), t2: of('t-2'), t3: of('t-3'), f1: of('f-1') }; })()";
const BOX = `(() => {
  const m = document.querySelector('[data-search-menu]');
  if (!m) return { menu: false, line: null, open: null, with: null, all: null, allOff: null, undo: false, said: null, ones: [] };
  const line = m.querySelector('[data-replace-toggle]');
  const all = m.querySelector('[data-replace-all]');
  return { menu: true, line: line ? (line.textContent || '').trim() : null, open: line ? line.getAttribute('aria-expanded') : null,
    with: !!m.querySelector('[data-replace-with]'), all: all ? (all.textContent || '').trim() : null, allOff: all ? all.disabled : null,
    undo: !!m.querySelector('[data-replace-undo]'), said: (m.querySelector('[data-replace-said]')?.textContent || '').trim() || null,
    ones: [...m.querySelectorAll('[data-replace-one]')].map((b) => [b.getAttribute('data-replace-one'), b.disabled]) };
})()`;
const EDTEXT = "(document.querySelector('.forward-only-editor')?.innerText || '').replace(/\\u200b/g, '').trim()";
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const setInput = (sel, v) => `(() => { const i = document.querySelector(${q(sel)}); if (!i) return false; i.focus();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${q(v)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + (id.length % 10) + '.000Z', source: 'page', ...extra });
    const harbor = W.wrizoCreateDrawer('Harbor');
    const set = (name) => { const p = W.wrizoCreateProject(name); W.wrizoSetProjectDrawer(p.id, harbor.id); return p; };
    const tolls = set('Tolls'), ferry = set('Ferry');
    page('t-1', ${q(T1)}, { origin: 'project', projectId: tolls.id, orderIndex: 0 });
    page('t-2', ${q(T2)}, { origin: 'project', projectId: tolls.id, orderIndex: 1 });
    page('t-3', ${q(T3)}, { origin: 'project', projectId: tolls.id, orderIndex: 2 });
    page('f-1', ${q(F1)}, { origin: 'project', projectId: ferry.id, orderIndex: 0 });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id) {
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-tutor-grip') && !!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(2500);   // the open page re-saves itself ~1.1 s after it mounts: the replace writes come after it settles
}
async function word(app, w) { await app.evalJs(setInput('[data-search-menu] [data-search-q]', w)); await sleep(500); return app.evalJs(BOX); }
async function press(app, sel) { const r = await app.evalJs(click(sel)); await sleep(700); return r; }
async function storedIs(app, want) {
  await app.waitFor(`(() => { const t = ${TEXTS}; return ${Object.entries(want).map(([k, v]) => `t.${k} === ${q(v)}`).join(' && ')}; })()`, { timeout: 6000, label: 'the stored texts' }).catch(() => {});
  return app.evalJs(TEXTS);
}

await withHarness(async (app) => {
  await seed(app);
  await open(app, 't-1');
  await app.evalJs(click('[data-top-search]'));
  await app.waitFor("!!document.querySelector('[data-search-menu]')", { label: 'the search menu', timeout: 4000 }).catch(() => {});
  await sleep(400);

  await word(app, 'ferry');
  await press(app, '[data-search-menu] [data-search-reach="project"]');
  const r0 = await app.evalJs(BOX);
  const r0hits = await app.evalJs("[...document.querySelectorAll('[data-search-menu] [data-search-hit]')].map((h) => h.getAttribute('data-hit-entry'))");
  ok('R0: no line while the word finds nothing in this Doc ("ferry", found only in Ferry), even with This Project showing it', r0.menu && r0.line === null && r0hits.includes('f-1'), { r0, r0hits });
  await press(app, '[data-search-menu] [data-search-reach="doc"]');

  const r1a = await word(app, 'toll');
  await press(app, '[data-search-menu] [data-replace-toggle]');
  const r1b = await app.evalJs(BOX);
  ok('R1: "toll" - the line is offered, closed; opened, a WITH field and "Replace all 3 in this Doc", which waits for a WITH word',
    r1a.line === 'Find and Replace · in this Doc' && r1a.open === 'false' && !r1a.with && r1b.open === 'true' && r1b.with && r1b.all === 'Replace all 3 in this Doc' && r1b.allOff === true,
    { r1a, r1b });

  await app.evalJs(setInput('[data-search-menu] [data-replace-with]', 'fee')); await sleep(400);
  const before = await app.evalJs(TEXTS);
  await press(app, '[data-search-menu] [data-replace-one="t-3|2"]');
  const r2 = await storedIs(app, { t3: 'A fee booth stood empty' });
  const r2box = await app.evalJs(BOX);
  ok('R2: WITH "fee", Replace on Part 3\'s find - t-3 is "A fee booth stood empty", every other text the same; it says one was replaced',
    before.t3 === T3 && r2.t3 === 'A fee booth stood empty' && r2.t1 === T1 && r2.t2 === T2 && r2.f1 === F1 && r2box.said === 'Replaced one: “toll” is now “fee”.', { before, r2, said: r2box.said });
  await press(app, '[data-search-menu] [data-replace-undo]');
  const r3 = await storedIs(app, { t3: T3 });
  ok('R3: Undo - t-3 is its old words again, exactly', r3.t3 === T3 && r3.t1 === T1 && r3.t2 === T2 && r3.f1 === F1, r3);

  await word(app, 'toll');
  await app.evalJs(setInput('[data-search-menu] [data-replace-with]', 'fee')); await sleep(400);
  await press(app, '[data-search-menu] [data-replace-all]');
  const r4 = await storedIs(app, { t1: 'The fees rose at dawn. Fees again.', t3: 'A fee booth stood empty' });
  await app.waitFor(`${EDTEXT} === 'The fees rose at dawn. Fees again.'`, { timeout: 6000, label: 'the page adopts' }).catch(() => {});
  const r4ed = await app.evalJs(EDTEXT);
  ok('R4: Replace all - t-1 "The fees rose at dawn. Fees again." (the capital kept), t-3 "A fee booth stood empty", t-2 and Ferry untouched; the open page shows its new words',
    r4.t1 === 'The fees rose at dawn. Fees again.' && r4.t3 === 'A fee booth stood empty' && r4.t2 === T2 && r4.f1 === F1 && r4ed === r4.t1, { r4, r4ed });
  await press(app, '[data-search-menu] [data-replace-undo]');
  const r5 = await storedIs(app, { t1: T1, t3: T3 });
  await app.waitFor(`${EDTEXT} === ${q(T1)}`, { timeout: 6000, label: 'the page adopts the undo' }).catch(() => {});
  const r5ed = await app.evalJs(EDTEXT);
  ok('R5: Undo - every text as it was, exactly; the open page shows them', r5.t1 === T1 && r5.t2 === T2 && r5.t3 === T3 && r5.f1 === F1 && r5ed === T1, { r5, r5ed });

  await word(app, 'toll');
  await press(app, '[data-search-menu] [data-search-reach="project"]');
  const r6 = await app.evalJs(BOX);
  const r6ids = r6.ones.map((o) => o[0].split('|')[0]);
  ok('R6: out in This Project, only this Doc\'s finds carry a Replace (none on Ferry\'s)', r6ids.length > 0 && r6ids.every((id) => ['t-1', 't-2', 't-3'].includes(id)) && !r6ids.includes('f-1'), r6.ones);
  await press(app, '[data-search-menu] [data-search-reach="doc"]');

  // STALE: replace one, then the words change (through the app's own entry seam), then Undo
  await app.evalJs(setInput('[data-search-menu] [data-replace-with]', 'fee')); await sleep(300);
  await press(app, '[data-search-menu] [data-replace-one="t-3|2"]');
  await storedIs(app, { t3: 'A fee booth stood empty' });
  await app.evalJs("window.wrizoPatchEntry('t-3', { text: 'A fee booth stood empty, then full' }); window.wrizoFlushNow && window.wrizoFlushNow(); null");
  await sleep(500);
  await press(app, '[data-search-menu] [data-replace-undo]');
  const r7 = await app.evalJs(TEXTS), r7box = await app.evalJs(BOX);
  ok('R7: an Undo after the words changed since refuses and says so, writing nothing', r7.t3 === 'A fee booth stood empty, then full' && r7box.said === 'Not undone: the words have changed since.', { r7, said: r7box.said });

  const chrome = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const dir = path.join(SRC, 'reorg', 'search');
  const src = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') : '';
  const keys = [['reorgReplaceLine', 'Find and Replace'], ['reorgReplaceInDoc', 'in this Doc'], ['reorgReplaceWith', 'Replace with'], ['reorgReplaceAll', 'Replace all {n} in this Doc'],
    ['reorgReplaceOne', 'Replace'], ['reorgReplaceUndo', 'Undo'], ['reorgReplacedOne', 'Replaced one: “{q}” is now “{with}”.'],
    ['reorgReplacedMany', 'Replaced {n} in this Doc: “{q}” is now “{with}”.'], ['reorgReplaceUndone', 'Undone.'], ['reorgReplaceUndoNo', 'Not undone: the words have changed since.']];
  const declared = keys.map(([k, v]) => [k, new RegExp(`\\b${k}: '([^']*)'`).exec(chrome)?.[1] ?? null, v]);
  const literal = /['">](Find and Replace|Replace all|Replaced one|Not undone)/.test(src);
  ok('WD: every word of the replace box is a lexicon key, and the search\'s components write none themselves',
    declared.every(([, got, want]) => got === want) && keys.every(([k]) => src.includes(`'${k}'`)) && !literal, { declared: declared.filter(([, g, w]) => g !== w), literal });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 9;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nREORG-REPLACE VERIFY: PASS (${checks.length} checks)` : `\nREORG-REPLACE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
