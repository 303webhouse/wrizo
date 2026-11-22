// THE TEAM B RESTYLE, slice 1: WORDS AND COLOUR NAMES (Fable's 12:15 pm cut, Nov 20: "Title Case"; Nick's Machina rule, Nov 20: "every button
// and heading in Machina is written in Title Case"; Decisions 3 and 1D: "Split" (not "Split here"), "Merge" (not "Join"), "Nest / Unnest";
// 1B: "Parts (n)", "New Part"; Fable's slot ruling, Nov 20, 1:27 pm, with POLISH's hand-over of the clay..plum rename). Machina, ?reorg=1.
// The words are Machina's own (store/lexicon/overrides/machina.ts): the rule is Machina's, so another theme's reorg keeps its casing. The stage
// strip, the tab names and the rail keep their capitals (Decision 4); sentences stay sentences.
//
// The fixture (seams only; WS_PLACE=1): a set "Novel" in a Drawer, four Parts "Chapter one".."Chapter four" (wb-1..wb-4); wb-2 coloured slot e;
// wb-1's plan board wb-own (card a1) and links to a card of board wb-x (x1) and the doc wb-q.
//
// PARTS  B1  BUILD, the Parts tab: the head reads "Parts (4)"; the tools read "New Part" and "Split"
//        B2  a row's menu reads Move Up, Move Down, Nest, Unnest, Merge; its colours are No Colour then the slots a-f, named Outline, Pale, Blue,
//            Yellow, Mid, Solid
//        B3  each swatch draws its slot as Machina's tag (the fill the --reorg-tag-<slot>-fill token gives; A an outline, no fill)
//        B4  wb-2's tag reads "E" (its slot's letter) on slot e's fill, the letter 4.5:1 or better on it
// ASSETS B5  the Assets tab: "Open Beside" on a row, the own board's head starts "This Doc's Board · ", the doc group reads "Docs Linked
//            Directly", and the Colour menu ends "No Colour"
// GONE   B6  (source) no clay..plum anywhere: no reorgPartColourClay..Plum key (terms, canonical table, c13-10c-new), no [data-colour='clay'..]
//            rule, and PartsList names its colours by the slots' lexicon words (reorgTagA..F)
//        B2 [picker successor] (colour B, Nov 21) the same, Merge followed by "Colour…" (the picker's opener); MUT-B2  the menu without it fails
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-b-words.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const ROOT = path.join(SRC, '..', '..', '..');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const hex = (c) => {
  const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (p.length > 3 && p[3] === 0) return 'transparent';
  return '#' + p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase();
};
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

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
    const P = W.wrizoParts; const coloured = !!P && P.setPartColor('wb-2', 'e');
    W.wrizoFlushNow();
    return { links: !!(l1 && l2), coloured };
  })()`);
}

async function openBuild(app, id) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip') && !!document.querySelector('.wz-sliver-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.waitFor("document.querySelector('.reorg-top [data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'BUILD' }).catch(() => {});
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-tutor-tab-links')?.click(); null"); await sleep(350);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(400);
}
const txt = (el) => `((${el})?.textContent || '').replace(/\\s+/g, ' ').trim()`;

await withHarness(async (app) => {
  const ids = await seed(app);
  await openBuild(app, 'wb-1');

  // ---- PARTS -----------------------------------------------------------------------------------------------------------------------------
  const b1 = await app.evalJs(`(() => { const l = document.querySelector('.wz-sliver [data-reorg-parts]'); if (!l) return null;
    return { head: ${txt("l.querySelector('.reorg-parts-head')")}, neu: ${txt("l.querySelector('[data-parts-new]')")}, split: ${txt("l.querySelector('[data-parts-split]')")}, rows: l.querySelectorAll('[data-part-row]').length }; })()`);
  ok('B1 BUILD, the Parts tab: the head reads "Parts (4)"; the tools read "New Part" and "Split"',
    ids.links && !!b1 && b1.rows === 4 && b1.head === 'Parts (4)' && /(^|\s)New Part$/.test(b1.neu) && b1.split === 'Split', { ids, b1 });

  await app.evalJs("document.querySelector('[data-part-more=\"wb-3\"]')?.click(); null"); await sleep(350);
  const b2 = await app.evalJs(`(() => { const m = document.querySelector('[data-part-menu="wb-3"]'); if (!m) return null;
    return { acts: [...m.querySelectorAll('[data-part-act]')].map((b) => [b.getAttribute('data-part-act'), (b.textContent || '').trim()]),
      colours: [...m.querySelectorAll('[data-part-colour]')].map((b) => [b.getAttribute('data-part-colour'), b.getAttribute('title')]) }; })()`);
  const wantActs = [['up', 'Move Up'], ['down', 'Move Down'], ['in', 'Nest'], ['out', 'Unnest'], ['join', 'Merge']];
  const wantCols = [['none', 'No Colour'], ['a', 'Outline'], ['b', 'Pale'], ['c', 'Blue'], ['d', 'Yellow'], ['e', 'Mid'], ['f', 'Solid']];
  // SUPERSEDED (colour B (arbor/colour-b 44cbb0ef, train H; Nick, Nov 21 3:30 pm via Fable 4:56 pm: the picker - SCHEME, six swatches, "+ Custom…") adds the
  // row menu's colour opener after the moves (data-part-act="colour", "Colour…"); the seven colour choices are unchanged (Chat 1's pair 44973956599 on train-h4 3ab78c73)). The original, verbatim:
  // ok('B2 a row\'s menu reads Move Up, Move Down, Nest, Unnest, Merge; its colours are No Colour then the slots a-f named Outline, Pale, Blue, Yellow, Mid, Solid',
  //   !!b2 && JSON.stringify(b2.acts) === JSON.stringify(wantActs) && JSON.stringify(b2.colours) === JSON.stringify(wantCols), b2);
  const wantActsB = [...wantActs, ['colour', 'Colour\u2026']];
  const b2p = (x) => !!x && JSON.stringify(x.acts) === JSON.stringify(wantActsB) && JSON.stringify(x.colours) === JSON.stringify(wantCols);
  ok('B2 [picker successor] a row\'s menu reads Move Up, Move Down, Nest, Unnest, Merge, Colour…; its colours are No Colour then the slots a-f named Outline, Pale, Blue, Yellow, Mid, Solid',
    b2p(b2), b2);
  const b2old = b2 ? { ...b2, acts: b2.acts.filter((a) => a[0] !== 'colour') } : null;
  ok('MUT-B2 the same menu without "Colour…" (the shape before colour B) fails B2\'s successor', !!b2old && b2p(b2) && !b2p(b2old), b2old);

  const b3 = await app.evalJs(`(() => { const m = document.querySelector('[data-part-menu="wb-3"]'); if (!m) return null; const root = getComputedStyle(document.documentElement);
    return [...'abcdef'].map((s) => { const b = m.querySelector('[data-part-colour="' + s + '"]'); if (!b) return [s, null]; const cs = getComputedStyle(b);
      return [s, cs.backgroundColor, root.getPropertyValue('--reorg-tag-' + s + '-fill').trim(), cs.borderTopColor, root.getPropertyValue('--reorg-tag-' + s + '-edge').trim()]; }); })()`);
  const b3ok = Array.isArray(b3) && b3.every(([s, bg, fill, edge, tokEdge]) => {
    if (!bg) return false;
    const want = (fill || '').toUpperCase();
    return want === 'TRANSPARENT' ? hex(bg) === 'transparent' && hex(edge) === (tokEdge || '').toUpperCase() : hex(bg) === want;
  });
  ok('B3 each swatch draws its slot as Machina\'s tag (the --reorg-tag-<slot>-fill token; A an outline in its edge colour, no fill)', b3ok, b3);
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(250);

  const b4 = await app.evalJs(`(() => { const t = document.querySelector('li[data-part-li="wb-2"] [data-part-tag]'); if (!t) return null; const cs = getComputedStyle(t);
    return { slot: t.getAttribute('data-colour'), letter: (t.textContent || '').trim(), fill: cs.backgroundColor, ink: cs.color }; })()`);
  const b4r = b4 && hex(b4.fill) && hex(b4.ink) ? ratio(hex(b4.fill), hex(b4.ink)) : 0;
  ok('B4 wb-2\'s tag reads "E" (its slot\'s letter) on slot e\'s fill, the letter 4.5:1 or better on it',
    ids.coloured && !!b4 && b4.slot === 'e' && b4.letter === 'E' && b4r >= 4.5, { b4, ratio: +b4r.toFixed(2) });

  // ---- ASSETS ----------------------------------------------------------------------------------------------------------------------------
  const b5a = await app.evalJs(`(() => ({
    beside: [...document.querySelectorAll('[data-back-assets] [data-back-beside]')].map((b) => ${txt('b')}),
    own: ${txt("document.querySelector('[data-back-assets] [data-back-own=\"true\"] [data-back-board-name]')")},
    pages: ${txt("document.querySelector('[data-back-assets] [data-back-group=\"pages\"] .wz-graft-gh')")},
  }))()`);
  await app.evalJs("document.querySelector('[data-back-assets] [data-back-asset][data-graft-box=\"x1\"] [data-asset-colour]')?.click(); null"); await sleep(300);
  const none = await app.evalJs(`${txt("document.querySelector('[data-asset-colour-menu] [data-colour-pick=\"\"]')")}`);
  await app.evalJs("document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); null"); await sleep(200);
  ok('B5 the Assets tab: "Open Beside" on its rows, the own board\'s head starts "This Doc\'s Board · ", the doc group reads "Docs Linked Directly", the Colour menu ends "No Colour"',
    b5a.beside.length > 0 && b5a.beside.every((w) => w === 'Open Beside') && b5a.own.startsWith("This Doc's Board · ") && b5a.pages === 'Docs Linked Directly' && none === 'No Colour', { b5a, none });
});

// ---- GONE (source) -----------------------------------------------------------------------------------------------------------------------
{
  const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');
  const OLD = ['Clay', 'Amber', 'Moss', 'Teal', 'Slate', 'Plum'].map((w) => `reorgPartColour${w}`);
  const texts = { terms: read('store/lexicon/terms.ts'), canon: read('store/lexicon/canonical/chrome.ts'), newTxt: fs.readFileSync(path.join(ROOT, 'docs', 'cleanup', 'c13-10c-new.txt'), 'utf8'), parts: read('reorg/PartsList.tsx'), css: read('styles/23-reorg-top.css') };
  const keysLeft = OLD.filter((k) => texts.terms.includes(k) || texts.canon.includes(k) || texts.newTxt.includes(k) || texts.parts.includes(k));
  const cssLeft = ['clay', 'amber', 'moss', 'teal', 'slate', 'plum'].filter((n) => texts.css.includes(`[data-colour='${n}']`));
  const slotsNamed = /SLOT_WORD/.test(texts.parts) && !/COLOUR_KEY/.test(texts.parts);
  ok('B6 (source) no clay..plum left: no reorgPartColourClay..Plum key, no [data-colour=\'clay\'..] rule; PartsList names its colours by the slots\' words (SLOT_WORD)',
    keysLeft.length === 0 && cssLeft.length === 0 && slotsNamed, { keysLeft, cssLeft, slotsNamed });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 7;   // 6 + MUT-B2 (B2 parked, the picker, Nov 21)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-B-WORDS VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-B-WORDS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
