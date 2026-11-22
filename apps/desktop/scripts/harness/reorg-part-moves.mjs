// MOVING BETWEEN PARTS (POLISH; Fable's add-on Nov 19 3:55 pm, confirmed 6:05 pm: "the scrollbar arrows, previous/next at a Part's foot, the
// Part line opening the list"; plan: "forward and back arrows that show with the scrollbar", Nick's idea). Machina only, behind ?reorg=1, on a
// Page. Built to Cursor's prototype's page (docs/mockups/reorg/app.js arrowBtn, partFoot, renderDrop; frames P2-12C and P2-12D).
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and its app-made set):
//   Grants       a set she made, "Budget": three pages -> one Doc, three Parts ("Budget one", "Budget two", "Budget three")
//   Top Drawer   its app-made set: "Notes on the ledgers" (a one-Part Doc)
//
// OFF    M0  switch off in Machina, and on in Arbor and Flux: no arrows, no foot, no Parts drop on a Part
// ARROWS A1  on Budget two (Part 2 of 3): two arrows, "Previous Part: 1, Budget one" above and "Next Part: 3, Budget three" below, both live
//        A2  they cap the page's own scrollbar: centred on the scroller's bar, the upper at its top and the lower at its bottom
//        A3  [1366, 1920] the page's rect (column, paper, editor) is the same with the switch off and on; the editor is the same node with the
//            Parts drop open
//        A3 [scale successor] (train H, Nov 21: the chrome scale) the same with the switch on and the drop open; against the switch off the same at
//            1366, and at 1920 lower by the bar's growth alone (scaledSame);   MUT-A3  the 1920 reading pushed 40 px sideways, or 30 px lower, fails it
//        A4  she types, then presses the lower arrow at once: her words are stored on Budget two, and Budget three opens ("Part 3 of 3"), its
//            lower arrow "No Part after this one" and disabled
//        A5  on Part 1 the upper arrow reads "No Part before this one" and is disabled; the lower opens Part 2
// FOOT   F1  on Budget two the foot reads "< 1 · Budget one", "end of Part 2", "Next · 3 · Budget three >", after her words in the page's own
//            scroll, and it dissolves with the chrome (mode-dissolve)
//        F2  the foot's Next opens Budget three; there the foot has no Next
//        F3  a one-Part Doc has no foot, and both its arrows are disabled
// DROP   D1  the Part line ("Part 2 of 3") is a button that drops the Parts list: three rows in her order, Part 2 marked; Escape closes it
//        D2  a row in the drop opens that Part
// QUIET  S1  three moves (arrow, foot, drop) store nothing: every entry's text, boxes, page settings and links are byte-identical
//        K1  while she types 26 keys on a Part, the arrows and the foot render ZERO times (window.wrizoPartMovesRenders, live only under the
//            switch; the counter is live: it counted their first render)
// WORDS  W1  every word the moves draw is a lexicon key (terms.ts and the canonical table carry each one), and none is written into the component
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-part-moves.mjs
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

