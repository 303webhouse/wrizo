// THE REORG'S FRONT MENU IN ARBOR, IN THE APP (Fable, Nov 21, 6:54 pm; claude/wrizors/arbor-reorg-spec.md sections 4 and 6). The live Arbor (plateau, the redesign on by default), ?reorg=1 with the PREVIEW DOOR (&reorglift=plateau.front,plateau.top: reorg/themeGate.ts keeps plateau.front off until Fable clears it; the door
// only shows the piece; the top piece is lifted with it because the page's host passes the Front menu its entry only while the top rail is on). The stylesheet's half is reorg-arbor-front-css-unit.mjs, the Sliver.tsx / frontTabs.ts sites' reorg-arbor-front-sites-unit.mjs; this proves what only the app can.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": three pages -> three Sections, af-1 "Arrival" (slot c, cold blue; two grafts on it), af-2 "The town" (slot d, madder), af-3 "Low tide" (no colour).
//   AF1  the tab row reads FORMAT, SECTIONS (INK joins it only where the page has an instrument, which Free Write, where there is no Front menu, is), and the drawer opens on FORMAT
//   AF2  the cloths: FORMAT olive (#56632E), SECTIONS cold blue (#7FA0BC, walnut words); the open tab comes forward and the drawer's edge takes its cloth (--arbor2-chosen-l)
//   AF3  FORMAT: Arbor's Presets retire into the kind menu: no templates section on FORMAT; the folds (Paragraph ...) stand folded; the kind menu holds Presets with the ready-made starts
//   AF4  SECTIONS: the kind menu at the head (Normal, then Style guide, Presets, Page setup, Special Sections), "Sections (3)", "New section", Structure closed by default
//   AF5  tags and tint: the slot's cloth with its number (c = 3, d = 4) and the 22% wash behind the chosen row; the chosen row's mark is 4 px brass, roman 500; by night the words are brass, by day olive (the drawer's dark olive on a tinted row); every pair reads 4.5:1 or better, measured from the drawn colours
//   AF6  the link badge: a cloth-edged count (GRAFTS' cold blue edge) that opens GRAFTS at that Section
//   AF7  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after opening the Front menu and moving through its tabs; the editor is the same node
//   AF8  Free Write has no Front menu; Publish: FORMAT is greyed with the note (reorgPubFrozen), SECTIONS stands and shows the Publish list
//   AF9  OFF: without the door Arbor's own drawer stands (Format, Presets: no SECTIONS tab); with ?arbor2=0 (the classic Plateau) even the door gives no Front menu
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-arbor-front-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const LIFT = 'plateau.front,plateau.top,plateau.back';
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const link = (id, boxId, toEntry) => ({ id, aEntryId: 'af-own', aBoxId: boxId, bEntryId: toEntry, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' });
const TABS = "(() => { const all = [...document.querySelectorAll('[id^=\"wz-sliver-tab-\"]')]; if (all.length === 0) return null; return all.map((b) => ({ id: b.id.replace('wz-sliver-tab-', ''), text: (b.textContent || '').trim(), on: b.getAttribute('data-on') === 'true', disabled: b.getAttribute('data-disabled') === 'true' || b.disabled === true, title: b.getAttribute('title') || '' })); })()";
const CS = (sel, props, pseudo) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; const c = getComputedStyle(e${pseudo ? ', ' + q(pseudo) : ''}); return ${q(props)}.reduce((o, p) => { o[p] = c.getPropertyValue(p); return o; }, {}); })()`;
// the drawn colour of a node as [r, g, b, a], from its computed string (rgb, rgba, or a color(srgb ...) the engine may return for a mix)
const PARSE = "const parse = (s) => { let m = /^rgba?\\(([^)]+)\\)$/.exec(s.trim()); if (m) { const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; } m = /^color\\(srgb ([^)]+)\\)$/.exec(s.trim()); if (m) { const p = m[1].split(/[ \\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; } return [0, 0, 0, 0]; };";

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('af-note', 'Field notes\\nThe rain came late.', { origin: 'loose' });
    page('af-1', 'The harbour was quiet when she arrived.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('af-2', 'By the second week the town had decided what she was.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    page('af-3', 'The tide went out and stayed out.', { origin: 'project', projectId: brief.id, orderIndex: 2 });
    W.wrizoPatchEntry('af-1', { pageSettings: ${PS}, name: 'Arrival', level: 0, color: 'c' } });
    W.wrizoPatchEntry('af-2', { pageSettings: ${PS}, name: 'The town', level: 0, color: 'd' } });
    W.wrizoPatchEntry('af-3', { pageSettings: ${PS}, name: 'Low tide', level: 0 } });
    page('af-own', 'Plan canvas', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'The opening image', 0, 0.05), card('c2', 'The turn', 1, 0.2)])} });
    W.wrizoPatchEntry('af-own', { pageLinks: ${q([link('l1', 'c1', 'af-1'), link('l2', 'c2', 'af-1')])} });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, { w = 1366, lift = LIFT, arbor2 = true, room = null } = {}) {
  await app.emulateDpr(1, w, 768);
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 });
  await app.evalJs("window.wrizoTheme.set('plateau'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1${arbor2 ? '' : '&arbor2=0'}${lift ? '&reorglift=' + lift : ''}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
  if (room) { await app.evalJs(`document.documentElement.setAttribute('data-room', ${q(room)}); null`); await sleep(700); }
}
const drawer = async (app) => { if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); } };
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-sliver-tab-${id}')?.click(); null`); await sleep(500); };
const leaveFreeWrite = async (app) => { await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*draft\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()"); await sleep(900); };
const ratioJs = "const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }; const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };";

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'af-1');
  await leaveFreeWrite(app);
  await drawer(app);

  // AF1 / AF2
  const tabs = await app.evalJs(TABS);
  ok('AF1 the tab row reads FORMAT, SECTIONS, in that order (no INK on a Draft page), and the drawer opens on FORMAT',
    Array.isArray(tabs) && tabs.map((x) => x.text.toUpperCase()).join(',') === 'FORMAT,SECTIONS' && tabs.map((x) => x.id).join(',') === 'text,parts' && tabs.map((x) => x.on).join(',') === 'true,false', tabs);
  const cloth = {};
  for (const id of ['text', 'parts']) {
    await tab(app, id);
    cloth[id] = { tab: await app.evalJs(CS('#wz-sliver-tab-' + id, ['background-color', 'color', 'z-index'])), edge: await app.evalJs("(() => { const s = document.querySelector('.desk-frame-sliver-anchor'); return s ? getComputedStyle(s).getPropertyValue('--arbor2-chosen-l').trim() : null; })()") };
  }
  const want = { text: ['rgb(86, 99, 46)', '#56632E', null], parts: ['rgb(127, 160, 188)', '#7FA0BC', 'rgb(43, 29, 18)'] };
  const clothOk = Object.entries(want).every(([id, [bg, hex, ink]]) => cloth[id].tab && cloth[id].tab['background-color'] === bg && String(cloth[id].edge).toUpperCase() === hex && cloth[id].tab['z-index'] === '3' && (!ink || cloth[id].tab.color === ink));
  ok("AF2 the cloths: FORMAT olive, SECTIONS cold blue with walnut words; the open tab comes forward (z-index 3) and the drawer's edge takes its cloth", clothOk, cloth);

  // AF3: FORMAT
  await tab(app, 'text');
  const fmt = await app.evalJs(`(() => { const root = document.querySelector('.wz-sliver-panel'); const folds = [...root.querySelectorAll('[data-text-fold]')]; return { templates: !!root.querySelector('.wz-sliver-templates'), presetsHead: /ready-made|presets/i.test([...root.querySelectorAll('.wz-sliver-h')].map((h) => h.textContent).join(' ')), folds: folds.map((b) => ({ k: b.getAttribute('data-text-fold'), open: b.getAttribute('aria-expanded') })), typeface: !!root.querySelector('.wz-sliver-type'), setup: !!root.querySelector('.wz-page-setup') }; })()`);
  await tab(app, 'parts');
  const menu = await app.evalJs(`(async () => { const btn = document.querySelector('[data-doc-kind]'); if (!btn) return null; btn.click(); await new Promise((r) => setTimeout(r, 300)); const items = [...document.querySelectorAll('.reorg-dockind-item > button')].map((b) => (b.textContent || '').replace(/[▸▾]/g, '').trim()); const pre = [...document.querySelectorAll('.reorg-dockind-item > button')].find((b) => /^Presets/.test((b.textContent || '').trim())); if (pre) { pre.click(); await new Promise((r) => setTimeout(r, 300)); } const starts = document.querySelectorAll('[data-doc-sub="presets"] button').length; const su = [...document.querySelectorAll('.reorg-dockind-item > button')].find((b) => /^Page/.test((b.textContent || '').trim())); if (su) { su.click(); await new Promise((r) => setTimeout(r, 300)); } return { items, starts, setup: !!document.querySelector('[data-doc-sub="setup"] .wz-page-setup') }; })()`);
  await app.evalJs("document.querySelector('[data-doc-kind]')?.click(); null");
  ok("AF3 FORMAT: Arbor's Presets and Page setup live in the kind menu only: no templates section and no Page setup on FORMAT; the folds stand folded; the kind menu's Presets holds the ready-made starts and its Page setup holds the zone",
    !!fmt && fmt.templates === false && fmt.setup === false && fmt.typeface === true && fmt.folds.length >= 1 && fmt.folds.every((f) => f.open === 'false') && !!menu && menu.items.some((x) => /^Presets/.test(x)) && menu.starts >= 10 && menu.setup === true, { fmt, menu });

  // AF4: SECTIONS
  await sleep(300);
  const sec = await app.evalJs(`(() => { const root = document.querySelector('.wz-sliver-panel'); const head = root.querySelector('.reorg-parts-head'); const kind = root.querySelector('[data-doc-kind]'); const fresh = root.querySelector('[data-parts-new]'); const st = root.querySelector('[data-parts-structure-toggle]'); const body = root.querySelector('.reorg-parts-structure-body'); return { head: head ? head.textContent.trim() : null, kind: kind ? kind.textContent.replace(/[▸▾]/g, '').trim() : null, fresh: fresh ? fresh.textContent.replace('+', '').trim() : null, structure: st ? { open: st.getAttribute('aria-expanded'), hidden: !!(body && body.hidden) } : null, rows: root.querySelectorAll('.reorg-parts-row').length }; })()`);
  ok('AF4 SECTIONS: the kind menu at the head (Normal; its items Style guide, Presets, Page setup, Special Sections), "Sections (3)", "New section", Structure closed by default',
    !!sec && sec.kind === 'Normal' && sec.head === 'Sections (3)' && sec.fresh === 'New section' && !!sec.structure && sec.structure.open === 'false' && sec.structure.hidden === true && sec.rows === 3
      && !!menu && ['Style', 'Presets', 'Page', 'Special'].every((w) => menu.items.some((x) => x.startsWith(w))), { sec, items: menu && menu.items });

  // AF5: tags, tint, chosen row, by night and by day, measured from the drawn colours
  const measure = (room) => `(() => { ${PARSE} ${ratioJs}
    const root = document.querySelector('.wz-sliver-panel');
    const ground = (el) => { let g = [0, 0, 0, 0]; const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e); let base = [255, 255, 255]; for (const e of chain.reverse()) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0) base = base.map((v, i) => v * (1 - c[3]) + c[i] * c[3]); } return base; };
    const rows = [...root.querySelectorAll('.reorg-parts-row')];
    const out = rows.map((r) => { const name = r.querySelector('.reorg-parts-name'); const tag = r.querySelector('.reorg-parts-tag'); const rc = getComputedStyle(r); const bg = parse(rc.backgroundColor); const drawn = ground(r); const wash = Math.max(bg[3], parse(getComputedStyle(r.parentElement).backgroundColor)[3]); const fg = parse(getComputedStyle(name).color);
      const before = getComputedStyle(r, '::before'); const after = tag ? getComputedStyle(tag, '::after') : null; const tc = tag ? getComputedStyle(tag) : null;
      return { name: name.textContent, here: r.classList.contains('is-here'), tint: r.getAttribute('data-tint'), alpha: Math.round(wash * 100) / 100, weight: getComputedStyle(name).fontWeight, style: getComputedStyle(name).fontStyle, ink: fg.slice(0, 3).map(Math.round).join(','), ratio: Math.round(ratio(fg, drawn) * 100) / 100,
        mark: { w: before.width, bg: before.backgroundColor, left: before.left }, tag: tag ? { colour: tag.getAttribute('data-colour'), bg: tc.backgroundColor, num: after && after.content, fs: tc.fontSize } : null }; });
    return out; })()`;
  await open(app, 'af-1', { room: 'dark' }); await leaveFreeWrite(app); await drawer(app); await tab(app, 'parts');
  const night = await app.evalJs(measure('night'));
  await open(app, 'af-1', { room: 'light' }); await leaveFreeWrite(app); await drawer(app); await tab(app, 'parts');
  const day = await app.evalJs(measure('day'));
  await open(app, 'af-3', { room: 'light' }); await leaveFreeWrite(app); await drawer(app); await tab(app, 'parts');
  const dayPlain = await app.evalJs(measure('day'));
  const here = (rows) => rows && rows.find((r) => r.here);
  const tagOk = (rows) => !!rows && rows[0].tag.colour === 'c' && rows[0].tag.bg === 'rgb(127, 160, 188)' && /3/.test(rows[0].tag.num) && rows[0].tag.fs === '0px' && rows[1].tag.colour === 'd' && rows[1].tag.bg === 'rgb(168, 57, 47)' && /4/.test(rows[1].tag.num);
  const markOk = (r) => !!r && r.mark.w === '4px' && r.mark.bg === 'rgb(255, 152, 0)' && r.weight === '500' && r.style === 'normal';
  ok('AF5 tags and tint: the slot\'s cloth with its number (c = 3, d = 4); the chosen row washes at 22% of its cloth; its mark is 4 px brass, roman 500; brass words by night, olive by day (the drawer\'s dark olive on a tinted row); every pair reads 4.5:1 or better, measured from the drawn colours',
    tagOk(night) && tagOk(day) && markOk(here(night)) && markOk(here(day)) && markOk(here(dayPlain))
      && here(night).tint === 'c' && Math.abs(here(night).alpha - 0.22) < 0.02 && here(night).ink === '255,152,0' && here(night).ratio >= 4.5
      && here(day).tint === 'c' && here(day).ink === '51,64,31' && here(day).ratio >= 4.5
      && here(dayPlain).tint === null && here(dayPlain).ink === '85,97,45' && here(dayPlain).ratio >= 4.5,
    { night: here(night), day: here(day), dayPlain: here(dayPlain), tagsNight: night && night.slice(0, 2).map((r) => r.tag) });

  // AF6: the link badge: a cloth-edged count; the chosen row's wash runs the FULL row under it (Fable, Nov 21, 11:20 pm); its edge keeps 3:1 and its count 4.5:1 on that wash, by night and by day, measured from the drawn colours; a press opens GRAFTS at that Section
  const badgeProbe = (room) => `(() => { ${PARSE} ${ratioJs}
    const b = document.querySelector('[data-part-assets="af-1"]'); if (!b) return null; const li = b.closest('li'); const row = li && li.querySelector('.reorg-parts-row');
    const ground = (el) => { const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e); let base = [255, 255, 255]; for (const e of chain.reverse()) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0) base = base.map((v, i) => v * (1 - c[3]) + c[i] * c[3]); } return base; };
    const c = getComputedStyle(b); const edge = parse(c.borderTopColor); const ink = parse(c.color); const drawn = ground(b);
    const lb = li.getBoundingClientRect(), bb = b.getBoundingClientRect(); const liBg = parse(getComputedStyle(li).backgroundColor), rowBg = parse(getComputedStyle(row).backgroundColor);
    return { room: ${q(room)}, text: (b.textContent || '').replace(/\\s+/g, ' ').trim(), border: c.borderTopColor, width: c.borderTopWidth, edgeRatio: Math.round(ratio(edge, drawn) * 100) / 100, textRatio: Math.round(ratio(ink, drawn) * 100) / 100,
      wash: { li: Math.round(liBg[3] * 100) / 100, row: Math.round(rowBg[3] * 100) / 100, underBadge: bb.left >= lb.left - 0.5 && bb.right <= lb.right + 0.5 && bb.top >= lb.top - 0.5 && bb.bottom <= lb.bottom + 0.5 } }; })()`;
  await open(app, 'af-1', { room: 'dark' }); await leaveFreeWrite(app); await drawer(app); await tab(app, 'parts');
  const badgeNight = await app.evalJs(badgeProbe('night'));
  await open(app, 'af-1', { room: 'light' }); await leaveFreeWrite(app); await drawer(app); await tab(app, 'parts');
  const badgeDay = await app.evalJs(badgeProbe('day'));
  await app.evalJs("document.querySelector('[data-part-assets=\"af-1\"]')?.click(); null"); await sleep(700);
  const opened = await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.getAttribute('data-on') === 'true' && document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  const badgeOk = (x, edge) => !!x && /[1-9]/.test(x.text) && x.border === edge && x.width === '1px' && x.edgeRatio >= 3 && x.textRatio >= 4.5 && Math.abs(x.wash.li - 0.22) < 0.02 && x.wash.row === 0 && x.wash.underBadge === true;
  ok('AF6 the link badge is a cloth-edged count: its edge keeps 3:1 and its count 4.5:1 on the chosen row wash (which runs the full row, under the badge too), by night and by day; a press opens GRAFTS at that Section',
    badgeOk(badgeNight, 'rgb(127, 160, 188)') && badgeOk(badgeDay, 'rgb(74, 96, 118)') && opened === true, { badgeNight, badgeDay, opened });

  // AF7: PAGE IS PRIMARY
  await open(app, 'af-1'); await leaveFreeWrite(app);
  const mark = await app.evalJs("document.querySelector('.forward-only-editor').__afMark = 1; " + PAGE);
  await drawer(app); await tab(app, 'parts'); await tab(app, 'text');
  const after = await app.evalJs(PAGE);
  const same = await app.evalJs("!!document.querySelector('.forward-only-editor').__afMark");
  const geo = { w1366: mark === after && same };
  await open(app, 'af-1', { w: 1920 }); await leaveFreeWrite(app);
  const m2 = await app.evalJs(PAGE);
  await drawer(app); await tab(app, 'parts'); await tab(app, 'text');
  geo.w1920 = m2 === (await app.evalJs(PAGE));
  ok('AF7 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same before and after opening the Front menu and moving through its tabs; the editor is the same node', geo.w1366 && geo.w1920, { geo, mark, after, m2 });

  // AF8: Free Write has no Front menu; Publish
  await open(app, 'af-1', { lift: LIFT + ',plateau.uplink' });
  const free = await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*free write\\s*$/i.test(b.textContent || '')); if (!el) return false; el.click(); return true; })()");
  await sleep(900);
  const noFront = await app.evalJs("({ sliver: !!document.querySelector('.wz-sliver'), tabs: document.querySelectorAll('[id^=\"wz-sliver-tab-\"]').length })");
  await leaveFreeWrite(app);
  for (let i = 0; i < 3 && !(await app.evalJs("!!document.querySelector('[data-reorg-pub]')")); i += 1) { await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sleep(900); }
  await drawer(app);
  const pub = await app.evalJs(`(() => { const all = [...document.querySelectorAll('[id^="wz-sliver-tab-"]')]; return { tabs: all.map((b) => ({ id: b.id.replace('wz-sliver-tab-', ''), on: b.getAttribute('data-on') === 'true', disabled: b.getAttribute('data-disabled') === 'true', title: b.getAttribute('title') || '', opacity: getComputedStyle(b).opacity })), list: document.querySelectorAll('.reorg-pubparts-row').length, pubView: !!document.querySelector('[data-reorg-pub]') }; })()`);
  const fmtTab = pub && pub.tabs.find((x) => x.id === 'text'), secTab = pub && pub.tabs.find((x) => x.id === 'parts');
  ok('AF8 Free Write has no Front menu; Publish: FORMAT is greyed with the note, SECTIONS stands (the chosen tab) and shows the Publish list',
    free === true && !!noFront && noFront.sliver === false && noFront.tabs === 0 && !!pub && pub.pubView === true && !!fmtTab && fmtTab.disabled === true && fmtTab.title === 'Format and Ink rest in Publish. Go back to Revise to change the words.' && Number(fmtTab.opacity) < 0.6 && !!secTab && secTab.on === true && secTab.disabled === false && pub.list >= 3, { free, noFront, pub });

  // AF9: OFF
  await open(app, 'af-1', { lift: '' }); await leaveFreeWrite(app);
  await drawer(app);
  const off = await app.evalJs(TABS);
  await open(app, 'af-1', { arbor2: false }); await leaveFreeWrite(app);
  await drawer(app);
  const classic = await app.evalJs("(() => { const all = [...document.querySelectorAll('[id^=\"wz-sliver-tab-\"]')]; return { tabs: all.length ? all.map((b) => b.id.replace('wz-sliver-tab-', '')) : null, reorg: !!document.querySelector('.reorg-parts, [data-reorg-parts]') }; })()");
  ok("AF9 OFF: without the door Arbor's own drawer stands (Format | Presets, no SECTIONS tab); with ?arbor2=0 even the door gives no Front menu",
    Array.isArray(off) && off.map((x) => x.id).join(',') === 'format,presets' && !!classic && !(classic.tabs || []).includes('parts') && classic.reorg === false, { off, classic });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1800)}`);
const EXPECTED = 9;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ARBOR-FRONT-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ARBOR-FRONT-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
