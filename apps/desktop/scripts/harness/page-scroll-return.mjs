// PAGE -> PLAN -> BACK RETURNS THE WRITER TO WHERE THEY WERE (live bug, Oct 13). Nick went from a page to its Plan and back, and landed at the TOP of the page.
//
// CAUSE (measured by check R2 below, not argued): the way-back store holds ONE slot (sessionStorage 'wrizo-way-back'). Leaving the page captures its scroll and caret into it. The page's PLAN is an
// ordinary board that PARTICIPATES in the way-back, and a participant captures ON UNMOUNT - so leaving the Plan overwrote the slot with the BOARD's own entry. The page then mounted, found a slot
// naming someone else, and restored nothing. (B1 fixed the same race for SYSTEM boards only; a page's paired Plan board was left participating.)
// THE FIX: a board that is a page's paired Plan face takes no part in the way-back, decided once per mount (BoardEditor.tsx). The slot keeps the PAGE's own departure.
//
//   R1  the fix is in place, and decided ONCE per mount (source pin; a mutant removes it)
//   R2  while the writer is ON the Plan, the slot still names the PAGE (not the board) - the premise, measured
//   R3  page -> Plan -> the board's PAGE door -> the page: scroll and caret are where they were (twice in a row)
//   R4  a page that was never scrolled and has no caret returns without an error (the plain round trip)
//
// Needs a box turn (withHarness refuses without WS_BOX_TURN). Run: WS_BOX_TURN=<token> node scripts/harness/page-scroll-return.mjs   (from apps/desktop, dist-web built)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const PAGE = 'psr-page';
const LINES = Array.from({ length: 70 }, (_, i) => `Line ${i + 1} of a page that has a good deal of work already on it, long enough to need scrolling.`).join('\n');
const noCR = (t) => t.replace(/\r\n?/g, '\n');

// ---- R1: the source pin (browserless half) ---------------------------------------------------------------------------------------------------------------------------
{
  const be = noCR(fs.readFileSync(path.join(SRC, 'components/BoardEditor.tsx'), 'utf8'));
  const pin = /const \[participatesInWayBack\] = useState\(\(\) => !isSystemBoard && !getPairedPageId\(id\)\);\n\s*useWayBack\(\{ entryId: id, participatesInWayBack \}\);/.test(be);
  ok('R1: a board that is a page\'s paired Plan face takes no part in the way-back (and a system board still does not), decided ONCE per mount (useState initializer, so a later unpairing cannot fire a stray capture)', pin, pin ? '' : 'pin not found');
  const mutated = be.replace('!isSystemBoard && !getPairedPageId(id)', '!isSystemBoard');
  ok('R1 (mutant): without the paired-board clause the pin goes RED (the mutation landed and the pin noticed)', mutated !== be && !/useState\(\(\) => !isSystemBoard && !getPairedPageId\(id\)\)/.test(mutated), '');
}

