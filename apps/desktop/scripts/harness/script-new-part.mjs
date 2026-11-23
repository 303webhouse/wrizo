// SCRIPT #5: NEW PART AND THE PLAN'S DOOR ON A SCREENPLAY (the review's R9, R10; Fable, Nov 22 and 23). Both doors opened a PROSE page inside a screenplay. A new Part follows the page she is on.
// Machina, ?reorg=1, seeded through the app's own seams, the real buttons pressed with a real mouse.
//
// NEW PART   N1  on a screenplay Part: a screenplay page opens, in the same Doc
//            N2  her words land in that page's script lines
//            N3  (control) on a prose Part: a prose page opens and nothing is written until her first word
//            N4  on a loose screenplay page: it becomes a Doc and the new page is a screenplay in it
// PLAN DOOR  P1  on a screenplay Part: a screenplay Part opens, named for the row, last in the Doc, linked from the card
//            P2  back on the first page, the row reads "Open Part" and has no tick while the Part has no words
//            P3  once the screenplay Part has words, the row wears the tick
//            P4  "Open Part" opens that Part and creates nothing
//            P5  (control) on a prose Part: the door still writes nothing and opens a prose page
//            P6  on a loose screenplay page: it becomes a Doc and the row's Part is a screenplay in it
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-new-part.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });

const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const STORE = `(() => { window.wrizoFlushNow(); return JSON.stringify([${ALL}, JSON.parse(localStorage.getItem('writer-studio-projects') || '[]')]); })()`;
const ENTRY = (id) => `(() => { window.wrizoFlushNow(); return ${ALL}.find((x) => x.id === ${q(id)}) || null; })()`;
const SURF = "({ hash: location.hash, script: !!document.querySelector('.script-sheet'), prose: !!document.querySelector('.forward-only-editor') })";
const ROW = (id) => `(() => { const r = document.querySelector('[data-back-plan] [data-plan-row=${q(id)}]'); if (!r) return null; const d = r.querySelector('[data-plan-part]'); return { door: d ? d.getAttribute('data-plan-part') : null, tick: !!r.querySelector('[data-plan-tick]') }; })()`;
const idOf = (hash) => { const m = /\/page\/([^?]+)/.exec(hash || ''); return m && m[1] !== 'new' ? m[1] : null; };

