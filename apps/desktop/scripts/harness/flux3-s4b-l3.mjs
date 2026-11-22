// FLUX3 S4b L3 - CAPS CHROME (flux3-s4b-plan.md L3; flux-full-look-for-monday.md item 3, tier A, the Flux bonus: Fable, Nov 21, 4:58 pm; the source is the Oct 28 mockup,
// flux-page-mockup-2-schema-doc.html #top .crumb and .tab). Every check is read in the live page behind ?flux3=1 (Flux theme).
//   CRUMB    on a page and on a board, the crumb reads in the chrome face's capitals, letter-spaced: every step uppercase, letter-spacing >= .1em, the chrome face (not the UI
//            face); the steps between are drawn as ▸ (the "/" is not drawn); the place words are quiet (--text-low) and where she stands is bright (--text-hi)
//   VIEWS    the board's Show as names its views as WORDS, all the time (not only on hover): every button shows its word (the lexicon's own: LIVE, SEQUENCE, SPINE, TRACE, and the
//            Stack's STACK) in capitals, and draws no icon
//   RECT     the dress adds nothing to any layout: on the page and the board, at 1366 and 1920, the bar's height, the page's (or board's) rect and the host's are the same with the
//            L3 rules taken away in the same page (page primacy)
//   OFF      without the flag the crumb and Show as are exactly what they were (no capitals on the crumb, the words hidden until hover, the icons drawn)
//   MUT      the reader can go red: with the L3 rules taken away, CRUMB and VIEWS read false (a reader that cannot fail proves nothing)
// FLUX3_SHOTS=<dir> writes frames. Run: node scripts/harness/flux3-s4b-l3.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });

const INSTRUMENT = `(() => {
  if (window.__l3) return;
  const I = window.__l3 = {};
  const px = (v) => parseFloat(v) || 0;
  const rgb = (v) => { const d = document.createElement('i'); d.style.color = v; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
  I.crumb = () => { const c = document.querySelector('.sprint-nav .sprint-crumb'); if (!c) return null;
    const steps = [...c.querySelectorAll('.crumb-item, .wz-crumb-home, .crumb-here, .crumb-rename-btn')].filter((e) => !e.matches('.crumb-here .crumb-rename-btn'));
    const seps = [...c.querySelectorAll('.crumb-sep')];
    const root = getComputedStyle(document.documentElement);
    const low = rgb(root.getPropertyValue('--text-low').trim()), hi = rgb(root.getPropertyValue('--text-hi').trim()), ui = root.getPropertyValue('--font-ui').trim(), chrome = root.getPropertyValue('--font-chromeLabel').trim();
    const read = (e) => { const s = getComputedStyle(e); return { cls: e.className, text: (e.textContent || '').trim(), tt: s.textTransform, ls: px(s.letterSpacing), fs: px(s.fontSize), ff: s.fontFamily, color: s.color }; };
    return { steps: steps.map(read), seps: seps.map((e) => { const s = getComputedStyle(e), b = getComputedStyle(e, '::before'); return { fs: px(s.fontSize), before: b.content, bfs: px(b.fontSize), w: Math.round(e.getBoundingClientRect().width) }; }),
      low, hi, chrome, ui }; };
  I.views = () => { const g = document.querySelector('.show-as'); if (!g) return null;
    return [...g.querySelectorAll('.show-as-btn')].map((b) => { const w = b.querySelector('.show-as-word'), svg = b.querySelector(':scope > svg'), s = w ? getComputedStyle(w) : null;
      return { view: b.getAttribute('data-view') || (b.hasAttribute('data-flux3-stack-tab') ? 'stack' : null), word: w ? (w.textContent || '').trim() : null, shown: !!w && s.display !== 'none' && w.getBoundingClientRect().width > 0,
        tt: getComputedStyle(b).textTransform, icon: !!svg && getComputedStyle(svg).display !== 'none' && svg.getBoundingClientRect().width > 0 }; }); };
  I.rects = () => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); };
    return { bar: q('.sprint-nav'), page: q('.mode-page'), col: q('.mode-pagecol'), editor: q('.forward-only-editor'), board: q('.board-canvas-wrap'), host: q('.desk-frame-host') }; };
  // the control arm: the L3 rules away (every flag-scoped rule on the crumb or Show as), the same page without the caps dress
  I.undress = () => { let n = 0; for (const sh of [...document.styleSheets]) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
    for (let i = rules.length - 1; i >= 0; i--) { const t = rules[i].selectorText || ''; if (t.indexOf('data-flux3') >= 0 && (t.indexOf('sprint-crumb') >= 0 || t.indexOf('show-as') >= 0)) { sh.deleteRule(i); n += 1; } } } return n; };
})()`;

