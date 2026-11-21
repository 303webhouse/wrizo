// COLOURS ON ASSETS (reorg plan 5.1, D4; Nick's saved-data sheet #14 "A", Nov 19; Fable's ruling, Nov 20, 1:27 pm: "store slots a–f, never a
// colour name or a hex, for Parts AND assets. Each theme draws its own six (Machina tags A–F = Outline, Pale, Blue, Yellow, Mid, Solid; Flux
// 01–06). Box.color and pageSettings.color hold the slot."). Machina only, behind ?reorg=1.
//
// In the Back menu's Assets tab every asset row and board head has a "Colour" button; pressed, it lists the six tags by letter and name, and
// "No colour". The pick is STORED AS ITS SLOT: a card's Box.color (inside the board's boxes jsonb, stamped with the box's own updatedAt so a
// merge keeps the newer pick), a board's or a doc's pageSettings.color (the whole-blob page_settings jsonb). Schema change none. The row then
// draws its tag: the letter first (the signal), the colour second (Nick, Nov 11, 1:46 am: "a label first, the colour second").
//
// Machina's six, as measured on Nick's approved sheet (Downloads\reorg-colour-tags-v3.png; fill / letter / edge):
//   dark room (Machina's chrome today, and machina/look's dark room):  A transparent / #FFFFFF / #9AA1A8 · B #3A4047 / #FFFFFF / #9AA1A8
//     C #8FA9C4 / #151719 · D #CDB75A / #151719 · E #9AA1A8 / #151719 · F #F4F5F6 / #151719
//   light room (machina/look's data-machina2-room='light'):  A transparent / #151719 / #5E666E · B #D2D6DA / #151719 / #5E666E
//     C #41658A / #FFFFFF · D #B9A03A / #151719 · E #5E666E / #FFFFFF · F #23272B / #FFFFFF
//
// The fixture (seams only; WS_PLACE=1): the doc ac-1 links a card of board ac-x (x1 "Xcard one"), a second card of it stored with a NAME, not a
// slot (x2 color 'clay', the pre-ruling vocabulary), the whole board ac-y, and the doc ac-q.
//
// PREMISE C0  on ac-1 the Assets tab lists x1, x2, ac-y's head and ac-q; every row and head has "Colour"; no tag is drawn (x2's 'clay' is not a
//             slot, so it draws nothing)
// KEYS    C1  "Colour" on x1 lists seven picks in order: A Outline, B Pale, C Blue, D Yellow, E Mid, F Solid, No colour; expanded, focus inside;
//             Escape closes it and gives the focus back to the button
// STORE   C2  picking C on x1 stores color 'c' on ac-x's box x1 with a box updatedAt; nothing else changes (ac-x's boxes and stamp only; within
//             boxes only x1's color and updatedAt); every text identical; the row draws the tag "C" (data-colour-slot c); the page's rects and the
//             editor node are the same
//         C3  picking D on ac-y's head stores pageSettings.color 'd' on ac-y (its pageSettings and stamp only); the head draws "D"
//         C4  picking B on ac-q's row stores pageSettings.color 'b' on ac-q; the row draws "B"
//         C5  "No colour" on x1 REMOVES the key (no color on x1, nothing null); the tag is gone
// LOOK    C6  dark room: each slot's tag, drawn, reads the sheet's fill and letter (A: no fill, its edge); letter against fill (A: against the
//             panel) 4.5:1 or better, the tag against the panel (A and B: their edge) 3:1 or better
//         C7  (SUCCESSOR, Nov 20: Yellow's tag stands off the light panel by its 1 px G4 edge, as the sheet measures it)
//             light room (data-machina2-room='light', machina/look's switch): each slot's tokens read the sheet's light values, letter 4.5:1,
//             tag 3:1 against the sheet's light panel #F4F5F6
// KEPT    R1  coloured again and reloaded: x1 still holds 'c' and its row draws "C"
// OFF     O1  switch off, Machina, the same page: no "Colour" button and no tag, though x1 is coloured
// WORDS   W1  every new word is a lexicon key (terms.ts, the canonical table, used in the source); the six names are Nick's
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-asset-colours.mjs
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

