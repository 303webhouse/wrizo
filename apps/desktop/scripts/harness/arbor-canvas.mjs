// ARBOR'S CANVAS (NICK RULED, Nov 14, 11:14 and 11:17 am: Arbor's Board becomes "Canvas" right after the redesign ships; Fable's order, Nov 18,
// 12:50 pm). The Wrizors' list, claude/wrizors/reorg-word-changes.md 4a and 4b: Arbor's noun Canvas · Canvases and 29 strings; Storyboard and
// Corkboard stay; the DEFAULT lists keep Board underneath (flag 4), so the data, search and Machina's own "Board" never change. The words ride the
// redesign's switch (on by default, off only under the test-only ?arbor2=0, today's Arbor). The lexicon seams (window.wrizoDeskLexicon,
// window.wrizoLexicon) read every cell; the rail and the boards pop-out read two of them ON SCREEN:
//   K1 the redesign (no query), Arbor: all 29 strings read the list's word and the noun reads Canvas / Canvases
//   K2 Storyboard and Corkboard stay (boardModeStoryboard, zoneCorkboard unchanged in Arbor)
//   K3 today's Arbor (?arbor2=0): all 29 read their Board wording (the list's "from"), the noun Board / Boards
//   K4 Flux and Machina read the same in both sessions (nothing of Arbor's reaches them): every one of the 29 keys and the board noun
//   K5 ON SCREEN under the redesign: the rail's Plan item reads "Canvases"; its pop-out's door reads "New Canvas"
//   K6 ON SCREEN under ?arbor2=0: "Boards" and "New Board"
//   M1 (mutant) K1's predicate run on today's Arbor's readings goes red; M2 K3's run on the redesign's goes red (each read is the other's mutant)
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
// key -> [Board wording (default), Canvas wording (Arbor under the redesign)]
const LIST = {
  walkReadoutPlan: ['Board', 'Canvas'], boardRenameLabel: ['Rename this board', 'Rename this canvas'], pageFacePortToBoard: ['Port to a Board…', 'Port to a Canvas…'],
  pageFacePin: ['Pin to a Board…', 'Pin to a Canvas…'], stripPlan: ['Boards', 'Canvases'], cascadePlanBoardsConnected: ['Boards grafted', 'Canvases grafted'],
  cascadePlanRelationOwn: ['its own plan board', 'its own plan canvas'], cascadeCardCopyTo: ['Copy to a board…', 'Copy to a canvas…'], cascadeCardCopyTitle: ['Copy to Board', 'Copy to Canvas'],
  cascadeCardCopyNote: ['A copy is a new card owned by the board it lands on. Its threads do not come with it, and edits do not follow.', 'A copy is a new card owned by the canvas it lands on. Its threads do not come with it, and edits do not follow.'],
  cascadeCardRemove: ['Remove from this board', 'Remove from this canvas'], cascadeCardOnlyBoard: ['its only board', 'its only canvas'], cascadeOpenBoard: ['Open the board', 'Open the canvas'],
  cascadePlanSectionBoards: ['Boards', 'Canvases'], cascadePlanLinkedHeading: ['Linked to this board', 'Linked to this canvas'], cascadePinDisplay: ['Display on Board', 'Display on Canvas'],
  cascadePinHide: ['Hide from the board', 'Hide from the canvas'], railBoard: ['Board', 'Canvas'], ctxDeleteBoard: ['Delete board', 'Delete canvas'], linksKindBoard: ['Board', 'Canvas'],
  graftSearch: ['Search cards, pages, boards…', 'Search cards, pages, canvases…'], graftGroupBoards: ['Boards', 'Canvases'], graftPlanBoard: ['Plan board', 'Plan canvas'],
  openPagesPlace: ['Place on this board', 'Place on this canvas'], sectionsNewBoard: ['New Board', 'New Canvas'], sectionsEmptyBoards: ['No boards here yet.', 'No canvases here yet.'],
  placesBoardsZoneLabel: ['Boards this page can join', 'Canvases this page can join'], placesBoardsEmpty: ['No boards yet.', 'No canvases yet.'],
  helpGrafts: ['Grafts join pages, cards and boards.', 'Grafts join pages, cards and canvases.'],
};
const KEYS = Object.keys(LIST);
const READ = `(() => { const d = window.wrizoDeskLexicon, l = window.wrizoLexicon; if (!d || !l) return null; const keys = ${J(KEYS)}; const out = {};
  for (const th of ['plateau', 'flux', 'machina']) out[th] = { words: Object.fromEntries(keys.map((k) => [k, d.t(k, th)])), one: l.t('board', th), many: l.tMany('board', th),
    story: d.t('boardModeStoryboard', th), cork: d.t('zoneCorkboard', th) };
  return { arbor: document.documentElement.getAttribute('data-arbor2'), search: location.search, ...out }; })()`;
