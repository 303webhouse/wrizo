// FLUX'S RAIL ON THE REORG (claude/wrizors/flux-reorg-spec.md sections 1, 2, 6, 7, flux-reorg-words.md A; Fable, Nov 22 9:20 pm; plan: claude/flux-live-plan.md).
// The reorg's rail in the redesign's command-box dress (flux3/flux-v3.css L2), behind INK's gate: flux.rail is off until the Wrizors pass the frames, so it is
// seen through the preview door (?reorg=1&flux3=1&reorglift=flux.rail).
//
// The fixture (seams only): a Drive "Fiction" holding a set "The Mill" with two Tracks fl-1, fl-2 and a Circuit fl-c, and a loose page fl-l; 1366x768.
//
// GATE    R0  the reorg's rail stands in Flux with the redesign, the switch and the door, and not without the door, nor without the redesign, nor the switch
// DOORS   R1  the doors read, in order, DOCS · DRIVES · ORPHANS · CIRCUITS · LOG, and the foot SKIN · CONFIG
// DRESS   R2  every door is a command box: a hairline 1 px #1D4A52 edge, a 2 px left edge, its name in 9 px capitals
//         MUT-R2  the same reading with the browser's own button face turns R2's test red
// READ    R3  [parked Nov 23: the live rail counts PAGES, the reorg counts DOCS; successor R3-B] DOCS, CIRCUITS and LOG each carry the TRUE reading and hover hint the live Flux rail shows for this same page (the live rail is the oracle)
//         R3-B DOCS, CIRCUITS, LOG and her place each carry the count the reorg's OWN lists state (her Drive's row, the Log's row, the Circuits in her Drive's list) and L2's hover hint
//         MUT-R3-B  the same reading at the live rail's page counts turns R3-B's test red
// PLACE   R4  her place is orange: the where box's left edge and its name #FF9800 (the one brass mark on the rail)
// OPEN    R5  an opened door has the electric-blue left edge #00C2FF
// PANEL   R6  the opened DRIVES pop-out is in node dress (fill #04141A, a 1 px #7EB4C4 edge), its rows draw no button face, its words 4.5:1 or better
//         MUT-R6  the same reading on Machina's grey panel turns R6's test red
// PAGE    R7  the page's rect (column, paper, editor) is the same with a door open and closed
// EDGE    R8  at 1366 the open pop-out ends before the page's left opener and the opener takes a press; at 1920 it keeps its 300 px
// BOXES   R9  (spec 1; words A) Box settings offers the six signals by number, 01 to 06 (Cyan, Lime, Pink, Ice, Teal, Deep cyan on hover), beside Custom…; pressing
//             02 draws her box in lime, its letters 4.5:1 or better
// SESSION R10 (spec 7) in DOCS the Session's fold has no button face, opened its rows read 4.5:1 and its Quota field has a 3:1 edge; Recent's sort is words, the chosen
//             one underlined
// MACHINA R11 Machina's reorg rail is as it was: DOCS · PROJECTS · UNFILED, its five swatches
// COUNTS  R12 (spec 2) DRIVES and ORPHANS each carry their true count (the count their own pop-out's head shows) and L2's hover hint: "2 drives", "1 doc or circuit
//             not filed in a drive"
// PLAIN   R13 (spec 11, rule 7) a Drive box with no colour of its own is node dress: fill #04141A, a 1 px #7EB4C4 edge, letters text-hi #E7F4F1
// CODES   R14 (spec 11, rule 2) each swatch's code holds 4.5:1 against that swatch's own colour
// PASS 1  (the Wrizors, flux-rail-pass-1.md; Fable, Nov 22 10:50 pm)
//         R3-B and MUT-R3-B [parked Nov 23: DOCS now counts its own list, every Doc anywhere, not "in this drive"; successor R15]
//         R15 (REAL 2) each door's count is exactly the rows its own pop-out lists (DOCS Recent, DRIVES, ORPHANS, CIRCUITS, LOG), its head agrees, its hint names it, the Trash is left out
//         MUT-R15  the same reading with DRIVES one short of its list (today's "02 with three listed") turns R15's test red
//         R16 (REAL 2) a set of Tracks is ONE row in Recent, under its Doc's name, so her Drive's "1 doc" and Recent agree; her place reads her Drive's list (Docs + Circuits)
//         R17 (REAL 1) the pop-out's and Recent's scrollbar thumb is #5F8F95
//         R18 (NIT 1) the current row is a cyan edge with the 3 x 24 brass bar; the chosen swatch's ring is cyan
//         R19 (NIT 2) the list/boxes switch under the pins is text-low #7EB4C4
//         R20 (NIT 3) DOCS opens at its top
//         R21 (NIT 4) the two meter switches read apart: "Show the meter" and "Use the skin's meter"
//         R22 (NIT 5) an orphan row's two buttons show their names: File, Trash
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-flux-rail-live.mjs
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const rgbOf = (c) => { const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const lum = (c) => { const v = rgbOf(c); if (!v) return NaN; const [r, g, b] = v.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const DOOR = '&reorglift=flux.rail';
const EDGE = 'rgb(29, 74, 82)', ORANGE = 'rgb(255, 152, 0)', CYAN = 'rgb(0, 194, 255)', NODE = 'rgb(4, 20, 26)', NODE_EDGE = 'rgb(126, 180, 196)', LIME = 'rgb(183, 255, 60)';
const SIGNALS = [['#00C2FF', '01', 'Cyan'], ['#B7FF3C', '02', 'Lime'], ['#FF2E97', '03', 'Pink'], ['#E7F4F1', '04', 'Ice'], ['#7FA8A0', '05', 'Teal'], ['#3A8FA5', '06', 'Deep cyan']];
const GROUND = "const ground = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (c && !/rgba\\([^)]*,\\s*0\\)$/.test(c) && c !== 'transparent') return c; } return null; };";
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const DOORS = `(() => { const r = document.querySelector('[data-reorg-rail]'); if (!r) return null; const read = (b) => { const s = getComputedStyle(b), l = b.querySelector('.wz-strip-label'), ls = l ? getComputedStyle(l) : null, o = b.querySelector('.wz-strip-readout');
    return { cat: b.getAttribute('data-category'), word: (l ? l.textContent : b.textContent || '').trim().toUpperCase(), bg: s.backgroundColor, top: s.borderTopWidth + ' ' + s.borderTopColor, left: s.borderLeftWidth, leftColor: s.borderLeftColor, size: ls && ls.fontSize, tt: ls && ls.textTransform, reading: o ? o.textContent.trim() : null, hint: b.getAttribute('title') }; };
  return { doors: [...r.querySelectorAll('.wz-reorg-doors .wz-strip-item')].map(read), foot: [...r.querySelectorAll('.wz-strip-foot .wz-strip-item')].map(read) }; })()`;
const LIVE = "(() => { const read = (c) => { const b = document.querySelector(`.wz-strip [data-category='${c}']`); if (!b) return null; const o = b.querySelector('.wz-strip-readout'); return { reading: o ? o.textContent.trim() : null, hint: b.getAttribute('title') }; }; return { docs: read('page'), plan: read('plan'), journal: read('journal') }; })()";
const r2 = (x) => !!x && x.doors.length === 5 && [...x.doors, ...x.foot].every((d) => d.top === `1px ${EDGE}` && d.left === '2px' && d.size === '9px' && d.tt === 'uppercase');

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => { const W = window; const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const d = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, d.id);
    page('fl-1', 'Chapter One\\nThe rain had not stopped.', { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('fl-2', 'Chapter Two\\nThe river rose.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('fl-c', 'Plot circuit', { origin: 'project', projectId: mill.id, pageType: 'board', boxes: [{ id: 'k1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The mill floods' }] });
    page('fl-l', 'A loose page.', { origin: 'loose' });
    page('fl-j', 'A log page.', { origin: 'journal' });
    page('fl-t', 'A page in the Trash.', { origin: 'project', projectId: mill.id, orderIndex: 2 }); W.wrizoPatchEntry('fl-t', { deletedAt: '2026-04-02T00:00:00.000Z' });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(400);
}
async function open(app, search, { theme = 'flux', id = 'fl-1', w = 1366, h = 768 } = {}) {
  await app.emulateDpr(1, w, h);
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 }).catch(() => {});
  await app.evalJs(`window.wrizoTheme.set(${q(theme)}); null`);
  await app.evalJs(`history.replaceState(null, '', ${q(`/${search}#/page/${id}`)}); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.desk-frame-strip')", { label: `the page (${theme} ${search})`, timeout: 20000 }).catch(() => {});
  await sleep(1100);
}
const door = (cat) => `document.querySelector('[data-reorg-rail] [data-category="${cat}"]')?.click(); null`;

await withHarness(async (app) => {
  await seed(app);

  // ---- the gate, and the live rail (R3's oracle) ----
  await open(app, '?arbor2=0&flux3=1');
  const noSwitch = await app.evalJs("!!document.querySelector('[data-reorg-rail]')");
  const live = await app.evalJs(LIVE);
  await open(app, '?arbor2=0&reorg=1&flux3=1');
  const noDoor = await app.evalJs("!!document.querySelector('[data-reorg-rail]')");
  await open(app, `?arbor2=0&reorg=1&flux3=0${DOOR}`);
  const noRedesign = await app.evalJs("!!document.querySelector('[data-reorg-rail]')");
  await open(app, `?arbor2=0&reorg=1&flux3=1${DOOR}`);
  const on = await app.evalJs("!!document.querySelector('[data-reorg-rail]')");
  // SUPERSEDED (Nov 23, Fable 8:20 am, the Flux live join: all six Flux cells are on, Flux is on by default, and FLUX3 is on unless ?flux3=0). The original, verbatim:
  // ok('R0 the reorg\'s rail stands in Flux with the redesign, the switch and the door, and not without the door, the redesign or the switch', on && !noDoor && !noRedesign && !noSwitch, { on, noDoor, noRedesign, noSwitch });
  ok('R0 [successor] the reorg\'s rail stands in Flux with the redesign and the switch, with or without the door, and not with ?flux3=0 or without the switch', on && noDoor && !noRedesign && !noSwitch, { on, noDoor, noRedesign, noSwitch });

  // ---- the doors at rest ----
  await app.mouseMove(700, 400); await sleep(300);
  const d0 = await app.evalJs(DOORS);
  const words = (x) => [x.doors.map((d) => d.word), x.foot.map((d) => d.word)];
  ok('R1 the doors read DOCS · DRIVES · ORPHANS · CIRCUITS · LOG, and the foot SKIN · CONFIG', !!d0 && JSON.stringify(words(d0)) === JSON.stringify([['DOCS', 'DRIVES', 'ORPHANS', 'CIRCUITS', 'LOG'], ['SKIN', 'CONFIG']]), d0 && words(d0));
  ok('R2 every door is a command box: a 1 px #1D4A52 edge, a 2 px left edge, its name in 9 px capitals', r2(d0), d0 && [...d0.doors, ...d0.foot].map((x) => [x.word, x.top, x.left, x.size, x.tt]));
  const faced = d0 && d0.doors.length ? { ...d0, doors: d0.doors.map((x, i) => (i === 0 ? { ...x, top: '2px rgb(118, 118, 118)' } : x)) } : null;
  ok('MUT-R2 the same reading with the browser\'s own button face turns R2\'s test red', !!faced && !r2(faced), faced && faced.doors[0].top);
  const at = (c) => d0 && d0.doors.find((x) => x.cat === c);
  const r3pair = (a, b) => !!a && !!b && !!b.reading && a.reading === b.reading && !!b.hint && a.hint === b.hint;
  // SUPERSEDED (Nov 23, the frames on 5fa0119c: DOCS read 02 where DRIVES' own row says "1 doc", because a set of two Tracks is one Doc, and LOG read 02 where its row says "0 docs",
  // because those pages are Orphans: the live rail counts pages, so it is no oracle for the reorg's Docs). Successor R3-B, below. The original, verbatim:
  // ok('R3 DOCS, CIRCUITS and LOG carry the true reading and hover hint the live Flux rail shows for this same page', !!live && r3pair(at('reorg-docs'), live.docs) && r3pair(at('plan'), live.plan) && r3pair(at('journal'), live.journal), { live, reorg: d0 && ['reorg-docs', 'plan', 'journal'].map((c) => at(c) && { reading: at(c).reading, hint: at(c).hint }) });
  void r3pair;
  const whereRead = await app.evalJs("(() => { const b = document.querySelector('[data-reorg-rail] .wz-reorg-where-item'); if (!b) return null; const o = b.querySelector('.wz-strip-readout'); return { reading: o ? o.textContent.trim() : null, hint: b.getAttribute('title') }; })()");
  const where = await app.evalJs("(() => { const b = document.querySelector('[data-reorg-rail] .wz-reorg-where-item'); if (!b) return null; const n = b.querySelector('.wz-reorg-where-name'); return { left: getComputedStyle(b).borderLeftColor, name: n ? getComputedStyle(n).color : null }; })()");
  ok('R4 her place is orange: the where box\'s left edge and its name #FF9800', !!where && where.left === ORANGE && where.name === ORANGE, where);

  const plainBox = await app.evalJs("(() => { const b = document.querySelector('[data-reorg-rail] .wz-reorg-where-item .wz-reorg-box'); if (!b) return null; const s = getComputedStyle(b); return { bg: s.backgroundColor, edge: s.borderTopWidth + ' ' + s.borderTopColor, ink: s.webkitTextFillColor || s.color }; })()");
  ok('R13 a Drive box with no colour of its own is node dress: #04141A, a 1 px #7EB4C4 edge, letters #E7F4F1', !!plainBox && plainBox.bg === NODE && plainBox.edge === `1px ${NODE_EDGE}` && plainBox.ink === 'rgb(231, 244, 241)', plainBox);

  // ---- DRIVES open ----
  const page0 = await app.evalJs(PAGE);
  await app.evalJs(door('reorg-projects')); await sleep(700); await app.mouseMove(900, 400); await sleep(300);
  const d1 = await app.evalJs(DOORS);
  const o = d1 && d1.doors.find((x) => x.cat === 'reorg-projects');
  ok('R5 an opened door has the electric-blue left edge #00C2FF', !!o && o.leftColor === CYAN, o && o.leftColor);
  const panelRead = await app.evalJs(`(() => { ${GROUND} const p = document.querySelector('.wz-cascade-panel[data-category]'); if (!p) return null; const s = getComputedStyle(p), row = p.querySelector('.wz-reorg-row-open'); const rs = row ? getComputedStyle(row) : null;
    return { bg: s.backgroundColor, edge: s.borderTopWidth + ' ' + s.borderTopColor, rowBg: rs && rs.backgroundColor, rowBorder: rs && rs.borderTopWidth, ink: rs && rs.color, ground: row ? ground(row) : null }; })()`);
  const r6 = (x) => !!x && x.bg === NODE && x.edge === `1px ${NODE_EDGE}` && x.rowBg === 'rgba(0, 0, 0, 0)' && x.rowBorder === '0px' && !!x.ink && !!x.ground && contrast(x.ink, x.ground) >= 4.5;
  ok('R6 the opened DRIVES pop-out is in node dress (#04141A, a 1 px #7EB4C4 edge), its rows draw no button face, its words 4.5:1 or better', r6(panelRead), panelRead);
  const drivesCount = await app.evalJs("document.querySelector('.wz-cascade-panel [data-reorg-count]')?.textContent ?? null");
  const listCounts = await app.evalJs("(() => { const n = (s) => { const e = document.querySelector(s); return e ? Number(e.getAttribute('data-reorg-docs')) : null; }; return { docs: n(\".wz-reorg-row[aria-current='location'] [data-reorg-docs]\"), log: n(\".wz-reorg-row[data-notebook='true'] [data-reorg-docs]\") }; })()");
  const grey = panelRead ? { ...panelRead, bg: 'rgb(30, 38, 46)', edge: '1px rgb(58, 64, 71)' } : null;
  ok('MUT-R6 the same reading on Machina\'s grey panel turns R6\'s test red', !!grey && !r6(grey), grey);
  const EDGEREAD = "(() => { const p = document.querySelector('.wz-cascade-panel[data-category]'); const g = [...document.querySelectorAll('.wz-sliver-grip')].find((e) => e.getBoundingClientRect().width > 0); if (!p || !g) return { panel: !!p, grip: !!g }; const pr = p.getBoundingClientRect(), gr = g.getBoundingClientRect(); const hit = document.elementFromPoint(gr.left + gr.width / 2, gr.top + gr.height / 2); return { right: Math.round(pr.right * 10) / 10, width: Math.round(pr.width * 10) / 10, gripLeft: Math.round(gr.left * 10) / 10, hit: !!hit && (hit === g || g.contains(hit)) }; })()";
  const edge1366 = await app.evalJs(EDGEREAD);
  const page1 = await app.evalJs(PAGE);

  // ---- Box settings ----
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(400);
  const bs = await app.evalJs("(() => ({ swatches: [...document.querySelectorAll('.wz-reorg-swatches [data-swatch]')].map((b) => [String(b.getAttribute('data-swatch')).toUpperCase(), (b.textContent || '').trim(), b.getAttribute('title')]), own: (document.querySelector('.wz-reorg-own-colour')?.innerText || '').trim() }))()");
  const codes = await app.evalJs("[...document.querySelectorAll('.wz-reorg-swatches [data-swatch]')].map((b) => { const s = getComputedStyle(b); return [(b.textContent || '').trim(), s.backgroundColor, s.webkitTextFillColor || s.color]; })");
  ok('R14 each swatch\'s code holds 4.5:1 against that swatch\'s own colour', Array.isArray(codes) && codes.length === 6 && codes.every((c) => !!c[0] && contrast(c[2], c[1]) >= 4.5), (codes || []).map((c) => [...c, Math.round(contrast(c[2], c[1]) * 100) / 100]));
  await app.evalJs("document.querySelector('.wz-reorg-swatches [data-swatch=\"#B7FF3C\"]')?.click(); null"); await sleep(500);
  const boxes = await app.evalJs("[...document.querySelectorAll('[data-reorg-rail] .wz-reorg-box')].map((b) => { const s = getComputedStyle(b); return [s.backgroundColor, s.webkitTextFillColor || s.color]; })");
  const limeBox = (boxes || []).find((b) => b[0] === LIME);
  ok('R9 Box settings offers the six signals 01 to 06 (named on hover) beside Custom…; pressing 02 draws her box in lime, its letters 4.5:1 or better', !!bs && JSON.stringify(bs.swatches) === JSON.stringify(SIGNALS) && /^Custom/.test(bs.own) && !!limeBox && contrast(limeBox[1], limeBox[0]) >= 4.5, { bs, boxes });
  await app.evalJs(door('reorg-projects')); await sleep(600);
  const page2 = await app.evalJs(PAGE);
  ok('R7 the page\'s rect (column, paper, editor) is the same with a door open and closed', !!page0 && page0 === page1 && page1 === page2, [page0, page1, page2]);

  // ---- the Session and Recent in DOCS ----
  await app.evalJs(door('reorg-docs')); await sleep(700);
  const SESS = `(() => { ${GROUND} const s = document.querySelector('.wz-cascade-panel [data-reorg-group="session"]'); if (!s) return null; const f = s.querySelector('[data-session-fold]'), fs = f ? getComputedStyle(f) : null;
    const rows = [...s.querySelectorAll('[data-session-row]')].filter((r) => r.getBoundingClientRect().height > 0).map((r) => { const l = r.querySelector('.wz-reorg-default-label'); return l ? { ink: getComputedStyle(l).color, ground: ground(r) } : null; }).filter(Boolean);
    const g = s.querySelector('.wz-reorg-session-goal'), gs = g ? getComputedStyle(g) : null;
    const sort = [...document.querySelectorAll('.wz-cascade-panel .wz-reorg-recent-sort > button')].map((b) => { const c = getComputedStyle(b); return { pressed: b.getAttribute('aria-pressed'), bg: c.backgroundColor, border: c.borderTopWidth, line: c.textDecorationLine }; });
    return { foldBg: fs && fs.backgroundColor, foldBorder: fs && fs.borderTopWidth, open: f && f.getAttribute('aria-expanded'), rows, goal: gs && { edge: gs.borderTopColor, width: gs.borderTopWidth, ground: ground(g.parentElement) }, sort }; })()`;
  await app.evalJs("document.querySelector('.wz-cascade-panel [data-session-fold]')?.click(); null"); await sleep(400);
  const sess = await app.evalJs(SESS);
  const r10 = (x) => !!x && x.open === 'true' && x.foldBg === 'rgba(0, 0, 0, 0)' && x.foldBorder === '0px' && x.rows.length >= 2 && x.rows.every((r) => !!r.ink && !!r.ground && contrast(r.ink, r.ground) >= 4.5)
    && !!x.goal && x.goal.width === '1px' && !!x.goal.ground && contrast(x.goal.edge, x.goal.ground) >= 3
    && x.sort.length >= 2 && x.sort.every((b) => b.bg === 'rgba(0, 0, 0, 0)' && b.border === '0px') && x.sort.filter((b) => b.pressed === 'true').length === 1 && x.sort.filter((b) => b.pressed === 'true').every((b) => /underline/.test(b.line));
  ok('R10 in DOCS the Session\'s fold has no button face, its rows read 4.5:1, its Quota field has a 3:1 edge; Recent\'s sort is words, the chosen one underlined', r10(sess), sess);

  // ---- the two counts the pop-outs' heads state ----
  await app.evalJs(door('reorg-unfiled')); await sleep(700);
  const orphansCount = await app.evalJs("document.querySelector('.wz-cascade-panel [data-reorg-count]')?.textContent ?? null");
  const pad2 = (n) => String(n).padStart(2, '0');
  await app.evalJs("document.querySelector('[data-reorg-rail] .wz-reorg-where-item')?.click(); null"); await sleep(600);
  const nCircuits = await app.evalJs("document.querySelector('.wz-cascade-panel') ? document.querySelectorAll(\".wz-cascade-panel .wz-reorg-list-row[data-kind='board']\").length : null");
  const many = (n, w) => `${n} ${n === 1 ? w : `${w}s`}`;
  const r3b = (x, c) => !!c && Number.isInteger(c.docs) && Number.isInteger(c.log) && Number.isInteger(c.circuits) && !!x.docs && !!x.plan && !!x.log && !!x.place
    && x.docs.reading === pad2(c.docs) && x.docs.hint === `${many(c.docs, 'doc')} in this drive`
    && x.plan.reading === pad2(c.circuits) && x.plan.hint === `${many(c.circuits, 'circuit')} in this drive`
    && x.log.reading === pad2(c.log) && x.log.hint === `${many(c.log, 'doc')} in the Log`
    && x.place.reading === pad2(c.docs + c.circuits) && x.place.hint === (c.docs + c.circuits === 1 ? '1 doc or circuit in this drive' : `${c.docs + c.circuits} docs and circuits in this drive`);
  const truth = listCounts && { docs: listCounts.docs, log: listCounts.log, circuits: nCircuits };
  const shown = { docs: at('reorg-docs'), plan: at('plan'), log: at('journal'), place: whereRead };
  // SUPERSEDED (Nov 23, the Wrizors' pass 1 REAL 2, ruled by Fable: every count counts exactly what its list shows; DOCS lists every Doc anywhere, not "in this drive"). Successor R15, below. The original, verbatim:
  // ok('R3-B DOCS, CIRCUITS, LOG and her place carry the count the reorg\'s own lists state, with L2\'s hover hint', r3b(shown, truth), { truth, shown: Object.fromEntries(Object.entries(shown).map(([k, v]) => [k, v && [v.reading, v.hint]])) });
  void r3b; void shown; void truth;
  const pagesCounted = live ? { ...shown, docs: live.docs, log: live.journal } : null;
  // SUPERSEDED with R3-B, the original, verbatim:
  // ok('MUT-R3-B the same reading at the live rail\'s page counts turns R3-B\'s test red', !!pagesCounted && !r3b(pagesCounted, truth), pagesCounted && [pagesCounted.docs, pagesCounted.log]);
  void pagesCounted;
  const nD = Number(drivesCount), nO = Number(orphansCount), dr = at('reorg-projects'), or = at('reorg-unfiled');
  const driveHint = `${nD} ${nD === 1 ? 'drive' : 'drives'}`, orphanHint = nO === 1 ? '1 doc or circuit not filed in a drive' : `${nO} docs and circuits not filed in a drive`;
  ok('R12 DRIVES and ORPHANS carry their true count and hover hint', drivesCount !== null && orphansCount !== null && nD >= 2 && nO >= 1 && !!dr && !!or && dr.reading === pad2(nD) && dr.hint === driveHint && or.reading === pad2(nO) && or.hint === orphanHint, { drivesCount, orphansCount, dr: dr && [dr.reading, dr.hint], or: or && [or.reading, or.hint], driveHint, orphanHint });

  // ---- the Wrizors' pass 1: every count against its own list ----
  const LISTS = { 'reorg-docs': '.wz-reorg-recent-rows > li', 'reorg-projects': '.wz-reorg-row', 'reorg-unfiled': '.wz-reorg-unfiled-row', plan: '.wz-section-row', journal: '.wz-cascade-list-item' };
  const openDoor = async (cat) => {
    if (!(await app.evalJs(`!!document.querySelector('.wz-cascade-panel[data-visible="true"][data-category="${cat}"]:not([data-leaving="true"])')`))) await app.evalJs(door(cat));
    await sleep(700);
  };
  // DRIVER FIX (Nov 23, Actions 45122612667 on a6b3f6a9: every count equalled its list, but CIRCUITS listed the first Drive, because after a RELOAD LandingGate follows the page before
  // sign-in resolves, so the signed-in writer's place stays where it was; a shared store behaviour, reported, not this ticket's). Travel to another page and back, as a writer does, so the
  // place is her Drive and CIRCUITS has rows to count. No assertion changes.
  for (const id of ['fl-2', 'fl-1']) {
    await app.evalJs(`location.hash = '#/page/${id}'; null`);
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('[data-reorg-rail]')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
    await sleep(800);
  }
  const reads = {};
  for (const cat of Object.keys(LISTS)) {
    await openDoor(cat);
    reads[cat] = await app.evalJs(`(() => { const b = document.querySelector('[data-reorg-rail] [data-category="${cat}"]'), p = document.querySelector('.wz-cascade-panel[data-category="${cat}"]:not([data-leaving="true"])'); if (!b || !p) return null; const o = b.querySelector('.wz-strip-readout'), h = p.querySelector('[data-reorg-count]');
      const folded = ${cat === 'plan'} ? [...p.querySelectorAll('.wz-set-count')].reduce((s, e) => s + Number(e.textContent), 0) : 0;   // DRIVER FIX (Nov 23): CIRCUITS folds a set that is not the current one, so its head states the rows. No assertion changes.
      return { where: (p.querySelector('.wz-sections-place-name') || {}).textContent || null, n: folded || p.querySelectorAll(${q(LISTS[cat])}).length, head: h ? Number(h.textContent) : null, reading: o ? o.textContent.trim() : null, hint: b.getAttribute('title'), trash: /in the Trash/.test(p.innerText || '') }; })()`);
  }
  const hintFor = { 'reorg-docs': (n) => `${n} ${n === 1 ? 'doc' : 'docs'}`, 'reorg-projects': (n) => `${n} ${n === 1 ? 'drive' : 'drives'}`, 'reorg-unfiled': (n) => (n === 1 ? '1 doc or circuit not filed in a drive' : `${n} docs and circuits not filed in a drive`), plan: (n) => `${n} ${n === 1 ? 'circuit' : 'circuits'} in this drive`, journal: (n) => `${n} ${n === 1 ? 'doc' : 'docs'} in the Log` };
  const r15 = (x) => Object.keys(LISTS).every((c) => !!x[c] && x[c].n >= 1 && x[c].reading === pad2(x[c].n) && (x[c].head === null || x[c].head === x[c].n) && x[c].hint === hintFor[c](x[c].n) && !x[c].trash);
  ok('R15 each door\'s count is exactly the rows its own pop-out lists, its head agrees, its hint names it, the Trash is left out', r15(reads), reads);
  const short = reads['reorg-projects'] ? { ...reads, 'reorg-projects': { ...reads['reorg-projects'], reading: pad2(reads['reorg-projects'].n - 1) } } : null;
  ok('MUT-R15 the same reading with DRIVES one short of its list turns R15\'s test red', !!short && !r15(short), short && short['reorg-projects']);

  await openDoor('reorg-docs');
  const top = await app.evalJs("(() => { const p = document.querySelector('.wz-cascade-panel[data-category=\"reorg-docs\"]'); return p ? p.scrollTop : null; })()");
  ok('R20 DOCS opens at its top', top === 0, top);
  const bars = await app.evalJs("(() => { const p = document.querySelector('.wz-cascade-panel[data-category=\"reorg-docs\"]'), r = document.querySelector('.wz-reorg-recent-rows'); return p && r ? [getComputedStyle(p).scrollbarColor, getComputedStyle(r).scrollbarColor] : null; })()");
  ok('R17 the pop-out\'s and Recent\'s scrollbar thumb is #5F8F95', Array.isArray(bars) && bars.every((c) => /^rgb\(95, 143, 149\)/.test(c)), bars);
  const recent = await app.evalJs("[...document.querySelectorAll('.wz-reorg-recent-rows > li')].map((li) => ({ title: (li.querySelector('.wz-reorg-list-title')?.textContent || '').trim(), meta: (li.querySelector('.wz-reorg-row-meta')?.textContent || '').trim(), here: li.getAttribute('aria-current') }))");
  await app.evalJs("document.querySelector('.wz-cascade-panel [data-session-fold]')?.click(); null"); await sleep(350);
  const meters = await app.evalJs("(() => { const a = document.querySelector('[data-reorg-default=\"progress\"] .wz-reorg-default-label'), b = [...document.querySelectorAll('[data-session-row] .wz-reorg-default-label')].map((e) => e.textContent.trim()); return { doc: a ? a.textContent.trim() : null, session: b }; })()");
  ok('R21 the two meter switches read apart: "Show the meter" and "Use the skin\'s meter"', !!meters && meters.doc === 'Show the meter' && meters.session.includes("Use the skin's meter"), meters);
  await openDoor('reorg-unfiled');
  const named = await app.evalJs("(() => { const f = document.querySelector('[data-unfiled-file]'), t = document.querySelector('[data-unfiled-trash]'); return f && t ? [(f.innerText || '').trim(), (t.innerText || '').trim()] : null; })()");
  ok('R22 an orphan row\'s two buttons show their names: File, Trash', !!named && named[0] === 'File' && named[1] === 'Trash', named);
  await openDoor('reorg-projects');
  const mine = await app.evalJs("(() => { const r = document.querySelector('.wz-reorg-row[aria-current=\"location\"]'); if (!r) return null; const n = r.querySelector('.wz-reorg-row-name'), d = r.querySelector('[data-reorg-docs]'), s = getComputedStyle(r), b = getComputedStyle(r, '::before'); return { name: n ? n.textContent.trim() : null, docs: d ? Number(d.getAttribute('data-reorg-docs')) : null, edge: s.borderLeftColor, bar: b.content && b.content !== 'none' ? [b.width, b.height, b.backgroundColor] : null }; })()");
  const inRecent = (recent || []).filter((x) => mine && x.meta.startsWith(`${mine.name} `));
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(350);
  const ring = await app.evalJs("(() => { const s = document.querySelector('.wz-reorg-swatch[aria-checked=\"true\"]'); return s ? getComputedStyle(s).outlineColor : null; })()");
  ok('R18 the current row is a cyan edge with the 3 x 24 brass bar; the chosen swatch\'s ring is cyan', !!mine && mine.edge === CYAN && JSON.stringify(mine.bar) === JSON.stringify(['3px', '24px', ORANGE]) && ring === CYAN, { mine, ring });
  await app.evalJs("(() => { const b = [...document.querySelectorAll('[data-reorg-pin-toggle]')].find((x) => !x.closest('[aria-current=\"location\"]') && !x.closest('[data-notebook=\"true\"]')); b?.click(); return null; })()"); await sleep(400);
  const toggle = await app.evalJs("(() => { const b = document.querySelector('.wz-reorg-pin-view-btn[aria-pressed=\"false\"]'); return b ? getComputedStyle(b).color : null; })()");
  ok('R19 the list/boxes switch under the pins is text-low #7EB4C4', toggle === NODE_EDGE, toggle);
  await app.evalJs(door('reorg-list')); await sleep(100);
  await app.evalJs(door('reorg-projects')); await sleep(100);
  if (!(await app.evalJs("!!document.querySelector('.wz-cascade-panel[data-category=\"reorg-list\"]:not([data-leaving=\"true\"])')"))) { await app.evalJs("document.querySelector('[data-reorg-rail] .wz-reorg-where-item')?.click(); null"); }
  await sleep(700);
  const held = await app.evalJs("(() => { const p = document.querySelector('.wz-cascade-panel[data-category=\"reorg-list\"]'), w = document.querySelector('[data-reorg-rail] .wz-reorg-where-item .wz-strip-readout'); return p && w ? { docs: p.querySelectorAll('.wz-reorg-doc').length, boards: p.querySelectorAll(\".wz-reorg-list-row[data-kind='board']\").length, reading: w.textContent.trim() } : null; })()");
  ok('R16 a set of Tracks is one row in Recent under its Doc\'s name, her Drive\'s doc count and Recent agree, her place reads her Drive\'s Docs + Circuits',
    (recent || []).filter((x) => x.title === 'The Mill').length === 1 && !(recent || []).some((x) => /^Chapter (One|Two)$/.test(x.title)) && (recent || []).find((x) => x.title === 'The Mill')?.here === 'page' && !!mine && mine.docs === inRecent.length && !!held && held.reading === pad2(held.docs + held.boards), { recent, mine, inRecent: inRecent.length, held });

  // ---- 1920, Machina ----
  await open(app, `?arbor2=0&reorg=1&flux3=1${DOOR}`, { w: 1920, h: 1080 });
  await app.evalJs(door('reorg-projects')); await sleep(700); await app.mouseMove(1500, 500); await sleep(300);
  const edge1920 = await app.evalJs(EDGEREAD);
  ok('R8 at 1366 the open pop-out ends before the page\'s left opener and the opener takes a press; at 1920 it keeps its 300 px', !!edge1366 && edge1366.right <= edge1366.gripLeft + 0.5 && edge1366.hit === true && !!edge1920 && Math.abs(edge1920.width - 300) <= 1 && edge1920.right <= edge1920.gripLeft + 0.5, { edge1366, edge1920 });
  await open(app, '?reorg=1&arbor2=0', { theme: 'machina' });
  const dm = await app.evalJs(DOORS);
  await app.evalJs(door('reorg-projects')); await sleep(700);
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(400);
  const sm = await app.evalJs("[...document.querySelectorAll('.wz-reorg-swatches [data-swatch]')].map((b) => b.getAttribute('title'))");
  ok('R11 Machina\'s reorg rail is as it was: DOCS · PROJECTS · UNFILED, its five swatches', !!dm && JSON.stringify(dm.doors.map((x) => x.word)) === JSON.stringify(['DOCS', 'PROJECTS', 'UNFILED']) && JSON.stringify(sm) === JSON.stringify(['Pale', 'Grey', 'Blue', 'Brass', 'Orange']), { doors: dm && dm.doors.map((x) => x.word), sm });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1800)}`);
const EXPECTED = 25;   // R3-B and MUT-R3-B parked: + R15, MUT-R15, R16 to R22 (the Wrizors' pass 1, Nov 23). Was: const EXPECTED = 18;   // R3 parked: + R3-B, MUT-R3-B (Nov 23). Was: const EXPECTED = 17;   // R0 to R14, MUT-R2, MUT-R6
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nREORG-FLUX-RAIL-LIVE VERIFY: PASS (${checks.length} checks)` : `\nREORG-FLUX-RAIL-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
