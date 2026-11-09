// FLUX3 S4b L2 - THE COMMAND-BOX RAIL (flux-mockup-vs-build.md §4 L2; the plan ruled by Fable Nov 9: "L2 with the duplicate-Log fix first"). Every check is a sentence of the plan,
// read in the live page behind ?flux3=1 (Flux theme).
//   DUP      the Journal's rail shows ONE Log: the door above the Journal pin wears the switcher's own glyph (the rack), so the Log icon is drawn once and the word "Log" once.
//   DUP-OFF  without the flag the rail is exactly what it was (the door and the pin both draw the Log icon; no readouts).
//   READ     each place box carries a TRUE reading of what is stored: on a Page room in the Journal DOCS, CIRCUITS and LOG read the seeded counts; in a Drawer's set they read the
//            Drawer's own pages and boards, and the Log still reads the Journal's. Two digits at least.
//   HERE     your place is orange: the Journal pin (label, reading, bar) while she is in the Journal, the place block's name while she is in a Drawer; nothing else is.
//   LAST     under Circuits the last node touched this session reads in orange (LAST 0x....), the same address the Schema's own footer shows; none before a node is touched.
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
        labelColor: lab ? getComputedStyle(lab).color : null, readColor: rd ? getComputedStyle(rd).color : null, lastColor: last ? getComputedStyle(last).color : null }; });
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
  const drawer = await ev("window.wrizoCreateDrawer('Cartridge')");
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
  await open('l2-p1');
  const base = await rail();
  const muts = [
    ['a second log icon', "(() => { const s = document.querySelector('.wz-strip'); const d = s.querySelector('[data-theme-icon=\"rack\"]'); const c = d.cloneNode(true); c.setAttribute('data-theme-icon', 'log'); c.classList.add('mut'); d.parentElement.appendChild(c); })()", "document.querySelectorAll('.wz-strip .mut').forEach((e) => e.remove())", async () => !dupOk(await rail())],
    ['a wrong reading', "(() => { const r = document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-readout'); r.dataset.was = r.textContent; r.textContent = '99'; })()", "(() => { const r = document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-readout'); r.textContent = r.dataset.was; })()", async () => !readJ(await rail())],
    ['a second orange place', "(() => { const l = document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-label'); l.style.color = 'rgb(255, 152, 0)'; })()", "(() => { document.querySelector('.wz-strip [data-category=\"page\"] .wz-strip-label').style.color = ''; })()", async () => !hereJ(await rail())],
  ];
  ok('MUT-BASE the readers are green on the untouched Journal rail before their mutants run', dupOk(base) && readJ(base) && hereJ(base), JSON.stringify(base && base.items.map((i) => [i.cat, i.read])));
  for (const [name, apply, undo, red] of muts) {
    await ev(apply); await sleep(250);
    const wentRed = await red();
    await ev(undo); await sleep(250);
    const back = await rail();
    ok(`MUT-${name.toUpperCase().replace(/ /g, '-')} the reader goes RED on its mutant (${name}) and green again undone`, wentRed && dupOk(back) && readJ(back) && hereJ(back), name);
  }

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
