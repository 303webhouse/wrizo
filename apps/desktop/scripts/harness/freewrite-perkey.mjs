// FREE WRITE - A LETTER DOES NOT REWRITE THE PAGE (Fable, Nov 19, 11:05 am: #85's remainder, "measure first, then a red-first fix"). The measurement (freewrite-perkey-measure.mjs, run 44584005200): a letter in Free Write cost 16 ms at 500 and 5 000 words,
// 31 ms at 20 000 and 49 ms at 50 000 (key to next frame; floor 16); the profile's biggest self time was Selection.removeAllRanges (21 ms a key at 50k: the caret put back over a page whose DOM had just been replaced), and the page's own markup string
// was rebuilt and assigned on every key. A real browser, real CDP keys, the page open in Free Write (mode 'journal').
//   F1  a letter leaves the page's own nodes alone: the first and a middle `.fo-run` element, marked, are the same connected nodes after 5 letters (red: the host's html was assigned again on each key and every node was new)
//   F2  what is typed is there, once, in order: the editable's text is the seed plus the letters, and the caret is collapsed at the very end (the next key lands there)
//   F3  a space commits the word (the text carries it), the letters after it go on at the end
//   F4  Enter: the end-of-page guard is drawn (the line the key opened has a character to hold the caret, #70), and the next letter replaces it at the end of the text
//   F5  at 50 000 words a letter costs what it costs at 500: its median key-to-frame is under 36 ms (main: 50 ms; the fix: 26-28; the frame floor is 16) and within 2.4x of the 500-word median
// Run: on Actions (harness.yml, files=freewrite-perkey.mjs). One verdict line: FREEWRITE-PERKEY: PASS|FAIL.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 40 + (i % 90); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const AFTER = "new Promise((res) => requestAnimationFrame(() => setTimeout(() => res(performance.now() - window.__fwT0), 0)))";
const TEXT = `(() => { const ed = document.querySelector('${ED}'); return ed.textContent.split('\\u200b').join(''); })()`;
const CARET = `(() => { const ed = document.querySelector('${ED}'); const s = getSelection(); if (!s.rangeCount || !s.isCollapsed || !ed.contains(s.anchorNode)) return { ok: false }; const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.anchorNode, s.anchorOffset); const before = r.toString().split('\\u200b').join('').length; return { ok: true, before, total: ed.textContent.split('\\u200b').join('').length }; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  const open = async (words, id) => {
    const seed = pageOf(words);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: seed, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'journal')`);
    await sleep(400);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    const up = await waitSoft(app, `!!document.querySelector('${ED}') && document.querySelector('${ED}').textContent.length > ${Math.min(seed.length - 5, 1000)}`, { label: `the ${words}-word page in Free Write`, timeout: 30000 });
    await sleep(1500);
    await app.evalJs("(() => { window.__fwT0 = 0; if (!window.__fwK) { window.__fwK = true; document.addEventListener('keydown', () => { window.__fwT0 = performance.now(); }, true); } return true; })()");
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    await sleep(300);
    return { seed, up };
  };
  const keyMs = async (ch) => { await app.typeKeys(ch); return app.evalJs(AFTER); };

  // ---- F1-F4 at 2 000 words
  const { seed, up } = await open(2000, 'fwk-2000');
  ok('(premise) the 2 000-word page opens in Free Write', up);
  if (up) {
    await app.evalJs(`(() => { const runs = document.querySelectorAll('${ED} .fo-run'); window.__fwFirst = runs[0]; window.__fwMid = runs[Math.floor(runs.length / 2)]; runs[0].__fwMark = 'first'; return runs.length; })()`);
    const runs0 = await app.evalJs(`document.querySelectorAll('${ED} .fo-run').length`);
    for (const ch of 'abcde') await keyMs(ch);
    const f1 = await app.evalJs(`(() => ({ first: !!window.__fwFirst && window.__fwFirst.isConnected && window.__fwFirst.__fwMark === 'first' && document.querySelector('${ED} .fo-run') === window.__fwFirst, mid: !!window.__fwMid && window.__fwMid.isConnected }))()`);
    ok('F1: after 5 letters the page\'s own nodes (the first and a middle run) are the same connected nodes: a letter does not rewrite the page', f1.first && f1.mid && runs0 >= 1, JSON.stringify({ ...f1, runs0 }));
    const t1 = await app.evalJs(TEXT); const c1 = await app.evalJs(CARET);
    ok('F2: the 5 letters are in the text once, in order, and the caret is collapsed at the very end', t1 === seed + 'abcde' && c1.ok && c1.before === c1.total, JSON.stringify({ len: t1.length, want: (seed + 'abcde').length, tail: t1.slice(-8), caret: c1 }));
    for (const ch of ' fg') await keyMs(ch);
    const t2 = await app.evalJs(TEXT); const c2 = await app.evalJs(CARET);
    ok('F3: a space commits the word and the letters after it go on at the end', t2 === seed + 'abcde fg' && c2.ok && c2.before === c2.total, JSON.stringify({ tail: t2.slice(-12), caret: c2 }));
    await keyMs('\n');
    const g = await app.evalJs(`(() => ({ guard: !!document.querySelector('${ED} .fo-word .md-eof-guard'), text: ${TEXT} }))()`);
    ok('F4a: Enter draws the end-of-page guard (the new line has a character to hold the caret)', g.guard && g.text.endsWith('fg\n') === true || g.guard, JSON.stringify({ guard: g.guard, tail: g.text.slice(-6) }));
    await keyMs('h');
    const g2 = await app.evalJs(`(() => ({ guard: !!document.querySelector('${ED} .md-eof-guard'), text: ${TEXT}, caret: ${CARET} }))()`);
    ok('F4b: the next letter replaces the guard and lands at the end of the text', !g2.guard && g2.text === seed + 'abcde fg\nh' && g2.caret.ok && g2.caret.before === g2.caret.total, JSON.stringify({ guard: g2.guard, tail: g2.text.slice(-8), caret: g2.caret }));
  }

  // ---- F5 the cost, 500 words against 50 000
  const small = await open(500, 'fwk-500');
  const m500 = [];
  if (small.up) { for (let i = 0; i < 10; i += 1) await keyMs('abcdefghij'[i]); for (let i = 0; i < 40; i += 1) m500.push(await keyMs('klmnopqrst'[i % 10])); }
  const big = await open(50000, 'fwk-50000');
  const m50k = [];
  if (big.up) { for (let i = 0; i < 10; i += 1) await keyMs('abcdefghij'[i]); for (let i = 0; i < 40; i += 1) m50k.push(await keyMs('klmnopqrst'[i % 10])); }
  const a = med(m500), b = med(m50k);
  ok(`F5: a letter at 50 000 words: median ${b.toFixed(1)} ms (500 words: ${a.toFixed(1)} ms): under 36 ms and within 2.4x of the small page`, small.up && big.up && b < 36 && b <= 2.4 * a, `500: n=${m500.length}; 50k: n=${m50k.length}`);
});
const bad = checks.filter((c) => !c.pass);
console.log(`FREEWRITE-PERKEY: ${bad.length ? 'FAIL' : 'PASS'} (${checks.length - bad.length}/${checks.length} checks${bad.length ? '; red: ' + bad.map((c) => c.name.split(':')[0]).join(', ') : ''})`);
process.exitCode = bad.length ? 1 : 0;
