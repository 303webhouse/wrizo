// VISUAL 1a - HER CARET STAYS PUT WHILE SHE DRAWS (found by PRESETS-B; Fable, Nov 26, 4:10 pm: "on a page, a pen stroke sends her caret to the END of her words, so her next key lands where she didn't put it").
// A real pen (and a real mouse) in BUILD and EDIT, the live defaults, in Machina, Arbor and Flux. Her caret is mid-line; she draws; she types.
//   S   a stroke on clear paper below the words: the pen stays down, the words take no focus; the letter she types lands where her caret was
//   W   the same for a stroke across a word
//   E   the same in EDIT;  M with a mouse;  U pressing the Undo arrow on the sheet moves nothing either
//   P   with the pen up, a press off the words still puts the caret where it always did
// Run: node scripts/harness/visual-1a4-caret.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
process.env.WS_REORG = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_FLUX3 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const PAGE = fs.readFileSync(new URL('./visual-ink/page.js', import.meta.url), 'utf8');
const PAGE3 = fs.readFileSync(new URL('./visual-ink/page-1a3.js', import.meta.url), 'utf8');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);

const WORDS = 'The coat stayed on the seat.';
const AT = 4;   // after "The "
const WANT = 'The Xcoat stayed on the seat.';

const boot = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs(PAGE);
  await app.evalJs(PAGE3);
};
// a page with her words, her caret after "The ", then the INK tab (the pen down)
const ready = async (app, theme, stage = 'draft', ink = true) => {
  await boot(app);
  const id = await run(app, `const id = await window.__vi3.buildPage(${JSON.stringify(theme)}, ${JSON.stringify(WORDS)}); await window.__vi.sleep(1500); ${stage === 'draft' ? '' : `await window.__vi3.stage(${JSON.stringify(stage)}); await window.__vi.openDrawer();`} await window.__vi.sleep(600); window.__vi3.caretAt(${AT}); await window.__vi.sleep(300); return id;`);
  if (ink) await run(app, 'await window.__vi3.inkOnPaper(); await window.__vi.sleep(900);');
  return id;
};
const state = (app, id) => run(app, `const e = window.__vi3.entry(${JSON.stringify(id)}); const s = window.__vi3.shown(); return { paper: s.paper, focus: s.focus, text: e && e.text, strokes: (e && e.strokes || []).length };`);
// where a stroke goes, as fractions of the sheet: across the word "coat", or on the clear paper below the line
const across = (app) => run(app, "const ed = document.querySelector('.forward-only-editor'), sheet = document.querySelector('.wz-ink-sheet').getBoundingClientRect(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const n = w.nextNode(); const r = document.createRange(); r.setStart(n, 4); r.setEnd(n, 8); const b = r.getBoundingClientRect(); const y = (b.top + b.height / 2 - sheet.top) / sheet.height; return [0, 0.5, 1].map((f) => ({ x: (b.left - 6 + f * (b.width + 12) - sheet.left) / sheet.width, y }));");
const BELOW = [{ x: 0.3, y: 0.5 }, { x: 0.45, y: 0.52 }, { x: 0.6, y: 0.5 }];
const mouseDrag = async (app, points) => {
  const r = await run(app, "const b = document.querySelector('.wz-ink-sheet').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height };");
  const at = (p) => ({ x: r.x + p.x * r.w, y: r.y + p.y * r.h, pointerType: 'mouse', button: 'left' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', ...at(points[0]), buttons: 1, clickCount: 1 });
  for (const p of points.slice(1)) await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...at(p), buttons: 1 });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', ...at(points.at(-1)), buttons: 0, clickCount: 1 });
};

// draw, look, type, look
const drawAndType = async (app, code, label, id, draw) => {
  await draw();
  await sleep(900);
  const a = await state(app, id);
  ok(`${code}1 ${label}: after the stroke the pen is still down and her words have not taken the focus`, a.paper === 'ink' && a.focus === false && a.strokes === 1, a);
  await app.typeKeys('X');
  await sleep(2800);
  const b = await state(app, id);
  ok(`${code}2 ${label}: the letter she types lands where her caret was, and the pen is up`, b.text === WANT && b.paper !== 'ink' && b.focus === true && b.strokes === 1, b);
};
const part = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: threw`, false, String((e && e.message) || e).slice(0, 220)); } };

await withHarness(async (app) => {
  for (const theme of ['machina', 'plateau', 'flux']) {
    await part(`S ${theme}`, async () => {
      const id = await ready(app, theme);
      await drawAndType(app, 'S', `[${theme}] a stroke below the words`, id, () => app.penStroke('.wz-ink-sheet', BELOW));
    });
    await part(`W ${theme}`, async () => {
      const id = await ready(app, theme);
      const points = await across(app);
      await drawAndType(app, 'W', `[${theme}] a stroke across a word`, id, () => app.penStroke('.wz-ink-sheet', points));
    });
  }
  await part('E', async () => {
    const id = await ready(app, 'machina', 'revise');
    await drawAndType(app, 'E', '[machina, EDIT]', id, () => app.penStroke('.wz-ink-sheet', BELOW));
  });
  await part('M', async () => {
    const id = await ready(app, 'machina');
    await drawAndType(app, 'M', '[machina, a mouse]', id, () => mouseDrag(app, BELOW));
  });
  await part('U', async () => {
    const id = await ready(app, 'machina');
    await app.penStroke('.wz-ink-sheet', BELOW);
    await sleep(700);
    const p = await run(app, "const b = document.querySelector('.ink-undo'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };");
    if (p) { await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); }
    await sleep(900);
    const a = await state(app, id);
    await app.typeKeys('X');
    await sleep(2800);
    const b = await state(app, id);
    ok('U1: pressing the Undo arrow takes the stroke back and moves nothing: the pen stays down, and her next letter lands where her caret was', !!p && a.strokes === 0 && a.paper === 'ink' && a.focus === false && b.text === WANT, { arrow: !!p, a, b });
  });
  await part('P', async () => {
    const id = await ready(app, 'machina', 'draft', false);
    const p = await run(app, "const b = document.querySelector('.wz-ink-sheet').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 };");
    await app.mouseDown(p.x, p.y);
    await app.mouseUp(p.x, p.y);
    await sleep(600);
    await app.typeKeys('X');
    await sleep(2800);
    const b = await state(app, id);
    ok('P1: with the pen up, a press below the last line still puts the caret at the end of her words', b.text === `${WORDS}X`, b);
  });
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail.slice(0, 500)}`);
// the suite prints only this line, so it names what failed and gives the first reason (a throw before anything else)
const bad = checks.filter((c) => !c.pass);
const why = bad.find((c) => c.name.endsWith(': threw')) || bad[0];
const codes = [...new Set(bad.map((c) => c.name.split(/[ :]/)[0]))].join(' ');
console.log(pass ? `\nVISUAL 1A4 CARET VERIFY: PASS (${checks.length} checks)` : `\nVISUAL 1A4 CARET VERIFY: FAIL - ${bad.length}/${checks.length} failed: ${codes} | ${why ? `${why.name.slice(0, 40)} ${why.detail.slice(0, 220)}`.replace(/\s+/g, ' ') : 'no checks ran'}`);
process.exit(pass ? 0 : 1);
