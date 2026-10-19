// DELETE FOR GOOD - the writer's doors and the gate, in the real app (plan docs/plans/delete-for-good.md, cleared Oct 18 with Fable's change 1
// and Q3). The server half and the two-device proof are apps/server/scripts/harness/delete-for-good-e2e.mjs; the store's own rules are
// scripts/delete-for-good-check.mjs. Here, with trusted input:
//   H1  a BARE console call to window.wrizoDelete refuses, and the account is unchanged
//   H2  the in-app confirmation: a page-made (untrusted) fill and press does NOT unlock; the writer typing the exact phrase and pressing does;
//       it lasts this page session only (a reload locks it again)
//   H3  the harness's own test unlock works here (a local host)
//   H4  Trash: a trashed PAGE's card menu offers Delete; it asks "Delete for good?"; the page is gone from Trash, its record a shell
//   H5  Trash: Empty Trash on the board's own menu names the count, asks, and empties Trash (pages and a trashed card); then it is greyed
//   H6  a page open here, purged on another device: the app leaves it for the Desk and says so in one quiet line (Q3)
// Run: node scripts/harness/delete-for-good.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';
import { trustedDispatch } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const press = (app, expr, what) => trustedDispatch(app, expr, what, { report: ok });
const PHRASE = 'DELETE EVERYTHING';
const iso = (n = 0) => new Date(Date.UTC(2026, 3, 1, 0, 0, n)).toISOString();

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* recorded below */ }
};
const seed = (app, rec) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(rec)})`);
const raw = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(id)}) || null)`);
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
const rightClick = async (app, x, y) => {
  await app.mouseMove(x, y);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'right', buttons: 2, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'right', buttons: 0, clickCount: 1, pointerType: 'mouse' });
  await sleep(300);
};
const menu = (app) => app.evalJs("(() => { const m = document.querySelector('.wz-ctx'); if (!m) return null; return [...m.children].map((c) => (c.classList.contains('wz-ctx-sep') ? '---' : { label: c.textContent.trim(), disabled: c.disabled === true || c.getAttribute('aria-disabled') === 'true' })); })()");
const pick = (app, label) => press(app, `[...document.querySelectorAll('.wz-ctx-item')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(label)}))`, `the "${label}" menu item`);
const dialog = (app) => app.evalJs("(() => { const d = document.querySelector('.wz-delete-dialog'); return d ? { title: (d.querySelector('.wz-delete-title') || {}).textContent || null } : null; })()");
const trashCardFor = (app, entryId) => app.evalJs(`((window.wrizoBoard && window.wrizoBoard()) || []).find((b) => b.kind === 'page-pin' && b.entryId === ${JSON.stringify(entryId)})?.id || null`);