const fresh = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(PAGE)}, text: ${JSON.stringify(LINES)}, createdAt: new Date().toISOString(), source: null, origin: null })`);
  await sleep(450);
};
const openPage = async (app) => {
  await app.evalJs(`location.hash = '#/page/${PAGE}'`);
  const there = await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'the page', timeout: 9000 });
  await sleep(900);
  return there;
};
// the same measure before and after: characters from the editor's start to the caret
const caretNow = (app) => app.evalJs(`(() => { const el = document.querySelector('${ED}'); const s = window.getSelection();
  if (!el || !s || !s.rangeCount || !el.contains(s.anchorNode)) return null;
  const r = document.createRange(); r.selectNodeContents(el); r.setEnd(s.anchorNode, s.anchorOffset); return r.toString().length; })()`);
const scrollNow = (app) => app.evalJs("document.querySelector('.mode-scroll')?.scrollTop ?? null");
const placeCaretAndScroll = async (app, nth, y) => {
  await app.evalJs(`(() => { const el = document.querySelector('${ED}'); el.focus();
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n = 0, node = null; while (w.nextNode()) { n += 1; node = w.currentNode; if (n >= ${nth}) break; }
    const r = document.createRange(); r.setStart(node, Math.min(7, node.length)); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  await sleep(200);
  await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = ${y}; return sc.scrollTop; })()`);
  await sleep(400);   // the scroll listener and the selectionchange listener both track into refs
};
const toPlanAndBack = async (app) => {
  const planDoor = await app.evalJs("!!document.querySelector('[data-page-plan-door]')");
  if (!planDoor) return { error: 'no Plan door' };
  await app.evalJs("document.querySelector('[data-page-plan-door]').click()");
  const onPlan = await waitSoft(app, `!!document.querySelector('[data-board-door="page"]')`, { label: 'the Plan board', timeout: 9000 });
  await sleep(900);
  const slotOnPlan = await app.evalJs("(() => { try { return JSON.parse(sessionStorage.getItem('wrizo-way-back') || 'null'); } catch { return 'unreadable'; } })()");
  await app.evalJs("document.querySelector('[data-board-door=\"page\"]').click()");
  const back = await waitSoft(app, `location.hash === '#/page/${PAGE}' && !!document.querySelector('${ED}')`, { label: 'back on the page', timeout: 9000 });
  await sleep(1000);   // the restore ladder runs to ~350 ms
  return { onPlan, slotOnPlan, back };
};

await withHarness(async (app) => {
  await fresh(app);
  if (!(await openPage(app))) { ok('fixture: the page opened', false); return; }
  const scrollable = await app.evalJs("(() => { const sc = document.querySelector('.mode-scroll'); return sc ? sc.scrollHeight - sc.clientHeight : -1; })()");
  ok('fixture: the page is long enough to scroll (the check below would be vacuous on a short page)', scrollable > 600, String(scrollable));

  // ---- R3 / R2: page -> Plan -> page, twice -------------------------------------------------------------------------------------------------------------------------
  await placeCaretAndScroll(app, 30, 520);
  const caret1 = await caretNow(app); const scroll1 = await scrollNow(app);
  ok('fixture: the caret and the scroll are set before leaving (scroll > 400, a caret offset exists)', scroll1 > 400 && caret1 != null, JSON.stringify({ scroll1, caret1 }));
  const r1 = await toPlanAndBack(app);
  ok('R2: while the writer is ON the Plan the way-back slot still names the PAGE, with its scroll - not the Plan board (the cause, measured: a participating board used to overwrite it on unmount)',
    !!r1.onPlan && r1.slotOnPlan && r1.slotOnPlan !== 'unreadable' && r1.slotOnPlan.entryId === PAGE && r1.slotOnPlan.scrollY > 400, JSON.stringify(r1));
  const scrollBack1 = await scrollNow(app); const caretBack1 = await caretNow(app);
  ok('R3: page -> Plan -> the PAGE door -> page puts the writer back where they were: the scroll within 3px of where it was, and the caret at the same offset',
    !!r1.back && scrollBack1 != null && Math.abs(scrollBack1 - scroll1) <= 3 && caretBack1 === caret1, JSON.stringify({ before: { scroll1, caret1 }, after: { scrollBack1, caretBack1 } }));

  // the same again from a DIFFERENT place (the slot is one-shot: the first return consumed it, so the second must be captured afresh)
  await placeCaretAndScroll(app, 12, 260);
  const caret2 = await caretNow(app); const scroll2 = await scrollNow(app);
  const r2 = await toPlanAndBack(app);
  const scrollBack2 = await scrollNow(app); const caretBack2 = await caretNow(app);
  ok('R3 (second trip): from a different spot the return is faithful again - the slot was captured afresh on the second departure and the Plan did not clobber it',
    !!r2.back && scrollBack2 != null && Math.abs(scrollBack2 - scroll2) <= 3 && caretBack2 === caret2 && Math.abs(scroll2 - scroll1) > 100, JSON.stringify({ before: { scroll2, caret2 }, after: { scrollBack2, caretBack2 } }));

  // ---- R4: the plain round trip (nothing scrolled, no caret placed) --------------------------------------------------------------------------------------------------------
  await fresh(app);
  if (await openPage(app)) {
    await app.evalJs("document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.getSelection().removeAllRanges()");
    const r3 = await toPlanAndBack(app);
    const top = await scrollNow(app);
    ok('R4: a page that was never scrolled and had no caret makes the round trip without an error and lands at the top, as it was', !!r3.back && top != null && top <= 3, JSON.stringify({ r3, top }));
  }
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const failed = checks.filter((c) => !c.pass);
// eslint-disable-next-line no-console
console.log(failed.length === 0 ? `\nPAGE-SCROLL-RETURN VERIFY: PASS (${checks.length} checks)` : `\nPAGE-SCROLL-RETURN VERIFY: FAIL - ${failed.length}/${checks.length}\n` + failed.map((c) => '  FAIL ' + c.name + ' | ' + String(c.detail).slice(0, 240)).join('\n'));
process.exit(failed.length === 0 ? 0 : 1);
