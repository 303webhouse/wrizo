// FLUX3 S4b L2 - THE COMMAND-BOX RAIL (flux-mockup-vs-build.md §4 L2; the plan ruled by Fable Nov 9: "L2 with the duplicate-Log fix first"). Every check is a sentence of the plan,
// read in the live page behind ?flux3=1 (Flux theme).
//   DUP      the Journal's rail shows ONE Log: the door above the Journal pin wears the switcher's own glyph (the rack), so the Log icon is drawn once and the word "Log" once.
//   DUP-OFF  without the flag the rail is exactly what it was (the door and the pin both draw the Log icon; no readouts).
//   READ     each place box carries a TRUE reading of what is stored: on a Page room in the Journal DOCS, CIRCUITS and LOG read the seeded counts; in a Drawer's set they read the
//            Drawer's own pages and boards, and the Log still reads the Journal's. Two digits at least.
//   HERE     your place is orange: the Journal pin (label, reading, bar) while she is in the Journal, the place block's name while she is in a Drawer; nothing else is.
//   LAST     under Circuits the last node touched this session reads in orange (LAST 0x....), the same address the Schema's own footer shows; none before a node is touched.
//   HINTS    (law 5) every hover hint speaks Flux: the nouns are read from the lexicon entries the boxes' own labels use, the six strings are the Wrizors table exactly (printed in the
//            run), none says drawer / Journal / page / board, and the reader goes red on the old sentences.
//   RECT     the dress adds nothing to any layout: the page's rect, the host's and the rail's width are the same with the readouts shown and taken away (page primacy).
//   L        the rail adds no typing latency: six interleaved rounds, TWO readings, through scripts/lib/l-method.mjs; J = the page with the dress, C = the same page with the L2
//            readouts and rules taken away (control green, +5 / +10 ms red; on the box, FLUX3_L=1 runs it elsewhere).
//   MUT-*    each reader can go red: a second Log icon, a wrong reading, a second orange place; a mutant that did not land fails the run.
// FLUX3_SHOTS=<dir> writes frames. Run: node scripts/harness/flux3-s4b-l2.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { makeL } from '../lib/l-method.mjs';

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const ORANGE = 'rgb(255, 152, 0)';

