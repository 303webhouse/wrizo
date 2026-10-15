// PAGE -> PLAN -> BACK, LIVE (this desk's capture script, run against PRODUCTION with WS_TARGET_URL): per theme (Arbor = plateau, Flux):
//  Pa a long page scrolled to a spot with the caret placed there        Pb the page's PLAN board (the page left, by the Plan door)
//  Pc back on the page by the board's PAGE door - the same scroll and the same caret offset     (and a second trip from a different spot)
// Facts per frame: scrollTop, the caret's character offset, the hash, the bundle, the way-back slot. Anonymous throwaway profile; no sign-in surface.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from 'file:///C:/Users/nickh/writer-studio/.claude/worktrees/ps-ship/apps/desktop/scripts/runtime-verify.mjs';

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const PAGE = 'psr-page';
const LINES = Array.from({ length: 70 }, (_, i) => `Line ${i + 1} of a page that has a good deal of work already on it, long enough to need scrolling.`).join('\n');
const rows = [];
const caretNow = (app) => app.evalJs(`(() => { const el = document.querySelector('${ED}'); const s = window.getSelection();
  if (!el || !s || !s.rangeCount || !el.contains(s.anchorNode)) return null;
  const r = document.createRange(); r.selectNodeContents(el); r.setEnd(s.anchorNode, s.anchorOffset); return r.toString().length; })()`);
const scrollNow = (app) => app.evalJs("document.querySelector('.mode-scroll')?.scrollTop ?? null");
const slotNow = (app) => app.evalJs("(() => { try { return JSON.parse(sessionStorage.getItem('wrizo-way-back') || 'null'); } catch { return 'unreadable'; } })()");
const facts = async (app) => ({ hash: await app.evalJs('location.hash'), theme: await app.evalJs("document.documentElement.getAttribute('data-theme')"),
  origin: await app.evalJs('location.origin'),
  bundle: await app.evalJs("([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, '')"),
  splashPresent: await app.evalJs("!!document.querySelector('.wz-splash')"), scrollTop: await scrollNow(app), caretOffset: await caretNow(app), wayBackSlot: await slotNow(app) });
const shot = async (app, name, extra = {}) => {
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  const row = { frame: name, file: `${name}.png`, ...(await facts(app)), ...extra }; rows.push(row); console.log(JSON.stringify(row)); return row;
};
const placeCaretAndScroll = async (app, nth, y) => {
  await app.evalJs(`(() => { const el = document.querySelector('${ED}'); el.focus();
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n = 0, node = null; while (w.nextNode()) { n += 1; node = w.currentNode; if (n >= ${nth}) break; }
    const r = document.createRange(); r.setStart(node, Math.min(7, node.length)); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  await sleep(200);
  await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = ${y}; return sc.scrollTop; })()`);
  await sleep(400);
};

await withHarness(async (app) => {
  for (const [id, theme] of [['arbor', 'plateau'], ['flux', 'flux']]) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme','${theme}'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(PAGE)}, text: ${JSON.stringify(LINES)}, createdAt: new Date().toISOString(), source: null, origin: null })`);
    await sleep(450);
    await app.evalJs(`location.hash = '#/page/${PAGE}'`);
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' }); await sleep(900);
    for (const [trip, nth, y] of [['1', 30, 520], ['2', 12, 260]]) {
      await placeCaretAndScroll(app, nth, y);
      const before = await shot(app, `${id}-T${trip}a-page-scrolled-caret-placed`);
      await app.evalJs("document.querySelector('[data-page-plan-door]').click()");
      await app.waitFor(`!!document.querySelector('[data-board-door="page"]')`, { label: 'the Plan board', timeout: 9000 }); await sleep(900);
      await shot(app, `${id}-T${trip}b-on-the-plan`);
      await app.evalJs("document.querySelector('[data-board-door=\"page\"]').click()");
      await app.waitFor(`location.hash === '#/page/${PAGE}' && !!document.querySelector('${ED}')`, { label: 'back on the page', timeout: 9000 }); await sleep(900);
      const after = await shot(app, `${id}-T${trip}c-back-on-the-page`, { before: { scrollTop: before.scrollTop, caretOffset: before.caretOffset },
        sameScrollWithin3px: Math.abs(after_scroll(before, await scrollNow(app))) <= 3, sameCaret: before.caretOffset === (await caretNow(app)) });
    }
  }
});
function after_scroll(before, now) { return (now ?? 1e9) - (before.scrollTop ?? 0); }
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`PAGE-PLAN-BACK FRAMES: ${rows.length} frames -> ${OUT}`);
