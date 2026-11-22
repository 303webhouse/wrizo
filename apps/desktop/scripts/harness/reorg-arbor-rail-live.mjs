// ARBOR'S RAIL ON THE REORG (claude/wrizors/arbor-reorg-spec.md §2; Fable, Nov 21 6:00 pm; INK's theme gate, reorg/themeGate.ts plateau.rail).
// The reorg's rail in Arbor's live look: Arbor's places (PAGES, DRAWERS, SHELF, CANVASES, JOURNAL; THEMES, SETTINGS), each door in its own cloth
// by the rail-tab rule (Nick, Nov 8): hover slides 6 px out in the cloth, opened stays out 12 px with its pop-out edged 3 px in that cloth.
//
// The fixture (seams only): a Drawer "Fiction" holding a set "The Mill" with one Part ar-1; Arbor's redesign as it ships (WS_ARBOR2=default),
// the room pinned by day (?arbor2room=day, Arbor's test-only pin), 1366x768.
//
// GATE    A0  the reorg's rail stands in Arbor under ?reorg=1 with the preview door (&reorglift=plateau.rail: INK's gate keeps Arbor's cell off until
//             the Wrizors pass the frames), and not in the classic Plateau (?arbor2=0) nor without the switch
// DOORS   A1  the doors read, in order, PAGES · DRAWERS · SHELF · CANVASES · JOURNAL, and the foot THEMES · SETTINGS
// CLOTH   A2  each door wears its cloth: PAGES cold blue, DRAWERS olive, SHELF cold blue, CANVASES madder, JOURNAL olive; THEMES and SETTINGS none
// HOVER   A3  a pointer on PAGES slides it 6 px out in cold blue #7FA0BC, its words walnut #2B1D12 (4.5:1 or better on the cloth)
// OPEN    A4  DRAWERS opened stands 12 px out in olive #56632E with cream words (4.5:1 or better), and its pop-out is edged 3 px in olive
// PAGE    A5  the page's rect is the same with a rail door open and closed
// MACHINA A6  Machina's reorg rail is as it was: DOCS · PROJECTS · UNFILED, no cloth on any door
// DRESS   A7  (the first frames, Actions 44970675573: the DRAWERS pop-out drew as bare buttons) the opened DRAWERS pop-out's rows are dressed: a row's
//             open button draws no button chrome (no background, no border) in the page's chrome font, and its "+ New Drawer" is a full-width row
//         MUT-A7  the same reading with the browser's own button face (a border) turns A7's test red
// MUTANT  MUT-A2  the cloth reading with SHELF in olive turns A2's test red
// BOXES   A8  (spec §1, §2) Box settings offers Arbor's six cloths in order - Olive #56632E, Sea #17454E, Cold blue #7FA0BC, Madder #A8392F,
//             Honey #C9A46B, Iron #39414A, named so - and no brass, beside her own colour; pressing Sea draws her box in sea, its letters 4.5:1
//         MUT-A8  the reading with Machina's five (Pale, Grey, Blue, Brass, Orange) turns A8's test red
//         A9  Machina's Box settings is as it was: its five swatches, Pale, Grey, Blue, Brass, Orange
// EDGE    A10 (the Wrizors' NIT, arbor-reorg-pass-1.md §4: the open pop-out overlapped the page's left edge ~10 px and hid its left opener) at 1366 the
//             opened DRAWERS pop-out ends before the page's left opener (its right edge at or left of the opener's), and the opener takes a press at
//             its centre; at 1920, where there is room, the pop-out keeps its 300 px
//         MUT-A10  the 1366 reading with the pop-out 10 px past the opener turns A10's test red
// BOXES   A12 (the Wrizors via Fable, Nov 21 11:20 pm: the uncoloured box is NOT olive) before any colour is chosen every box in Arbor's rail and in
//             DRAWERS draws plain cream #EFE4CB with walnut letters #2B1D12, and Box settings shows no swatch as chosen
//         MUT-A12  the same reading with the boxes in olive turns A12's test red
//         A13 (the frames on 2fc46347, Actions 44993376128: by night at rest the rail's cream box drew no letters - the night dim letters a dimmed hook
//             in --text-hi cream) by night at rest the rail's box letters read 4.5:1 or better on the box AS DRAWN (a clip of the box: its median is the
//             box, its pixel farthest from that is the letters)
//         MUT-A13  the same reading with the letters at the box's own colour turns A13's test red
//         A14 (the Wrizors' pass 2, section 2 NIT 1: "NO LETTERS", "YOUR OWN COLOUR", "CHOOSE A PICTURE" in caps; spec section 0: Arbor's buttons are in
//             its sentence case) Box settings' buttons render as written - No letters, Your own colour, Choose a picture (innerText, which carries any
//             text-transform)
//         MUT-A14  the same reading in capitals turns A14's test red  [A14 parked Nov 22: Arbor's own-colour word is "Custom…" (INK's d574943d)]
// SESSION A15 (spec section 7: the session as PAGES' last item; POLISH's shared SessionGroup on train J) by day and by night, in the opened PAGES pop-out the
//             Session's fold is a full-width row with no button face (no background, no border) and its arrow (closed, open); opened, it shows its rows,
//             each label 4.5:1 or better on the pop-out's ground, and its goal field is dressed (a 1 px edge, the pop-out's ground, its words 4.5:1)
//         MUT-A15  the same reading with the browser's own button face on the fold turns A15's test red
// RECENT  A16 (the frames on 016bc20a: "Changed · Name · Words" drew as white browser buttons) by day and by night, in the opened PAGES pop-out the Recent
//             group's sort is words, not buttons - no button face - the chosen one marked (underlined), each 4.5:1 or better on the pop-out's ground
//         MUT-A16  the same reading with the browser's own button face turns A16's test red
//         A14-B  the three buttons are drawn exactly as their words are written (innerText = textContent), none in capitals; MUT-A14-B capitals fail
// ON      A11 (Fable, Nov 21 9:40 pm: the Wrizors passed the rail; plateau.rail ON) the reorg's rail stands in Arbor under ?reorg=1 with NO preview
//             door, and still not in the classic Plateau (?arbor2=0)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-arbor-rail-live.mjs
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rgbOf = (c) => { const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const lum = (c) => { const v = rgbOf(c); if (!v) return NaN; const [r, g, b] = v.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const OLIVE = 'rgb(86, 99, 46)', BLUE = 'rgb(127, 160, 188)', CREAM = 'rgb(239, 228, 203)', WALNUT = 'rgb(43, 29, 18)';
const tx = (m) => { const x = /matrix\(([^)]+)\)/.exec(m || ''); return x ? +x[1].split(',')[4] : 0; };

const DOORS = `(() => { const r = document.querySelector('[data-reorg-rail]'); if (!r) return null;
  const one = (b) => { const s = getComputedStyle(b); const l = b.querySelector('.wz-strip-label'); return { cat: b.getAttribute('data-category'), word: (l ? l.textContent : b.textContent || '').trim(), cloth: b.getAttribute('data-cloth'), pressed: b.getAttribute('aria-pressed'), tx: s.transform, bg: s.backgroundColor, ink: l ? getComputedStyle(l).color : s.color }; };
  return { doors: [...r.querySelectorAll('.wz-reorg-doors .wz-strip-item')].map(one), foot: [...r.querySelectorAll('.wz-strip-foot .wz-strip-item')].map(one) }; })()`;
const PANEL = "(() => { const p = document.querySelector('.wz-cascade-panel'); return p ? { cat: p.getAttribute('data-category'), shadow: getComputedStyle(p).boxShadow } : null; })()";
const PAGE = "(() => { const p = document.querySelector('.mode-page'); if (!p) return null; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); })()";
const RAIL = "!!document.querySelector('[data-reorg-rail]')";

async function visit(app, search, theme = 'plateau') {
  await app.evalJs(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); history.replaceState(null, '', '${search}#/page/ar-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.desk-frame-strip')", { label: `the Part (${theme} ${search})`, timeout: 20000 }).catch(() => {});
  await sleep(1200);
}
const a2 = (d) => !!d && JSON.stringify(d.doors.map((x) => x.cloth)) === JSON.stringify(['blue', 'olive', 'blue', 'madder', 'olive']) && d.foot.every((x) => !x.cloth);

// A8/A9: the Box settings' swatches, read from the opened DRAWERS (PROJECTS) pop-out; and the rail's boxes as drawn
const BOXSET = "(() => { const s = [...document.querySelectorAll('.wz-reorg-swatches [data-swatch]')]; return { swatches: s.map((b) => [String(b.getAttribute('data-swatch')).toUpperCase(), b.getAttribute('title')]), own: !!document.querySelector('[data-box-own-colour]') }; })()";
const BOXES = "[...document.querySelectorAll('[data-reorg-rail] .wz-reorg-box')].map((b) => [getComputedStyle(b).backgroundColor, getComputedStyle(b).color])";
const ARBOR_SIX = [['#56632E', 'Olive'], ['#17454E', 'Sea'], ['#7FA0BC', 'Cold blue'], ['#A8392F', 'Madder'], ['#C9A46B', 'Honey'], ['#39414A', 'Iron']];
const MACHINA_FIVE = ['Pale', 'Grey', 'Blue', 'Brass', 'Orange'];
await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }).catch(() => {});
  await app.evalJs(`(() => { const W = window; const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    W.wrizoCreateJournalPage({ id: 'ar-1', text: 'Chapter One\\nThe rain had not stopped.', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: mill.id, orderIndex: 0 });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(500);

  // ---- the gate ----
  await visit(app, '/?arbor2=0&reorg=1&reorglift=plateau.rail');
  const classic = await app.evalJs(RAIL);
  await visit(app, '/?arbor2room=day');
  const noSwitch = await app.evalJs(RAIL);
  await visit(app, '/?reorg=1&reorglift=plateau.rail&arbor2room=day');
  const on = await app.evalJs(RAIL);
  ok('A0 the reorg\'s rail stands in Arbor under ?reorg=1, and not in the classic Plateau nor without the switch', on === true && classic === false && noSwitch === false, { on, classic, noSwitch });

  const d0 = await app.evalJs(DOORS);
  const words = (d) => d ? [d.doors.map((x) => x.word.toUpperCase()), d.foot.map((x) => x.word.toUpperCase())] : null;
  ok('A1 the doors read PAGES · DRAWERS · SHELF · CANVASES · JOURNAL, and the foot THEMES · SETTINGS', JSON.stringify(words(d0)) === JSON.stringify([['PAGES', 'DRAWERS', 'SHELF', 'CANVASES', 'JOURNAL'], ['THEMES', 'SETTINGS']]), words(d0));
  ok('A2 each door wears its cloth (PAGES blue, DRAWERS olive, SHELF blue, CANVASES madder, JOURNAL olive; the foot none)', a2(d0), d0 && { doors: d0.doors.map((x) => [x.word, x.cloth]), foot: d0.foot.map((x) => [x.word, x.cloth]) });
  const shelfOlive = d0 ? { ...d0, doors: d0.doors.map((x, i) => (i === 2 ? { ...x, cloth: 'olive' } : x)) } : null;
  ok('MUT-A2 the cloth reading with SHELF in olive turns A2\'s test red', !!shelfOlive && shelfOlive.doors[2].cloth !== (d0 && d0.doors[2].cloth) && !a2(shelfOlive), shelfOlive && shelfOlive.doors.map((x) => x.cloth));

  // ---- hover ----
  const pages = await app.evalJs("(() => { const b = document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  if (pages) { await app.mouseMove(pages.x, pages.y); await sleep(450); }
  const d3 = await app.evalJs(DOORS);
  const p3 = d3 && d3.doors.find((x) => x.cat === 'reorg-docs');
  ok('A3 a pointer on PAGES slides it 6 px out in cold blue, its words walnut (4.5:1 or better on the cloth)', !!p3 && Math.abs(tx(p3.tx) - 6) <= 0.5 && p3.bg === BLUE && p3.ink === WALNUT && contrast(p3.ink, p3.bg) >= 4.5, p3);
  await app.mouseMove(700, 400); await sleep(400);

  // ---- open ----
  const page0 = await app.evalJs(PAGE);
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click(); null"); await sleep(700);
  await app.mouseMove(700, 400); await sleep(300);
  const d4 = await app.evalJs(DOORS);
  const p4 = d4 && d4.doors.find((x) => x.cat === 'reorg-projects');
  const panel = await app.evalJs(PANEL);
  const dress = await app.evalJs("(() => { const p = document.querySelector('.wz-cascade-panel'); if (!p) return null; const o = p.querySelector('.wz-reorg-row-open'); const n = p.querySelector('.wz-reorg-new'); if (!o || !n) return { open: !!o, add: !!n };\n" +
    "  const so = getComputedStyle(o), sn = getComputedStyle(n); return { openBg: so.backgroundColor, openBorder: so.borderTopWidth, openFont: so.fontFamily, addBorder: sn.borderTopWidth, addWide: Math.round(n.getBoundingClientRect().width) >= Math.round(p.getBoundingClientRect().width) - 8 }; })()");
  const page1 = await app.evalJs(PAGE);
  const a7 = (d) => !!d && d.openBg === 'rgba(0, 0, 0, 0)' && d.openBorder === '0px' && !!d.openFont && d.addBorder === '0px' && d.addWide === true;
  ok('A7 the opened DRAWERS pop-out is dressed: a row\'s open button draws no button chrome, and "+ New Drawer" is a full-width row', a7(dress), dress);
  const raw = dress ? { ...dress, openBorder: '2px' } : null;
  ok('MUT-A7 the reading with a browser button face (a border) turns A7\'s test red', !!raw && raw.openBorder !== dress.openBorder && !a7(raw), raw);
  ok('A4 DRAWERS opened stands 12 px out in olive with cream words (4.5:1 or better), and its pop-out is edged 3 px in olive',
    !!p4 && p4.pressed === 'true' && Math.abs(tx(p4.tx) - 12) <= 0.5 && p4.bg === OLIVE && p4.ink === CREAM && contrast(p4.ink, p4.bg) >= 4.5 && !!panel && panel.cat === 'reorg-projects' && /rgb\(86, 99, 46\) 0px 0px 0px 3px inset/.test(panel.shadow), { p4, panel });
  // ---- A10: the open pop-out against the page's left opener ----
  const EDGE = "(() => { const p = document.querySelector('.wz-cascade-panel[data-category]'); const g = [...document.querySelectorAll('.wz-sliver-grip')].find((e) => e.getBoundingClientRect().width > 0); if (!p || !g) return { panel: !!p, grip: !!g };\n" +
    "  const pr = p.getBoundingClientRect(), gr = g.getBoundingClientRect(); const cx = gr.left + gr.width / 2, cy = gr.top + gr.height / 2; const hit = document.elementFromPoint(cx, cy);\n" +
    "  return { right: Math.round(pr.right * 10) / 10, width: Math.round(pr.width * 10) / 10, gripLeft: Math.round(gr.left * 10) / 10, hit: !!hit && (hit === g || g.contains(hit)) }; })()";
  const edge1366 = await app.evalJs(EDGE);
  // ---- A12: the uncoloured box (nothing chosen yet in this run) ----
  const plain = await app.evalJs("[...document.querySelectorAll('[data-reorg-rail] .wz-reorg-box:not([data-box-picture]), .wz-cascade-panel .wz-reorg-box:not([data-box-picture])')].map((b) => [getComputedStyle(b).backgroundColor, getComputedStyle(b).color])");
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(400);
  const chosen0 = await app.evalJs("document.querySelectorAll('.wz-reorg-swatches [data-swatch][aria-checked=\"true\"]').length");
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(300);
  const a12 = (boxes, chosen) => Array.isArray(boxes) && boxes.length >= 2 && boxes.every((b) => b[0] === 'rgb(239, 228, 203)' && b[1] === 'rgb(43, 29, 18)') && chosen === 0;
  ok('A12 before any colour is chosen every box draws plain cream #EFE4CB with walnut letters, and Box settings shows no swatch chosen', a12(plain, chosen0), { plain, chosen0 });
  const olive = Array.isArray(plain) ? plain.map(() => ['rgb(86, 99, 46)', 'rgb(255, 255, 255)']) : null;
  ok('MUT-A12 the same reading with the boxes in olive turns A12\'s test red', !!olive && olive.length >= 2 && a12(plain, chosen0) !== a12(olive, chosen0) && !a12(olive, chosen0), olive);
  // ---- A8: Box settings, in the opened DRAWERS pop-out ----
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(400);
  const bs = await app.evalJs(BOXSET);
  const chips = await app.evalJs("[...document.querySelectorAll('.wz-reorg-box-settings .wz-reorg-chip, .wz-reorg-chip')].filter((c, i, a) => a.indexOf(c) === i).map((c) => (c.innerText || '').trim()).filter(Boolean)");
  // SUPERSEDED (train I5, pair 45004086246 on 32f24f66: A14 read ["No letters","Custom…","Choose a picture"] - INK's d574943d, Arbor's words with the
  // Wrizors' answers applied (Fable, Nov 21 6:54 pm), made Arbor's reorgOwnColour "Custom…", and A14 had the canonical word hard-coded; its sense, the
  // buttons drawn as written with no capitals, holds). The original, verbatim:
  // const a14 = (list) => Array.isArray(list) && ['No letters', 'Your own colour', 'Choose a picture'].every((w) => list.includes(w)) && list.every((w) => w !== w.toUpperCase() || !/[A-Z]/.test(w));
  // ok('A14 Box settings\' buttons read in sentence case: No letters, Your own colour, Choose a picture', a14(chips), chips);
  // const caps = Array.isArray(chips) ? chips.map((w) => w.toUpperCase()) : null;
  // ok('MUT-A14 the same reading in capitals turns A14\'s test red', !!caps && caps.length > 0 && !a14(caps), caps);
  // SUCCESSOR: the three buttons (No letters, her own colour, Choose a picture, by their markers) render exactly as their words are written - innerText
  // (which carries any text-transform) equals textContent - and none is in capitals, whatever words the lexicon gives them
  const chips2 = await app.evalJs("[['letters', '[data-box-no-letters]'], ['own', '.wz-reorg-own-colour'], ['picture', '[data-box-choose-picture]']].map(([k, s]) => { const c = document.querySelector(s); return c ? [k, (c.innerText || '').trim(), (c.textContent || '').trim()] : [k, null, null]; })");
  const a14b = (list) => Array.isArray(list) && list.length === 3 && list.every(([, shown, written]) => !!shown && shown === written && /[a-z]/.test(shown));
  ok('A14-B Box settings\' buttons are drawn as their words are written (no capitals): No letters, her own colour, Choose a picture', a14b(chips2), chips2);
  const caps2 = Array.isArray(chips2) ? chips2.map(([k, s, w]) => [k, s && s.toUpperCase(), w]) : null;
  ok('MUT-A14-B the same reading drawn in capitals turns A14-B\'s test red', !!caps2 && a14b(chips2) !== a14b(caps2) && !a14b(caps2), caps2);
  await app.evalJs("document.querySelector('.wz-reorg-swatches [data-swatch=\"#17454E\"]')?.click(); null"); await sleep(500);
  const drawn = await app.evalJs(BOXES);
  const seaBox = (drawn || []).find((b) => b[0] === 'rgb(23, 69, 78)');
  const a8 = (r) => !!r && JSON.stringify(r.swatches) === JSON.stringify(ARBOR_SIX) && !r.swatches.some((s) => /brass|orange/i.test(String(s[1]))) && r.own === true;
  ok('A8 Box settings offers Arbor\'s six cloths in order, Olive, Sea, Cold blue, Madder, Honey, Iron (no brass), beside her own colour; pressing Sea draws her box in sea, its letters 4.5:1',
    a8(bs) && !!seaBox && contrast(seaBox[1], seaBox[0]) >= 4.5, { bs, drawn });
  const five = bs ? { ...bs, swatches: MACHINA_FIVE.map((n, i) => [['#C9CED3', '#6A727B', '#41658A', '#B9A03A', '#FF9800'][i], n]) } : null;
  ok('MUT-A8 the reading with Machina\'s five (Pale, Grey, Blue, Brass, Orange) turns A8\'s test red', !!five && a8(bs) !== a8(five) && !a8(five), five && five.swatches);
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click(); null"); await sleep(700);
  const page2 = await app.evalJs(PAGE);
  ok('A5 the page\'s rect is the same with a rail door open and closed', !!page0 && page0 === page1 && page1 === page2, [page0, page1, page2]);

  // ---- Machina is untouched ----
  await visit(app, '/?reorg=1&arbor2=0', 'machina');
  const dm = await app.evalJs(DOORS);
  ok('A6 Machina\'s reorg rail is as it was: DOCS · PROJECTS · UNFILED, no cloth on any door', !!dm && JSON.stringify(dm.doors.map((x) => x.word.toUpperCase())) === JSON.stringify(['DOCS', 'PROJECTS', 'UNFILED']) && dm.doors.every((x) => !x.cloth), dm && dm.doors.map((x) => [x.word, x.cloth]));
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click(); null"); await sleep(700);
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(400);
  const bm = await app.evalJs(BOXSET);
  // ---- A10 at 1920, A11 the cell on (no door) ----
  await app.emulateDpr(1, 1920, 1080);
  await visit(app, '/?reorg=1&reorglift=plateau.rail&arbor2room=day');
  await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click(); null"); await sleep(700); await app.mouseMove(1500, 500); await sleep(300);
  const edge1920 = await app.evalJs(EDGE);
  await app.emulateDpr(1, 1366, 768);
  const a10 = (a, b) => !!a && !!b && a.right !== undefined && a.right <= a.gripLeft + 0.5 && a.hit === true && b.right !== undefined && Math.abs(b.width - 300) <= 1 && b.right <= b.gripLeft + 0.5;
  ok('A10 at 1366 the opened DRAWERS pop-out ends before the page\'s left opener and the opener takes a press; at 1920 it keeps its 300 px', a10(edge1366, edge1920), { edge1366, edge1920 });
  const over = edge1366 && edge1366.gripLeft !== undefined ? { ...edge1366, right: edge1366.gripLeft + 10, hit: false } : null;
  ok('MUT-A10 the 1366 reading with the pop-out 10 px past the opener turns A10\'s test red', !!over && a10(edge1366, edge1920) !== a10(over, edge1920) && !a10(over, edge1920), over);
  await visit(app, '/?reorg=1&arbor2room=day');
  const noDoor = await app.evalJs("!!document.querySelector('[data-reorg-rail]')");
  await visit(app, '/?reorg=1&arbor2=0');
  const classicOn = await app.evalJs("!!document.querySelector('[data-reorg-rail]')");
  ok('A11 the reorg\'s rail stands in Arbor under ?reorg=1 with no preview door (plateau.rail on), and still not in the classic Plateau', noDoor === true && classicOn === false, { noDoor, classicOn });
  // ---- A13: the box's letters by night at rest, as drawn ----
  // FIXTURE (Nov 21, Actions 44994221975 on 4cffd432: A13 read Fiction's box, which A8 set to Sea earlier in this run): a fresh Drawer "Notes" holding
  // "Notebook two" with one page, ar-n, made through the seams; its box was never coloured. No assertion changes.
  await app.evalJs(`(() => { const W = window; if ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).some((e) => e.id === 'ar-n')) return true;
    const d = W.wrizoCreateDrawer('Notes'); const p = W.wrizoCreateProject('Notebook two'); W.wrizoSetProjectDrawer(p.id, d.id);
    W.wrizoCreateJournalPage({ id: 'ar-n', text: 'Notes\\nA plain page.', createdAt: '2026-04-02T00:00:00.000Z', source: 'page', origin: 'project', projectId: p.id, orderIndex: 0 });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(400);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau'); history.replaceState(null, '', '/?reorg=1&arbor2room=night#/page/ar-n'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('[data-reorg-rail] .wz-reorg-box')", { label: 'the Notes page by night', timeout: 20000 }).catch(() => {});
  await sleep(1200);
  await app.mouseMove(700, 400); await sleep(600);
  const boxClip = await app.evalJs("(() => { const b = document.querySelector('[data-reorg-rail] .wz-reorg-box:not([data-box-picture])'); if (!b) return null; const r = b.getBoundingClientRect(); return r.width > 8 ? { x: Math.round(r.left) + 2, y: Math.round(r.top) + 2, w: Math.round(r.width) - 4, h: Math.round(r.height) - 4 } : null; })()");
  let drawnBox = null;
  if (boxClip) {
    const data = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: boxClip.x, y: boxClip.y, width: boxClip.w, height: boxClip.h, scale: 1 } })).data;
    drawnBox = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data;
      const px = []; for (let i = 0; i < D.length; i += 4) px.push([D[i], D[i + 1], D[i + 2]]); const L = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]; px.sort((p, q) => L(p) - L(q)); return { med: px[px.length >> 1], dark: px[0], light: px[px.length - 1] }; })()`);
  }
  const rgbS = (p) => (Array.isArray(p) ? `rgb(${p.join(', ')})` : null);
  const a13 = (d) => { if (!d || !d.med) return false; const bg = rgbS(d.med); return Math.max(contrast(rgbS(d.dark), bg), contrast(rgbS(d.light), bg)) >= 4.5; };
  ok('A13 by night at rest the rail\'s box letters read 4.5:1 or better on the box as drawn', a13(drawnBox), drawnBox && { box: rgbS(drawnBox.med), dark: rgbS(drawnBox.dark), light: rgbS(drawnBox.light), ratio: +Math.max(contrast(rgbS(drawnBox.dark), rgbS(drawnBox.med)), contrast(rgbS(drawnBox.light), rgbS(drawnBox.med))).toFixed(2) });
  const blank = drawnBox && drawnBox.med ? { med: drawnBox.med, dark: drawnBox.med, light: drawnBox.med } : null;
  ok('MUT-A13 the same reading with the letters at the box\'s own colour turns A13\'s test red', !!blank && !a13(blank), blank);
  // ---- A15: the Session in Arbor's PAGES, by day and by night ----
  const SESS = `(() => { const s = document.querySelector('.wz-cascade-panel [data-reorg-group="session"]'); if (!s) return null; const p = s.closest('.wz-cascade-panel'); const f = s.querySelector('[data-session-fold]');
    const ground = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (c && !/rgba\\([^)]*,\\s*0\\)$/.test(c) && c !== 'transparent') return c; } return null; };
    const fs = f ? getComputedStyle(f) : null; const after = f ? getComputedStyle(f, '::after').content : null;
    const rows = [...s.querySelectorAll('[data-session-row]')].filter((r) => r.getBoundingClientRect().height > 0).map((r) => { const l = r.querySelector('.wz-reorg-default-label'); return { row: r.getAttribute('data-session-row'), ink: l ? getComputedStyle(l).color : null, ground: ground(r) }; });
    const g = s.querySelector('.wz-reorg-session-goal'); const gs = g ? getComputedStyle(g) : null;
    return { open: f ? f.getAttribute('aria-expanded') : null, foldBg: fs && fs.backgroundColor, foldBorder: fs && fs.borderTopWidth, foldWide: !!f && !!p && Math.round(f.getBoundingClientRect().width) >= Math.round(p.getBoundingClientRect().width) - 30, after,
      rows, goal: gs ? { edgeW: gs.borderTopWidth, edgeStyle: gs.borderTopStyle, bg: gs.backgroundColor, ink: gs.color, ground: ground(g.parentElement) } : null }; })()`;
  const sess = {};
  const sortR = {};
  for (const room of ['day', 'night']) {
    await visit(app, `/?reorg=1&arbor2room=${room}`);
    await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]')?.click(); null"); await sleep(700);
    await app.waitFor("!!document.querySelector('.wz-cascade-panel [data-reorg-group=\"session\"]')", { label: `the Session in PAGES (${room})`, timeout: 6000 }).catch(() => {});
    const closed = await app.evalJs(SESS);
    sortR[room] = await app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-cascade-panel .wz-reorg-recent-sort > button')]; if (!b.length) return null;
      const ground = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (c && !/rgba\\([^)]*,\\s*0\\)$/.test(c) && c !== 'transparent') return c; } return null; };
      return b.map((x) => { const s = getComputedStyle(x); return { word: (x.textContent || '').trim(), pressed: x.getAttribute('aria-pressed'), bg: s.backgroundColor, border: s.borderTopWidth, ink: s.color, line: s.textDecorationLine, ground: ground(x.parentElement) }; }); })()`);
    await app.evalJs("document.querySelector('.wz-cascade-panel [data-session-fold]')?.click(); null"); await sleep(400);
    const opened = await app.evalJs(SESS);
    sess[room] = { closed, opened };
    await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-docs\"]')?.click(); null"); await sleep(500);
  }
  const bareFold = (r) => !!r && r.foldBg === 'rgba(0, 0, 0, 0)' && r.foldBorder === '0px' && r.foldWide === true;
  const goalOk = (gl) => !!gl && gl.edgeW === '1px' && gl.edgeStyle === 'solid' && (gl.bg === 'rgba(0, 0, 0, 0)' || gl.bg === gl.ground) && !!gl.ground && contrast(gl.ink, gl.ground) >= 4.5;
  const a15room = (x) => !!x && !!x.closed && !!x.opened && x.closed.open === 'false' && x.opened.open === 'true' && bareFold(x.closed) && bareFold(x.opened) && /\u25B8/.test(x.closed.after || '') && /\u25BE/.test(x.opened.after || '')
    && x.opened.rows.length >= 2 && x.opened.rows.every((r) => !!r.ink && !!r.ground && contrast(r.ink, r.ground) >= 4.5) && goalOk(x.opened.goal);
  ok('A15 by day and by night the Session in PAGES: a full-width fold with no button face and its arrow; opened, its rows read 4.5:1 and its goal field is dressed', a15room(sess.day) && a15room(sess.night), sess);
  const faced = sess.day && sess.day.closed ? { ...sess.day, closed: { ...sess.day.closed, foldBg: 'rgb(239, 239, 239)', foldBorder: '2px' } } : null;
  ok('MUT-A15 the same reading with the browser\'s own button face on the fold turns A15\'s test red', !!faced && !a15room(faced), faced && faced.closed);
  const a16room = (list) => Array.isArray(list) && list.length >= 2 && list.every((x) => x.bg === 'rgba(0, 0, 0, 0)' && x.border === '0px' && !!x.ground && contrast(x.ink, x.ground) >= 4.5)
    && list.filter((x) => x.pressed === 'true').length === 1 && list.filter((x) => x.pressed === 'true').every((x) => /underline/.test(x.line || ''));
  ok('A16 by day and by night the Recent group\'s sort is words, not buttons (no button face), the chosen one underlined, each 4.5:1 on the pop-out', a16room(sortR.day) && a16room(sortR.night), sortR);
  const facedSort = Array.isArray(sortR.day) ? sortR.day.map((x) => ({ ...x, bg: 'rgb(255, 255, 255)', border: '2px' })) : null;
  ok('MUT-A16 the same reading with the browser\'s own button face turns A16\'s test red', !!facedSort && !a16room(facedSort), facedSort);
  ok('A9 Machina\'s Box settings is as it was: its five swatches, Pale, Grey, Blue, Brass, Orange', !!bm && JSON.stringify(bm.swatches.map((s) => s[1])) === JSON.stringify(MACHINA_FIVE), bm);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 26;   // + A16, MUT-A16 (the Recent group's sort in Arbor's PAGES, Nov 22). Was: const EXPECTED = 24;   // + A15, MUT-A15 (the Session in Arbor's PAGES, Nov 22). Was: const EXPECTED = 22;   // + A14, MUT-A14 (Box settings in sentence case, Nov 22). Was: const EXPECTED = 20;   // + A13, MUT-A13 (the box's letters by night, Nov 21). Was: const EXPECTED = 18;   // + A12, MUT-A12 (the uncoloured box, cream; Nov 21). Was: const EXPECTED = 16;   // 8 + A7, MUT-A7 (the pop-out's dress, Nov 21) + A8, MUT-A8, A9 (Arbor's box swatches, Nov 21) + A10, MUT-A10, A11 (the edge NIT; the cell on)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ARBOR-RAIL-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ARBOR-RAIL-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