// the chrome scale's successor (train H, Nov 21): the bar's bottom, and the page's rects against the switch off - at 1366 and below (k = 1) the same
// string; above, every top moves by the bar's growth g (within 1 px) and no other edge moves more than g (a drawer or the rail displacing the page moves
// it by its own width, 100 px and more). Within the reorg every state is still compared as the same string.
const BAR = "(() => { const b = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((e) => e.getBoundingClientRect().height > 0); return b ? Math.round(b.getBoundingClientRect().bottom * 10) / 10 : null; })()";
const rectsOf = (s) => String(s || '').split('|').map((r) => r.trim());
const scaledSame = (w, off, on, g) => {
  if (!off || !on) return false;
  if (w <= 1366) return on === off;
  const a = rectsOf(off), b = rectsOf(on);
  if (a.length !== b.length || !(g > 0)) return false;
  return a.every((r, i) => { if (r === '-' || b[i] === '-') return r === b[i]; const p = r.split(',').map(Number), q = b[i].split(',').map(Number);
    if (p.length !== 4 || q.length !== 4 || [...p, ...q].some((x) => !Number.isFinite(x))) return false;
    return Math.abs((q[1] - p[1]) - g) <= 1 && Math.abs(q[0] - p[0]) <= g && Math.abs(q[2] - p[2]) <= g && Math.abs(q[3] - p[3]) <= g; });
};
const shiftRects = (s, dl, dt) => rectsOf(s).map((r) => (r === '-' ? r : r.split(',').map(Number).map((x, j) => Math.round((x + (j === 0 ? dl : j === 1 ? dt : 0)) * 10) / 10).join(','))).join(' | ');
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const ENTRIES = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).map((e) => [e.id, e.text ?? null, e.boxes ?? null, e.pageSettings ?? null, e.pageLinks ?? null, e.projectId ?? null, e.orderIndex ?? null])";
const ARROWS = `(() => {
  const box = document.querySelector('[data-part-arrows]');
  const one = (k) => { const b = box && box.querySelector('[data-part-step="' + k + '"]'); return b ? { label: b.getAttribute('aria-label'), off: b.disabled } : null; };
  return { box: !!box, up: one('-1'), down: one('1') };
})()`;
const FOOT = `(() => {
  const f = document.querySelector('[data-part-foot]');
  if (!f) return null;
  const sc = document.querySelector('.mode-scroll'), ed = document.querySelector('.forward-only-editor');
  const kids = [...f.children].map((c) => (c.textContent || '').replace(/\\s+/g, ' ').trim());
  return { kids, inScroll: !!(sc && sc.contains(f)), afterWords: !!(ed && (ed.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING)), dissolve: f.classList.contains('mode-dissolve'), goes: [...f.querySelectorAll('[data-part-go]')].map((b) => b.getAttribute('data-part-go')) };
})()`;
const PARTLINE = "(() => { const c = document.querySelector('.reorg-top [data-top-part-count]'); return c ? { text: (c.textContent || '').trim(), button: c.tagName === 'BUTTON', expanded: c.getAttribute('aria-expanded') } : null; })()";
const at = (id) => `location.hash.indexOf('/page/${id}') >= 0`;

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
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const budget = W.wrizoCreateProject('Budget'); W.wrizoSetProjectDrawer(budget.id, grants.id);
    page('pm-top-1', 'Notes on the ledgers', { origin: 'project', projectId: ${q(topSet)}, orderIndex: 0 });
    page('pm-g-1', 'Budget one', { origin: 'project', projectId: budget.id, orderIndex: 0 });
    page('pm-g-2', 'Budget two', { origin: 'project', projectId: budget.id, orderIndex: 1 });
    page('pm-g-3', 'Budget three', { origin: 'project', projectId: budget.id, orderIndex: 2 });
    W.wrizoFlushNow();
    return null;
  })()`);
}

async function open(app, theme, reorg, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-frame-host .sprint-nav') && !!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function arrived(app, id) { await app.waitFor(`${at(id)} && !!document.querySelector('.forward-only-editor')`, { timeout: 8000, label: `arrived at ${id}` }).catch(() => {}); await sleep(700); }
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;

await withHarness(async (app) => {
  await seed(app);

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------
  const offs = {};
  for (const [theme, reorg] of [['machina', false], ['plateau', true], ['flux', true]]) {
    await open(app, theme, reorg, 'pm-g-2');
    offs[`${theme}.${reorg ? 'on' : 'off'}`] = await app.evalJs("(() => ({ arrows: !!document.querySelector('[data-part-arrows]'), foot: !!document.querySelector('[data-part-foot]'), drop: !!document.querySelector('[data-top-parts-drop]'), top: !!document.querySelector('.reorg-top') }))()");
  }
  ok('M0 switch off in Machina, and on in Arbor and Flux: no arrows, no foot, no Parts drop on a Part', Object.values(offs).every((o) => !o.arrows && !o.foot && !o.drop && !o.top), offs);

  // ---- ARROWS ----------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pm-g-2');
  const a1 = await app.evalJs(ARROWS);
  ok('A1 on Budget two: "Previous Part: 1, Budget one" above, "Next Part: 3, Budget three" below, both live',
    a1.box && a1.up && a1.up.label === 'Previous Part: 1, Budget one' && !a1.up.off && a1.down && a1.down.label === 'Next Part: 3, Budget three' && !a1.down.off, a1);

  const cap = await app.evalJs(`(() => {
    const sc = document.querySelector('.mode-scroll'); const up = document.querySelector('[data-part-step="-1"]'); const dn = document.querySelector('[data-part-step="1"]');
    if (!sc || !up || !dn) return null;
    const s = sc.getBoundingClientRect(), u = up.getBoundingClientRect(), d = dn.getBoundingClientRect();
    const k = s.width / sc.offsetWidth || 1;   // the paper's scale
    const bar = (sc.offsetWidth - sc.clientWidth) * k;
    return { bar, barMid: s.right - bar / 2, upMid: (u.left + u.right) / 2, dnMid: (d.left + d.right) / 2, upTop: u.top - s.top, dnBottom: s.bottom - d.bottom, k };
  })()`);
  ok('A2 the arrows cap the page\'s own scrollbar: centred on its bar, the upper at its top and the lower at its bottom',
    !!cap && cap.bar > 0 && Math.abs(cap.upMid - cap.barMid) <= 2 && Math.abs(cap.dnMid - cap.barMid) <= 2 && cap.upTop >= 0 && cap.upTop <= 12 && cap.dnBottom >= 0 && cap.dnBottom <= 12, cap);

  const geo = {};
  for (const w of [1366, 1920]) {
    await open(app, 'machina', false, 'pm-g-2', w);
    const off = await app.evalJs(PAGE);
    const barOff = await app.evalJs(BAR);
    await open(app, 'machina', true, 'pm-g-2', w);
    const barOn = await app.evalJs(BAR);
    await app.evalJs("window.__pmEditor = document.querySelector('.forward-only-editor'); null");
    const on = await app.evalJs(PAGE);
    await app.evalJs(press('.reorg-top [data-top-part-count]')); await sleep(300);
    const dropped = await app.evalJs(PAGE);
    const dropOpen = await app.evalJs("!!document.querySelector('[data-top-parts-drop]')");
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(250);
    const same = await app.evalJs("document.querySelector('.forward-only-editor') === window.__pmEditor");
    geo[w] = { off, on, dropped, dropOpen, same, g: barOn != null && barOff != null ? Math.round((barOn - barOff) * 10) / 10 : null };
  }
  // SUPERSEDED (the chrome scale (arbor/reorg-scale 0c8df64d, train H; Fable, Nov 21 11:45 am: one chrome scale from the window's width / 1366, Machina under the reorg only;
  // pass 2 REAL 2, cleared 3:52 pm: the chrome budget grows by what the taller bar adds) makes the bar taller above 1366 with the switch ON, so against the
  // switch OFF the page sits lower by exactly the bar's growth (Chat 1's pair 44973956599 on train-h4 3ab78c73: 108 -> 120.3 at 1920, the bar 12.3 px taller)). The original, verbatim:
  // ok('A3 [1366, 1920] the page\'s rect is the same with the switch off and on, and with the Parts drop open; the editor is the same node',
  //   Object.values(geo).every((g) => g.off && g.off === g.on && g.on === g.dropped && g.dropOpen && g.same), geo);
  ok('A3 [1366, 1920] [scale successor] the page\'s rect is the same with the switch on and with the Parts drop open; against the switch off the same at 1366, lower by the bar\'s growth alone at 1920; the editor is the same node',
    Object.entries(geo).every(([w, x]) => x.on && x.on === x.dropped && scaledSame(+w, x.off, x.on, x.g) && x.dropOpen && x.same), geo);
  { const s = geo[1920] || {}; const pushed = s.on ? shiftRects(s.on, 40, 0) : null; const sunk = s.on ? shiftRects(s.on, 0, 30) : null;
    ok('MUT-A3 the 1920 reading passes the scale successor, and the same reading pushed 40 px sideways, or 30 px lower than the bar grew, fails it',
      !!s.on && scaledSame(1920, s.off, s.on, s.g) && !scaledSame(1920, s.off, pushed, s.g) && !scaledSame(1920, s.off, sunk, s.g), { ...s, pushed, sunk }); }

  // ---- SPEED (and A4: typed, then moved at once) -------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pm-g-2');
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.waitFor("document.querySelector('[data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'Draft' }).catch(() => {});
  await sleep(1300);
  const live0 = await app.evalJs('window.wrizoPartMovesRenders ? window.wrizoPartMovesRenders() : null');
  const spot = await app.evalJs("(() => { const r = document.querySelector('.forward-only-editor')?.getBoundingClientRect(); return r ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(40, r.height / 2)) } : null; })()");
  if (spot) { await app.mouseDown(spot.x, spot.y); await app.mouseUp(spot.x, spot.y); }
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null");
  await sleep(300);
  const k0 = await app.evalJs('window.wrizoPartMovesRenders ? window.wrizoPartMovesRenders() : null');
  for (const ch of ' and a few more words here') { await app.typeKeys(ch); await sleep(50); }
  await sleep(150);
  const k1 = await app.evalJs('window.wrizoPartMovesRenders ? window.wrizoPartMovesRenders() : null');
  ok('K1 while she types 26 keys on a Part, the arrows and the foot render zero times (the counter is live)',
    typeof live0 === 'number' && live0 > 0 && k0 !== null && k1 === k0, { live0, k0, k1 });

  const moved = await app.evalJs(press('[data-part-step="1"]'));
  await arrived(app, 'pm-g-3');
  const stored2 = await app.evalJs("((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'pm-g-2') || {}).text || '')");
  const a4 = { moved, hash: await app.evalJs('location.hash'), line: await app.evalJs(PARTLINE), arrows: await app.evalJs(ARROWS), stored2 };
  ok('A4 typed, then the lower arrow at once: her words are stored on Budget two and Budget three opens ("Part 3 of 3"); its lower arrow is "No Part after this one", disabled',
    moved && /pm-g-3/.test(a4.hash) && /few more words/.test(stored2) && a4.line && a4.line.text === 'Part 3 of 3' && a4.arrows.down && a4.arrows.down.off && a4.arrows.down.label === 'No Part after this one' && a4.arrows.up && !a4.arrows.up.off, a4);

  await open(app, 'machina', true, 'pm-g-1');
  const a5a = await app.evalJs(ARROWS);
  const moved5 = await app.evalJs(press('[data-part-step="1"]'));
  await arrived(app, 'pm-g-2');
  const a5hash = await app.evalJs('location.hash');
  ok('A5 on Part 1 the upper arrow reads "No Part before this one", disabled; the lower opens Part 2',
    a5a.up && a5a.up.off && a5a.up.label === 'No Part before this one' && a5a.down && !a5a.down.off && moved5 && /pm-g-2/.test(a5hash), { a5a, moved5, a5hash });

  // ---- FOOT ------------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pm-g-2');
  const f1 = await app.evalJs(FOOT);
  ok('F1 on Budget two the foot reads "< 1 · Budget one" / "end of Part 2" / "Next · 3 · Budget three >", after her words in the page\'s own scroll, and dissolves with the chrome',
    !!f1 && f1.kids.length === 3 && f1.kids[0] === '‹ 1 · Budget one' && f1.kids[1] === 'end of Part 2' && f1.kids[2] === 'Next · 3 · Budget three ›' && f1.inScroll && f1.afterWords && f1.dissolve, f1);

  const sQ0 = await app.evalJs(ENTRIES);
  const went = await app.evalJs(press('[data-part-foot] [data-part-go="pm-g-3"]'));
  await arrived(app, 'pm-g-3');
  const f2 = await app.evalJs(FOOT);
  ok('F2 the foot\'s Next opens Budget three; there the foot has no Next', went && /pm-g-3/.test(await app.evalJs('location.hash')) && !!f2 && f2.goes.length === 1 && f2.goes[0] === 'pm-g-2' && f2.kids[2] === '', { went, f2 });

  // ---- DROP ------------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pm-g-2');
  const line0 = await app.evalJs(PARTLINE);
  await app.evalJs(press('.reorg-top [data-top-part-count]')); await sleep(300);
  const drop = await app.evalJs("(() => { const d = document.querySelector('[data-top-parts-drop]'); if (!d) return null; return [...d.querySelectorAll('[data-part-row]')].map((b) => [b.getAttribute('data-part-row'), b.getAttribute('aria-current') === 'true']); })()");
  const line1 = await app.evalJs(PARTLINE);
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(250);
  const closed = await app.evalJs("!document.querySelector('[data-top-parts-drop]')");
  ok('D1 the Part line is a button that drops the Parts list: three rows in her order, Part 2 marked; Escape closes it',
    line0 && line0.button && line0.text === 'Part 2 of 3' && line1 && line1.expanded === 'true' && !!drop && drop.map((r) => r[0]).join(',') === 'pm-g-1,pm-g-2,pm-g-3' && drop.map((r) => r[1]).join(',') === 'false,true,false' && closed, { line0, line1, drop, closed });

  await app.evalJs(press('.reorg-top [data-top-part-count]')); await sleep(300);
  const rowGo = await app.evalJs(press('[data-top-parts-drop] [data-part-row="pm-g-1"]'));
  await arrived(app, 'pm-g-1');
  ok('D2 a row in the drop opens that Part', rowGo && /pm-g-1/.test(await app.evalJs('location.hash')) && (await app.evalJs(PARTLINE))?.text === 'Part 1 of 3', { rowGo });

  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400);
  const sQ1 = await app.evalJs(ENTRIES);
  ok('S1 the moves (foot, drop, arrow above) store nothing: every entry\'s text, boxes, page settings and links are byte-identical',
    JSON.stringify(sQ0) === JSON.stringify(sQ1), { before: sQ0.length, after: sQ1.length });

  // ---- ONE-PART DOC ----------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pm-top-1');
  const f3 = { foot: await app.evalJs(FOOT), arrows: await app.evalJs(ARROWS) };
  ok('F3 a one-Part Doc has no foot, and both its arrows are disabled', f3.foot === null && f3.arrows.box && f3.arrows.up?.off && f3.arrows.down?.off, f3);
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const file = path.join(SRC, 'reorg', 'PartMoves.tsx');
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const used = [...new Set([...src.matchAll(/\bt\('([a-zA-Z0-9]+)'\)/g)].map((m) => m[1]))];
  const missing = used.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon));
  const quoted = [...src.matchAll(/>\s*([A-Z][a-z]+(?: [a-z]+)+)\s*</g)].map((m) => m[1]);
  ok('W1 every word the moves draw is a lexicon key (terms.ts and the canonical table), and none is written into the component', used.length >= 6 && missing.length === 0 && quoted.length === 0, { used, missing, quoted });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 15;   // 14 + MUT-A3 (A3 parked, the chrome scale successor, Nov 21)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-PART-MOVES VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-PART-MOVES VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
