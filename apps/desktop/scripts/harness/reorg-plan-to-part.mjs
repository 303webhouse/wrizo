// "→ PART" FROM A PLAN ROW (Fable, Nov 20, 1:27 pm and 9:45 pm: "'→ Part' from a Plan row, with the tick once that Part has words (reuses 'page born from a step'); build it on train D's tip, red first").
// The Back menu's PLAN tab (reorg/backMenu/BackPlan.tsx, behind ?reorg=1, Machina): every row that is a plain card gains a "→ Part" button. It is the W2 "Write this" door aimed at the Doc:
//   - the press WRITES NOTHING: it opens an unborn page in this page's Doc (the address names the Doc, the board and the card; the same address a reload keeps);
//   - her first word births the Part as the Doc's LAST Part, named for the row (pageSettings.name, a key that already travels with the page), and in that same act the board's own
//     link record is made (the one "Write this" makes: aBoxId = the card, bEntryId = the Part), so the row and the Part are never seen apart;
//   - a row whose Part has words wears a TICK; a row whose Part has none does not; a row with a Part reads "Open Part" and opens it, creating nothing;
//   - a page that is not yet in a Doc of her own (a loose page) is made one first, as POLISH's "New part" does.
//   Nothing new is stored: the name is a pageSettings key, the link is a page_links record, the tick is READ (the Part's words), never written.
//
// The fixture (the app's own seams; WS_PLACE=1 so the account has its Top Drawer):
//   Ledger       a Doc she made: pt-1 "Ledger one opens the story." (the page she is on); its own plan board pt-own holds three cards: Opening, Midpoint, Ending
//   pt-2         a second Part of Ledger, "Words already here", linked from the card Midpoint (the board owns the record): a Part WITH words
//   pt-3         a third Part of Ledger with NO words (text of spaces), linked from the card Ending: a Part without words
//   pt-loose     a loose page "A loose page" (no Doc), with its own board pt-lown holding one card "Scene one"
//
//   P1  every plain Plan row carries the "→ Part" door except a row that already has a Part, which reads "Open Part"
//   P2  the press on Opening writes NOTHING (every stored row, set and link is as it was) and opens a fresh page whose address names Ledger, the board and the card
//   P3  her first word births the Part: Ledger's last Part, pageSettings.name "Opening", its words stored; the board holds the link (aBoxId = Opening's card, bEntryId = the Part)
//   P4  the Part opens in the stage she was in (BUILD), not in Free Write (a Part is a section of the Doc, not a sprint)
//   P5  back on the first page the Plan tab shows Opening ticked (it has words) with its door now "Open Part"; Midpoint ticked (pt-2 has words); Ending NOT ticked (pt-3 has none)
//   P6  "Open Part" on Midpoint opens pt-2 and creates nothing
//   P7  the tick is read, never written: looking at the Plan again changes nothing stored
//   P8  a loose page: the door first makes the page a Doc of its own (one set, titled for it, the page moved in), then opens the fresh page in that set
//   P9  every word the door draws is a lexicon key (none written into the component)
//   P10 the door is hidden with the switch off (today's Plan is not drawn at all) and in Arbor, where the Back menu is Machina's alone
// Run (the Actions harness):  node apps/desktop/scripts/harness/reorg-plan-to-part.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 800)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });

