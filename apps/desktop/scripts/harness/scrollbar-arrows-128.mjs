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
    // SUPERSEDED (frames 45463510262: a scroller round the page overflowing by a few px showed a NATIVE bar with arrows at both ends - Flux and
    // Machina - and this filter skipped it). Every element that overflows at all and shows a bar is read now; one with too little room to move a
    // page (tiny) is judged by M (its mechanism), not by a press. Verbatim:  if (e.scrollHeight <= e.clientHeight + 4) continue;
    if (e.scrollHeight <= e.clientHeight) continue;
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
      hitTop: document.elementFromPoint(x, top) === e, hitFoot: document.elementFromPoint(x, foot) === e,
      room: e.scrollHeight - e.clientHeight, tiny: (e.scrollHeight - e.clientHeight) < 0.6 * e.clientHeight,
      seen: (() => { let k = 0; for (let y = r.top + 1; y < r.bottom - 1; y += 4) if (document.elementFromPoint(x, y) === e) k += 1; return k; })(),
      covers: (() => { const hit = new Set(); for (let y = r.top + 1; y < r.bottom - 1; y += 4) { const o = document.elementFromPoint(x, y); const c = o && o !== e ? o.closest('button, a, [role="button"]') : null; if (c && c !== e) hit.add(((c.getAttribute('class') || c.tagName).split(/\s+/)[0]) + (c.getAttribute('aria-label') ? ' "' + c.getAttribute('aria-label').slice(0, 40) + '"' : '')); } return [...hit]; })(),
      over: (() => { const o = document.elementFromPoint(x, top); return o && o !== e ? (o.getAttribute('class') || o.tagName).split(/\s+/)[0] : null; })() });
  }
  return out;
})()`;
const SEL = (id) => `document.querySelector('[data-sb128="${id}"]')`;
const MID = (id) => `(() => { const e = ${SEL(id)}; if (!e) return null; e.style.scrollBehavior = 'auto'; e.scrollTop = Math.round((e.scrollHeight - e.clientHeight) / 2); const t = e.scrollTop; e.style.scrollBehavior = ''; return t; })()`;
const TOP = (id) => `(() => { const e = ${SEL(id)}; return e ? e.scrollTop : null; })()`;

async function press(app, s, end) {
  const t0 = await app.evalJs(MID(s.id));
  if (Number.isFinite(t0)) s[end === 'foot' ? 'avFoot' : 'avTop'] = end === 'foot' ? s.room - t0 : t0;   // the room this press could use (A-B)
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
    page('sb-w', ${q(TEXT)}, { origin: 'loose' });
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
    if (s.tiny) { s.kind = { foot: 'tiny', top: 'tiny' }; continue; }
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
        // a LOOSE long page (in Flux it opens as Wire In - the Corridor, whose rule cleared the page's bar with scrollbar-color, the native mechanism)
        await app.evalJs("history.replaceState(null, '', '/#/page/sb-w'); null");
        await app.reload();
        await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `the loose page at ${w}`, timeout: 20000 }).catch(() => {});
        try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded below */ }
        await sleep(theme === 'flux' ? 4300 : 1500);   // Wire In's entry line (3 s + 0.6 s fade) has gone
        R.loose = { jacked: await app.evalJs("document.documentElement.hasAttribute('data-flux3-jacked')") };
        R.scrollers.push(...await testAll(app, 'loose', (s) => s.what === 'page'));
        read[theme][w] = R;
        console.log(`SB128 READ ${theme} ${w}: ${R.scrollers.length} scroller(s); opened ${q(R.opened)}; wheel ${R.wheel}; ` + R.scrollers.map((s) => `[${s.scope}/${s.what} ${s.cls} bar ${s.bar} k ${s.k} sw ${s.sw} sc '${s.sc}' h ${s.h} room ${s.room}${s.tiny ? ' TINY' : ''} hit ${s.hitTop}/${s.hitFoot}${s.over ? ' over ' + s.over : ''}${s.covers && s.covers.length ? ' COVERED BY ' + s.covers.join(' + ') : ''} foot ${s.dFoot} (${s.kind.foot}) top ${s.dTop} (${s.kind.top})]`).join(' '));
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
// SUPERSEDED (before this file's first green; red run 45461540607): P1 asked both press points of the page's bar to hit it in every cell, but in
// Machina at 1920 the bar's top end sits under the chrome (hit false/true), so the cell is not blind - its foot was pressed. P1-B asks that the page's
// scroller was found with a bar and at least one end pressed, in every cell, plus Wire In mounted on Flux's loose page; the covered count prints. Verbatim:
//   const p1bad = cells.filter(({ R }) => !(R && R.scrollers.some((s) => s.what === 'page' && s.hitTop && s.hitFoot)));
//   ok(`P1 at every theme x size the page's scroller was found with a bar and both press points hit it: ${cells.length - p1bad.length}/${cells.length}; scrollers tested ${cells.reduce((n, c) => n + ((c.R && c.R.scrollers.length) || 0), 0)}, press points covered by something else ${cells.reduce((n, c) => n + ((c.R && c.R.scrollers.filter((s) => !s.hitTop || !s.hitFoot).length) || 0), 0)}`,
//     p1bad.length === 0, p1bad.map(({ t, w, R }) => ({ t, w, found: R && R.scrollers.map((s) => ({ what: s.what, cls: s.cls, hit: [s.hitTop, s.hitFoot] })) })));
const pressed = (s) => s.what === 'page' && (s.hitTop || s.hitFoot);
const p1bad = cells.filter(({ t, R }) => !(R && R.scrollers.some((s) => s.scope === 'rest' && pressed(s)) && R.scrollers.some((s) => s.scope === 'loose' && pressed(s)) && (t !== 'flux' || (R.loose && R.loose.jacked))));
ok(`P1-B at every theme x size the page's scroller (her Part, and a loose page: Wire In in Flux) was found with a bar and pressed at one end or both: ${cells.length - p1bad.length}/${cells.length}; scrollers tested ${cells.reduce((n, c) => n + ((c.R && c.R.scrollers.length) || 0), 0)}, press points covered by something else ${cells.reduce((n, c) => n + ((c.R && c.R.scrollers.filter((s) => !s.hitTop || !s.hitFoot).length) || 0), 0)}`,
  p1bad.length === 0, p1bad.map(({ t, w, R }) => ({ t, w, loose: R && R.loose, found: R && R.scrollers.map((s) => ({ scope: s.scope, what: s.what, cls: s.cls, hit: [s.hitTop, s.hitFoot] })) })));
