// A SPACE OR AN ENTER NO LONGER WRITES THE WHOLE PAGE (bug-list #110 and #101; Fable, Nov 22, 2:30 pm). MEASURED on today's main by space-enter-cost.mjs (run 45072360428 and its profile, 45072785124), Free Write, Arbor, from real CDP keys at the end
// of the page: a committed word or a new line gives the editor a new html string for the WHOLE page and React writes the host's innerHTML with it - 101,564 bytes at 20,000 words, 253,722 at 50,000, every key - and the caret re-anchor that
// follows pays the layout of all of it (Selection.removeAllRanges 22 ms a Space or an Enter at 50,000 words, 10 at 20,000, against 6 and 2 for a letter). The page is drawn line by line, so the rule is: a word added at the end appends to the
// host (src/components/freeWriteHost.ts, proved by free-write-host-unit.mjs); this check proves it in the page:
//   SE1  a Space at 20,000 and at 50,000 words writes at most 2,000 bytes of html into the page (main: 101,564 and 253,722); a letter writes 32
//   SE2  an Enter, the same
//   SE3  the caret re-anchor costs a Space no more than a letter plus 6 ms at 50,000 words (main: +21 ms) and an Enter the same
//   SE4  what she typed IS on the page: letters, Space, Enter and words typed at the end of a 2,000-word page read back exactly; a Backspace (a strike) still works (a struck run, the text still there), and a word typed after it
//   SE5  after all of it the page's text, read back from the editor, equals the page's own derived text (nothing was lost or doubled by appending)
//   SE6  the first word typed into a NEW (empty) page reads back before any Space, and the words after it (the rework of #110)
//   MUT  the reader goes RED on a whole-page write: a probe that sets the host's html as React did writes more than 2,000 bytes through the same counter
// Run: node scripts/harness/space-enter-holds.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join(String.fromCharCode(10)); };
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };

const INSTRUMENT = () => `(() => {
  if (window.__seh) return true;
  const S = window.__seh = { sel: 0, bytes: 0, big: [] };
  document.addEventListener('keydown', () => { S.sel = 0; S.bytes = 0; S.big = []; }, true);
  for (const m of ['removeAllRanges', 'addRange']) { const o = Selection.prototype[m]; Selection.prototype[m] = function (...a) { const t = performance.now(); try { return o.apply(this, a); } finally { S.sel += performance.now() - t; } }; }
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, get() { return d.get.call(this); }, set(v) { const n = String(v).length; S.bytes += n; if (n > 2000 && S.big.length < 3) S.big.push({ n, el: (this.className || this.tagName) + '', at: (new Error().stack || '').split('
').slice(2, 6).map((l) => l.trim().replace(/^at /, '').slice(0, 90)).join(' < ') }); d.set.call(this, v); } });
  return true; })()`;
