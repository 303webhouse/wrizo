// #119 (Fable, Nov 24, 8:05 am; INK's first job after Flux live): a 50,000-word page -> its Plan -> back leaves the caret OFF SCREEN, 3 of 3
// (Chat 1's box turns 08:50Z/08:56Z on 1bc2cda5: S5 of typing-latency-scroll.mjs, caret top 264.6 before, -234.2 after; scrollHeight 88200 -> 87352).
// THE SUBJECT IS ARBOR'S REDESIGN, NOT FLUX: those runs set WS_URL_SEARCH=?flux3=1, which replaced the driver's ?arbor2=0 pin, and the file sets no
// theme, so they ran in Arbor (plateau, the default) with the redesign on - its production default since Nov 15. FLUX3 changes nothing outside Flux.
// THE MECHANISM, read from the source: arbor-v2.css (r21, Nov 4) sets `scrollbar-color:transparent transparent` on every .mode-scroll while she
// writes (<html data-wz-writing='true'>). In Chromium 121+ a scrollbar-color drops the element's ::-webkit-scrollbar rules, so the prose page's
// 10 px webkit bar (02-scrollbars.css) turns into the wider native one, and with the redesign's `scrollbar-gutter:auto` the text column narrows: every
// line re-wraps, the page grows (87352 -> 88200 on the 50k page), and a return that restores a raw scrollTop over the narrower-or-wider page lands
// on other text. The redesign's own promise (arbor-v2.css, 4b): "The bar keeps its 10 px box, so nothing reflows."
// The redesign (no query: WS_ARBOR2=default); the 50k page through the app's seam; her writing through real keys (<html data-wz-writing>):
//   P0  (premise) Arbor's redesign is on in Arbor, the page is the framed prose page, and it opens as rows
//   P1  (premise) a real key puts her in writing (<html data-wz-writing='true'>)
//   W1  the text column keeps its width when she starts writing (the editor's and the scroller's content width, within 0.5 px)
//   W2  the scroller's bar box keeps its width when she starts writing (offsetWidth - clientWidth, within 0.5 px)
//   S5  page -> Plan -> back (typing-latency-scroll's S5, under the redesign): the caret comes back to the same offset AND the same place on screen
//       (within 3 px), and it is on screen
//   MUT (mutant) the r21 rule put back verbatim, from a <style> (asserted LANDED: the scroller's computed scrollbar-color while she writes is
//       'transparent transparent') - W1's read goes RED
// RED FIRST: on main before the change, W1, W2 and S5 fail; the mutant lands as a duplicate of the live rule.
// Run: node scripts/harness/arbor2-119-plan-back.mjs   (from apps/desktop, dist-web built, box turn granted - or on Actions)
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const PAGE = 'a119-page';
const WORDS = 50000;
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
// typing-latency-scroll.mjs's page, word for word (the same 50k text the red runs read)
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 40 + (i % 90); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w += 1; } out.push(line.join(' ') + '.'); i += 1; } return out.join('\n'); };
const mouse = (app, type, x, y, n, b) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: b, clickCount: n, pointerType: 'mouse' });
// the caret: its plain offset, and its place on screen relative to the scroller (typing-latency-scroll.mjs's reader)
const caret = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const sc = document.querySelector('.mode-scroll'); const s = getSelection();
  if (!ed || !sc || !s.rangeCount || !ed.contains(s.anchorNode)) return null;
  const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.anchorNode, s.anchorOffset); const off = r.toString().split('\\u200b').join('').length;
  const c = s.getRangeAt(0).cloneRange(); let rect = c.getClientRects()[0];
  if (!rect && s.anchorNode.nodeType === 3 && s.anchorNode.length > 0) { const q = document.createRange(); const o = s.anchorOffset;
    if (o > 0) { q.setStart(s.anchorNode, o - 1); q.setEnd(s.anchorNode, o); } else { q.setStart(s.anchorNode, 0); q.setEnd(s.anchorNode, 1); } rect = q.getClientRects()[0]; }
  const sb = sc.getBoundingClientRect();
  return { offset: off, top: rect ? Math.round((rect.top - sb.top) * 10) / 10 : null, visible: !!rect && rect.top >= sb.top - 1 && rect.bottom <= sb.bottom + 1,
    scrollTop: Math.round(sc.scrollTop), scrollHeight: sc.scrollHeight }; })()`);
// the column: the editor's and the scroller's content widths, the bar's box, the writing state and the computed scrollbar properties
const column = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const sc = document.querySelector('.mode-scroll'); if (!ed || !sc) return null;
  const cs = getComputedStyle(sc); const bl = parseFloat(cs.borderLeftWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0;
  return { edW: Math.round(ed.getBoundingClientRect().width * 10) / 10, scClientW: sc.clientWidth, bar: Math.round(sc.offsetWidth - sc.clientWidth - bl - br),
    scrollHeight: sc.scrollHeight, writing: document.documentElement.getAttribute('data-wz-writing'), sbColor: cs.scrollbarColor, sbWidth: cs.scrollbarWidth, gutter: cs.scrollbarGutter }; })()`);
