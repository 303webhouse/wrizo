// ARBOR'S TOP BAR ON THE REORG (claude/wrizors/arbor-reorg-spec.md §3; Fable, Nov 21 6:54 pm; INK's theme gate plateau.top, off until the Wrizors
// pass the frames, so it is seen through the preview door ?reorglift=plateau.top). The live top bar, flush: Drawer › Page › Section n of m with the
// Section's tag before its name, the stages where they stand, the search door; on a Canvas with no Page, its views and Connect Page.
//
// The fixture (seams only): a Drawer "Fiction" with a set "The Mill" of three Sections (at-1 .. at-3, the second tagged C) and a Canvas at-c that
// serves no Page; Arbor's redesign as it ships (WS_ARBOR2=default), by day (?arbor2room=day) and by night, 1366x768.
//
// GATE    T0  the reorg's top bar stands in Arbor with the preview door, and not without the door (the cell is off), nor in the classic Plateau
//             (?arbor2=0), nor without the switch
// NAMES   T1  on Section 2 the bar reads the Drawer, the Page and "2 of 3", with the Section's tag (C) just before its name
// DRESS   T2  the names are not bare buttons (no button face, no border) and the bar holds one row: the names, the stages and the search door on one
//             line inside the bar
//         T3  by day and by night every name reads 4.5:1 or better on the bar
//         T4  the Section's tag carries its number (3 for C: Arbor's numbered cloth)
// STAGES  T5  the stages stand at the bar's right: FREE WRITE · DRAFT · REVISE · PUBLISH (the host's own strip)
// PAGE    T6  the page's rect is the same with the reorg's top bar and with Arbor's own (the bar's content changes, the page does not move)
// CANVAS  T7  on a Canvas with no Page the bar shows Connect Page and the canvas's views where the stages stand
// MACHINA T8  Machina's top bar draws no tag (the tag is Arbor's)
// MUTANT  MUT-T2  a reading with the search door wrapped under the names turns T2's test red
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-arbor-top-live.mjs
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rgbOf = (c) => { const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const lum = (c) => { const v = rgbOf(c); if (!v) return NaN; const [r, g, b] = v.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const DOOR = '&reorglift=plateau.top';
const TOP = `(() => { const t = document.querySelector('.reorg-top'); if (!t) return null; const bar = t.closest('.sprint-nav'); const br = bar ? bar.getBoundingClientRect() : null;
  const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, b: r.bottom }; };
  const names = [...t.querySelectorAll('.reorg-top-name, .reorg-top-part-count')].map((e) => { const s = getComputedStyle(e); const btn = e.matches('button') ? e : e.querySelector('button'); const bs = btn ? getComputedStyle(btn) : s;
    return { text: (e.textContent || '').trim(), color: s.color, btnBg: bs.backgroundColor, btnBorder: bs.borderTopWidth, box: box(e) }; });
  const tag = t.querySelector('.reorg-top-tag'); const name = t.querySelector('.reorg-top-part .reorg-top-name');
  return { kind: t.getAttribute('data-reorg-top'), text: (t.textContent || '').replace(/\\s+/g, ' ').trim(), bg: bar ? getComputedStyle(bar).backgroundColor : null, bar: br && { t: br.top, b: br.bottom, h: br.height },
    names, search: box(t.querySelector('.reorg-top-search')), namesBox: box(t.querySelector('.reorg-top-names')),
    tag: tag ? { slot: tag.getAttribute('data-top-tag'), num: getComputedStyle(tag, '::after').content, beforeName: !!name && !!(tag.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING) } : null,
    stages: [...document.querySelectorAll('.sprint-nav [data-mode-key]')].map((e) => (e.textContent || '').trim().toUpperCase()),
    connect: (t.querySelector('[data-top-connect]') || {}).textContent || null, views: t.querySelectorAll('.reorg-top-right button').length }; })()`;
const PAGE = "(() => { const p = document.querySelector('.mode-page'); if (!p) return null; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); })()";
async function visit(app, search, id = 'at-2', theme = 'plateau') {
  await app.evalJs(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); history.replaceState(null, '', '${search}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.sprint-nav')", { label: `the bar (${theme} ${search})`, timeout: 20000 }).catch(() => {});
  await sleep(1300);
}
const oneRow = (r) => !!r && !!r.bar && !!r.search && !!r.namesBox && Math.abs((r.search.t + r.search.h / 2) - (r.namesBox.t + r.namesBox.h / 2)) <= 6 && r.search.b <= r.bar.b + 1 && r.namesBox.t >= r.bar.t - 1;
const t2 = (r) => !!r && r.names.length >= 3 && r.names.every((n) => n.btnBg === 'rgba(0, 0, 0, 0)' && n.btnBorder === '0px') && oneRow(r);

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }).catch(() => {});
  await app.evalJs(`(() => { const W = window; const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    page('at-1', 'Chapter One\\nThe rain had not stopped.', { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('at-2', 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('at-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page('at-c', 'Plot canvas', { origin: 'loose', pageType: 'board', boxes: [{ id: 'k1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The mill floods' }] });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(500);

  // the gate, and the page with Arbor's own bar (T6's baseline)
  await visit(app, '/?arbor2room=day');
  const live = await app.evalJs('!!document.querySelector(\'.reorg-top\')');
  const pageLive = await app.evalJs(PAGE);
  await visit(app, '/?reorg=1&arbor2room=day');
  const noDoor = await app.evalJs('!!document.querySelector(\'.reorg-top\')');
  await visit(app, `/?arbor2=0&reorg=1${DOOR}`);
  const classic = await app.evalJs('!!document.querySelector(\'.reorg-top\')');
  await visit(app, `/?reorg=1${DOOR}&arbor2room=day`);
  await app.evalJs("window.wrizoParts && window.wrizoParts.setPartColor('at-2', 'c'); null"); await sleep(800);
  const day = await app.evalJs(TOP);
  const pageReorg = await app.evalJs(PAGE);
  ok('T0 the reorg\'s top bar stands in Arbor with the preview door, and not without it, nor in the classic Plateau, nor without the switch', !!day && !live && !noDoor && !classic, { door: !!day, live, noDoor, classic });
  ok('T1 on Section 2 the bar reads the Drawer, the Page and "2 of 3", with the Section\'s tag (C) just before its name',
    !!day && /Fiction/i.test(day.text) && /The Mill/.test(day.text) && /2 of 3/.test(day.text) && !!day.tag && day.tag.slot === 'c' && day.tag.beforeName, day && { text: day.text, tag: day.tag });
  ok('T2 the names are not bare buttons and the bar holds one row (names, stages, search door on one line inside the bar)', t2(day), day && { names: day.names.map((n) => [n.text, n.btnBg, n.btnBorder]), bar: day.bar, search: day.search, namesBox: day.namesBox });
  const wrapped = day && day.search ? { ...day, search: { ...day.search, t: day.search.t + 30, b: day.search.b + 30 } } : null;
  ok('MUT-T2 a reading with the search door wrapped under the names turns T2\'s test red', !!wrapped && wrapped.search.t !== day.search.t && !t2(wrapped), wrapped && wrapped.search);
  ok('T4 the Section\'s tag carries its number (3 for C)', !!day && !!day.tag && /"?3"?/.test(day.tag.num) && day.tag.num !== 'none', day && day.tag);
  ok('T5 the stages stand at the bar\'s right: FREE WRITE · DRAFT · REVISE · PUBLISH', !!day && ['FREE WRITE', 'DRAFT', 'REVISE', 'PUBLISH'].every((s) => day.stages.includes(s)), day && day.stages);
  ok('T6 the page\'s rect is the same with the reorg\'s top bar and with Arbor\'s own', !!pageLive && pageLive === pageReorg, { pageLive, pageReorg });

  await visit(app, `/?reorg=1${DOOR}&arbor2room=night`);
  const night = await app.evalJs(TOP);
  const readable = (r) => !!r && r.names.length >= 3 && r.names.every((n) => contrast(n.color, r.bg) >= 4.5);
  ok('T3 by day and by night every name reads 4.5:1 or better on the bar', readable(day) && readable(night),
    { day: day && day.names.map((n) => [n.text, +contrast(n.color, day.bg).toFixed(2)]), night: night && night.names.map((n) => [n.text, +contrast(n.color, night.bg).toFixed(2)]) });

  // FIXTURE (Nov 21, Actions 44974589071 on d9d24f94: the Canvas sat in The Mill, so it served that Page and the bar rightly offered "+"; a Canvas with
  // no Page is a LOOSE one): at-c is loose. No assertion changes.
  await visit(app, `/?reorg=1${DOOR}&arbor2room=day`, 'at-c');
  const canvas = await app.evalJs(TOP);
  ok('T7 on a Canvas with no Page the bar shows Connect Page and the canvas\'s views where the stages stand', !!canvas && canvas.kind === 'board' && /connect/i.test(canvas.connect || '') && /page/i.test(canvas.connect || '') && canvas.views >= 3, canvas && { kind: canvas.kind, connect: canvas.connect, views: canvas.views });

  await visit(app, '/?reorg=1&arbor2=0', 'at-2', 'machina');
  const machina = await app.evalJs("({ top: !!document.querySelector('.reorg-top'), tags: document.querySelectorAll('.reorg-top-tag').length })");
  ok('T8 Machina\'s top bar draws no tag', machina.top && machina.tags === 0, machina);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 10;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ARBOR-TOP-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ARBOR-TOP-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
