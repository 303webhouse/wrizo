// BUG #116 (ARBOR, Nov 23; Fable, 6:14 pm, from INK's live read): "a screenplay page's templates can't be reached, in live Arbor too."
// As shipped (no pins), a Screenplay page passes the Front menu five templates (ScriptEditor), Arbor's Front menu hides that section on TEXT (frontTabs.ts, retirePresets)
// and the kind menu at the head of SECTIONS reads none of what the host lends it (DocKindMenu.tsx). This file walks every tab of the drawer, the kind menu and each of its
// folds, as a writer would, and records which of the other four templates (Blank, Outline, Title Page, Bibliography) has a door she can see.
//   B0  the fixture: every page opened and its drawer has tabs
//   B1  the control: Machina's Front menu shows all four on an empty screenplay (if this fails the walk is blind)
//   B2  Arbor, an empty screenplay: all four can be reached
//   B3  Arbor, a screenplay with words: all four can be reached (there a press opens a new page; the words never move)
//   B4-B  Arbor, a screenplay at 1366 and 1920: the drawer and its controls start past the rail; tabs press at the centre, the kind menu edge to edge (B4 parked below)
// READ lines print what each walk found, including a Standard page in Arbor (reported, not counted). Frames go to $RUNNER_TEMP/suite/bug116 on Actions.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.WS_PLACE = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_REORG = '1';   // as shipped: without this the driver serves __wrizoReorgOff and the old drawer (the first run read that, and B0 caught it)
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const parked = [];   // printed on the parked leg (HARNESS_PARKED=1), never counted in the default verdict
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(process.env.RUNNER_TEMP ? path.join(process.env.RUNNER_TEMP, 'suite') : os.tmpdir(), 'bug116');
fs.mkdirSync(OUT, { recursive: true });

const OTHERS = ['blank', 'outline', 'title', 'bibliography'];
const EMPTY_SCRIPT = { v: 1, scenes: [{ id: 'b116-h1', heading: { id: 'b116-h1', t: 'scene', text: '' }, body: [] }] };
const WORD_SCRIPT = { v: 1, scenes: [{ id: 'b116-h2', heading: { id: 'b116-h2', t: 'scene', text: 'INT. KITCHEN - NIGHT' }, body: [{ id: 'b116-a1', t: 'action', text: 'She sets the cup down and listens.' }] }] };

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the fixture check records what follows */ }
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 15000 });
  await app.evalJs(`(() => {
    const W = window, at = '2026-04-01T00:00:00.000Z';
    W.wrizoCreateJournalPage({ id: 'b116-empty', text: '', pageType: 'script', script: ${JSON.stringify(EMPTY_SCRIPT)}, createdAt: at, source: 'page', origin: 'loose' });
    W.wrizoCreateJournalPage({ id: 'b116-words', text: 'INT. KITCHEN - NIGHT\\nShe sets the cup down and listens.', pageType: 'script', script: ${JSON.stringify(WORD_SCRIPT)}, createdAt: at, source: 'page', origin: 'loose' });
    W.wrizoCreateJournalPage({ id: 'b116-prose', text: 'The first thing she noticed was the quiet.', createdAt: at, source: 'page', origin: 'loose' });
    W.wrizoFlushNow();
    return null;
  })()`);
}

async function open(app, theme, id, ready) {
  await app.evalJs(`window.wrizoTheme.set(${JSON.stringify(theme)}); null`);
  await app.evalJs(`history.replaceState(null, '', '/#/page/${id}'); null`);
  await app.reload();
  // a prose page opens in Free Write, which has no drawer grip in Arbor: the grip is waited for only after the Draft tab
  try { await app.waitFor(`!!document.querySelector(${JSON.stringify(ready)})`, { label: `${id} in ${theme}`, timeout: 15000 }); } catch { return false; }
  await sleep(900);
  if (ready === '.forward-only-editor') {
    await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
    await sleep(1200);
  }
  try { await app.waitFor("!!document.querySelector('.wz-sliver-grip')", { label: `${id}'s drawer grip`, timeout: 8000 }); } catch { return false; }
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) {
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
    await sleep(800);
  }
  return true;
}

// what she can see right now: the template doors, and the words of the kind menu's open fold
const SEEN = `(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const doors = [...document.querySelectorAll('.wz-sliver [data-template]')].filter(vis).map((e) => e.getAttribute('data-template'));
  const sub = document.querySelector('[data-doc-sub]');
  return { doors, fold: sub ? [...sub.querySelectorAll('button')].filter(vis).map((b) => (b.textContent || '').trim()) : [] };
})()`;

