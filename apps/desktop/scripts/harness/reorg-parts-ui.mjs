// THE PARTS UI (POLISH; Fable, Nov 19 9:20 pm: "the Parts UI on INK's layer (split, join, new, move, levels, colours)"; rides train D with INK's
// reorg/parts.ts). Machina only, behind ?reorg=1. The Front menu's PARTS tab gains the tools the stage table (accepted as drawn, Nick's walk Nov 20)
// offers in each stage: SPRINT "New part" only; BUILD new, split, join, move, level, colour; EDIT split, join, move, colour. The top rail's Parts
// drop stays a plain list. Every write is INK's (reorg/parts.ts); nothing here writes a word itself except the page a first word births (PB1).
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and its app-made set):
//   Grants       a set she made, "Ledger": four Parts - "Ledger one opens here. The tail goes below." / "Ledger two" (one level in, moss) /
//                "Ledger three" / "Ledger four holds a link" (it owns a PageLink, so a join must refuse it)
//   Top Drawer   its app-made set: "A lone page" (a one-Part Doc)
//
// OFF    P0  switch off in Machina, and on in Arbor and Flux: no Parts tools anywhere
// STAGES G1  BUILD: "New part" and "Split here" over the list; a row's menu offers up, down, in, out, join and the seven colour choices
//            (SUCCESSOR, Nov 20: the seven are 'none' and the slots a-f; the words "New Part" and "Split")
//        G2  EDIT: "Split here" and no "New part"; a row's menu offers up, down, join and the colours (no level)
//        G3  SPRINT: "New part" only: no "Split here", no row menus
//        G4  the top rail's Parts drop is a plain list: no tools in it
// LIST   L1  (SUCCESSOR, Nov 20: the tag is its SLOT's letter) a Part one level in is drawn further in than the Part above it; a coloured Part's tag is its first letter on its colour; a Part with no
//            colour has an empty place of the same size
// COLOUR C1  (SUCCESSOR, Nov 20: stored as its SLOT, a-f) a colour from a row's menu is stored as the token name (pageSettings.color) and drawn, its letter readable on it (contrast >= 4.5);
//            "None" removes the key; no text changes
// LEVEL  V1  "In" puts a Part one level under the one above (drawn and stored); "Out" brings it back; the first Part cannot go in
// MOVE   M1  "Down" moves a Part below the next one, "Up" brings it back: only the order changes, every text is identical, and she stays on her page
// JOIN   J3  a Part that holds a link is not joined: the list says why, and nothing is written
// SPLIT  S1  on Part 1, the caret after "here. ", "Split here": Part 1 keeps the head, a new Part directly below holds the tail, head + tail is the
//            original byte for byte; she stays on her page and the page shows the head
//        S2  "Undo" puts the split back: Part 1 is whole again and the new Part is gone
//        S3  with no caret in the page, "Split here" writes nothing and says to put the caret where the new Part starts
// JOIN   J1  "Join" on Part 3 (while she is on Part 1) puts its words onto the end of Part 2, exactly, and Part 3 is gone
//        J2  "Undo" brings Part 3 back and Part 2 is as it was
//        J4  "Join" on the Part she is on takes her to the Part above, which now ends with her words
// NEW    N1  BUILD on a Ledger Part: "New part" opens a fresh empty page (nothing stored at the press); her first word births it as Ledger's last Part
//        N2  on a lone page: "New part" makes that page its own Doc (one set, named after it, the page moved into it) and opens a fresh page there;
//            her first word makes it Part 2 of 2
// PAGE   R1  the page's rect is the same with the Parts tab open and a row's menu open (1366)
// WORDS  W1  every word the tools draw is a lexicon key, and none is written into the component
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-parts-ui.mjs
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

