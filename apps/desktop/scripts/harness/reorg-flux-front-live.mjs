// THE REORG'S FRONT MENU IN FLUX, IN THE APP (Fable, Nov 22, 9:20 pm; claude/wrizors/flux-reorg-spec.md sections 4 and 6). Flux theme ON THE REDESIGN (?flux3=1), the dark room, ?reorg=1 with the PREVIEW DOOR (&reorglift=flux.top,flux.front:
// the Sliver is handed its Front menu only under the top bar's piece, PageEditor's front={reorgTop ? ...}, so the door lifts both; it flips no cell). The stylesheet's half is reorg-flux-front-css-unit.mjs; this proves what only the app can.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": three Parts, ff-1 "Arrival" (slot a, one asset), ff-2 "The town" (slot c), ff-3 "The toll" (her own colour #C04A2B).
//   FF1   the tab row reads MARKUP, TRACKS and MARKUP is open (INK exists only in Free Write, and Wire In has no Front menu: Nick, Nov 20)
//   FF2   MARKUP holds Typeface, the marks and the folds; Presets, the kind row and Frame are NOT on it
//   FF3   TRACKS' head menu holds Style guide, Frame, Special tracks and Presets, in node dress, and its Frame opens the page setup
//   FF4   a Track's tag is the bracketed code and a 3 px bar in the slot's signal: no fill, no box, and the row is not tinted; her own colour draws a bar with no code
//   FF5   the current Track wears the choice mark: a cyan edge and the 3 x 24 brass bar
//   FF14  each Track's name keeps its room at 1366, the narrowest menu (none cut), with the link badge on the first row
//   FF15  Uplink's greyed MARKUP is text-low at full strength, not dimmed (spec draft 4, section 11 rule 5)
//   FF16  a Track's menu says Merge and Nest, never Join or Level (rule 9)
//   FF17  the colour picker opens clear of the page's glass (NIT 6)
//   FF18  Uplink's ticks are the one Flux tick, in TRACKS and in the view (pass 1, REAL)
//   FF19  the COMMANDS edges are #5F8F95 in the Front menu, and today's drawer keeps its own (ship must)
//   FF20  Wire In's end-of-Track line is DRAWN in text-low #7EB4C4: its three pieces, read from the screenshot's pixels (Fable, Nov 23, 8:20 am; the Wrizors' top bar pass 1 read 2.47 to 3.49, under the Typewriter's mask)
//   FF21  the band over her words is untouched: only the fade BELOW the writing line is lifted, in a Doc with a foot
//   FF22  a page with no foot keeps the Typewriter's whole band
//   FF6   the open tab wears the same mark, and nothing in the menu is left to the browser's grey or white controls
//   FF7   PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same through opening the menu, both tabs and the kind menu; the editor is the same node
//   FF8   the colour picker is in node dress with the six codes, and its Custom field is in Flux's field dress
//   FF9   Uplink: MARKUP is greyed with Flux's note, TRACKS stays and is the open tab
//   FF10  Wire In draws no Front menu
//   FF11  piece OFF without the door: with only the top bar lifted, the drawer has no TRACKS tab
//   FF12  the plain Flux never has it: without ?flux3=1 even the door gives no Front menu
//   FF13  Machina is unchanged: its first tab reads TEXT and Page setup stays at its foot (the probe the FF2 absence relies on, seen present)
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-flux-front-live.mjs
import { withHarness } from '../runtime-verify.mjs';
import zlib from 'node:zlib';
import { contrast } from '../arbor2-png.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Chrome's screenshot is 8-bit RGB (colour type 2), which arbor2-png's decodePng refuses (runs 45202747676, 45202901240: FF20 read no pixel at all, so its first red was the instrument's)
const decodeShot = (buf) => { let o = 8, w = 0, h = 0, ct = 0; const idat = []; while (o < buf.length) { const n = buf.readUInt32BE(o), ty = buf.toString('latin1', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + n); if (ty === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] !== 0 || (ct !== 2 && ct !== 6)) throw new Error('unsupported PNG: depth ' + d[8] + ', colour type ' + ct + ', interlace ' + d[12]); } else if (ty === 'IDAT') idat.push(d); o += n + 12; } const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(stride * h); for (let y = 0, p = 0; y < h; y += 1) { const f = raw[p]; p += 1; for (let x = 0; x < stride; x += 1, p += 1) { const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0; let v = raw[p]; if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } px[y * stride + x] = v & 255; } } const data = Buffer.alloc(w * h * 4, 255); for (let i = 0, j = 0; i < px.length; i += bpp, j += 4) { data[j] = px[i]; data[j + 1] = px[i + 1]; data[j + 2] = px[i + 2]; } return { width: w, height: h, data }; };
const q = (s) => JSON.stringify(s);
const LIFT = 'flux.top,flux.front';
const BRASS = 'rgb(255, 152, 0)', CYAN = 'rgb(0, 194, 255)', NONE = 'rgba(0, 0, 0, 0)';
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const CS = (sel, props, pseudo) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; const c = getComputedStyle(e${pseudo ? ', ' + q(pseudo) : ''}); return ${q(props)}.reduce((o, p) => { o[p] = c.getPropertyValue(p); return o; }, {}); })()`;
const TABS = "(() => { const row = document.querySelector('.wz-sliver-panel .wz-drawer-tabs'); if (!row) return null; return [...row.querySelectorAll('.wz-drawer-tab')].map((b) => ({ id: b.id.replace('wz-sliver-tab-', ''), text: (b.textContent || '').trim(), on: b.getAttribute('data-on') === 'true', off: b.getAttribute('data-disabled') === 'true', title: b.getAttribute('title') || '' })); })()";

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
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.slice(-1) + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('ff-note', 'Field notes\\nThe rain came late.', { origin: 'loose' });
    page('ff-board', 'Plan board', { origin: 'loose', pageType: 'board', boxes: [{ id: 'c1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The opening image', seq: 0 }] });
    page('ff-1', 'The harbour was quiet when she arrived.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('ff-2', 'By the second week the town had decided what she was.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    page('ff-3', 'The toll was paid in the spring.', { origin: 'project', projectId: brief.id, orderIndex: 2 });
    W.wrizoPatchEntry('ff-1', { pageSettings: ${PS}, name: 'Arrival', level: 0, color: 'a' } });
    W.wrizoPatchEntry('ff-2', { pageSettings: ${PS}, name: 'The town', level: 0, color: 'c' } });
    W.wrizoPatchEntry('ff-3', { pageSettings: ${PS}, name: 'The toll', level: 0, color: '#C04A2B' } });
    W.wrizoPatchEntry('ff-board', { pageLinks: [{ id: 'l1', aEntryId: 'ff-board', aBoxId: 'c1', bEntryId: 'ff-1', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' }] });   // a Part's badge counts what links to it (reorg/partAssets.ts), not the Doc's own assets
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, { w = 1366, lift = LIFT, flux3 = true, theme = 'flux', reorg = 1 } = {}) {
  await app.emulateDpr(1, w, 768);
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 });   // item141: the seam is read only after a settle
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '/?reorg=${reorg}&arbor2=0${flux3 ? '&flux3=1' : '&flux3=0'}${lift ? '&reorglift=' + lift : ''}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const drawer = async (app) => { if (!(await app.evalJs("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); } };
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-sliver-tab-${id}')?.click(); null`); await sleep(450); };
const kindMenu = async (app) => { if (!(await app.evalJs("!!document.querySelector('[data-doc-menu]')"))) { await app.evalJs(press('[data-doc-kind]')); await sleep(350); } };
const RAW = "(() => { const bad = []; const root = document.querySelector('.wz-sliver-panel'); if (!root) return null; const els = [...root.querySelectorAll('button, input, select')]; for (const b of els) { const c = getComputedStyle(b); const m = /rgba?\\((\\d+), (\\d+), (\\d+)(?:, ([\\d.]+))?/.exec(c.backgroundColor); if (!m) continue; const [r, g, b2] = [+m[1], +m[2], +m[3]]; const a = m[4] === undefined ? 1 : +m[4]; if (a > 0.5 && r === g && g === b2 && r >= 200) bad.push((b.className || b.tagName) + ' ' + c.backgroundColor); } return { n: els.length, bad: bad.slice(0, 6) }; })()";

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'ff-1');
  const mark = await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (e) e.__ffMark = 1; return null; })()");
  void mark;
  const before = await app.evalJs(PAGE);
  await drawer(app);
  const tabs = await app.evalJs(TABS);
  ok('FF1 the tab row reads MARKUP, TRACKS and MARKUP is open', Array.isArray(tabs) && tabs.map((x) => x.text.toUpperCase()).join(',') === 'MARKUP,TRACKS' && tabs[0].on === true, tabs);

  const markup = await app.evalJs("(() => { const r = document.querySelector('.wz-sliver-panel'); if (!r) return null; return { type: !!r.querySelector('.wz-sliver-type'), marks: r.querySelectorAll('.wz-sliver-format--letters .mode-tbtn').length, folds: [...r.querySelectorAll('[data-text-fold]')].map((b) => b.getAttribute('data-text-fold')), templates: r.querySelectorAll('[data-template]').length, kind: r.querySelectorAll('.wz-sliver-page-kind').length, setup: r.querySelectorAll('.wz-page-setup-seg, .wz-page-setup-chip').length }; })()");
  ok('FF2 MARKUP holds Typeface, the marks and the folds; Presets, the kind row and Frame are not on it', !!markup && markup.type && markup.marks >= 6 && markup.folds.includes('paragraph') && markup.folds.includes('more') && markup.templates === 0 && markup.kind === 0 && markup.setup === 0, markup);

  const barTab = await app.evalJs(CS('#wz-sliver-tab-text', ['width', 'height', 'background-color'], '::before'));
  const edgeTab = await app.evalJs(CS('#wz-sliver-tab-text', ['border-top-color', 'text-transform']));
  for (let i = 0; i < 2; i += 1) { await app.evalJs("(() => { for (const b of document.querySelectorAll('.wz-sliver-panel [data-text-fold][aria-expanded=\"false\"]')) b.click(); return null; })()"); await sleep(250); }
  const rawMarkup = await app.evalJs(RAW);
  const frontEdge = await app.evalJs(CS('.wz-action-btn', ['border-top-color']));
  const mid = await app.evalJs(PAGE);

  await tab(app, 'parts');
  const rawTracks = await app.evalJs(RAW);
  const tagA = await app.evalJs(CS(".reorg-parts-tag[data-colour='a']", ['background-color', 'border-left-width', 'border-left-color', 'border-top-width', 'border-right-width', 'color']));
  const codeA = await app.evalJs(CS(".reorg-parts-tag[data-colour='a']", ['content'], '::after'));
  const tagC = await app.evalJs(CS(".reorg-parts-tag[data-colour='c']", ['border-left-color']));
  const codeC = await app.evalJs(CS(".reorg-parts-tag[data-colour='c']", ['content'], '::after'));
  const hexTag = await app.evalJs("(() => { const e = document.querySelector('.reorg-parts-tag[data-colour-hex]'); if (!e) return null; const c = getComputedStyle(e), r = e.getBoundingClientRect(); const bar = getComputedStyle(e, '::before'); return { bg: c.backgroundColor, w: r.width, bar: bar.backgroundColor, barW: bar.width, text: getComputedStyle(e, '::after').content }; })()");
  const tint = await app.evalJs("(() => [...document.querySelectorAll('.reorg-parts-list > li')].map((l) => getComputedStyle(l).backgroundColor))()");
  // SUPERSEDED (Nov 22, spec draft 4, section 11 rule 2: beside its bar on the panel the code is text-hi; section 6: her own colour is a bar with the code [##]), the original, verbatim:
  // ok('FF4 a tag is the code and a 3 px bar in the signal, no fill or box, the row untinted; her own colour draws a bar with no code',
  // !!tagA && tagA['background-color'] === NONE && tagA['border-left-width'] === '3px' && tagA['border-left-color'] === CYAN && tagA['border-top-width'] === '0px' && tagA['border-right-width'] === '0px' && tagA.color === CYAN
  // && !!codeA && codeA.content === '"[01]"' && !!tagC && tagC['border-left-color'] === 'rgb(255, 46, 151)' && !!codeC && codeC.content === '"[03]"'
  // && !!hexTag && hexTag.bg === 'rgb(192, 74, 43)' && hexTag.w === 5 && hexTag.text === 'none' && Array.isArray(tint) && tint.length === 3 && tint.every((x) => x === NONE), { tagA, codeA, tagC, codeC, hexTag, tint });
  ok('FF4 a tag is the code in text-hi and a 3 px bar in the signal, no fill or box, the row untinted; her own colour is its bar inside a 1 px edge, with the code [##]',
    !!tagA && tagA['background-color'] === NONE && tagA['border-left-width'] === '3px' && tagA['border-left-color'] === CYAN && tagA['border-top-width'] === '0px' && tagA['border-right-width'] === '0px' && tagA.color === 'rgb(231, 244, 241)'
    && !!codeA && codeA.content === '"[01]"' && !!tagC && tagC['border-left-color'] === 'rgb(255, 46, 151)' && !!codeC && codeC.content === '"[03]"'
    && !!hexTag && hexTag.bg === NONE && hexTag.bar === 'rgb(192, 74, 43)' && hexTag.barW === '3px' && hexTag.text === '"[##]"' && Array.isArray(tint) && tint.length === 3 && tint.every((x) => x === NONE), { tagA, codeA, tagC, codeC, hexTag, tint });

  const here = await app.evalJs(CS('.reorg-parts-row.is-here', ['box-shadow']));
  const hereBar = await app.evalJs(CS('.reorg-parts-row.is-here', ['width', 'height', 'background-color'], '::before'));
  ok('FF5 the current Track wears the choice mark: a cyan edge and the 3 x 24 brass bar', !!here && here['box-shadow'].includes(CYAN) && !!hereBar && hereBar.width === '3px' && hereBar.height === '24px' && hereBar['background-color'] === BRASS, { here, hereBar });
  const names = await app.evalJs("(() => [...document.querySelectorAll('.reorg-parts-list .reorg-parts-name')].map((e) => ({ t: (e.textContent || '').trim(), w: Math.round(e.getBoundingClientRect().width), cut: e.scrollWidth > e.clientWidth + 1 })))()");
  const badge = await app.evalJs("!!document.querySelector('button.reorg-parts-assets')");
  ok('FF14 each Track\'s name keeps its room at 1366 (none cut), with the link badge on the first row', Array.isArray(names) && names.length === 3 && names.every((x) => !x.cut && x.w >= 40) && badge === true, { names, badge });
  ok('FF6 the open tab wears the mark, and no control in MARKUP or TRACKS is the browser\'s grey or white',
    !!barTab && barTab.width === '3px' && barTab.height === '24px' && barTab['background-color'] === BRASS && !!edgeTab && edgeTab['border-top-color'] === CYAN && edgeTab['text-transform'] === 'uppercase'
    && !!rawMarkup && rawMarkup.n >= 12 && rawMarkup.bad.length === 0 && !!rawTracks && rawTracks.n >= 4 && rawTracks.bad.length === 0, { barTab, edgeTab, rawMarkup, rawTracks });

  await kindMenu(app);
  const menu = await app.evalJs("(() => { const m = document.querySelector('[data-doc-menu]'); if (!m) return null; const c = getComputedStyle(m); return { items: [...m.querySelectorAll('[data-doc-menu-item]')].map((b) => (b.querySelector('span')?.textContent || '').trim()), bg: c.backgroundColor, edge: c.borderTopColor, w: c.borderTopWidth }; })()");
  await app.evalJs(press('[data-doc-menu-item="setup"]')); await sleep(350);
  const setup = await app.evalJs("(() => { const s = document.querySelector('[data-doc-sub=\"setup\"]'); return s ? s.querySelectorAll('button, input, select').length : -1; })()");
  ok('FF3 TRACKS\' head menu holds Style guide, Frame, Special tracks and Presets, in node dress, and Frame opens the page setup',
    !!menu && ['Style guide', 'Frame', 'Special tracks', 'Presets'].every((x) => menu.items.includes(x)) && menu.bg === 'rgb(4, 20, 26)' && menu.edge === 'rgb(126, 180, 196)' && menu.w === '1px' && setup > 0, { menu, setup });
  const inMenu = await app.evalJs(PAGE);
  await app.evalJs(press('[data-doc-kind]')); await sleep(300);
  await tab(app, 'text');
  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor')?.__ffMark");
  await open(app, 'ff-1', { w: 1920 });
  const b2 = await app.evalJs(PAGE);
  await drawer(app); await tab(app, 'parts'); await kindMenu(app);
  const m2 = await app.evalJs(PAGE);
  await app.evalJs(press('[data-doc-kind]')); await sleep(300); await tab(app, 'text');
  const a2 = await app.evalJs(PAGE);
  ok('FF7 PAGE IS PRIMARY [1366, 1920]: the rects hold through the menu, both tabs and the kind menu, and the editor is the same node',
    before !== '-|-|-' && !before.includes('-|') && before === mid && before === inMenu && before === after && same === true && b2 === m2 && b2 === a2, { before, mid, inMenu, after, same, b2, m2, a2 });

  await open(app, 'ff-1');
  await drawer(app); await tab(app, 'parts');
  await app.evalJs(press('[data-part-more="ff-2"]')); await sleep(300);
  const acts = await app.evalJs("[...document.querySelectorAll('[data-part-menu=\"ff-2\"] .reorg-part-acts > button')].map((b) => (b.textContent || '').trim())");
  ok('FF16 a Track\'s menu says Merge and Nest, never Join or Level', Array.isArray(acts) && acts.includes('Merge') && acts.includes('Nest') && !acts.some((x) => /join|level/i.test(x)), acts);
  await app.evalJs(press('[data-part-more="ff-2"]')); await sleep(250);
  await app.evalJs(press('[data-part-more="ff-1"]')); await sleep(300);
  const opened = await app.evalJs(press('.reorg-part-colour-open'));
  await sleep(350);
  const custom = await app.evalJs(press('[data-colour-custom]'));
  await sleep(300);
  const picker = await app.evalJs("(() => { const p = document.querySelector('.reorg-colour-picker'); if (!p) return null; const c = getComputedStyle(p); const codes = [...p.querySelectorAll('.reorg-colour-swatch')].map((s) => getComputedStyle(s, '::after').content); const f = p.querySelector('.reorg-colour-hex'); const fc = f ? getComputedStyle(f) : null; return { bg: c.backgroundColor, edge: c.borderTopColor, codes, field: fc && { bg: fc.backgroundColor, edge: fc.borderTopColor } }; })()");
  const clear = await app.evalJs("(() => { const p = document.querySelector('.reorg-colour-picker'), g = document.querySelector('.mode-page'); if (!p || !g) return null; const a = p.getBoundingClientRect(), b = g.getBoundingClientRect(); return { right: Math.round(a.right), left: Math.round(a.left), glass: Math.round(b.left) }; })()");
  ok('FF17 the colour picker opens clear of the page\'s glass', !!clear && clear.right <= clear.glass && clear.left >= 8, clear);
  ok('FF8 the colour picker is in node dress with the six codes, and its Custom field is in Flux\'s field dress',
    opened === true && custom === true && !!picker && picker.bg === 'rgb(4, 20, 26)' && picker.edge === 'rgb(126, 180, 196)' && picker.codes.join(',') === '"[01]","[02]","[03]","[04]","[05]","[06]"'.split('"').join('"') && !!picker.field && picker.field.bg === 'rgb(2, 12, 16)', { opened, custom, picker });

  await open(app, 'ff-1', { lift: `${LIFT},flux.uplink,flux.back` });
  for (let i = 0; i < 3 && !(await app.evalJs("!!document.querySelector('[data-reorg-pub]')")); i += 1) { await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sleep(900); }
  await drawer(app);
  const up = await app.evalJs(TABS);
  const upMark = Array.isArray(up) ? up.find((x) => x.id === 'text') : null, upTrack = Array.isArray(up) ? up.find((x) => x.id === 'parts') : null;
  const greyed = await app.evalJs(CS('#wz-sliver-tab-text', ['opacity', 'color']));
  // SUPERSEDED (Nov 22, the Wrizors' Front pass 1 @ d72cc6ea), the original, verbatim:
  // ok('FF15 Uplink\'s greyed MARKUP is text-low at full strength, not dimmed', !!greyed && greyed.opacity === '1' && greyed.color === 'rgb(126, 180, 196)', greyed);
  ok('FF15 Uplink\'s greyed MARKUP looks locked at full strength: #5F8F95, not dimmed', !!greyed && greyed.opacity === '1' && greyed.color === 'rgb(95, 143, 149)', greyed);
  const TICK = (sel) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; const c = getComputedStyle(e), a = getComputedStyle(e, '::after'); return { look: c.appearance, bg: c.backgroundColor, edge: c.borderTopColor, radius: c.borderTopLeftRadius, mark: a.content !== 'none', markEdge: a.borderRightColor }; })()`;
  const ticks = [await app.evalJs(TICK('.reorg-pubparts-row input')), await app.evalJs(TICK('.reorg-pub-tick input'))];
  ok('FF18 Uplink\'s ticks are the one Flux tick, in TRACKS and in the view', ticks.every((x) => !!x && x.look === 'none' && x.bg === 'rgb(4, 20, 26)' && x.edge === 'rgb(126, 180, 196)' && x.radius === '0px' && x.mark && x.markEdge === CYAN), ticks);
  ok('FF9 Uplink: MARKUP is greyed with Flux\'s note, and TRACKS is the open tab', !!upMark && upMark.off === true && upMark.title === 'Markup and Ink lock at Uplink. Patch to change the words.' && !!upTrack && upTrack.on === true && upTrack.off === false, up);

  // on ff-2: a page keeps the mode it was left in, so Wire In pressed on ff-1 would leave every later check on a page with no drawer (run 45112891211: FF11, FF13)
  await open(app, 'ff-2');
  const wire = await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*wire in\\s*$/i.test(b.textContent || '')); if (!el) return false; el.click(); return true; })()");
  await sleep(900);
  const wireOff = await app.evalJs("({ sliver: !!document.querySelector('.wz-sliver'), page: !!document.querySelector('.forward-only-editor') })");
  // INFO, no verdict: the end-of-Track line in Wire In (the Wrizors' top-bar pass 1 read it at 2.47 to 3.49 in a frame shot 350 ms after a pointer move): its opacity, up the whole chain, at rest and through that moment
  const FOOT = "(() => { const f = document.querySelector('[data-part-foot]'); if (!f) return null; let o = 1; for (let e = f; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; const g = f.querySelector('.is-next'); const st = document.querySelector('.mode-stage'); return { chain: Math.round(o * 100) / 100, own: getComputedStyle(f).opacity, next: g ? getComputedStyle(g).color : null, writing: st && st.getAttribute('data-writing'), running: f.getAnimations().length }; })()";
  console.log('INFO foot rest ' + JSON.stringify(await app.evalJs(FOOT)));
  console.log('INFO foot paint ' + JSON.stringify(await app.evalJs("(() => { const g = document.querySelector('[data-part-foot] .is-next'); if (!g) return null; const r = g.getBoundingClientRect(); const root = document.documentElement; const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).slice(0, 7).map((e) => { const c = getComputedStyle(e); return String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className || e.tagName).split(' ')[0].slice(0, 28) + ' bg=' + c.backgroundColor + ' o=' + c.opacity; }); const up = []; for (let e = g; e; e = e.parentElement) { const c = getComputedStyle(e); const x = [c.filter !== 'none' ? 'filter ' + c.filter : '', c.mixBlendMode !== 'normal' ? 'blend ' + c.mixBlendMode : '', c.maskImage !== 'none' ? 'mask ' + c.maskImage.slice(0, 90) : '', c.clipPath !== 'none' ? 'clip ' + c.clipPath.slice(0, 50) : ''].filter(Boolean); if (x.length) up.push(String(e.className || e.tagName).split(' ')[0] + ': ' + x.join('; ')); } return { wirein: root.hasAttribute('data-wirein'), jacked: root.hasAttribute('data-flux3-jacked'), zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom'), box: [Math.round(r.left), Math.round(r.top)], stack, up }; })()")));
  await app.mouseMove(900, 460);
  for (const ms of [120, 230, 650, 1500, 2000]) { await sleep(ms); console.log('INFO foot +' + ms + ' ' + JSON.stringify(await app.evalJs(FOOT))); }
  // FF20: what is DRAWN, not what is computed (the foot's own opacity read 1 while the column's mask drew it at 2.47:1). The brightest pixel of each piece is its ink's core.
  const GROUND = '#020C10', LOW = 'rgb(126, 180, 196)';
  const footPieces = await app.evalJs("(() => { const f = document.querySelector('[data-part-foot]'); if (!f) return null; return ['.reorg-part-foot-go:not(.is-next)', '.reorg-part-foot-end', '.reorg-part-foot-go.is-next'].map((s) => { const e = f.querySelector(s); if (!e) return { s, missing: true }; const r = e.getBoundingClientRect(); return { s, x: r.left, y: r.top, w: r.width, h: r.height, color: getComputedStyle(e).color }; }); })()");
  const jacked = await app.evalJs("document.documentElement.hasAttribute('data-flux3-jacked')");
  const drawn = [];
  for (const r of footPieces || []) {
    if (r.missing || !(r.w > 0 && r.h > 0)) { drawn.push({ s: r.s, ratio: 0, color: r.color || null }); continue; }
    try {
      const shot = await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
      // SUPERSEDED (runs 45202747676, 45202901240: 'unsupported PNG: depth 8, colour type 2'). The line, verbatim:
      // const img = decodePng(Buffer.from(shot.data, 'base64'));
      const img = decodeShot(Buffer.from(shot.data, 'base64'));
      let peak = '#000000', best = -1;
      for (let i = 0; i < img.data.length; i += 4) { const v = img.data[i] * 0.2126 + img.data[i + 1] * 0.7152 + img.data[i + 2] * 0.0722; if (v > best) { best = v; peak = '#' + [img.data[i], img.data[i + 1], img.data[i + 2]].map((c) => c.toString(16).padStart(2, '0')).join(''); } }
      drawn.push({ s: r.s, peak, ratio: Math.round(contrast(peak, GROUND) * 100) / 100, color: r.color });
    } catch (e) { drawn.push({ s: r.s, ratio: 0, color: r.color, err: String(e.message || e).slice(0, 120) }); }
  }
  ok('FF20 Wire In\'s end-of-Track line is drawn in text-low #7EB4C4, all three pieces (8:1 or better at the ink\'s core)', jacked === true && drawn.length === 3 && drawn.every((d) => d.color === LOW && d.ratio >= 8), { jacked, drawn });
  const BAND = "(() => { const c = document.querySelector('.mode-pagecol'); if (!c) return null; const m = getComputedStyle(c).webkitMaskImage || getComputedStyle(c).maskImage || ''; const n = (x) => m.split(x).length - 1; return { zoom: c.getAttribute('data-zoom'), foot: !!document.querySelector('[data-part-foot]'), s12: n('rgba(0, 0, 0, 0.12)'), s40: n('rgba(0, 0, 0, 0.4)'), s72: n('rgba(0, 0, 0, 0.72)') }; })()";
  const bandFoot = await app.evalJs(BAND);
  ok('FF21 with a foot, the band above her line is whole (.12, .4, .72) and only the fade below it is lifted', !!bandFoot && bandFoot.zoom === 'true' && bandFoot.foot === true && bandFoot.s12 === 1 && bandFoot.s40 === 1 && bandFoot.s72 === 1, bandFoot);
  await open(app, 'ff-note');
  const wireNote = await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*wire in\\s*$/i.test(b.textContent || '')); if (!el) return false; el.click(); return true; })()");
  await sleep(900);
  const bandNone = await app.evalJs(BAND);
  ok('FF22 a page with no foot keeps the Typewriter\'s whole band in Wire In', wireNote === true && !!bandNone && bandNone.zoom === 'true' && bandNone.foot === false && bandNone.s12 === 1 && bandNone.s40 === 2 && bandNone.s72 === 1, { wireNote, bandNone });
  ok('FF10 Wire In draws no Front menu', wire === true && !!wireOff && wireOff.sliver === false && wireOff.page === true, { wire, wireOff });

  await open(app, 'ff-1', { lift: '' });
  await drawer(app);
  const noDoor = await app.evalJs("({ grip: !!document.querySelector('.wz-sliver-grip'), parts: !!document.querySelector('#wz-sliver-tab-parts'), list: !!document.querySelector('.reorg-parts') })");
  ok('FF11b with no door the Front menu stands in Flux (flux.front is on in the table): the TRACKS tab is there', !!noDoor && noDoor.parts === true, noDoor);
  // the piece is on in the table, so today's drawer (FF11, FF19) is now read with ?reorg=0
  await open(app, 'ff-1', { lift: 'flux.top', reorg: 0 });
  await drawer(app);
  const off = await app.evalJs("({ grip: !!document.querySelector('.wz-sliver-grip'), parts: !!document.querySelector('#wz-sliver-tab-parts'), list: !!document.querySelector('.reorg-parts') })");
  const todayEdge = await app.evalJs(CS('.wz-action-btn', ['border-top-color']));
  // SUPERSEDED (Nov 23, Fable 8:20 am, the Flux live join: all six Flux cells are on, Flux is on by default, and FLUX3 is on unless ?flux3=0). The original, verbatim:
  // ok('FF11 piece OFF without the door: with only the top bar lifted, the drawer has no TRACKS tab', !!off && off.grip === true && off.parts === false && off.list === false, off);
  ok('FF11 [successor] with ?reorg=0 the drawer has no TRACKS tab', !!off && off.grip === true && off.parts === false && off.list === false, off);

  ok('FF19 the COMMANDS edges are #5F8F95 in the Front menu, and today\'s drawer keeps its own', !!frontEdge && frontEdge['border-top-color'] === 'rgb(95, 143, 149)' && !!todayEdge && todayEdge['border-top-color'] !== 'rgb(95, 143, 149)', { frontEdge, todayEdge });
  await open(app, 'ff-1', { flux3: false });
  await drawer(app);
  const plain = await app.evalJs("({ flux3: document.documentElement.hasAttribute('data-flux3'), grip: !!document.querySelector('.wz-sliver-grip'), parts: !!document.querySelector('#wz-sliver-tab-parts'), list: !!document.querySelector('.reorg-parts') })");
  // SUPERSEDED (Nov 23, Fable 8:20 am, the Flux live join: all six Flux cells are on, Flux is on by default, and FLUX3 is on unless ?flux3=0). The original, verbatim:
  // ok('FF12 the plain Flux never has it: without ?flux3=1 even the door gives no Front menu', !!plain && plain.flux3 === false && plain.grip === true && plain.parts === false && plain.list === false, plain);
  ok('FF12 [successor] the plain Flux never has it: with ?flux3=0 even the door gives no Front menu', !!plain && plain.flux3 === false && plain.grip === true && plain.parts === false && plain.list === false, plain);

  await open(app, 'ff-1', { lift: '', flux3: false, theme: 'machina' });
  await drawer(app);
  const mac = await app.evalJs(TABS);
  const macSetup = await app.evalJs("document.querySelectorAll('.wz-sliver-panel .wz-page-setup-seg, .wz-sliver-panel .wz-page-setup-chip').length");
  ok('FF13 Machina is unchanged: its first tab reads TEXT and Page setup stays at its foot (the FF2 probe, seen present)', Array.isArray(mac) && (mac[0]?.text || '').toUpperCase() === 'TEXT' && macSetup > 0, { mac, macSetup });

  // INFO, no verdict: where the block caret is drawn on load (a bar stood mid-page, off the text, in this file's first frames with the top bar lifted). Which lift brings it decides whose it is.
  const CARET = "(() => { const c = document.querySelector('.flux-block-caret'); const r = c && c.getBoundingClientRect(); const s = getSelection(); const a = document.activeElement; const e = document.querySelector('.forward-only-editor'); const er = e && e.getBoundingClientRect(); let sr = null; try { if (s && s.rangeCount) { const x = s.getRangeAt(0).getClientRects()[0]; sr = x ? [Math.round(x.left), Math.round(x.top)] : 'no rect'; } } catch { sr = 'threw'; } return { caret: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.height)] : null, active: a ? String(a.className || a.tagName).slice(0, 36) : null, anchor: s && s.anchorNode ? s.anchorNode.nodeName : null, offset: s ? s.anchorOffset : null, sel: sr, editor: er ? [Math.round(er.left), Math.round(er.top), Math.round(er.height)] : null }; })()";
  for (const [label, lift, open2] of [['no lift', '', false], ['top', 'flux.top', false], ['top+front', LIFT, false], ['top+front, drawer open', LIFT, true]]) {
    await open(app, 'ff-1', { lift });
    if (open2) await drawer(app);
    console.log('INFO caret ' + label + ' ' + JSON.stringify(await app.evalJs(CARET)));
  }
  // INFO, no verdict: every brass mark on screen with the menu open, an element's own or its ::before / ::after, so a stray bar can be named
  const SCAN = "(() => { const isB = (v) => { const m = /rgba?\\((\\d+), (\\d+), (\\d+)/.exec(v || ''); return !!m && +m[1] > 150 && +m[2] > 60 && +m[2] < 190 && +m[3] < 70; }; const out = []; for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); const name = (e.tagName + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(/\\s+/).slice(0, 2).join('.')).slice(0, 44); if (isB(getComputedStyle(e).backgroundColor) && r.width > 0) out.push([name, 'self', Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]); for (const p of ['::before', '::after']) { const c = getComputedStyle(e, p); if (c.content !== 'none' && isB(c.backgroundColor)) out.push([name, p, Math.round(r.left + (parseFloat(c.left) || 0)), Math.round(r.top + (parseFloat(c.top) || 0)), c.width, c.height]); } } return { hit: document.elementsFromPoint(479, 459).slice(0, 4).map((x) => x.tagName + '.' + String(x.className).split(/\\s+/)[0]), marks: out.slice(0, 14) }; })()";
  await open(app, 'ff-1');
  await drawer(app);
  console.log('INFO brass ' + JSON.stringify(await app.evalJs(SCAN)));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 23;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-FLUX-FRONT-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-FLUX-FRONT-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