const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const STORE = () => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return JSON.stringify([${ALL}, JSON.parse(localStorage.getItem('writer-studio-projects') || '[]')]); })()`;
const ENTRY = (id) => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); return ${ALL}.find((x) => x.id === ${q(id)}) || null; })()`;
const ROWS = `(() => [...document.querySelectorAll('[data-back-plan] [data-plan-row]')].map((r) => ({ id: r.dataset.planRow, name: (r.querySelector('[data-plan-name]')?.value ?? r.querySelector('[data-plan-name]')?.textContent), door: r.querySelector('[data-plan-part]') ? { text: r.querySelector('[data-plan-part]').textContent.trim(), label: r.querySelector('[data-plan-part]').getAttribute('aria-label'), mode: r.querySelector('[data-plan-part]').getAttribute('data-plan-part') } : null, tick: !!r.querySelector('[data-plan-tick]') })))()`;

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
    page('pt-1', 'Ledger one opens the story.', { origin: 'project', projectId: ledger.id, orderIndex: 0 });
    page('pt-2', 'Words already here', { origin: 'project', projectId: ledger.id, orderIndex: 1 });
    page('pt-3', '   ', { origin: 'project', projectId: ledger.id, orderIndex: 2 });
    page('pt-own', 'Ledger plan', { pageType: 'board', boxes: ${q([card('o1', 'Opening', 0, 0.05), card('o2', 'Midpoint', 1, 0.2), card('o3', 'Ending', 2, 0.35)])} });
    page('pt-loose', 'A loose page', { origin: 'loose' });
    page('pt-lown', 'Loose plan', { pageType: 'board', boxes: ${q([card('l1', 'Scene one', 0, 0.05)])} });
    W.wrizoPatchEntry('pt-1', { planBoardId: 'pt-own' });
    W.wrizoPatchEntry('pt-loose', { planBoardId: 'pt-lown' });
    W.wrizoAddPageLink('pt-own', { aBoxId: 'o2', bEntryId: 'pt-2' });
    W.wrizoAddPageLink('pt-own', { aBoxId: 'o3', bEntryId: 'pt-3' });
    W.wrizoFlushNow();
    return ledger.id;
  })()`);
}

async function openPage(app, id, { theme = 'machina', reorg = true, mode = 'drafting' } = {}) {
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}'); localStorage.setItem('wrizo-mode-page-${id}', '${mode}')`);
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
const press = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);

