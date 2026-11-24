// #128 (Nick, Nov 24 11:25 am: "Can we lose the scrollbar arrows on every page in every theme, too? ... The arrows are causing visual confusion/
// overlap on every theme"). Fable, 11:28 am, RULED: every scroller in every theme shows the scrollbar track and thumb only, with no arrow buttons;
// wheel, keys, dragging the thumb and clicking the track all work as before.
//
// An arrow button cannot be seen in the DOM (the browser draws it), so it is found by what it DOES: pressed, an arrow moves its scroller by one
// line (about 40 px); the track there moves it by a page. Each theme as it is LIVE (no pin), a LONG page (it scrolls), Page: Dark, at 1366x768,
// 1920x1080 and 2560x1440; every visible scroller that shows a vertical bar - the page's, and the Front and Back menus' while each is open - is
// scrolled to its middle and pressed 3 px inside each end of its bar (a trusted press, Input.dispatchMouseEvent), the scroll read 700 ms later.
//
// PREMISES  P1  at every theme x size the page's own scroller was found with a bar, and the press points hit the scroller itself (elementFromPoint);
//               the counts print (a reading of nothing is a failure, not a pass)
// ARROWS    A-<theme>  (machina, plateau = Arbor, flux) at both ends of every scroller tested, at 1366, 1920 and 2560, the press moves the scroller
//               by at least half its height in the right direction (the TRACK, a page step): never a line step (an ARROW), never nothing (blind)
// WHEEL     W   the wheel still scrolls the page's scroller in every theme x size (200 px down moves it)
// MUTANT    MUT-A  a reading whose foot press moved 40 px (an arrow's step) turns A's test red (LANDED: the reading changed)
// INFO      what each scroller's bar is drawn with (its computed scrollbar-width / scrollbar-color, its width), and two candidate fixes INJECTED as
//           a style at 1920 (information only, they gate nothing): V1 ::-webkit-scrollbar-button hidden; V2 the webkit mechanism everywhere
//           (scrollbar-width/-color auto, ::-webkit-scrollbar 10 px, buttons hidden)
//
// Run: node apps/desktop/scripts/harness/scrollbar-arrows-128.mjs   (Actions, or a box turn: the box's Windows scrollbars are the reference)
process.env.WS_MACHINA2 = 'default';
process.env.WS_ARBOR2 = 'default';
process.env.WS_FLUX3 = 'default';
process.env.WS_REORG = '1';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const SIZES = [[1366, 768], [1920, 1080], [2560, 1440]];
const THEMES = ['machina', 'plateau', 'flux'];
const PARA = 'The rope was already there, and the well took the bucket back colder still. Whatever is worth carrying is already with you, and the rest the wind can have.';
const TEXT = ['Chapter One', ...Array.from({ length: 70 }, (_, i) => `${i + 1}. ${PARA}`)].join('\n');

// every visible element that shows a vertical bar: marked data-sb128=<n>; its bar's width and what the bar is drawn with
const FIND = (scope) => `(() => {
  document.querySelectorAll('[data-sb128]').forEach((e) => e.removeAttribute('data-sb128'));
  const out = []; let n = 0;
  for (const e of document.querySelectorAll('*')) {
    const cs = getComputedStyle(e); if (!/(auto|scroll)/.test(cs.overflowY)) continue;
    if (e.scrollHeight <= e.clientHeight + 4) continue;
    const r = e.getBoundingClientRect(); if (r.width < 24 || r.height < 60 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
    const bl = parseFloat(cs.borderLeftWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
    const bar = e.offsetWidth - e.clientWidth - bl - br; if (bar <= 0) continue;
    const z = typeof e.currentCSSZoom === 'number' ? e.currentCSSZoom : 1;
    const sx = r.width / (e.offsetWidth * z || 1);   // a transform (the page is painted by one)
    const k = z * sx;
    const x = r.right - (br + bar / 2) * k, top = r.top + (bt + 3) * k, foot = r.bottom - (bb + 3) * k;
    const id = String(n++); e.setAttribute('data-sb128', id);
    const what = e.classList.contains('mode-scroll') ? 'page' : e.closest('.wz-sliver') ? 'front' : e.closest('.wz-tutor-panel, .wz-tutor') ? 'back' : 'other';
    out.push({ id, scope: ${q(scope)}, what, cls: (e.getAttribute('class') || e.tagName).split(/\\s+/).slice(0, 2).join('.'), bar: Math.round(bar * 10) / 10, k: Math.round(k * 1000) / 1000,
      sw: cs.scrollbarWidth, sc: cs.scrollbarColor, h: e.clientHeight, x: Math.round(x * 10) / 10, top: Math.round(top * 10) / 10, foot: Math.round(foot * 10) / 10,
      hitTop: document.elementFromPoint(x, top) === e, hitFoot: document.elementFromPoint(x, foot) === e });
  }
  return out;
})()`;
const SEL = (id) => `document.querySelector('[data-sb128="${id}"]')`;
const MID = (id) => `(() => { const e = ${SEL(id)}; if (!e) return null; e.style.scrollBehavior = 'auto'; e.scrollTop = Math.round((e.scrollHeight - e.clientHeight) / 2); const t = e.scrollTop; e.style.scrollBehavior = ''; return t; })()`;
const TOP = (id) => `(() => { const e = ${SEL(id)}; return e ? e.scrollTop : null; })()`;