const COLLECTIONS = "(() => { const out = {}; for (const k of ['writer-studio-projects', 'writer-studio-story-plans', 'writer-studio-sessions', 'writer-studio-drafts', 'writer-studio-journal-entries', 'writer-studio-drawers']) { if (localStorage.getItem(k) == null) continue; try { out[k] = JSON.parse(localStorage.getItem(k)); } catch { out[k] = localStorage.getItem(k); } } return out; })()";
function diffStores(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k], y = b[k];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (!Array.isArray(x) || !Array.isArray(y)) { out.push([k, '*', ['(whole value)']]); continue; }
    const byId = (arr) => new Map(arr.map((r) => [r && r.id, r]));
    const mx = byId(x), my = byId(y);
    for (const id of new Set([...mx.keys(), ...my.keys()])) {
      const r1 = mx.get(id), r2 = my.get(id);
      if (JSON.stringify(r1) === JSON.stringify(r2)) continue;
      if (!r1 || !r2) { out.push([k, id, [r1 ? '(removed)' : '(added)']]); continue; }
      out.push([k, id, [...new Set([...Object.keys(r1), ...Object.keys(r2)])].filter((kk) => JSON.stringify(r1[kk]) !== JSON.stringify(r2[kk]))]);
    }
  }
  return out;
}
const entry = (st, id) => (st['writer-studio-journal-entries'] || []).find((e) => e.id === id) || {};
const boxOf = (st, id, boxId) => (entry(st, id).boxes || []).find((b) => b.id === boxId) || null;
// ONLY the one entry changed, and only in the named fields (plus its own stamp)
const onlyEntry = (d, id, fields) => d.length === 1 && d[0][0] === 'writer-studio-journal-entries' && d[0][1] === id && d[0][2].every((k) => fields.includes(k) || k === 'updatedAt');
// within a board's boxes, only the one box changed, and only in the named fields
const onlyBox = (a, b, id, boxId, fields) => {
  const xa = entry(a, id).boxes || [], xb = entry(b, id).boxes || [];
  if (xa.length !== xb.length) return false;
  return xa.every((bx, i) => {
    const by = xb[i];
    if (bx.id !== by.id) return false;
    if (bx.id !== boxId) return JSON.stringify(bx) === JSON.stringify(by);
    return [...new Set([...Object.keys(bx), ...Object.keys(by)])].filter((k) => JSON.stringify(bx[k]) !== JSON.stringify(by[k])).every((k) => fields.includes(k));
  });
};
const words = (st) => Object.fromEntries((st['writer-studio-journal-entries'] || []).map((e) => [e.id, JSON.stringify([e.text ?? null, (e.boxes || []).map((b) => b.text ?? null), e.script ?? null])]));
const card = (id, text, seq, y, extra = {}) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq, ...extra });

