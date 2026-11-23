// FLUX3 S4b L6, THE TITLE ROW (Fable, Nov 21, 11:20 pm, reading A: "A title row only where a title field exists (a preset step's title, a doc node's page title); plain
// cards get none. One line, '…', Doc nodes in serif, presets lime, nothing moves. Red first." The Wrizors: "as its own title row outside the card's text (the mockup's .ttl)").
// The title is the card's own (store/guided.ts splitCard: a dealt step's title is the step's name) or the pinned page's first line; it is painted from a data attribute on
// the node record (an overlay), above the record's header, so it is never the card's text and no card moves (S1). Read on a board behind ?flux3=1 (Flux theme).
//   PRESET  a preset step's node carries a title row reading its step title in the chrome face's capitals, in lime, above the record's header and outside the card
//   DOC     a doc node's title row reads its page's title in the serif, not in capitals
//   NONE    a plain text node and an ink node carry no title row
//   LINE    a long title stays on one line and ends in "…" (it never wraps)
//   RECT    no card moves: every card's rect is the same with the title rows taken away (S1: cards never move under the flag)
//   OFF     without the flag there is no title row
//   MUT     the reader can go red: with the title rows taken away, PRESET reads false
// Run: node scripts/harness/flux3-s4b-l6t.mjs (from apps/desktop; a box turn or Actions).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const BOARD = 'l6t-board';
const LIME = 'rgb(183, 255, 60)';
const LONG = 'A very long step title that keeps going well past the width of its node so that it must end in an ellipsis';