const wordsAre = (r, i) => !!r && KEYS.every((k) => r.plateau.words[k] === LIST[k][i]);
const k1 = (r) => wordsAre(r, 1) && r.plateau.one === 'Canvas' && r.plateau.many === 'Canvases';
const k3 = (r) => wordsAre(r, 0) && r.plateau.one === 'Board' && r.plateau.many === 'Boards';
const wrong = (r, i) => (r ? KEYS.filter((k) => r.plateau.words[k] !== LIST[k][i]).map((k) => `${k}="${r.plateau.words[k]}"`) : ['no read']);
const hit = (sel) => `(() => { const e = document.querySelector(${J(sel)}); if (!e) return false; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); if (!r.width) return false; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === e || e.contains(h)); })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const session = async (query) => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs(`history.replaceState(null, '', '/' + ${J(query)} + '#/')`); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 25000 });
    await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function' && !!window.wrizoDeskLexicon && !!window.wrizoLexicon", { label: 'seams', timeout: 15000 });
    const read = await app.evalJs(READ);
    // on screen: a page, the rail's Plan item, and its pop-out's door
    const id = `arbor-cv-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: 'A page beside a canvas.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    const item = ".wz-strip-item[data-category='plan']";
    await waitSoft(app, `!!document.querySelector(${J(item)})`, { label: 'the rail', timeout: 15000 }); await sleep(800);
    const rail = await app.evalJs(`(() => { const e = document.querySelector(${J(item)}); return e ? (e.textContent || '').replace(/\\s+/g, ' ').trim() : null; })()`);
    let door = null, pressed = false;
    if (await waitSoft(app, hit(item), { label: 'the Plan item hit-testable', timeout: 6000 })) {
      const at = await app.evalJs(`(() => { const r = document.querySelector(${J(item)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
      await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y); pressed = true;
      await waitSoft(app, "!!document.querySelector('.wz-cascade-action-door')", { label: 'the pop-out door', timeout: 6000 }); await sleep(400);
      door = await app.evalJs("(() => { const e = document.querySelector('.wz-cascade-action-door'); return e ? (e.textContent || '').replace(/\\s+/g, ' ').trim() : null; })()");
    }
    return { read, rail, door, pressed };
  };
  const now = await session('');
  const old = await session('?arbor2=0');
  ok(`K1 the redesign: Arbor's 29 strings read Canvas (${wrong(now.read, 1).length} differ) and its noun ${now.read && now.read.plateau.one} / ${now.read && now.read.plateau.many}`, !!now.read && now.read.arbor === 'true' && k1(now.read), J({ wrong: wrong(now.read, 1), arbor: now.read && now.read.arbor }));
  ok(`K2 Storyboard and Corkboard stay in Arbor (${now.read && now.read.plateau.story}, ${now.read && now.read.plateau.cork})`, !!now.read && now.read.plateau.story === 'Storyboard' && now.read.plateau.cork === 'Corkboard', J(now.read && now.read.plateau));
  ok(`K3 today's Arbor (?arbor2=0): the 29 read their Board wording (${wrong(old.read, 0).length} differ) and the noun ${old.read && old.read.plateau.one} / ${old.read && old.read.plateau.many}`, !!old.read && old.read.arbor !== 'true' && k3(old.read), J({ wrong: wrong(old.read, 0) }));
  const same = (th) => !!now.read && !!old.read && J(now.read[th]) === J(old.read[th]);
  ok(`K4 Flux and Machina read the same in both sessions (flux ${same('flux')}, machina ${same('machina')}; nouns ${now.read && now.read.flux.one} / ${now.read && now.read.machina.one})`, same('flux') && same('machina') && now.read.flux.one !== 'Canvas' && now.read.machina.one !== 'Canvas', J({ flux: now.read && now.read.flux.one, machina: now.read && now.read.machina.one }));
  ok(`K5 ON SCREEN, the redesign: the rail's Plan item "${now.rail}", its pop-out's door "${now.door}"`, now.pressed && /\bCanvases\b/.test(now.rail || '') && !/\bBoards?\b/.test(now.rail || '') && now.door === 'New Canvas', J(now));
  ok(`K6 ON SCREEN, ?arbor2=0: the rail's Plan item "${old.rail}", its pop-out's door "${old.door}"`, old.pressed && /\bBoards\b/.test(old.rail || '') && old.door === 'New Board', J(old));
  ok(`M1 (mutant): K1's read on today's Arbor's words goes RED (${wrong(old.read, 1).length} of 29 differ)`, !!old.read && !k1(old.read) && wrong(old.read, 1).length === 29);
  ok(`M2 (mutant): K3's read on the redesign's words goes RED (${wrong(now.read, 0).length} of 29 differ)`, !!now.read && !k3(now.read) && wrong(now.read, 0).length === 29);
  return checks;
}, { label: 'arbor-canvas' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-CANVAS PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 8;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-CANVAS VERIFY: PASS (${checks.length} checks)` : `\nARBOR-CANVAS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
