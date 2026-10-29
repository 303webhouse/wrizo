// POLISH #10, FIX item 2 (Nick released the held list, Oct 25): THE FREE WRITE "KEEP WRITING" HINT NEVER COVERS TEXT (.fo-nudge, ForwardOnlyEditor.tsx).
// It sits clear of the writing line - at the page's foot in the normal view, below the writing line in the zoom - in each theme's own type (today it is
// Arbor's italic serif under Flux too). RED-FIRST, on page-size-r3 @ 243cf8f0: the hint is pinned 8px above the editor's bottom, which on a page full of
// text is its last line (H1 red), and it inherits the prose face (H3 red in Flux and Machina).
//
// A Free Write page full of text, in Arbor, Flux and Machina, in the normal view and in the zoom (1366x768); the hint raised the writer's way - Backspace
// pressed past the forward-only runway until it appears:
//   H0 (premise) the hint appears, and the page is in the view named
//   H1 the hint's rect meets NO line of text on screen (the writing line included)
//   H2 the hint is on screen: inside the viewport and the stage, and in the normal view inside the page itself
//   H3 the hint wears the theme's own type: Arbor its italic prose serif; Flux and Machina their own content face (--font-contentLabel), upright
// Mutant (Arbor, normal): MH the hint pinned onto the writing line - H1 fails.
// REVIEW OF TURN 1 (Oct 26): the red on r3 never saw Nick's bug. (a) A Free Write page opened ZOOMED though its key said off - the view is now set
// through the writer's own Typewriter control and checked. (b) The hint was raised while the hold still paid the deep first engage (one line per
// glide): the writer's line sat ~1000px below the stage, and the hint with it, so H1 passed on r3 off screen. Now the fixture waits for the scroller
// to hold still and H0 requires the writer's line (the caret's) ON SCREEN before the hint is raised.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-hint.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);

const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const SENTENCES = [
  'The rope was already there, and the well took the bucket back colder still.',
  'Whatever is worth carrying is already with you, and the rest the wind can have.',
  'We left the map on the stone and walked until the light went thin over the ridge.',
];
const PARA = (() => { let s = ''; let i = 0; while (s.length < 2600) { s += (s ? ' ' : '') + SENTENCES[i % SENTENCES.length]; i += 1; } return s; })();
const pid = (theme) => `p10h-${theme}`;

