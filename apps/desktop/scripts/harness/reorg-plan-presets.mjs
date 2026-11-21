// PLAN PRESETS (Fable, Nov 20, 3:20 pm and 9:45 pm; Nick: "Yes, as drafted", 3:14 pm; the Wrizors' claude/wrizors/plan-presets-draft.md): the Back menu's PLAN tab gains "Presets", three starting shapes - Stasis Theory, the Hero's
// Journey (twelve steps under three Acts) and Three-Act Structure - each heading carrying its grey prompt, which disappears once a Part under that heading has words. Behind ?reorg=1, Machina.
// A preset fills the Plan with ORDINARY rows (the board's own cards, indented as the Plan indents them); the prompt rides in the card's `planHint`, never in its text.
//
// The fixture (the app's own seams; WS_PLACE=1):
//   pr-e     a loose page, no board: the empty Plan the first presets fill
//   pr-h     a loose page, no board: the Hero's Journey
//   pr-t     a loose page, no board: Three-Act
//   pr-a     a loose page whose board already holds one card, "Alpha": a preset appends below it
//   Ledger   a Doc: pr-1 (a Part, no board), pr-2 (a Part): the prompt's retirement through "-> Part"
//   PR1  the Presets control lists the three presets by name (the draft's words); the list opens and closes
//   PR2  Stasis Theory on an empty Plan: the board is born then; seven rows, in the draft's order, every heading and every prompt verbatim; the card's text is the heading only and the prompt is stored beside it, not in it
//   PR3  the Hero's Journey: fifteen rows; three Acts at the top level, each holding its steps one level in (5, 4, 3), every heading and prompt verbatim; the Acts start folded closed (three rows show) and unfold on a press
//   PR4  Three-Act Structure: twelve rows; three Acts holding 3, 4 and 2 beats; headings and prompts verbatim
//   PR5  a preset onto a Plan that has rows APPENDS: Alpha is untouched (same id, text and seq) and the preset follows it
//   PR6  a preset row is an ordinary row: renamed, it keeps its prompt and changes only its title
//   PR7  the prompt retires once a Part under that heading has words: Stasis in a Doc, "-> Part" on Fact, her words: Fact's prompt is gone (and it wears a tick), the other six remain
//   PR8  loading writes only to the Page's board (and the pointer to it): the other entries and the page's own words are byte for byte as they were
//   PR9  every heading and prompt is a lexicon word, none written into the components
//   PR10 with the switch off (Machina) and in Arbor with it on, no Presets control is drawn
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-plan-presets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 900)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

// THE DRAFT, VERBATIM (plan-presets-draft.md, Nov 20): [depth, heading, prompt or null]
const STASIS = [
  [0, 'The Question at Issue', 'What exactly are you and your readers disagreeing about?'],
  [0, 'Fact', "Did it happen, or does it exist? What's the evidence?"],
  [0, 'Definition', 'What is it, exactly? What should we call it?'],
  [0, 'Quality', 'Is it good or bad, serious or minor, right or wrong? By what standard?'],
  [0, 'Policy', 'What should be done about it, and by whom?'],
  [0, 'Objections', 'What would a fair-minded opponent say at each step?'],
  [0, 'Conclusion', 'What should your reader now believe or do?'],
];
const HERO = [
  [0, 'Act One: Departure', null],
  [1, 'The Ordinary World', "Who is she before anything happens, and what's missing?"],
  [1, 'The Call to Adventure', 'What disturbs that world?'],
  [1, 'Refusal of the Call', 'Why does she hesitate?'],
  [1, 'Meeting the Mentor', 'Who or what prepares her?'],
  [1, 'Crossing the Threshold', "What does she commit to that she can't take back?"],
  [0, 'Act Two: Initiation', null],
  [1, 'Tests, Allies and Enemies', 'Who does she meet, and what are the new rules?'],
  [1, 'Approach to the Inmost Cave', 'What is she closing in on, and what does she fear there?'],
  [1, 'The Ordeal', 'What is the worst moment, and what dies or nearly dies?'],
  [1, 'The Reward', 'What does she win or learn by surviving it?'],
  [0, 'Act Three: Return', null],
  [1, 'The Road Back', 'What pulls her home, or chases her there?'],
  [1, 'The Resurrection', 'What final test proves she has changed?'],
  [1, 'Return with the Elixir', 'What does she bring back to the world she left?'],
];
const THREE = [
  [0, 'Act One: Setup', null],
  [1, 'Opening', 'Where are we, and who are we following?'],
  [1, 'Inciting Incident', 'What event starts the story moving?'],
  [1, 'First Turning Point', 'What choice or event locks the main character into the story?'],
  [0, 'Act Two: Confrontation', null],
  [1, 'Rising Complications', 'What gets in the way, and how do things get harder?'],
  [1, 'Midpoint', 'What changes the game halfway through?'],
  [1, 'Crisis', 'When does everything seem lost?'],
  [1, 'Second Turning Point', 'What new piece sends us into the ending?'],
  [0, 'Act Three: Resolution', null],
  [1, 'Climax', 'What is the final confrontation, and how is it decided?'],
  [1, 'Resolution', 'What does the world look like now?'],
];