await withHarness(async (app) => {
  // a real press, only on something the pointer can actually reach
  const press = async (sel) => {
    const p = await app.evalJs(`(() => { const e = document.querySelector(${q(sel)}); if (!e || e.disabled) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const h = document.elementFromPoint(x, y); return { x, y, hit: !!h && (h === e || e.contains(h)) }; })()`);
    if (!p || !p.hit) return false;
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
    await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    await sleep(250);
    return true;
  };
  const openPage = async (id, script) => {
    await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
    await app.evalJs(`window.wrizoFlushNow(); window.wrizoTheme.set('machina'); ${script ? '' : `localStorage.setItem('wrizo-mode-page-${id}', 'drafting');`} history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
    await app.reload();
    await app.waitFor(script ? "!!document.querySelector('.script-sheet .script-el')" : "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
    await sleep(900);
  };
  const newPart = async () => {
    if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await press('.wz-sliver-grip'); await sleep(450); }
    await press('#wz-sliver-tab-parts'); await sleep(300);
    const pressed = await press('[data-parts-new]');
    await sleep(1300);
    return pressed;
  };
  const planTab = async () => {
    if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await press('.wz-tutor-grip'); await sleep(700); }
    await press('#wz-tutor-tab-plan'); await sleep(500);
  };
  const door = async (row) => { const pressed = await press(`[data-plan-row="${row}"] [data-plan-part]`); await sleep(1300); return pressed; };
  const typeScript = async (id, s) => {
    await app.evalJs("document.querySelector('.script-el-active')?.focus(); null"); await sleep(150);
    for (const ch of s) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); }
    await app.waitFor(`${ALL}.some((x) => x.id === ${q(id)} && (x.text || '').includes(${q(s)}))`, { label: 'the words stored', timeout: 9000 }).catch(() => {});
    await sleep(200);
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const ids = await app.evalJs(`(() => {
    const W = window;
    let n = 0;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:' + String(10 + n++) + '.000Z', source: 'page', ...extra });
    const doc = (id, head, line) => ({ v: 1, scenes: [{ id: id + '-h', heading: { id: id + '-h', t: 'scene', text: head }, body: [{ id: id + '-a', t: 'action', text: line }] }] });
    const scriptPage = (id, head, line, extra) => { page(id, head + '\\n\\n' + line, { pageType: 'script', ...extra }); W.wrizoPatchEntry(id, { script: doc(id, head, line) }); };
    const work = W.wrizoCreateDrawer('Work');
    const feature = W.wrizoCreateProject('Feature'); W.wrizoSetProjectDrawer(feature.id, work.id);
    const essay = W.wrizoCreateProject('Essay'); W.wrizoSetProjectDrawer(essay.id, work.id);
    scriptPage('sp-1', 'INT. KITCHEN - DAY', 'She waits.', { origin: 'project', projectId: feature.id, orderIndex: 0 });
    scriptPage('sp-2', 'EXT. STREET - NIGHT', 'Rain.', { origin: 'project', projectId: feature.id, orderIndex: 1 });
    page('pr-1', 'An essay opens here.', { origin: 'project', projectId: essay.id, orderIndex: 0 });
    scriptPage('sl-1', 'INT. BUS - DAY', 'He sits.', { origin: 'loose' });
    scriptPage('sl-2', 'INT. SHOP - DAY', 'She pays.', { origin: 'loose' });
    page('sp-own', 'Feature plan', { pageType: 'board', boxes: ${q([card('c1', 'Opening', 0, 0.05), card('c2', 'Midpoint', 1, 0.2)])} });
    page('pr-own', 'Essay plan', { pageType: 'board', boxes: ${q([card('p1', 'Step', 0, 0.05)])} });
    page('sl-own', 'Bus plan', { pageType: 'board', boxes: ${q([card('l1', 'One', 0, 0.05)])} });
    W.wrizoPatchEntry('sp-1', { planBoardId: 'sp-own' });
    W.wrizoPatchEntry('pr-1', { planBoardId: 'pr-own' });
    W.wrizoPatchEntry('sl-1', { planBoardId: 'sl-own' });
    W.wrizoFlushNow();
    return { feature: feature.id, essay: essay.id };
  })()`);

  // ---- NEW PART
  await openPage('sp-1', true);
  const n1p = await newPart(); const n1 = await app.evalJs(SURF); const n1id = idOf(n1.hash); const n1e = n1id ? await app.evalJs(ENTRY(n1id)) : null;
  ok('N1: New Part on a screenplay Part: a screenplay page opens, in the same Doc', n1p && n1.script && !n1.prose && n1e?.pageType === 'script' && n1e?.projectId === ids.feature, { n1p, n1, type: n1e?.pageType, inDoc: n1e?.projectId === ids.feature });
  if (n1id && n1.script) await typeScript(n1id, 'INT. ROOF');
  const n2e = n1id ? await app.evalJs(ENTRY(n1id)) : null;
  const n2lines = (n2e?.script?.scenes ?? []).flatMap((s) => [s.heading, ...s.body]).map((x) => x.text);
  ok('N2: her words land in that page\'s script lines', n2lines.some((x) => x.includes('INT. ROOF')), { n2lines });

  await openPage('pr-1', false);
  const n3before = await app.evalJs(STORE);
  const n3p = await newPart(); const n3 = await app.evalJs(SURF); const n3after = await app.evalJs(STORE);
  ok('N3 (control): New Part on a prose Part: a prose page opens and nothing is written until her first word', n3p && n3.prose && !n3.script && n3.hash.includes('/page/new') && n3after === n3before, { n3p, n3, same: n3after === n3before });

  await openPage('sl-2', true);
  const n4p = await newPart(); const n4 = await app.evalJs(SURF); const n4id = idOf(n4.hash); const n4e = n4id ? await app.evalJs(ENTRY(n4id)) : null; const n4home = await app.evalJs(ENTRY('sl-2'));
  ok('N4: New Part on a loose screenplay page: it becomes a Doc and the new page is a screenplay in it', n4p && n4.script && !n4.prose && n4e?.pageType === 'script' && !!n4home?.projectId && n4e?.projectId === n4home?.projectId, { n4p, n4, type: n4e?.pageType, same: !!n4home?.projectId && n4e?.projectId === n4home?.projectId });

  // ---- THE PLAN'S DOOR
  await openPage('sp-1', true); await planTab();
  const p1p = await door('c1'); const p1 = await app.evalJs(SURF); const p1id = idOf(p1.hash); const p1e = p1id ? await app.evalJs(ENTRY(p1id)) : null;
  const p1board = await app.evalJs(ENTRY('sp-own'));
  const p1link = (p1board?.pageLinks ?? []).find((l) => l.aBoxId === 'c1' && !l.deletedAt);
  const p1parts = await app.evalJs(`window.wrizoParts ? window.wrizoParts.partsOfDoc(${q(ids.feature)}).map((p) => p.id) : null`);
  ok('P1: the Plan door on a screenplay Part: a screenplay Part opens, named for the row, last in the Doc, linked from the card', p1p && p1.script && !p1.prose && p1e?.pageType === 'script' && p1e?.projectId === ids.feature && p1e?.pageSettings?.name === 'Opening' && !!p1id && p1parts?.[p1parts.length - 1] === p1id && p1link?.bEntryId === p1id, { p1p, p1, type: p1e?.pageType, name: p1e?.pageSettings?.name, last: p1parts?.[p1parts.length - 1] === p1id, linked: !!p1id && p1link?.bEntryId === p1id });

  await openPage('sp-1', true); await planTab();
  const p2 = await app.evalJs(ROW('c1'));
  ok('P2: back on the first page, the row reads Open Part and has no tick while the Part has no words', p2?.door === 'open' && p2?.tick === false, p2);

  let p3 = null;
  if (p1id && p1.script) { await openPage(p1id, true); await typeScript(p1id, 'INT. ATTIC'); await openPage('sp-1', true); await planTab(); p3 = await app.evalJs(ROW('c1')); }
  ok('P3: once the screenplay Part has words, the row wears the tick', p3?.door === 'open' && p3?.tick === true, p3 ?? 'no screenplay Part to write in');

  const p4before = await app.evalJs(`${ALL}.length`);
  const p4p = p3 ? await door('c1') : false; const p4 = await app.evalJs(SURF); const p4after = await app.evalJs(`(() => { window.wrizoFlushNow(); return ${ALL}.length; })()`);
  ok('P4: Open Part opens that Part and creates nothing', p4p && !!p1id && idOf(p4.hash) === p1id && p4.script && p4after === p4before, { p4p, p4, p4before, p4after });

  await openPage('pr-1', false); await planTab();
  const p5before = await app.evalJs(STORE);
  const p5p = await door('p1'); const p5 = await app.evalJs(SURF); const p5after = await app.evalJs(STORE);
  ok('P5 (control): the Plan door on a prose Part still writes nothing and opens a prose page', p5p && p5.prose && !p5.script && p5.hash.includes('/page/new') && p5after === p5before, { p5p, p5, same: p5after === p5before });

  await openPage('sl-1', true); await planTab();
  const p6p = await door('l1'); const p6 = await app.evalJs(SURF); const p6id = idOf(p6.hash); const p6e = p6id ? await app.evalJs(ENTRY(p6id)) : null; const p6home = await app.evalJs(ENTRY('sl-1'));
  ok('P6: the Plan door on a loose screenplay page: it becomes a Doc and the row\'s Part is a screenplay in it', p6p && p6.script && !p6.prose && p6e?.pageType === 'script' && p6e?.pageSettings?.name === 'One' && !!p6home?.projectId && p6e?.projectId === p6home?.projectId, { p6p, p6, type: p6e?.pageType, name: p6e?.pageSettings?.name, same: !!p6home?.projectId && p6e?.projectId === p6home?.projectId });
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 10;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-NEW-PART VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-NEW-PART VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
