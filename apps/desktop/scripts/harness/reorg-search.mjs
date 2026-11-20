// THE REORG'S SEARCH (POLISH; reorg plan draft 2, section 3 item 3; Fable, Nov 20, 11:45 am: "the top rail's door (starts in this Doc, widens) and a
// search field in each Back-menu tab that turns the menu into the search menu; the last search word to users.prefs"). Machina only, behind
// ?reorg=1, on a page. The search takes the Back menu's place (the prototype's searchMenu, Nick's Nov 14 rulings): one row of scopes - This Doc
// (its words by Part), This Project (its Docs and Boards), Everything (every Project, the Notebook and Unfiled, under a head for each) - with
// "Widen to" under the results; two letters or more; the found words of the Part she is on are marked on the page (a paint layer: no letter
// moves); Enter goes to the next one in this Doc (into the next Part when this one has no more), Shift+Enter the one before; a result in another
// Doc opens it with the return chip; Esc gives the Back menu back as it was. The last search word is saved with the account (users.prefs'
// searchWord, Nick's SAVED DATA ruling Nov 19) and fills the field the next time.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer):
//   Harbor (a Drawer)  "Tolls", a set: three Parts - t-1 "The tolls rose at dawn. Tolls again." / t-2 "Nothing here about it" /
//                      t-3 "A toll booth stood empty"
//                      "Ferry", a set: f-1 "The ferry paid its toll"
//                      "Maps", a set of boards only: "Harbor map", a board with one text card "where the tolls are"
//   Other (a Drawer)   "Far", a set: o-1 "A toll road far away"
//   Unfiled            l-1 "A toll left unfiled" (loose)
// The open page is t-1 (Tolls' Part 1). The word is "toll": This Doc 3 (Part 1: 2, Part 3: 1), This Project 5 (Tolls 3, Ferry 1, the card 1),
// Everything 7 (Harbor 5, Other 1, Unfiled 1).
//
// OFF    X0  switch off in Machina: no search door in any Back menu tab, and the top rail's door is not drawn
// OPEN   B1  the top rail's door opens the Back menu as the search menu: the tab row gone, the field focused, This Doc pressed, the three scopes
//            in lexicon words
//        B2  one letter says two letters or more, and finds nothing
// DOC    D1  "toll" in This Doc: a group for Part 1 (2) and Part 3 (1), none for Part 2; the count says 3 in this Doc
//        D2  the two found words of Part 1 are marked on the page, the first as the one she is on; the page's rect is the one it had with the
//            search shut, and no letter moved (the editor's text is the same)
//        D3  Enter: the next one in Part 1; Enter again: into Part 3 (its page), its word the one she is on and marked; Shift+Enter: back to Part
//            1's second
// WIDEN  W1  "Widen to This Project": Tolls (two rows shown, "+ 1 more in this Doc"), Ferry (1), the board Harbor map (1 card); 5 in Harbor
//        W2  Everything: a head for Harbor (5), Other (1) and Unfiled (1); 7 everywhere
//        O1  a result in another Doc (Ferry) opens it, with the return chip; the search is still open there
// NONE   N1  a word that is nowhere says so
// TABS   T1  each Back menu tab (PLAN, ASSETS, FEEDBACK) has a search field; the ASSETS one opens the search on This Project, PLAN's on This Doc
//        T2  Esc gives the Back menu back on the tab she came from (ASSETS); from the top rail with the menu shut, Esc shuts it
// SAVED  P1  the last search word is the account's searchWord (users.prefs, its local copy), and opening the search again starts with it
//            selected in the field
// WORDS  WD  every word the search draws is a lexicon key, and the search's components write none themselves
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-search.mjs
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

