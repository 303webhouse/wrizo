// #82 - UNDO HISTORY LOST AFTER WORDS ARRIVE FROM ANOTHER WINDOW (Fable, Nov 11: "#82 is FIX's"; worked Nov 23). PageEditor adopts the words another window saved by bumping `remount`; the editor is keyed on it, so it MOUNTS AGAIN, and its mount makes a new undo
// stack (ForwardOnlyEditor.tsx createTextUndoStack): every step the writer had made on this page is gone, and Ctrl/Cmd+Z does nothing (Draft and Revise carry the stack; Free Write's surface has none). The rule: the history is KEPT, each of its states
// carrying the arrived words (a three-way merge of her state, the state she had last saved and theirs), so Undo takes back HER last words and never the other window's.
//   UA1  Draft, three words typed (steps), saved; another window saves "THEIRS" at the end: the page shows her words and THEIRS
//   UA2  Undo takes back her last word and KEEPS THEIRS (main: nothing happens - the history is gone)
//   UA3  a second Undo takes back the word before it, still keeping THEIRS: the history is more than one step deep
//   UA4  Redo brings her word back, with THEIRS
//   UA5  typing after the arrival is a step of its own and undoes alone
//   UB1-UB4  the MERGE case: she had words not yet saved when theirs arrived; the page holds each of her words and THEIRS once (no line twice), Undo takes back her unsaved word and never THEIRS, Redo brings it back
//   UC1-UC2  the arrival's COST at 50,000 words with a full history against the same arrival with none; nothing doubled, Undo still works there
//   MUT  the UA2 reader goes RED on a page where Undo did nothing (the observation main makes)
// The other window is simulated through the app's own door for it: the storage event another window's write raises (store/persistence/syncApply.ts applyOtherWindowWrite), with the record rewritten in storage first.
// Run: harness.yml files=undo-after-arrival.mjs (Actions or the box).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 400) : ''}`); };
const KEY = 'writer-studio-journal-entries';
const ID = 'ua82-page';
const count = (s, w) => s.split(w).length - 1;
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

  // ---- UB: the merge case. A fresh page; two words saved, a third NOT; theirs arrives from the record as it was saved ----
  const ID2 = 'ua82-merge';
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID2, text: 'alpha', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); localStorage.setItem('wrizo-mode-page-${ID2}', 'drafting'); history.replaceState(null, '', '/#/page/${ID2}'); true`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'the merge page' }).catch(() => {});
  await splashGone();
  await sleep(1200);
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus({ preventScroll: true }); const s = window.getSelection(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); s.removeAllRanges(); s.addRange(r); return true; })()");
  await app.typeKeys(' one'); await app.typeKeys(' two');
  await sleep(2500);
  // `front`: their words go at the START of the page (a merge whose two edits do not touch; where they touch, #76's keep-both writes the line twice by design, and that is not this ticket's)
  const arrive = (id, word, front = false) => ev(`(() => { const rows = JSON.parse(localStorage.getItem(${JSON.stringify(KEY)})); const r = rows.find((x) => x.id === ${JSON.stringify(id)}); r.text = ${front ? `'${word} ' + r.text` : `r.text + ' ${word}'`}; r.updatedAt = new Date(Date.now() + 5000 + Math.floor(Math.random() * 1000)).toISOString(); const raw = JSON.stringify(rows); localStorage.setItem(${JSON.stringify(KEY)}, raw);
    window.dispatchEvent(new StorageEvent('storage', { key: ${JSON.stringify(KEY)}, newValue: raw, storageArea: localStorage })); return true; })()`);
  await app.typeKeys(' three');   // not saved yet
  await arrive(ID2, 'THEIRS', true);
  await app.waitFor("document.querySelector('.forward-only-editor') && document.querySelector('.forward-only-editor').innerText.includes('THEIRS')", { timeout: 8000, label: 'their words shown (merge)' }).catch(() => {});
  await sleep(800);
  const merged = await text();
  ok('UB1 the merged page holds alpha, one, two, three and THEIRS, each once (no line written twice)', ['alpha', 'one', 'two', 'three', 'THEIRS'].every((w) => count(merged, w) === 1), JSON.stringify(merged.slice(-60)));
  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  await app.keyCombo('z'); await sleep(300);
  const b1 = await text();
  ok('UB2 Undo takes back her unsaved word, keeps THEIRS, and writes nothing twice', count(b1, 'THEIRS') === 1 && count(b1, 'three') === 0 && count(b1, 'alpha') === 1 && count(b1, 'two') === 1, JSON.stringify(b1.slice(-60)));
  await app.keyCombo('z'); await sleep(300);
  const b2 = await text();
  ok('UB3 a second Undo takes back "two", keeps THEIRS, nothing twice', count(b2, 'THEIRS') === 1 && count(b2, 'two') === 0 && count(b2, 'one') === 1 && count(b2, 'alpha') === 1, JSON.stringify(b2.slice(-60)));
  await app.keyCombo('z', { shift: true }); await sleep(300);
  const b3 = await text();
  ok('UB4 Redo brings "two" back with THEIRS, nothing twice', count(b3, 'two') === 1 && count(b3, 'THEIRS') === 1 && count(b3, 'alpha') === 1, JSON.stringify(b3.slice(-60)));

  // ---- UC: the cost at 50,000 words ----
  const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
  const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join(String.fromCharCode(10)); };
  const ID3 = 'ua82-big';
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID3, text: pageOf(50000), createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); localStorage.setItem('wrizo-mode-page-${ID3}', 'drafting'); history.replaceState(null, '', '/#/page/${ID3}'); true`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 60000, label: 'the 50,000-word page' }).catch(() => {});
  await splashGone();
  await sleep(9000);
  const arriveBig = async (word) => {
    await arrive(ID3, word);
    const t0 = Date.now();
    await app.waitFor(`document.querySelector('.forward-only-editor') && document.querySelector('.forward-only-editor').textContent.endsWith('${word}')`, { timeout: 30000, label: `${word} shown` }).catch(() => {});
    return Date.now() - t0;
  };
  const control = await arriveBig('ZEROSTEPS');   // no history yet
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus({ preventScroll: true }); const s = window.getSelection(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); s.removeAllRanges(); s.addRange(r); return true; })()");
  for (let i = 0; i < 36; i += 1) await app.typeKeys(' w' + i);   // 36 words, each closed by the next one's space: 36 steps, and the arrival keeps the last 60
  await sleep(3500);
  const withHistory = await arriveBig('SIXTYSTEPS');
  const big = await ev("document.querySelector('.forward-only-editor').textContent.replace(/\\u200b/g, '')");
  ok(`UC1 the arrival at 50,000 words with a history costs no more than 500 ms over the same arrival with none (none ${control} ms, history ${withHistory} ms)`, withHistory <= control + 500, JSON.stringify({ control, withHistory }));
  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  await app.keyCombo('z'); await sleep(1500);
  const bigU = await ev("document.querySelector('.forward-only-editor').textContent.replace(/\\u200b/g, '')");
  ok('UC2 Undo works there: her last word goes, SIXTYSTEPS stays, nothing written twice', count(bigU, 'SIXTYSTEPS') === 1 && !bigU.includes('w35') && count(bigU, 'ZEROSTEPS') === 1 && bigU.length < big.length && bigU.length > big.length - 40, JSON.stringify({ was: big.length, now: bigU.length, tail: bigU.slice(-40) }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nUNDO-AFTER-ARRIVAL VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nUNDO-AFTER-ARRIVAL VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
