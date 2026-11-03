// TOOLS #14 (Fable, Nov 2) - THE SIZE BOX IS WHEREVER - / + ARE, AND A NEW PAGE IS BORN AT 11. A committed CDP scenario; needs a box turn and a fresh `pnpm run build:web`.
//   B  FORM      the editable font-size box sits between - and + in EVERY form of the Type control and in every skin: Free Write's strip (form 'small', Arbor / Flux / Machina), a card's dock (form 'small',
//                scoped), and Draft's drawer (form 'full', unchanged)
//   T  TYPING    a whole or half number applies on Enter (the page re-renders at it); a bad entry reverts to the size shown; the existing half-point range 6-120 stands (the box is not narrowed)
//   N  NEW PAGE  a page BORN now (the unborn surface's first word, a Catch / journal page) carries pageSettings.size = 11; an OLD page (no stored size) still reads the default 12 - no rewrite
//   D  DEFAULT   PAGE_SIZE_DEFAULT stays 12 (existing pages unchanged) and a card keeps its 11
// Run (from apps/desktop, needs a box turn):  node scripts/harness/size-box.mjs      SB_FRAMES=<dir> saves a close-up of each strip per skin
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 260)}]` : ''}`); };
const FRAMES = process.env.SB_FRAMES || null;
const frame = async (app, sel, file) => {
  if (!FRAMES) return;
  const r = await app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; })()`);
  if (!r) return;
  const clip = { x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 12), width: r.width + 24, height: r.height + 24, scale: 2 };
  fs.writeFileSync(path.join(FRAMES, file), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png', clip })).data, 'base64'));
};
const SKINS = [['plateau', 'Arbor', null], ['flux', 'Flux', null], ['machina', 'Machina', 'cool']];
const PROSE = 'The garden had been quiet for a long time, and nobody who walked through it that autumn could have said exactly when the quiet began. '.repeat(3);

const row = async (app, id) => {
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()');
  const rows = (await app.localJSON('writer-studio-journal-entries')) || [];
  return rows.find((r) => r.id === id) || null;
};
const edPx = (app) => app.evalJs(`(() => { const e = document.querySelector('.forward-only-editor'); return e ? parseFloat(getComputedStyle(e).fontSize) : null; })()`);
const shape = (app, root) => app.evalJs(`(() => { const t = document.querySelector(${JSON.stringify(root)}); if (!t) return null; const s = t.querySelector('.wz-type-size'); if (!s) return null;
  return { order: [...s.children].map((c) => c.tagName === 'INPUT' ? 'num' : (c.getAttribute('aria-label') || c.textContent)), inputs: t.querySelectorAll('input.wz-type-num').length, val: (t.querySelector('input.wz-type-num') || {}).value }; })()`);
const typeInto = async (app, root, value) => {
  await app.evalJs(`(() => { const i = document.querySelector(${JSON.stringify(root + ' input.wz-type-num')}); if (i) { i.focus(); i.select(); } })()`);
  await app.keyCombo('a');
  await app.typeKeys(String(value));
  await app.key('Enter');
  await sleep(300);
};
const freshDesk = async (app, theme, cast) => {
  await app.emulateDpr(1, 1280, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-splash-hold', '50');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}')` : ''}`);
};
const openPage = async (app, id, mode) => {
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: ${JSON.stringify(PROSE)}, createdAt: new Date().toISOString(), origin: null, source: 'page' })`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)})`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `${mode} page` });
  await sleep(500);
};
const openDrawer = async (app) => {
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') await app.evalJs("document.querySelector('.wz-sliver-grip') && document.querySelector('.wz-sliver-grip').click()");
  await sleep(500);
};

await withHarness(async (app) => {
 try {
  let first = true;
  for (const [theme, name, cast] of SKINS) {
    // ==== B - FORM ====
    await freshDesk(app, theme, cast);
    await openPage(app, `sb-fw-${theme}`, 'journal');
    await openDrawer(app);
    const fw = await shape(app, '.wz-sliver .wz-type');
    ok(`B [${name}] FREE WRITE: the size box sits between - and + (smallest form)`, fw && fw.inputs === 1 && fw.order.length === 3 && fw.order[1] === 'num' && /maller/i.test(fw.order[0]) && /arger/i.test(fw.order[2]), JSON.stringify(fw));

    await frame(app, '.wz-sliver .wz-type', `size-freewrite-${name.toLowerCase()}.png`);
    // ==== T - TYPING (Free Write, whole page) ====
    if (fw && fw.inputs === 1) {
      const base = await edPx(app);
      await typeInto(app, '.wz-sliver .wz-type', '15');
      const at15 = await edPx(app);
      ok(`T [${name}]: typing 15 + Enter sizes the page (12 -> 15 pt: ${base} -> ${at15} px)`, base && at15 && Math.abs(at15 / base - 15 / 12) < 0.02, `${base} -> ${at15}`);
      const shown15 = (await shape(app, '.wz-sliver .wz-type')).val;
      await typeInto(app, '.wz-sliver .wz-type', 'abc');
      const afterBad = await edPx(app); const shownBad = (await shape(app, '.wz-sliver .wz-type')).val;
      ok(`T [${name}]: a bad entry ("abc") reverts - the size stays and the box shows it again`, Math.abs(afterBad - at15) < 0.02 && shownBad === shown15, `${afterBad} / "${shownBad}" vs "${shown15}"`);
      await typeInto(app, '.wz-sliver .wz-type', '10.5');
      const at105 = await edPx(app);
      ok(`T [${name}]: the half-point range stands (10.5 applies: ${at105} px)`, base && Math.abs(at105 / base - 10.5 / 12) < 0.02, String(at105));
      if (first) {
        await typeInto(app, '.wz-sliver .wz-type', '200');
        const hi = (await shape(app, '.wz-sliver .wz-type')).val;
        await typeInto(app, '.wz-sliver .wz-type', '2');
        const lo = (await shape(app, '.wz-sliver .wz-type')).val;
        ok('T: the existing range 6-120 stands (200 -> 120, 2 -> 6; not narrowed to 72)', hi === '120' && lo === '6', `${hi} / ${lo}`);
        first = false;
      }
    }

    // ==== B - FORM : Draft (full form, unchanged) ====
    await openPage(app, `sb-dr-${theme}`, 'drafting');
    await openDrawer(app);
    const dr = await shape(app, '.wz-sliver .wz-type');
    ok(`B [${name}] DRAFT: still the full form - one size box between - and +`, dr && dr.inputs === 1 && dr.order[1] === 'num', JSON.stringify(dr));

    // ==== B - FORM : a card's dock (small, scoped) ====
    await app.evalJs(`window.wrizoCreateJournalPage({ id: 'sb-board-${theme}', text: 'Board', pageType: 'board', createdAt: new Date().toISOString(), origin: null,
      boxes: [ { id: 'c1', kind: 'text', x: 0.05, y: 0.06, w: 0.26, h: 0.14, z: 1, text: 'First card' } ] })`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/sb-board-${theme}'`);
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board' });
    await sleep(500);
    const r = await app.evalJs(`(() => { const e = document.querySelector('.board-box .board-text'); const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
    await app.doubleClick(r.x, r.y);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'card popup' }).catch(() => ok(`B [${name}] CARD: popup opened`, false, 'timed out'));
    if (!(await app.evalJs("!!document.querySelector('.board-popup-dock .wz-type')"))) await app.evalJs("document.querySelector('.board-popup-dock-grip') && document.querySelector('.board-popup-dock-grip').click()");
    await sleep(300);
    const cd = await shape(app, '.board-popup-dock .wz-type');
    ok(`B [${name}] CARD: the size box sits between - and + in the card's dock (small, scoped form)`, cd && cd.inputs === 1 && cd.order[1] === 'num', JSON.stringify(cd));
    const cardPx = await app.evalJs("parseFloat(getComputedStyle(document.querySelector('.board-popup-editor')).fontSize)");
    await frame(app, '.board-popup-dock', `size-card-${name.toLowerCase()}.png`);
    ok(`D [${name}] CARD: a card keeps its own 11 (the box shows 11)`, cd && cd.val === '11', `${cd && cd.val} / ${cardPx}px`);
  }

  // ==== N - NEW PAGE = 11, OLD PAGE = 12 ====
  await freshDesk(app, 'plateau', null);
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'sb-old', text: 'An old page, never sized.', createdAt: new Date().toISOString(), origin: null, source: 'page' })");
  const old = await row(app, 'sb-old');
  ok('N: an OLD page (seeded, no stored size) carries no size - it reads the default 12', old && !(old.pageSettings && old.pageSettings.size), JSON.stringify(old && old.pageSettings));
  await app.goto('/page/new?origin=loose');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn surface' });
  await sleep(300);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('A first word on a new page');
  await sleep(1200);
  const rows = ((await app.localJSON('writer-studio-journal-entries')) || []).filter((r) => r.id !== 'sb-old');
  ok('N: a page BORN by its first word carries pageSettings.size = 11', rows.length === 1 && rows[0].pageSettings && rows[0].pageSettings.size === 11, JSON.stringify(rows.map((r) => r.pageSettings && r.pageSettings.size)));
  const newPx = await edPx(app);
  await app.evalJs("location.hash = '#/page/sb-old'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'old page' });
  await sleep(500);
  const oldPx = await edPx(app);
  ok(`N: the new page renders at 11 and the old at 12 (${newPx}px vs ${oldPx}px)`, newPx && oldPx && Math.abs(oldPx / newPx - 12 / 11) < 0.02, `${newPx} / ${oldPx}`);
  const caught = await app.evalJs("(() => { const f = window.wrizoCreateJournalPage; return f ? true : false; })()");
  void caught;
  await app.evalJs("window.wrizoCreateJournalPage()");
  const all = (await row(app, 'sb-old')) && ((await app.localJSON('writer-studio-journal-entries')) || []);
  const bare = all.filter((r) => r.id !== 'sb-old' && r.text === '');
  ok('N: a journal / Catch page (createJournalPage with no seed) carries pageSettings.size = 11', bare.length === 1 && bare[0].pageSettings && bare[0].pageSettings.size === 11, JSON.stringify(bare.map((r) => r.pageSettings)));
 } catch (e) { ok('driver ran to a verdict', false, String((e && e.stack) || e)); }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `SIZE-BOX VERIFY: FAIL (${failed.length} of ${checks.length})` : `SIZE-BOX VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