const openPage = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { label: id, timeout: 10000 });
  await sleep(900);
  return there;
};
// the writer's own Typewriter control (page-size's press): the Sliver open, the pointer to the button until it is HIT, the press, the Sliver closed
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${J(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
const attr = (app, sel, a) => app.evalJs(`document.querySelector(${J(sel)})?.getAttribute(${J(a)}) ?? null`);
const click = async (app, x, y) => { await app.mouseMove(x, y); await app.mouseDown(x, y); await app.mouseUp(x, y); };
const TOGGLE = '[data-mode-toggle="typewriter"]';
const zoomedNow = (app) => app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'");
const setView = async (app, zoom) => {
  if ((await zoomedNow(app)) === zoom) return zoom;
  if ((await attr(app, '.wz-sliver', 'data-open')) !== 'true') { const g = await rectOf(app, '.wz-sliver-grip'); if (g) { await click(app, g.x, g.y); await sleep(600); } }
  const probe = () => app.evalJs(`(() => { const b = document.querySelector(${J(TOGGLE)}); if (!b) return null; b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = b.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y);
    return { x: Math.round(x), y: Math.round(y), hits: !!hit && (hit === b || b.contains(hit)) }; })()`);
  let at = await probe();
  for (let i = 0; at && !at.hits && i < 16; i += 1) { await app.mouseMove(at.x, at.y); await sleep(150); at = await probe(); }
  if (at && at.hits) { await click(app, at.x, at.y); await sleep(1100); }
  if ((await attr(app, '.wz-sliver', 'data-open')) === 'true') { const g = await rectOf(app, '.wz-sliver-grip'); if (g) { await click(app, g.x, g.y); await sleep(600); } }
  return zoomedNow(app);
};
// the hold settled: the scroller still for 1s (capped at 20s)
const settle = async (app) => { const t0 = Date.now(); let last = null; let still = 0;
  while (Date.now() - t0 < 20000) { await sleep(200); const top = await app.evalJs("(() => { const s = document.querySelector('.mode-scroll'); return s ? Math.round(s.scrollTop) : null; })()");
    if (top != null && top === last) { still += 200; if (still >= 1000) return true; } else { still = 0; last = top; } }
  return false; };
// the writer's line - the caret's - inside the stage and the viewport
const CARET_SEEN = `(() => { const s = getSelection(); if (!s || !s.rangeCount) return null; const r = s.getRangeAt(0).cloneRange(); r.collapse(false);
  let q = r.getClientRects()[0] || null;
  if (!q) { const ed = document.querySelector('.forward-only-editor'); if (ed) { const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let last = null, n; while ((n = w.nextNode())) if (n.data.trim()) last = n;
    if (last) { const lr = document.createRange(); lr.setStart(last, Math.max(0, last.data.trimEnd().length - 1)); lr.setEnd(last, last.data.trimEnd().length); q = lr.getClientRects()[0] || null; } } }   // a collapsed range at an element edge has no rect: the end of the text is where the writer is
  if (!q) { const n = s.focusNode && (s.focusNode.nodeType === 1 ? s.focusNode : s.focusNode.parentElement); q = n ? n.getBoundingClientRect() : null; }
  const st = document.querySelector('.desk-frame-stage'); if (!q || !st) return null; const sr = st.getBoundingClientRect();
  return { top: q.top, bottom: q.bottom, seen: q.top >= Math.max(sr.top, 0) - 1 && q.bottom <= Math.min(sr.bottom, innerHeight) + 1 }; })()`;
// the writer at the end of the text, a word typed, the hold settled with the writer's line on screen, then Backspace past the runway until the hint shows (capped)
const raiseHint = async (app, pre) => {
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  await app.typeKeys(' and on'); await sleep(300);
  pre.settled = await settle(app);
  pre.caret = await app.evalJs(CARET_SEEN);
  if (pre.caret && !pre.caret.seen) {   // the premise is the writer's line ON SCREEN: in the normal view nothing scrolls a page seeded long to its end, so the fixture does what the writer's own scrolling does
    await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let last = null, n; while ((n = w.nextNode())) if (n.data.trim()) last = n; if (last && last.parentElement) last.parentElement.scrollIntoView({ block: 'center' }); return true; })()");
    await sleep(300); pre.settled = (await settle(app)) && pre.settled; pre.caret = await app.evalJs(CARET_SEEN);
  }
  for (let i = 0; i < 60; i += 1) {
    await app.key('Backspace'); await sleep(40);
    if (await app.evalJs("!!document.querySelector('.fo-nudge')")) { await sleep(400); return i + 1; }
  }
  return null;
};
const PROBE = `(() => {
  const n = document.querySelector('.fo-nudge'); const ed = document.querySelector('.forward-only-editor'); const page = document.querySelector('.desk-frame-stage--prose .mode-page');
  const st = document.querySelector('.desk-frame-stage'); if (!n || !ed || !page || !st) return null;
  const R = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  const nr = n.getBoundingClientRect(); const pr = page.getBoundingClientRect(); const sr = st.getBoundingClientRect();
  const vis = { top: Math.max(sr.top, 0), bottom: Math.min(sr.bottom, innerHeight) };
  const rg = document.createRange(); rg.selectNodeContents(ed);
  const lines = [...rg.getClientRects()].filter((q) => q.height >= 4 && q.bottom > vis.top && q.top < vis.bottom).map(R);
  const last = lines.reduce((m, q) => (!m || q.bottom > m.bottom ? q : m), null);
  const cs = getComputedStyle(n); const root = getComputedStyle(document.documentElement);
  return { nudge: R(nr), text: n.textContent, page: R(pr), stage: R(sr), vh: innerHeight, vw: innerWidth, lines: lines.length, writing: last,
    hit: lines.filter((q) => q.left < nr.right - 0.5 && nr.left < q.right - 0.5 && q.top < nr.bottom - 0.5 && nr.top < q.bottom - 0.5).length,
    zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null,
    family: cs.fontFamily, style: cs.fontStyle, prose: root.getPropertyValue('--font-prose').trim(), label: root.getPropertyValue('--font-contentLabel').trim(),
    proseUsed: getComputedStyle(ed).fontFamily };
})()`;
const first = (f) => String(f || '').split(',')[0].trim().replace(/["']/g, '').toLowerCase();
const typeOk = (themeId, g) => !!g && (themeId === 'plateau'
  ? first(g.family) === first(g.proseUsed) && g.style === 'italic'
  : first(g.family) === first(g.label) && g.style === 'normal');
const onScreen = (g) => !!g && g.nudge.top >= Math.max(0, g.stage.top) - 0.5 && g.nudge.bottom <= Math.min(g.vh, g.stage.bottom) + 0.5 && g.nudge.left >= 0 && g.nudge.right <= g.vw
  && (g.zoom === 'true' || (g.nudge.top >= g.page.top - 0.5 && g.nudge.bottom <= g.page.bottom + 0.5 && g.nudge.left >= g.page.left - 0.5 && g.nudge.right <= g.page.right + 0.5));

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  ok('fixture: the seams are up', true);

  for (const th of THEMES) {
    for (const zoom of [false, true]) {
      const view = zoom ? 'zoom' : 'normal';
      const tag = `${th.name} ${view}`;
      const id = `${pid(th.id)}-${view}`;
      // a fresh page each case (the hint's struck words change the text), Free Write, the view named
      await app.evalJs("location.hash = '#/'"); await sleep(300);
      await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PARA, createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
      await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'journal'); localStorage.setItem('wrizo-typewriter-page-${id}', '${zoom ? 'on' : 'off'}'); localStorage.setItem('wrizo-theme', '${th.id}')`);
      await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
      await app.reload();
      await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
      if (!(await openPage(app, id))) { ok(`${tag} fixture: the Free Write page opened`, false, ''); continue; }
      const viewNow = await setView(app, zoom);
      const pre = {};
      const presses = await raiseHint(app, pre);
      const g = await app.evalJs(PROBE);
      ok(`${tag} H0 (premise): Backspace past the runway raises the hint (after ${presses} presses), on a page in the ${view} view (set through the writer's Typewriter control) with text on screen, the hold settled and the writer's line on screen before it`,
        presses != null && !!g && (g.zoom === 'true') === zoom && viewNow === zoom && g.lines >= 3 && pre.settled && !!pre.caret && pre.caret.seen,
        J({ presses, zoom: g && g.zoom, viewNow, lines: g && g.lines, text: g && g.text, pre }));
      if (!g) continue;
      ok(`${tag} H1: the hint meets NO line of text on screen - the writing line included`, g.hit === 0, J({ nudge: g.nudge, writing: g.writing, hit: g.hit }));
      ok(`${tag} H2: the hint is on screen - inside the viewport and the stage${zoom ? '' : ', and inside the page'}`, onScreen(g), J({ nudge: g.nudge, page: g.page, stage: g.stage }));
      ok(`${tag} H3: the hint wears ${th.name}'s own type - ${th.id === 'plateau' ? 'its italic prose serif' : 'its own content face, upright'}`, typeOk(th.id, g),
        J({ family: g.family, style: g.style, prose: g.proseUsed, label: g.label }));
      if (th.id === 'plateau' && !zoom) {
        // MH: the hint pinned onto the writing line (its own box moved there) - H1 must fail
        // (review of turn 1: the move is in the hint's own LAYOUT px, inside a page painted at a scale - the unscaled move overshot to -77 in a zoomed
        // case. The screen distance is divided by the page's painted scale.)
        await app.evalJs(`(() => { const n = document.querySelector('.fo-nudge'); const w = ${J(g.writing)}; if (!n || !w) return false; const r = n.getBoundingClientRect();
          const p = n.closest('.mode-page'); const k = p && p.offsetWidth ? p.getBoundingClientRect().width / p.offsetWidth : 1;
          n.style.setProperty('translate', ((w.left - r.left) / k) + 'px ' + ((w.top - r.top) / k) + 'px', 'important'); return true; })()`);
        await sleep(150);
        const gm = await app.evalJs(PROBE);
        ok(`MH (mutant): with the hint pinned onto the writing line (LANDED: its top ${Math.round(g.nudge.top)} -> ${gm && Math.round(gm.nudge.top)}), H1 fails`,
          !!gm && Math.abs(gm.nudge.top - g.writing.top) < 2 && gm.hit > 0, J({ now: gm && gm.nudge, hit: gm && gm.hit }));
      }
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-HINT PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-HINT VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-HINT VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
