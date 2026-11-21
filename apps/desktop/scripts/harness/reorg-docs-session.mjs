// THE SESSION, IN DOCS (POLISH; Fable, Nov 20, 12:15 pm: "the session moves into the rail's DOCS menu as its last item, closed by default (goal,
// what it counts, timer, progress)"). Machina only, behind ?reorg=1. The Front menu's foot no longer carries the session (the goal's hairline and
// clock, the Progress switch beside the "...", the Progress block in its menu); the Typewriter's own block stays in the "..." menu. DOCS ends with
// a Session group, closed each time DOCS opens, whose rows follow the stage table (accepted as drawn, Nick's walk Nov 20): SPRINT the goal, what
// it counts, the timer, progress; BUILD the goal, the timer, progress; EDIT progress only. Every row writes today's own saved setting (the goal,
// its unit, the timer, Progress tracking), nothing new.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and its app-made set): three pages in Top
// Drawer's set, "Session one" (put in SPRINT), "Session two" (BUILD), "Session three" (EDIT), each by the top rail's own stage tabs.
//
// OFF    S0  switch off in Machina: the Front menu's foot is main's (the goal foot, the Progress switch, the Progress block in the "..." menu)
// FOOT   F1  switch on: the Front menu's foot carries no session (no goal foot, no Progress switch, no Progress block); the "..." menu still holds
//            the Typewriter block
// DOCS   D1  DOCS' last group is the Session, closed when DOCS opens (its head says so, no rows drawn)
// STAGES D2  SPRINT: the goal, what it counts, the timer, progress, in that order
//        D3  BUILD: the goal, the timer, progress
//        D4  EDIT: progress only
// WRITES D5  the goal's number (300, Enter) is the stored goal, its unit kept; nothing else she wrote changes
//        D6  what it counts (Words) is the stored goal's unit
//        D7  the timer On, then Off, is the stored timer setting
//        D8  progress Off, then On, is the stored Progress tracking setting
//        D9  closing DOCS and opening it again: the Session is closed again (nothing kept)
// PAGE   R1  the page's rect is the same with DOCS closed and with the Session open (1366)
// WORDS  W1  every word the Session draws is a lexicon key, and DocsPanel.tsx writes none of them itself
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-docs-session.mjs
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

