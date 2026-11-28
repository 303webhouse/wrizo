// #146 (Nick, Nov 27, on live L14: "when I hit 'Write this track,' I was taken to Wire In mode. The User should be directed to Text from the Guide and can Wire In from there if they want to"), IN THE BROWSER (PRESETS-B).
// Free Write is what Flux calls Wire In; Draft is Text. Real presses and keys, in Machina, Arbor and Flux, the live defaults. Page side: visual-ink/page.js, page-1a3.js, guide-walk/page.js. Browserless:
// reorg-guide-walk-unit.mjs (TEXT).
//   T1  "Write this ..." on a step with no Part yet lands in Draft: the Draft tab lit, no typewriter, not wired in
//   T2  her first words make the Part, and after a reload it is still in Draft
//   T3  she can still go to Free Write from there, and the Part keeps that until the Guide sends her again
//   T4  the Guide sending her to a Part she left in Free Write lands in Draft, and a reload agrees
//   T5  the end card's "Write the first ..." lands in Draft too
//   T6  a frame of where she lands (WS_FRAMES=<dir>: 1366, 1536 and 1920)
// Run: node scripts/harness/reorg-walk-write-live.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
import path from 'node:path';
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

const PAGE_T = `(() => {
  const q = (s) => document.querySelector(s);
  window.__t = {
    where: () => ({
      page: location.hash,
      tab: q('.desk-mode-tab.active')?.getAttribute('data-mode-key') ?? null,
      typewriter: q('[data-typewriter]')?.getAttribute('data-typewriter') ?? null,
      wired: document.documentElement.hasAttribute('data-flux3-jacked'),
      walk: !!q('[data-walk-card]'),
    }),
    at: (s) => { const el = q(s); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.left + Math.min(r.width / 2, 60), y: r.top + Math.min(r.height / 2, 12) } : null; },
  };
})()`;
const inject = async (app) => { for (const p of PAGES) await app.evalJs(p); await app.evalJs(PAGE_T); };
const boot = async (app, width, height) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
  await inject(app);
};
const read = (app, js) => run(app, `return ${js};`);
const where = (app) => read(app, 'window.__t.where()');
const press = async (app, selector) => {
  const p = await read(app, `window.__t.at(${J(selector)})`);
  if (!p) throw new Error('nothing to press: ' + selector);
  const send = (type) => app.cdp('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  await send('mousePressed'); await send('mouseReleased');
};
const inDraft = (w) => !w.walk && w.tab === 'draft' && w.typewriter !== 'true' && !w.wired;
const frame = async (app, name) => {
  const dir = process.env.WS_FRAMES;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  const shot = await app.cdp('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(dir, `${name}.png`), Buffer.from(shot.data, 'base64'));
};
const walkFrom = async (app, hash) => {
  await run(app, `location.hash = ${J(hash)}; await window.__vi.sleep(1500);`);
  const opened = await read(app, 'await window.__gw.openWalk()');
  if (!opened) throw new Error('the walk did not open from ' + hash);
  await sleep(500);
};

async function doors(app, theme) {
  const tag = ` [${theme}]`;
  await boot(app, 1536, 864);
  const s = await run(app, `return await window.__gw.setup(${J(theme)}, ${J(WORDS)});`);
  const origin = `#/page/${s.id}`;
  await walkFrom(app, origin);
  await press(app, '[data-walk-write]');
  await sleep(2000);
  const first = await where(app);
  await frame(app, `146-${theme}-1536`);
  ok('T1: "Write this ..." on a step with no Part lands in Draft: the Draft tab lit, no typewriter, not wired in' + tag, inDraft(first), first);

  await press(app, '.mode-pagecol [contenteditable="true"]');
  await app.typeKeys('first words of it ');
  await sleep(2800);
  const born = await where(app);
  await app.reload();
  await sleep(2000);
  await inject(app);
  const again = await where(app);
  ok('T2: her first words make the Part, and after a reload it is still in Draft' + tag, /#\/page\/(?!new)/.test(born.page) && again.page === born.page && inDraft(born) && inDraft(again), { born, again });

  const part = born.page;
  await press(app, '.desk-mode-tab[data-mode-key="freewrite"]');
  await sleep(1500);
  const free = await where(app);
  await app.reload();
  await sleep(2000);
  await inject(app);
  const stillFree = await where(app);
  ok('T3: she can still go to Free Write from there, and the Part keeps that' + tag, free.typewriter === 'true' && stillFree.typewriter === 'true' && free.page === part, { free, stillFree });

  await walkFrom(app, origin);
  await press(app, '[data-walk-row="gw-a"]');
  await sleep(700);
  await press(app, '[data-walk-write]');
  await sleep(2200);
  const sent = await where(app);
  await app.reload();
  await sleep(2000);
  await inject(app);
  const kept = await where(app);
  ok('T4: the Guide sending her to a Part she left in Free Write lands in Draft, and a reload agrees' + tag, sent.page === part && inDraft(sent) && inDraft(kept), { sent, kept });

  // the end card: skip to the end, then "Write the first ..." (the same Part, left in Free Write again)
  await press(app, '.desk-mode-tab[data-mode-key="freewrite"]');
  await sleep(1500);
  await walkFrom(app, origin);
  await press(app, '[data-walk-row="gw-c"]');
  await sleep(700);
  await press(app, '[data-walk-next]');
  await sleep(900);
  await press(app, '[data-walk-write-first]');
  await sleep(2200);
  const end = await where(app);
  ok('T5: the end card\'s "Write the first ..." lands in Draft too' + tag, end.page === part && inDraft(end), end);
}

async function wide(app, theme, width, height) {
  await boot(app, width, height);
  const s = await run(app, `return await window.__gw.setup(${J(theme)}, ${J(WORDS)});`);
  await walkFrom(app, `#/page/${s.id}`);
  await press(app, '[data-walk-write]');
  await sleep(2200);
  const there = await where(app);
  await frame(app, `146-${theme}-${width}`);
  ok(`T6: at ${width} she lands in Draft [${theme}]`, inDraft(there), there);
}

await withHarness(async (app) => {
  for (const theme of ['machina', 'plateau', 'flux']) {
    try { await doors(app, theme); }
    catch (e) { ok(`RUN [${theme}]: the doors ran to the end`, false, String(e && e.message).slice(0, 900)); }
    for (const [w, h] of [[1366, 768], [1920, 1080]]) {
      try { await wide(app, theme, w, h); }
      catch (e) { ok(`RUN [${theme}]: ${w} ran to the end`, false, String(e && e.message).slice(0, 900)); }
    }
  }
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail.slice(0, 900)}`);
console.log(pass ? `\nREORG-WALK-WRITE-LIVE VERIFY: PASS (${checks.length} checks)` : `\nREORG-WALK-WRITE-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