async function press(app, s, end) {
  const t0 = await app.evalJs(MID(s.id));
  await sleep(250);
  const y = end === 'foot' ? s.foot : s.top;
  await app.mouseDown(s.x, y); await app.mouseUp(s.x, y);
  await sleep(700);
  const t1 = await app.evalJs(TOP(s.id));
  return t0 === null || t1 === null ? null : Math.round((t1 - t0) * 10) / 10;
}
// the TRACK moved it at least half a page the right way; an ARROW moved it a line; nothing is blind
const judge = (s) => {
  const want = 0.5 * s.h;
  const foot = Number.isFinite(s.dFoot) ? s.dFoot : NaN, top = Number.isFinite(s.dTop) ? s.dTop : NaN;
  return { ok: foot >= want && top <= -want, kind: { foot: !Number.isFinite(foot) ? 'none' : foot === 0 ? 'blind' : foot < want ? 'ARROW' : 'track', top: !Number.isFinite(top) ? 'none' : top === 0 ? 'blind' : -top < want ? 'ARROW' : 'track' } };
};

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 }).catch(() => {});
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* P1 records what follows */ }
  await app.waitFor('!!window.wrizoCreateJournalPage && !!window.wrizoCreateProject', { label: 'the seams', timeout: 20000 });
  await app.evalJs(`(() => { const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    page('sb-1', ${q(TEXT)}, { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('sb-2', 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('sb-n', 'Research notes\\nMill wheels turn at about twelve turns a minute.', { origin: 'loose' });
    W.wrizoFlushNow(); return true; })()`);
  await app.waitFor('!!window.wrizoTheme && !!window.wrizoThemePrefs', { label: 'the theme seams', timeout: 20000 });
}
async function visit(app, theme, w, h) {
  await app.evalJs(`window.wrizoTheme.set(${q(theme)}); window.wrizoThemePrefs.set({ page: 'dark' }); null`);
  await sleep(300);
  await app.emulateDpr(1, w, h);
  await app.evalJs("history.replaceState(null, '', '/#/page/sb-1'); null");
  await app.reload();
  await app.waitFor(`!!document.querySelector('.forward-only-editor') && document.documentElement.getAttribute('data-theme') === ${q(theme)}`, { label: `${theme} at ${w}`, timeout: 20000 }).catch(() => {});
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* P1 records it */ }
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await sleep(1200);
}
const DRAWERS = { front: { grip: '.wz-sliver-grip', root: '.wz-sliver' }, back: { grip: '.wz-tutor-grip', root: '.wz-tutor-panel' } };
const OPEN = (root) => `document.querySelector(${q(root)})?.getAttribute('data-open') === 'true'`;
async function setDrawer(app, d, want) {
  if ((await app.evalJs(OPEN(d.root))) !== want) await app.evalJs(`document.querySelector(${q(d.grip)})?.click(); null`);
  try { await app.waitFor(want ? OPEN(d.root) : `!(${OPEN(d.root)})`, { label: `${d.root} ${want ? 'open' : 'closed'}`, timeout: 5000 }); } catch { /* recorded */ }
  await sleep(700);
  return app.evalJs(OPEN(d.root));
}
async function testAll(app, scope, filter) {
  const found = (await app.evalJs(FIND(scope))).filter(filter);
  for (const s of found) {
    if (s.hitFoot) s.dFoot = await press(app, s, 'foot');
    if (s.hitTop) s.dTop = await press(app, s, 'top');
    s.kind = judge(s).kind;
  }
  return found;
}
async function wheel(app) {
  const s = (await app.evalJs(FIND('wheel'))).find((x) => x.what === 'page');
  if (!s) return null;
  const t0 = await app.evalJs(MID(s.id));
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: s.x - 200, y: (s.top + s.foot) / 2, deltaX: 0, deltaY: 200, pointerType: 'mouse' });
  await sleep(600);
  const t1 = await app.evalJs(TOP(s.id));
  return t0 === null || t1 === null ? null : t1 - t0;
}
const V1 = '*::-webkit-scrollbar-button{ display:none !important; width:0 !important; height:0 !important; }';
const V2 = '*{ scrollbar-width:auto !important; scrollbar-color:auto !important; } *::-webkit-scrollbar{ width:10px; height:10px; } *::-webkit-scrollbar-track{ background:transparent; } *::-webkit-scrollbar-thumb{ background:rgba(128,128,128,.6); } *::-webkit-scrollbar-button{ display:none; width:0; height:0; }';

