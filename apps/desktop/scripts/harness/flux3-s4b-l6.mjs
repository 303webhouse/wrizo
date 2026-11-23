// FLUX3 S4b L6 - THE NODE VOICE, the overlay half (flux3-s4b-plan.md L6; flux-full-look-for-monday.md item 6, tier B; Fable, Nov 21, 6:54 pm: "hold the caps titles (S1: cards
// never move). Build the lime presets and the 'UNRESOLVED // HUMAN' footer now (overlay only)"). The source is the Oct 28 board mockup (flux-circuit-mockup-A-schema.html:
// .node.k-preset .ttl lime; .ft .st, status(): ink "RASTER // HUMAN", every other node "UNRESOLVED // HUMAN"). Read on a board behind ?flux3=1 (Flux theme).
//   THEATRE  under the Ambiance dial, each node's footer carries its status in the chrome face's capitals: a text node (a preset step too) and a doc node read UNRESOLVED // HUMAN,
//            an ink node RASTER // HUMAN; a node the writer lit reads CHECKSUM OK in its place (her act wins)
//   DIAL     at Ambiance 0 the theatre is gone (the counts and CHECKSUM OK stay)
//   LIME     a preset node's first line is drawn in the lime of the preset brackets; a plain text node's is not
//   RECT     no card moves: every card's rect is the same with the L6 dress taken away (S1: cards never move under the flag); the text in a card is never the theatre's
//   OFF      without the flag there is no node record and no lime line
//   MUT      the readers can go red: with the L6 dress taken away, THEATRE and LIME read false
// Run: node scripts/harness/flux3-s4b-l6.mjs (from apps/desktop; a box turn or Actions).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const BOARD = 'l6-board';
const LIME = 'rgb(183, 255, 60)';

const INSTRUMENT = `(() => {
  if (window.__l6) return;
  const I = window.__l6 = {};
  I.node = (id) => { const b = document.querySelector('.board-canvas .board-box[data-box-id="' + id + '"]'); if (!b) return null;
    const f = b.querySelector(':scope > .flux3-node > .flux3-node-f'), t = b.querySelector('.board-text');
    const after = f ? getComputedStyle(f, '::after') : null, line = t ? getComputedStyle(t, '::first-line') : null, r = b.getBoundingClientRect();
    return { kind: b.getAttribute('data-kind'), node: !!b.querySelector(':scope > .flux3-node'), st: f ? f.getAttribute('data-st') : null, ok: f ? f.getAttribute('data-ok') : null,
      after: after ? after.content : null, tt: after ? after.textTransform : null, firstLine: line ? line.color : null, text: t ? (t.textContent || '').trim() : null,
      rect: [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(',') }; };
  // the control arm: the L6 dress away (the theatre attribute and every flag-scoped rule naming it or the preset's first line)
  I.undress = () => { let n = 0; document.querySelectorAll('.flux3-node-f[data-st]').forEach((e) => { e.removeAttribute('data-st'); n += 1; });
    for (const sh of [...document.styleSheets]) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      for (let i = rules.length - 1; i >= 0; i--) { const t = rules[i].selectorText || ''; if (t.indexOf('data-flux3') >= 0 && (t.indexOf('[data-st]') >= 0 || t.indexOf('first-line') >= 0)) { sh.deleteRule(i); n += 1; } } } return n; };
})()`;

