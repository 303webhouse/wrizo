// THE TEAM B RESTYLE, slice 2: THE PARTS TAB (Fable's 12:15 pm cut, Nov 20: "1A: the head shows the kind, and its menu holds what exists today;
// 1B; 1C: the default palette ... the brass bar only with the default colours; 1D: 'Merge', and Structure closed by default; Decision 2's link
// badge"; the stage menus, draft 3: "At the head in BUILD and EDIT: the Doc's kind. It opens Style Guide (MLA · APA · Chicago · AP), Presets,
// Page Setup and Special Parts"; P2 "Parts (n) · New Part. Structure (closed by default): Split · Merge · Move · Nest / Unnest"). Machina, ?reorg=1.
// Every write is an existing one: the style guide is the page's own setting (the Front menu's act), a Special Part is INK's newPart with its
// template, Structure's acts are POLISH's row acts on the Part she is on. The badge only carries its count: POLISH wires its press (Nov 20).
//
// The fixture (seams only; WS_PLACE=1): a set "Novel" in a Drawer, four Parts wb-1..wb-4 ("Chapter one".."Chapter four"); wb-1's plan board
// wb-own (card a1) and links to a card of board wb-x (x1) and the doc wb-q: three assets; wb-3 coloured slot c.
//
// HEAD    K1  BUILD: the head's kind reads "Standard", a closed toggle, above "Parts (4)"
//         K2  pressed, it lists Style Guide, Page Setup, Special Parts, Presets, in that order, each folded (▸); Style Guide opens MLA, APA,
//             Chicago, AP, MLA marked; Escape closes the menu and gives the focus back to the toggle
//         K3  Style Guide ▸ APA stores pageSettings.styleGuide 'apa' on wb-1, and nothing else changes
//         K4  Special Parts ▸ Title Page adds a Part "Title Page" with template 'title' FIRST in the Doc; Bibliography adds "Bibliography" with
//             template 'bibliography' LAST; she stays on her page (same rects, same editor node); no other text changes
// STRUCT  S1  BUILD: "Structure" is closed by default (aria-expanded false); open, it holds Split, Move Up, Move Down, Nest, Unnest and Merge
//             for the Part she is on; "New Part" stays outside it
//         S2  Structure's Move Down moves wb-1 below wb-2: only the order changes, every text identical, she stays on wb-1
// ROWS    R1  a row's word count is set smaller than its name
//         R2  the Part she is on wears the brass bar (a default colour, or none); on a coloured Part (wb-3, slot c) the row wears its tile's
//             tint and its name reads 4.5:1 or better on it
//         R2 [brass successor] (colour B, Nov 21) the bar is drawn in --brass; MUT-R2  the bar in #E6E8EA fails it
//         R3  wb-1's row carries [data-part-assets="wb-1"] reading 3 (its Assets tab's rows); wb-2 has none (no assets)
//         R4  (Nov 20, POLISH's reading, Actions 44870378376) every row draws inside its own box (nothing past its edge, so nothing under the
//             link badge), and a press at the badge's centre reaches the badge
// STAGES  T1  EDIT: the kind toggle and Structure, without Nest / Unnest; SPRINT: neither (New Part only)
// WORDS   W1  every new word is a lexicon key (terms.ts, the canonical table, used in the source); Machina's in Title Case
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-b-parts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const hex = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return '#' + p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase(); };
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const TEXTS = `Object.fromEntries(${ALL}.filter((e) => !e.deletedAt).map((e) => [e.id, e.text ?? '']))`;
const ORDER = (set) => `${ALL}.filter((e) => e.projectId === ${q(set)} && !e.deletedAt).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((e) => [e.id, e.pageSettings?.name ?? null, e.pageSettings?.template ?? null])`;
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const txt = (el) => `((${el})?.textContent || '').replace(/\\s+/g, ' ').trim()`;
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400); }