await withHarness(async (app) => {
  await seed(app);
  await openPage(app, 'pt-1'); await openDrawer(app); await planTab(app);

  // ---- P1 ----
  const rows0 = await app.evalJs(ROWS);
  const by = (rows, id) => (rows || []).find((r) => r.id === id) || {};
  ok('P1 every plain Plan row carries the "→ Part" door; the row that already has a Part reads "Open Part"',
    !!rows0 && rows0.length === 3 && by(rows0, 'o1').door?.mode === 'new' && /Part/.test(by(rows0, 'o1').door?.text || '') && by(rows0, 'o2').door?.mode === 'open' && by(rows0, 'o3').door?.mode === 'open' && by(rows0, 'o2').door?.text !== by(rows0, 'o1').door?.text,
    rows0);

  // ---- P2 ----
  const before = await app.evalJs(STORE());
  await press(app, '[data-plan-row="o1"] [data-plan-part]');
  await app.waitFor("location.hash.indexOf('/page/new') >= 0 && !!document.querySelector('.forward-only-editor')", { timeout: 8000, label: 'a fresh page' }).catch(() => {});
  await sleep(900);
  const hash = await app.evalJs('location.hash');
  const afterPress = await app.evalJs(STORE());
  const params = new URLSearchParams((hash.split('?')[1] || ''));
  ok('P2 the press writes nothing and opens a fresh page whose address names Ledger, the board and the card',
    afterPress === before && params.get('binder') === ledgerId && params.get('gb') === 'pt-own' && params.get('gc') === 'o1', { hash, same: afterPress === before });

  // ---- P3 / P4 ----
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(200);
  for (const ch of 'Once upon') { await app.typeKeys(ch); await sleep(40); }
  await app.waitFor(`window.wrizoParts && window.wrizoParts.partsOfDoc(${q(ledgerId)}).some((p) => p.name === 'Opening' && p.words >= 2)`, { timeout: 8000, label: 'the Part born' }).catch(() => {});
  await sleep(500);
  const parts = await app.evalJs(`window.wrizoParts ? window.wrizoParts.partsOfDoc(${q(ledgerId)}).map((p) => [p.id, p.name, p.words]) : null`);
  const lastP = parts && parts[parts.length - 1];
  const board = await app.evalJs(ENTRY('pt-own'));
  const link = ((board && board.pageLinks) || []).find((l) => l.aBoxId === 'o1' && !l.deletedAt);
  const born = lastP ? await app.evalJs(ENTRY(lastP[0])) : null;
  ok('P3 her first word births the Part: Ledger\'s LAST Part, named "Opening", its words stored; the board holds the link card -> Part',
    !!lastP && lastP[1] === 'Opening' && lastP[2] >= 1 && parts.length === 4 && !!link && link.bEntryId === lastP[0] && !!born && born.pageSettings?.name === 'Opening' && /Once upon/.test(born.text || ''), { parts, link, name: born && born.pageSettings });
  const bornMode = lastP ? await app.evalJs(`localStorage.getItem('wrizo-mode-page-${lastP[0]}')`) : 'x';
  ok('P4 the Part is not opened in Free Write (it is a section of the Doc, not a sprint): the Part exists and the stage this device remembers for it is not "journal"', !!lastP && lastP[1] === 'Opening' && bornMode !== 'journal', String(bornMode));

  // ---- P5 ----
  await openPage(app, 'pt-1'); await openDrawer(app); await planTab(app);
  const rows1 = await app.evalJs(ROWS);
  ok('P5 back on the page: Opening is ticked (the Part has words) and reads "Open Part"; Midpoint ticked (pt-2 has words); Ending is NOT ticked (pt-3 has none)',
    by(rows1, 'o1').tick === true && by(rows1, 'o1').door?.mode === 'open' && by(rows1, 'o2').tick === true && by(rows1, 'o3').tick === false && by(rows1, 'o3').door?.mode === 'open', rows1);

  // ---- P7 (before P6 moves her) ----
  const s0 = await app.evalJs(STORE()); await sleep(1200); await planTab(app); await sleep(500);
  const s1 = await app.evalJs(STORE());
  ok('P7 the tick is read, never written: looking at the Plan again changes nothing stored', s0 === s1);

  // ---- P6 ----
  const c0 = await app.evalJs(STORE());
  await press(app, '[data-plan-row="o2"] [data-plan-part]');
  await app.waitFor("location.hash.indexOf('/page/pt-2') >= 0", { timeout: 8000, label: 'pt-2 opened' }).catch(() => {});
  await sleep(700);
  const h2 = await app.evalJs('location.hash');
  const c1 = await app.evalJs(STORE());
  ok('P6 "Open Part" on Midpoint opens pt-2 and creates nothing', /\/page\/pt-2/.test(h2) && c1 === c0, { h2, same: c1 === c0 });

  // ---- P8 ----
  await openPage(app, 'pt-loose'); await openDrawer(app); await planTab(app);
  const nProj0 = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').length");
  await press(app, '[data-plan-row="l1"] [data-plan-part]');
  await app.waitFor("location.hash.indexOf('/page/new') >= 0", { timeout: 8000, label: 'a fresh page' }).catch(() => {});
  await sleep(900);
  const lh = await app.evalJs('location.hash');
  const lp = new URLSearchParams(lh.split('?')[1] || '');
  const loose = await app.evalJs(ENTRY('pt-loose'));
  const proj = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-projects') || '[]')).find((p) => p.id === ${q(loose && loose.projectId)}) || null`);
  const nProj1 = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-projects') || '[]').length");
  ok('P8 a loose page: the door first makes it a Doc of its own (one new set, titled for it, the page moved in), then opens the fresh page in that set',
    !!loose && !!loose.projectId && nProj1 === nProj0 + 1 && !!proj && /loose page/i.test(proj.title || proj.name || '') && lp.get('binder') === loose.projectId && lp.get('gb') === 'pt-lown' && lp.get('gc') === 'l1', { lh, project: proj && (proj.title || proj.name), nProj0, nProj1 });

  // ---- P10 ----
  await openPage(app, 'pt-1', { reorg: false }); await openDrawer(app);
  const offDoor = await app.evalJs("document.querySelectorAll('[data-plan-part]').length");
  await openPage(app, 'pt-1', { theme: 'arbor' }); await openDrawer(app);
  const arborDoor = await app.evalJs("document.querySelectorAll('[data-plan-part]').length");
  ok('P10 with the switch off (Machina) and in Arbor with it on, no "→ Part" door is drawn anywhere', offDoor === 0 && arborDoor === 0, { offDoor, arborDoor });

  // ---- P9 ----
  const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
  const plan = read('reorg/backMenu/BackPlan.tsx');
  const lex = read('store/lexicon/canonical/chrome.ts');
  ok('P9 every word the door draws is a lexicon key, and none is written into the component',
    /t\('reorgPlanToPart'\)/.test(plan) && /t\('reorgPlanOpenPart'\)/.test(plan) && /t\('reorgPlanTick'\)/.test(plan) && /reorgPlanToPart:/.test(lex) && /reorgPlanOpenPart:/.test(lex) && /reorgPlanTick:/.test(lex) && !/['">]→ Part['"<]|Open Part/.test(plan.replace(/\/\/.*$/gm, '')));
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-PLAN-TO-PART VERIFY: PASS (${checks.length} checks)` : `\nREORG-PLAN-TO-PART VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
