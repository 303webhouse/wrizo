// ARBOR v2 MOCKUP - §14 items 2-3, BROWSER half (the pure regrouping is arbor2-23-unit.mjs). Behind ?arbor2=1, Arbor only.
// Fable's ruling 3: the drawers' internal cloth tabs + the Board tab are allowed behind the flag; the Board tab reuses the Graft picker (no new
// behaviour); drawers stay flush; THE PAGE NEVER MOVES. FIX reviews before anything leaves the flag.
//
//   D1  Free Write: the Tools tab row is FONT | INK (the theme's words); picking INK puts the page in ink (the grip's pen mark shows), picking
//       FONT returns it to text - the tab IS the instrument switch
//   D2  Draft: the row is FONT | FORMAT | PRESETS; each tab shows only its sections (Font: the typeface; Format: the format section;
//       Presets: the templates), and switching tabs never moves the page or the left edge tab
//   B1  Tutor drawer: three tabs TUTOR | GRAFTS | BOARD; BOARD shows "+ Graft..." and no Cards/Sources/Pages group; GRAFTS shows no Boards group
//   B2  the BOARD tab's "+ Graft..." opens the same picker (GraftPicker), and choosing nothing changes nothing (localStorage byte-equal)
//   F0  flag OFF: Free Write's row is still TEXT | INK (today's), Tutor still TUTOR | GRAFTS
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.ARBOR_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sameRect = (a, b) => !!a && !!b && ['x', 'y', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
const snap = async (app, name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const setFlag = async (app, on) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?arbor2=1' : '/')} + location.hash)`);
  await app.reload(); await splashGone(app); await sleep(400);
};
const pickBar = (app, label) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.arbor2-bar-opt')].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); if (b) b.click(); return !!b; })()`);
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);

const READ = `(() => {
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const shown = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const tabsOf = (prefix) => [...document.querySelectorAll('.wz-drawer-tab')].filter((b) => b.id.startsWith(prefix)).map((b) => ({ id: b.id.slice(prefix.length), word: b.textContent.trim(), on: b.getAttribute('data-on') }));
  const heads = [...document.querySelectorAll('.wz-sliver-body .wz-sliver-h')].filter(shown).map((h) => h.textContent.trim());
  const pane = document.querySelector('[data-links-pane]');
  return {
    page: rect(document.querySelector('.mode-page')), gripL: rect(document.querySelector('.wz-sliver-grip')),
    left: tabsOf('wz-sliver-tab-'), right: tabsOf('wz-tutor-tab-'), heads,
    inkMark: !!document.querySelector('.wz-sliver-grip-mark[data-instrument="ink"]'),
    pane: pane ? { add: !!pane.querySelector('[data-graft-add]'), groups: [...pane.querySelectorAll('[data-graft-group]')].map((g) => g.getAttribute('data-graft-group')) } : null,
    picker: !!document.querySelector('.wz-graft-picker, [data-graft-picker]'),
    ls: JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])),
  };
})()`;
const read = (app) => app.evalJs(READ);

