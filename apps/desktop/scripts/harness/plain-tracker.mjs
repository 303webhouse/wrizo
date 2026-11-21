// THE PLAIN PROGRESS TRACKER (POLISH; the Wrizors' spec draft 2, Downloads\plain-progress-tracker-spec.md, APPROVED by Nick Nov 20, 3:57 pm; Fable
// 5:25 pm rulings). When the session's "Use Theme Progress Tracker" switch is off (writingSettings.themeTracker, default true; FIX's writing fact
// carries it to the account), every theme shows ONE plain row under the page where its own tracker sits, as wide as the page: the count on the
// left (the session's goal: "{n} / {goal} words"), a thin 4 px bar with a 2 x 12 brass tick at her point, and the timer's ELAPSED time on the right
// (no countdown until a timer length is ruled). Four states: goal + timer; Goal Reached (a full bar, no tick); the count alone; the count and the
// time. Each theme's quiet label colour, the track that colour at 28%; no theme art (no vines, no glitch, no Run); no motion, no celebration; no
// fade (as the theme trackers). Arbor keeps its backing plate and gives the tick its 1 px ink edge (#23272B). Arbor's own row (a fixed 250) and the
// theme trackers are unchanged while the switch is on. Framed pages (1366 wide) only.
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer): one page of 412 words, opened in Draft.
// The goal and the timer are the session's stored settings (wrizo-writing-goal-lines, wrizo-writing-settings), set before each reload.
//
// ON     P0  the switch on (the default): in Arbor, Flux and Machina no plain row; each theme's own tracker is there
// OFF    P1  the switch off, goal 1,000 words, timer on: in each theme one plain row, no theme tracker; "412 / 1,000 words"; the fill 41.2% of the
//            track; the tick at the fill's end; the time on the right as m:ss
//        P2  Goal Reached (a goal of 300 under 412 words): "Goal Reached · 300 words", a full bar, no tick
//        P3  no goal, no timer: "412 words" alone, no bar, no time
//        P4  the timer only: "412 words" and the time, no bar
// LOOK   P5  the count in each theme's label colour (Arbor #6B5F4E, Flux #7EB4C4, Machina #878E9C); the tick brass (#FF9800), with a 1 px #23272B
//            edge in Arbor; Arbor keeps its backing plate (the page's own paper behind the row)
//        P6  no motion: the fill and the tick take no transition and no animation
// PAGE   P7  the page's rect is the same with the switch on and off (1366), in each theme
// SWITCH P8  the session's switch: in the Front menu's Progress block (switch off) and in DOCS' Session (?reorg=1, Machina), each pressing writes
//            writingSettings.themeTracker and nothing else she wrote
// WORDS  WD  the row's words are lexicon keys, and PlainTracker.tsx writes none itself
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/plain-tracker.mjs
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
const THEMES = ['plateau', 'flux', 'machina'];
const WORDS = Array.from({ length: 412 }, (_, i) => ['harbor', 'toll', 'dawn', 'rope', 'gull', 'tide'][i % 6]).join(' ');

const ROW = `(() => {
  const r = document.querySelector('[data-plain-tracker]');
  const theme = { lane: !!document.querySelector('.desk-frame-instrument'), run: !!document.querySelector('.machina-run'), glitch: !!document.querySelector('.flux3-glitchbar') };
  if (!r) return { row: false, theme };
  const rect = (el) => (el ? el.getBoundingClientRect() : null);
  const track = r.querySelector('.plain-tracker-track'), fill = r.querySelector('.plain-tracker-fill'), tick = r.querySelector('.plain-tracker-tick');
  const tr = rect(track), fr = rect(fill), kr = rect(tick);
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const count = r.querySelector('.plain-tracker-count'), time = r.querySelector('.plain-tracker-time');
  return { row: true, theme, state: r.getAttribute('data-state'), count: count ? (count.textContent || '').trim() : null, time: time ? (time.textContent || '').trim() : null,
    track: !!track, fillFrac: tr && fr && tr.width ? Math.round((fr.width / tr.width) * 1000) / 1000 : null, tick: !!tick,
    tickAt: kr && fr ? Math.round(((kr.left + kr.width / 2) - fr.right) * 10) / 10 : null,
    countColour: cs(count) ? cs(count).color : null, tickBg: cs(tick) ? cs(tick).backgroundColor : null, tickEdge: cs(tick) ? [cs(tick).borderTopWidth, cs(tick).borderTopColor] : null,
    plate: cs(r) ? cs(r).backgroundColor : null,
    motion: [fill, tick].filter(Boolean).map((el) => [cs(el).transitionDuration, cs(el).animationName]) };
})()`;
const PAGE = "(() => { const p = document.querySelector('.mode-page') || document.querySelector('.mode-pagecol'); if (!p) return null; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); })()";
const STORE = "(() => { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); return { themeTracker: s.themeTracker ?? null, entries: localStorage.getItem('writer-studio-journal-entries') }; })()";

