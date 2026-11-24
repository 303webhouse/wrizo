// THE REORG'S BACK MENU IN FLUX, IN THE APP (Fable, Nov 21: Flux piece 2; claude/wrizors/flux-reorg-spec.md section 5). Flux theme ON THE REDESIGN (?flux3=1: every Flux reorg piece is built on it, Nick, Nov 21, 4:40 pm), the dark room, ?reorg=1 with the PREVIEW DOOR (&reorglift=flux.back: reorg/themeGate.ts keeps flux.back OFF in the table until
// Fable clears it; the door only shows the piece). The stylesheet's half is reorg-flux-back-css-unit.mjs; this proves what only the app can.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": two pages -> two Parts, fb-1 "Arrival" (its Plan is the board fb-own: three cards, one attached to it), fb-2 "The town"; the Doc's own assets: a page and a card.
//   FB1  the tab row reads SPINE, INPUTS, OPERATOR, in that order, and the drawer opens on INPUTS (the Back menu opens on its assets tab, as Machina's does)
//   FB2  the search door is in Flux's field dress: fill #020C10, a 1 px #5F8F95 edge; opened, the search field's focus is a cyan edge with the 3 x 24 brass bar
// SUPERSEDED (Nov 21, the Wrizors' case ruling: Flux's own case, sentence case for buttons, so the Spine row's button reads "Open track"), kept verbatim:
//   FB3  nothing is left raw: the sort row, the group heads and the "+" are drawn in Flux's dress (no browser-grey button fill, no white field), and Flux's words are the ones shown ("→ Track", "Open Track", "Inputs", "This Doc")
//   FB3  [successor] the same, with the Spine row's button in Flux's case: "Open track"
//   FB4  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after opening the Back menu and moving through its three tabs; the editor is the same node
//   FB5  piece OFF without the door: in Flux the drawer is today's (no Spine tab, no reorg markup), the table's flux.back is still off
//   FB8  the row names keep their room (none cut) and the open tab wears the 3 x 24 brass bar (the Wrizors Flux pass 1, REAL 4 and NIT 1)
//   FB9  Uplink keeps the bar one row and the page rectangle; the view lies over the page, has no box, and its buttons and ticks are in Flux dress (REAL 1, 2 and 3)
//   FB15 Wire In (the Corridor): the Writing prompt button is wholly inside the opened panel (not scrolled out of view)
//   FB13 Wire In (the Corridor): the opened Back menu ends above her line (the Wrizors' pass 2)
//   FB14 the Operator's fields are in field dress with #7EB4C4 hints (pass 2)
//   FB16 Wire In (the Corridor): a press on her page lands on her page, with the Back menu open and shut (its full-stage anchor is drawn but click-through); MUT-FB16 the anchor taking the pointer again goes red
//   FB11 Wire In (the Corridor): the Back menu's opener and its opened panel are drawn and can be pressed; the left hand and the rail stay off (spec section 5)
//   FB10 the Uplink sheet's label row starts below the page's L4 readout header (the Wrizors' Flux Uplink frames, Nov 23)
//   FB7  the rule (Nick, Nov 21, 4:40 pm): the plain Flux never has the reorg: with ?flux3=1 off, even the preview door gives Flux no Back menu
//   FB6  Wire In: Spine and Inputs are locked and say "Wired in: the Operator sends prompts only." in Flux's words; only the Operator can be used
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-flux-back-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const link = (id, boxId, toEntry) => ({ id, aEntryId: 'fb-own', aBoxId: boxId, bEntryId: toEntry, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' });
const TABS = "(() => { const row = document.querySelector('.wz-tutor-panel .wz-drawer-tabs'); if (!row) return null; return [...row.querySelectorAll('.wz-drawer-tab')].map((b) => ({ id: b.id.replace('wz-tutor-tab-', ''), text: (b.textContent || '').trim(), on: b.getAttribute('data-on') === 'true', locked: b.getAttribute('data-locked') === 'true' })); })()";
const CS = (sel, props, pseudo) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; const c = getComputedStyle(e${pseudo ? ', ' + q(pseudo) : ''}); return ${q(props)}.reduce((o, p) => { o[p] = c.getPropertyValue(p); return o; }, {}); })()`;

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('fb-own', 'Plan board', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'The opening image', 0, 0.05), card('c2', 'The turn', 1, 0.2), card('c3', 'The close', 2, 0.35)])} });
    page('fb-note', 'Field notes\\nThe rain came late.', { origin: 'loose' });
    page('fb-1', 'The harbour was quiet when she arrived.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('fb-2', 'By the second week the town had decided what she was.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    W.wrizoPatchEntry('fb-1', { pageSettings: ${PS}, name: 'Arrival', level: 0 }, planBoardId: 'fb-own' });
    W.wrizoPatchEntry('fb-2', { pageSettings: ${PS}, name: 'The town', level: 0 } });
    W.wrizoPatchEntry('fb-own', { pageLinks: ${q([link('l1', 'c1', 'fb-1')])} });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, { w = 1366, lift = 'flux.back', flux3 = true, reorg = 1 } = {}) {
  await app.emulateDpr(1, w, 768);
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 });   // item141: the seam is read only after a settle
  await app.evalJs("window.wrizoTheme.set('flux'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=${reorg}&arbor2=0${flux3 ? '&flux3=1' : '&flux3=0'}${lift ? '&reorglift=' + lift : ''}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const drawer = async (app) => { if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); } };
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click(); null`); await sleep(500); };

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'fb-1');
  await app.evalJs("(() => { const D = window.wrizoDocSettings; D.addAsset('fb-1', { entryId: 'fb-note' }); D.addAsset('fb-1', { entryId: 'fb-own', boxId: 'c2' }); window.wrizoFlushNow(); return null; })()");
  await sleep(500);
  await drawer(app);
  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__fbMark = 1; " + PAGE);
  const tabs = await app.evalJs(TABS);
  ok('FB1 the tab row reads SPINE, INPUTS, OPERATOR, in that order, and the drawer opens on INPUTS',
    Array.isArray(tabs) && tabs.map((x) => x.text.toUpperCase()).join(',') === 'SPINE,INPUTS,OPERATOR' && tabs.map((x) => x.on).join(',') === 'false,true,false', tabs);

  await tab(app, 'plan');
  const door = await app.evalJs(CS('.reorg-search-door', ['background-color', 'border-top-color', 'border-top-width', 'border-top-style']));
  await app.evalJs(press('.reorg-search-door input')); await sleep(600);
  const field = await app.evalJs(CS('.reorg-search-field', ['border-top-color']));
  const bar = await app.evalJs(CS('.reorg-search-field', ['width', 'height', 'background-color'], '::before'));
  const fieldFocused = await app.evalJs("(() => { const f = document.querySelector('.reorg-search-field'); return !!f && f.matches(':focus-within'); })()");
  ok('FB2 the search door is in Flux\'s field dress (fill #020C10, 1 px #5F8F95); opened, the field\'s focus is a cyan edge with the 3 x 24 brass bar',
    !!door && door['background-color'] === 'rgb(2, 12, 16)' && door['border-top-color'] === 'rgb(95, 143, 149)' && door['border-top-width'] === '1px' && door['border-top-style'] === 'solid'
    && !!field && fieldFocused === true && field['border-top-color'] === 'rgb(0, 194, 255)' && !!bar && bar.width === '3px' && bar.height === '24px' && bar['background-color'] !== 'rgba(0, 0, 0, 0)' && bar['background-color'] !== 'rgb(0, 194, 255)', { door, field, bar, fieldFocused });
  await app.evalJs(press('[data-search-back]')); await sleep(400);

  await tab(app, 'links');
  const raw = await app.evalJs("(() => { const bad = []; const root = document.querySelector('.wz-tutor-panel'); for (const b of root.querySelectorAll('.wz-assets-sort > button, .wz-assets-add, .wz-back-part-head')) { const c = getComputedStyle(b); if (/^rgb\\((239|233|240), \\1, \\1\\)$/.test(c.backgroundColor) || c.borderTopColor === 'rgb(118, 118, 118)') bad.push(b.className || b.textContent.slice(0, 12)); } const f = document.querySelector('.reorg-search-door'); const text = (root.textContent || ''); return { bad, sortBtns: root.querySelectorAll('.wz-assets-sort > button').length, heads: root.querySelectorAll('.wz-back-part-head').length, hasThisDoc: /this doc/i.test(text), inputs: /inputs/i.test(text) }; })()");
  await tab(app, 'plan');
  const spine = await app.evalJs("(() => { const root = document.querySelector('.wz-tutor-panel'); return { toTrack: [...root.querySelectorAll('button')].some((b) => /^\\u2192 Track$/.test((b.textContent || '').trim())), openTrack: [...root.querySelectorAll('button')].some((b) => /^Open track$/.test((b.textContent || '').trim())) }; })()");
  ok('FB3 nothing is left raw: the sort row, group heads and "+" are drawn in Flux\'s dress (no browser-grey fill or border), and Flux\'s words show ("→ Track", "Open track", "Inputs", "This Doc")',
    !!raw && raw.bad.length === 0 && raw.sortBtns === 4 && raw.heads >= 1 && raw.hasThisDoc && raw.inputs && !!spine && spine.toTrack && spine.openTrack, { raw, spine });

  await tab(app, 'tutor'); await tab(app, 'links'); await tab(app, 'plan');
  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__fbMark");
  const geo = { w1366: mark === after && same };
  await open(app, 'fb-1', { w: 1920 });
  await drawer(app);
  const m2 = await app.evalJs(PAGE);
  await tab(app, 'links'); await tab(app, 'tutor'); await tab(app, 'plan');
  geo.w1920 = m2 === (await app.evalJs(PAGE));
  ok('FB4 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after opening the Back menu and moving through its three tabs; the editor is the same node', geo.w1366 && geo.w1920, { geo, mark, after, m2 });

  // FB8 (the Wrizors' Flux pass 1, REAL 4 and NIT 1): the row names keep their room (no name cut to a few letters; its buttons wrap under it) and the open tab wears Flux's brass bar
  await open(app, 'fb-1');
  await app.evalJs("(() => { const D = window.wrizoDocSettings; D.addAsset('fb-1', { entryId: 'fb-note' }); D.addAsset('fb-1', { entryId: 'fb-own', boxId: 'c2' }); window.wrizoFlushNow(); return null; })()");
  await sleep(500);
  await drawer(app); await tab(app, 'links');
  const rows = await app.evalJs("(() => { const out = []; for (const e of document.querySelectorAll('.wz-tutor-panel .wz-back-asset .wz-links-label, .wz-tutor-panel .wz-back-boardname')) { const r = e.getBoundingClientRect(); out.push({ t: (e.textContent || '').trim().slice(0, 28), w: Math.round(r.width), cut: e.scrollWidth > e.clientWidth + 1 }); } return out; })()");
  const tabBar = await app.evalJs(CS('#wz-tutor-tab-links', ['width', 'height', 'background-color'], '::before'));
  ok('FB8 the row names keep their room (none cut: each label is at least 90 px wide and not clipped) and the open tab wears the 3 x 24 brass bar',
    Array.isArray(rows) && rows.length >= 3 && rows.every((x) => x.w >= 90 && !x.cut) && !!tabBar && tabBar.width === '3px' && tabBar.height === '24px' && tabBar['background-color'] === 'rgb(255, 152, 0)', { rows, tabBar });

  // FB9 (REAL 2 and 3, and REAL 1's Uplink half): Uplink keeps the bar's one row and the page's rectangle; the view is dressed (node-dress buttons, cyan ticks), has no box of its own, and lies exactly over the page
  await open(app, 'fb-1', { lift: 'flux.back,flux.top,flux.uplink' });
  await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*text\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()"); await sleep(900);
  const BAR = "(() => { const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 10) / 10).join(','); }; return { bar: r('.chrome-top.sprint-nav'), page: (" + PAGE + ").split('|').slice(0, 2).join('|'), doc: document.documentElement.scrollHeight - document.documentElement.clientHeight }; })()";
  const beforeU = await app.evalJs(BAR);
  for (let i = 0; i < 3 && !(await app.evalJs("!!document.querySelector('[data-reorg-pub]')")); i += 1) { await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sleep(900); }
  const afterU = await app.evalJs(BAR);
  const dressU = await app.evalJs("(() => { const px = (s) => { const m = /rgba?\\((\\d+), (\\d+), (\\d+)/.exec(s); return m ? [+m[1], +m[2], +m[3]] : null; }; const sheet = document.querySelector('[data-reorg-pub]'); const paper = document.querySelector('.mode-page'); if (!sheet || !paper) return null; const sr = sheet.getBoundingClientRect(), pr = paper.getBoundingClientRect(); const sc = getComputedStyle(sheet); const btns = [...sheet.querySelectorAll('.reorg-pub-btn')].map((b) => px(getComputedStyle(b).backgroundColor)); const ticks = [...sheet.querySelectorAll('.reorg-pub-tick input')].map((i) => getComputedStyle(i).accentColor); const crumbs = [...document.querySelectorAll('.reorg-top-name-btn')].map((b) => px(getComputedStyle(b).backgroundColor)); const dark = (c) => !c || (c[0] + c[1] + c[2]) < 300; const col = document.querySelector('.mode-pagecol'); const cr = col ? col.getBoundingClientRect() : null; const rr = (b) => b ? [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 10) / 10) : null; return { sheet: rr(sr), paper: rr(pr), col: rr(cr), cover: Math.abs(sr.left - pr.left) <= 2 && Math.abs(sr.top - pr.top) <= 2 && Math.abs(sr.width - pr.width) <= 2 && Math.abs(sr.height - pr.height) <= 2, outline: sc.outlineStyle, border: sc.borderTopWidth, btns: btns.length, btnsDark: btns.every(dark), ticks: ticks }; })()");
  ok('FB9 Uplink: the bar keeps its one row and the page its rectangle; the view lies exactly over the page, has no box of its own, and its buttons and ticks are in Flux\'s dress',
    !!beforeU && !!afterU && beforeU.bar === afterU.bar && beforeU.page === afterU.page && afterU.doc <= beforeU.doc && !!dressU && dressU.cover === true && dressU.outline === 'none' && dressU.border === '0px' && dressU.btns >= 6 && dressU.btnsDark === true && dressU.ticks.length >= 1 && dressU.ticks.every((x) => /0, 194, 255|00c2ff/i.test(x)), { beforeU, afterU, dressU });

  // FB10 (the Wrizors' Flux Uplink frames, Nov 23): the sheet's label row starts BELOW the page's L4 readout header (DOC // address, the counts), never running into it; the sheet still covers the paper (FB9)
  const head = await app.evalJs("(() => { const h = document.querySelector('[data-flux3-dochead]'), l = document.querySelector('.reorg-pub-label'); if (!h || !l) return null; const hb = h.getBoundingClientRect(), lb = l.getBoundingClientRect(); return { headBottom: Math.round(hb.bottom * 10) / 10, labelTop: Math.round(lb.top * 10) / 10, labelBottom: Math.round(lb.bottom * 10) / 10 }; })()");
  ok('FB10 Uplink: the label row starts below the readout header of the page (no overlap)', !!head && head.labelTop >= head.headBottom - 1, head);

  await open(app, 'fb-1', { lift: '' });
  await drawer(app);
  const off =await app.evalJs("(() => { const row = document.querySelector('.wz-tutor-panel .wz-drawer-tabs'); return { tabs: row ? [...row.querySelectorAll('.wz-drawer-tab')].map((b) => b.id) : null, reorg: !!document.querySelector('.reorg-search-door, [data-back-export], .wz-back-assets'), gate: window.wrizoReorgGate ? 'seam' : 'none' }; })()");
  // SUPERSEDED (Nov 23, Fable 8:20 am, the Flux live join: all six Flux cells are on, Flux is on by default, and FLUX3 is on unless ?flux3=0). The original, verbatim:
  // ok('FB5 piece OFF without the door: in Flux the drawer is today\'s (no Spine tab, no reorg markup)', !!off && Array.isArray(off.tabs) && !off.tabs.includes('wz-tutor-tab-plan') && off.reorg === false, off);
  ok('FB5 [successor] with no door the Back menu stands in Flux (flux.back is on in the table): the Spine tab and the reorg markup are on the page', !!off && Array.isArray(off.tabs) && off.tabs.includes('wz-tutor-tab-plan') && off.reorg === true, off);

  // FB14 (the Wrizors' pass 2, REAL 3): the Operator's two fields are in field dress (fill #020C10, a 1 px #5F8F95 edge) and every hint is text-low #7EB4C4 (8.67:1), not the browser's green-grey
  await open(app, 'fb-1'); await drawer(app); await tab(app, 'tutor');
  const fields = await app.evalJs("(() => { const one = (s) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e), p = getComputedStyle(e, '::placeholder'); return { bg: c.backgroundColor, edge: c.borderTopColor, w: c.borderTopWidth, hint: p.color }; }; return { ask: one('.wz-tutor-convo-input'), bible: one('.wz-tutor-bible-input') }; })()");
  const fieldOk = (x) => !!x && x.bg === 'rgb(2, 12, 16)' && x.edge === 'rgb(95, 143, 149)' && x.w === '1px' && x.hint === 'rgb(126, 180, 196)';
  ok('FB14 the Operator\u2019s fields are in field dress (#020C10, a 1 px #5F8F95 edge) with #7EB4C4 hints', !!fields && fieldOk(fields.ask) && fieldOk(fields.bible), fields);

  await open(app, 'fb-1');
  const mode = await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*wire in\\s*$/i.test(b.textContent || '')); if (!el) return false; el.click(); return true; })()");
  await sleep(900);
  await drawer(app);
  const wire = await app.evalJs(TABS);
  const note = await app.evalJs("(() => { const n = document.querySelector('.wz-sprint-note, [data-sprint-note]'); return n ? (n.textContent || '').trim() : [...document.querySelectorAll('.wz-tutor-panel *')].map((e) => (e.children.length === 0 ? (e.textContent || '').trim() : '')).find((x) => /wired in/i.test(x)) || null; })()");
  ok('FB6 Wire In: Spine and Inputs are locked and the note reads "Wired in: the Operator sends prompts only." in Flux\'s words; the Operator is the one in use',
    mode === true && Array.isArray(wire) && wire.find((x) => x.id === 'plan')?.locked === true && wire.find((x) => x.id === 'links')?.locked === true && wire.find((x) => x.id === 'tutor')?.on === true && note === 'Wired in: the Operator sends prompts only.', { mode, wire, note });
  // FB11 (spec section 5, Nick Nov 20, 1:20 pm: SPRINT keeps the Back menu's handle; the Wrizors' Wire In frame: the Corridor hid every hand): jacked in, the Back menu's opener and its opened panel are SEEN and can be pressed (the grip is what a pointer hits at its centre); the left hand, the rail and the Glitch bar stay off
  const corridor = await app.evalJs("(() => { const op = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).opacity : null; }; const g = document.querySelector('.wz-tutor-grip'); let hit = null; if (g) { const r = g.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); hit = !!e && (e === g || g.contains(e)); } const gc = g ? getComputedStyle(g) : null; return { jacked: document.documentElement.hasAttribute('data-flux3-jacked'), anchor: op('.desk-frame-tutor-anchor'), panel: op('.desk-frame-tutor-panel-anchor'), hit, vis: gc && gc.visibility, pe: gc && gc.pointerEvents, left: op('.desk-frame-sliver-anchor'), rail: op('.desk-rail') }; })()");
  ok('FB11 Wire In (the Corridor): the opener of the Back menu and its opened panel are drawn and can be pressed; the left hand and the rail stay off', !!corridor && corridor.jacked === true && corridor.anchor === '1' && corridor.panel === '1' && corridor.hit === true && (corridor.left === null || corridor.left === '0') && (corridor.rail === null || corridor.rail === '0'), corridor);
  // FB12 (the frames of Nov 23): opened in the Corridor, the grip stands at the panel's own left edge (16 px of gutter), never inside its tab row; and it is on the screen
  const gripAt = await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'), p = document.querySelector('.wz-tutor-panel'); if (!g || !p) return null; const gr = g.getBoundingClientRect(), pr = p.getBoundingClientRect(); return { gripLeft: Math.round(gr.left), gripRight: Math.round(gr.right), panelLeft: Math.round(pr.left), vw: window.innerWidth }; })()");
  ok('FB12 Wire In (the Corridor): the opened Back menu\'s grip stands at the panel\'s left edge, clear of its tab row', !!gripAt && gripAt.gripRight <= gripAt.panelLeft + 1 && gripAt.gripLeft >= 0 && gripAt.gripRight <= gripAt.vw, gripAt);
  // FB13 (the Wrizors' pass 2, REAL 1): in Wire In the opened panel ends above her line (its foot is capped), so it never covers what she is writing
  const cover = await app.evalJs("(() => { const p = document.querySelector('.wz-tutor-panel'), ed = document.querySelector('.forward-only-editor'); if (!p || !ed) return null; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) if (n.data.trim()) last = n; if (!last) return null; const r = document.createRange(); r.selectNodeContents(last); const rects = [...r.getClientRects()]; if (!rects.length) return null; return { panelBottom: Math.round(p.getBoundingClientRect().bottom), lineTop: Math.round(Math.min(...rects.map((x) => x.top))) }; })()");
  ok('FB13 Wire In (the Corridor): the opened Back menu ends above her line', !!cover && cover.panelBottom <= cover.lineTop, cover);
  // FB15 (the frames after pass 2: the first cap hid the action): in Wire In the Writing prompt button is wholly inside the opened panel (not scrolled out of view)
  const act = await app.evalJs("(() => { const p = document.querySelector('.wz-tutor-panel'); if (!p) return null; const b = [...p.querySelectorAll('button')].find((x) => /writing prompt/i.test(x.textContent || '')); if (!b) return { found: false }; const pr = p.getBoundingClientRect(), br = b.getBoundingClientRect(); return { found: true, inside: br.top >= pr.top - 1 && br.bottom <= pr.bottom + 1, btnBottom: Math.round(br.bottom), panelBottom: Math.round(pr.bottom) }; })()");
  ok('FB15 Wire In (the Corridor): the Writing prompt button is wholly inside the opened panel', !!act && act.found === true && act.inside === true, act);
  // FB16 (Nov 23, found reading flux3-s4c's CARET on live Flux): the Back menu's panel anchor fills the stage; drawn in Wire In, it must not take the press meant for her page
  const PRESS = "(() => { const p = document.querySelector('.mode-page'); if (!p) return null; const r = p.getBoundingClientRect(); const x = Math.round(Math.max(r.left + 40, 8)), y = Math.round(Math.min(Math.max(r.top + 60, 120), innerHeight - 80)); const e = document.elementFromPoint(x, y); return { x, y, onPage: !!e && !!e.closest('.mode-page'), hit: e ? String(e.className || e.tagName).slice(0, 70) : null, jacked: document.documentElement.hasAttribute('data-flux3-jacked') }; })()";
  const pressOpen = await app.evalJs(PRESS);
  await app.evalJs("document.querySelector('.wz-tutor-grip').click(); null");
  await sleep(500);
  const pressShut = await app.evalJs(PRESS);
  await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'fb16-mut'; s.textContent = ':root[data-flux3][data-theme=flux][data-wirein][data-flux3-jacked] .desk-frame-tutor-panel-anchor[data-back=\"true\"]{ pointer-events:auto !important; }'; document.head.appendChild(s); return true; })()");
  const pressMut = await app.evalJs(PRESS);
  await app.evalJs("document.getElementById('fb16-mut').remove(); document.querySelector('.wz-tutor-grip').click(); null");
  await sleep(500);
  ok('FB16 Wire In (the Corridor): a press on her page lands on her page, with the Back menu open and shut', !!pressOpen && !!pressShut && pressOpen.jacked === true && pressOpen.onPage && pressShut.onPage, { pressOpen, pressShut });
  ok('MUT-FB16 the panel anchor taking the pointer again: the same read goes red (the mutant LANDED on the anchor)', !!pressMut && !pressMut.onPage && /tutor-panel-anchor/.test(pressMut.hit || ''), pressMut);

  await open(app, 'fb-1', { lift: '', reorg: 0 });
  await drawer(app);
  const today = await app.evalJs("(() => { const row = document.querySelector('.wz-tutor-panel .wz-drawer-tabs'); return { tabs: row ? [...row.querySelectorAll('.wz-drawer-tab')].map((b) => b.id) : null, reorg: !!document.querySelector('.reorg-search-door, [data-back-export], .wz-back-assets'), gate: window.wrizoReorgGate ? 'seam' : 'none' }; })()");
  ok('FB5b with ?reorg=0 the drawer is today\'s (no Spine tab, no reorg markup)', !!today && Array.isArray(today.tabs) && !today.tabs.includes('wz-tutor-tab-plan') && today.reorg === false, today);
  await open(app, 'fb-1', { flux3: false });
  await drawer(app);
  const plain = await app.evalJs("(() => { const row = document.querySelector('.wz-tutor-panel .wz-drawer-tabs'); return { tabs: row ? [...row.querySelectorAll('.wz-drawer-tab')].map((b) => b.id) : null, reorg: !!document.querySelector('.reorg-search-door, .wz-back-assets'), flux3: document.documentElement.hasAttribute('data-flux3') }; })()");
  // SUPERSEDED (Nov 23, Fable 8:20 am, the Flux live join: all six Flux cells are on, Flux is on by default, and FLUX3 is on unless ?flux3=0). The original, verbatim:
  // ok('FB7 the plain Flux never has the reorg: without ?flux3=1 even the preview door gives Flux no Back menu', !!plain && plain.flux3 === false && Array.isArray(plain.tabs) && !plain.tabs.includes('wz-tutor-tab-plan') && plain.reorg === false, plain);
  ok('FB7 [successor] the plain Flux never has the reorg: with ?flux3=0 even the preview door gives Flux no Back menu', !!plain && plain.flux3 === false && Array.isArray(plain.tabs) && !plain.tabs.includes('wz-tutor-tab-plan') && plain.reorg === false, plain);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 18;   // 16 + FB16 and its mutant (Nov 23)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-FLUX-BACK-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-FLUX-BACK-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