async function walk(app) {
  const tabs = await app.evalJs("[...document.querySelectorAll('[id^=\"wz-sliver-tab-\"]')].map((b) => b.id.replace('wz-sliver-tab-', ''))");
  const reach = new Set(), where = {};
  const note = (place, seen) => { for (const d of seen.doors) { reach.add(d); (where[d] = where[d] || []).push(place); } };
  let kind = null, items = [];
  const folds = {};
  for (const t of (tabs.length ? tabs : ['(no tabs)'])) {
    if (tabs.length) { await app.evalJs(`document.getElementById('wz-sliver-tab-${t}')?.click(); null`); await sleep(450); }
    note(t, await app.evalJs(SEEN));
    if (!(await app.evalJs("!!document.querySelector('.wz-sliver [data-doc-kind]')"))) continue;
    kind = await app.evalJs("(document.querySelector('.wz-sliver [data-doc-kind]').textContent || '').replace('▾', '').trim()");
    await app.evalJs("document.querySelector('.wz-sliver [data-doc-kind]').click(); null");
    await sleep(300);
    items = (await app.evalJs("[...document.querySelectorAll('[data-doc-menu] [data-doc-menu-item]')].map((b) => b.getAttribute('data-doc-menu-item'))")) || [];
    note(`${t}/menu`, await app.evalJs(SEEN));
    for (const it of items) {
      await app.evalJs(`document.querySelector('[data-doc-menu] [data-doc-menu-item="${it}"]')?.click(); null`);
      await sleep(280);
      const seen = await app.evalJs(SEEN);
      note(`${t}/menu/${it}`, seen);
      folds[it] = seen.fold;
      await app.evalJs(`document.querySelector('[data-doc-menu] [data-doc-menu-item="${it}"]')?.click(); null`);
      await sleep(160);
    }
  }
  return { tabs, kind, items, folds, reach: [...reach], where };
}

const hasAll = (w) => !!w && OTHERS.every((k) => w.reach.includes(k));

// REPORTED, NOT COUNTED: whether the kind menu's controls can be pressed where they are drawn (the first frame showed the rail over the drawer's left edge in Arbor).
const LAYOUT = `(() => {
  const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; };
  const hit = (e) => { const r = e.getBoundingClientRect(), y = r.top + r.height / 2, at = (x) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); }; return { left: Math.round(r.left), right: Math.round(r.right), leftEdge: at(r.left + 6), centre: at(r.left + r.width / 2), rightEdge: at(r.right - 6) }; };
  const controls = [...document.querySelectorAll('.wz-sliver [data-doc-kind], [data-doc-menu] [data-doc-menu-item], #wz-sliver-tab-text, #wz-sliver-tab-parts')];
  return { w: innerWidth, rail: box('.desk-frame-strip'), panel: box('.wz-sliver-panel'), page: box('.mode-page'), controls: controls.map((e) => ({ what: e.getAttribute('data-doc-menu-item') || (e.hasAttribute('data-doc-kind') ? 'kind' : e.id.replace('wz-sliver-tab-', 'tab-')), ...hit(e) })) };
})()`;
async function layouts(app) {
  const rows = [];
  for (const w of [1366, 1920]) {
    await app.emulateDpr(1, w, w === 1366 ? 768 : 1080);
    await sleep(700);
    await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(350);
    if (!(await app.evalJs("!!document.querySelector('[data-doc-menu]')"))) { await app.evalJs("document.querySelector('.wz-sliver [data-doc-kind]')?.click(); null"); await sleep(280); }
    rows.push(await app.evalJs(LAYOUT));
  }
  await app.emulateDpr(1, 1366, 768);
  await sleep(500);
  return rows;
}