const T1 = 'Ledger one opens here. The tail goes below.';
const CUT = T1.indexOf('The tail');
const ALL = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'))";
const ENTRIES = `${ALL}.map((e) => [e.id, e.text ?? null, e.boxes ?? null, e.pageSettings ?? null, e.pageLinks ?? null, e.projectId ?? null, e.orderIndex ?? null, e.deletedAt ?? null])`;
const TEXTS = `Object.fromEntries(${ALL}.map((e) => [e.id, [e.text ?? null, e.deletedAt ?? null]]))`;
const PROJECTS = "(JSON.parse(localStorage.getItem('writer-studio-projects') || '[]')).map((p) => [p.id, p.title, p.drawerId ?? null])";
const ROWS = `(() => {
  const l = document.querySelector('.wz-sliver [data-reorg-parts]');
  if (!l) return null;
  return [...l.querySelectorAll('li[data-part-li]')].map((li) => {
    const b = li.querySelector('[data-part-row]'), tag = li.querySelector('[data-part-tag]'), nm = li.querySelector('.reorg-parts-name');
    const tr = tag ? tag.getBoundingClientRect() : null, nr = nm ? nm.getBoundingClientRect() : null;
    return { id: b && b.getAttribute('data-part-row'), level: li.getAttribute('data-part-level'), here: b && b.getAttribute('aria-current') === 'true',
      name: nm ? (nm.textContent || '').trim() : null, tag: tag ? { colour: tag.getAttribute('data-colour'), letter: (tag.textContent || '').trim(), w: tr && Math.round(tr.width), h: tr && Math.round(tr.height) } : null,
      nameLeft: nr ? Math.round(nr.left) : null, more: !!li.querySelector('[data-part-more]') };
  });
})()`;
const TOOLS = "(() => { const l = document.querySelector('.wz-sliver [data-reorg-parts]'); if (!l) return null; return { tools: !!l.querySelector('[data-parts-tools]'), neu: !!l.querySelector('[data-parts-new]'), split: !!l.querySelector('[data-parts-split]'), more: l.querySelectorAll('[data-part-more]').length }; })()";
const MENU = (id) => `(() => { const m = document.querySelector('[data-part-menu="${id}"]'); if (!m) return null; return { acts: [...m.querySelectorAll('[data-part-act]')].map((b) => [b.getAttribute('data-part-act'), b.disabled]), colours: [...m.querySelectorAll('[data-part-colour]')].map((b) => b.getAttribute('data-part-colour')) }; })()`;
const SAID = "(() => { const s = document.querySelector('[data-parts-said]'); return s ? (s.textContent || '').trim() : null; })()";
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const pick = (tab) => `document.querySelector('#wz-sliver-tab-${tab}')?.click(); null`;
const click = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const editorText = "(document.querySelector('.forward-only-editor')?.innerText || '').replace(/\\u200b/g, '').trim()";