const MENU = `(() => {
  const m = document.querySelector('[data-search-menu]');
  const panel = document.querySelector('.wz-tutor-panel');
  // a closed menu reads as empty lists, so a check that needs the menu FAILS on it rather than crashing the run
  if (!m) return { open: false, panelOpen: panel ? panel.getAttribute('data-open') : null, tabs: !!(panel && panel.querySelector('[role="tablist"]')),
    q: null, focused: false, sel: null, back: '', reach: [], count: '', line: '', groups: [], hits: [], more: [], widen: null };
  const i = m.querySelector('[data-search-q]');
  return { open: true, panelOpen: panel ? panel.getAttribute('data-open') : null, tabs: !!(panel && panel.querySelector('[role="tablist"]')),
    q: i ? i.value : null, focused: !!i && document.activeElement === i, sel: i ? [i.selectionStart, i.selectionEnd] : null,
    back: (m.querySelector('[data-search-back]')?.textContent || '').trim(),
    reach: [...m.querySelectorAll('[data-search-reach]')].map((b) => [b.getAttribute('data-search-reach'), (b.textContent || '').trim(), b.getAttribute('aria-pressed'), b.disabled]),
    count: (m.querySelector('[data-search-count]')?.textContent || '').trim(),
    line: (m.querySelector('[data-search-line]')?.textContent || '').trim(),
    groups: [...m.querySelectorAll('[data-search-group]')].map((g) => [g.getAttribute('data-search-group'), g.getAttribute('data-group-n'), g.getAttribute('data-group-top') === 'true']),
    hits: [...m.querySelectorAll('[data-search-hit]')].map((h) => [h.getAttribute('data-hit-entry'), Number(h.getAttribute('data-hit-at')), h.getAttribute('aria-current') === 'true']),
    more: [...m.querySelectorAll('[data-search-more]')].map((b) => (b.textContent || '').trim()),
    widen: (m.querySelector('[data-search-widen]')?.textContent || '').trim() || null };
})()`;
const MARKS = "(() => { const H = (typeof CSS !== 'undefined' && CSS.highlights) || null; if (!H) return null; const a = H.get('wz-search'), c = H.get('wz-search-cur');"
  + " const words = (h) => (h ? [...h].map((r) => r.toString()) : []); return { all: words(a), cur: words(c) }; })()";
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const EDTEXT = "(document.querySelector('.forward-only-editor')?.innerText || '').replace(/\\u200b/g, '').trim()";
const PREF = "(() => { try { const r = JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}'); return r.searchWord || null; } catch { return 'unreadable'; } })()";
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const typeQ = (v) => `(() => { const i = document.querySelector('[data-search-menu] [data-search-q]'); if (!i) return false; i.focus();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${q(v)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const keyQ = (key, shift = false) => `(() => { const i = document.querySelector('[data-search-menu] [data-search-q]'); if (!i) return false;
  i.dispatchEvent(new KeyboardEvent('keydown', { key: ${q(key)}, shiftKey: ${shift}, bubbles: true, cancelable: true })); return true; })()`;

let ids = {};
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  ids = await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + (id.length % 10) + '.000Z', source: 'page', ...extra });
    const harbor = W.wrizoCreateDrawer('Harbor'), other = W.wrizoCreateDrawer('Other');
    const set = (name, drawer) => { const p = W.wrizoCreateProject(name); W.wrizoSetProjectDrawer(p.id, drawer.id); return p; };
    const tolls = set('Tolls', harbor), ferry = set('Ferry', harbor), maps = set('Maps', harbor), far = set('Far', other);
    page('t-1', 'The tolls rose at dawn. Tolls again.', { origin: 'project', projectId: tolls.id, orderIndex: 0 });
    page('t-2', 'Nothing here about it', { origin: 'project', projectId: tolls.id, orderIndex: 1 });
    page('t-3', 'A toll booth stood empty', { origin: 'project', projectId: tolls.id, orderIndex: 2 });
    page('f-1', 'The ferry paid its toll', { origin: 'project', projectId: ferry.id, orderIndex: 0 });
    page('m-b', 'Harbor map', { origin: 'project', projectId: maps.id, pageType: 'board', boxes: [{ id: 'm-card', kind: 'text', text: 'where the tolls are', x: 40, y: 40, w: 220, h: 90 }] });
    page('o-1', 'A toll road far away', { origin: 'project', projectId: far.id, orderIndex: 0 });
    page('l-1', 'A toll left unfiled', { origin: 'loose' });
    W.wrizoFlushNow();
    return { harbor: harbor.id, other: other.id, tolls: tolls.id, ferry: ferry.id };
  })()`);
}
async function open(app, id, reorg = true) {
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-tutor-grip') && !!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(1200);
}
async function backMenu(app, tab) {
  const isOpen = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (!isOpen) await app.evalJs(click('.wz-tutor-grip'));
  await app.waitFor("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'", { label: 'the Back menu open', timeout: 4000 }).catch(() => {});
  await sleep(400);
  if (tab) { await app.evalJs(click(`#wz-tutor-tab-${tab}`)); await sleep(400); }
}
async function search(app, word) { await app.evalJs(typeQ(word)); await sleep(500); return app.evalJs(MENU); }
async function key(app, k, shift = false) { await app.evalJs(keyQ(k, shift)); await sleep(900); }

