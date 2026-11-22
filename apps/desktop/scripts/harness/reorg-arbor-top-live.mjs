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
// FOOT    T9  (the frames on dc282511, Actions 44975564667: by night the page's Part foot nearly vanished on the cream paper while its rule stayed
//             dark) by day and by night the Part foot's words read 4.5:1 or better on the paper AS DRAWN: the darkest pixel of "end of Section 2"
//             and of "Next" against the paper's median just below the foot (the paper paints transparent in Arbor; the colour and opacity chain
//             ride in the detail to name the cause)
//         MUT-T9  the day reading with its ink at the paper's own colour (a vanished foot) turns T9's test red
// STAGES  P1  (the Wrizors' REAL 2, arbor-reorg-pass-1.md §1: in Publish the names drew as white browser buttons over the strip, the search door
//             dropped below, the bar grew 51 -> 92 px and the page moved 41 px) with the publishing view lifted too (&reorglift=plateau.top,
//             plateau.uplink), in FREE WRITE, DRAFT, REVISE and PUBLISH the bar keeps ONE row (names, stages and search door on one line inside it), its
//             names are not bare buttons, and its height is the same in all four (within 0.5 px)
//         MUT-P1  the Publish reading with the bar 41 px taller turns P1's test red
//         P2  the page's rect (column, paper, editor) is the same in DRAFT and with PUBLISH's view open over it (Free Write is the ruled Typewriter
//             exception, so it is not compared)
//         P2-B [successor] the page (column and paper) keeps its rect in DRAFT and in PUBLISH (the editor is under INK's publishing view, REAL 3);
//             MUT-P2-B  the page 41 px lower in Publish fails it
// PASS 2  (the Wrizors, arbor-reorg-pass-2.md section 1; Fable, Nov 21 11:55 pm)
//         T11 (REAL 1: the tag's edge read 1.08:1 on the day bar, 1.20:1 by night) for every slot a-f, by day and by night, the Section's tag is filled
//             in its cloth (a olive #56632E, b sea #17454E, c cold blue #7FA0BC, d madder #A8392F, e honey #C9A46B, f iron #39414A) with the rail tabs'
//             1 px darker edge, its number reads 4.5:1 or better on the cloth, and the tag stands 3:1 or better against the bar (its fill, its edge or
//             its keyline)
//         MUT-T11  the same readings with no keyline (cloth and darker edge alone) turn T11's test red (olive, sea, madder, iron sit under 3:1 on the bars)
//         T12 (NIT 3: 47 px on a Canvas, 51 on a Page) the bar on a Canvas with no Page is the Page's bar height (within 0.5 px), on one row
//         T13 (NIT 1: the canvas views are icons only) resting the pointer on the views shows each view's word, and the bar keeps its height and one row
//         T10 (a guard for T9's fix, which letters the foot for the paper: green on the red build too) by night on a DARK page the Part foot's
//             words read 4.5:1 or better on the paper as drawn
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
// T9: the Part foot as drawn - a clip of each word box, its darkest pixel, against the paper's median in a strip just below the foot
const FOOTBOX = "(() => { const f = document.querySelector('.reorg-part-foot'); if (!f) return null; const fr = f.getBoundingClientRect(); const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null; };\n" +
  "  const chain = []; for (let e = f.querySelector('.reorg-part-foot-end') || f; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.opacity !== '1' || s.filter !== 'none') chain.push([e.className && String(e.className).slice(0, 40), s.opacity, s.filter]); }\n" +
  "  const end = f.querySelector('.reorg-part-foot-end'); const next = f.querySelector('.reorg-part-foot-go.is-next');\n" +
  "  return { words: [box(end), box(next)].filter(Boolean), paper: { x: Math.round(fr.left + 4), y: Math.round(fr.bottom + 6), w: Math.max(8, Math.round(fr.width - 8)), h: 10 }, color: end ? getComputedStyle(end).color : null, nextColor: next ? getComputedStyle(next).color : null, chain }; })()";