await withHarness(async (app) => {
  await freshDesk(app);
  const live = await seed(app, { id: 'dfg-live', text: 'A page that must survive a console call', createdAt: iso(1), origin: 'loose', source: 'page' });
  ok('(setup) a live page, seeded through the app\'s own seam', !!live);

  // ---- H1: a bare console call
  const h1 = await app.evalJs(`(() => { const out = {};
    for (const k of ['softAll', 'emptyTrash', 'purgeDeleted']) { try { window.wrizoDelete[k](); out[k] = 'ran'; } catch (e) { out[k] = String(e && e.message); } }
    return out; })()`);
  const h1live = await raw(app, 'dfg-live');
  ok('H1: a BARE console call to each of window.wrizoDelete\'s paths REFUSES (no in-app confirmation this session) and the page is untouched',
    Object.values(h1).every((v) => /refused/i.test(v)) && !!h1live && !h1live.deletedAt, JSON.stringify({ h1, deleted: h1live && h1live.deletedAt }));

  // ---- H2: the in-app confirmation
  // ledger 107: the statement ENDS IN null. evalJs awaits a returned promise, and this request is answered only by the NEXT step (the typing), so
  // returning it deadlocked H2 until the 903 s timeout. The answer is read from window.__wzConfirmAnswer instead.
  await app.evalJs(`window.__wzConfirmAnswer = null; window.wrizoDestructive.request({ title: 'Delete everything on this account, for good?', lines: ['3 pages', '1 board'], phrase: ${JSON.stringify(PHRASE)} }).then((a) => { window.__wzConfirmAnswer = a; }); null`);
  await sleep(400);
  const dlg = await app.evalJs("(() => { const d = document.querySelector('.wz-destructive'); return d ? { title: (d.querySelector('.wz-destructive-title') || {}).textContent, hasInput: !!d.querySelector('.wz-destructive-input'), go: !!d.querySelector('.wz-destructive-go') } : null; })()");
  ok('H2 (setup): the request opens the in-app confirmation (a title, the phrase field, and a Delete for good button)', !!dlg && dlg.hasInput && dlg.go, JSON.stringify(dlg));
  // a page-made fill and press: untrusted
  await app.evalJs(`(() => { const i = document.querySelector('.wz-destructive-input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(PHRASE)}); i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.wz-destructive-go').click(); return true; })()`);
  await sleep(300);
  const afterUntrusted = await app.evalJs('({ unlocked: window.wrizoDestructive.unlocked(), answer: window.__wzConfirmAnswer, open: !!document.querySelector(".wz-destructive") })');
  ok('H2: a page-made (untrusted) fill of the phrase and a page-made press do NOT unlock - the dialog stays, nothing answered',
    afterUntrusted.unlocked === false && afterUntrusted.answer === null && afterUntrusted.open === true, JSON.stringify(afterUntrusted));
  // the writer: trusted typing, then a trusted press
  await press(app, "document.querySelector('.wz-destructive-input')", 'the phrase field');
  await app.keyCombo('a'); await sleep(100);
  await app.typeKeys(PHRASE);
  await sleep(200);
  await press(app, "document.querySelector('.wz-destructive-go')", 'Delete for good');
  await sleep(400);
  const afterTrusted = await app.evalJs('({ unlocked: window.wrizoDestructive.unlocked(), answer: window.__wzConfirmAnswer, open: !!document.querySelector(".wz-destructive") })');
  ok('H2: the writer typing the exact phrase and pressing Delete for good unlocks, answers the request, and closes the dialog',
    afterTrusted.unlocked === true && afterTrusted.answer === true && afterTrusted.open === false, JSON.stringify(afterTrusted));
  await app.reload();
  await app.waitFor('!!window.wrizoDestructive', { label: 'the app after a reload' });
  const afterReload = await app.evalJs('window.wrizoDestructive.unlocked()');
  ok('H2: the unlock lasts this page session only - a reload locks it again', afterReload === false, String(afterReload));

  // ---- H3: the test unlock
  const h3 = await app.evalJs('window.wrizoDestructive.unlockForTest()');
  ok('H3: the harness\'s own test unlock works on this local host', h3 === true && (await app.evalJs('window.wrizoDestructive.unlocked()')) === true, String(h3));

  // ---- H4: Trash, Delete on a trashed page
  await freshDesk(app);
  await seed(app, { id: 'dfg-t1', text: 'A trashed page', createdAt: iso(2), origin: 'loose', source: 'page', deletedAt: iso(3) });
  await app.evalJs("location.hash = '#/trash'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the Trash board' }).catch(() => {});
  await sleep(900);
  const cardId = await trashCardFor(app, 'dfg-t1');
  const at = cardId ? await R(app, `[data-box-id="${cardId}"]`) : null;
  ok('H4 (setup): the trashed page shows on the Trash board', !!at, JSON.stringify({ cardId, at }));
  if (at) {
    await rightClick(app, Math.round(at.l + at.w * 0.4), Math.round(at.t + at.h * 0.4));
    const m4 = await menu(app);
    ok('H4: a trashed page\'s card menu offers Restore, then Delete', JSON.stringify((m4 || []).map((x) => (x === '---' ? x : x.label))) === JSON.stringify(['Restore', '---', 'Delete']), JSON.stringify(m4));
    await pick(app, 'Delete');
    await sleep(300);
    const d4 = await dialog(app);
    ok('H4: it always asks, in the purge words: "Delete for good?"', !!d4 && /for good/i.test(d4.title || ''), JSON.stringify(d4));
    await press(app, "document.querySelector('.wz-delete-go')", 'the dialog\'s Delete');
    await sleep(700);
    const gone = !(await trashCardFor(app, 'dfg-t1'));
    const r4 = await raw(app, 'dfg-t1');
    ok('H4: the page is gone from Trash, and its record is a shell (purgedAt, no words)', gone && !!r4 && !!r4.purgedAt && !r4.text, JSON.stringify({ gone, r4 }));
  }

  // ---- H5: Empty Trash
  await freshDesk(app);
  await seed(app, { id: 'dfg-t2', text: 'Trashed two', createdAt: iso(4), origin: 'loose', source: 'page', deletedAt: iso(5) });
  await seed(app, { id: 'dfg-t3', text: 'Trashed three', createdAt: iso(6), origin: 'loose', source: 'page', deletedAt: iso(7) });
  await seed(app, { id: 'dfg-board', text: 'A board', createdAt: iso(8), origin: 'loose', source: 'page', pageType: 'board',
    boxes: [{ id: 'dfg-card', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.08, z: 1, text: 'a trashed card', deletedAt: iso(9), updatedAt: iso(9) }] });
  await app.evalJs("location.hash = '#/trash'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the Trash board' }).catch(() => {});
  await sleep(900);
  const cv = await R(app, '.board-canvas');
  // the empty canvas: its lower-right, clear of the cards Trash lays out from the top-left
  await rightClick(app, Math.round(cv.l + cv.w - 30), Math.round(cv.t + Math.min(cv.h, 600) - 30));
  const m5 = await menu(app);
  const empty = (m5 || []).find((x) => x !== '---' && /^Empty Trash/.test(x.label));
  ok('H5: the Trash board\'s own menu offers Empty Trash', !!empty && !empty.disabled, JSON.stringify(m5));
  if (empty) {
    await pick(app, 'Empty Trash');
    await sleep(300);
    const d5 = await dialog(app);
    ok('H5: it names the count and asks: "Delete 3 items for good?"', !!d5 && /\b3\b/.test(d5.title || '') && /for good/i.test(d5.title || ''), JSON.stringify(d5));
    await press(app, "document.querySelector('.wz-delete-go')", 'the dialog\'s Delete');
    await sleep(900);
    const left = await app.evalJs("((window.wrizoBoard && window.wrizoBoard()) || []).filter((b) => b.kind === 'page-pin').length");
    const t2 = await raw(app, 'dfg-t2');
    const card = await app.evalJs("(window.wrizoStoredBoxes('dfg-board') || []).find((b) => b.id === 'dfg-card') || null");
    ok('H5: Trash is empty - both pages are shells and the trashed card is purged', left === 0 && !!t2 && !!t2.purgedAt && !!card && !!card.purgedAt, JSON.stringify({ left, t2: t2 && t2.purgedAt, card }));
    await rightClick(app, Math.round(cv.l + cv.w - 30), Math.round(cv.t + Math.min(cv.h, 600) - 30));
    const m5b = await menu(app);
    const e2 = (m5b || []).find((x) => x !== '---' && /^Empty Trash/.test(x.label));
    ok('H5: with Trash empty, Empty Trash is greyed', !!e2 && e2.disabled === true, JSON.stringify(m5b));
    await app.key('Escape');
  }

  // ---- H6: a page open here, purged on another device
  await freshDesk(app);
  await seed(app, { id: 'dfg-open', text: 'Open on this device', createdAt: iso(10), origin: 'loose', source: 'page' });
  await app.evalJs("location.hash = '#/page/dfg-open'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the open page' }).catch(() => {});
  await sleep(700);
  const now = new Date().toISOString();
  // the app's own pull path with one record (wrizoApplyRemoteBoard -> applyRemoteRecords({ journalEntries: [rec] })): the shell another device made
  await app.evalJs(`window.wrizoApplyRemoteBoard({ id: 'dfg-open', createdAt: ${JSON.stringify(iso(10))}, updatedAt: ${JSON.stringify(now)}, deletedAt: ${JSON.stringify(now)}, purgedAt: ${JSON.stringify(now)}, text: '' })`);
  await sleep(1200);
  const h6 = await app.evalJs("({ hash: location.hash, toast: (document.querySelector('.action-toast') || {}).textContent || null })");
  ok('H6: the open page, purged on another device, leaves for the Desk with one quiet line (Q3)',
    !/dfg-open/.test(h6.hash) && /deleted for good on another device/i.test(h6.toast || ''), JSON.stringify(h6));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nDELETE-FOR-GOOD VERIFY: PASS (${checks.length} checks)` : `\nDELETE-FOR-GOOD VERIFY: FAIL - ${passed === checks.length ? 0 : checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
