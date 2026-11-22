// BUG #44 - THE RHIZOME RE-PLANS ITS WHOLE DRAWING WHEN THE CHROME RECEDES OR RETURNS (Fable, Nov 22 9:35 am: "plan from seed + words in page units;
// red: the plan's hash unchanged across a recede and return").
//
// The fixture (seams for the page and the goal; the writing settings' own key for the rhizome style, as rhizome-latency.mjs sets it): Arbor as it
// ships (WS_ARBOR2=default), by day, 1400x900; a loose page of 5 words with a word goal of 10, the progress drawn as the rhizome.
// A round: the drawing at rest (H0); she types 12 letters inside the last word - no word is added, so the goal's count and the plan have no reason to
// change - and the chrome recedes (H1, read while it is receded); she stops and the chrome returns (H2).
// The drawing's HASH is the geometry of everything the field draws - every path's d and every line's end points, in the order drawn - never a
// transform, an opacity or an animated dash, so placing or fading the drawing does not move it; re-planning it does.
//
// PREMISE R0  the chrome receded while she typed and returned after, and the page's word count stayed 5 (the plan's inputs did not change)
// PLAN    R1  the drawing's hash is the same at rest, while the chrome is receded, and after it returns
//         MUT-R1  the same three readings with the receded one re-planned (another hash) turn R1's test red
//
// Run (repo root; a box turn, or the Actions harness): node apps/desktop/scripts/harness/bug44-rhizome-recede.mjs
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = JSON.stringify;
// the drawing's geometry, hashed (FNV-1a) in the order drawn
const HASH = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const parts = [];
  for (const e of f.querySelectorAll('path, line, polyline')) { if (e.closest('clipPath, mask, defs')) continue;
    parts.push(e.tagName === 'line' ? ['L', e.getAttribute('x1'), e.getAttribute('y1'), e.getAttribute('x2'), e.getAttribute('y2')].join(',') : e.tagName === 'polyline' ? 'P' + e.getAttribute('points') : 'D' + e.getAttribute('d')); }
  const s = parts.join('|'); let h = 0x811c9dc5; for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  const bar = document.querySelector('.chrome-top.sprint-nav'); const br = bar ? bar.getBoundingClientRect() : null;
  return { hash: h.toString(16), n: parts.length, len: s.length, writing: document.documentElement.getAttribute('data-wz-writing'), barTop: br ? Math.round(br.top * 10) / 10 : null }; })()`;
const WORDS = "(document.querySelector('.forward-only-editor')?.innerText || '').trim().split(/\\s+/).filter(Boolean).length";
const r1 = (a, b, c) => !!a && !!b && !!c && a.n > 0 && a.hash === b.hash && b.hash === c.hash;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoSetWritingGoal === 'function'", { label: 'seams', timeout: 20000 }).catch(() => {});
  const id = 'b44-page';
  await app.evalJs(`(() => { const W = window; W.wrizoSetWritingGoal({ n: 10, unit: 'words' });
    W.wrizoCreateJournalPage({ id: ${J(id)}, text: 'word0 word1 word2 word3 word4', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' });
    if (W.wrizoFlushNow) W.wrizoFlushNow();
    localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }));
    localStorage.setItem('wrizo-theme', 'plateau'); return true; })()`);
  await app.evalJs("history.replaceState(null, '', '/?arbor2room=day#/'); null");
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${J(id)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-rhizome-field')", { label: 'the page and its rhizome', timeout: 20000 }).catch(() => {});
  await app.mouseMove(700, 860); await sleep(2500);   // the growth settled
  const w0 = await app.evalJs(WORDS);
  const h0 = await app.evalJs(HASH);
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const s = getSelection(); const rg = document.createRange(); rg.selectNodeContents(e); rg.collapse(false); s.removeAllRanges(); s.addRange(rg); return true; })()");
  for (let i = 0; i < 12; i += 1) { await app.typeKeys('a'); await sleep(80); }
  await app.waitFor("document.documentElement.getAttribute('data-wz-writing') === 'true'", { label: 'the chrome receded', timeout: 4000 }).catch(() => {});
  await sleep(500);
  const h1 = await app.evalJs(HASH);
  await app.waitFor("document.documentElement.getAttribute('data-wz-writing') !== 'true'", { label: 'the chrome returned', timeout: 15000 }).catch(() => {});
  await sleep(1200);
  const h2 = await app.evalJs(HASH);
  const w2 = await app.evalJs(WORDS);
  ok('R0 the chrome receded while she typed and returned after, and the page\'s word count stayed 5', !!h1 && h1.writing === 'true' && !!h2 && h2.writing !== 'true' && w0 === 5 && w2 === 5, { w0, w2, writing: [h0 && h0.writing, h1 && h1.writing, h2 && h2.writing] });
  ok('R1 the drawing\'s hash is the same at rest, while the chrome is receded, and after it returns', r1(h0, h1, h2), { h0, h1, h2 });
  const replanned = h1 ? { ...h1, hash: (h1.hash + '0').slice(1) === h1.hash ? 'x' + h1.hash : h1.hash + 'x' } : null;
  ok('MUT-R1 the same readings with the receded one re-planned (another hash) turn R1\'s test red', !!replanned && !r1(h0, replanned, h2), { receded: replanned && replanned.hash });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass && !/^R1/.test(c.name) ? '' : '\n     ' + String(c.detail).slice(0, 2000)}`);
const EXPECTED = 3;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nBUG44-RHIZOME-RECEDE VERIFY: PASS (${checks.length} checks)` : `\nBUG44-RHIZOME-RECEDE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
