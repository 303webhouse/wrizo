// TOOLS #14-r2 (Fable, Nov 3) - THE SIZE BOX SIZES THE HIGHLIGHTED WORDS, AND ONLY THEM (ARBOR's live bug: with some words highlighted, main's Draft box resized the wrong words).
// A committed CDP scenario; needs a box turn and a fresh `pnpm run build:web`. It does what a writer does with the real pointer: double-click a word (the highlight), click INTO the size box, type a number, Enter - then reads the
// computed font size of EVERY word from the DOM, so what is asserted is what is seen, not what is stored.
//   W  WORDS   Draft's drawer (scoped, full form): highlight one word -> type a size -> only that word takes it, every other word keeps the page's size; again on a second word (the first keeps its size)
//   S  STEPS   the - / + buttons on a highlight size the same words (they never lost the selection) - so a number and a button agree
//   C  CARD    a card's dock (scoped, small form): the same, inside the card's popup editor
//   F  FREE    Free Write / Revise have no Selection scope: the box sizes the whole page (unchanged)
// Run (from apps/desktop, needs a box turn):  node scripts/harness/size-words.mjs
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 300)}]` : ''}`); };
const SKINS = [['plateau', 'Arbor', null], ['flux', 'Flux', null], ['machina', 'Machina', 'cool']];
const WORDS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'];
const TEXT = WORDS.join(' ') + '.';

// the computed font size (px) of each word, read where the word is drawn; and a word's centre for a real pointer
const SIZES = (root) => `(() => { const root = document.querySelector(${JSON.stringify(root)}); if (!root) return null; const out = {};
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) for (const word of ${JSON.stringify(WORDS)}) { const i = n.data.indexOf(word); if (i >= 0 && !(word in out)) out[word] = parseFloat(getComputedStyle(n.parentElement).fontSize); }
  return out; })()`;
const CENTRE = (root, word) => `(() => { const root = document.querySelector(${JSON.stringify(root)}); const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const i = n.data.indexOf(${JSON.stringify(word)}); if (i < 0) continue; const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${JSON.stringify(word)}.length);
    const b = r.getBoundingClientRect(); if (b.width > 0) return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; }
  return null; })()`;