await withHarness(async (app) => {
  await seed(app);
  const cases = [
    ['machina-empty', 'machina', 'b116-empty', '.script-el'],
    ['arbor-empty', 'plateau', 'b116-empty', '.script-el'],
    ['arbor-words', 'plateau', 'b116-words', '.script-el'],
    ['arbor-standard', 'plateau', 'b116-prose', '.forward-only-editor'],
  ];
  const got = {};
  for (const [name, theme, id, ready] of cases) {
    const there = await open(app, theme, id, ready);
    const w = there ? await walk(app) : null;
    got[name] = w;
    console.log(`READ ${name}: ${JSON.stringify(w)}`);
    if (w) { w.layout = await layouts(app); console.log(`LAYOUT ${name}: ${JSON.stringify(w.layout)}`); }
    if (w && w.items.length) {
      await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(350);
      if (!(await app.evalJs("!!document.querySelector('[data-doc-menu]')"))) { await app.evalJs("document.querySelector('.wz-sliver [data-doc-kind]')?.click(); null"); await sleep(280); }
      await app.evalJs("document.querySelector('[data-doc-menu] [data-doc-menu-item=\"presets\"]')?.click(); null"); await sleep(300);
    }
    fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  }
  ok('B0 the fixture: all four pages opened, each with drawer tabs', cases.every(([n]) => !!got[n] && got[n].tabs.length > 0), Object.fromEntries(cases.map(([n]) => [n, got[n] ? got[n].tabs : null])));
  ok("B1 the control: Machina's drawer shows Blank, Outline, Title Page and Bibliography on an empty screenplay", hasAll(got['machina-empty']), got['machina-empty']);
  ok('B2 Arbor, an empty screenplay: Blank, Outline, Title Page and Bibliography can each be reached', hasAll(got['arbor-empty']), got['arbor-empty']);
  ok('B3 Arbor, a screenplay with words: Blank, Outline, Title Page and Bibliography can each be reached', hasAll(got['arbor-words']), got['arbor-words']);
  // the second half of #116, found by the first frames: drawerEdge.ts measures the room beside '.mode-page', a screenplay has none, so its drawer takes the default width and runs under the rail at 1366
  // ---- PARKED - SUPERSEDED (Nov 23, the first read after the fix): "edge to edge" also asked it of Arbor's two folder tabs, which overlap by design (the chosen cloth lies over its neighbour, at 1920 too) and stand above the page's top edge. The original, verbatim:
  // const clear = (w) => !!w && w.layout.length === 2 && w.layout.every((r) => !!r.rail && !!r.panel && r.panel[0] >= r.rail[1] && r.controls.length >= 4 && r.controls.every((c) => c.leftEdge && c.centre && c.rightEdge && c.right <= r.panel[1] + 1));
  // ok("B4 Arbor, a screenplay at 1366 and 1920: the drawer starts past the rail, and its tabs, kind menu and the menu's rows can be pressed from edge to edge", clear(got['arbor-empty']) && clear(got['arbor-words']), { empty: got['arbor-empty']?.layout, words: got['arbor-words']?.layout });
  const clearB = (layout) => !!layout && layout.length === 2 && layout.every((r) => !!r.rail && !!r.panel && r.panel[0] >= r.rail[1] && r.controls.length >= 4
    && r.controls.every((c) => c.centre && c.left >= r.rail[1] && (c.what.startsWith('tab-') || (c.leftEdge && c.rightEdge && c.right <= r.panel[1] + 1))));
  ok("B4-B [successor]: Arbor, a screenplay at 1366 and 1920: the drawer starts past the rail, every control starts past it, each tab can be pressed at its centre, and the kind menu and its rows from edge to edge inside the drawer", clearB(got['arbor-empty']?.layout) && clearB(got['arbor-words']?.layout), { empty: got['arbor-empty']?.layout, words: got['arbor-words']?.layout });
  // the mutant is the live bundle's own reading at 1366 (run 45307844012): the drawer from x=11, the kind menu's centre under the rail
  const under = { rail: [0, 84], panel: [11, 275], controls: [{ what: 'kind', left: 26, right: 107, leftEdge: false, centre: false, rightEdge: true }, { what: 'setup', left: 27, right: 260, leftEdge: false, centre: true, rightEdge: true }, { what: 'presets', left: 27, right: 260, leftEdge: false, centre: true, rightEdge: true }, { what: 'tab-text', left: 25, right: 121, leftEdge: false, centre: false, rightEdge: false }] };
  ok('MUT-B4-B the drawer under the rail, as the live bundle drew it, goes RED', !clearB([under, under]), '');
  parked.push({ name: 'PARKED (was "B4 Arbor, a screenplay at 1366 and 1920: ... pressed from edge to edge") - the folder tabs overlap by design; live successor: B4-B', pass: clearB(got['arbor-empty']?.layout) && clearB(got['arbor-words']?.layout), detail: '' });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1800)}`);
const parkedLeg = process.env.HARNESS_PARKED === '1';
if (parkedLeg) for (const c of parked) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nBUG116-SCRIPT-TEMPLATES VERIFY: PASS (${checks.length} checks)`
  : `\nBUG116-SCRIPT-TEMPLATES VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