// SUPERSEDED (the fix run 45468457970 on 1230334b, before this file's first green): A judged a press by half the scroller's height, but a short scroller's
// track runs to its END and stops - Machina's Front menu moved 390 / 488 px, exactly the room left from its middle: a track step, read as an arrow. A-B
// judges by the smaller of half a page and the room that press had (an arrow moves about 40 px however much room there is). Verbatim:
//   const aOk = (rs) => rs.length > 0 && rs.every((s) => s.tiny || (!s.hitFoot || judge(s).kind.foot === 'track') && (!s.hitTop || judge(s).kind.top === 'track'));
//   for (const t of THEMES) {
//     const rs = SIZES.flatMap(([w]) => ((read[t] && read[t][w] && read[t][w].scrollers) || []).map((s) => ({ ...s, w })));
//     const bad = rs.filter((s) => !aOk([s]));
//     ok(`A-${t} every scroller's bar, pressed 3 px inside each end, moves a page (the track), never a line (an arrow) or nothing, at 1366, 1920 and 2560: ${rs.length - bad.length}/${rs.length}`,
//       aOk(rs), bad.map((s) => ({ w: s.w, scope: s.scope, what: s.what, cls: s.cls, bar: s.bar, sw: s.sw, h: s.h, foot: s.dFoot, top: s.dTop, kind: s.kind })));
//   }
const judgeB = (s) => {
  const end = (d, av) => { if (!Number.isFinite(d)) return 'none'; const want = Math.min(0.5 * s.h, Number.isFinite(av) ? av : 0.5 * s.h) - 2; if (want <= 2) return 'no room'; return d === 0 ? 'blind' : d < want ? 'ARROW' : 'track'; };
  return { foot: end(s.dFoot, s.avFoot), top: end(Number.isFinite(s.dTop) ? -s.dTop : s.dTop, s.avTop) };
};
const endOk = (k) => k === 'track' || k === 'no room';
const aOkB = (rs) => rs.length > 0 && rs.every((s) => s.tiny || ((!s.hitFoot || endOk(judgeB(s).foot)) && (!s.hitTop || endOk(judgeB(s).top))));
for (const t of THEMES) {
  const rs = SIZES.flatMap(([w]) => ((read[t] && read[t][w] && read[t][w].scrollers) || []).map((s) => ({ ...s, w })));
  const bad = rs.filter((s) => !aOkB([s]));
  ok(`A-B-${t} every scroller's bar, pressed 3 px inside each end, moves a page or to its end (the track), never a line (an arrow) or nothing, at 1366, 1920 and 2560: ${rs.length - bad.length}/${rs.length}`,
    aOkB(rs), bad.map((s) => ({ w: s.w, scope: s.scope, what: s.what, cls: s.cls, bar: s.bar, sw: s.sw, h: s.h, room: s.room, foot: s.dFoot, avFoot: s.avFoot, top: s.dTop, avTop: s.avTop, kind: judgeB(s) })));
}
// M (frames 45463510262): a bar with too little room to move a page cannot tell an arrow's press from the track's, so every bar is ALSO judged by what
// draws it. In Chromium the standard properties (a computed scrollbar-width other than auto/none, or a scrollbar-color other than auto) draw the native
// bar, whose arrows no CSS hides (the Front menu's 40 px steps above); auto/auto is the ::-webkit-scrollbar mechanism, whose buttons are hidden.
const native = (s) => s.sw !== 'none' && (s.sw !== 'auto' || s.sc !== 'auto');
for (const t of THEMES) {
  const rs = SIZES.flatMap(([w]) => ((read[t] && read[t][w] && read[t][w].scrollers) || []).map((s) => ({ ...s, w })));
  const bad = rs.filter(native);
  ok(`M-${t} every bar shown, at 1366, 1920 and 2560, is drawn by the ::-webkit-scrollbar mechanism (computed scrollbar-width and -color auto), never the native one whose arrows cannot be hidden: ${rs.length - bad.length}/${rs.length} (${rs.filter((s) => s.tiny).length} with too little room for a press)`,
    rs.length > 0 && bad.length === 0, [...new Map(bad.map((s) => [`${s.scope}/${s.what} ${s.cls} sw ${s.sw} sc ${s.sc}`, { w: s.w, room: s.room }])).entries()].slice(0, 12));
}
// SUPERSEDED (the same fix run): C read every bar found, including one of which nothing shows - the closed Front drawer's panel, whose bar lies wholly
// under the drawer's own grip ("Open hand tools"); a control over a bar she cannot see is not on a bar she sees. C-B judges the bars that show at
// least one sample of themselves (seen > 0) and prints how many it set aside. Verbatim:
//   // C (INK, Nov 24, from Nick's screenshots: the boxed ^ and v capping the page's bar are the reorg's Part arrows, .reorg-part-arrow, 4 px inside each
//   // end - the 3 px presses above passed between them and the bar's ends): no button or link is drawn over any bar, sampled every 4 px down its middle.
//   const cOk = (rs) => rs.length > 0 && rs.every((s) => !(s.covers && s.covers.length));
//   for (const t of THEMES) {
//     const rs = SIZES.flatMap(([w]) => ((read[t] && read[t][w] && read[t][w].scrollers) || []).map((s) => ({ ...s, w })));
//     const bad = rs.filter((s) => s.covers && s.covers.length);
//     ok(`C-${t} no button or link (an arrow, a scroll-step control) sits on any bar, at 1366, 1920 and 2560: ${rs.length - bad.length}/${rs.length}`, cOk(rs),
//       bad.map((s) => ({ w: s.w, scope: s.scope, what: s.what, cls: s.cls, covers: s.covers })));
//   }
const cOkB = (rs) => rs.length > 0 && rs.every((s) => !(s.seen > 0 && s.covers && s.covers.length));
for (const t of THEMES) {
  const rs = SIZES.flatMap(([w]) => ((read[t] && read[t][w] && read[t][w].scrollers) || []).map((s) => ({ ...s, w })));
  const bad = rs.filter((s) => s.seen > 0 && s.covers && s.covers.length);
  ok(`C-B-${t} no button or link (an arrow, a scroll-step control) sits on any bar she can see, at 1366, 1920 and 2560: ${rs.length - bad.length}/${rs.length} (${rs.filter((s) => !(s.seen > 0)).length} bar(s) wholly hidden, set aside)`, cOkB(rs),
    bad.map((s) => ({ w: s.w, scope: s.scope, what: s.what, cls: s.cls, seen: s.seen, covers: s.covers })));
}
// SUPERSEDED with C (its mutant moves to C-B's test). Verbatim:
//   {
//     const base = cells.map((c) => c.R && c.R.scrollers.find((s) => s.what === 'page')).find(Boolean);
//     const mut = base ? { ...base, covers: ['reorg-part-arrow "Next Part"'] } : null;
//     ok("MUT-C a reading with a Part arrow on the page's bar turns C's test red", !!mut && JSON.stringify(mut.covers) !== JSON.stringify(base.covers) && !cOk([mut]), mut && mut.covers);
//   }
{
  const base = cells.map((c) => c.R && c.R.scrollers.find((s) => s.what === 'page' && s.seen > 0)).find(Boolean);
  const mut = base ? { ...base, covers: ['reorg-part-arrow "Next Part"'] } : null;
  ok("MUT-C-B a reading with a Part arrow on the page's (seen) bar turns C-B's test red", !!mut && JSON.stringify(mut.covers) !== JSON.stringify(base.covers) && !cOkB([mut]), mut && mut.covers);
}
const wheels = cells.map(({ t, w, R }) => ({ t, w, d: R && R.wheel }));
ok(`W the wheel still scrolls the page's scroller in every theme x size: ${wheels.filter((x) => x.d > 0).length}/${wheels.length}`, wheels.every((x) => x.d > 0), wheels);
// SUPERSEDED with A (its mutant moves to A-B's test). Verbatim:
//   {
//     const base = cells.map((c) => c.R && c.R.scrollers.find((s) => s.what === 'page' && s.hitFoot)).find(Boolean);
//     const mut = base ? { ...base, dFoot: 40 } : null;
//     ok('MUT-A a reading whose foot press moved 40 px (an arrow\'s step) turns A\'s test red', !!mut && mut.dFoot !== base.dFoot && !aOk([mut]), mut && { was: base.dFoot, now: mut.dFoot });
//   }
{
  const base = cells.map((c) => c.R && c.R.scrollers.find((s) => s.what === 'page' && s.hitFoot && s.avFoot > 200)).find(Boolean);
  const mut = base ? { ...base, dFoot: 40 } : null;
  ok("MUT-A-B a reading whose foot press moved 40 px with room for a page (an arrow's step) turns A-B's test red", !!mut && mut.dFoot !== base.dFoot && !aOkB([mut]), mut && { was: base.dFoot, now: mut.dFoot, room: base.avFoot });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1800)}`);
const EXPECTED = 13;   // P1-B, A-B x3, M x3, C-B x3 + MUT-C-B, W, MUT-A-B (A, C and their mutants parked before the first green, run 45468457970)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nSCROLLBAR-ARROWS-128 VERIFY: PASS (${checks.length} checks)`
  : `\nSCROLLBAR-ARROWS-128 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
