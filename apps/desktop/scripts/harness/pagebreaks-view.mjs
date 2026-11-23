// #114 - THE SLOW SPACE: drawMarks DRAWS ONLY THE BREAKS IN OR NEAR THE VIEW (Fable, Nov 23, 3:35 pm: "GO"). MEASURED by space-enter-cost.mjs on main (runs 45277959118 / 45278790480): a Space at 50,000 words has a key-to-frame median of 414 ms
// (a letter 49 ms, an Enter 70), and the browser's own profile names the cost: store/pageMarks.ts drawMarks, called from usePageBreaks' 150 ms scroll timer (the caret reveal that follows a Space scrolls), resolves a DOM point for EVERY page break
// (cleanPoint -> rowsDomPoint, one tree walk each: hundreds of walks at 50,000 words, 74 ms a key) to draw marks of which two are in view.
//   PV1  at 50,000 words (many breaks) the marks layer holds a handful of pairs, never one for every break: at most 12
//   PV2  the breaks nearest the caret (the page's end) HAVE their pairs: a mark in view is never dropped
//   PV3  a Space costs no more than a letter plus 60 ms (key-to-frame median over 12, at 50,000 words); main: 414 against 49
//   PV4  scroll to the top and rest: the pairs follow the view (the first breaks are drawn, the last are not), still at most 12
//   PV5  at a few breaks (a 1,000-word page) every break still has its pair, as ever
//   MUT  the PV1 judge goes RED on a layer with a pair for every break (the observation the old code made)
// Run: harness.yml files=pagebreaks-view.mjs (Actions or the box). Seeding goes through the window.wrizo* seams.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 500) : ''}`); };
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join(String.fromCharCode(10)); };
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const MAX_PAIRS = 12;
const judgeFew = (pairs) => pairs <= MAX_PAIRS;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const open = async (words) => {
    const id = `pbv-${words}-${Date.now()}-${seq += 1}`;
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
  const read = () => ev(`(() => { const ed = document.querySelector('.mode-scroll .forward-only-editor') || document.querySelector('.forward-only-editor'); const layer = ed && ed.parentElement && ed.parentElement.querySelector(':scope > .wz-pb-marks');
    const list = window.wrizoPageBreaks ? window.wrizoPageBreaks() : { breaks: [] };
    return { breaks: list.breaks, pairs: layer ? [...layer.querySelectorAll('.wz-pb-pair')].map((p) => +p.getAttribute('data-at')) : [] }; })()`);
  const rest = () => sleep(900);   // the 400 ms pause and the 150 ms scroll rest, with room

  // ---- 50,000 words ----
  await open(50000);
  await app.typeKeys(' x'); await rest();
  const end = await read();
  ok(`PV1 at 50,000 words (${end.breaks.length} breaks) the marks layer holds at most ${MAX_PAIRS} pairs, not one for every break`, end.breaks.length >= 100 && judgeFew(end.pairs.length), JSON.stringify({ breaks: end.breaks.length, pairs: end.pairs.length }));
  const lastTwo = end.breaks.slice(-2);
  ok('PV2 the breaks nearest the caret (the end of the page) have their pairs', lastTwo.length === 2 && lastTwo.every((b) => end.pairs.includes(b)), JSON.stringify({ lastTwo, pairs: end.pairs.slice(-4) }));
  const AFTER = "new Promise((res) => { const t0 = performance.now(); requestAnimationFrame(() => setTimeout(() => res(performance.now() - t0), 0)); })";
  const cost = { letter: [], space: [] };
  for (let round = 0; round < 12; round += 1) {
    for (const [kind, ch] of [['letter', 'a'], ['letter', 'b'], ['space', ' ']]) {
      await app.typeKeys(ch);
      const dt = await ev(AFTER);
      cost[kind].push(dt);
      await sleep(220);   // past the 150 ms scroll timer, as a writer's next key is
    }
  }
  const med = { letter: q(cost.letter, 0.5), space: q(cost.space, 0.5) };
  ok('PV3 a Space costs no more than a letter plus 60 ms at 50,000 words (key-to-frame median over 12)', med.space <= med.letter + 60, JSON.stringify({ letterMs: Math.round(med.letter), spaceMs: Math.round(med.space) }));
  await rest();
  await ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = 0; sc.dispatchEvent(new Event('scroll')); return true; })()");
  await rest(); await rest();
  const top = await read();
  const firstTwo = top.breaks.slice(0, 2), lastOne = top.breaks[top.breaks.length - 1];
  ok('PV4 scrolled to the top and at rest: the first breaks are drawn, the last is not, still at most 12 pairs', firstTwo.every((b) => top.pairs.includes(b)) && !top.pairs.includes(lastOne) && judgeFew(top.pairs.length), JSON.stringify({ firstTwo, lastOne, pairs: top.pairs.length }));

  // ---- a short page: nothing is dropped ----
  await open(1000);
  await app.typeKeys(' x'); await rest();
  const small = await read();
  ok(`PV5 at ${small.breaks.length} breaks (1,000 words) every break has its pair`, small.breaks.length >= 1 && small.breaks.every((b) => small.pairs.includes(b)), JSON.stringify({ breaks: small.breaks.length, pairs: small.pairs.length }));

  ok('MUT-PV1 the PV1 judge goes RED on a layer with a pair for every break (what the old code drew)', judgeFew(end.breaks.length) === false);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nPAGEBREAKS-VIEW VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nPAGEBREAKS-VIEW VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
