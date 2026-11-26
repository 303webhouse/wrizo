// THE WALK AND THE DRAWING TOOLS, TRIED TOGETHER (PRESETS-B, Nov 26; Fable 12:20 pm). A page in BUILD with a Plan; she draws, walks the Plan over her drawing, draws on the same Plan board, and walks again with that Board
// beside her page. Real keys and a real pen where the keys or the pen are what is under test. The live defaults, in Machina, Arbor and Flux. Page side: visual-ink/page.js, page-1a3.js, guide-walk/page.js. Browserless:
// reorg-guide-walk-unit.mjs.
//   G1  the walk opens over a page with a drawing, the caret in her note, the page's rect unmoved, the app behind inert
//   G2  with the pen down behind it, what she types goes into her note and nowhere else
//   G3  a pen laid where the drawing sheet is draws nothing while the walk is over it
//   G4  after Escape, with the pen still down: her next keys land where SHE left the caret (VISUAL's typing rule), not at the end
//   G5  the way-back chip lies over none of the page's controls, the INK tab open
//   G6  "Draw on a Board" opens the very board she walks; a stroke there leaves every card byte for byte
//   G7  Back: the Board stands beside the page with her drawing; the chip is pressable and clear
//   G8  a walk over that split: her note and its bold are saved, the drawing kept
//   G9  and the Board beside the page draws the bold, still painted
//   G10 Skip keeps the drawing; on the Board's canvas the card draws its bold
//   G11 drawing again there keeps every card byte for byte (note, marks, skip)
//   G12 a reload keeps both
// Run: node scripts/harness/reorg-guide-walk-live.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
// the live defaults, asked for before the driver reads them
process.env.WS_REORG = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_FLUX3 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const PAGES = ['./visual-ink/page.js', './visual-ink/page-1a3.js', './guide-walk/page.js'].map((f) => fs.readFileSync(new URL(f, import.meta.url), 'utf8'));
const WORDS = 'The train was late and the coat stayed on the seat.';
const checks = [];
const J = (v) => JSON.stringify(v);
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);

const inject = async (app) => { for (const p of PAGES) await app.evalJs(p); };
const boot = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1536, 864);
  await inject(app);
};

