// SPRINT HAS NO MENUS (POLISH; Nick, Nov 20, 1:13 pm, through Fable 3:15 pm: "SPRINT has no menus in every theme. T1, I1, P1 retire (the pen
// too)"). On a page in Free Write (SPRINT), in every theme and with the reorg's switch on or off, the Front menu (the Tools drawer, the Sliver) is
// not drawn at all: no drawer, no tab, so no Text, Ink or Parts tools there, and no pen. BUILD (Draft) keeps it as today. The drawer is an overlay
// in its own anchor (components/DeskFrame.tsx), so leaving it out moves nothing on the page (no new geometry is asserted here).
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer): one page in Top Drawer's set, "Sprint page".
//
// BUILD  N0  in Draft, in Arbor, Flux and Machina, the Front menu's tab is drawn (today's drawer)
// SPRINT N1  in Free Write, in Arbor, Flux and Machina, no Front menu: no drawer, no tab; the page is there
//        N2  the reorg's switch on (Machina): no Front menu in SPRINT; BUILD still has it, with its PARTS tab
//        N3  no pen in SPRINT: no INK tab, no ink mark on any tab, in any theme
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/sprint-no-menus.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THEMES = ['plateau', 'flux', 'machina'];

const MENU = "({ sliver: !!document.querySelector('.wz-sliver'), grip: !!document.querySelector('.wz-sliver-grip'), editor: !!document.querySelector('.forward-only-editor'),"
  + " ink: !!document.querySelector('#wz-sliver-tab-ink') || !!document.querySelector('.wz-sliver-grip-mark[data-instrument=\"ink\"]'), parts: !!document.querySelector('#wz-sliver-tab-parts') })";

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id));
    const set = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id);
    window.wrizoCreateJournalPage({ id: 'sp-1', text: 'Sprint page words here', createdAt: '2026-04-01T00:00:01.000Z', source: 'page', origin: 'project', projectId: set.id, orderIndex: 0 });
    window.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, theme, reorg = false) {
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/sp-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the page (${theme})`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function stage(app, key) {
  await app.evalJs(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')?.click(); null`);
  await app.waitFor(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
  return app.evalJs(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true'`);
}

await withHarness(async (app) => {
  await seed(app);
  const n0 = {}, n1 = {};
  for (const theme of THEMES) {
    await open(app, theme);
    const inDraft = await stage(app, 'draft');
    n0[theme] = { inDraft, ...(await app.evalJs(MENU)) };
    const inSprint = await stage(app, 'freewrite');
    n1[theme] = { inSprint, ...(await app.evalJs(MENU)) };
    await stage(app, 'draft');
  }
  ok('N0: in Draft, in Arbor, Flux and Machina, the Front menu\'s tab is drawn (today\'s drawer)', THEMES.every((t) => n0[t].inDraft && n0[t].grip && n0[t].editor), n0);
  ok('N1: in Free Write, in Arbor, Flux and Machina, no Front menu - no drawer, no tab; the page is there', THEMES.every((t) => n1[t].inSprint && !n1[t].sliver && !n1[t].grip && n1[t].editor), n1);

  await open(app, 'machina', true);
  const onDraft = await stage(app, 'draft');
  const rDraft = await app.evalJs(MENU);
  const onSprint = await stage(app, 'freewrite');
  const rSprint = await app.evalJs(MENU);
  ok('N2: the reorg\'s switch on (Machina) - no Front menu in SPRINT; BUILD still has it, with its PARTS tab',
    onDraft && rDraft.grip && onSprint && !rSprint.sliver && !rSprint.grip && rSprint.editor, { onDraft, rDraft, onSprint, rSprint });
  await stage(app, 'draft');
  ok('N3: no pen in SPRINT - no INK tab, no ink mark on any tab, in any theme', THEMES.every((t) => n1[t].inSprint && !n1[t].ink) && !rSprint.ink, { n1, rSprint });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 4;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSPRINT-NO-MENUS VERIFY: PASS (${checks.length} checks)` : `\nSPRINT-NO-MENUS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