const settle = () => sleep(1500);

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: PAGE, text: pageOf(WORDS), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${PAGE}', 'drafting')`);
  await sleep(600);
  await app.evalJs(`location.hash = '#/page/${PAGE}'`);
  const up = await waitSoft(app, `!!document.querySelector('${ED} .wz-row')`, { label: 'the 50k page, as rows', timeout: 30000 });
  const where = await app.evalJs("(() => { const r = document.documentElement; return { arbor2: r.hasAttribute('data-arbor2'), theme: r.getAttribute('data-theme'), prose: !!document.querySelector('.desk-frame-stage--prose .mode-scroll'), zoom: (document.querySelector('.mode-pagecol') || {}).getAttribute?.('data-zoom') ?? null, search: location.search }; })()");
  ok('P0 (premise): Arbor\'s redesign is on in Arbor (no query), the page is the framed prose page, and the 50k page opens as rows',
    up && where && where.arbor2 && where.theme === 'plateau' && where.prose && !/arbor2=0/.test(where.search), J(where));
  if (!up) return;
  await sleep(1500);

  // ---- at rest (no key yet): the column as she arrives
  const rest = await column(app);
  // ---- she writes: a real click to place the caret, then a real key
  const mid = await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll').getBoundingClientRect(); return { x: Math.round(sc.left + sc.width / 2), y: Math.round(sc.top + sc.height / 2) }; })()");
  await mouse(app, 'mouseMoved', mid.x, mid.y, 0, 0); await mouse(app, 'mousePressed', mid.x, mid.y, 1, 1); await mouse(app, 'mouseReleased', mid.x, mid.y, 1, 0);
  await sleep(300);
  await app.typeKeys('x');
  const writingNow = await waitSoft(app, "document.documentElement.getAttribute('data-wz-writing') === 'true'", { label: 'her writing', timeout: 5000 });
  await settle();
  const writing = await column(app);
  ok('P1 (premise): a real key puts her in writing (<html data-wz-writing="true">)', writingNow && writing && writing.writing === 'true', J({ rest, writing }));
  ok('W1: the text column keeps its width when she starts writing (editor and scroller content width, within 0.5 px)',
    !!rest && !!writing && Math.abs(writing.edW - rest.edW) <= 0.5 && Math.abs(writing.scClientW - rest.scClientW) <= 0.5, J({ rest, writing }));
  ok('W2: the scroller\'s bar keeps its box when she starts writing (offsetWidth - clientWidth, within 0.5 px)',
    !!rest && !!writing && Math.abs(writing.bar - rest.bar) <= 0.5, J({ restBar: rest && rest.bar, writingBar: writing && writing.bar }));

  // ---- MUT: the r21 rule put back verbatim; asserted LANDED (computed while she writes), then W1's read must go red
  await app.evalJs(`(() => { const s = document.createElement('style'); s.setAttribute('data-a119-mut', ''); s.textContent = ":root[data-arbor2][data-theme='plateau'][data-wz-writing='true'] .mode-scroll{ scrollbar-color:transparent transparent; }"; document.head.appendChild(s); })()`);
  await sleep(400);
  const mut = await column(app);
  // SUPERSEDED (red run 45422880591, 72c7444e): Chromium computes `transparent` as 'rgba(0, 0, 0, 0)', so this reader called a landed mutant
  // not landed (the column did narrow: mutRed true). Kept verbatim, no longer used:
  // const landed = !!mut && mut.writing === 'true' && /transparent/.test(String(mut.sbColor));
  // successor: any scrollbar-color but 'auto' on the scroller while she writes is the rule landing (the fixed tip leaves it 'auto' on the prose page)
  const landed = !!mut && mut.writing === 'true' && String(mut.sbColor) !== 'auto' && /rgba\(0, 0, 0, 0\)|transparent/.test(String(mut.sbColor));
  const mutRed = !!mut && !!rest && (Math.abs(mut.edW - rest.edW) > 0.5 || Math.abs(mut.scClientW - rest.scClientW) > 0.5);
  ok('MUT: the r21 rule put back verbatim LANDS (scrollbar-color transparent while she writes) and W1\'s read goes RED (the column narrows)', landed && mutRed, J({ rest, mut, landed, mutRed }));
  await app.evalJs("document.querySelectorAll('style[data-a119-mut]').forEach((s) => s.remove())");
  await settle();

  // ---- S5 page -> Plan -> back (typing-latency-scroll.mjs's road, under the redesign): her caret mid-page, while she writes
  await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = Math.round((sc.scrollHeight - sc.clientHeight) * 0.6); })()");
  await settle();
  const mid2 = await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll').getBoundingClientRect(); return { x: Math.round(sc.left + sc.width / 2), y: Math.round(sc.top + sc.height / 2) }; })()");
  await mouse(app, 'mouseMoved', mid2.x, mid2.y, 0, 0); await mouse(app, 'mousePressed', mid2.x, mid2.y, 1, 1); await mouse(app, 'mouseReleased', mid2.x, mid2.y, 1, 0);
  await app.typeKeys('y');
  await settle();
  const before = await caret(app);
  const beforeCol = await column(app);
  const door = await app.evalJs("!!document.querySelector('[data-page-plan-door]')");
  if (door) {
    await app.evalJs("document.querySelector('[data-page-plan-door]').click()");
    await waitSoft(app, "!!document.querySelector('[data-board-door=\"page\"]')", { label: 'the Plan', timeout: 9000 });
    await sleep(900);
    await app.evalJs("document.querySelector('[data-board-door=\"page\"]').click()");
    await waitSoft(app, `location.hash === '#/page/${PAGE}' && !!document.querySelector('${ED} .wz-row')`, { label: 'back on the page', timeout: 30000 });
    await settle();
  }
  const after = await caret(app);
  const afterCol = await column(app);
  ok('S5: page -> Plan -> back (under Arbor\'s redesign) returns the caret to the same offset AND the same place on screen (within 3 px), on screen',
    door && !!before && !!after && after.offset === before.offset && before.top !== null && after.top !== null && Math.abs(after.top - before.top) <= 3 && after.visible,
    J({ door, before, after, beforeCol, afterCol }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const EXPECTED = 6;
const passed = checks.filter((c) => c.pass).length;
const verdict = passed === checks.length && checks.length === EXPECTED;
console.log(verdict ? `\nARBOR2-119-PLAN-BACK VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-119-PLAN-BACK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed${checks.length !== EXPECTED ? `, ${checks.length} of ${EXPECTED} checks ran` : ''}`);
process.exit(verdict ? 0 : 1);