let ids = {};
async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const topSet = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return p && p.id; })()");
  ids = await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const ledger = W.wrizoCreateProject('Ledger'); W.wrizoSetProjectDrawer(ledger.id, grants.id);
    page('pu-lone', 'A lone page', { origin: 'project', projectId: ${q(topSet)}, orderIndex: 0 });
    page('pu-1', ${q(T1)}, { origin: 'project', projectId: ledger.id, orderIndex: 0 });
    page('pu-2', 'Ledger two', { origin: 'project', projectId: ledger.id, orderIndex: 1 });
    page('pu-3', 'Ledger three', { origin: 'project', projectId: ledger.id, orderIndex: 2 });
    const now = '2026-04-01T00:00:09.000Z';
    page('pu-4', 'Ledger four holds a link', { origin: 'project', projectId: ledger.id, orderIndex: 3 });
    // the page seam carries no pageLinks: the link goes on through the entry seam
    W.wrizoPatchEntry('pu-4', { pageLinks: [{ id: 'pu-link', aEntryId: 'pu-4', bEntryId: 'pu-lone', createdAt: now, updatedAt: now }] });
    const P = W.wrizoParts;
    if (P) { P.setPartLevel(ledger.id, 'pu-2', 1); P.setPartColor('pu-2', 'c'); }   // a SLOT (Fable, Nov 20; INK 7720e1df refuses a name): was 'moss', which INK's old-name table makes c
    W.wrizoFlushNow();
    const linked = ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === 'pu-4') || {}).pageLinks || []).length === 1;
    return { ledger: ledger.id, topSet: ${q(topSet)}, door: !!P && linked };
  })()`);
}

async function open(app, theme, reorg, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-sliver-grip') && !!document.querySelector('.forward-only-editor')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function stage(app, key) {
  await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`);
  await app.waitFor(`document.querySelector('.reorg-top [data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
  await sleep(900);
}
async function partsTab(app) {
  const already = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!already) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
  await app.waitFor("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", { label: 'the Front menu open', timeout: 4000 }).catch(() => {});
  await sleep(500);
  await app.evalJs(pick('parts')); await sleep(400);
}
async function menu(app, id) {
  const isOpen = await app.evalJs(`document.querySelector('[data-part-more="${id}"]')?.getAttribute('aria-expanded') === 'true'`);
  if (!isOpen) { await app.evalJs(click(`[data-part-more="${id}"]`)); await sleep(300); }
  return app.evalJs(MENU(id));
}
async function act(app, id, a) { await menu(app, id); const r = await app.evalJs(click(`[data-part-menu="${id}"] [data-part-act="${a}"]`)); await sleep(500); return r; }
async function flushed(app) { await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400); }
// the caret at a plain-text offset in the page, the way a press would leave it (the editor's own text nodes, in reading order)
const caretAt = (n) => `(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); let left = ${n};
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) { const len = t.data.length; if (left <= len) { const r = document.createRange(); r.setStart(t, left); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); return true; } left -= len; }
  return false; })()`;

await withHarness(async (app) => {
  await seed(app);
  const L = ids.ledger;

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------
  const offs = {};
  for (const [theme, reorg] of [['machina', false], ['plateau', true], ['flux', true]]) {
    await open(app, theme, reorg, 'pu-1');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(500);
    offs[`${theme}.${reorg ? 'on' : 'off'}`] = await app.evalJs("(() => ({ tools: !!document.querySelector('[data-parts-tools]'), more: !!document.querySelector('[data-part-more]'), split: !!document.querySelector('[data-parts-split]') }))()");
  }
  ok('P0 switch off in Machina, and on in Arbor and Flux: no Parts tools anywhere', ids.door && Object.values(offs).every((o) => !o.tools && !o.more && !o.split), { door: ids.door, offs });

  // ---- STAGES ----------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pu-1'); await stage(app, 'draft'); await partsTab(app);
  const g1 = { tools: await app.evalJs(TOOLS), menu: await menu(app, 'pu-3') };
  // SUPERSEDED (Nov 20, ARBOR's restyle, on POLISH's hand-over): the seven colour choices are 'none' and the slots a-f (Fable's slot ruling; INK's PART_COLORS since 7720e1df), no longer clay..plum. The check as it stood, verbatim:
  //  ok('G1 BUILD: "New part" and "Split here" over the list; a row\'s menu offers up, down, in, out, join and seven colour choices',
  //    !!g1.tools && g1.tools.neu && g1.tools.split && g1.tools.more === 4 && !!g1.menu && g1.menu.acts.map((a) => a[0]).join(',') === 'up,down,in,out,join'
  //      && g1.menu.colours.join(',') === 'none,clay,amber,moss,teal,slate,plum', g1);
  ok('G1 BUILD: "New Part" and "Split" over the list; a row\'s menu offers up, down, in, out, join and seven colour choices: none and the slots a to f',
    !!g1.tools && g1.tools.neu && g1.tools.split && g1.tools.more === 4 && !!g1.menu && g1.menu.acts.map((a) => a[0]).join(',') === 'up,down,in,out,join'
      && g1.menu.colours.join(',') === 'none,a,b,c,d,e,f', g1);
  await stage(app, 'revise'); await partsTab(app);
  const g2 = { tools: await app.evalJs(TOOLS), menu: await menu(app, 'pu-3') };
  ok('G2 EDIT: "Split here" and no "New part"; a row\'s menu offers up, down, join and the colours (no level)',
    !!g2.tools && !g2.tools.neu && g2.tools.split && g2.tools.more === 4 && !!g2.menu && g2.menu.acts.map((a) => a[0]).join(',') === 'up,down,join' && g2.menu.colours.length === 7, g2);
  await stage(app, 'freewrite'); await partsTab(app);
  const g3 = await app.evalJs(TOOLS);
  ok('G3 SPRINT: "New part" only: no "Split here", no row menus', !!g3 && g3.neu && !g3.split && g3.more === 0, g3);
  await stage(app, 'draft');
  await app.evalJs(click('.reorg-top [data-top-part-count]')); await sleep(300);
  const g4 = await app.evalJs("(() => { const d = document.querySelector('[data-top-parts-drop]'); return d ? { rows: d.querySelectorAll('[data-part-row]').length, tools: !!d.querySelector('[data-parts-tools], [data-part-more], [data-parts-new], [data-parts-split]') } : null; })()");
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(250);
  ok('G4 the top rail\'s Parts drop is a plain list: four rows, no tools', !!g4 && g4.rows === 4 && !g4.tools, g4);

  // ---- LIST, COLOUR, LEVEL, MOVE ---------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pu-1'); await stage(app, 'draft'); await partsTab(app);
  const l1 = await app.evalJs(ROWS);
  const r1 = l1 && l1.find((r) => r.id === 'pu-1'), r2 = l1 && l1.find((r) => r.id === 'pu-2');
  // SUPERSEDED (Nov 20, ARBOR's restyle, on POLISH's hand-over): a coloured Part's tag is its SLOT's letter on the slot's colour (Nick's tags A-F, Nov 11: 'a label first, the colour second'; the Assets tab's tags read the same), and the fixture's colour is slot c. The check as it stood, verbatim:
  //  ok('L1 a Part one level in is drawn further in; a coloured Part\'s tag is its first letter on its colour; no colour is an empty place of the same size',
  //    !!r1 && !!r2 && r1.level === '0' && r2.level === '1' && r2.nameLeft > r1.nameLeft && r2.tag && r2.tag.colour === 'moss' && r2.tag.letter === 'L'
  //      && r1.tag && r1.tag.colour === null && r1.tag.letter === '' && r1.tag.w === r2.tag.w && r1.tag.w > 0, l1);
  ok('L1 a Part one level in is drawn further in; a coloured Part\'s tag is its slot\'s letter on its colour (slot c: "C"); no colour is an empty place of the same size',
    !!r1 && !!r2 && r1.level === '0' && r2.level === '1' && r2.nameLeft > r1.nameLeft && r2.tag && r2.tag.colour === 'c' && r2.tag.letter === 'C'
      && r1.tag && r1.tag.colour === null && r1.tag.letter === '' && r1.tag.w === r2.tag.w && r1.tag.w > 0, l1);

  await flushed(app);
  const c0 = await app.evalJs(TEXTS);
  await menu(app, 'pu-1');
  // SUPERSEDED (Nov 20, ARBOR's restyle): the press read [data-part-colour="teal"], a name; the successor presses slot d. Verbatim:
  //   await app.evalJs(click('[data-part-menu="pu-1"] [data-part-colour="teal"]')); await sleep(500); await flushed(app);
  await app.evalJs(click('[data-part-menu="pu-1"] [data-part-colour="d"]')); await sleep(500); await flushed(app);
  const c1 = {
    stored: await app.evalJs(`(${ALL}.find((e) => e.id === 'pu-1') || {}).pageSettings?.color ?? null`),
    drawn: await app.evalJs(`(() => { const t = document.querySelector('li[data-part-li] [data-part-row="pu-1"]')?.closest('li')?.querySelector('[data-part-tag]'); if (!t) return null; const cs = getComputedStyle(t);
      const rgb = (s) => (s.match(/[\\d.]+/g) || []).slice(0, 3).map(Number); const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const a = lum(rgb(cs.backgroundColor)), b = lum(rgb(cs.color)); return { colour: t.getAttribute('data-colour'), letter: (t.textContent || '').trim(), contrast: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100 }; })()`),
  };
  await menu(app, 'pu-1');
  await app.evalJs(click('[data-part-menu="pu-1"] [data-part-colour="none"]')); await sleep(500); await flushed(app);
  c1.cleared = await app.evalJs(`(() => { const ps = (${ALL}.find((e) => e.id === 'pu-1') || {}).pageSettings || {}; return !('color' in ps); })()`);
  const c2 = await app.evalJs(TEXTS);
  // SUPERSEDED (Nov 20, ARBOR's restyle, on POLISH's hand-over): a colour is stored as its SLOT, never a name (Fable's ruling), and the tag reads the slot's letter. The check as it stood, verbatim:
  //  ok('C1 a colour is stored as its token name and drawn, its letter readable (contrast >= 4.5); "None" removes the key; no text changes',
  //    c1.stored === 'teal' && c1.drawn && c1.drawn.colour === 'teal' && c1.drawn.letter === 'L' && c1.drawn.contrast >= 4.5 && c1.cleared && JSON.stringify(c0) === JSON.stringify(c2), c1);
  ok('C1 a colour is stored as its slot (d) and drawn, its letter "D" readable (contrast >= 4.5); "None" removes the key; no text changes',
    c1.stored === 'd' && c1.drawn && c1.drawn.colour === 'd' && c1.drawn.letter === 'D' && c1.drawn.contrast >= 4.5 && c1.cleared && JSON.stringify(c0) === JSON.stringify(c2), c1);

  const v0 = await menu(app, 'pu-1');
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(200);
  await act(app, 'pu-3', 'in'); await flushed(app);
  const vIn = { rows: await app.evalJs(ROWS), stored: await app.evalJs(`(${ALL}.find((e) => e.id === 'pu-3') || {}).pageSettings?.level ?? null`) };
  await act(app, 'pu-3', 'out'); await flushed(app);
  const vOut = await app.evalJs(ROWS);
  ok('V1 "In" puts a Part one level under the one above (drawn and stored); "Out" brings it back; the first Part cannot go in',
    !!v0 && v0.acts.find((a) => a[0] === 'in')?.[1] === true && vIn.rows?.find((r) => r.id === 'pu-3')?.level === '1' && vIn.stored === 1 && vOut?.find((r) => r.id === 'pu-3')?.level === '0', { v0, vIn, vOut });

  const m0 = await app.evalJs(TEXTS), hash0 = await app.evalJs('location.hash');
  await act(app, 'pu-3', 'down'); await flushed(app);
  const mDown = (await app.evalJs(ROWS))?.map((r) => r.id).join(',');
  await act(app, 'pu-3', 'up'); await flushed(app);
  const mUp = (await app.evalJs(ROWS))?.map((r) => r.id).join(',');
  const m1 = await app.evalJs(TEXTS);
  ok('M1 "Down" moves a Part below the next one and "Up" brings it back: only the order changes, and she stays on her page',
    mDown === 'pu-1,pu-2,pu-4,pu-3' && mUp === 'pu-1,pu-2,pu-3,pu-4' && JSON.stringify(m0) === JSON.stringify(m1) && (await app.evalJs('location.hash')) === hash0, { mDown, mUp, hash0 });

  // ---- JOIN refused ----------------------------------------------------------------------------------------------------------------------
  const j30 = await app.evalJs(ENTRIES);
  await act(app, 'pu-4', 'join'); await flushed(app);
  const j3 = { said: await app.evalJs(SAID), same: JSON.stringify(j30) === JSON.stringify(await app.evalJs(ENTRIES)) };
  ok('J3 a Part that holds a link is not joined: the list says why, and nothing is written', !!j3.said && /link/i.test(j3.said) && j3.same, j3);

  // ---- SPLIT -----------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pu-1'); await stage(app, 'draft'); await partsTab(app);
  const placed = await app.evalJs(caretAt(CUT));
  const hashS = await app.evalJs('location.hash');
  const pressed = await app.evalJs(click('[data-parts-split]'));
  await sleep(1500); await flushed(app);
  const s1 = { placed, pressed, rows: (await app.evalJs(ROWS))?.map((r) => r.id), texts: await app.evalJs(TEXTS), hash: await app.evalJs('location.hash'), shown: await app.evalJs(editorText) };
  const tailId = s1.rows && s1.rows[1];
  const head = s1.texts['pu-1']?.[0], tail = tailId ? s1.texts[tailId]?.[0] : null;
  ok('S1 "Split here" after "here. ": Part 1 keeps the head, a new Part directly below holds the tail (head + tail = the original); she stays, and the page shows the head',
    placed && pressed && s1.rows && s1.rows.length === 5 && tailId && !/^pu-/.test(tailId) && head === T1.slice(0, CUT) && tail === T1.slice(CUT) && head + tail === T1 && s1.hash === hashS && s1.shown === T1.slice(0, CUT).trim(), s1);
  const undid = await app.evalJs(click('[data-parts-undo]')); await sleep(1500); await flushed(app);
  const s2 = { undid, rows: (await app.evalJs(ROWS))?.map((r) => r.id), texts: await app.evalJs(TEXTS) };
  ok('S2 "Undo" puts the split back: Part 1 is whole again and the new Part is gone',
    undid && s2.rows && s2.rows.join(',') === 'pu-1,pu-2,pu-3,pu-4' && s2.texts['pu-1']?.[0] === T1 && tailId && !!s2.texts[tailId]?.[1], s2);
  await open(app, 'machina', true, 'pu-1'); await stage(app, 'draft'); await partsTab(app);
  await flushed(app);
  const s30 = await app.evalJs(ENTRIES);
  await app.evalJs('window.getSelection().removeAllRanges(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); null');
  await app.evalJs(click('[data-parts-split]')); await sleep(600); await flushed(app);
  const s3 = { said: await app.evalJs(SAID), same: JSON.stringify(s30) === JSON.stringify(await app.evalJs(ENTRIES)) };
  ok('S3 with no caret in the page, "Split here" writes nothing and says to put the caret where the new Part starts', !!s3.said && /caret/i.test(s3.said) && s3.same, s3);

  // ---- JOIN ------------------------------------------------------------------------------------------------------------------------------
  await act(app, 'pu-3', 'join'); await flushed(app);
  const j1 = { texts: await app.evalJs(TEXTS), rows: (await app.evalJs(ROWS))?.map((r) => r.id), hash: await app.evalJs('location.hash') };
  ok('J1 "Join" on Part 3 (she is on Part 1) puts its words onto the end of Part 2, exactly, and Part 3 is gone',
    j1.texts['pu-2']?.[0] === 'Ledger two' + 'Ledger three' && !!j1.texts['pu-3']?.[1] && j1.rows && j1.rows.join(',') === 'pu-1,pu-2,pu-4' && /pu-1/.test(j1.hash), j1);
  const undid2 = await app.evalJs(click('[data-parts-undo]')); await sleep(900); await flushed(app);
  const j2 = { undid2, texts: await app.evalJs(TEXTS), rows: (await app.evalJs(ROWS))?.map((r) => r.id) };
  ok('J2 "Undo" brings Part 3 back and Part 2 is as it was', undid2 && j2.texts['pu-2']?.[0] === 'Ledger two' && j2.texts['pu-3']?.[0] === 'Ledger three' && !j2.texts['pu-3']?.[1] && j2.rows && j2.rows.join(',') === 'pu-1,pu-2,pu-3,pu-4', j2);

  await open(app, 'machina', true, 'pu-3'); await stage(app, 'draft'); await partsTab(app);
  await act(app, 'pu-3', 'join');
  await app.waitFor("location.hash.indexOf('/page/pu-2') >= 0 && !!document.querySelector('.forward-only-editor')", { timeout: 8000, label: 'Part 2' }).catch(() => {});
  await sleep(900); await flushed(app);
  const j4 = { hash: await app.evalJs('location.hash'), texts: await app.evalJs(TEXTS), shown: await app.evalJs(editorText) };
  ok('J4 "Join" on the Part she is on takes her to the Part above, which now ends with her words',
    /pu-2/.test(j4.hash) && j4.texts['pu-2']?.[0] === 'Ledger twoLedger three' && !!j4.texts['pu-3']?.[1] && j4.shown === 'Ledger twoLedger three', j4);

  // ---- NEW -------------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pu-1'); await stage(app, 'draft'); await partsTab(app);
  await flushed(app);
  const n0 = { e: await app.evalJs(ENTRIES), p: await app.evalJs(PROJECTS) };
  await app.evalJs(click('[data-parts-new]'));
  await app.waitFor("location.hash.indexOf('/page/new') >= 0 && !!document.querySelector('.forward-only-editor')", { timeout: 8000, label: 'a fresh page' }).catch(() => {});
  await sleep(900); await flushed(app);
  const n1a = { hash: await app.evalJs('location.hash'), same: JSON.stringify(n0.e) === JSON.stringify(await app.evalJs(ENTRIES)) };
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(200);
  for (const ch of 'Fresh') { await app.typeKeys(ch); await sleep(40); }
  await app.waitFor(`window.wrizoParts && window.wrizoParts.partsOfDoc(${q(L)}).some((p) => p.name === 'Fresh')`, { timeout: 8000, label: 'Fresh stored' }).catch(() => {});
  await sleep(300);
  const n1 = { ...n1a, rows: await app.evalJs(`window.wrizoParts ? window.wrizoParts.partsOfDoc(${q(L)}).map((p) => [p.id, p.name]) : null`), line: await app.evalJs("(document.querySelector('.reorg-top [data-top-part-count]')?.textContent || '').trim()") };
  const last = n1.rows && n1.rows[n1.rows.length - 1];
  ok('N1 "New part" opens a fresh empty page (nothing stored at the press); her first word births it as Ledger\'s last Part',
    /\/page\/new/.test(n1.hash) && n1.same && !!last && last[1] === 'Fresh' && n1.rows.length === 4 && n1.line === 'Part 4 of 4', n1);

  await open(app, 'machina', true, 'pu-lone'); await stage(app, 'draft'); await partsTab(app);
  await flushed(app);
  const p0 = await app.evalJs(PROJECTS);
  await app.evalJs(click('[data-parts-new]'));
  await app.waitFor("location.hash.indexOf('/page/new') >= 0 && !!document.querySelector('.forward-only-editor')", { timeout: 8000, label: 'a fresh page' }).catch(() => {});
  await sleep(900); await flushed(app);
  const p1 = await app.evalJs(PROJECTS);
  const made = p1.filter((p) => !p0.some((o) => o[0] === p[0]));
  const lone = await app.evalJs(`(${ALL}.find((e) => e.id === 'pu-lone') || {}).projectId ?? null`);
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus(); null"); await sleep(200);
  for (const ch of 'Second') { await app.typeKeys(ch); await sleep(40); }
  await app.waitFor(`window.wrizoParts && ${q(made[0] ? made[0][0] : '')} && window.wrizoParts.partsOfDoc(${q(made[0] ? made[0][0] : '')}).some((p) => p.name === 'Second')`, { timeout: 8000, label: 'Second stored' }).catch(() => {});
  await sleep(300);
  const n2 = { made, lone, hash: await app.evalJs('location.hash'), rows: made[0] ? await app.evalJs(`window.wrizoParts.partsOfDoc(${q(made[0][0])}).map((p) => [p.id, p.name])`) : null, line: await app.evalJs("(document.querySelector('.reorg-top [data-top-part-count]')?.textContent || '').trim()") };
  ok('N2 on a lone page "New part" makes it its own Doc (one set, named after it, the page moved in) and opens a fresh page there; her first word makes it Part 2 of 2',
    made.length === 1 && made[0][1] === 'A lone page' && lone === made[0][0] && !!n2.rows && n2.rows.length === 2 && n2.rows[0][0] === 'pu-lone' && n2.rows[1][1] === 'Second' && n2.line === 'Part 2 of 2', n2);

  // ---- PAGE ------------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'pu-1'); await stage(app, 'draft');
  await app.evalJs("window.__puEditor = document.querySelector('.forward-only-editor'); null");
  const rA = await app.evalJs(PAGE);
  await partsTab(app);
  const rB = await app.evalJs(PAGE);
  await menu(app, 'pu-2');
  const rC = await app.evalJs(PAGE);
  const same = await app.evalJs("document.querySelector('.forward-only-editor') === window.__puEditor");
  ok('R1 the page\'s rect is the same with the Parts tab open and a row\'s menu open; the editor is the same node', !!rA && rA === rB && rB === rC && same, { rA, rB, rC, same });
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const file = path.join(SRC, 'reorg', 'PartsList.tsx');
  const src = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const used = [...new Set([...src.matchAll(/\bt\('([a-zA-Z0-9]+)'\)/g)].map((m) => m[1]))];
  const missing = used.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon));
  const quoted = [...src.matchAll(/>\s*([A-Z][a-z]+(?: [a-z]+)+)\s*</g)].map((m) => m[1]);
  ok('W1 every word the Parts tools draw is a lexicon key (terms.ts and the canonical table), and none is written into the component', used.length >= 14 && missing.length === 0 && quoted.length === 0, { used, missing, quoted });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 20;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-PARTS-UI VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-PARTS-UI VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