async function seed(app) {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  return app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction');
    const novel = W.wrizoCreateProject('Novel'); W.wrizoSetProjectDrawer(novel.id, drawer.id);
    page('wb-own', 'Own board', { origin: 'loose', pageType: 'board', boxes: ${q([card('a1', 'Alpha', 0, 0.05)])} });
    page('wb-x', 'X board', { origin: 'loose', pageType: 'board', boxes: ${q([card('x1', 'Xcard one', 0, 0.05)])} });
    page('wb-q', 'A linked doc', { origin: 'loose' });
    ['one', 'two', 'three', 'four'].forEach((w, i) => page('wb-' + (i + 1), 'Chapter ' + w, { origin: 'project', projectId: novel.id, orderIndex: i }));
    W.wrizoPatchEntry('wb-1', { planBoardId: 'wb-own' });
    const l1 = W.wrizoAddPageLink('wb-1', { bEntryId: 'wb-x', bBoxId: 'x1' });
    const l2 = W.wrizoAddPageLink('wb-1', { bEntryId: 'wb-q' });
    const P = W.wrizoParts; const coloured = !!P && P.setPartColor('wb-3', 'c');
    W.wrizoFlushNow();
    return { novel: novel.id, links: !!(l1 && l2), coloured };
  })()`);
}

async function openAt(app, id, key) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await stage(app, key);
}
async function stage(app, key) {
  await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`);
  await app.waitFor(`document.querySelector('.reorg-top [data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(400);
}
const L = "document.querySelector('.wz-sliver [data-reorg-parts]')";
const KIND = `(() => { const l = ${L}; if (!l) return null; const k = l.querySelector('[data-doc-kind]'); const h = l.querySelector('.reorg-parts-head');
  return { kind: k ? ${txt('k')} : null, expanded: k ? k.getAttribute('aria-expanded') : null, menu: !!l.querySelector('[data-doc-menu]'), head: ${txt('h')},
    kindAbove: !!k && !!h && !!(k.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) }; })()`;
const STRUCT = `(() => { const l = ${L}; if (!l) return null; const s = l.querySelector('[data-parts-structure]'); const b = s && s.querySelector('[data-parts-structure-toggle]');
  return s ? { expanded: b ? b.getAttribute('aria-expanded') : null, acts: [...s.querySelectorAll('[data-structure-act]')].map((x) => [x.getAttribute('data-structure-act'), ${txt('x')}]),
    newInside: !!s.querySelector('[data-parts-new]'), newOutside: !!l.querySelector('[data-parts-new]') } : null; })()`;

await withHarness(async (app) => {
  const ids = await seed(app);
  await openAt(app, 'wb-1', 'draft');

  // ---- HEAD ------------------------------------------------------------------------------------------------------------------------------
  const k1 = await app.evalJs(KIND);
  ok('K1 BUILD: the head\'s kind reads "Standard", a closed toggle, above "Parts (4)"',
    ids.links && !!k1 && /^Standard\b/.test(k1.kind || '') && k1.expanded === 'false' && !k1.menu && k1.head === 'Parts (4)' && k1.kindAbove, { ids, k1 });

  await app.evalJs(`(() => { const k = ${L}?.querySelector('[data-doc-kind]'); if (k) { k.focus(); k.click(); } return null; })()`); await sleep(300);
  const items = await app.evalJs(`(() => { const m = document.querySelector('[data-doc-menu]'); return m ? [...m.querySelectorAll('[data-doc-menu-item]')].map((b) => [b.getAttribute('data-doc-menu-item'), ${txt('b')}, b.getAttribute('aria-expanded')]) : null; })()`);
  await app.evalJs(click('[data-doc-menu] [data-doc-menu-item="style"]')); await sleep(250);
  const guides = await app.evalJs(`(() => { const m = document.querySelector('[data-doc-menu] [data-doc-sub="style"]'); return m ? [...m.querySelectorAll('[data-style-pick]')].map((b) => [b.getAttribute('data-style-pick'), ${txt('b')}, b.getAttribute('aria-checked')]) : null; })()`);
  await app.evalJs("document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); null"); await sleep(250);
  const esc = await app.evalJs(`(() => ({ menu: !!document.querySelector('[data-doc-menu]'), focusBack: document.activeElement === ${L}?.querySelector('[data-doc-kind]') }))()`);
  const want = [['style', 'Style Guide'], ['setup', 'Page Setup'], ['special', 'Special Parts'], ['presets', 'Presets']];
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:15 pm: the kind menu's acts are INK's: the Style Guide is the DOC's own and offers None, there are six Special Parts, and the sources Part wears the style guide's word). The original, verbatim:
  // ok('K2 pressed, it lists Style Guide, Page Setup, Special Parts, Presets, each folded; Style Guide opens MLA, APA, Chicago, AP (MLA marked); Escape closes and gives the focus back',
  // !!items && items.length === 4 && want.every(([k, w], i) => items[i][0] === k && items[i][1].startsWith(w) && items[i][2] === 'false')
  // && !!guides && guides.map((g) => g[0]).join(',') === 'mla,apa,chicago,ap' && guides[0][2] === 'true' && !esc.menu && esc.focusBack, { items, guides, esc });
  ok('K2 [successor] pressed, it lists Style Guide, Page Setup, Special Parts, Presets, each folded; Style Guide opens None, MLA, APA, Chicago, AP (None marked: the Doc has none yet); Escape closes and gives the focus back',
    !!items && items.length === 4 && want.every(([k, w], i) => items[i][0] === k && items[i][1].startsWith(w) && items[i][2] === 'false')
      && !!guides && guides.map((g) => g[0]).join(',') === 'none,mla,apa,chicago,ap' && guides[0][2] === 'true' && guides.slice(1).every((g) => g[2] === 'false') && !esc.menu && esc.focusBack, { items, guides, esc });

  const r0 = await app.evalJs(PAGE);
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__bpMark = 1; return null; })()");
  const k3a = await app.evalJs(`${ALL}`);
  await app.evalJs(click(`.wz-sliver [data-reorg-parts] [data-doc-kind]`)); await sleep(250);
  await app.evalJs(click('[data-doc-menu] [data-doc-menu-item="style"]')); await sleep(250);
  await app.evalJs(click('[data-doc-menu] [data-style-pick="apa"]'));
  await settle(app);
  const k3b = await app.evalJs(`${ALL}`);
  const docRec = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-projects') || '[]')).find((p) => p.id === ${q(ids.novel)}) || null`);
  const w1a = k3a.find((e) => e.id === 'wb-1') || {}, w1b = k3b.find((e) => e.id === 'wb-1') || {};
  const othersSame = JSON.stringify(k3a.filter((e) => e.id !== 'wb-1')) === JSON.stringify(k3b.filter((e) => e.id !== 'wb-1'));
  const psDiff = Object.keys({ ...(w1a.pageSettings || {}), ...(w1b.pageSettings || {}) }).filter((k) => JSON.stringify((w1a.pageSettings || {})[k]) !== JSON.stringify((w1b.pageSettings || {})[k]));
  // (Nov 20, before this file's first green; Actions 44825171366: wb-1 had no pageSettings, so the host's existing act wrote the default dress beside the
  // pick) every other key that changed was ABSENT before and now reads the app's default dress; nothing she had set changes
  const DRESS = { margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };
  const onlyDress = psDiff.filter((k) => k !== 'styleGuide').every((k) => !((w1a.pageSettings || {})[k] !== undefined) && JSON.stringify((w1b.pageSettings || {})[k]) === JSON.stringify(DRESS[k]));
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:15 pm: the kind menu's acts are INK's: the Style Guide is the DOC's own and offers None, there are six Special Parts, and the sources Part wears the style guide's word). The original, verbatim:
  // ok('K3 Style Guide ▸ APA stores pageSettings.styleGuide \'apa\' on wb-1, and nothing she set changes (keys that were absent read the default dress)',
  // (w1b.pageSettings || {}).styleGuide === 'apa' && psDiff.includes('styleGuide') && onlyDress && w1a.text === w1b.text && othersSame, { ps: w1b.pageSettings, psDiff, othersSame });
  const APA = { margins: 'normal', lineSpacing: 2, size: 12, pageNumbers: { on: true, placement: 'top-right' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };
  const inDoc = (e) => e.projectId === ids.novel;
  const everyPartSet = k3b.filter((e) => inDoc(e) && !e.deletedAt).every((e) => Object.keys(APA).every((k) => JSON.stringify((e.pageSettings || {})[k]) === JSON.stringify(APA[k])));
  const outsideSame = JSON.stringify(k3a.filter((e) => !inDoc(e))) === JSON.stringify(k3b.filter((e) => !inDoc(e)));
  const textsSame = k3a.every((e) => (k3b.find((x) => x.id === e.id) || {}).text === e.text);
  ok('K3 [successor] Style Guide > APA is saved to the DOC\'s own record (docSettings.styleGuide), sets APA\'s Page Setup on every Part of the Doc, writes no word, and touches nothing outside the Doc; the page\'s own styleGuide key is no longer the store',
    !!docRec && !!docRec.docSettings && docRec.docSettings.styleGuide === 'apa' && everyPartSet && textsSame && outsideSame && (w1b.pageSettings || {}).styleGuide === undefined, { docRec: docRec && docRec.docSettings, everyPartSet, textsSame, outsideSame });

  const t4a = await app.evalJs(TEXTS);
  await app.evalJs(click(`.wz-sliver [data-reorg-parts] [data-doc-kind]`)); await sleep(250);
  await app.evalJs(click('[data-doc-menu] [data-doc-menu-item="special"]')); await sleep(250);
  const specials = await app.evalJs("[...document.querySelectorAll('[data-doc-menu] [data-special-pick]')].map((b) => [b.getAttribute('data-special-pick'), (b.textContent || '').trim()])");
  await app.evalJs(click('[data-doc-menu] [data-special-pick="title"]')); await settle(app);
  await app.evalJs(click(`.wz-sliver [data-reorg-parts] [data-doc-kind]`)); await sleep(250);
  await app.evalJs(click('[data-doc-menu] [data-doc-menu-item="special"]')); await sleep(250);
  await app.evalJs(click('[data-doc-menu] [data-special-pick="sources"]')); await settle(app);   // the sources Part is one pick now, named by the style guide (APA: References)
  const order = await app.evalJs(ORDER(ids.novel));
  const t4b = await app.evalJs(TEXTS);
  const r1 = await app.evalJs(PAGE);
  const sameNode = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__bpMark");
  const here = await app.evalJs("location.hash");
  const kept = Object.keys(t4a).every((id) => t4b[id] === t4a[id]);
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:15 pm: the kind menu's acts are INK's: the Style Guide is the DOC's own and offers None, there are six Special Parts, and the sources Part wears the style guide's word). The original, verbatim:
  // ok('K4 Special Parts ▸ Title Page adds "Title Page" (template title) FIRST; Bibliography adds "Bibliography" (template bibliography) LAST; she stays on her page; no other text changes',
  // order.length === 6 && order[0][1] === 'Title Page' && order[0][2] === 'title' && order[5][1] === 'Bibliography' && order[5][2] === 'bibliography'
  // && order.slice(1, 5).map((o) => o[0]).join(',') === 'wb-1,wb-2,wb-3,wb-4' && kept && r0 === r1 && sameNode && /wb-1/.test(here), { order, kept, r0, r1, sameNode, here });
  ok('K4 [successor] Special Parts lists Title Page, Abstract, Table of Contents, Acknowledgements, References (APA\'s word), Appendix; Title Page adds "Title Page" (template title) FIRST; the sources pick adds "References" (template bibliography) LAST; she stays on her page; no other text changes',
    JSON.stringify(specials) === JSON.stringify([['title', 'Title Page'], ['abstract', 'Abstract'], ['toc', 'Table of Contents'], ['ack', 'Acknowledgements'], ['sources', 'References'], ['appendix', 'Appendix']])
      && order.length === 6 && order[0][1] === 'Title Page' && order[0][2] === 'title' && order[5][1] === 'References' && order[5][2] === 'bibliography'
      && order.slice(1, 5).map((o) => o[0]).join(',') === 'wb-1,wb-2,wb-3,wb-4' && kept && r0 === r1 && sameNode && /wb-1/.test(here), { specials, order, kept, r0, r1, sameNode, here });

  // K5 Presets (Fable, Nov 20, 4:15 pm; the approved draft): the Standard Doc's four groups (3 academic, 4 business, 4 web and journalism, 3 creative); a preset in a Doc with words adds its Parts after hers
  const t5a = await app.evalJs(TEXTS);
  await app.evalJs(click(`.wz-sliver [data-reorg-parts] [data-doc-kind]`)); await sleep(250);
  await app.evalJs(click('[data-doc-menu] [data-doc-menu-item="presets"]')); await sleep(250);
  const groups = await app.evalJs("[...document.querySelectorAll('[data-doc-menu] [data-preset-group]')].map((g) => [g.getAttribute('data-preset-group'), g.querySelectorAll('[data-preset-pick]').length])");
  await app.evalJs(click('[data-doc-menu] [data-preset-pick="memo"]')); await settle(app);
  const order5 = await app.evalJs(ORDER(ids.novel));
  const t5b = await app.evalJs(TEXTS);
  const ps5 = await app.evalJs(`${ALL}.filter((e) => e.projectId === ${q(ids.novel)} && !e.deletedAt).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).slice(6).map((e) => [e.pageSettings?.lineSpacing, e.pageSettings?.size, e.text])`);
  ok('K5 Presets lists academic 7, business 9, web 7, creative 11 (the live 3, 4, 4, 3 first, then the first slice\'s 4, 5, 3, 8: PRESETS-B, Nov 23); Memo adds Header, Purpose, Discussion, Action Needed AFTER her six Parts (which keep their order and every word), empty, in APA\'s Page Setup; she stays on her page',
    JSON.stringify(groups) === JSON.stringify([['academic', 7], ['business', 9], ['web', 7], ['creative', 11]]) && order5.length === 10 && order5.slice(0, 6).map((o) => o[0]).join() === order.map((o) => o[0]).join()
      && order5.slice(6).map((o) => o[1]).join('|') === 'Header|Purpose|Discussion|Action Needed' && Object.keys(t5a).every((id) => t5b[id] === t5a[id]) && ps5.length === 4 && ps5.every((p) => p[0] === 2 && p[1] === 12 && p[2] === '') && /wb-1/.test(await app.evalJs('location.hash')), { groups, order5, ps5 });

  // ---- STRUCTURE -------------------------------------------------------------------------------------------------------------------------
  const s0 = await app.evalJs(STRUCT);
  await app.evalJs(click('.wz-sliver [data-parts-structure] [data-parts-structure-toggle]')); await sleep(300);
  const s1 = await app.evalJs(STRUCT);
  const r2 = await app.evalJs(PAGE);
  const wantActs = [['split', 'Split'], ['up', 'Move Up'], ['down', 'Move Down'], ['in', 'Nest'], ['out', 'Unnest'], ['join', 'Merge']];
  ok('S1 BUILD: "Structure" is closed by default; open, it holds Split, Move Up, Move Down, Nest, Unnest, Merge for the Part she is on; "New Part" stays outside; the page holds still',
    !!s0 && s0.expanded === 'false' && !!s1 && s1.expanded === 'true' && JSON.stringify(s1.acts) === JSON.stringify(wantActs) && !s1.newInside && s1.newOutside && r2 === r1, { s0, s1, r1, r2 });

  const m0 = await app.evalJs(TEXTS);
  await app.evalJs(click('.wz-sliver [data-parts-structure] [data-structure-act="down"]')); await settle(app);
  const order2 = await app.evalJs(ORDER(ids.novel));
  const m1 = await app.evalJs(TEXTS);
  const here2 = await app.evalJs("location.hash");
  ok('S2 Structure\'s Move Down moves wb-1 below wb-2: only the order changes, every text identical, she stays on wb-1',
    order2.map((o) => o[0]).slice(1, 5).join(',') === 'wb-2,wb-1,wb-3,wb-4' && JSON.stringify(m0) === JSON.stringify(m1) && /wb-1/.test(here2), { order2, here2 });

  // ---- ROWS ------------------------------------------------------------------------------------------------------------------------------
  const r1s = await app.evalJs(`(() => { const li = ${L}?.querySelector('li[data-part-li="wb-2"]'); const n = li?.querySelector('.reorg-parts-name'), w = li?.querySelector('.reorg-parts-words');
    return n && w ? { name: parseFloat(getComputedStyle(n).fontSize), words: parseFloat(getComputedStyle(w).fontSize) } : null; })()`);
  ok('R1 a row\'s word count is set smaller than its name', !!r1s && r1s.words < r1s.name, r1s);

  const bar = await app.evalJs(`(() => { const b = ${L}?.querySelector('[data-part-row="wb-1"]'); if (!b) return null; const cs = getComputedStyle(b, '::before');
    return { here: b.getAttribute('aria-current'), bar: b.getAttribute('data-here-bar'), bg: cs.backgroundColor, brass: getComputedStyle(document.documentElement).getPropertyValue('--accent-rest').trim(), brassB: getComputedStyle(document.documentElement).getPropertyValue('--brass').trim() }; })()`);
  await openAt(app, 'wb-3', 'draft');
  const tint = await app.evalJs(`(() => { const b = ${L}?.querySelector('[data-part-row="wb-3"]'); if (!b) return null; const n = b.querySelector('.reorg-parts-name');
    return { here: b.getAttribute('aria-current'), bar: b.getAttribute('data-here-bar'), tint: b.getAttribute('data-tint'), bg: getComputedStyle(b).backgroundColor, ink: n ? getComputedStyle(n).color : null }; })()`);
  const tintR = tint && hex(tint.bg) && hex(tint.ink) ? ratio(hex(tint.bg), hex(tint.ink)) : 0;
  // SUPERSEDED (colour B, arbor/colour-b 44cbb0ef, train H; Nick, Nov 21: "brass bar Default only"; the Wrizors' §2e, brass chosen: in Default the here bar
  // is drawn in BRASS, var(--brass) (23-reorg-top.css), where it had drawn --accent-rest's grey #E6E8EA under the name "brass"; Chat 1's pair 44973956599 on
  // train-h4 3ab78c73 read #FF9800 against #E6E8EA). The original, verbatim:
  // ok('R2 the Part she is on wears the brass bar (default colour or none); a coloured Part she is on (wb-3, slot c) wears its tile\'s tint, its name 4.5:1 or better on it',
  //   !!bar && bar.here === 'true' && bar.bar === 'brass' && hex(bar.bg) === (bar.brass || '').toUpperCase() && !!tint && tint.here === 'true' && tint.bar === 'brass' && tint.tint === 'c'
  //     && !/rgba\([^)]*,\s*0\)/.test(tint.bg) && tintR >= 4.5, { bar, tint, tintR: +tintR.toFixed(2) });
  const r2b = (b) => !!b && b.here === 'true' && b.bar === 'brass' && !!b.brassB && hex(b.bg) === b.brassB.toUpperCase();
  ok('R2 [brass successor] the Part she is on wears the brass bar in brass (--brass; default colour or none); a coloured Part she is on (wb-3, slot c) wears its tile\'s tint, its name 4.5:1 or better on it',
    r2b(bar) && !!tint && tint.here === 'true' && tint.bar === 'brass' && tint.tint === 'c'
      && !/rgba\([^)]*,\s*0\)/.test(tint.bg) && tintR >= 4.5, { bar, tint, tintR: +tintR.toFixed(2) });
  const greyBar = bar ? { ...bar, bg: 'rgb(230, 232, 234)' } : null;
  ok('MUT-R2 the same bar drawn in --accent-rest\'s grey #E6E8EA (the shape before colour B) fails R2\'s successor', r2b(bar) && !r2b(greyBar), greyBar);

  const badge = await app.evalJs(`(() => { const l = ${L}; if (!l) return null; const b1 = l.querySelector('[data-part-assets="wb-1"]'), b2 = l.querySelector('[data-part-assets="wb-2"]');
    return { b1: b1 ? ${txt('b1')} : null, b1label: b1 ? b1.getAttribute('aria-label') : null, b2: !!b2 }; })()`);
  ok('R3 wb-1\'s row carries [data-part-assets="wb-1"] reading 3 (its Assets tab\'s rows), with words for a screen reader; wb-2 has none',
    !!badge && /\b3\b/.test(badge.b1 || '') && !!badge.b1label && /3/.test(badge.b1label) && !badge.b2, badge);

  // R4 (Nov 20; POLISH's reading, Actions 44870378376: in the Sliver at 1920 a row's word count ran past its box and under the link badge, the
  // row being position:relative, so a press at the badge's centre landed on the row and opened the Part). A child's rect is read, not what is
  // painted: a clip alone (overflow:hidden) would still leave the words past the edge, and this stays red.
  const fit = await app.evalJs(`(() => { const l = ${L}; if (!l) return null; const rows = [...l.querySelectorAll('li[data-part-li] > .reorg-parts-row')];
    const each = rows.map((r) => { const b = r.getBoundingClientRect(); const out = [...r.children].filter((c) => c.getBoundingClientRect().right > b.right + 0.5).map((c) => String(c.className));
      const nm = r.querySelector('.reorg-parts-name'); return { id: r.getAttribute('data-part-row'), w: Math.round(b.width), sw: r.scrollWidth, cw: r.clientWidth, out, name: nm ? Math.round(nm.getBoundingClientRect().width) : null }; });
    const g = l.querySelector('[data-part-assets="wb-1"]'); let reach = null, hit = null;
    if (g) { const r = g.getBoundingClientRect(); const x = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); reach = !!x && (x === g || g.contains(x)); hit = x ? x.tagName + '.' + String(x.className).slice(0, 40) : null; }
    return { n: rows.length, spill: each.filter((o) => o.out.length || o.sw > o.cw + 1), widths: each.map((o) => o.w), names: each.map((o) => o.name), reach, hit }; })()`);
  ok('R4 every row draws inside its own box (nothing past its edge, nothing under the link badge), and a press at the badge\'s centre reaches the badge',
    !!fit && fit.n >= 4 && fit.spill.length === 0 && fit.reach === true, fit);

  // ---- STAGES ----------------------------------------------------------------------------------------------------------------------------
  await openAt(app, 'wb-1', 'revise');
  const e1 = { kind: await app.evalJs(KIND), st: null };
  await app.evalJs(click('.wz-sliver [data-parts-structure] [data-parts-structure-toggle]')); await sleep(300);
  e1.st = await app.evalJs(STRUCT);
  await stage(app, 'freewrite');
  const f1 = { kind: await app.evalJs(KIND), st: await app.evalJs(STRUCT) };
  // SUPERSEDED (Nov 21, train F pair 44944613263; main's sprint-no-menus, live in train E: SPRINT draws no Front menu at all): T1 asked SPRINT for the Parts list WITHOUT the kind toggle (!!f1.kind && !f1.kind.kind); SPRINT now draws no list. T1-B keeps
  // the claim - in SPRINT neither the kind toggle nor Structure - with no list counting as neither. Verbatim:
  // ok('T1 EDIT: the kind toggle and Structure, without Nest / Unnest; SPRINT: neither',
  //   !!e1.kind && !!e1.kind.kind && !!e1.st && e1.st.acts.map((a) => a[0]).join(',') === 'split,up,down,join' && !!f1.kind && !f1.kind.kind && !f1.st, { e1, f1 });
  const t1b = (e, f) => !!e.kind && !!e.kind.kind && !!e.st && e.st.acts.map((a) => a[0]).join(',') === 'split,up,down,join' && !(f.kind && f.kind.kind) && !f.st;
  ok('T1-B EDIT: the kind toggle and Structure, without Nest / Unnest; SPRINT: neither (no list at all counts as neither)', t1b(e1, f1), { e1, f1 });
  // MUT-T1-B: a SPRINT reading that draws the kind toggle turns T1-B red (the mutant LANDED: the reading changed)
  const fk = { ...f1, kind: { ...(f1.kind || {}), kind: 'Standard' } };
  ok('MUT-T1-B a SPRINT that draws the kind toggle turns T1-B red', fk.kind.kind !== (f1.kind && f1.kind.kind) && !t1b(e1, fk), fk);
  // ORIGINAL, SUPERSEDED Nov 21 (Fable, 9:40 pm: Free Write has no Front menu, by design: POLISH hid the drawer in SPRINT, so there is no Parts list there to hold a kind toggle or Structure; the old reading expected the list present and its menus absent). The original, verbatim:
  // ok('T1 EDIT: the kind toggle and Structure, without Nest / Unnest; SPRINT: neither',
  // !!e1.kind && !!e1.kind.kind && !!e1.st && e1.st.acts.map((a) => a[0]).join(',') === 'split,up,down,join' && !!f1.kind && !f1.kind.kind && !f1.st, { e1, f1 });
  // SUCCESSOR: EDIT keeps the kind toggle and Structure, without Nest / Unnest; SPRINT has no Front menu at all: no Parts list, no kind toggle, no Structure (both probes find nothing), and no drawer
  const sprintNoFront = (f) => !!f && f.kind === null && f.st === null && f.drawer === false;
  f1.drawer = await app.evalJs("!!document.querySelector('.wz-sliver')");
  const t1Mutant = sprintNoFront({ kind: { kind: null, head: 'Parts (3)' }, st: null, drawer: true });   // the old shape (a list with its menus off) must read RED under the successor
  ok('T1 EDIT: the kind toggle and Structure, without Nest / Unnest; SPRINT: no Front menu at all',
    !!e1.kind && !!e1.kind.kind && !!e1.st && e1.st.acts.map((a) => a[0]).join(',') === 'split,up,down,join' && sprintNoFront(f1) && t1Mutant === false, { e1, f1, t1Mutant });
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const mach = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'overrides', 'machina.ts'), 'utf8');
  const used = ['reorg/PartsList.tsx', 'reorg/DocKindMenu.tsx'].map((f) => fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '').join('\n');
  // ORIGINAL, SUPERSEDED Nov 21 (the kind menu's Special Parts are drawn from reorg/docKinds.ts, six of them, the sources Part wearing the style guide's word: the menu no longer draws the two words the old list did, so those two keys are
  // declared but not drawn there). The original, verbatim:
  // const need = ['reorgDocKindStandard', 'reorgDocKindScreenplay', 'reorgDocKindAria', 'reorgDocStyleGuide', 'reorgDocPageSetup', 'reorgDocSpecialParts', 'reorgDocPresets',
  //   'reorgSpecialTitle', 'reorgSpecialBibliography', 'reorgPartsStructure', 'reorgPartAssetsOne', 'reorgPartAssetsMany'];
  // const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !used.includes(`'${k}'`));
  // ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used in the source); the headings read in Title Case', missing.length === 0 && title.length === 0, { missing, title });
  const need = ['reorgDocKindStandard', 'reorgDocKindScreenplay', 'reorgDocKindAria', 'reorgDocStyleGuide', 'reorgDocPageSetup', 'reorgDocSpecialParts', 'reorgDocPresets',
    'reorgPartsStructure', 'reorgPartAssetsOne', 'reorgPartAssetsMany'];
  const gone = (src) => need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !src.includes(`'${k}'`));
  const missing = gone(used);
  const title = ['reorgDocStyleGuide: \'Style Guide\'', 'reorgDocPageSetup: \'Page Setup\'', 'reorgDocSpecialParts: \'Special Parts\'', 'reorgPartsStructure: \'Structure\''].filter((s) => !canon.includes(s) && !mach.includes(s));
  ok('W1 [successor] every word the menu and the list draw is a lexicon key (terms.ts, the canonical table, used in the source); the headings read in Title Case', missing.length === 0 && title.length === 0, { missing, title });
  // the successor's mutant: the Doc menu stops drawing one of its words (its key taken out of the source it reads); the check must go red, and the cut must have LANDED
  const mutated = used.split("'reorgDocPresets'").join("'x'");
  ok('W1 (mutant) a word the menu stops drawing turns the check RED (the cut landed)', mutated !== used && gone(mutated).includes('reorgDocPresets'), { landed: mutated !== used, red: gone(mutated) });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 17;   // 13 + R4 (Nov 20); - T1 (parked, Nov 21) + T1-B + MUT-T1-B; + MUT-R2 (R2 parked, colour B's brass bar, Nov 21); + T1 (the stricter successor, INK's, Nov 22: SPRINT draws no Front menu at all); both successors pass and both stay (T1-B is the weaker reading)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-B-PARTS VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-B-PARTS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