let setId = null;
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  setId = await app.evalJs(`(() => {
    const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id));
    const set = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id);
    window.wrizoCreateJournalPage({ id: 'pt-1', text: ${q(WORDS)}, createdAt: '2026-04-01T00:00:01.000Z', source: 'page', origin: 'project', projectId: set.id, orderIndex: 0 });
    window.wrizoFlushNow();
    return set.id;
  })()`);
}
// the session's goal and timer and the switch, as stored settings (not collections), then the page opened in Draft
async function open(app, theme, { goal = null, timer = false, plain = false, reorg = false } = {}) {
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`(() => { localStorage.setItem('wrizo-writing-goal-lines', ${q(goal == null ? '' : JSON.stringify({ n: goal, unit: 'words' }))});
    const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); s.timer = ${timer}; s.instrumentsOn = true; s.progress = 'words'; s.progressStyle = 'bar';
    ${plain ? 's.themeTracker = false;' : 'delete s.themeTracker;'} localStorage.setItem('wrizo-writing-settings', JSON.stringify(s));
    localStorage.setItem('wrizo-mode-page-pt-1', 'drafting'); return null; })()`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/pt-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the page (${theme})`, timeout: 15000 }).catch(() => {});
  await sleep(1200);
}
const rgb = (hex) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
const COLOUR = { plateau: '#6B5F4E', flux: '#7EB4C4', machina: '#878E9C' };

await withHarness(async (app) => {
  await seed(app);
  const p0 = {}, p1 = {}, p2 = {}, p3 = {}, p4 = {}, p7 = {};
  for (const theme of THEMES) {
    await open(app, theme, { goal: 1000, timer: true });
    p0[theme] = await app.evalJs(ROW);
    const rectOn = await app.evalJs(PAGE);
    await open(app, theme, { goal: 1000, timer: true, plain: true });
    p1[theme] = await app.evalJs(ROW);
    p7[theme] = { on: rectOn, off: await app.evalJs(PAGE) };
    await open(app, theme, { goal: 300, timer: true, plain: true });
    p2[theme] = await app.evalJs(ROW);
    await open(app, theme, { goal: null, timer: false, plain: true });
    p3[theme] = await app.evalJs(ROW);
    await open(app, theme, { goal: null, timer: true, plain: true });
    p4[theme] = await app.evalJs(ROW);
  }
  ok('P0: the switch on (the default) - in Arbor, Flux and Machina no plain row; each theme\'s own tracker is there',
    THEMES.every((t) => !p0[t].row) && p0.plateau.theme.lane && p0.flux.theme.lane && p0.machina.theme.run, p0);
  ok('P1: the switch off, goal 1,000 words, timer on - one plain row in each theme, no theme tracker; "412 / 1,000 words"; the fill 41.2% of the track; the tick at the fill\'s end; the time as m:ss',
    THEMES.every((t) => { const r = p1[t]; return r.row && !r.theme.lane && !r.theme.run && !r.theme.glitch && r.state === 'goal' && r.count === '412 / 1,000 words'
      && r.fillFrac != null && Math.abs(r.fillFrac - 0.412) <= 0.01 && r.tick && r.tickAt != null && Math.abs(r.tickAt) <= 2 && /^\d+:\d\d$/.test(r.time || ''); }), p1);
  ok('P2: Goal Reached (a goal of 300 under 412 words) - "Goal Reached · 300 words", a full bar, no tick',
    THEMES.every((t) => { const r = p2[t]; return r.row && r.state === 'reached' && r.count === 'Goal Reached · 300 words' && r.fillFrac != null && r.fillFrac >= 0.995 && !r.tick; }), p2);
  ok('P3: no goal, no timer - "412 words" alone, no bar, no time',
    THEMES.every((t) => { const r = p3[t]; return r.row && r.state === 'count' && r.count === '412 words' && !r.track && r.time === null; }), p3);
  ok('P4: the timer only - "412 words" and the time, no bar',
    THEMES.every((t) => { const r = p4[t]; return r.row && r.state === 'timer' && r.count === '412 words' && !r.track && /^\d+:\d\d$/.test(r.time || ''); }), p4);
  ok('P5: the count in each theme\'s label colour (Arbor #6B5F4E, Flux #7EB4C4, Machina #878E9C); the tick brass (#FF9800), with a 1 px #23272B edge in Arbor; Arbor keeps its backing plate',
    THEMES.every((t) => p1[t].row && p1[t].countColour === rgb(COLOUR[t]) && p1[t].tickBg === rgb('#FF9800'))
      && !!p1.plateau.tickEdge && p1.plateau.tickEdge[0] === '1px' && p1.plateau.tickEdge[1] === rgb('#23272B')
      && !!p1.plateau.plate && p1.plateau.plate !== 'rgba(0, 0, 0, 0)', THEMES.map((t) => [t, p1[t].countColour, p1[t].tickBg, p1[t].tickEdge, p1[t].plate]));
  ok('P6: no motion - the fill and the tick take no transition and no animation',
    THEMES.every((t) => p1[t].row && p1[t].motion.length === 2 && p1[t].motion.every(([d, a]) => /^0s(, 0s)*$/.test(d) && a === 'none')), THEMES.map((t) => [t, p1[t].motion]));
  ok('P7: the page\'s rect is the same with the switch on and off (1366), in each theme', THEMES.every((t) => !!p7[t].on && p7[t].on === p7[t].off), p7);

  // P8: the switch - the Front menu's Progress block (switch off), then DOCS' Session (?reorg=1, Machina)
  await open(app, 'machina', { goal: 1000, timer: false });
  await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return null; })()"); await sleep(500);
  await app.evalJs("document.querySelector('.wz-sliver .wz-sliver-instruments-btn')?.click(); null"); await sleep(400);
  const foot0 = await app.evalJs(STORE);
  const footHas = await app.evalJs("!!document.querySelector('.wz-sliver [data-tracker-switch]')");
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-sliver [data-tracker-switch] button')].find((x) => /off/i.test(x.textContent || '')); if (b) b.click(); return null; })()"); await sleep(400);
  const foot1 = await app.evalJs(STORE);
  await open(app, 'machina', { goal: 1000, timer: false, reorg: true });
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]')?.click(); null"); await sleep(600);
  await app.evalJs("document.querySelector('[data-reorg-group=\"session\"] [data-session-fold]')?.click(); null"); await sleep(400);
  const docsHas = await app.evalJs("!!document.querySelector('[data-session-row=\"tracker\"]')");
  // the account's writing fact (FIX's) puts the stored false back after a reload: the DOCS half presses On first, then Off
  await app.evalJs("document.querySelector('[data-session-row=\"tracker\"] [data-toggle=\"on\"]')?.click(); null"); await sleep(400);
  const docs0 = await app.evalJs(STORE);
  await app.evalJs("document.querySelector('[data-session-row=\"tracker\"] [data-toggle=\"off\"]')?.click(); null"); await sleep(400);
  const docs1 = await app.evalJs(STORE);
  ok('P8: the session\'s switch - in the Front menu\'s Progress block and in DOCS\' Session (?reorg=1, Machina), each press writes writingSettings.themeTracker and nothing else she wrote',
    footHas && foot0.themeTracker === null && foot1.themeTracker === false && foot1.entries === foot0.entries
      && docsHas && docs0.themeTracker === true && docs1.themeTracker === false && docs1.entries === docs0.entries,
    { footHas, foot: [foot0.themeTracker, foot1.themeTracker], docsHas, docs: [docs0.themeTracker, docs1.themeTracker] });

  const chrome = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const file = path.join(SRC, 'components', 'PlainTracker.tsx');
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const keys = [['plainTrackerReached', 'Goal Reached · {goal} {unit}'], ['plainTrackerOf', '{n} / {goal} {unit}'], ['plainTrackerCount', '{n} {unit}'],
    ['plainTrackerWords', 'words'], ['plainTrackerLines', 'lines'], ['plainTrackerSwitch', 'Use Theme Progress Tracker']];
  const declared = keys.map(([k, v]) => [k, new RegExp(`\\b${k}: '([^']*)'`).exec(chrome)?.[1] ?? null, v]);
  ok('WD: the row\'s words are lexicon keys, and PlainTracker.tsx writes none itself',
    !!src && declared.every(([, got, want]) => got === want) && keys.slice(0, 5).every(([k]) => src.includes(`'${k}'`)) && !/['">]Goal Reached|>\s*(words|lines)\s*</.test(src),
    { declared: declared.filter(([, g, w]) => g !== w), file: !!src });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 800)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 10;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nPLAIN-TRACKER VERIFY: PASS (${checks.length} checks)` : `\nPLAIN-TRACKER VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