const PAGES = [['ss-1', 'Session one opens here'], ['ss-2', 'Session two opens here'], ['ss-3', 'Session three opens here']];
const DOCS_OPEN = "(() => { const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-docs'); const c = p && p.closest('.wz-cascade-panel'); return !!p && (!c || c.getAttribute('data-visible') !== 'false'); })()";
const SESSION = `(() => {
  const p = document.querySelector('.desk-frame-cascade-anchor .wz-reorg-docs');
  if (!p) return null;
  const groups = [...p.querySelectorAll(':scope > [data-reorg-group]')].map((g) => g.getAttribute('data-reorg-group'));
  const s = p.querySelector('[data-reorg-group="session"]');
  const fold = s ? s.querySelector('[data-session-fold]') : null;
  return { groups, fold: fold ? { expanded: fold.getAttribute('aria-expanded'), word: (fold.textContent || '').trim() } : null,
    rows: s ? [...s.querySelectorAll('[data-session-row]')].map((r) => r.getAttribute('data-session-row')) : [] };
})()`;
const FOOT = `(() => {
  const s = document.querySelector('.wz-sliver');
  if (!s) return null;
  const menu = s.querySelector('.wz-sliver-instruments-panel');
  return { goal: !!s.querySelector('.wz-sliver-goal'), progressSwitch: !!s.querySelector('[data-mode-toggle="progress"]'), more: !!s.querySelector('.wz-sliver-instruments-btn'),
    blocks: menu ? [...menu.querySelectorAll('.wz-foot-settings-block > h4')].map((h) => (h.textContent || '').trim()) : null };
})()`;
const GOAL = "(() => { try { return JSON.parse(localStorage.getItem('wrizo-writing-goal-lines') || 'null'); } catch { return 'unreadable'; } })()";
const SETTINGS = "(() => { try { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); return { timer: s.timer ?? null, instrumentsOn: s.instrumentsOn ?? null }; } catch { return null; } })()";
const WRITING = "JSON.stringify(['writer-studio-journal-entries', 'writer-studio-projects', 'writer-studio-drawers'].map((k) => localStorage.getItem(k)))";
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const topSet = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return p && p.id; })()");
  await app.evalJs(`(() => {
    ${q(PAGES)}.forEach(([id, text], i) => window.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + i + '.000Z', source: 'page', origin: 'project', projectId: ${q(topSet)}, orderIndex: i }));
    window.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, reorg = true) {
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-sliver-grip') && !!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function stage(app, key) {
  await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`);
  await app.waitFor(`document.querySelector('.reorg-top [data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
}
async function docs(app) {
  if (!(await app.evalJs(DOCS_OPEN))) await app.evalJs(click('[data-reorg-rail] [data-category="reorg-docs"]'));
  await app.waitFor(DOCS_OPEN, { label: 'DOCS open', timeout: 4000 }).catch(() => {});
  await sleep(600);
  return app.evalJs(SESSION);
}
async function session(app) {
  const s = await docs(app);
  if (s && s.fold && s.fold.expanded !== 'true') { await app.evalJs(click('[data-reorg-group="session"] [data-session-fold]')); await sleep(400); }
  return app.evalJs(SESSION);
}
async function footMenu(app) {
  const already = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!already) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
  await sleep(600);
  await app.evalJs(click('.wz-sliver .wz-sliver-instruments-btn'));
  await sleep(400);
  return app.evalJs(FOOT);
}
const press = async (app, sel) => { const r = await app.evalJs(click(sel)); await sleep(400); return r; };

await withHarness(async (app) => {
  await seed(app);

  // OFF: main's foot
  await open(app, 'ss-1', false);
  const s0 = await footMenu(app);
  ok('S0: switch off in Machina - the Front menu\'s foot is main\'s (the goal foot, the Progress switch, the Progress block in the "..." menu)',
    !!s0 && s0.goal && s0.progressSwitch && s0.more && Array.isArray(s0.blocks) && s0.blocks.includes('Progress Tracking'), s0);

  // the three stages, each set by the top rail's own tabs (stored per page by the app)
  await open(app, 'ss-1'); await stage(app, 'freewrite');
  await open(app, 'ss-2'); await stage(app, 'draft');
  await open(app, 'ss-3'); await stage(app, 'revise');

  await open(app, 'ss-1');
  const f1 = await footMenu(app);
  ok('F1: switch on - the Front menu\'s foot carries no session (no goal foot, no Progress switch, no Progress block); the "..." menu still holds the Typewriter block',
    !!f1 && !f1.goal && !f1.progressSwitch && f1.more && Array.isArray(f1.blocks) && !f1.blocks.includes('Progress Tracking') && f1.blocks.includes('Typewriter Mode'), f1);
  await app.key('Escape'); await sleep(300);

  await open(app, 'ss-1');
  const pageShut = await app.evalJs(PAGE);
  const d1 = await docs(app);
  ok('D1: DOCS\' last group is the Session, closed when DOCS opens (its head says so, no rows drawn)',
    !!d1 && d1.groups[d1.groups.length - 1] === 'session' && !!d1.fold && d1.fold.expanded === 'false' && d1.fold.word === 'Session' && d1.rows.length === 0, d1);
  const d2 = await session(app);
  const pageOpen = await app.evalJs(PAGE);
  ok('D2: SPRINT - the goal, what it counts, the timer, progress, in that order', !!d2 && q(d2.rows) === q(['goal', 'counts', 'timer', 'progress']), d2);
  ok('R1: the page\'s rect is the same with DOCS closed and with the Session open (1366)', !!pageShut && pageShut === pageOpen, { pageShut, pageOpen });

  // WRITES, on the SPRINT page (every row there)
  const writing0 = await app.evalJs(WRITING);
  const goal0 = await app.evalJs(GOAL);
  await app.evalJs(`(() => { const i = document.querySelector('[data-session-row="goal"] input'); if (!i) return false; i.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '300'); i.dispatchEvent(new Event('input', { bubbles: true }));
    i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return true; })()`);
  await sleep(500);
  const goal1 = await app.evalJs(GOAL);
  ok('D5: the goal\'s number (300, Enter) is the stored goal, its unit kept; nothing else she wrote changes',
    !!goal1 && goal1.n === 300 && goal1.unit === ((goal0 && goal0.unit) || 'lines') && (await app.evalJs(WRITING)) === writing0, { goal0, goal1 });
  await press(app, '[data-session-row="counts"] [data-pick="words"]');
  const goal2 = await app.evalJs(GOAL);
  ok('D6: what it counts (Words) is the stored goal\'s unit', !!goal2 && goal2.unit === 'words' && goal2.n === 300, goal2);
  await press(app, '[data-session-row="timer"] [data-toggle="on"]');
  const t1 = await app.evalJs(SETTINGS);
  await press(app, '[data-session-row="timer"] [data-toggle="off"]');
  const t2 = await app.evalJs(SETTINGS);
  ok('D7: the timer On, then Off, is the stored timer setting', !!t1 && t1.timer === true && !!t2 && t2.timer === false, { t1, t2 });
  await press(app, '[data-session-row="progress"] [data-toggle="off"]');
  const p1 = await app.evalJs(SETTINGS);
  await press(app, '[data-session-row="progress"] [data-toggle="on"]');
  const p2 = await app.evalJs(SETTINGS);
  ok('D8: progress Off, then On, is the stored Progress tracking setting', !!p1 && p1.instrumentsOn === false && !!p2 && p2.instrumentsOn === true && (await app.evalJs(WRITING)) === writing0, { p1, p2 });

  // closing and opening DOCS again
  await app.evalJs(click('[data-reorg-rail] [data-category="reorg-docs"]'));
  await sleep(700);
  const closed = !(await app.evalJs(DOCS_OPEN));
  const d9 = await docs(app);
  ok('D9: closing DOCS and opening it again - the Session is closed again (nothing kept)', closed && !!d9 && !!d9.fold && d9.fold.expanded === 'false' && d9.rows.length === 0, { closed, d9 });

  await open(app, 'ss-2');
  const d3 = await session(app);
  ok('D3: BUILD - the goal, the timer, progress', !!d3 && q(d3.rows) === q(['goal', 'timer', 'progress']), d3);
  await open(app, 'ss-3');
  const d4 = await session(app);
  ok('D4: EDIT - progress only', !!d4 && q(d4.rows) === q(['progress']), d4);

  const chrome = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const panel = fs.readFileSync(path.join(SRC, 'reorg', 'panels', 'DocsPanel.tsx'), 'utf8');
  const keys = [['reorgSession', 'Session'], ['reorgSessionGoal', 'Goal'], ['reorgSessionCounts', 'Counts'], ['reorgSessionTimer', 'Timer'], ['reorgSessionProgress', 'Progress'],
    ['reorgSessionLines', 'Lines'], ['reorgSessionWords', 'Words']];
  const declared = keys.map(([k, v]) => [k, new RegExp(`\\b${k}: '([^']*)'`).exec(chrome)?.[1] ?? null, v]);
  const used = keys.map(([k]) => panel.includes(`'${k}'`));
  const literal = /['">](Session|Goal|Counts|Timer|Progress|Lines)['"<]/.test(panel);
  ok('W1: every word the Session draws is a lexicon key, and DocsPanel.tsx writes none of them itself',
    declared.every(([, got, want]) => got === want) && used.every(Boolean) && !literal, { declared, used, literal });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 13;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nREORG-DOCS-SESSION VERIFY: PASS (${checks.length} checks)` : `\nREORG-DOCS-SESSION VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
