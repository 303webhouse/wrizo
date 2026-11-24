// #82 - UNDO HISTORY LOST AFTER WORDS ARRIVE FROM ANOTHER WINDOW (Fable, Nov 11: "#82 is FIX's"; worked Nov 23). PageEditor adopts the words another window saved by bumping `remount`; the editor is keyed on it, so it MOUNTS AGAIN, and its mount makes a new undo
// stack (ForwardOnlyEditor.tsx createTextUndoStack): every step the writer had made on this page is gone, and Ctrl/Cmd+Z does nothing (Draft and Revise carry the stack; Free Write's surface has none). The rule: the history is KEPT, each of its states
// carrying the arrived words (a three-way merge of her state, the state she had last saved and theirs), so Undo takes back HER last words and never the other window's.
//   UA1  Draft, three words typed (steps), saved; another window saves "THEIRS" at the end: the page shows her words and THEIRS
//   UA2  Undo takes back her last word and KEEPS THEIRS (main: nothing happens - the history is gone)
//   UA3  a second Undo takes back the word before it, still keeping THEIRS: the history is more than one step deep
//   UA4  Redo brings her word back, with THEIRS
//   UA5  typing after the arrival is a step of its own and undoes alone
//   MUT  the UA2 reader goes RED on a page where Undo did nothing (the observation main makes)
// The other window is simulated through the app's own door for it: the storage event another window's write raises (store/persistence/syncApply.ts applyOtherWindowWrite), with the record rewritten in storage first.
// Run: harness.yml files=undo-after-arrival.mjs (Actions or the box).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 400) : ''}`); };
const KEY = 'writer-studio-journal-entries';
const ID = 'ua82-page';
const judgeUndid = (before, after) => after.includes('THEIRS') && !after.includes('three') && before.includes('three');

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: 'alpha', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); localStorage.setItem('wrizo-mode-page-${ID}', 'drafting'); history.replaceState(null, '', '/#/page/${ID}'); true`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'the page' }).catch(() => {});
  await splashGone();
  await sleep(1200);
  const text = () => ev("document.querySelector('.forward-only-editor').innerText.replace(/\\u200b/g, '')");
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus({ preventScroll: true }); const s = window.getSelection(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); s.removeAllRanges(); s.addRange(r); return true; })()");
  await app.typeKeys(' one'); await app.typeKeys(' two'); await app.typeKeys(' three');
  await sleep(2500);   // saved: nothing unsaved when the other window's words arrive
  const mine = await text();
  // the other window saves: the record in storage is rewritten and the storage event is raised, as a browser does for a write from another window
  await ev(`(() => { const rows = JSON.parse(localStorage.getItem(${JSON.stringify(KEY)})); const r = rows.find((x) => x.id === ${JSON.stringify(ID)}); r.text = r.text + ' THEIRS'; r.updatedAt = new Date(Date.now() + 5000).toISOString(); const raw = JSON.stringify(rows); localStorage.setItem(${JSON.stringify(KEY)}, raw);
    window.dispatchEvent(new StorageEvent('storage', { key: ${JSON.stringify(KEY)}, newValue: raw, storageArea: localStorage })); return true; })()`);
  await app.waitFor("document.querySelector('.forward-only-editor') && document.querySelector('.forward-only-editor').innerText.includes('THEIRS')", { timeout: 8000, label: 'their words shown' }).catch(() => {});
  await sleep(500);
  const arrived = await text();
  ok('UA1 after the other window saves, the page shows her words and THEIRS', mine.includes('three') && arrived.includes('three') && arrived.includes('THEIRS'), JSON.stringify({ mine: mine.slice(-30), arrived: arrived.slice(-40) }));
  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  await app.keyCombo('z'); await sleep(300);
  const u1 = await text();
  ok('UA2 Undo takes back her last word and keeps THEIRS', judgeUndid(arrived, u1), JSON.stringify({ arrived: arrived.slice(-40), afterUndo: u1.slice(-40) }));
  await app.keyCombo('z'); await sleep(300);
  const u2 = await text();
  ok('UA3 a second Undo takes back the word before it, still keeping THEIRS', u2.includes('THEIRS') && !u2.includes('two') && u1.includes('two'), JSON.stringify({ afterUndo2: u2.slice(-40) }));
  await app.keyCombo('z', { shift: true }); await sleep(300);
  const r1 = await text();
  ok('UA4 Redo brings her word back, with THEIRS', r1.includes('two') && r1.includes('THEIRS'), JSON.stringify({ afterRedo: r1.slice(-40) }));
  await app.typeKeys(' four'); await sleep(300);
  const t4 = await text();
  await app.keyCombo('z'); await sleep(300);
  const u4 = await text();
  ok('UA5 typing after the arrival is a step of its own and undoes alone', t4.includes('four') && !u4.includes('four') && u4.includes('THEIRS') && u4.includes('two'), JSON.stringify({ typed: t4.slice(-30), undone: u4.slice(-30) }));
  ok('MUT-UA2 the UA2 reader goes RED on a page where Undo did nothing', judgeUndid(arrived, arrived) === false);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nUNDO-AFTER-ARRIVAL VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nUNDO-AFTER-ARRIVAL VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