async function walkAndInk(app, theme) {
  const tag = ` [${theme}]`;
  await boot(app);
  const s = await run(app, `return await window.__gw.setup(${J(theme)}, ${J(WORDS)});`);
  const id = J(s.id), board = J(s.board);
  const read = (js) => run(app, `return ${js};`);

  // ---- she draws; then back to her words, her caret left after "The ", and the pen taken up again ----
  // (a real stroke on the paper moves her caret to the end by itself, walk or no walk: VISUAL's, reported to Fable on Nov 26. The caret is placed AFTER the stroke so that G4 measures the walk and nothing else.)
  await run(app, 'await window.__vi.sleep(900); await window.__vi3.inkOnPaper();');
  await app.penStroke('.wz-ink-sheet', [{ x: 0.2, y: 0.45 }, { x: 0.45, y: 0.48 }, { x: 0.7, y: 0.45 }]);
  await sleep(900);
  await run(app, "await window.__vi3.tab('text'); await window.__vi.sleep(600); window.__vi3.caretAt(4); await window.__vi.sleep(300); await window.__vi3.inkOnPaper();");
  const before = await read(`({ walk: window.__gw.walk(), strokes: window.__gw.strokes(${id}) })`);
  const opened = await read('await window.__gw.openWalk()');
  const over = await read('window.__gw.walk()');
  ok('G1: the walk opens over the page with her drawing - the caret in her note, the page unmoved, the app behind inert' + tag,
    before.strokes === 1 && opened && over.open && over.inField && over.inert && J(over.page) === J(before.walk.page), { before, over });

  await app.typeKeys('one two');
  await sleep(900);
  const typed = await read(`({ note: window.__gw.card(${board}, 'gw-a').text, words: window.__gw.words(${id}), strokes: window.__gw.strokes(${id}), walk: window.__gw.walk() })`);
  ok('G2: with the pen down behind the walk, what she types goes into her note and nowhere else' + tag,
    typed.note === 'Opening\none two' && typed.words === WORDS && typed.strokes === 1 && typed.walk.open && typed.walk.inField, typed);

  const covered = await read('window.__gw.underCard(0.4, 0.5)');
  await app.penStroke('.wz-ink-sheet', [{ x: 0.3, y: 0.5 }, { x: 0.4, y: 0.55 }, { x: 0.5, y: 0.5 }]);
  await sleep(900);
  const penned = await read(`({ strokes: window.__gw.strokes(${id}), note: window.__gw.card(${board}, 'gw-a').text })`);
  ok('G3: a pen laid where the drawing sheet is draws nothing while the walk is over it' + tag, covered === true && penned.strokes === 1 && penned.note === 'Opening\none two', { covered, penned });

  await app.key('Escape');
  await sleep(1200);
  const left = await read('window.__gw.walk()');
  await app.typeKeys('big ');
  await sleep(2800);
  const landed = await read(`({ words: window.__gw.words(${id}), strokes: window.__gw.strokes(${id}), paper: window.__vi3.paper(), note: window.__gw.card(${board}, 'gw-a').text })`);
  ok('G4: after Escape with the pen still down, her next keys land where she left her caret, the pen goes down, and no word is lost' + tag,
    !left.open && !left.inert && !!left.chip && landed.words === 'The big train was late and the coat stayed on the seat.' && landed.strokes === 1 && landed.paper !== 'ink' && landed.note === 'Opening\none two', { left, landed });

  await run(app, "await window.__vi.openDrawer(); await window.__vi3.tab('ink'); await window.__vi.sleep(900);");
  const clear = await read('window.__gw.chipClear()');
  ok('G5: the way-back chip lies over none of the page\'s controls with the INK tab open, and can be pressed' + tag, clear.chip && clear.pressable && clear.over.length === 0, clear);

  // ---- the same board, by the drawing door ----
  const cards0 = await read(`window.__gw.cards(${board})`);
  const door = await read('await window.__vi3.throughTheDoor()');
  await run(app, "await window.__vi3.until(() => !!document.querySelector('.wz-board-ink-sheet')); await window.__vi.sleep(900);");
  await app.penStroke('.wz-board-ink-sheet', [{ x: 0.45, y: 0.08 }, { x: 0.55, y: 0.12 }, { x: 0.65, y: 0.08 }]);
  await sleep(900);
  const drawn = await read(`({ strokes: window.__gw.strokes(${board}), same: window.__gw.cards(${board}) === ${J(cards0)} })`);
  ok('G6: "Draw on a Board" opens the very board she walks, and a stroke there leaves every card byte for byte' + tag, door === s.board && drawn.strokes === 1 && drawn.same, { door, board: s.board, drawn });

  await run(app, 'await window.__vi3.back(); await window.__vi.sleep(900);');
  const beside = await read(`({ split: window.__vi3.beside(${board}), chip: window.__gw.chipClear() })`);
  ok('G7: Back - the Board stands beside her page with her drawing, and the chip is still clear and pressable' + tag,
    beside.split.split && beside.split.painted > 20 && beside.chip.chip && beside.chip.pressable && beside.chip.over.length === 0, beside);

  // ---- walking with the Board beside the page ----
  await app.evalJs("document.querySelector('[data-walk-chip]')?.click()");
  await sleep(900);
  await app.evalJs("document.querySelector('[data-walk-row=\"gw-b\"]')?.click()");
  await sleep(700);
  await app.typeKeys('the turn');
  await sleep(600);
  await read('window.__gw.selectNote(3)');
  await app.keyCombo('b');
  await sleep(900);
  const marked = await read(`({ card: window.__gw.card(${board}, 'gw-b'), strokes: window.__gw.strokes(${board}), words: window.__gw.words(${id}), walk: window.__gw.walk() })`);
  ok('G8: a walk over the split saves her note and its bold, and keeps the drawing' + tag,
    !!marked.card && marked.card.text === 'Midpoint\nthe turn' && J(marked.card.textMarks) === J([{ start: 9, end: 12, b: true }]) && marked.strokes === 1 && marked.walk.open, marked);
  const splitShows = await read(`({ bold: [...document.querySelectorAll('.wz-split-asset [data-split-box="gw-b"] strong, .wz-split-asset [data-split-box="gw-b"] b')].map((b) => b.textContent), painted: window.__vi3.beside(${board}).painted })`);
  ok('G9: and the Board beside the page draws that bold, its drawing still painted' + tag, J(splitShows.bold) === J(['the']) && splitShows.painted > 20, splitShows);

  await app.evalJs("document.querySelector('[data-walk-row=\"gw-c\"]')?.click()");
  await sleep(700);
  await app.evalJs("document.querySelector('[data-walk-next]')?.click()");
  await sleep(900);
  await app.key('Escape');   // the end card's walk is still over the page
  await sleep(900);
  await run(app, `location.hash = '#/page/' + ${board}; await window.__vi3.until(() => !!document.querySelector('.board-canvas')); await window.__vi.sleep(1500);
    await window.__vi.openDrawer(); await window.__vi3.tab('ink'); await window.__vi3.until(() => !!document.querySelector('.wz-board-ink-sheet')); await window.__vi.sleep(900);`);
  const onBoard = await read(`({ skipped: window.__gw.card(${board}, 'gw-c').planSkipped === true, strokes: window.__gw.strokes(${board}), canvas: window.__gw.onCanvas('gw-b'), painted: window.__gw.painted('.wz-board-ink-sheet .ink-committed') })`);
  ok('G10: Skip keeps the drawing, and on the Board\'s canvas the card draws its bold' + tag,
    onBoard.skipped && onBoard.strokes === 1 && !!onBoard.canvas && J(onBoard.canvas.bold) === J(['the']) && onBoard.painted > 20, onBoard);

  const cards1 = await read(`window.__gw.cards(${board})`);
  await app.penStroke('.wz-board-ink-sheet', [{ x: 0.45, y: 0.2 }, { x: 0.55, y: 0.24 }, { x: 0.65, y: 0.2 }]);
  await sleep(900);
  const again = await read(`({ strokes: window.__gw.strokes(${board}), same: window.__gw.cards(${board}) === ${J(cards1)} })`);
  ok('G11: drawing again there keeps every card byte for byte - note, marks and skip' + tag, again.strokes === 2 && again.same, again);

  await app.reload();
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the Board after reload' });
  await sleep(1500);
  await inject(app);
  const kept = await read(`({ strokes: window.__gw.strokes(${board}), same: window.__gw.cards(${board}) === ${J(cards1)}, canvas: window.__gw.onCanvas('gw-b'), painted: window.__gw.painted('.wz-board-ink-sheet .ink-committed') })`);
  ok('G12: a reload keeps the drawing and every card, bold drawn and ink painted' + tag, kept.strokes === 2 && kept.same && !!kept.canvas && J(kept.canvas.bold) === J(['the']) && kept.painted > 20, kept);
}

await withHarness(async (app) => {
  for (const theme of ['machina', 'plateau', 'flux']) {
    try { await walkAndInk(app, theme); }
    catch (e) { ok(`RUN [${theme}]: the walk and the drawing tools ran to the end`, false, String(e && e.message).slice(0, 900)); }
  }
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail.slice(0, 900)}`);
console.log(pass ? `\nREORG-GUIDE-WALK-LIVE VERIFY: PASS (${checks.length} checks)` : `\nREORG-GUIDE-WALK-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