await withHarness(async (app) => {
  await seed(app);

  // OFF
  await open(app, 't-1', false);
  await backMenu(app);
  const x0 = await app.evalJs("({ field: !!document.querySelector('[data-search-field]'), door: !!document.querySelector('[data-top-search]'), menu: !!document.querySelector('[data-search-menu]') })");
  ok('X0: switch off in Machina - no search door in any Back menu tab, and the top rail\'s door is not drawn', !x0.field && !x0.door && !x0.menu, x0);

  // OPEN, from the top rail with the Back menu shut
  await open(app, 't-1');
  const pageShut = await app.evalJs(PAGE), textShut = await app.evalJs(EDTEXT);
  await app.evalJs(click('[data-top-search]'));
  await app.waitFor("!!document.querySelector('[data-search-menu]')", { label: 'the search menu', timeout: 4000 }).catch(() => {});
  await sleep(500);
  const b1 = await app.evalJs(MENU);
  ok('B1: the top rail\'s door opens the Back menu as the search menu: the tab row gone, the field focused, This Doc pressed, the three scopes in lexicon words',
    b1.open && b1.panelOpen === 'true' && !b1.tabs && b1.focused
    && q(b1.reach.map((r) => [r[0], r[1], r[2]])) === q([['doc', 'This Doc', 'true'], ['project', 'This Project', 'false'], ['all', 'Everything', 'false']]), b1);
  const b2 = await search(app, 't');
  ok('B2: one letter says two letters or more, and finds nothing', b2.open && b2.line === 'Two letters or more.' && b2.hits.length === 0 && b2.groups.length === 0, b2);

  const d1 = await search(app, 'toll');
  ok('D1: "toll" in This Doc - a group for Part 1 (2) and Part 3 (1), none for Part 2; the count says 3 in this Doc',
    q(d1.groups.map((g) => [g[0], g[1]])) === q([['t-1', '2'], ['t-3', '1']]) && q(d1.hits.map((h) => [h[0], h[1]])) === q([['t-1', 4], ['t-1', 24], ['t-3', 2]]) && d1.count === '3 in this Doc', d1);
  const m2 = await app.evalJs(MARKS);
  const pageOpen = await app.evalJs(PAGE), textOpen = await app.evalJs(EDTEXT);
  ok('D2: the two found words of Part 1 are marked on the page, the first as the one she is on; the page\'s rect is the one it had with the search shut, and no letter moved',
    !!m2 && q(m2.all) === q(['toll', 'Toll']) && q(m2.cur) === q(['toll']) && d1.hits[0] && d1.hits[0][2] === true && pageOpen === pageShut && textOpen === textShut,
    { m2, pageShut, pageOpen, same: textOpen === textShut });

  await key(app, 'Enter');
  const e1 = await app.evalJs(MENU), em1 = await app.evalJs(MARKS);
  await key(app, 'Enter');
  await app.waitFor("location.hash === '#/page/t-3' && !!document.querySelector('.forward-only-editor')", { label: 'Part 3', timeout: 8000 }).catch(() => {});
  await sleep(900);
  const e2 = await app.evalJs(MENU), em2 = await app.evalJs(MARKS), h2 = await app.evalJs('location.hash');
  await key(app, 'Enter', true);
  await app.waitFor("location.hash === '#/page/t-1' && !!document.querySelector('.forward-only-editor')", { label: 'back to Part 1', timeout: 8000 }).catch(() => {});
  await sleep(900);
  const e3 = await app.evalJs(MENU), h3 = await app.evalJs('location.hash');
  const curOf = (m) => (m && m.hits ? (m.hits.find((h) => h[2]) || null) : null);
  ok('D3: Enter - the next one in Part 1; Enter again - into Part 3 (its page), its word the one she is on and marked; Shift+Enter - back to Part 1\'s second',
    q(curOf(e1)) === q(['t-1', 24, true]) && !!em1 && q(em1.cur) === q(['Toll'])
    && h2 === '#/page/t-3' && e2.open && q(curOf(e2)) === q(['t-3', 2, true]) && !!em2 && q(em2.cur) === q(['toll'])
    && h3 === '#/page/t-1' && e3.open && q(curOf(e3)) === q(['t-1', 24, true]),
    { e1: curOf(e1), em1, h2, e2: curOf(e2), em2, h3, e3: curOf(e3) });

  // WIDEN
  const w0 = await app.evalJs(MENU);
  await app.evalJs(click('[data-search-menu] [data-search-widen]')); await sleep(600);
  const w1 = await app.evalJs(MENU);
  ok('W1: "Widen to This Project" - Tolls (two rows shown, "+ 1 more in this Doc"), Ferry (1), the board Harbor map (1 card); 5 in Harbor',
    w0.widen === 'Widen to This Project' && w1.reach.find((r) => r[0] === 'project')?.[2] === 'true'
    && q(w1.groups.map((g) => [g[0], g[1]])) === q([[ids.tolls, '3'], [ids.ferry, '1'], ['m-b', '1']])
    && w1.hits.filter((h) => ['t-1', 't-2', 't-3'].includes(h[0])).length === 2 && q(w1.more) === q(['+ 1 more in this Doc'])
    && w1.hits.some((h) => h[0] === 'f-1') && w1.hits.some((h) => h[0] === 'm-b') && w1.count === '5 in Harbor', { widen: w0.widen, w1 });
  await app.evalJs(click('[data-search-menu] [data-search-reach="all"]')); await sleep(600);
  const w2 = await app.evalJs(MENU);
  const tops = w2.groups.filter((g) => g[2]).map((g) => [g[0], g[1]]);
  ok('W2: Everything - a head for Harbor (5), Other (1) and Unfiled (1); 7 everywhere',
    q(tops) === q([[ids.harbor, '5'], [ids.other, '1'], ['unfiled', '1']]) && w2.count === '7 everywhere' && w2.hits.some((h) => h[0] === 'o-1') && w2.hits.some((h) => h[0] === 'l-1'), { tops, count: w2.count });

  const n1 = await search(app, 'zzq');
  ok('N1: a word that is nowhere says so', n1.line === 'Nothing found for “zzq”.' && n1.hits.length === 0, n1);
  await search(app, 'toll');
  await app.evalJs(click('[data-search-menu] [data-search-reach="project"]')); await sleep(600);
  await app.evalJs(click('[data-search-menu] [data-search-hit][data-hit-entry="f-1"]'));
  await app.waitFor("location.hash === '#/page/f-1' && !!document.querySelector('.forward-only-editor')", { label: 'Ferry', timeout: 8000 }).catch(() => {});
  await sleep(900);
  const o1 = await app.evalJs(`({ hash: location.hash, chip: !!document.querySelector('.wz-back-to-board'), menu: ${MENU} })`);
  ok('O1: a result in another Doc (Ferry) opens it, with the return chip; the search is still open there', o1.hash === '#/page/f-1' && o1.chip && o1.menu.open, { hash: o1.hash, chip: o1.chip, open: o1.menu.open });
  await key(app, 'Escape');

  // TABS
  await open(app, 't-1');
  await backMenu(app, 'plan');
  const fPlan = await app.evalJs("!!document.querySelector('.wz-tutor-panel [data-search-field]')");
  await app.evalJs(click('#wz-tutor-tab-tutor')); await sleep(300);
  const fTutor = await app.evalJs("!!document.querySelector('.wz-tutor-panel [data-search-field]')");
  await app.evalJs(click('#wz-tutor-tab-plan')); await sleep(300);
  await app.evalJs("(() => { const f = document.querySelector('.wz-tutor-panel [data-search-field]'); if (f) { f.focus(); f.click(); } return null; })()"); await sleep(500);
  const tPlan = await app.evalJs(MENU);
  await key(app, 'Escape');
  await app.evalJs(click('#wz-tutor-tab-links')); await sleep(300);
  const fLinks = await app.evalJs("!!document.querySelector('.wz-tutor-panel [data-search-field]')");
  await app.evalJs("(() => { const f = document.querySelector('.wz-tutor-panel [data-search-field]'); if (f) { f.focus(); f.click(); } return null; })()"); await sleep(500);
  const tAssets = await app.evalJs(MENU);
  ok('T1: each Back menu tab (PLAN, ASSETS, FEEDBACK) has a search field; the ASSETS one opens the search on This Project, PLAN\'s on This Doc',
    fPlan && fTutor && fLinks && tPlan.open && tPlan.reach.find((r) => r[0] === 'doc')?.[2] === 'true' && tAssets.open && tAssets.reach.find((r) => r[0] === 'project')?.[2] === 'true',
    { fPlan, fTutor, fLinks, plan: tPlan.reach, assets: tAssets.reach });
  await key(app, 'Escape');
  const t2a = await app.evalJs("({ menu: !!document.querySelector('[data-search-menu]'), open: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open'), tab: document.querySelector('#wz-tutor-tab-links')?.getAttribute('aria-selected') })");
  await app.evalJs(click('.wz-tutor-grip')); await sleep(500);
  await app.evalJs(click('[data-top-search]')); await sleep(600);
  await key(app, 'Escape');
  const t2b = await app.evalJs("({ menu: !!document.querySelector('[data-search-menu]'), open: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') })");
  ok('T2: Esc gives the Back menu back on the tab she came from (ASSETS); from the top rail with the menu shut, Esc shuts it',
    !t2a.menu && t2a.open === 'true' && t2a.tab === 'true' && !t2b.menu && t2b.open === 'false', { t2a, t2b });

  // SAVED
  const pref = await app.evalJs(PREF);
  await app.evalJs(click('[data-top-search]')); await sleep(600);
  const p1 = await app.evalJs(MENU);
  ok('P1: the last search word is the account\'s searchWord (users.prefs, its local copy), and opening the search again starts with it selected in the field',
    !!pref && pref.word === 'toll' && typeof pref.at === 'string' && p1.open && p1.q === 'toll' && q(p1.sel) === q([0, 4]), { pref, q: p1.q, sel: p1.sel });

  // WORDS
  const chrome = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const dir = path.join(SRC, 'reorg', 'search');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.tsx')) : [];
  const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const keys = [['reorgSearchReachDoc', 'This Doc'], ['reorgSearchReachProject', 'This Project'], ['reorgSearchReachAll', 'Everything'], ['reorgSearchTwo', 'Two letters or more.'],
    ['reorgSearchNone', 'Nothing found for “{q}”.'], ['reorgSearchInDoc', '{n} in this Doc'], ['reorgSearchInProject', '{n} in {project}'], ['reorgSearchEverywhere', '{n} everywhere'],
    ['reorgSearchMore', '+ {n} more in this Doc'], ['reorgSearchWiden', 'Widen to {reach}']];
  const declared = keys.map(([k, v]) => [k, new RegExp(`\\b${k}: '([^']*)'`).exec(chrome)?.[1] ?? null, v]);
  const literal = /['">](This Doc|This Project|Everything|Two letters|Nothing found|Widen to)/.test(src);
  ok('WD: every word the search draws is a lexicon key, and the search\'s components write none themselves',
    files.length > 0 && declared.every(([, got, want]) => got === want) && keys.every(([k]) => src.includes(`'${k}'`)) && !literal, { files, declared: declared.filter(([, g, w]) => g !== w), literal });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 14;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nREORG-SEARCH VERIFY: PASS (${checks.length} checks)` : `\nREORG-SEARCH VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