// a font list compared as written (computed styles and tokens may quote differently)
const norm = (f) => String(f || '').replace(/[\s'"]/g, '').toLowerCase();
// a crumb in caps: every step uppercase, letter-spaced (>= .1em of its own size), in the chrome face and not the UI face; ▸ between, the "/" not drawn; quiet places, bright here
const crumbCaps = (c) => !!c && c.steps.length >= 2 && c.seps.length >= 1
  && c.steps.every((s) => s.tt === 'uppercase' && s.ls >= 0.1 * s.fs - 0.01 && !!c.chrome && norm(s.ff) === norm(c.chrome) && norm(s.ff) !== norm(c.ui))
  && c.seps.every((p) => p.fs === 0 && /▸/.test(p.before) && p.bfs > 0)
  && c.steps.filter((s) => !/crumb-here|crumb-rename-btn/.test(s.cls)).every((s) => s.color === c.low)
  && c.steps.filter((s) => /crumb-here|crumb-rename-btn/.test(s.cls)).length >= 1 && c.steps.filter((s) => /crumb-here|crumb-rename-btn/.test(s.cls)).every((s) => s.color === c.hi);
const WORDS = { open: 'Live', storyboard: 'Sequence', outline: 'Spine', walk: 'Trace', stack: 'Stack' };
const viewWords = (v) => Array.isArray(v) && v.length >= 3 && v.some((b) => b.view === 'stack')
  && v.every((b) => b.shown && !b.icon && b.tt === 'uppercase' && (!WORDS[b.view] || b.word === WORDS[b.view]));

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();

  // ---- the fixture (seams only): a Drawer "Harbor" holding a set "Tolls" with a page and a board, so both crumbs carry places and a step between ---------------------------
  const ids = await ev(`(() => {
    const W = window;
    const d = W.wrizoCreateDrawer('Harbor'); const set = W.wrizoCreateProject('Tolls'); W.wrizoSetProjectDrawer(set.id, d.id);
    W.wrizoCreateJournalPage({ id: 'l3-p1', text: 'The tolls rose at dawn.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'project', source: 'page', projectId: set.id, orderIndex: 0 });
    W.wrizoCreateJournalPage({ id: 'l3-b1', text: 'Board Tolls', createdAt: '2026-04-01T00:00:01.000Z', origin: 'project', source: 'page', projectId: set.id, orderIndex: 1, pageType: 'board',
      boxes: [{ id: 'l3-b1-a', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Card A' }, { id: 'l3-b1-b', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.1, z: 2, text: 'Card B' }] });
    W.wrizoFlushNow();
    return { set: set.id, drawer: d.id };
  })()`);

  const open = async (id, { flag = true, w = 1920, h = 1080 } = {}) => {
    await app.emulateDpr(1, w, h);
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');
      localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); })()`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("(!!document.querySelector('.forward-only-editor') || !!document.querySelector('.board-canvas-wrap')) && !!document.querySelector('.sprint-nav .sprint-crumb')", { timeout: 15000, label: `the room ${id}` }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1400);
  };
  const crumb = () => ev('window.__l3.crumb()');
  const views = () => ev('window.__l3.views()');
  const rects = () => ev('window.__l3.rects()');

  // ---- CRUMB + VIEWS (and RECT, MUT through the same page's control arm) ---------------------------------------------------------------------------------------------
  const page1920 = {}, board1920 = {}, page1366 = {}, board1366 = {};
  for (const [store, id, w, h] of [[page1920, 'l3-p1', 1920, 1080], [board1920, 'l3-b1', 1920, 1080], [page1366, 'l3-p1', 1366, 768], [board1366, 'l3-b1', 1366, 768]]) {
    await open(id, { w, h });
    store.crumb = await crumb(); store.views = id === 'l3-b1' ? await views() : null; store.rect = await rects();
    await snap(`l3-${id}-${w}`);
    store.removed = await ev('window.__l3.undress()'); await sleep(300);
    store.crumbOff = await crumb(); store.viewsOff = id === 'l3-b1' ? await views() : null; store.rectOff = await rects();
  }
  ok('CRUMB [page, 1920] the crumb reads in the chrome face\'s letter-spaced capitals, ▸ between its steps, the places quiet and where she stands bright', crumbCaps(page1920.crumb), { ids, crumb: page1920.crumb });
  ok('CRUMB [board, 1920] the same on the board\'s crumb', crumbCaps(board1920.crumb), board1920.crumb);
  ok('VIEWS [board, 1920] Show as names every view as a WORD, all the time, in capitals, with no icon: LIVE, SEQUENCE, SPINE, TRACE and the Stack\'s STACK', viewWords(board1920.views), board1920.views);
  ok('VIEWS [board, 1366] the same at 1366', viewWords(board1366.views) && crumbCaps(board1366.crumb), { views: board1366.views, crumb: board1366.crumb });
  const same = (s, keys) => keys.every((k) => s.rect[k] !== null && s.rect[k] === s.rectOff[k]);
  ok('RECT [page] the bar\'s height, the page\'s rects and the host are the same with the L3 rules taken away (1366 and 1920)',
    page1920.removed > 0 && page1366.removed > 0 && same(page1920, ['bar', 'page', 'col', 'editor', 'host']) && same(page1366, ['bar', 'page', 'col', 'editor', 'host']), { page1920: [page1920.rect, page1920.rectOff, page1920.removed], page1366: [page1366.rect, page1366.rectOff] });
  ok('RECT [board] the bar\'s height, the board\'s rect and the host are the same with the L3 rules taken away (1366 and 1920)',
    board1920.removed > 0 && same(board1920, ['bar', 'board', 'host']) && same(board1366, ['bar', 'board', 'host']), { board1920: [board1920.rect, board1920.rectOff, board1920.removed], board1366: [board1366.rect, board1366.rectOff] });
  ok('MUT with the L3 rules taken away, CRUMB and VIEWS read false (the reader can go red)', page1920.removed > 0 && !crumbCaps(page1920.crumbOff) && !viewWords(board1920.viewsOff), { crumbOff: page1920.crumbOff, viewsOff: board1920.viewsOff });

  // ---- OFF: without the flag, nothing changes ----------------------------------------------------------------------------------------------------------------------
  await open('l3-b1', { flag: false });
  const off = { flag: await ev("document.documentElement.hasAttribute('data-flux3')"), crumb: await crumb(), views: await views() };
  ok('OFF without the flag the crumb is not in capitals and Show as keeps its icons with the words hidden until hover',
    !off.flag && !!off.crumb && off.crumb.steps.length >= 2 && off.crumb.steps.every((s) => s.tt !== 'uppercase') && Array.isArray(off.views) && off.views.length >= 3 && off.views.every((b) => b.icon && !b.shown), off);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

const EXPECTED = 8;
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 1500)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nFLUX3-S4B-L3 VERIFY: FAIL - ${bad}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}` : `\nFLUX3-S4B-L3 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