async function drawnFoot(app) {
  const b = await app.evalJs(FOOTBOX); if (!b || !b.words.length) return { found: false, b };
  const clip = async (c, how) => { const data = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: c.x, y: c.y, width: c.w, height: c.h, scale: 1 } })).data;
    return app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data;
      const px = []; for (let i = 0; i < D.length; i += 4) px.push([D[i], D[i + 1], D[i + 2]]); const L = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]; px.sort((p, q) => L(p) - L(q)); return ${how === 'ends' ? '[px[0], px[px.length - 1]]' : 'px[px.length >> 1]'}; })()`); };
  // DRIVER FIX (Nov 21, Actions 44976946974 on 3e81cf88: on the dark page the darkest pixel is the paper itself, so T10 read 1:1 while the foot drew
  // #B9AA8C): each word box gives its darkest and its lightest pixel, and the ink is the one farther from the paper. No assertion changes.
  const rgb = (p) => (Array.isArray(p) ? `rgb(${p.join(', ')})` : null);
  const paper = await clip(b.paper, 'median'); const inks = [];
  for (const w of b.words) { const e = await clip(w, 'ends'); inks.push(Array.isArray(e) && rgb(paper) ? (contrast(rgb(e[0]), rgb(paper)) >= contrast(rgb(e[1]), rgb(paper)) ? e[0] : e[1]) : null); }
  return { found: true, paper: rgb(paper), inks: inks.map(rgb), color: b.color, nextColor: b.nextColor, chain: b.chain };
}
const footReads = (f) => !!f && f.found && !!f.paper && f.inks.length >= 2 && f.inks.every((i) => !!i && contrast(i, f.paper) >= 4.5);
const footDetail = (f) => f && f.found ? { paper: f.paper, inks: f.inks, ratios: f.inks.map((i) => +contrast(i, f.paper).toFixed(2)), color: f.color, nextColor: f.nextColor, chain: f.chain } : f;
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
  await app.mouseMove(700, 400); await sleep(400);
  const footDay = await drawnFoot(app);
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
  await app.mouseMove(700, 400); await sleep(400);
  const footNight = await drawnFoot(app);
  ok('T9 by day and by night the Part foot\'s words read 4.5:1 or better on the paper as drawn', footReads(footDay) && footReads(footNight), { day: footDetail(footDay), night: footDetail(footNight) });
  await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' }); null"); await sleep(700); await app.mouseMove(700, 400); await sleep(400);
  const footDark = await drawnFoot(app);
  const darkPage = await app.evalJs("document.documentElement.getAttribute('data-page')");
  await app.evalJs("window.wrizoThemePrefs.set({ page: 'light' }); null"); await sleep(500);
  ok('T10 by night on a dark page the Part foot\'s words read 4.5:1 or better on the paper as drawn', darkPage === 'dark' && footReads(footDark), { darkPage, foot: footDetail(footDark) });
  const vanished = footDay && footDay.found ? { ...footDay, inks: footDay.inks.map(() => footDay.paper) } : null;
  ok('MUT-T9 the day reading with its ink at the paper\'s own colour turns T9\'s test red', !!vanished && footReads(footDay) !== footReads(vanished) && !footReads(vanished), vanished && footDetail(vanished));
  const readable = (r) => !!r && r.names.length >= 3 && r.names.every((n) => contrast(n.color, r.bg) >= 4.5);
  ok('T3 by day and by night every name reads 4.5:1 or better on the bar', readable(day) && readable(night),
    { day: day && day.names.map((n) => [n.text, +contrast(n.color, day.bg).toFixed(2)]), night: night && night.names.map((n) => [n.text, +contrast(n.color, night.bg).toFixed(2)]) });

  // FIXTURE (Nov 21, Actions 44974589071 on d9d24f94: the Canvas sat in The Mill, so it served that Page and the bar rightly offered "+"; a Canvas with
  // no Page is a LOOSE one): at-c is loose. No assertion changes.
  await visit(app, `/?reorg=1${DOOR}&arbor2room=day`, 'at-c');
  const canvas = await app.evalJs(TOP);
  ok('T7 on a Canvas with no Page the bar shows Connect Page and the canvas\'s views where the stages stand', !!canvas && canvas.kind === 'board' && /connect/i.test(canvas.connect || '') && /page/i.test(canvas.connect || '') && canvas.views >= 3, canvas && { kind: canvas.kind, connect: canvas.connect, views: canvas.views });

  // ---- P1, P2: the bar in every stage, the publishing view lifted too ----
  const LAYERS = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const e = document.querySelector(s); if (!e) return '-'; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); }).join(' | '))()";
  const stageTo = async (key) => { await app.evalJs(`document.querySelector('.sprint-nav [data-mode-key="${key}"]')?.click(); null`); await sleep(1100); await app.mouseMove(700, 400); await sleep(300); };
  await visit(app, `/?reorg=1&reorglift=plateau.top,plateau.uplink&arbor2room=day`);
  const stg = {};
  for (const key of ['freewrite', 'draft', 'revise', 'publish']) {
    await stageTo(key);
    stg[key] = { top: await app.evalJs(TOP), page: await app.evalJs(LAYERS), pub: await app.evalJs("!!document.querySelector('[data-reorg-pub]')") };
  }
  await stageTo('draft');
  const p1 = (s) => { const r = ['freewrite', 'draft', 'revise', 'publish'].map((k) => s[k] && s[k].top); if (!r.every((x) => !!x && !!x.bar)) return false; const h = r[1].bar.h; return r.every((x) => t2(x) && Math.abs(x.bar.h - h) <= 0.5); };
  const p1Detail = (s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.top && { h: v.top.bar && v.top.bar.h, oneRow: oneRow(v.top), bare: v.top.names.map((n) => [n.text, n.btnBg, n.btnBorder]), search: v.top.search, namesBox: v.top.namesBox }]));
  ok('P1 in FREE WRITE, DRAFT, REVISE and PUBLISH the bar keeps one row, its names are not bare buttons, and its height is the same (the publishing view lifted too)', stg.publish && stg.publish.pub && p1(stg), { pubOpen: stg.publish && stg.publish.pub, ...p1Detail(stg) });
  const tall = stg.publish && stg.publish.top && stg.publish.top.bar ? { ...stg, publish: { ...stg.publish, top: { ...stg.publish.top, bar: { ...stg.publish.top.bar, h: stg.publish.top.bar.h + 41, b: stg.publish.top.bar.b + 41 } } } } : null;
  ok('MUT-P1 the Publish reading with the bar 41 px taller turns P1\'s test red', !!tall && p1(stg) !== p1(tall) && !p1(tall), tall && tall.publish.top.bar);
  // SUPERSEDED (Actions 44986055097 on 4f2aff23: red on the EDITOR alone - the column and the paper identical - because on this base Arbor's publishing
  // view is undressed (INK's dress, a95bdba7, the Wrizors' REAL 3, rides the same train) and stands in the page's flow over the editor; the Wrizors'
  // REAL 2 measured the PAGE moving, the column and the paper). The original, verbatim:
  // ok('P2 the page\'s rect (column, paper, editor) is the same in DRAFT and with PUBLISH\'s view open over it', !!stg.draft && !!stg.publish && stg.publish.pub && stg.draft.page !== '- | - | -' && stg.draft.page === stg.publish.page, { draft: stg.draft && stg.draft.page, publish: stg.publish && stg.publish.page });
  const colPaper = (s) => String(s || '').split('|').slice(0, 2).map((x) => x.trim()).join(' | ');
  const p2b = (d, p) => !!d && !!p && colPaper(d).split(' | ').length === 2 && colPaper(d).split(' | ').every((x) => x !== '-' && x !== '') && colPaper(d) === colPaper(p);
  ok('P2-B the page (its column and its paper) keeps its rect in DRAFT and with PUBLISH\'s view open over it', !!stg.publish && stg.publish.pub && p2b(stg.draft && stg.draft.page, stg.publish && stg.publish.page), { draft: stg.draft && stg.draft.page, publish: stg.publish && stg.publish.page });
  const sunk = stg.publish && stg.publish.page ? stg.publish.page.split('|').map((r, i) => (i < 2 ? r.trim().split(',').map((x, j) => (j === 1 ? String(+x + 41) : x)).join(',') : r.trim())).join(' | ') : null;
  ok('MUT-P2-B the Publish reading with the page 41 px lower (the Wrizors\' REAL 2) turns P2-B\'s test red', !!sunk && p2b(stg.draft && stg.draft.page, stg.publish.page) && !p2b(stg.draft && stg.draft.page, sunk), sunk);

  // ---- T11: the tag for every slot, by day and by night ----
  const CLOTH = { a: ['rgb(86, 99, 46)', 'rgb(58, 67, 34)'], b: ['rgb(23, 69, 78)', 'rgb(15, 47, 54)'], c: ['rgb(127, 160, 188)', 'rgb(95, 120, 141)'], d: ['rgb(168, 57, 47)', 'rgb(126, 43, 35)'], e: ['rgb(201, 164, 107)', 'rgb(151, 123, 80)'], f: ['rgb(57, 65, 74)', 'rgb(43, 49, 56)'] };
  // DRIVER FIX (Nov 22, Actions 44996268396 on e441c207): the painted ink is the computed -webkit-text-fill-color (equal to `color` unless set; the tag
  // sets it so the night dim's `color` rule cannot turn its number cream). No assertion changes.
  const TAG = "(() => { const g = document.querySelector('.reorg-top .reorg-top-tag'); const bar = document.querySelector('.chrome-top.sprint-nav'); if (!g || !bar) return null; const s = getComputedStyle(g); return { slot: g.getAttribute('data-top-tag'), fill: s.backgroundColor, edge: s.borderTopColor, edgeW: s.borderTopWidth, ink: s.webkitTextFillColor || s.color, ring: s.boxShadow, bar: getComputedStyle(bar).backgroundColor }; })()";
  const ringOf = (r) => { const m = /(rgba?\([^)]*\))\s+0px\s+0px\s+0px\s+([\d.]+)px/.exec(r || ''); return m && +m[2] >= 1 ? m[1] : null; };
  const tagStands = (g) => !!g && Math.max(contrast(g.fill, g.bar), contrast(g.edge, g.bar), ringOf(g.ring) ? contrast(ringOf(g.ring), g.bar) : 0) >= 3;
  const tagOk = (g, s) => !!g && g.slot === s && g.fill === CLOTH[s][0] && g.edge === CLOTH[s][1] && g.edgeW === '1px' && contrast(g.ink, g.fill) >= 4.5 && tagStands(g);
  const tags = {};
  for (const room of ['day', 'night']) {
    await visit(app, `/?reorg=1${DOOR}&arbor2room=${room}`);
    for (const s of 'abcdef') { await app.evalJs(`window.wrizoParts && window.wrizoParts.setPartColor('at-2', '${s}'); null`); await sleep(450); tags[`${room}.${s}`] = await app.evalJs(TAG); }
  }
  await app.evalJs("window.wrizoParts && window.wrizoParts.setPartColor('at-2', 'c'); null"); await sleep(300);
  const t11 = (all) => Object.entries(all).length === 12 && Object.entries(all).every(([k, g]) => tagOk(g, k.split('.')[1]));
  ok('T11 for every slot, by day and by night, the tag is filled in its cloth with its 1 px darker edge, its number 4.5:1, and it stands 3:1 or better against the bar', t11(tags),
    Object.fromEntries(Object.entries(tags).map(([k, g]) => [k, g && { fill: g.fill, edge: g.edge, ring: g.ring, numR: +contrast(g.ink, g.fill).toFixed(2), standR: +Math.max(contrast(g.fill, g.bar), contrast(g.edge, g.bar), ringOf(g.ring) ? contrast(ringOf(g.ring), g.bar) : 0).toFixed(2) }])));
  const bare = Object.fromEntries(Object.entries(tags).map(([k, g]) => [k, g && { ...g, ring: 'none' }]));
  ok('MUT-T11 the same readings with no keyline (cloth and darker edge alone) turn T11\'s test red', Object.values(tags).every((g) => !!g) && !t11(bare), Object.entries(bare).filter(([k, g]) => g && !tagStands(g)).map(([k]) => k));

  // ---- T12, T13: the bar on a Canvas, and its views on hover ----
  await visit(app, `/?reorg=1${DOOR}&arbor2room=day`, 'at-c');
  const cv0 = await app.evalJs(TOP);
  ok('T12 the bar on a Canvas with no Page is the Page\'s bar height (within 0.5 px), on one row', !!cv0 && !!cv0.bar && !!day && !!day.bar && Math.abs(cv0.bar.h - day.bar.h) <= 0.5 && oneRow(cv0), { canvas: cv0 && cv0.bar, page: day && day.bar, oneRow: oneRow(cv0) });
  const sa = await app.evalJs("(() => { const g = document.querySelector('.reorg-top .show-as'); if (!g) return null; const r = g.getBoundingClientRect(); return { x: Math.round(r.left + 6), y: Math.round(r.top + r.height / 2) }; })()");
  if (sa) { await app.mouseMove(sa.x, sa.y); await sleep(900); }
  const words = await app.evalJs("[...document.querySelectorAll('.reorg-top .show-as .show-as-btn')].map((b) => { const w = b.querySelector('.show-as-word'); return [b.getAttribute('title'), !!w && getComputedStyle(w).display !== 'none' && w.getBoundingClientRect().width > 0 ? (w.textContent || '').trim() : null]; })");
  const cv1 = await app.evalJs(TOP);
  await app.mouseMove(700, 500); await sleep(400);
  ok('T13 resting the pointer on the canvas views shows each view\'s word, and the bar keeps its height and one row', !!sa && Array.isArray(words) && words.length >= 3 && words.every(([title, w]) => !!title && w === title) && !!cv1 && !!cv0 && Math.abs(cv1.bar.h - cv0.bar.h) <= 0.5 && oneRow(cv1), { words, bar0: cv0 && cv0.bar, bar1: cv1 && cv1.bar, oneRow: oneRow(cv1) });

  await visit(app, '/?reorg=1&arbor2=0', 'at-2', 'machina');
  const machina = await app.evalJs("({ top: !!document.querySelector('.reorg-top'), tags: document.querySelectorAll('.reorg-top-tag').length })");
  ok('T8 Machina\'s top bar draws no tag', machina.top && machina.tags === 0, machina);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 21;   // + T11, MUT-T11, T12, T13 (the Wrizors' pass 2, Nov 21). Was: const EXPECTED = 17;   // P2 parked: + P2-B, MUT-P2-B. Was: const EXPECTED = 16;   // 10 + T9, MUT-T9 (the Part foot by night, Nov 21) + T10 (the dark page, its guard) + P1, MUT-P1, P2 (the Wrizors' REAL 2, every stage)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ARBOR-TOP-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ARBOR-TOP-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