const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const ENTRY = (id) => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return ${ALL}.find((x) => x.id === ${q(id)}) || null; })()`;
const STORE = () => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return ${ALL}; })()`;
const ROWS = `(() => [...document.querySelectorAll('[data-back-plan] [data-plan-row]')].map((r) => ({ id: r.dataset.planRow, depth: Number(r.dataset.planDepth), num: r.querySelector('.wz-back-plan-num')?.textContent, name: (r.querySelector('[data-plan-name]')?.value ?? r.querySelector('[data-plan-name]')?.textContent), hint: (r.querySelector('[data-plan-hint]') || {}).textContent || null, tick: !!r.querySelector('[data-plan-tick]'), fold: (r.querySelector('[data-plan-fold]') || {}).dataset?.planFold || null })))()`;
const cardsOf = (e) => ((e && e.boxes) || []).filter((b) => b.kind === 'text' && !b.deletedAt).slice().sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
const shape = (spec) => spec.map(([d, t, p]) => `${d}|${t}|${p ?? ''}`).join('\n');
const rowShape = (rows) => rows.map((r) => `${r.depth}|${r.name}|${r.hint ?? ''}`).join('\n');

let ledgerId = null;
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  ledgerId = await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + (id.length % 10) + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const ledger = W.wrizoCreateProject('Ledger'); W.wrizoSetProjectDrawer(ledger.id, grants.id);
    page('pr-1', 'Ledger one opens the story.', { origin: 'project', projectId: ledger.id, orderIndex: 0 });
    page('pr-2', 'Ledger two', { origin: 'project', projectId: ledger.id, orderIndex: 1 });
    for (const id of ['pr-e', 'pr-h', 'pr-t']) page(id, 'A page of her own words, ' + id + '.', { origin: 'loose' });
    page('pr-a', 'The page with a plan.', { origin: 'loose' });
    page('pr-aown', 'Own board', { pageType: 'board', boxes: ${q([card('a1', 'Alpha', 0, 0.05)])} });
    W.wrizoPatchEntry('pr-a', { planBoardId: 'pr-aown' });
    W.wrizoFlushNow();
    return ledger.id;
  })()`);
}
async function openPage(app, id, { theme = 'machina', reorg = true } = {}) {
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const openDrawer = async (app) => {
  const open = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (!open) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
};
const planTab = async (app) => { await app.evalJs("document.getElementById('wz-tutor-tab-plan')?.click()"); await sleep(500); };
const click = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);
const load = async (app, id, preset) => {
  await openPage(app, id); await openDrawer(app); await planTab(app);
  await click(app, '[data-plan-presets]'); await sleep(300);
  await click(app, `[data-plan-preset="${preset}"]`); await sleep(900);
};
const planBoard = async (app, pageId) => {
  const pid = await app.evalJs(`(${ALL}.find((e) => e.id === ${q(pageId)}) || {}).planBoardId || null`);
  return pid ? { id: pid, entry: await app.evalJs(ENTRY(pid)) } : { id: null, entry: null };
};
const cardShape = (cards) => cards.map((c) => `${c.parentId ? 1 : 0}|${(c.text || '').split('\n')[0]}|${c.planHint ?? ''}`).join('\n');

await withHarness(async (app) => {
  await seed(app);

  // ---- PR1 ----
  await openPage(app, 'pr-e'); await openDrawer(app); await planTab(app);
  const before = await app.evalJs(STORE());
  const closed = await app.evalJs("(() => ({ btn: !!document.querySelector('[data-plan-presets]'), list: !!document.querySelector('[data-plan-preset-list]') }))()");
  await click(app, '[data-plan-presets]'); await sleep(300);
  const names = await app.evalJs("[...document.querySelectorAll('[data-plan-preset]')].map((b) => b.textContent.trim())");
  await click(app, '[data-plan-presets]'); await sleep(300);
  const shut = await app.evalJs("!!document.querySelector('[data-plan-preset-list]')");
  ok("PR1 the Presets control lists the three presets by the draft's names; it opens and closes",
    closed.btn && !closed.list && names.join('|') === "Stasis Theory|The Hero's Journey|Three-Act Structure" && shut === false, { closed, names, shut });

  // ---- PR2 ----
  const boardBefore = await planBoard(app, 'pr-e');
  await click(app, '[data-plan-presets]'); await sleep(300);
  await click(app, '[data-plan-preset="stasis"]'); await sleep(900);
  const rows2 = await app.evalJs(ROWS);
  const b2 = await planBoard(app, 'pr-e');
  const c2 = cardsOf(b2.entry);
  ok("PR2 Stasis Theory on an empty Plan: the board is born then; seven rows in the draft's order, each heading and prompt verbatim, numbered 1 to 7; the card holds the heading only, the prompt beside it",
    boardBefore.id === null && !!b2.id && rows2.length === 7 && rowShape(rows2) === shape(STASIS) && rows2.map((r) => r.num).join() === '1,2,3,4,5,6,7' && cardShape(c2) === shape(STASIS) && c2.every((c) => !(c.text || '').includes('\n')),
    { boardBefore: boardBefore.id, rows: rows2.slice(0, 2), cards: c2.slice(0, 2) });

  // ---- PR8 ----
  const after = await app.evalJs(STORE());
  const changed = after.filter((e) => JSON.stringify(before.find((x) => x.id === e.id) || null) !== JSON.stringify(e)).map((e) => e.id).sort();
  const pageBefore = before.find((e) => e.id === 'pr-e'), pageAfter = after.find((e) => e.id === 'pr-e');
  ok("PR8 loading writes only to the Page's board and the pointer to it: the other entries are as they were and the page's own words are byte for byte unchanged",
    changed.length === 2 && changed.includes(b2.id) && changed.includes('pr-e') && pageBefore.text === pageAfter.text && pageAfter.planBoardId === b2.id, { changed, planBoardId: pageAfter.planBoardId });

  // ---- PR6 ----
  await app.evalJs(`(() => { const i = document.querySelector('[data-plan-row="${(rows2[1] || {}).id}"] [data-plan-name]'); if (!i) return false; i.focus(); i.value = 'The Facts'; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); return true; })()`);
  await sleep(600);
  const renamed = cardsOf((await planBoard(app, 'pr-e')).entry).find((c) => c.id === rows2[1].id);
  const rows6 = await app.evalJs(ROWS);
  ok('PR6 a preset row is an ordinary row: renamed, it keeps its prompt and changes only its title',
    !!renamed && renamed.text === 'The Facts' && renamed.planHint === STASIS[1][2] && rows6[1].name === 'The Facts' && rows6[1].hint === STASIS[1][2], { renamed });

  // ---- PR3 ----
  await load(app, 'pr-h', 'hero');
  const rowsH = await app.evalJs(ROWS);
  const bh = await planBoard(app, 'pr-h');
  const ch = cardsOf(bh.entry);
  const kids = (cs, actTitle) => cs.filter((c) => c.parentId && cs.find((p) => p.id === c.parentId)?.text === actTitle).length;
  const closedRows = rowsH.length;
  const toggles = await app.evalJs("[...document.querySelectorAll('[data-plan-fold]')].map((b) => [b.getAttribute('data-plan-fold'), b.getAttribute('aria-expanded')])");
  await click(app, `[data-plan-row="${rowsH[0].id}"] [data-plan-fold]`); await sleep(400);
  const openOne = await app.evalJs(ROWS);
  ok("PR3 the Hero's Journey: fifteen rows, three Acts holding 5, 4 and 3 steps, headings and prompts verbatim; the Acts start folded closed (3 rows show) and Act One unfolds on a press (8 show)",
    ch.length === 15 && cardShape(ch) === shape(HERO) && kids(ch, 'Act One: Departure') === 5 && kids(ch, 'Act Two: Initiation') === 4 && kids(ch, 'Act Three: Return') === 3 && closedRows === 3 && toggles.length === 3 && toggles.every((t) => t[0] === 'closed' && t[1] === 'false') && openOne.length === 8 && rowShape(openOne.slice(1, 6)) === shape(HERO.slice(1, 6)),
    { n: ch.length, closedRows, toggles, openOne: openOne.length });

  // ---- PR4 ----
  await load(app, 'pr-t', 'three');
  const bt = await planBoard(app, 'pr-t');
  const ct = cardsOf(bt.entry);
  for (const id of ct.filter((c) => !c.parentId).map((c) => c.id)) await click(app, `[data-plan-row="${id}"] [data-plan-fold="closed"]`);
  await sleep(400);
  const rowsT = await app.evalJs(ROWS);
  ok('PR4 Three-Act Structure: twelve rows, three Acts holding 3, 4 and 2 beats; headings and prompts verbatim (all unfolded: 12 show)',
    ct.length === 12 && cardShape(ct) === shape(THREE) && kids(ct, 'Act One: Setup') === 3 && kids(ct, 'Act Two: Confrontation') === 4 && kids(ct, 'Act Three: Resolution') === 2 && rowsT.length === 12 && rowShape(rowsT) === shape(THREE), { n: ct.length, shown: rowsT.length });

  // ---- PR5 ----
  await load(app, 'pr-a', 'stasis');
  const rows5 = await app.evalJs(ROWS);
  const c5 = cardsOf((await planBoard(app, 'pr-a')).entry);
  ok('PR5 a preset onto a Plan that has rows APPENDS: Alpha is untouched (same id, text and seq) and the seven follow it, numbered 2 to 8',
    c5.length === 8 && c5[0].id === 'a1' && c5[0].text === 'Alpha' && c5[0].seq === 0 && rows5.length === 8 && rows5[0].name === 'Alpha' && rows5.map((r) => r.num).join() === '1,2,3,4,5,6,7,8' && rowShape(rows5.slice(1)) === shape(STASIS), { n: c5.length, first: c5[0] });

  // ---- PR7 ----
  await load(app, 'pr-1', 'stasis');
  const rows7a = await app.evalJs(ROWS);
  const factId = rows7a[1].id;
  await click(app, `[data-plan-row="${factId}"] [data-plan-part]`);
  await app.waitFor("location.hash.indexOf('/page/new') >= 0 && !!document.querySelector('.forward-only-editor')", { timeout: 8000, label: 'a fresh page' }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(200);
  for (const ch2 of 'The evidence') { await app.typeKeys(ch2); await sleep(40); }
  await app.waitFor(`window.wrizoParts && window.wrizoParts.partsOfDoc(${q(ledgerId)}).some((p) => p.words > 0 && p.id !== 'pr-1' && p.id !== 'pr-2')`, { timeout: 8000, label: 'the Part born' }).catch(() => {});
  await sleep(500);
  await openPage(app, 'pr-1'); await openDrawer(app); await planTab(app);
  const rows7 = await app.evalJs(ROWS);
  ok("PR7 the prompt retires once a Part under that heading has words: Fact's prompt is gone (and it wears a tick); the other six prompts remain",
    rows7.length === 7 && rows7[1].hint === null && rows7[1].tick === true && rows7.filter((r, i) => i !== 1 && r.hint === STASIS[i][2]).length === 6 && rows7.filter((r) => r.tick).length === 1, rows7.map((r) => [r.name, !!r.hint, r.tick]));

  // ---- PR10 ----
  await openPage(app, 'pr-e', { reorg: false }); await openDrawer(app);
  const offBtn = await app.evalJs("document.querySelectorAll('[data-plan-presets]').length");
  await openPage(app, 'pr-e', { theme: 'arbor' }); await openDrawer(app);
  const arborBtn = await app.evalJs("document.querySelectorAll('[data-plan-presets]').length");
  ok('PR10 with the switch off (Machina) and in Arbor with it on, no Presets control is drawn', offBtn === 0 && arborBtn === 0, { offBtn, arborBtn });

  // ---- PR9 ----
  const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
  const code = ['reorg/backMenu/BackPlan.tsx', 'reorg/backMenu/planPresets.ts', 'reorg/backMenu/planPresetOps.ts'].map((f) => read(f).replace(/\/\/.*$/gm, '')).join('\n');
  const lex = read('store/lexicon/canonical/chrome.ts');
  const words = [...new Set([...STASIS, ...HERO, ...THREE].flatMap(([, t, p]) => [t, p]).filter(Boolean))];
  const inCode = words.filter((w) => code.includes(`'${w}'`) || code.includes(`"${w}"`) || code.includes(`>${w}<`));   // a word as a string or text node; a lexicon KEY that merely contains it (reorgPreStasisFact) is not the word written in
  const missing = words.filter((w) => !lex.includes(`"${w}"`) && !lex.includes(`'${w}'`));
  ok('PR9 every heading and prompt is a lexicon word, none written into the components', inCode.length === 0 && missing.length === 0 && /reorgPlanPresets:/.test(lex), { inCode, missing });
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-PLAN-PRESETS VERIFY: PASS (${checks.length} checks)` : `\nREORG-PLAN-PRESETS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