const SEL = "(() => { const s = window.getSelection(); return s ? s.toString() : ''; })()";

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
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: ${JSON.stringify(TEXT)}, createdAt: new Date().toISOString(), origin: null, source: 'page' })`);
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
// a real double-click on a word, then check the highlight really is that word
const highlight = async (app, root, word) => {
  const p = await app.evalJs(CENTRE(root, word));
  if (!p) return false;
  await app.doubleClick(p.x, p.y);
  await sleep(300);
  return String(await app.evalJs(SEL)).trim() === word;
};
// a real click into the size box, select its text, type, Enter
const typeSize = async (app, boxSel, value) => {
  const p = await app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(boxSel)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
  if (!p) return false;
  await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y);
  await sleep(150);
  await app.keyCombo('a');
  await app.typeKeys(String(value));
  await app.key('Enter');
  await sleep(400);
  return true;
};
const only = (sizes, word, base, ratio) => WORDS.every((w) => sizes && (w === word ? Math.abs(sizes[w] / base - ratio) < 0.03 : Math.abs(sizes[w] - base) < 0.5));

await withHarness(async (app) => {
 try {
  for (const [theme, name, cast] of SKINS) {
    // ==== W - Draft's drawer ====
    await freshDesk(app, theme, cast);
    await openPage(app, `sw-dr-${theme}`, 'drafting');
    await openDrawer(app);
    const E = '.forward-only-editor';
    const base = (await app.evalJs(SIZES(E)))?.alpha;
    const h1 = await highlight(app, E, 'charlie');
    ok(`W [${name}] DRIVER: a real double-click highlights "charlie"`, h1, String(await app.evalJs(SEL)));
    await typeSize(app, '.wz-sliver .wz-type input.wz-type-num', 24);
    const s1 = await app.evalJs(SIZES(E));
    ok(`W [${name}] DRAFT: with "charlie" highlighted, typing 24 + Enter sizes ONLY "charlie" (24/${Math.round(base * 0.75 * 10) / 10 || '?'} of the page's size) - every other word keeps its size`, only(s1, 'charlie', base, 24 / (base * 0.75)), JSON.stringify(s1));
    const h2 = await highlight(app, E, 'echo');
    await typeSize(app, '.wz-sliver .wz-type input.wz-type-num', 18);
    const s2 = await app.evalJs(SIZES(E));
    ok(`W [${name}] DRAFT: then "echo" highlighted and 18 typed: "echo" takes 18, "charlie" keeps its 24, the rest stay`, h2 && s2 && Math.abs(s2.echo / base - 18 / (base * 0.75)) < 0.03 && Math.abs(s2.charlie / base - 24 / (base * 0.75)) < 0.03 && ['alpha', 'bravo', 'delta', 'foxtrot'].every((w) => Math.abs(s2[w] - base) < 0.5), JSON.stringify(s2));

    // ==== S - the buttons on a highlight ====
    const h3 = await highlight(app, E, 'bravo');
    const p = await app.evalJs("(() => { const b = document.querySelectorAll('.wz-sliver .wz-type .wz-type-step')[1]; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); await sleep(400);
    const s3 = await app.evalJs(SIZES(E));
    ok(`S [${name}] DRAFT: "+" on a highlighted "bravo" sizes only "bravo" (bigger), the others as they were`, h3 && s3 && s3.bravo > base + 0.5 && Math.abs(s3.alpha - base) < 0.5 && Math.abs(s3.delta - base) < 0.5 && Math.abs(s3.foxtrot - base) < 0.5 && Math.abs(s3.charlie - s2.charlie) < 0.5, JSON.stringify(s3));

    // ==== F - Free Write: the whole page ====
    await freshDesk(app, theme, cast);
    await openPage(app, `sw-fw-${theme}`, 'journal');
    await openDrawer(app);
    const fb = (await app.evalJs(SIZES(E)))?.alpha;
    await typeSize(app, '.wz-sliver .wz-type input.wz-type-num', 18);
    const fs = await app.evalJs(SIZES(E));
    ok(`F [${name}] FREE WRITE: there is no Selection scope - the box sizes the whole page (every word, 12 -> 18)`, fs && WORDS.every((w) => Math.abs(fs[w] / fb - 18 / 12) < 0.03), JSON.stringify(fs));

    // ==== C - a card's dock ====
    await freshDesk(app, theme, cast);
    await app.evalJs(`window.wrizoCreateJournalPage({ id: 'sw-board-${theme}', text: 'Board', pageType: 'board', createdAt: new Date().toISOString(), origin: null,
      boxes: [ { id: 'c1', kind: 'text', x: 0.05, y: 0.06, w: 0.5, h: 0.14, z: 1, text: ${JSON.stringify(TEXT)} } ] })`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/sw-board-${theme}'`);
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board' });
    await sleep(500);
    const r = await app.evalJs(`(() => { const e = document.querySelector('.board-box .board-text'); const b = e.getBoundingClientRect(); return { x: Math.round(b.left + 6), y: Math.round(b.bottom - 6) }; })()`);
    await app.doubleClick(r.x, r.y);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'card popup' }).catch(() => ok(`C [${name}] DRIVER: popup opened`, false, 'timed out'));
    if (!(await app.evalJs("!!document.querySelector('.board-popup-dock .wz-type')"))) await app.evalJs("document.querySelector('.board-popup-dock-grip') && document.querySelector('.board-popup-dock-grip').click()");
    await sleep(400);
    const PE = '.board-popup-editor';
    const cb = (await app.evalJs(SIZES(PE)))?.alpha;
    const ch = await highlight(app, PE, 'delta');
    ok(`C [${name}] DRIVER: a real double-click highlights "delta" in the card`, ch, String(await app.evalJs(SEL)));
    await typeSize(app, '.board-popup-dock input.wz-type-num', 22);
    const cs = await app.evalJs(SIZES(PE));
    ok(`C [${name}] CARD: with "delta" highlighted, typing 22 + Enter sizes ONLY "delta" - every other word in the card keeps its size`, cs && Math.abs(cs.delta - 22 * 4 / 3) < 0.1 && ['alpha', 'bravo', 'charlie', 'echo', 'foxtrot'].every((w) => Math.abs(cs[w] - cb) < 0.5), JSON.stringify(cs));
  }
 } catch (e) { ok('driver ran to a verdict', false, String((e && e.stack) || e)); }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `SIZE-WORDS VERIFY: FAIL (${failed.length} of ${checks.length})` : `SIZE-WORDS VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
