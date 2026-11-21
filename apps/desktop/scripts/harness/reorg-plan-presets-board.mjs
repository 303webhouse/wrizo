// PLAN PRESETS ONTO A BOARD (Fable, Nov 21, 12:10 am: FIX's queue item 4, "presets onto a Board"; reorg-plan-v2.md section 3b). The Back menu's PLAN tab loads the Wrizors' three presets as rows of a Page's own board
// (reorg-plan-presets.mjs). A Board is that same list seen the other way round: in Machina the Board's Outline view IS its Plan, so the same Presets control sits under the rows there and loads the same shapes as
// ordinary cards (a text card, its title the only text, indented through parentId, ordered through seq); a row wears its grey prompt (Box.planHint) until a Part under it has words. Behind ?reorg=1, Machina only.
// The words and the rows are the same table (reorg/backMenu/planPresets.ts); this file proves the Board's surface.
//
// The fixture (the app's own seams; WS_PLACE=1):
//   bd-1     an empty Board, loose        bd-2  a Board holding one card, "Alpha"        bd-3  an empty Board (the Hero's Journey)
//   Ledger   a Doc holding the Part bd-part ("Words are here.") and the Board bd-4, filed in it
//   B1  the Board's Outline view carries a Presets control listing the three presets by name; the other views (Open, Storyboard) carry none
//   B2  Stasis Theory on an empty Board: seven rows in the draft's order, each heading and prompt verbatim; the cards hold the heading only and the prompt beside it (planHint)
//   B3  the Hero's Journey: fifteen cards, three Acts at the top level holding 5, 4 and 3 steps one level in, every heading and prompt verbatim; the Board's Open view shows the same fifteen cards
//   B4  a preset onto a Board that has cards APPENDS: Alpha is untouched (same id, text and seq) and the seven follow it
//   B5  the prompt retires once a Part under that row has words: the Fact row, linked to bd-part (words), loses its prompt; the other six keep theirs
//   B6  with the switch off (Machina) and in Arbor with it on, the Outline has no Presets control and a card's planHint is not drawn
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-plan-presets-board.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 900)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

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
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const ENTRY = (id) => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return ${ALL}.find((x) => x.id === ${q(id)}) || null; })()`;
const cardsOf = (e) => ((e && e.boxes) || []).filter((b) => b.kind === 'text' && !b.deletedAt).slice().sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
const shape = (spec) => spec.map(([d, t, p]) => `${d}|${t}|${p ?? ''}`).join('\n');
const cardShape = (cards) => cards.map((c) => `${c.parentId ? 1 : 0}|${(c.text || '').split('\n')[0]}|${c.planHint ?? ''}`).join('\n');
const OUTLINE = "(() => { const rows = [...document.querySelectorAll('.board-outline-row')]; return rows.map((r) => ({ id: r.dataset.outlineRow, depth: Number(r.style.marginLeft.replace('px', '')) / 20, name: (r.querySelector(':scope > .board-outline-text') || {}).value, hint: (r.querySelector(':scope > [data-plan-hint]') || {}).textContent || null })); })()";
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
    page('bd-1', 'Empty board', { pageType: 'board', origin: 'loose', boxes: [] });
    page('bd-2', 'Board with a card', { pageType: 'board', origin: 'loose', boxes: ${q([card('a1', 'Alpha', 0, 0.05)])} });
    page('bd-3', 'Hero board', { pageType: 'board', origin: 'loose', boxes: [] });
    page('bd-part', 'Words are here.', { origin: 'project', projectId: ledger.id, orderIndex: 0 });
    page('bd-4', 'Ledger board', { pageType: 'board', origin: 'project', projectId: ledger.id, boxes: [] });
    W.wrizoFlushNow();
    return ledger.id;
  })()`);
}
async function openBoard(app, id, view, { theme = 'machina', reorg = true } = {}) {
  await app.waitFor('!!window.wrizoTheme && !!window.wrizoBoardMode', { label: 'the seams', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); window.wrizoBoardMode.set(${q(id)}, '${view}')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('[data-board-projection]') || !!document.querySelector('.board-canvas-wrap')", { label: 'the board', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const click = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);
const load = async (app, id, preset) => {
  await openBoard(app, id, 'outline');
  await click(app, '[data-plan-presets]'); await sleep(300);
  await click(app, `[data-plan-preset="${preset}"]`); await sleep(900);
};

await withHarness(async (app) => {
  await seed(app);

  // ---- B1 ----
  await openBoard(app, 'bd-1', 'outline');
  const ol = await app.evalJs("(() => ({ btn: !!document.querySelector('[data-plan-presets]'), list: !!document.querySelector('[data-plan-preset-list]') }))()");
  await click(app, '[data-plan-presets]'); await sleep(300);
  const names = await app.evalJs("[...document.querySelectorAll('[data-plan-preset]')].map((b) => b.textContent.trim())");
  await openBoard(app, 'bd-1', 'storyboard');
  const sb = await app.evalJs("document.querySelectorAll('[data-plan-presets]').length");
  await openBoard(app, 'bd-1', 'open');
  const op = await app.evalJs("document.querySelectorAll('[data-plan-presets]').length");
  ok("B1 the Board's Outline view carries a Presets control listing the three presets by name; Storyboard and Open carry none",
    ol.btn && !ol.list && names.join('|') === "Stasis Theory|The Hero's Journey|Three-Act Structure" && sb === 0 && op === 0, { ol, names, sb, op });

  // ---- B2 ----
  await load(app, 'bd-1', 'stasis');
  const rows2 = await app.evalJs(OUTLINE);
  const c2 = cardsOf(await app.evalJs(ENTRY('bd-1')));
  ok('B2 Stasis Theory on an empty Board: seven rows in the draft\'s order, each heading and prompt verbatim; the cards hold the heading only and the prompt beside it',
    rows2.length === 7 && rowShape(rows2) === shape(STASIS) && cardShape(c2) === shape(STASIS) && c2.every((c) => !(c.text || '').includes('\n')), { rows: rows2.slice(0, 2), cards: c2.slice(0, 2) });

  // ---- B3 ----
  await load(app, 'bd-3', 'hero');
  const rows3 = await app.evalJs(OUTLINE);
  const c3 = cardsOf(await app.evalJs(ENTRY('bd-3')));
  const kids = (act) => c3.filter((c) => c.parentId && c3.find((p) => p.id === c.parentId)?.text === act).length;
  await openBoard(app, 'bd-3', 'open');
  const openCards = await app.evalJs("document.querySelectorAll('.board-box').length");
  ok("B3 the Hero's Journey: fifteen cards, three Acts holding 5, 4 and 3 steps one level in, headings and prompts verbatim; the Open view shows the same fifteen cards",
    c3.length === 15 && cardShape(c3) === shape(HERO) && kids('Act One: Departure') === 5 && kids('Act Two: Initiation') === 4 && kids('Act Three: Return') === 3 && rows3.length === 15 && rowShape(rows3) === shape(HERO) && openCards === 15, { n: c3.length, rows: rows3.length, openCards });

  // ---- B4 ----
  await load(app, 'bd-2', 'stasis');
  const c4 = cardsOf(await app.evalJs(ENTRY('bd-2')));
  ok('B4 a preset onto a Board that has cards APPENDS: Alpha is untouched (same id, text and seq) and the seven follow it',
    c4.length === 8 && c4[0].id === 'a1' && c4[0].text === 'Alpha' && c4[0].seq === 0 && cardShape(c4.slice(1)) === shape(STASIS), { n: c4.length, first: c4[0] });

  // ---- B5 ----
  await load(app, 'bd-4', 'stasis');
  const c5 = cardsOf(await app.evalJs(ENTRY('bd-4')));
  const fact = c5.find((c) => c.text === 'Fact');
  await app.evalJs(`window.wrizoAddPageLink('bd-4', { aBoxId: ${q(fact && fact.id)}, bEntryId: 'bd-part' }); window.wrizoFlushNow(); true`);
  await openBoard(app, 'bd-4', 'outline');
  const rows5 = await app.evalJs(OUTLINE);
  ok('B5 the prompt retires once a Part under that row has words: Fact (linked to a Part with words) loses its prompt; the other six keep theirs',
    !!fact && rows5.length === 7 && rows5[1].name === 'Fact' && rows5[1].hint === null && rows5.filter((r, i) => i !== 1 && r.hint === STASIS[i][2]).length === 6, rows5.map((r) => [r.name, !!r.hint]));

  // ---- B6 ----
  await openBoard(app, 'bd-2', 'outline', { reorg: false });
  const offBtn = await app.evalJs("document.querySelectorAll('[data-plan-presets]').length + document.querySelectorAll('[data-plan-hint]').length");
  await openBoard(app, 'bd-2', 'outline', { theme: 'arbor' });
  const arborBtn = await app.evalJs("document.querySelectorAll('[data-plan-presets]').length + document.querySelectorAll('[data-plan-hint]').length");
  ok('B6 with the switch off (Machina) and in Arbor with it on, the Outline has no Presets control and draws no prompt', offBtn === 0 && arborBtn === 0, { offBtn, arborBtn });
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-PLAN-PRESETS-BOARD VERIFY: PASS (${checks.length} checks)` : `\nREORG-PLAN-PRESETS-BOARD VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
