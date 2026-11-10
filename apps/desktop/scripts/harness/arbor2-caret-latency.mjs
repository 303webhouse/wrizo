// ARBOR2-CARET-LATENCY - THE LIGHT PAGE'S DRAWN CARET UNDER L (Fable, Nov 9, 10:10 pm: "the drawn caret under L and rhizome-latency on the box";
// required before Arbor ships). The light page's edged caret (spec §19.2, NICK RULED Nov 9; src/arbor2/edgedCaret.tsx) is drawn over the native one
// and follows it: one React update (and one small element) per key. This file holds that it adds no keystroke latency beyond the control's own spread,
// by flux3-latency's method (INK's L): the same page, arms interleaved in rounds (the order rotating; one discarded warm-up), each re-seeded to the same
// text through the app's seam, at 1920x1080, Arbor (?arbor2=1), the room pinned to day (&arbor2room=day), Page: Light, in Draft (Typewriter off):
//   C  the control: the same page with the drawn caret off (&arbor2caret=off, the flag's test-only caret pin) - r22's native caret, as before the build.
//   T  the drawn caret on (as built).
//   M  the MUTANT: T plus a 12 ms busy wait on every selectionchange (a caret that costs a frame's worth per key). It must FAIL L.
// Keys: one character every ~90 ms; each key's latency read IN the page as rhizome-latency reads it (keydown -> the second animation frame after its
// `beforeinput`; this editor never fires `input` on a key).
// VERDICTS (judged against the control's OWN spread: the range of its per-round medians and per-round p95s across the rounds):
//   L      T's pooled median <= C's pooled median + C's median spread, T's pooled p95 <= C's pooled p95 + C's p95 spread, and no T key over 100 ms.
//   MUT    the mutant fails L; its premise is asserted (its busy wait ran on the keys).
//   Premises: P1 every arm stood where it claims (theme, flag, room, page, pin, the drawn caret present in T and M and absent in C, the native caret
//   hidden only where it is drawn); P2 the same surface in every arm (Draft, Typewriter off); P3 the drawn caret really followed the keys in T (a new
//   caret element per move, >= 80% of the keys); P5 >= 40 keys painted per arm-round; P6 every typed key reached the stored page.
//   B  the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src.
// CARET_ROUNDS=<n> (default 4). A box turn: this is a timing file.
// Run: node scripts/harness/arbor2-caret-latency.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ROUNDS = Math.max(3, Number(process.env.CARET_ROUNDS || 4));
const KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100, SPIN_MS = 12;
const VIEW = [1920, 1080];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

