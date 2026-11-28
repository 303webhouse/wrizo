// THE WALK'S AI PANEL, IN THE BROWSER (PRESETS-B, Nov 27; guide-walk-spec.md section 3.8; Fable 11:55 am: "unit and browser checks; no live AI calls"). NO AI IS CALLED: the page's own fetch is stood in for at
// /api/tutor/chat, and what it was handed is read back. Real mouse presses and keys. The live defaults, in Machina, Arbor and Flux. Page side: visual-ink/page.js, page-1a3.js, guide-walk/page.js. Browserless:
// reorg-walk-ai-unit.mjs.
//   A1  the panel stands for a Plan from a structure: the structure and step, the template's four questions, the AI tab lit and the others locked; the page unmoved from where it stood at the walk's door
//   A2  it never speaks first: no ask before a press
//   A3  a question pressed: one ask, { messages, theme, walk }, her note in it; her focus in the box; the questions folded; her question and the reply shown
//   A4  her own question and Enter: that step's thread travels; arrows and Page keys in the box step nowhere
//   A5  another step has its own empty thread, and coming back finds this one
//   A6  a failure keeps her question; Try again sends the same ask
//   A7  shutting and opening the panel by its tab moves no page
//   A8  Escape from the box leaves the walk, and her next keys land on her page
//   A9  the asks saved nothing: her cards, her words and the browser's store hold none of it
//   A10 a Plan of her own names: no panel, no AI tab
//   A11 on a narrow window the panel is shut until its tab is pressed; open, it stays inside the window
//   A12 with the AI off it shows the structure's own note, her focus stays in the walk, and Escape still leaves
// Run: node scripts/harness/reorg-walk-ai-live.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
// the live defaults, asked for before the driver reads them
process.env.WS_REORG = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_FLUX3 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const PAGES = ['./visual-ink/page.js', './visual-ink/page-1a3.js', './guide-walk/page.js'].map((f) => fs.readFileSync(new URL(f, import.meta.url), 'utf8'));
const WORDS = 'The train was late and the coat stayed on the seat.';
const THREE = ['Opening', 'Inciting Incident', 'First Turning Point', 'Rising Complications', 'Midpoint', 'Crisis', 'Second Turning Point', 'Climax', 'Resolution'];
const CIRCLE = ['You', 'Need', 'Go', 'Search', 'Find', 'Take', 'Return', 'Change'];
const NOTE = 'She finds the ledger under the kiln floor.';
const OWN = 'Why does the middle sag';
const checks = [];
const J = (v) => JSON.stringify(v);
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : J(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);

// the stand-in for the server, and this file's own readers
const PAGE_AI = `(() => {
  window.__asks = []; window.__mode = 'ok';
  const real = window.fetch;
  window.fetch = async (u, o) => {
    if (!String(u).includes('/api/tutor/chat')) return real(u, o);
    window.__asks.push(JSON.parse(o.body));
    await new Promise((r) => setTimeout(r, 400));
    if (window.__mode === 'fail') return new Response('no', { status: 500 });
    return new Response(JSON.stringify(window.__mode === 'off' ? { configured: false } : { configured: true, reply: 'REPLY ' + window.__asks.length }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const q = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  const rect = (s) => { const el = q(s); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null; };
  window.__ai = {
    page: () => rect('.mode-page'),
    panel: () => rect('[data-walk-ai]'),
    card: () => rect('[data-walk-card]'),
    state: () => ({
      open: !!q('[data-walk-card]'),
      panel: !!q('[data-walk-ai]'),
      tab: q('[data-walk-ai-tab]')?.getAttribute('aria-selected') ?? null,
      locked: all('[data-walk-locked]').map((b) => b.getAttribute('aria-disabled')),
      head: q('.wz-walk-ai-head')?.textContent ?? '',
      questions: all('[data-walk-ask]').map((b) => b.textContent),
      lens: q('.wz-walk-ai .wz-lens-head')?.getAttribute('aria-expanded') ?? null,
      asked: all('[data-walk-asked]').map((p) => p.textContent),
      replies: all('[data-walk-reply]').map((p) => p.textContent),
      hint: q('[data-walk-own]')?.getAttribute('placeholder') ?? null,
      box: q('[data-walk-own]')?.value ?? null,
      inBox: !!document.activeElement?.hasAttribute('data-walk-own'),
      inWalk: !!document.activeElement?.closest('[data-walk]'),
      step: q('[data-walk-step]')?.getAttribute('data-walk-step') ?? null,
      off: q('[data-walk-ai-off]')?.textContent ?? null,
      retry: !!q('[data-walk-retry]'),
      asks: window.__asks.length,
    }),
    at: (s) => { const el = q(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 12) }; },
    saved: () => J(Object.keys(localStorage).sort().map((k) => localStorage.getItem(k))),
  };
  function J(v) { return JSON.stringify(v); }
})()`;

