// CARD HELD ITALIC (chat 1's card-port frames, C3a: "Ctrl+I, then typing - produced NO italic run in the popup").
// THE CAUSE, proven before any fix with the real formatter and 211 rules (FIX's node replay, 2026-10-15): the held italic DID make its
// run - "Plain then *slanted words*" - and the SECOND Ctrl+I, the writer's "italic off", landed with the caret directly before the
// run's closing mark, which store/draftFormat.ts toggleInline reads as "a caret inside a run: remove the run". So the press meant to
// END the italic unwrapped the words it had just made: "Plain then slanted words and plain again", exactly chat 1's frame. The
// formatter is shared, so the PAGE did the same; the card is only where it was seen.
// THE RULE NOW: a press with the caret directly before a run's own closing mark (the run holding text) ends that style for what is
// typed next - held like the empty italic is held - and leaves the run as it is. Every other caret keeps today's behaviour (the
// CONTROL below: a press with the caret in the MIDDLE of a run still removes the run).
// Each surface types chat 1's own sequence with real keys: "Plain then ", Ctrl+I, "slanted words", Ctrl+I, " and plain again".
// Run: node scripts/harness/card-held-italic.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const CE = '.board-popup-editor';
const WANT = 'Plain then *slanted words* and plain again';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded by the checks */ }
};
const openDraft = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' }).then(() => true, () => false);
  if (!up) return false;
  await sleep(500);
  await app.click('Draft'); await sleep(900);
  return true;
};
const openCard = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Card board', pageType: 'board', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page',
    boxes: [{ id: `${id}-c`, kind: 'text', x: 0.06, y: 0.06, w: 0.5, h: 0.16, z: 1, text }] })})`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('[data-box-id="${id}-c"]')`, { label: 'the card' }).then(() => true, () => false);
  if (!up) return false;
  await sleep(600);
  // a real double-click on the card's body (trusted CDP mouse events)
  const c = await app.evalJs(`(() => { const r = document.querySelector('[data-box-id="${id}-c"]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const m = (type, n, b) => app.cdp('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', buttons: b, clickCount: n, pointerType: 'mouse' });
  await m('mousePressed', 1, 1); await m('mouseReleased', 1, 0); await sleep(60); await m('mousePressed', 2, 1); await m('mouseReleased', 2, 0);
  return app.waitFor(`!!document.querySelector('${CE}')`, { label: 'card popup' }).then(() => true, () => false);
};
// the caret at the very end of the editor's text (after the guard when the text ends in a newline), the editor focused
const caretEnd = (app, sel) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
// the caret at a plain offset, through visible text
const caretAt = (app, sel, off) => app.evalJs(`(() => { const ed = document.querySelector('${sel}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0;
  while ((n = w.nextNode())) { const hidden = n.parentElement && n.parentElement.closest('.md-mark-hidden'); if (!hidden && acc + n.data.length >= ${off}) { const r = document.createRange(); r.setStart(n, ${off} - acc); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } acc += n.data.length; } return false; })()`);
const pageText = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const cardText = (app, id) => app.evalJs(`((JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).boxes||[])[0]?.text ?? null`);
// a stored value read only once it has stopped changing (the autosave debounce lands after the last key)
const settledBy = async (read) => { await sleep(2600); let last = await read(); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = await read(); same = n === last ? same + 1 : 0; last = n; } return last; };
const italics = (app, sel) => app.evalJs(`[...document.querySelectorAll('${sel} .md-italic')].map(e => e.textContent.replace(/\\*/g, ''))`);
const sequence = async (app) => {
  await app.typeKeys('Plain then ');
  await app.keyCombo('i'); await sleep(250);
  await app.typeKeys('slanted words');
  await app.keyCombo('i'); await sleep(250);
  await app.typeKeys(' and plain again');
  await sleep(300);
};

await withHarness(async (app) => {
  // ---- THE CARD (chat 1's C3a)
  const card = await openCard(app, 'hi1', 'Card start');
  ok('CARD (setup): a real double-click opens the card pop-up', card);
  if (card) {
    await caretEnd(app, CE);
    await app.key('Enter');
    await sequence(app);
    const shown = await app.evalJs(`document.querySelector('${CE}').textContent`);
    const it = await italics(app, CE);
    ok('CARD: Ctrl+I, words, Ctrl+I, more words - the held italic STAYS on its words and ends where the writer pressed it off',
      typeof shown === 'string' && shown.endsWith(WANT) && it.length === 1 && it[0] === 'slanted words', JSON.stringify({ shown, italics: it }));
    await app.key('Escape'); await sleep(400);
    const stored = await settledBy(() => cardText(app, 'hi1'));
    ok('CARD: ...and that is what is stored', typeof stored === 'string' && stored.endsWith(WANT), JSON.stringify(stored));
  }
  // ---- THE PAGE (the same formatter, so the same bug)
  const page = await openDraft(app, 'hi2', 'Page start');
  ok('PAGE (setup): the page opens in Draft', page);
  if (page) {
    await caretEnd(app, ED);
    await app.key('Enter');
    await sequence(app);
    const it = await italics(app, ED);
    const stored = await settledBy(() => pageText(app, 'hi2'));
    ok('PAGE: the same sequence on a Draft page keeps the italic on "slanted words" and stores it',
      typeof stored === 'string' && stored.endsWith(WANT) && it.length === 1 && it[0] === 'slanted words', JSON.stringify({ stored, italics: it }));
  }
  // ---- CONTROL: a press with the caret in the MIDDLE of a run still removes the run, as it always has
  const ctl = await openDraft(app, 'hi3', 'a *slanted* b');
  if (ctl) {
    await caretAt(app, ED, 6);   // between "sla" and "nted": inside the run, not at its end
    await app.keyCombo('i'); await sleep(300);
    const stored = await settledBy(() => pageText(app, 'hi3'));
    ok('CONTROL: Ctrl+I with the caret in the middle of an italic run still removes the run (unchanged)', stored === 'a slanted b', JSON.stringify(stored));
  } else ok('CONTROL (setup): the page opens', false);
  // ---- the end-of-run press, alone: nothing is written and the next letter is plain
  const lone = await openDraft(app, 'hi4', 'a *slanted* b');
  if (lone) {
    await caretAt(app, ED, 10);  // directly after "slanted" (its hidden opening mark counts: s=3 ... d=9), before its closing mark
    await app.keyCombo('i'); await sleep(300);
    const mid = await pageText(app, 'hi4');
    await app.typeKeys('X');
    const stored = await settledBy(() => pageText(app, 'hi4'));
    ok('END OF RUN: Ctrl+I there writes nothing, and the next letter lands OUTSIDE the run (plain)', mid === 'a *slanted* b' && stored === 'a *slanted*X b', JSON.stringify({ mid, stored }));
  } else ok('END OF RUN (setup): the page opens', false);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCARD-HELD-ITALIC VERIFY: PASS (${checks.length} checks)` : `\nCARD-HELD-ITALIC VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