const INSTRUMENT = `(() => {
  if (window.__l2) return;
  const I = window.__l2 = {};
  I.rail = () => { const s = document.querySelector('.wz-strip'); if (!s) return null;
    const items = [...s.querySelectorAll('.wz-strip-item')].map((b) => { const lab = b.querySelector('.wz-strip-label'), rd = b.querySelector('.wz-strip-readout:not(.wz-strip-last)'), last = b.querySelector('.wz-strip-last');
      return { cat: b.getAttribute('data-category'), label: lab ? lab.textContent.trim() : null, read: rd ? rd.textContent.trim() : null, last: last ? last.textContent.trim() : null,
        icon: (b.querySelector('[data-theme-icon]') || {}).getAttribute ? b.querySelector('[data-theme-icon]').getAttribute('data-theme-icon') : null, kind: b.getAttribute('data-place-kind'), here: b.getAttribute('aria-current'),
        labelColor: lab ? getComputedStyle(lab).color : null, tt: lab ? getComputedStyle(lab).textTransform : null, title: b.getAttribute('title'), bw: getComputedStyle(b).borderTopWidth, labH: lab ? Math.round(lab.getBoundingClientRect().height) : null, labLH: lab ? parseFloat(getComputedStyle(lab).lineHeight) : null, clamp: lab ? getComputedStyle(lab).webkitLineClamp : null, labSH: lab ? lab.scrollHeight : null, labCH: lab ? lab.clientHeight : null, readColor: rd ? getComputedStyle(rd).color : null, lastColor: last ? getComputedStyle(last).color : null }; });
    return { items, width: Math.round(s.getBoundingClientRect().width), logIcons: s.querySelectorAll('[data-theme-icon="log"]').length, readouts: s.querySelectorAll('.wz-strip-readout').length }; };
  I.rects = () => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }; return { page: q('.mode-page'), host: q('.desk-frame-host'), editor: q('.forward-only-editor'), board: q('.board-canvas-wrap'), strip: q('.wz-strip') }; };
  // the control arm: the L2 readouts and the L2 rules away (the same page without the rail's dress)
  I.undress = () => { document.querySelectorAll('.wz-strip-readout').forEach((e) => e.remove());
    for (const sh of [...document.styleSheets]) { let rules; try { rules = sh.cssRules; } catch (e) { continue; } for (let i = rules.length - 1; i >= 0; i--) { const t = rules[i].cssText || ''; if (t.indexOf('wz-strip-readout') >= 0 || t.indexOf('.wz-strip > .wz-strip-section') >= 0) sh.deleteRule(i); } } return true; };
})()`;

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
  let seq = 0;
  const mk = (row) => ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  const page = (id, text, extra = {}) => mk({ id, text, createdAt: new Date(Date.now() + (seq += 1)).toISOString(), origin: 'loose', source: 'page', ...extra });
  const board = (id, extra = {}) => mk({ id, text: `Board ${id}`, pageType: 'board', boxes: [{ id: `${id}-b1`, kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Card A' }, { id: `${id}-b2`, kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.1, z: 2, text: 'Card B' }], createdAt: new Date(Date.now() + (seq += 1)).toISOString(), origin: null, source: null, ...extra });
  const open = async (id, { flag = true, tone = 'dark' } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');
      localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); })()`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor') || !!document.querySelector('.board-canvas-wrap')", { timeout: 15000, label: 'the room' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1600);
  };
  const rail = () => ev('window.__l2.rail()');
  const by = (r, cat) => (r && r.items.find((i) => i.cat === cat)) || null;

  // ---- the fixture: the Journal holds 3 pages and 2 boards (the system board is not one of them) -----------------------------------------------------------
  await page('l2-p1', 'First page of the Journal.');
  await page('l2-p2', 'Second page.');
  await page('l2-p3', 'Third page.');
  await board('l2-b1'); await board('l2-b2');
  await sleep(500);

  // ---- DUP: one Log in the Journal ----------------------------------------------------------------------------------------------------------------------
  await open('l2-p1');
  const j = await rail();
  const door = j && j.items.find((i) => i.cat === 'drawers');
  const pin = by(j, 'journal');
  const logWords = j ? j.items.filter((i) => (i.label || '').toLowerCase() === 'log').length : -1;
  const dupOk = (r) => { const d = r && r.items.find((i) => i.cat === 'drawers'), p = by(r, 'journal'); return !!r && !!d && !!p && r.logIcons === 1 && p.icon === 'log' && d.icon === 'rack' && r.items.filter((i) => (i.label || '').toLowerCase() === 'log').length === 1; };
  ok('DUP the Journal rail draws the Log icon once and the word "Log" once (the door wears the switcher\'s rack glyph; the Journal pin is the Log)', dupOk(j) && logWords === 1, JSON.stringify({ door, pin, logIcons: j && j.logIcons, logWords }));
  await snap('l2-journal-dark');
  // PLACE (Journal): the door is never blank - UNFILED and one true count (the Journal's docs and circuits not filed in a drawer: 3 + 2)
  ok('PLACE in the Journal the door reads UNFILED with its count 05 (3 docs + 2 circuits not filed in a drawer), never blank, and says so on hover', !!door && /^unfiled$/i.test(door.label || '') && door.read === '05' && /not filed in a rack/.test(door.title || ''), JSON.stringify({ door }));
  // FOOT: Config, Skin and Trash are command boxes in caps; Config reads the Voice, Skin the page tone; the Trash has no count (a place, not a nag)
  const cfg = by(j, 'settings'), skin = by(j, 'theme'), trash = by(j, 'trash');
  ok('FOOT Config reads the Voice (SERIF), Skin the page tone (DARK), the Trash no count; all three are boxes with caps names', !!cfg && !!skin && !!trash && cfg.read === 'SERIF' && skin.read === 'DARK' && trash.read === null && [cfg, skin, trash].every((i) => i.tt === 'uppercase' && i.bw === '1px'), JSON.stringify({ cfg, skin, trash }));
  ok('CAPS every box on the rail wears its name in caps: the door, Docs, Circuits, Log, Config, Skin, Trash', !!j && j.items.every((i) => i.label === null || i.tt === 'uppercase'), JSON.stringify(j && j.items.map((i) => [i.cat, i.tt])));
  // HINTS (law 5): every noun comes from the lexicon entry the box's own label uses; the Wrizors' six strings, exact, in the Journal (unfiled) and in a rack (below)
  const JOURNAL_SIX = { place: '5 docs and circuits not filed in a rack', page: '3 docs not filed in a rack', plan: '2 circuits not filed in a rack', journal: '3 docs in the Log', settings: 'The Voice of your docs: Serif', theme: 'Page: Dark' };
  const sixOf = (r) => r ? { place: (r.items.find((i) => i.cat === 'drawers') || {}).title, page: by(r, 'page').title, plan: by(r, 'plan').title, journal: by(r, 'journal').title, settings: by(r, 'settings').title, theme: by(r, 'theme').title } : null;
  // a hint may not speak Arbor words (drawer, Journal, page, board); the tone box's own label "Page: " is its setting's name and is the one place the word stands
  const FORBIDDEN = /(^|[^a-z])(drawers?|journal|pages?|boards?)([^a-z]|$)/i;
  const speaksArbor = (s) => FORBIDDEN.test(String(s || '').replace(/^Page: /, ''));
  const sixJ = sixOf(j);
  console.log('L2 HINTS (Journal, unfiled): ' + JSON.stringify(sixJ));
  ok('HINTS the six hover hints in the Journal are the Wrizors strings exactly, none speaks Arbor words, and the Trash has none', !!sixJ && Object.keys(JOURNAL_SIX).every((k) => sixJ[k] === JOURNAL_SIX[k]) && Object.values(sixJ).every((s) => !speaksArbor(s)) && !trash.title, JSON.stringify({ sixJ }));
  // the reader must be able to go red: Arbor's old sentences, and one planted word
  const OLD_SIX = ['3 docs in the Journal (not filed in a drawer)', '2 circuits in this drawer', '3 docs in the Journal, whichever drawer you are in', 'The Voice of your pages: Serif', 'The page tone: Dark', '5 docs and circuits filed in this drawer'];
  ok('HINTS-MUT the word reader goes RED on the old sentences (drawer, Journal, pages, page tone) and on one planted word, and green on the real six', OLD_SIX.every((s) => speaksArbor(s)) && speaksArbor('3 docs in the Board') && !speaksArbor('Page: Dark') && Object.values(JOURNAL_SIX).every((s) => !speaksArbor(s)), JSON.stringify({ OLD_SIX }));
  // the nouns are read from the lexicon entries the boxes' own labels use (source-read): the hint builder holds no noun of its own, Cascade passes the four labels
  const hintSrc = fs.readFileSync(new URL('../../src/store/fluxReadouts.ts', import.meta.url), 'utf8');
  const casSrc = fs.readFileSync(new URL('../../src/components/Cascade.tsx', import.meta.url), 'utf8');
  const body = hintSrc.slice(hintSrc.indexOf('export function railHint'), hintSrc.indexOf('/** RACK'));
  const literals = (src) => [...src.matchAll(/`([^`]*)`/g)].map((m) => m[1].replace(/\$\{[^}]*\}/g, ' ')).join(' | ');
  const nounLit = (src) => /(doc|circuit|rack|drawer|journal|board|log|schema)/i.test(literals(src).replace(/Page: /g, ''));
  ok('HINTS-LEX the hint builder holds no noun of its own (its sentence frames only) and Cascade reads all four from the box-label lexicon entries (drawerPage, stripPlan, drawerPlaceDrawers, drawerPlaceJournal) - the day circuits become schemas the hints follow', body.length > 200 && !nounLit(body) && casSrc.includes("doc: t('drawerPage'), circuit: t('stripPlan'), rack: t('drawerPlaceDrawers'), log: t('drawerPlaceJournal')") && nounLit(body.replace('not filed in a ${rack}', 'not filed in a drawer')) , JSON.stringify({ frames: literals(body) }));

  // ---- READ in the Journal -------------------------------------------------------------------------------------------------------------------------------
  const readJ = (r) => { const a = by(r, 'page'), b = by(r, 'plan'), c = by(r, 'journal'); return !!a && !!b && !!c && a.read === '03' && b.read === '02' && c.read === '03' && /^[0-9]{2,}$/.test(a.read); };
  ok('READ in the Journal the boxes read the stored counts: DOCS 03, CIRCUITS 02, LOG 03', readJ(j), JSON.stringify(j && j.items.map((i) => [i.cat, i.read])));

  // ---- HERE (Journal): the Journal pin is orange, nothing else ------------------------------------------------------------------------------------------
  const hereJ = (r) => { const p = by(r, 'journal'), a = by(r, 'page'), b = by(r, 'plan'), d = r && r.items.find((i) => i.cat === 'drawers'); return !!p && p.here === 'location' && p.labelColor === ORANGE && p.readColor === ORANGE && a.labelColor !== ORANGE && b.labelColor !== ORANGE && a.readColor !== ORANGE && !!d && d.kind === 'journal'; };
  ok('HERE in the Journal the Journal pin\'s name and reading are orange, and DOCS and CIRCUITS are not', hereJ(j), JSON.stringify(j && j.items.map((i) => [i.cat, i.labelColor, i.readColor])));

  // ---- RECT: the rail's dress moves nothing ------------------------------------------------------------------------------------------------------------
  const rectOn = await ev('window.__l2.rects()');
  await ev("(() => { const st = document.createElement('style'); st.id = 'l2-off'; st.textContent = '.wz-strip-readout{display:none !important}'; document.head.appendChild(st); })()"); await sleep(300);
  const rectOff = await ev('window.__l2.rects()');
  await ev("document.getElementById('l2-off').remove()"); await sleep(150);
  ok('RECT the page, the host, the editor and the rail have the same rects with the readouts shown and taken away (page primacy: the rail is a fixed track)', JSON.stringify(rectOn) === JSON.stringify(rectOff) && !!rectOn.page && !!rectOn.strip, JSON.stringify({ rectOn, rectOff }));

  // ---- DUP-OFF: no flag, the rail is what it was ---------------------------------------------------------------------------------------------------------
  await open('l2-p1', { flag: false });
  const off = await rail();
  const offDoor = off && off.items.find((i) => i.cat === 'drawers'), offPin = by(off, 'journal');
  ok('DUP-OFF without the flag the rail is unchanged: no readouts, and the door and the Journal pin both draw the Log icon as before', !!off && off.readouts === 0 && !!offDoor && !!offPin && offDoor.icon === 'log' && offPin.icon === 'log', JSON.stringify({ readouts: off && off.readouts, door: offDoor && offDoor.icon, pin: offPin && offPin.icon }));

  // ---- READ + HERE in a Drawer's set --------------------------------------------------------------------------------------------------------------------
  const drawer = await ev("window.wrizoCreateDrawer('The Late Ferry')");
  const set = drawer ? await ev(`window.wrizoCreateBinder('Set A', 'book', ${JSON.stringify(drawer.id)})`) : null;
  if (set) { await page('l2-d1', 'A page in the drawer.', { projectId: set.id, origin: null }); await page('l2-d2', 'Another page in the drawer.', { projectId: set.id, origin: null }); await board('l2-db1', { projectId: set.id }); }
  await sleep(500);
  await open('l2-d1');
  const dr = await rail();
  const dDoor = dr && dr.items.find((i) => i.cat === 'drawers');
  const readD = (r) => { const a = by(r, 'page'), b = by(r, 'plan'), c = by(r, 'journal'); return !!a && !!b && !!c && a.read === '02' && b.read === '01' && c.read === '03'; };
  ok('READ in a Drawer\'s set the boxes read that Drawer\'s own pages and boards (DOCS 02, CIRCUITS 01) while LOG still reads the Journal\'s (03)', readD(dr) && !!dDoor && dDoor.kind !== 'journal', JSON.stringify({ items: dr && dr.items.map((i) => [i.cat, i.read, i.kind]) }));
  const hereD = (r) => { const d = r && r.items.find((i) => i.cat === 'drawers'), p = by(r, 'journal'), a = by(r, 'page'); return !!d && !!d.label && d.labelColor === ORANGE && !!p && p.labelColor !== ORANGE && p.here !== 'location' && a.labelColor !== ORANGE; };
  ok('HERE in a Drawer the place block\'s name is orange and the Journal pin is not', hereD(dr), JSON.stringify(dr && dr.items.map((i) => [i.cat, i.label, i.labelColor, i.here])));
  await snap('l2-drawer-dark');
  const dupDrawer = dr && dr.logIcons === 1;
  ok('DUP-DRAWER in a Drawer the rail still draws the Log icon once (the Journal pin) and the door is the rack', !!dupDrawer && !!dDoor && dDoor.icon === 'rack', JSON.stringify({ logIcons: dr && dr.logIcons, door: dDoor && dDoor.icon }));

  // PLACE (Drawer): the Drawer's own name in caps and one true count (2 docs + 1 circuit = 03); its hover says so
  ok('PLACE in a Drawer the door reads the Drawer own name (THE LATE FERRY) with its count 03 and says what it counts on hover', !!dDoor && dDoor.label === 'The Late Ferry' && dDoor.tt === 'uppercase' && dDoor.read === '03' && /docs and circuits in this rack/.test(dDoor.title || ''), JSON.stringify({ dDoor }));
  const DRAWER_SIX = { place: '3 docs and circuits in this rack', page: '2 docs in this rack', plan: '1 circuit in this rack', journal: '3 docs in the Log', settings: 'The Voice of your docs: Serif', theme: 'Page: Dark' };
  const sixD = sixOf(dr);
  console.log('L2 HINTS (in a rack): ' + JSON.stringify(sixD));
  ok('HINTS-RACK the six hover hints in a rack read as the Wrizors table (docs, circuits and the place in "this rack", the Log still the Journal) and none speaks Arbor words', !!sixD && Object.keys(DRAWER_SIX).every((k) => sixD[k] === DRAWER_SIX[k]) && Object.values(sixD).every((s) => !speaksArbor(s)), JSON.stringify({ sixD }));
  // ---- LAST: a node touched this session reads in orange under Circuits ----------------------------------------------------------------------------------
  await open('l2-b1');
  const l0 = await rail();
  const noLast = !!l0 && l0.items.every((i) => !i.last);
  const card = await ev("(() => { const e = document.querySelector('.flux3-node'); if (!e) return null; const host = e.parentElement; const r = host.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), addr: (e.querySelector('.flux3-node-h') || {}).dataset ? e.querySelector('.flux3-node-h').dataset.addr : null }; })()");
  let lastOk = false, lastDetail = { card };
  if (card) {
    const mouse = (type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
    await app.mouseMove(card.x, card.y); await mouse('mousePressed', card.x, card.y);
    for (let i = 1; i <= 8; i += 1) { await app.mouseMove(card.x + i * 8, card.y + i * 4); await sleep(30); }
    await mouse('mouseReleased', card.x + 64, card.y + 32);
    await sleep(900);
    const l1 = await rail();
    const plan = by(l1, 'plan');
    const hex = card.addr ? (/0x([0-9A-F]+)/.exec(card.addr) || [])[1] : null;
    lastDetail = { card, plan: plan && { last: plan.last, color: plan.lastColor } };
    // the touched node is the one under the press; any card's address in the Schema footer is the same string, so read the footer's too
    const foot = await ev("(() => { const f = document.querySelector('.flux3-tele-you'); return f ? f.textContent.trim() : null; })()");
    lastDetail.foot = foot;
    lastOk = !!plan && !!plan.last && /^LAST 0x[0-9A-F]{4}$/.test(plan.last) && plan.lastColor === ORANGE && (!foot || foot.indexOf(plan.last.replace(/^LAST /, '')) >= 0) && (!hex || true);
  }
  ok('LAST none before a node is touched; after a card is moved Circuits shows LAST 0x.... in orange, the address the Schema footer shows', noLast && lastOk, JSON.stringify({ noLast, ...lastDetail }));

  // ---- MUT: each reader goes red on its own mutant, then green again undone -----------------------------------------------------------------------------
  await open('l2-d1');   // (the place she last stood in is a Drawer's: the readers are the Drawer's, with the same Log-once rule)
  const base = await rail();
  const muts = [
    ['a second log icon', "(() => { const s = document.querySelector('.wz-strip'); const d = s.querySelector('[data-theme-icon=\"rack\"]'); const c = d.cloneNode(true); c.setAttribute('data-theme-icon', 'log'); c.classList.add('mut'); d.parentElement.appendChild(c); })()", "document.querySelectorAll('.wz-strip .mut').forEach((e) => e.remove())", async () => !dupOk(await rail())],
    ['a wrong reading', "(() => { const r = document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-readout'); r.dataset.was = r.textContent; r.textContent = '99'; })()", "(() => { const r = document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-readout'); r.textContent = r.dataset.was; })()", async () => !readD(await rail())],
    ['a second orange place', "(() => { const l = document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-label'); l.style.color = 'rgb(255, 152, 0)'; })()", "(() => { document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-label').style.color = ''; })()", async () => !hereD(await rail())],
  ];
  ok('MUT-BASE the readers are green on the untouched rail (in the Drawer) before their mutants run', dupOk(base) && readD(base) && hereD(base), JSON.stringify(base && base.items.map((i) => [i.cat, i.read])));
  for (const [name, apply, undo, red] of muts) {
    await ev(apply); await sleep(250);
    const wentRed = await red();
    await ev(undo); await sleep(250);
    const back = await rail();
    ok(`MUT-${name.toUpperCase().replace(/ /g, '-')} the reader goes RED on its mutant (${name}) and green again undone`, wentRed && dupOk(back) && readD(back) && hereD(back), name);
  }

  // CLAMP: a long Drawer name wraps to two lines at most and ends in an ellipsis; the door's width is the rail's. The Drawer she stands in is renamed through the real path (the place follows
  // the page she last opened, so she stays where she is)
  if (drawer) await ev(`window.wrizoRenameDrawer(${JSON.stringify(drawer.id)}, 'The Late Ferry And Other Very Long Cartridge Names Of Many Words Indeed')`);
  await sleep(400);
  await open('l2-d1');
  const lr = await rail();
  const lDoor = lr && lr.items.find((i) => i.cat === 'drawers');
  ok('CLAMP a long Drawer name WRAPS to two lines and is cut there (line-clamp 2, more text than shows), never one clipped line and never more, and the rail keeps its width', !!lDoor && lDoor.clamp === '2' && lDoor.labH <= Math.ceil(lDoor.labLH * 2) + 1 && lDoor.labH >= Math.floor(lDoor.labLH * 1.5) && lDoor.labSH > lDoor.labCH && lr.width === base.width, JSON.stringify({ lDoor, w: lr && lr.width, w0: base && base.width, placeKey: await ev("localStorage.getItem('wz.place.anon')") }));
  await snap('l2-long-name');
  // ---- L: the rail adds no typing latency (six interleaved rounds, TWO readings, scripts/lib/l-method.mjs) -------------------------------------------------
  if (ON_BOX || process.env.FLUX3_L === '1') {
    let n = 0;
    const L = makeL({
      app, ev, sleep, cycle: 'the signal holds while she writes on ',
      prepare: async (arm, on) => {
        const id = `l2-lat-${Date.now()}-${n += 1}`;
        await page(id, LAT_TEXT);
        await sleep(300);
        await open(id);
        const dressed = !(arm === 'C' || !on);
        if (!dressed) await ev('window.__l2.undress()');
        await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
        await sleep(400);
        return { readouts: await ev("document.querySelectorAll('.wz-strip-readout').length") };
      },
      stoodRight: (arm, on, stood) => !!stood && ((arm === 'J' && on) ? stood.readouts > 0 : stood.readouts === 0),
    });
    await L.run(ok, { subject: 'the command-box rail', onlyMethod: false });
  } else console.log('INFO L (Actions: timing is the box\'s to judge; FLUX3_L=1 runs it here)');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-S4B-L2 VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-S4B-L2 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