function buildIdentity() {
  const out = { bundle: null, builtAt: null, head: null, srcCommitAt: null, dirtySrc: null, stale: null };
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = html.match(/assets\/(index-[\w-]+\.js)/);
    out.bundle = m ? m[1] : null;
    out.builtAt = fs.statSync(path.join(DIST, 'index.html')).mtime.toISOString();
  } catch { /* no bundle: withHarness refuses on its own */ }
  try {
    const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    out.head = git('rev-parse', '--short=8', 'HEAD');
    out.srcCommitAt = new Date(Number(git('log', '-1', '--format=%ct', '--', 'apps/desktop/src')) * 1000).toISOString();
    out.dirtySrc = git('status', '--porcelain', '--', 'apps/desktop/src').split('\n').filter(Boolean).length;
    out.stale = out.builtAt ? Date.parse(out.builtAt) < Date.parse(out.srcCommitAt) : null;
  } catch { /* git unavailable: reported as null, and B fails on it */ }
  return out;
}
const BUILD = buildIdentity();
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale}`);

const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const show = (st) => JSON.stringify({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
// the verdict, one pure function, for T and for the mutant alike (flux3-latency's judge, its L half)
function judge(cRounds, xRounds) {
  const cMeds = cRounds.map((r) => stat(r.lat).median), cP95s = cRounds.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(cRounds.flatMap((r) => r.lat)), X = stat(xRounds.flatMap((r) => r.lat));
  const enough = X.n >= MIN_KEYS * xRounds.length && C.n >= MIN_KEYS * cRounds.length;
  const lat = enough && X.median <= C.median + spreadMed && X.p95 <= C.p95 + spreadP95 && X.max <= MAX_MS;
  return { lat, C, X, spreadMed, spreadP95, enough };
}

const SEED = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the caret keeps its edge while she writes on ';
const ARMS = { C: { off: true, spin: false }, T: { off: false, spin: false }, M: { off: false, spin: true } };
const PREFS = JSON.stringify({ voice: 'serif', page: 'light', fade: 'on' });

try { await withHarness(async (app) => {
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await app.evalJs(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };

  // one page, made in Arbor's theme through the app's own door
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(PREFS)});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await splashGone();
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');

  let cursor = 0;
  const runArm = async (name, round) => {
    const arm = ARMS[name];
    // off the page (the Desk has no flush handler), re-seed through the seam (it flushes before it returns), then the URL for this arm
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: ${JSON.stringify(SEED)} })`);
    await app.evalJs(`localStorage.setItem('wrizo-theme', 'plateau'); localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(PREFS)});`);
    await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(`/?arbor2=1&arbor2room=day${arm.off ? '&arbor2caret=off' : ''}`)} + '#/page/' + ${JSON.stringify(pageId)})`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'page after reload' }).catch(() => {});
    await splashGone();
    await app.evalJs("document.querySelector('[data-mode-key=\"draft\"]')?.click()");
    await app.waitFor("document.querySelector('[data-mode-key=\"draft\"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')", { timeout: 6000, label: 'Draft' }).catch(() => {});
    await sleep(1300); // the mode switch's own re-persist lands ~1.1 s after it
    // the caret at the words' end, as a writer clicking there would leave it
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await sleep(400);
    if (arm.spin) await app.evalJs(`(() => { window.__spun = 0; document.addEventListener('selectionchange', () => { const t = performance.now() + ${SPIN_MS}; while (performance.now() < t) { /* the mutant's cost */ } window.__spun += 1; }); return true; })()`);
    // a new caret element per move (it is keyed on its place): counted while the keys land
    await app.evalJs("(() => { window.__carets = 0; if (window.__caretMo) window.__caretMo.disconnect(); window.__caretMo = new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('arbor2-edged-caret')) window.__carets += 1; }); window.__caretMo.observe(document.body, { childList: true, subtree: true }); return true; })()");
    const where = await app.evalJs(`(() => { const root = document.documentElement, tab = document.querySelector('[data-mode-key][aria-selected="true"]'), tw = document.querySelector('.mode-scroll[data-typewriter]'), ed = document.querySelector('.forward-only-editor');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s)); const sp = new URLSearchParams(location.search);
      return { theme: root.getAttribute('data-theme'), page: root.getAttribute('data-page'), room: root.getAttribute('data-arbor2-room'), flag: sp.get('arbor2'), pin: sp.get('arbor2caret'),
        mode: tab ? tab.getAttribute('data-mode-key') : null, typewriter: tw ? tw.getAttribute('data-typewriter') : null, zoom: !!document.querySelector('.mode-pagecol[data-zoom="true"]'),
        drawn: !!document.querySelector('.arbor2-edged-caret'), native: ed ? getComputedStyle(ed).caretColor : null, served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null }; })()`);
    // the meter (rhizome-latency's, verbatim in method)
    await app.evalJs(`(() => {
      window.__lat = []; let t0 = 0;
      if (window.__latOff) window.__latOff();
      const kd = () => { t0 = performance.now(); };
      const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { const now = performance.now(); window.__lat.push({ ms: now - t, key: t, at: now }); })); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); };
      return true; })()`);
    let typed = '';
    for (let i = 0; i < KEYS; i += 1) { const ch = CYCLE[cursor % CYCLE.length]; cursor += 1; typed += ch; await app.typeKeys(ch); await sleep(GAP); }
    await sleep(250);
    const got = await app.evalJs("({ lat: window.__lat.map((x) => x.ms), carets: window.__carets || 0, spun: window.__spun || 0, drawnAfter: !!document.querySelector('.arbor2-edged-caret') })");
    // every typed key reached the stored page (read after the debounced save lands: wait on the STORED value)
    const nonWs = (s) => String(s || '').replace(/\s+/g, '').length;
    const want = nonWs(SEED) + nonWs(typed);
    const storedExpr = `((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(pageId)}) || {}).text || '')`;
    let saved = false;
    try { await app.waitFor(`${storedExpr}.replace(/\\s+/g, '').length === ${want}`, { timeout: 8000, label: 'typed text saved' }); saved = true; } catch { saved = false; }
    const storedLen = await app.evalJs(`${storedExpr}.replace(/\\s+/g, '').length`);
    return { name, round, where, ...got, saved, storedLen, want };
  };

  await runArm('C', 0);   // warm-up, discarded
  const order = ['C', 'T', 'M'];
  const res = { C: [], T: [], M: [] };
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = order.slice((round - 1) % order.length).concat(order.slice(0, (round - 1) % order.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }
  const all = [...res.C, ...res.T, ...res.M];

  // ---- premises
  const transparent = (s) => /rgba\(0, 0, 0, 0\)|transparent/.test(String(s));
  const placed = all.filter((r) => {
    const a = ARMS[r.name], w = r.where;
    return w.theme === 'plateau' && w.page !== 'dark' && w.room === 'day' && w.flag === '1' && (a.off ? w.pin === 'off' : w.pin === null)
      && (a.off ? !w.drawn && !transparent(w.native) && !r.drawnAfter : w.drawn && transparent(w.native) && r.drawnAfter);
  });
  ok(`P1 every arm stood where it claims (Arbor, ?arbor2=1, the day room, Page: Light; C: the pin on, no drawn caret, the native one shown; T and M: the drawn caret, the native one hidden): ${placed.length}/${all.length}`,
    placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 2).map((r) => ({ arm: r.name, round: r.round, where: r.where, drawnAfter: r.drawnAfter }))));
  const modes = new Set(all.map((r) => `${r.where.mode}/${r.where.typewriter}/${r.where.zoom}`));
  ok(`P2 the same surface in every arm (mode/typewriter/zoom: ${[...modes].join(' ')}): Draft, the Typewriter off`, modes.size === 1 && [...modes][0] === 'draft/false/false', JSON.stringify([...modes]));
  const followed = [...res.T, ...res.M].filter((r) => r.carets >= 0.8 * KEYS), noneInC = res.C.every((r) => r.carets === 0);
  ok(`P3 the drawn caret followed the keys in T and M (a new caret element on >= 80% of the ${KEYS} keys, every round) and never appeared in C`, followed.length === res.T.length + res.M.length && noneInC,
    JSON.stringify(all.map((r) => ({ arm: r.name, round: r.round, carets: r.carets }))));
  const thin = all.filter((r) => r.lat.length < MIN_KEYS);
  ok(`P5 at least ${MIN_KEYS} keys painted in every arm-round (${KEYS} typed each)`, thin.length === 0, JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round, n: r.lat.length }))));
  const lost = all.filter((r) => !r.saved);
  ok('P6 no key was dropped: in every arm-round the stored page holds the seed plus every typed character', lost.length === 0, JSON.stringify(lost.map((r) => ({ arm: r.name, round: r.round, stored: r.storedLen, want: r.want }))));

  // ---- the verdicts
  const cRounds = res.C.map((r) => `${r1(stat(r.lat).median)}/${r1(stat(r.lat).p95)}`).join(' ');
  const t = judge(res.C, res.T);
  ok(`L typing on Arbor's light page with the drawn caret adds no latency beyond the control's own spread: T median ${r1(t.X.median)} <= C ${r1(t.C.median)} + ${r1(t.spreadMed)}, T p95 ${r1(t.X.p95)} <= C ${r1(t.C.p95)} + ${r1(t.spreadP95)}, no T key over ${MAX_MS} ms`,
    t.lat, `C ${show(t.C)} | T ${show(t.X)} | C per round median/p95 ${cRounds}`);
  const m = judge(res.C, res.M);
  const mLanded = res.M.length > 0 && res.M.every((r) => r.spun >= 0.8 * KEYS);
  ok(`MUT premise: the mutant landed - its ${SPIN_MS} ms busy wait ran on >= 80% of the keys, every round`, mLanded, JSON.stringify(res.M.map((r) => ({ round: r.round, spun: r.spun }))));
  ok(`MUT the costly-caret mutant FAILS L - M median ${r1(m.X.median)} p95 ${r1(m.X.p95)} max ${r1(m.X.max)}`, mLanded && !m.lat, `C ${show(m.C)} | M ${show(m.X)}`);
  ok(`SPLIT (information) median/p95 ms: C native ${r1(t.C.median)}/${r1(t.C.p95)} | T drawn ${r1(t.X.median)}/${r1(t.X.p95)} | M drawn + ${SPIN_MS} ms ${r1(m.X.median)}/${r1(m.X.p95)}`, true, '');

  // ---- the build
  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served.size === 1 && served.has(BUILD.bundle) && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nARBOR2-CARET-LATENCY VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nARBOR2-CARET-LATENCY VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