// the sheet's six (Downloads\reorg-colour-tags-v3.png, measured on its own pixels): [fill or null, letter, edge or null]
const SHEET = {
  dark: { a: [null, '#FFFFFF', '#9AA1A8'], b: ['#3A4047', '#FFFFFF', '#9AA1A8'], c: ['#8FA9C4', '#151719', null], d: ['#CDB75A', '#151719', null], e: ['#9AA1A8', '#151719', null], f: ['#F4F5F6', '#151719', null] },
  light: { a: [null, '#151719', '#5E666E'], b: ['#D2D6DA', '#151719', '#5E666E'], c: ['#41658A', '#FFFFFF', null], d: ['#B9A03A', '#151719', null], e: ['#5E666E', '#FFFFFF', null], f: ['#23272B', '#FFFFFF', null] },
};
const NAMES = ['Outline', 'Pale', 'Blue', 'Yellow', 'Mid', 'Solid'];
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
    page('ac-x', 'X board', { origin: 'loose', pageType: 'board', boxes: ${q([card('x1', 'Xcard one', 0, 0.05), card('x2', 'Xcard two', 1, 0.2, { color: 'clay' })])} });
    page('ac-y', 'Y board', { origin: 'loose', pageType: 'board', boxes: [] });
    page('ac-q', 'A linked doc', { origin: 'loose' });
    page('ac-1', 'Chapter one', { origin: 'project', projectId: novel.id, orderIndex: 0 });
    const l1 = W.wrizoAddPageLink('ac-1', { bEntryId: 'ac-x', bBoxId: 'x1' });
    const l2 = W.wrizoAddPageLink('ac-1', { bEntryId: 'ac-x', bBoxId: 'x2' });
    const l3 = W.wrizoAddPageLink('ac-1', { bEntryId: 'ac-y' });
    const l4 = W.wrizoAddPageLink('ac-1', { bEntryId: 'ac-q' });
    W.wrizoFlushNow();
    return { novel: novel.id, links: !!(l1 && l2 && l3 && l4) };
  })()`);
}

async function openPage(app, id, { reorg = true } = {}) {
  await app.emulateDpr(1, 1920, 1080);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-tutor-tab-links')?.click(); null"); await sleep(400);
}

const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const tagOf = (el) => `(() => { const t = ${el}?.querySelector('[data-colour-slot]'); return t ? { slot: t.getAttribute('data-colour-slot'), letter: (t.textContent || '').trim() } : null; })()`;
const ROW = (box) => `document.querySelector('[data-back-assets] [data-back-asset][data-graft-box=${q(box)}]')`;
const ROWE = (entryId) => `[...document.querySelectorAll('[data-back-assets] [data-back-asset]')].find((li) => li.getAttribute('data-graft-entry') === ${q(entryId)} && !li.getAttribute('data-graft-box'))`;
const HEAD = (board) => `document.querySelector('[data-back-assets] [data-back-board=${q(board)}] .wz-back-boardhead')`;
const STATE = `(() => ({
  back: document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true',
  assets: [...document.querySelectorAll('[data-back-assets] [data-back-asset]')].map((li) => ({ entry: li.getAttribute('data-graft-entry'), box: li.getAttribute('data-graft-box'), colour: !!li.querySelector('[data-asset-colour]'), tag: !!li.querySelector('[data-colour-slot]') })),
  heads: [...document.querySelectorAll('[data-back-assets] [data-back-board]')].map((g) => { const h = g.querySelector('.wz-back-boardhead'); return { board: g.getAttribute('data-back-board'), colour: !!h?.querySelector('[data-asset-colour]'), tag: !!h?.querySelector('[data-colour-slot]') }; }),
}))()`;
// press the host's "Colour" button, then the pick (slot letter, or '' for No colour)
const pick = (host, slot) => `(async () => {
  const h = ${host}; const b = h?.querySelector('[data-asset-colour]'); if (!b) return false;
  b.click(); await new Promise((r) => setTimeout(r, 250));
  const p = document.querySelector('[data-asset-colour-menu] [data-colour-pick=' + ${q(q(slot))} + ']'); if (!p) return 'no pick';
  p.click(); return true;
})()`;
async function settle(app) { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400); }
// the drawn tag: fill, letter colour, edge colour, and the panel it sits on
const LOOK = `(() => {
  const t = ${ROW('x1')}?.querySelector('[data-colour-slot]'); if (!t) return null;
  const cs = getComputedStyle(t);
  let p = t.parentElement, bg = null; while (p) { const c = getComputedStyle(p).backgroundColor; if (c && !/rgba\\([^)]*,\\s*0\\)$/.test(c) && c !== 'transparent') { bg = c; break; } p = p.parentElement; }
  return { slot: t.getAttribute('data-colour-slot'), fill: cs.backgroundColor, letter: cs.color, edge: cs.borderTopWidth !== '0px' && cs.borderTopStyle !== 'none' ? cs.borderTopColor : null, panel: bg };
})()`;
// the tokens a slot reads (the light room has no light panel on main yet, so C7 reads the tokens the tag would draw)
const TOKENS = `(() => { const cs = getComputedStyle(document.querySelector('[data-back-assets]') || document.documentElement); const out = {}; for (const s of 'abcdef') out[s] = ['fill', 'ink', 'edge'].map((k) => cs.getPropertyValue('--reorg-tag-' + s + '-' + k).trim()); return out; })()`;

await withHarness(async (app) => {
  const ids = await seed(app);

  // ---- PREMISE ---------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'ac-1');
  const st0 = await app.evalJs(STATE);
  const has = (b) => st0.assets.some((a) => a.box === b);
  ok('C0 on ac-1 the Assets tab lists x1, x2, ac-y\'s head and ac-q; every row and head has "Colour"; no tag drawn (x2\'s \'clay\' is no slot)',
    ids.links && st0.back && has('x1') && has('x2') && st0.heads.some((h) => h.board === 'ac-y') && st0.assets.some((a) => a.entry === 'ac-q' && !a.box)
      && st0.assets.every((a) => a.colour && !a.tag) && st0.heads.every((h) => h.colour && !h.tag), { ids, st0 });

  // ---- KEYS ------------------------------------------------------------------------------------------------------------------------------
  const btn = `${ROW('x1')}?.querySelector('[data-asset-colour]')`;
  await app.evalJs(`(() => { const b = ${btn}; if (b) { b.focus(); b.click(); } return null; })()`);
  await sleep(300);
  const menu = await app.evalJs(`(() => { const b = ${btn}; const m = document.querySelector('[data-asset-colour-menu]'); return { expanded: b?.getAttribute('aria-expanded'), items: m ? [...m.querySelectorAll('[data-colour-pick]')].map((x) => ({ slot: x.getAttribute('data-colour-pick'), letter: (x.querySelector('[data-colour-slot]')?.textContent || '').trim(), word: (x.textContent || '').replace(/\\s+/g, ' ').trim() })) : null, focusIn: !!m && m.contains(document.activeElement) }; })()`);
  await app.evalJs("document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); null");
  await sleep(300);
  const esc = await app.evalJs(`(() => ({ menu: !!document.querySelector('[data-asset-colour-menu]'), focusBack: document.activeElement === ${btn} }))()`);
  const want = [...'abcdef'].map((s, i) => ({ slot: s, letter: s.toUpperCase(), name: NAMES[i] }));
  ok('C1 "Colour" on x1 lists A Outline, B Pale, C Blue, D Yellow, E Mid, F Solid, No colour, in order; expanded, focus inside; Escape closes and gives the focus back',
    menu.expanded === 'true' && !!menu.items && menu.items.length === 7 && want.every((w, i) => menu.items[i].slot === w.slot && menu.items[i].letter === w.letter && menu.items[i].word.includes(w.name))
      && menu.items[6].slot === '' && /no colou?r/i.test(menu.items[6].word) && menu.focusIn && !esc.menu && esc.focusBack, { menu, esc });

  // ---- STORE -----------------------------------------------------------------------------------------------------------------------------
  await app.evalJs("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__acMark = 1; return null; })()");
  const r0 = await app.evalJs(PAGE);
  const s1a = await app.evalJs(COLLECTIONS);
  const p2 = await app.evalJs(pick(ROW('x1'), 'c'));
  await settle(app);
  const s1b = await app.evalJs(COLLECTIONS);
  const b2 = boxOf(s1b, 'ac-x', 'x1') || {};
  const tag2 = await app.evalJs(tagOf(ROW('x1')));
  const r1 = await app.evalJs(PAGE);
  const same = await app.evalJs("!!(document.querySelector('.forward-only-editor') || {}).__acMark");
  ok('C2 picking C on x1 stores color \'c\' on ac-x\'s box x1 with its own updatedAt; only that box\'s color and stamp; texts identical; the row draws "C"; the page holds still',
    p2 === true && b2.color === 'c' && !!b2.updatedAt && onlyEntry(diffStores(s1a, s1b), 'ac-x', ['boxes']) && onlyBox(s1a, s1b, 'ac-x', 'x1', ['color', 'updatedAt'])
      && JSON.stringify(words(s1a)) === JSON.stringify(words(s1b)) && !!tag2 && tag2.slot === 'c' && tag2.letter === 'C' && r0 === r1 && same, { p2, b2, d: diffStores(s1a, s1b), tag2, r0, r1, same });

  const s3a = await app.evalJs(COLLECTIONS);
  const p3 = await app.evalJs(pick(HEAD('ac-y'), 'd'));
  await settle(app);
  const s3b = await app.evalJs(COLLECTIONS);
  const tag3 = await app.evalJs(tagOf(HEAD('ac-y')));
  ok('C3 picking D on ac-y\'s head stores pageSettings.color \'d\' on ac-y (its pageSettings and stamp only); the head draws "D"',
    p3 === true && (entry(s3b, 'ac-y').pageSettings || {}).color === 'd' && onlyEntry(diffStores(s3a, s3b), 'ac-y', ['pageSettings']) && !!tag3 && tag3.slot === 'd' && tag3.letter === 'D',
    { p3, ps: entry(s3b, 'ac-y').pageSettings, d: diffStores(s3a, s3b), tag3 });

  const s4a = await app.evalJs(COLLECTIONS);
  const p4 = await app.evalJs(pick(ROWE('ac-q'), 'b'));
  await settle(app);
  const s4b = await app.evalJs(COLLECTIONS);
  const tag4 = await app.evalJs(tagOf(ROWE('ac-q')));
  ok('C4 picking B on ac-q\'s row stores pageSettings.color \'b\' on ac-q; the row draws "B"',
    p4 === true && (entry(s4b, 'ac-q').pageSettings || {}).color === 'b' && onlyEntry(diffStores(s4a, s4b), 'ac-q', ['pageSettings']) && !!tag4 && tag4.slot === 'b' && tag4.letter === 'B',
    { p4, ps: entry(s4b, 'ac-q').pageSettings, d: diffStores(s4a, s4b), tag4 });

  const s5a = await app.evalJs(COLLECTIONS);
  const p5 = await app.evalJs(pick(ROW('x1'), ''));
  await settle(app);
  const s5b = await app.evalJs(COLLECTIONS);
  const b5 = boxOf(s5b, 'ac-x', 'x1') || {};
  const tag5 = await app.evalJs(tagOf(ROW('x1')));
  ok('C5 "No colour" on x1 removes the key (no color, nothing null); the tag is gone',
    p5 === true && !('color' in b5) && onlyBox(s5a, s5b, 'ac-x', 'x1', ['color', 'updatedAt']) && !tag5, { p5, b5, tag5 });

  // ---- LOOK ------------------------------------------------------------------------------------------------------------------------------
  // FIXTURE (Nov 21, train F pair 44944613263: C6 read the LIGHT room's panel #F4F5F6 by day): Machina's look is on by default since train E, and its room
  // follows the clock (Nick, Nov 1: day 07:00-19:00), so by day C6's "dark room" was the light room. The dark room is pinned with the look's own harness
  // clock (window.machina2Clock, in memory; absent where the look is off, and the dark room is then Machina's chrome as before). No assertion changes.
  await app.evalJs("window.machina2Clock ? window.machina2Clock('23:00') : null"); await sleep(400);
  // (Nov 21, fcf79914 run 44950077230: slot A was read while the room's colours were still easing from light to dark - B..F read dark. The fixture waits
  // for the dark room and lets the colours settle before the first pick. No assertion changes.)
  await app.waitFor("document.documentElement.getAttribute('data-machina2-room') !== 'light'", { label: 'the dark room', timeout: 6000 }).catch(() => {}); await sleep(1600);
  const dark = [];
  for (const s of 'abcdef') {
    await app.evalJs(pick(ROW('x1'), s)); await sleep(250);
    const L = await app.evalJs(LOOK);
    const [fill, ink, edge] = SHEET.dark[s];
    const got = L ? { fill: hex(L.fill), letter: hex(L.letter), edge: L.edge ? hex(L.edge) : null, panel: hex(L.panel) } : null;
    const ground = got && (fill ? fill : got.panel);
    const letterOk = !!got && !!ground && got.letter === ink && ratio(ink, ground) >= 4.5;
    const tagOk = !!got && !!got.panel && (edge ? got.edge === edge && ratio(edge, got.panel) >= 3 : ratio(fill, got.panel) >= 3);
    const fillOk = !!got && (fill ? got.fill === fill : got.fill === 'transparent');
    dark.push({ s, got, letterOk, tagOk, fillOk, letterRatio: got && ground ? +ratio(ink, ground).toFixed(2) : null });
  }
  ok('C6 dark room: each slot\'s tag, drawn, reads the sheet\'s fill and letter (A: no fill, its edge); letter 4.5:1 or better, the tag 3:1 or better against the panel',
    dark.every((d) => d.letterOk && d.tagOk && d.fillOk), dark);

  const hadRoom = await app.evalJs("document.documentElement.getAttribute('data-machina2-room')");
  await app.evalJs("document.documentElement.setAttribute('data-machina2-room', 'light'); null"); await sleep(200);
  const tk = await app.evalJs(TOKENS);
  if (hadRoom == null) await app.evalJs("document.documentElement.removeAttribute('data-machina2-room'); null"); else await app.evalJs(`document.documentElement.setAttribute('data-machina2-room', ${q(hadRoom)}); null`);
  const light = [...'abcdef'].map((s) => {
    const [fill, ink, edge] = SHEET.light[s];
    const [tf, ti, te] = (tk[s] || []).map((v) => (v || '').toUpperCase());
    const ground = fill || '#F4F5F6';
    return { s, tokens: tk[s], match: (fill ? tf === fill : tf === 'TRANSPARENT') && ti === ink && (edge ? te === edge : true), letter: +ratio(ink, ground).toFixed(2), tag: +ratio(edge || fill, '#F4F5F6').toFixed(2) };
  });
  // SUPERSEDED (Nov 20, ARBOR; Actions 44820660173, tree 57f69680): this C7 read the sheet with NO edge on the light room's Yellow (D) tag, so it
  // asked a #B9A03A fill to stand 3:1 off #F4F5F6 (it is 2.36:1). The sheet's own "tag 5.3" for Yellow is measured on its G4 edge, and the brief
  // says it ("A yellow tag bar on a card gets a 1 px edge"): the light Yellow tag stands off its panel by that edge. Verbatim:
  //   ok('C7 light room (data-machina2-room=light): each slot\'s tokens read the sheet\'s light values; letter 4.5:1, tag 3:1 against the sheet\'s panel #F4F5F6',
  //     light.every((l) => l.match && l.letter >= 4.5 && l.tag >= 3), light);
  const SHEET_LIGHT_V2 = { ...SHEET.light, d: ['#B9A03A', '#151719', '#5E666E'] };   // Yellow's 1 px G4 edge
  const light2 = [...'abcdef'].map((s) => {
    const [fill, ink, edge] = SHEET_LIGHT_V2[s];
    const [tf, ti, te] = (tk[s] || []).map((v) => (v || '').toUpperCase());
    const ground = fill || '#F4F5F6';
    return { s, tokens: tk[s], match: (fill ? tf === fill : tf === 'TRANSPARENT') && ti === ink && (edge ? te === edge : true), letter: +ratio(ink, ground).toFixed(2), tag: +ratio(edge || fill, '#F4F5F6').toFixed(2) };
  });
  ok('C7 light room (data-machina2-room=light): each slot\'s tokens read the sheet\'s light values (Yellow with its G4 edge); letter 4.5:1, the tag (or its edge) 3:1 against the sheet\'s panel #F4F5F6',
    light2.every((l) => l.match && l.letter >= 4.5 && l.tag >= 3), light2);

  // ---- KEPT ------------------------------------------------------------------------------------------------------------------------------
  await app.evalJs(pick(ROW('x1'), 'c'));
  await settle(app);
  await openPage(app, 'ac-1');
  const sR = await app.evalJs(COLLECTIONS);
  const tagR = await app.evalJs(tagOf(ROW('x1')));
  ok('R1 coloured again and reloaded: x1 still holds \'c\' and its row draws "C"', (boxOf(sR, 'ac-x', 'x1') || {}).color === 'c' && !!tagR && tagR.letter === 'C', { box: boxOf(sR, 'ac-x', 'x1'), tagR });

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'ac-1', { reorg: false });
  const off = await app.evalJs("(() => ({ colour: !!document.querySelector('[data-asset-colour]'), tags: document.querySelectorAll('[data-colour-slot]').length, rows: document.querySelectorAll('.wz-links-pane .wz-graft-row').length }))()");
  ok('O1 switch off, Machina, the same page: no "Colour" button and no tag, though x1 is coloured (the rows are drawn)', !off.colour && off.tags === 0 && off.rows > 0, off);
});

// ---- WORDS (source) --------------------------------------------------------------------------------------------------------------------
{
  const terms = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'terms.ts'), 'utf8');
  const canon = fs.readFileSync(path.join(SRC, 'store', 'lexicon', 'canonical', 'chrome.ts'), 'utf8');
  const used = ['reorg/backMenu/AssetGroupsList.tsx', 'reorg/colourSlots.ts', 'components/ConnectionsDrawerPanel.tsx'].map((f) => fs.existsSync(path.join(SRC, f)) ? fs.readFileSync(path.join(SRC, f), 'utf8') : '').join('\n');
  const need = ['reorgColour', 'reorgColourAria', 'reorgColourMenu', 'reorgColourNone', 'reorgTagA', 'reorgTagB', 'reorgTagC', 'reorgTagD', 'reorgTagE', 'reorgTagF'];
  const missing = need.filter((k) => !terms.includes(`'${k}'`) || !new RegExp(`\\b${k}:`).test(canon) || !used.includes(`'${k}'`));
  const names = ['reorgTagA', 'reorgTagB', 'reorgTagC', 'reorgTagD', 'reorgTagE', 'reorgTagF'].map((k, i) => new RegExp(`\\b${k}: '${NAMES[i]}'`).test(canon));
  ok('W1 every new word is a lexicon key (terms.ts, the canonical table, used in the source); the six names are Nick\'s', missing.length === 0 && names.every(Boolean), { missing, names });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 11;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ASSET-COLOURS VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ASSET-COLOURS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