const INSTRUMENT = `(() => {
  if (window.__l6t) return;
  const I = window.__l6t = {};
  I.node = (id) => { const b = document.querySelector('.board-canvas .board-box[data-box-id="' + id + '"]'); if (!b) return null;
    const rec = b.querySelector(':scope > .flux3-node'), t = rec ? rec.querySelector(':scope > [data-flux3-node-title]') : null, h = rec ? rec.querySelector(':scope > .flux3-node-h') : null;
    const br = b.getBoundingClientRect();
    if (!t) return { node: !!rec, title: null, rect: [br.left, br.top, br.width, br.height].map((n) => Math.round(n * 10) / 10).join(',') };
    const s = getComputedStyle(t), a = getComputedStyle(t, '::after'), tr = t.getBoundingClientRect(), hr = h ? h.getBoundingClientRect() : null;
    return { node: true, title: t.getAttribute('data-title'), after: a.content, tt: a.textTransform || s.textTransform, color: a.color || s.color, ff: a.fontFamily || s.fontFamily,
      ws: s.whiteSpace, to: s.textOverflow, overflow: s.overflow, lineH: parseFloat(s.lineHeight) || 0, h: tr.height, w: tr.width, sw: t.scrollWidth, cw: t.clientWidth,
      above: !!hr && tr.bottom <= hr.top + 0.5 && tr.bottom <= br.top + 0.5, prose: getComputedStyle(document.documentElement).getPropertyValue('--font-proseSerif').trim(),
      rect: [br.left, br.top, br.width, br.height].map((n) => Math.round(n * 10) / 10).join(',') }; };
  I.undress = () => { let n = 0; document.querySelectorAll('[data-flux3-node-title]').forEach((e) => { e.remove(); n += 1; }); return n; };
})()`;
const norm = (f) => String(f || '').replace(/[\s'"]/g, '').toLowerCase();

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

  // ---- the fixture (seams only): a preset step, a long-titled preset step, a plain text node, an ink node, and a doc node pinning a page ------------------------------------
  const at = new Date().toISOString();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'l6t-doc', text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  // createJournalPage sets a page's pageSettings itself (it ignores a passed one): the name goes on through the patch seam, merged into what the page was born with
  await ev(`(() => { const W = window; const e = W.wrizoCreateJournalPage(${JSON.stringify({ id: 'l6t-named', text: 'Its first line is not its name\nMore.', createdAt: at, origin: 'journal', source: 'page' })});
    W.wrizoPatchEntry('l6t-named', { pageSettings: { ...((e && e.pageSettings) || {}), name: 'Chapter Seven' } }); W.wrizoFlushNow(); return null; })()`);
  const T = (id, x, y, z, text, extra = {}) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const boxes = [
    T('l6t-preset', 0.05, 0.08, 1, 'The hook\nThe step body.', { deckStep: { deck: 'three-act', step: 'hook' } }),
    T('l6t-long', 0.5, 0.08, 2, LONG + '\nIts body.', { deckStep: { deck: 'three-act', step: 'hook' } }),
    T('l6t-text', 0.05, 0.4, 3, 'A plain node\nIts body line.'),
    { id: 'l6t-ink', kind: 'ink', x: 0.5, y: 0.4, w: 0.2, h: 0.12, z: 4, strokes: [] },
    { id: 'l6t-pin', kind: 'page-pin', entryId: 'l6t-doc', x: 0.05, y: 0.7, w: 0.2, h: 0.15, z: 5 },
    // NAME (Fable, Nov 21, 11:55 pm, the NIT): a pinned page that carries its own name (pageSettings.name)
    { id: 'l6t-pin2', kind: 'page-pin', entryId: 'l6t-named', x: 0.5, y: 0.7, w: 0.2, h: 0.15, z: 6 },
    { id: 'l6t-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 2600 },
  ];
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Schema L6 title', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await ev('window.wrizoFlushNow(); null');
  await sleep(400);

  const open = async ({ flag = true } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50'); })()`);
    // [the Flux pin, Fable Nov 23 2:30 pm: FLUX3 is on by default, so "off" must be asked with ?flux3=0] was: await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${BOARD}')`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/?flux3=0')} + '#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"l6t-text\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1500);
  };
  const ids = ['l6t-preset', 'l6t-long', 'l6t-text', 'l6t-ink', 'l6t-pin'];
  const all = async () => { const o = {}; for (const id of ids) o[id] = await ev(`window.__l6t.node(${JSON.stringify(id)})`); return o; };
  const presetOk = (n) => !!n && n.title === 'The hook' && /the hook/i.test(n.after) && n.tt === 'uppercase' && n.color === LIME && n.above && n.ws === 'nowrap';

  await open();
  const n = await all();
  ok('PRESET a preset step\'s node carries a title row: its step title in capitals, in lime, above the record\'s header and outside the card', presetOk(n['l6t-preset']), n['l6t-preset']);
  ok('DOC a doc node\'s title row reads its page\'s title in the serif, not in capitals', !!n['l6t-pin'] && n['l6t-pin'].title === 'The doc node' && n['l6t-pin'].tt !== 'uppercase'
    && !!n['l6t-pin'].prose && norm(n['l6t-pin'].ff).startsWith(norm(n['l6t-pin'].prose).split(',')[0]) && n['l6t-pin'].above, n['l6t-pin']);
  ok('NONE a plain text node and an ink node carry no title row (and each still has its record)', !!n['l6t-text'] && n['l6t-text'].node && n['l6t-text'].title === null && !!n['l6t-ink'] && n['l6t-ink'].node && n['l6t-ink'].title === null, { text: n['l6t-text'], ink: n['l6t-ink'] });
  const L = n['l6t-long'];
  ok('LINE a long title stays on one line and ends in "…" (it never wraps)', !!L && L.title === LONG && L.ws === 'nowrap' && L.to === 'ellipsis' && L.overflow === 'hidden' && L.sw > L.cw && L.lineH > 0 && L.h <= L.lineH + 1, L);
  const removed = await ev('window.__l6t.undress()'); await sleep(300);
  const m = await all();
  ok('RECT no card moves: every card\'s rect is the same with the title rows taken away', removed > 0 && ids.every((id) => !!n[id] && !!m[id] && n[id].rect === m[id].rect), { removed, before: ids.map((id) => n[id] && n[id].rect), after: ids.map((id) => m[id] && m[id].rect) });
  ok('MUT with the title rows taken away, PRESET reads false (the reader can go red)', removed > 0 && !presetOk(m['l6t-preset']), m['l6t-preset']);
  // NAME (the NIT): read after a fresh open, beside the unnamed DOC above (which keeps its first line)
  await open();
  const named = await ev("window.__l6t.node('l6t-pin2')");
  ok('NAME a doc node whose page has its own name shows that name (not its first line); a page without one shows its first line (DOC)', !!named && named.title === 'Chapter Seven' && named.above, named);

  await open({ flag: false });
  const off = await all();
  ok('OFF without the flag there is no title row', ids.every((id) => !!off[id] && off[id].title === null), off);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

const EXPECTED = 8;   // 7 + NAME (Fable, Nov 21, 11:55 pm)
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 1500)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nFLUX3-S4B-L6T VERIFY: FAIL - ${bad}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}` : `\nFLUX3-S4B-L6T VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