await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await splashGone(app); await sleep(600);

  // F0: flag off, today's rows
  const off = await read(app);
  ok('F0 flag OFF: Free Write\'s Tools row is TEXT | INK and the Tutor row TUTOR | GRAFTS (today\'s)', off.left.map((x) => x.id).join() === 'text,ink' && off.right.map((x) => x.id).join() === 'tutor,links', JSON.stringify({ l: off.left, r: off.right }));

  await setFlag(app, true);
  await pickBar(app, 'Night'); await sleep(250);

  // D1: Free Write - FONT | INK, the ink tab is the instrument
  await clickSel(app, '.wz-sliver-grip'); await sleep(500);
  const fw = await read(app);
  ok('D1 Free Write: the Tools row is FONT | INK in the theme\'s words', fw.left.map((x) => x.id).join() === 'type,ink' && fw.left[0]?.word.toLowerCase() === 'font', JSON.stringify(fw.left));
  await clickSel(app, '#wz-sliver-tab-ink'); await sleep(400);
  const fwInk = await read(app);
  await snap(app, 'item2-night-freewrite-ink-tab');
  await clickSel(app, '#wz-sliver-tab-type'); await sleep(400);
  const fwText = await read(app);
  ok('D1 the INK tab IS the instrument: picking it puts the page in ink (pen mark), FONT returns it to text', fwInk.inkMark && !fwText.inkMark && fwInk.left.find((x) => x.id === 'ink')?.on === 'true', JSON.stringify({ ink: fwInk.inkMark, text: fwText.inkMark }));
  ok('D1 the page never moves while the tabs change', sameRect(fwInk.page, off.page) && sameRect(fwText.page, off.page), JSON.stringify({ ink: fwInk.page, text: fwText.page, off: off.page }));
  await clickSel(app, '.wz-sliver-grip'); await sleep(400);

  // D2: Draft - FONT | FORMAT | PRESETS
  const toDraft = await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(900);
  await clickSel(app, '.wz-sliver-grip'); await sleep(500);
  const dr = await read(app);
  ok('D2 Draft: the Tools row is FONT | FORMAT | PRESETS', toDraft && dr.left.map((x) => x.id).join() === 'type,format,presets', JSON.stringify({ toDraft, tabs: dr.left }));
  const seen = {};
  for (const tab of ['type', 'format', 'presets']) {
    await clickSel(app, `#wz-sliver-tab-${tab}`); await sleep(350);
    const s = await read(app);
    seen[tab] = s.heads;
    ok(`D2 Draft ${tab}: the page and the left edge tab never move`, sameRect(s.page, dr.page) && sameRect(s.gripL, dr.gripL), JSON.stringify({ page: s.page, grip: s.gripL }));
    for (const room of ['night', 'day']) { await pickBar(app, room === 'night' ? 'Night' : 'Day'); await sleep(200); await snap(app, `item2-${room}-draft-${tab}-tab`); }
  }
  const has = (tab, word) => seen[tab].some((h) => h.toLowerCase().startsWith(word));
  ok('D2 each tab shows its own sections: Font has the font only; Format has Format, not Presets; Presets has Presets, not Format',
    has('type', 'font') && !has('type', 'format') && has('format', 'format') && !has('format', 'templates') && !has('format', 'presets') && (has('presets', 'templates') || has('presets', 'presets')) && !has('presets', 'format'),
    JSON.stringify(seen));
  await clickSel(app, '.wz-sliver-grip'); await sleep(400);

  // B1 / B2: the Tutor drawer's Board tab
  await pickBar(app, 'Night'); await sleep(200);
  await clickSel(app, '.wz-tutor-grip'); await sleep(500);
  const tu = await read(app);
  ok('B1 the Tutor row is TUTOR | GRAFTS | BOARD', tu.right.map((x) => x.id).join() === 'tutor,links,board', JSON.stringify(tu.right));
  await clickSel(app, '#wz-tutor-tab-board'); await sleep(400);
  const bd = await read(app);
  await snap(app, 'item3-night-board-tab');
  ok('B1 BOARD: "+ Graft..." is there and no Cards / Sources / Pages group is drawn', !!bd.pane && bd.pane.add && !bd.pane.groups.some((g) => ['Cards', 'Sources', 'Pages', 'SharedTags'].includes(g)), JSON.stringify(bd.pane));
  await clickSel(app, '#wz-tutor-tab-links'); await sleep(400);
  const gr = await read(app);
  ok('B1 GRAFTS: no Boards group is drawn there', !!gr.pane && gr.pane.add && !gr.pane.groups.includes('Boards'), JSON.stringify(gr.pane));
  await clickSel(app, '#wz-tutor-tab-board'); await sleep(300);
  const lsBefore = (await read(app)).ls;
  await clickSel(app, '[data-graft-add]'); await sleep(500);
  const pk = await app.evalJs("(() => { const a = document.querySelector('[data-graft-add]'); return a ? a.getAttribute('aria-expanded') : null; })()");
  await snap(app, 'item3-night-board-picker');
  await app.key('Escape'); await sleep(300);
  const lsAfter = (await read(app)).ls;
  ok('B2 BOARD\'s "+ Graft..." opens the same picker, and choosing nothing changes nothing', pk === 'true' && lsAfter === lsBefore, JSON.stringify({ expanded: pk }));
  ok('B1 the page never moved through the Tutor tabs', sameRect(bd.page, off.page) && sameRect(gr.page, off.page), JSON.stringify(bd.page));
  await setFlag(app, false);
  return checks;
}, { label: 'arbor2-23' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-23 VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-23 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