const says = (n, word) => !!n && n.node && typeof n.after === 'string' && n.after.toLowerCase().includes(word.toLowerCase()) && n.tt === 'uppercase';

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();

  // ---- the fixture (seams only): a board with a plain text node, a preset step, a lit text node, an ink node and a doc node ------------------------------------------------
  const at = new Date().toISOString();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'l6-doc', text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  const T = (id, x, y, z, text, extra = {}) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const boxes = [
    T('l6-text', 0.05, 0.05, 1, 'A plain node\nIts body line.'),
    T('l6-preset', 0.5, 0.05, 2, 'The hook\nThe step body.', { deckStep: { deck: 'three-act', step: 'hook' } }),
    T('l6-lit', 0.05, 0.4, 3, 'A lit node', { lit: true }),
    { id: 'l6-ink', kind: 'ink', x: 0.5, y: 0.4, w: 0.2, h: 0.12, z: 4, strokes: [] },
    { id: 'l6-pin', kind: 'page-pin', entryId: 'l6-doc', x: 0.05, y: 0.7, w: 0.2, h: 0.15, z: 5 },
    { id: 'l6-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 2600 },
  ];
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Schema L6', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await ev('window.wrizoFlushNow(); null');
  await sleep(400);

  const open = async ({ flag = true, dial = '50' } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(dial)}); })()`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"l6-text\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1500);
  };
  const node = (id) => ev(`window.__l6.node(${JSON.stringify(id)})`);
  const ids = ['l6-text', 'l6-preset', 'l6-lit', 'l6-ink', 'l6-pin'];
  const all = async () => { const o = {}; for (const id of ids) o[id] = await node(id); return o; };

  // ---- THEATRE, LIME (and RECT, MUT through the same page's control arm) --------------------------------------------------------------------------------------------------
  await open();
  const n = await all();
  ok('THEATRE under the dial each footer carries its status in capitals: text, preset and doc nodes UNRESOLVED // HUMAN, ink RASTER // HUMAN, and a lit node CHECKSUM OK in its place',
    says(n['l6-text'], 'Unresolved // human') && says(n['l6-preset'], 'Unresolved // human') && says(n['l6-pin'], 'Unresolved // human') && says(n['l6-ink'], 'Raster // human')
      && says(n['l6-lit'], 'Checksum OK') && !String(n['l6-lit'].after).toLowerCase().includes('unresolved'), n);
  ok('LIME a preset node\'s first line is drawn in the preset\'s lime; a plain text node\'s is not',
    !!n['l6-preset'] && n['l6-preset'].firstLine === LIME && !!n['l6-text'] && n['l6-text'].firstLine !== LIME && n['l6-preset'].text.startsWith('The hook'), { preset: n['l6-preset'], text: n['l6-text'] });
  const removed = await ev('window.__l6.undress()'); await sleep(300);
  const m = await all();
  ok('RECT no card moves: every card\'s rect is the same with the L6 dress taken away; a card\'s text is its own (the theatre is never in it)',
    removed > 0 && ids.every((id) => !!n[id] && !!m[id] && n[id].rect === m[id].rect) && !/unresolved|raster|checksum/i.test(n['l6-text'].text || '') && !/unresolved|raster|checksum/i.test(n['l6-lit'].text || ''),
    { removed, before: ids.map((id) => n[id] && n[id].rect), after: ids.map((id) => m[id] && m[id].rect) });
  ok('MUT with the L6 dress taken away, THEATRE and LIME read false (the readers can go red)', removed > 0 && !says(m['l6-text'], 'Unresolved // human') && m['l6-preset'].firstLine !== LIME, m);

  // ---- DIAL 0 ---------------------------------------------------------------------------------------------------------------------------------------------------------------
  await open({ dial: '0' });
  const z = await all();
  ok('DIAL at Ambiance 0 the theatre is gone; the counts and CHECKSUM OK stay', !!z['l6-text'] && z['l6-text'].node && !says(z['l6-text'], 'Unresolved // human') && !says(z['l6-ink'], 'Raster // human') && says(z['l6-lit'], 'Checksum OK'), z);

  // ---- OFF ------------------------------------------------------------------------------------------------------------------------------------------------------------------
  await open({ flag: false });
  const off = await all();
  ok('OFF without the flag there is no node record and no lime line', ids.every((id) => !!off[id] && !off[id].node) && off['l6-preset'].firstLine !== LIME, off);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

const EXPECTED = 6;
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 1500)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nFLUX3-S4B-L6 VERIFY: FAIL - ${bad}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}` : `\nFLUX3-S4B-L6 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