const read = {};
const probe = {};
try {
  await withHarness(async (app) => {
    await seed(app);
    for (const theme of THEMES) {
      read[theme] = {};
      for (const [w, h] of SIZES) {
        await visit(app, theme, w, h);
        const R = { scrollers: [], opened: {} };
        R.scrollers.push(...await testAll(app, 'rest', () => true));
        for (const [name, d] of Object.entries(DRAWERS)) {
          R.opened[name] = !!(await setDrawer(app, d, true));
          if (R.opened[name]) R.scrollers.push(...await testAll(app, name, (s) => s.what === name));
          await setDrawer(app, d, false);
        }
        R.wheel = await wheel(app);
        read[theme][w] = R;
        console.log(`SB128 READ ${theme} ${w}: ${R.scrollers.length} scroller(s); opened ${q(R.opened)}; wheel ${R.wheel}; ` + R.scrollers.map((s) => `[${s.scope}/${s.what} ${s.cls} bar ${s.bar} k ${s.k} sw ${s.sw} sc '${s.sc}' h ${s.h} hit ${s.hitTop}/${s.hitFoot} foot ${s.dFoot} (${s.kind.foot}) top ${s.dTop} (${s.kind.top})]`).join(' '));
        if (w === 1920) {
          probe[theme] = {};
          for (const [v, css] of [['V1', V1], ['V2', V2]]) {
            await app.evalJs(`(() => { let s = document.getElementById('sb128-probe'); if (!s) { s = document.createElement('style'); s.id = 'sb128-probe'; document.head.appendChild(s); } s.textContent = ${q(css)}; return true; })()`);
            await sleep(500);
            const P = await testAll(app, v, (s) => s.what === 'page');
            probe[theme][v] = P;
            console.log(`INFO SB128 PROBE ${theme} 1920 ${v}: ` + P.map((s) => `[${s.what} ${s.cls} bar ${s.bar} sw ${s.sw} foot ${s.dFoot} (${s.kind.foot}) top ${s.dTop} (${s.kind.top})]`).join(' '));
          }
          await app.evalJs("document.getElementById('sb128-probe')?.remove(); null");
        }
      }
    }
  });
} catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const cells = THEMES.flatMap((t) => SIZES.map(([w]) => ({ t, w, R: read[t] && read[t][w] })));
const p1bad = cells.filter(({ R }) => !(R && R.scrollers.some((s) => s.what === 'page' && s.hitTop && s.hitFoot)));
ok(`P1 at every theme x size the page's scroller was found with a bar and both press points hit it: ${cells.length - p1bad.length}/${cells.length}; scrollers tested ${cells.reduce((n, c) => n + ((c.R && c.R.scrollers.length) || 0), 0)}, press points covered by something else ${cells.reduce((n, c) => n + ((c.R && c.R.scrollers.filter((s) => !s.hitTop || !s.hitFoot).length) || 0), 0)}`,
  p1bad.length === 0, p1bad.map(({ t, w, R }) => ({ t, w, found: R && R.scrollers.map((s) => ({ what: s.what, cls: s.cls, hit: [s.hitTop, s.hitFoot] })) })));
const aOk = (rs) => rs.length > 0 && rs.every((s) => (!s.hitFoot || judge(s).kind.foot === 'track') && (!s.hitTop || judge(s).kind.top === 'track'));
for (const t of THEMES) {
  const rs = SIZES.flatMap(([w]) => ((read[t] && read[t][w] && read[t][w].scrollers) || []).map((s) => ({ ...s, w })));
  const bad = rs.filter((s) => !aOk([s]));
  ok(`A-${t} every scroller's bar, pressed 3 px inside each end, moves a page (the track), never a line (an arrow) or nothing, at 1366, 1920 and 2560: ${rs.length - bad.length}/${rs.length}`,
    aOk(rs), bad.map((s) => ({ w: s.w, scope: s.scope, what: s.what, cls: s.cls, bar: s.bar, sw: s.sw, h: s.h, foot: s.dFoot, top: s.dTop, kind: s.kind })));
}
const wheels = cells.map(({ t, w, R }) => ({ t, w, d: R && R.wheel }));
ok(`W the wheel still scrolls the page's scroller in every theme x size: ${wheels.filter((x) => x.d > 0).length}/${wheels.length}`, wheels.every((x) => x.d > 0), wheels);
{
  const base = cells.map((c) => c.R && c.R.scrollers.find((s) => s.what === 'page' && s.hitFoot)).find(Boolean);
  const mut = base ? { ...base, dFoot: 40 } : null;
  ok('MUT-A a reading whose foot press moved 40 px (an arrow\'s step) turns A\'s test red', !!mut && mut.dFoot !== base.dFoot && !aOk([mut]), mut && { was: base.dFoot, now: mut.dFoot });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1800)}`);
const EXPECTED = 6;   // P1, A x3, W, MUT-A
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nSCROLLBAR-ARROWS-128 VERIFY: PASS (${checks.length} checks)`
  : `\nSCROLLBAR-ARROWS-128 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