const boot = async (app, width = 1536, height = 864) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
  for (const p of PAGES) await app.evalJs(p);
  await app.evalJs(PAGE_AI);
};
/** A page with a Plan of these rows (the third step noted when `note` is given). */
const plan = async (app, theme, rows, note) => {
  const s = await run(app, `return await window.__gw.setup(${J(theme)}, ${J(WORDS)});`);
  if (rows) {
    const boxes = rows.map((n, i) => ({ id: `ai-${i}`, kind: 'text', x: 0.05, y: 0.05 + i * 0.1, w: 0.4, h: 0.08, z: i + 1, text: i === 0 && note ? `${n}\n${note}` : n, seq: i }));
    await run(app, `window.wrizoPatchEntry(${J(s.board)}, { boxes: ${J(boxes)} }); window.wrizoFlushNow(); await window.__vi.sleep(900);`);
  }
  return s;
};
const read = (app, js) => run(app, `return ${js};`);
const state = (app) => read(app, 'window.__ai.state()');
/** A real mouse press. */
const press = async (app, selector) => {
  const p = await read(app, `window.__ai.at(${J(selector)})`);
  if (!p) throw new Error('nothing to press: ' + selector);
  const send = (type) => app.cdp('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  await send('mousePressed'); await send('mouseReleased');
};

async function panel(app, theme) {
  const tag = ` [${theme}]`;
  await boot(app);
  const s = await plan(app, theme, THREE, NOTE);
  const cards = () => read(app, `window.__gw.cards(${J(s.board)})`);
  await run(app, 'await window.__gw.toDoor(); await window.__vi.sleep(700);');
  const atDoor = await read(app, 'window.__ai.page()');
  await read(app, 'await window.__gw.openWalk()');
  await sleep(500);
  // the walk opens on the first step not noted; the checks stand on the first
  await press(app, '[data-walk-row="ai-0"]');
  await sleep(700);
  const first = await state(app);
  const page = await read(app, 'window.__ai.page()');
  const cards0 = await cards();
  ok('A1: the panel stands: structure and step, the four questions, the AI tab lit, the others locked, the page unmoved from the walk\'s door' + tag,
    first.panel && /Three-Act/i.test(first.head) && /1/.test(first.head) && first.questions.length === 4 && first.questions[0] === 'What does an Opening do in Three-Act Structure?' && first.questions[1] === 'Show me Openings in well-known stories' && first.tab === 'true' && J(first.locked) === J(['true', 'true']) && J(page) === J(atDoor), { first, page, atDoor });
  ok('A2: it never speaks first' + tag, first.asks === 0 && first.asked.length === 0 && first.replies.length === 0, first);

  await press(app, '[data-walk-ask]');
  await sleep(1200);
  const one = await state(app);
  const sent = await read(app, 'window.__asks[0]');
  const asked = theme === 'flux' ? 'QUERY:' : 'You asked:';
  ok('A3: one ask of { messages, theme, walk } with her note; focus in the box; questions folded; her question and the reply shown' + tag,
    one.asks === 1 && J(Object.keys(sent).sort()) === J(['messages', 'theme', 'walk']) && sent.walk.note === NOTE && sent.walk.step === 'Opening' && sent.walk.kind === 'stories' && sent.walk.after === 'Inciting Incident' && J(sent.messages) === J([{ role: 'writer', text: first.questions[0] }]) && one.inBox && one.lens === 'false' && one.questions.length === 0 && J(one.asked) === J([`${asked} ${first.questions[0]}`]) && J(one.replies) === J(['REPLY 1']), { one, sent });

  await app.typeKeys(OWN);
  await app.key('ArrowLeft'); await app.key('ArrowRight'); await app.key('PageDown'); await app.key('PageUp'); await app.key('ArrowRight');
  await sleep(400);
  const typed = await state(app);
  await app.key('Enter');
  await sleep(1200);
  const two = await state(app);
  const sent2 = await read(app, 'window.__asks[1]');
  ok('A4: her own question and Enter send that step\'s thread; arrows and Page keys in the box step nowhere' + tag,
    typed.step === 'ai-0' && typed.box === OWN && J(sent2.messages) === J([{ role: 'writer', text: first.questions[0] }, { role: 'tutor', text: 'REPLY 1' }, { role: 'writer', text: OWN }]) && two.box === '' && two.inBox && two.replies.length === 2, { typed, two, sent2 });

  await press(app, '[data-walk-row="ai-4"]');
  await sleep(900);
  const other = await state(app);
  await press(app, '[data-walk-row="ai-0"]');
  await sleep(900);
  const back = await state(app);
  ok('A5: another step has its own empty thread, and coming back finds this one' + tag,
    other.step === 'ai-4' && other.asked.length === 0 && other.questions.length === 4 && other.questions[3] === 'Ask me questions about my Midpoint' && back.step === 'ai-0' && back.replies.length === 2 && back.asks === 2, { other, back });

  await run(app, "window.__mode = 'fail';");
  await press(app, '[data-walk-own]');
  await app.typeKeys('and then');
  await app.key('Enter');
  await sleep(1200);
  const failed = await state(app);
  await run(app, "window.__mode = 'ok';");
  await press(app, '[data-walk-retry]');
  await sleep(1200);
  const again = await state(app);
  const pair = await read(app, 'window.__asks.slice(-2)');
  ok('A6: a failure keeps her question; Try again sends the same ask' + tag,
    failed.retry && failed.asked.length === 3 && failed.replies.length === 2 && J(pair[0]) === J(pair[1]) && !again.retry && again.replies.length === 3 && again.inBox, { failed, again, pair });

  await press(app, '[data-walk-ai-tab]');
  await sleep(700);
  const shut = { state: await state(app), page: await read(app, 'window.__ai.page()') };
  await press(app, '[data-walk-ai-tab]');
  await sleep(700);
  const opened = { state: await state(app), page: await read(app, 'window.__ai.page()') };
  ok('A7: shutting and opening the panel by its tab moves no page' + tag,
    !shut.state.panel && shut.state.tab === 'false' && opened.state.panel && opened.state.replies.length === 3 && J(shut.page) === J(atDoor) && J(opened.page) === J(atDoor), { shut, opened, atDoor });

  const cards1 = await cards();
  await press(app, '[data-walk-own]');
  await app.key('Escape');
  await sleep(1200);
  const left = await state(app);
  await app.typeKeys('big ');
  await sleep(2800);
  const words = await read(app, `window.__gw.words(${J(s.id)})`);
  ok('A8: Escape from the box leaves the walk, and her next keys land on her page' + tag, !left.open && words.includes('big ') && words.replace('big ', '') === WORDS, { left, words });
  const store = await read(app, 'window.__ai.saved()');
  ok('A9: the asks saved nothing: her cards and the browser\'s store hold none of it' + tag, cards1 === cards0 && !store.includes(OWN) && !store.includes('REPLY 1'), { same: cards1 === cards0, held: [store.includes(OWN), store.includes('REPLY 1')] });
}

async function ownPlan(app, theme) {
  const tag = ` [${theme}]`;
  await boot(app);
  await plan(app, theme, null, '');
  await read(app, 'await window.__gw.openWalk()');
  await sleep(500);
  const own = await state(app);
  ok('A10: a Plan of her own names has no panel and no AI tab' + tag, own.open && !own.panel && own.tab === null && J(own.locked) === J(['true', 'true']), own);
}

async function narrowAndOff(app, theme) {
  const tag = ` [${theme}]`;
  await boot(app, 1200, 800);
  await plan(app, theme, CIRCLE, '');
  await run(app, 'await window.__gw.toDoor(); await window.__vi.sleep(700);');
  const atDoor = await read(app, 'window.__ai.page()');
  await read(app, 'await window.__gw.openWalk()');
  await sleep(500);
  const shut = await state(app);
  await press(app, '[data-walk-ai-tab]');
  await sleep(900);
  const open = await state(app);
  const box = await read(app, "({ panel: window.__ai.panel(), card: window.__ai.card(), page: window.__ai.page(), win: window.innerWidth })");
  ok('A11: narrow: shut until its tab is pressed; open, it stands right of the card inside the window, the page unmoved' + tag,
    !shut.panel && shut.tab === 'false' && open.panel && !!box.panel && box.panel[2] <= box.win && box.panel[0] >= box.card[2] - 1 && J(box.page) === J(atDoor), { shut, open, box, atDoor });
  await run(app, "window.__mode = 'off';");
  await press(app, '[data-walk-ask]');
  await sleep(1200);
  const off = await state(app);
  await app.key('Escape');
  await sleep(1200);
  const gone = await state(app);
  ok('A12: AI off: the structure\'s own note and nothing to ask, her focus in the walk, and Escape still leaves' + tag,
    typeof off.off === 'string' && off.off.length > 40 && off.hint === null && off.questions.length === 0 && off.inWalk && !gone.open, { off, gone });
}

await withHarness(async (app) => {
  for (const theme of ['machina', 'plateau', 'flux']) {
    for (const [name, fn] of [['the panel', panel], ['her own Plan', ownPlan], ['narrow and AI off', narrowAndOff]]) {
      try { await fn(app, theme); }
      catch (e) { ok(`RUN [${theme}]: ${name} ran to the end`, false, String(e && e.message).slice(0, 900)); }
    }
  }
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail.slice(0, 900)}`);
console.log(pass ? `\nREORG-WALK-AI-LIVE VERIFY: PASS (${checks.length} checks)` : `\nREORG-WALK-AI-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
