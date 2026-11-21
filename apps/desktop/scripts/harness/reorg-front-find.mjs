// FIND IN THE FRONT MENU'S TEXT TAB (machina-stage-menus-decide.md T3: "Everything in BUILD, plus Find (✔ NICK, the word)"; "Find (EDIT; ○ BUILD
// too)"; Fable, Nov 21, 12:35 am: "a 'Find' in the Front menu's TEXT tab in EDIT (and BUILD), stage menus T3, that opens YOUR Find & Replace in
// this Doc (no second finder)"). One button at the foot of TEXT, above Page setup, in BUILD and EDIT only; pressed, it opens the Back menu as
// the search menu (reorg/search) on This Doc, the field focused, as the top rail's door does. Machina, ?reorg=1.
//
// The fixture (seams only): a set "Tolls" with Parts t-1, t-2 (the word "toll" in t-1); she is on t-1.
//
// BUILD   F1  the TEXT tab carries Find (a button, the word "Find"); pressed, the search menu opens on This Doc with the field focused
// EDIT    F2  Find is there in EDIT too; with the search already open on another scope (All), pressing Find brings it back to This Doc
// SPRINT  F3  Free Write's TEXT tab has no Find
// ONE     F4  Find opens the search the top rail opens (reorg/search/searchStore.ts openSearch + setSearchReach): no second finder in the Sliver
// PAGE    P1  the page's rects and editor node are the same across the press (the search having opened)
// WORDS   W1  "Find" is a lexicon key used in the source
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-front-find.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';   // the Desk's bootstrap mints the Top Drawer the seed waits on
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const src = (f) => { const p = path.join(SRC, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`;
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const FIND = "(() => { const b = document.querySelector('.wz-sliver [data-front-find]'); return b ? { tag: b.tagName, words: (b.textContent || '').replace(/\\s+/g, ' ').trim() } : null; })()";
const SEARCH = `(() => { const i = document.querySelector('[data-search-q]');
  return { menu: !!document.querySelector('[data-search-menu]'), field: !!i, focused: !!i && document.activeElement === i,
    reach: [...document.querySelectorAll('[data-search-reach]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.getAttribute('data-search-reach')) }; })()`;

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  return app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const d = W.wrizoCreateDrawer('Harbor'); const tolls = W.wrizoCreateProject('Tolls'); W.wrizoSetProjectDrawer(tolls.id, d.id);
    page('t-1', 'The tolls rose at dawn.', { origin: 'project', projectId: tolls.id, orderIndex: 0 });
    page('t-2', 'A toll booth stood empty', { origin: 'project', projectId: tolls.id, orderIndex: 1 });
    W.wrizoFlushNow();
    return { tolls: tolls.id };
  })()`);
}

async function openAt(app, id, key) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`);
  await app.waitFor(`document.querySelector('.reorg-top [data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true'`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-text')?.click(); null"); await sleep(400);
}

await withHarness(async (app) => {
  const ids = await seed(app);

  // ---- BUILD ------------------------------------------------------------------------------------------------------------------------------
  await openAt(app, 't-1', 'draft');
  const f1a = await app.evalJs(FIND);
  const r0 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__ffMark = 1; return null; })()");
  await app.evalJs(click('.wz-sliver [data-front-find]')); await sleep(900);
  const f1 = await app.evalJs(SEARCH);
  const r1 = await app.evalJs(PAGE);
  const kept = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__ffMark");
  ok('F1 BUILD: the TEXT tab carries Find (a button, "Find"); pressed, the search menu opens on This Doc with the field focused',
    !!f1a && f1a.tag === 'BUTTON' && f1a.words === 'Find' && f1.menu && f1.field && f1.focused && JSON.stringify(f1.reach) === '["doc"]', { ids, f1a, f1 });
  ok('P1 the page\'s rects and editor node are the same across the press (the search having opened)', !!r0 && r0 === r1 && kept && f1.menu, { r0, r1, kept });

  // ---- EDIT -------------------------------------------------------------------------------------------------------------------------------
  await openAt(app, 't-1', 'revise');
  const f2a = await app.evalJs(FIND);
  await app.evalJs(click('[data-top-search]')); await sleep(700);
  await app.evalJs(click('[data-search-reach="all"]')); await sleep(400);
  const before = await app.evalJs(SEARCH);
  await app.evalJs(click('.wz-sliver [data-front-find]')); await sleep(900);
  const f2 = await app.evalJs(SEARCH);
  ok('F2 EDIT: Find is there too; with the search already open on All, pressing Find brings it back to This Doc',
    !!f2a && f2a.words === 'Find' && before.menu && JSON.stringify(before.reach) === '["all"]' && f2.menu && JSON.stringify(f2.reach) === '["doc"]', { f2a, before, f2 });

  // ---- SPRINT -----------------------------------------------------------------------------------------------------------------------------
  await openAt(app, 't-1', 'freewrite');
  const f3 = { find: await app.evalJs(FIND), sliver: await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') ?? null") };
  ok('F3 Free Write\'s TEXT tab has no Find (the drawer having been opened)', f3.find === null && !!f2a, f3);
});

// ---- ONE FINDER + WORDS (source) ---------------------------------------------------------------------------------------------------------
{
  const sliver = src('components/Sliver.tsx');
  const imp = /import \{[^}]*\bopenSearch\b[^}]*\bsetSearchReach\b[^}]*\} from '\.\.\/reorg\/search\/searchStore';/.test(sliver) || /import \{[^}]*\bsetSearchReach\b[^}]*\bopenSearch\b[^}]*\} from '\.\.\/reorg\/search\/searchStore';/.test(sliver);
  const press = /data-front-find[^>]*onClick=\{\(\) => \{ openSearch\('bar'\); setSearchReach\('doc'\); \}\}/.test(sliver);
  const second = /from '\.\.\/reorg\/search\/(searchFind|SearchMenu|searchMarks|replace)'/.test(sliver);
  ok('F4 Find opens the search the top rail opens (searchStore openSearch + setSearchReach): no second finder in the Sliver', imp && press && !second, { imp, press, second });
  const terms = src('store/lexicon/terms.ts'), canon = src('store/lexicon/canonical/chrome.ts');
  ok('W1 "Find" is a lexicon key (terms.ts, the canonical table) used in the Sliver', terms.includes("'reorgFrontFind'") && /reorgFrontFind: 'Find',/.test(canon) && sliver.includes("t('reorgFrontFind')"), {});
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-FRONT-FIND VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-FRONT-FIND VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