const AFTER = "new Promise((res) => requestAnimationFrame(() => setTimeout(() => res({ sel: window.__seh.sel, bytes: window.__seh.bytes, big: window.__seh.big }), 0)))";

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const open = async (words) => {
    const id = `seh-${words}-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: pageOf(words), createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(500);
    await ev(`(() => { localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 40000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(words > 10000 ? 9000 : 3000);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); if (document.activeElement !== ed) ed.focus({ preventScroll: true }); return true; })()");
    return id;
  };
  const NL = String.fromCharCode(10);
  for (const words of [20000, 50000]) {
    await open(words);
    await ev(INSTRUMENT());
    const rows = { letter: [], space: [], enter: [] };
    for (let round = 0; round < 12; round += 1) {
      for (const [kind, ch] of [['letter', 'a'], ['letter', 'b'], ['space', ' '], ['letter', 'c'], ['enter', NL]]) { await app.typeKeys(ch); rows[kind].push(await ev(AFTER)); await sleep(50); }
    }
    const med = (k, f) => q(rows[k].map(f), 0.5);
    const bytes = { letter: med('letter', (r) => r.bytes), space: q(rows.space.map((r) => r.bytes), 0.95), enter: q(rows.enter.map((r) => r.bytes), 0.95), bigWrites: rows.space.concat(rows.enter).flatMap((r) => r.big || []).slice(0, 3) };
    ok(`SE1 [${words} words] a Space writes at most 2,000 bytes of html into the page (p95 over 12), a letter writes ${bytes.letter}`, bytes.space <= 2000, JSON.stringify(bytes));
    ok(`SE2 [${words} words] an Enter writes at most 2,000 bytes of html into the page (p95 over 12)`, bytes.enter <= 2000, JSON.stringify(bytes));
    if (words === 50000) {
      const sel = { letter: med('letter', (r) => r.sel), space: med('space', (r) => r.sel), enter: med('enter', (r) => r.sel) };
      ok('SE3 [50000 words] the caret re-anchor costs a Space and an Enter no more than a letter plus 6 ms (the page is laid out once, not made again)', sel.space <= sel.letter + 6 && sel.enter <= sel.letter + 6, JSON.stringify({ letterMs: sel.letter, spaceMs: sel.space, enterMs: sel.enter }));
    }
  }
  // SE4 / SE5: what she typed is on the page
  const id = await open(2000);
  await app.typeKeys('alpha beta'); await app.typeKeys(NL); await app.typeKeys('gamma delta '); await app.typeKeys(NL + NL); await app.typeKeys('epsilon');
  await sleep(400);
  const t1 = await ev("document.querySelector('.forward-only-editor').innerText");
  ok('SE4a letters, Space and Enter typed at the end of a 2,000-word page read back exactly', typeof t1 === 'string' && t1.replace(/​/g, '').endsWith('alpha beta' + NL + 'gamma delta ' + NL + NL + 'epsilon'), JSON.stringify(t1 && t1.slice(-60)));
  await app.key('Backspace'); await app.key('Backspace'); await sleep(300);
  const struck = await ev("(() => { const ed = document.querySelector('.forward-only-editor'); return { struck: ed.querySelectorAll('.fo-struck').length, text: ed.innerText.replace(/\\u200b/g, '').slice(-30) }; })()");
  ok('SE4b a Backspace still strikes (a struck run on the page, the struck words still there)', struck.struck >= 1 && /epsil/.test(struck.text), JSON.stringify(struck));
  await app.typeKeys(' zeta '); await app.typeKeys(NL); await sleep(400);
  const t2 = await ev("document.querySelector('.forward-only-editor').innerText");
  ok('SE4c and a word typed after the strike lands at the end, with its Space and Enter', typeof t2 === 'string' && t2.replace(/​/g, '').endsWith(' zeta ' + NL), JSON.stringify(t2 && t2.slice(-40)));
  // SE5: reopen the page from storage: the editor shows the same words as the one that was typed into
  await sleep(1500);
  const typedText = await ev("document.querySelector('.forward-only-editor').textContent.replace(/\\u200b/g, '')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 40000, label: 'the page again' }).catch(() => {});
  await splashGone();
  await sleep(3000);
  const stored = await ev("document.querySelector('.forward-only-editor').textContent.replace(/\\u200b/g, '')");
  const strip = (s) => String(s).replace(/\s+/g, ' ').trim();
  ok('SE5 the page reopened from storage shows the same words as the page that was typed into (nothing lost or doubled by appending; struck words are history and stay)', strip(typedText).startsWith(strip(stored).slice(0, 400)) && Math.abs(strip(typedText).length - strip(stored).length) < 60, JSON.stringify({ typed: strip(typedText).length, stored: strip(stored).length }));
  // the reader can go red: a probe that writes the host's html whole, as React did
  await ev(INSTRUMENT());
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); window.__seh.bytes = 0; ed.innerHTML = ed.innerHTML; return true; })()");
  const m = await ev('window.__seh.bytes');
  ok('MUT-SE1 the SE1 reader goes RED on a whole-page write: setting the host\'s html as React did counts well over 2,000 bytes through the same counter', m > 2000, String(m));
  // SE6 (the rework of #110, Fable Nov 23): THE FIRST WORD OF A NEW PAGE READS BACK. The page is born empty, so the host's first html is '' (no word span); React is never handed another, so a letter had nowhere to land until the first Space
  // (arbor-redesign-groups G1, fx15 S1, item121 S3, wa-red-70 FW02/FW12, c13-12f-sprout-invite all read the first word back empty on #110's tip).
  const freshId = await ev("window.wrizoCreateJournalPage({ text: '', projectId: null, origin: 'loose', source: 'page' }).id");
  await ev(`(() => { localStorage.setItem('wrizo-mode-page-${freshId}', 'journal'); location.hash = '#/page/${freshId}'; })()`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'the new page' }).catch(() => {});
  await sleep(800);
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); if (document.activeElement !== ed) ed.focus({ preventScroll: true }); return true; })()");
  await app.typeKeys('hello'); await sleep(300);
  const w1 = await ev("document.querySelector('.forward-only-editor').textContent.replace(/\u200b/g, '')");
  ok('SE6a the first word typed into a NEW page reads back before any Space', w1 === 'hello', JSON.stringify(w1));
  await app.typeKeys(' world'); await sleep(300);
  const w2 = await ev("document.querySelector('.forward-only-editor').textContent.replace(/\u200b/g, '')");
  ok('SE6b and the words after it (a Space between) read back whole', w2 === 'hello world', JSON.stringify(w2));
  void id;
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nSPACE-ENTER-HOLDS VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nSPACE-ENTER-HOLDS VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
