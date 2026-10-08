// B10.1 — the LIVE WALK on the 177-row rig. Needs a box turn (withHarness refuses without WS_BOX_TURN). A LOCAL rig only.
//
// WHY THIS LIVES IN scripts/evidence/ AND NOT scripts/harness/: run-suite runs every file in scripts/harness/, and this one needs a rig
// that is not part of the suite (a real server + Postgres + a seeded account), exactly like the guest walk. Run with its own grant.
// The browserless proof (scripts/harness/b101.mjs) carries the rules; this carries the same claims through a real browser, a real
// server and a real 177-page account.
//
// THE RIG (all local, none of it production):
//   a throwaway Postgres  ->  the defence branch's own server  ->  a same-origin FRONT that serves the defence build at /, the
//   pre-redesign OLD client at /old.html, and can say "a deploy happened" (GET /__build?override=<build> makes every /api/sync
//   reply and /healthz report that build; GET /__build?override= puts it back).
//   Account: an existing returning writer with 177 pages (seeded through the app's own seams by the rig's seed script).
//
// CLAIMS WALKED
//   2  THE LANDING WAITS      a returning writer signing in lands ON THEIR NEWEST PAGE, not a blank one - on a fresh device and again
//                             after a sign-out; and a pull that never answers is capped, lands on a new page and is NOT first run.
//   3  FIRST RUN PER ACCOUNT  no gate for the returning account on a device that has never seen it (flag unset); a successful REGISTER
//                             on a device whose flag is already set DOES get the gate.
//   1  THE STALE GUARD        the server reports a different build -> the banner, the page unmoved and inert, a held write that Reload
//                             then carries across (the new load pushes it to the account); and after the reload the banner is gone.
//
// Run: WS_TARGET_URL=http://127.0.0.1:3121 WALK_EMAIL=nicklike@example.com WALK_PASSWORD=... FRONT=http://127.0.0.1:3121 \
//        WS_BOX_TURN=<token> node scripts/evidence/b101-walk.mjs   (from apps/desktop)
import { withHarness } from '../runtime-verify.mjs';

{
  const target = process.env.WS_TARGET_URL || '';
  let host = '';
  try { host = new URL(target).hostname; } catch { /* handled below */ }
  if (!target || (host !== '127.0.0.1' && host !== 'localhost')) {
    console.error('b101-walk needs WS_TARGET_URL set to the LOCAL rig front (http://127.0.0.1:<port>); got: ' + (target || '(unset)'));
    process.exit(2);
  }
}
const EMAIL = process.env.WALK_EMAIL, PASSWORD = process.env.WALK_PASSWORD || 'a-long-enough-password';
if (!EMAIL) { console.error('b101-walk needs WALK_EMAIL (the seeded returning account).'); process.exit(2); }
const BASE = process.env.WS_TARGET_URL.replace(/\/+$/, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T0 = Date.now();
const checks = [];
const ok = (name, pass, detail = '') => {
  checks.push({ name, pass, detail });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : ' | ' + String(detail).slice(0, 300)));
};
const say = (s) => console.log(`${String(Date.now() - T0).padStart(6)}ms ${s}`);
const setBuild = (b) => fetch(`${BASE}/__build?override=${encodeURIComponent(b)}`).then((r) => r.json());

const COUNT = `(() => { try { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); return e.filter((x) => !x.deletedAt && x.pageType !== 'board').length; } catch (e) { return -1; } })()`;
const SNAP = `JSON.stringify({ hash: location.hash, pages: ${COUNT}, flag: localStorage.getItem('wrizo-first-run-complete'), gate: !!document.querySelector('.hb1-gate-banner'), loading: !!document.querySelector('.wz-arrival-loading'), usr: (history.state && history.state.usr) || null, email: !!document.querySelector('input[type=email]') })`;

await setBuild('');   // start from the server's own build

await withHarness(async (app) => {
  const snap = async () => { try { return JSON.parse(await app.evalJs(SNAP)); } catch (e) { return { err: String(e).slice(0, 80) }; } };
  const exists = (sel) => app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
  const arrival = () => app.waitFor(`!!document.querySelector('.wz-arrival')`, { timeout: 25000, label: 'Arrival mounted' });
  async function signIn(email) {
    if (!(await exists('input[type=email]'))) { try { await app.click('Sign in'); } catch (e) { say('no Sign in control: ' + String(e).slice(0, 100)); } }
    await app.waitFor(`!!document.querySelector('input[type=email]')`, { timeout: 8000, label: 'email field' }).catch(() => {});
    await app.evalJs(`document.querySelector('input[type=email]').focus(); true;`);
    await app.typeKeys(email); await app.key('Tab'); await app.typeKeys(PASSWORD);
    await app.evalJs(`window.__signinAt = Date.now(); true;`);
    await app.typeKeys('\n');
  }
  // After a sign-in: sample every 60 ms for up to `ms`, returning what the writer SAW (loading line, first non-door hash) and where it settled.
  async function watchLanding(ms = 9000) {
    const seen = { loading: false, firstHash: null, samples: 0 };
    const t = Date.now(); let last = null;
    while (Date.now() - t < ms) {
      last = await snap(); seen.samples += 1;
      if (last.loading) seen.loading = true;
      if (seen.firstHash === null && last.hash && last.hash !== '#/' && last.hash !== '') seen.firstHash = last.hash;
      if (seen.firstHash && Date.now() - t > 1800) break;
      await sleep(60);
    }
    return { seen, last, ms: Date.now() - t };
  }
  async function signOut() {
    // On a framed page the corner cluster is collapsed behind one glyph; open it first if Sign out is not showing.
    try { await app.click('Sign out'); } catch (e) {
      try { await app.click('\u22EF'); await sleep(250); await app.click('Sign out'); } catch (e2) { say('no Sign out control: ' + String(e2).slice(0, 100)); }
    }
    await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { timeout: 15000, label: 'signed-out screen' }).catch(() => say('signed-out screen never appeared'));
  }
  const resumeRoute = () => app.evalJs(`(() => { try { const r = window.wrizoResume && window.wrizoResume(); return r ? r.route : null; } catch (e) { return 'ERR ' + e; } })()`);

  await app.goto('/');
  await arrival();
  await sleep(600);
  say('boot: ' + JSON.stringify(await snap()) + ' innerWidth=' + (await app.evalJs('innerWidth')));

  // ---- W1: the returning writer, on a device that has never seen this account (flag unset) ---------------------------------------
  await signIn(EMAIL);
  const w1 = await watchLanding();
  const w1Resume = await resumeRoute();
  say('W1 landing: ' + JSON.stringify({ seen: w1.seen, last: w1.last, resume: w1Resume }));
  const isRealSurface = (h) => /^#\/(page|project)\/(?!new\b)[^/?]+/.test(h || '');
  ok('(W1a) a returning writer\'s sign-in lands on the account\'s MOST RECENT SURFACE (the resume target - a page or a project), never the blank /page/new',
    isRealSurface(w1.last.hash) && w1.last.hash === '#' + w1Resume, JSON.stringify({ hash: w1.last.hash, resume: w1Resume }));
  ok('(W1b) the 177 pages had arrived by then', w1.last.pages >= 177, String(w1.last.pages));
  ok('(W1c) FIRST RUN PER ACCOUNT: no gate for this account on a device whose flag was unset (a resumed landing never asks the question)',
    w1.last.gate === false && !(w1.last.usr && w1.last.usr.firstRunGate), JSON.stringify({ gate: w1.last.gate, flag: w1.last.flag, usr: w1.last.usr }));
  // ...and the question itself, asked the way a writer asks it on that same fresh device: the Write door. The account holds work, so no gate,
  // and the flag is set so it cannot come back.
  await app.goto('/');
  await arrival();
  await sleep(500);
  try { await app.click('Write'); } catch (e) { say('no Write door: ' + String(e).slice(0, 100)); }
  const w1w = await watchLanding(6000);
  say('W1 Write door: ' + JSON.stringify(w1w.last));
  ok('(W1d) the WRITE door on a device that has never seen this account: no gate (the account has work), and the flag is set so it never returns',
    w1w.last.gate === false && !(w1w.last.usr && w1w.last.usr.firstRunGate) && w1w.last.flag === '1', JSON.stringify({ gate: w1w.last.gate, flag: w1w.last.flag, usr: w1w.last.usr, hash: w1w.last.hash }));

  // ---- W2: sign out, sign in again (the very sequence of the incident) --------------------------------------------------------
  await signOut();
  const outSnap = await snap();
  ok('(W2a) signed out: the cache is wiped and the device shows the sign-in screen', outSnap.pages === 0 && outSnap.email === true, JSON.stringify(outSnap));
  await signIn(EMAIL);
  const w2 = await watchLanding();
  const w2Resume = await resumeRoute();
  say('W2 landing: ' + JSON.stringify({ seen: w2.seen, last: w2.last, resume: w2Resume }));
  ok('(W2b) the second sign-in lands on the resume target too (the blank-page landing of the incident is gone)',
    isRealSurface(w2.last.hash) && w2.last.hash === '#' + w2Resume && w2.last.pages >= 177, JSON.stringify({ hash: w2.last.hash, resume: w2Resume, pages: w2.last.pages }));
  ok('(W2c) and still no gate', w2.last.gate === false && !(w2.last.usr && w2.last.usr.firstRunGate), JSON.stringify(w2.last));
  say('the quiet loading line was ' + (w1.seen.loading || w2.seen.loading ? 'SEEN' : 'not caught (the pull is fast on the rig)') + ' during a sign-in');

  // ---- W3: a pull that never answers is CAPPED: a new page, and NOT first run ----------------------------------------------------
  await signOut();
  // firstRun.ts holds the flag in a MODULE variable: removing the key is not enough, only a reload makes the app read it again.
  await app.evalJs(`localStorage.removeItem('wrizo-first-run-complete'); true;`);
  await app.reload();
  await arrival();
  await sleep(800);
  await app.evalJs(`const f = window.fetch.bind(window); window.fetch = (u, o) => (String(u).includes('/api/sync') ? new Promise(() => {}) : f(u, o)); true;`);
  const tCap = Date.now();
  await signIn(EMAIL);
  const w3 = await watchLanding(9000);
  const w3ms = Date.now() - tCap;
  say('W3 landing: ' + JSON.stringify({ seen: w3.seen, last: w3.last, ms: w3ms }));
  ok('(W3a) with the first pull stalled, the landing gives up at its cap (about 3 s) rather than hanging, and shows the quiet loading line meanwhile',
    w3.seen.firstHash !== null && w3ms >= 2500 && w3ms <= 9000 && w3.seen.loading === true, JSON.stringify({ ms: w3ms, seen: w3.seen }));
  ok('(W3b) a capped pull is NOT first run: no gate, and the flag was not set by guesswork', w3.last.gate === false && w3.last.flag !== '1' && !(w3.last.usr && w3.last.usr.firstRunGate), JSON.stringify(w3.last));
  await app.reload();      // drops the stalled fetch; the session cookie survives
  await app.goto('/');
  await arrival();
  await sleep(1500);
  await signOut();

  // ---- W4: a successful REGISTER on a device whose flag is already set DOES get the first-run gate --------------------------------
  await app.evalJs(`localStorage.setItem('wrizo-first-run-complete', '1'); true;`);
  await app.reload();                    // so the app itself believes this device has had its first run
  await arrival();
  await sleep(800);
  say('W4 device: flag=' + (await app.evalJs(`localStorage.getItem('wrizo-first-run-complete')`)));
  const fresh = `b101-walk-${Date.now()}@example.com`;
  try { await app.click('New here? Create an account'); } catch (e) { say('no create-account link: ' + String(e).slice(0, 100)); }
  await app.waitFor(`document.querySelectorAll('.wz-screen input.wz-field').length >= 4`, { timeout: 8000, label: 'register form' }).catch(() => say('register form not shown'));
  await app.evalJs(`document.querySelectorAll('.wz-screen input.wz-field')[0].focus(); true;`);
  await app.typeKeys('Walk Writer'); await app.key('Tab'); await app.typeKeys(fresh); await app.key('Tab'); await app.typeKeys(PASSWORD); await app.key('Tab'); await app.typeKeys('b101');
  await app.typeKeys('\n');
  const w4 = await watchLanding(9000);
  say('W4 landing: ' + JSON.stringify({ seen: w4.seen, last: w4.last }));
  ok('(W4a) a new account on a USED device (flag already set) gets the first-run gate: the founding page is opened with the gate request',
    !!(w4.last.usr && w4.last.usr.firstRunGate) || w4.last.gate === true, JSON.stringify({ usr: w4.last.usr, gate: w4.last.gate, flag: w4.last.flag }));

  // ---- W5: THE STALE GUARD, live --------------------------------------------------------------------------------------------------
  await signOut();
  await signIn(EMAIL);
  const w5land = await watchLanding();
  say('W5 start: ' + JSON.stringify(w5land.last));
  // The resume target may be a PROJECT page, which has no single writing surface to measure. Open a real loose page (made through the app's own
  // seam) so there is an editor whose rect can be compared before and after the banner.
  const w5page = await app.evalJs(`window.wrizoCreateJournalPage({ text: 'a page to hold still' }).id`);
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(w5page)}; true;`);
  await sleep(1800);
  const edSel = await app.evalJs(`['.forward-only-editor', '[contenteditable="true"]', 'textarea', 'main'].find((s) => document.querySelector(s)) || null`);
  const rectOf = () => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(edSel)}); if (!el) return null; const r = el.getBoundingClientRect(); return JSON.stringify([r.x, r.y, r.width, r.height].map((n) => Math.round(n * 2) / 2)); })()`);
  const rectBefore = await rectOf();
  ok('(W5a) before any deploy there is no banner and the tab is live (root not inert)', !(await exists('.wz-stale-banner')) && !(await app.evalJs(`document.getElementById('root').hasAttribute('inert')`)), '');
  await setBuild('index-DEPLOYEDLATER');
  await app.evalJs(`document.dispatchEvent(new Event('visibilitychange')); true;`);       // the tab is looked at again -> a sync -> the news
  await app.waitFor(`!!document.querySelector('.wz-stale-banner')`, { timeout: 8000, label: 'stale banner' }).catch(() => {});
  const banner = await app.evalJs(`(() => { const b = document.querySelector('.wz-stale-banner'); return b ? JSON.stringify({ text: b.textContent, btn: !!b.querySelector('button'), inert: document.getElementById('root').hasAttribute('inert'), parentIsBody: b.parentElement === document.body }) : null; })()`);
  say('W5 banner: ' + banner + ' editor=' + edSel);
  const rectAfter = await rectOf();
  const b = banner ? JSON.parse(banner) : {};
  ok('(W5b) the banner reads "Wrizo updated, reload" with a Reload button, outside the app root, and the root is inert', /Wrizo updated, reload/.test(b.text || '') && b.btn === true && b.parentIsBody === true && b.inert === true, banner || 'no banner');
  ok('(W5c) PAGE IS PRIMARY: the writing surface (found, not null) did not move or resize - same rect before and after the banner', edSel !== null && rectBefore !== null && rectBefore === rectAfter, JSON.stringify({ edSel, rectBefore, rectAfter }));
  // READ-ONLY: a write made now is held; storage does not gain it.
  const heldId = await app.evalJs(`(() => { const p = window.wrizoCreateJournalPage({ text: 'typed in a stale tab, rescued by Reload' }); return p.id; })()`);
  await sleep(900);
  const storedWhileStale = await app.evalJs(`(localStorage.getItem('writer-studio-journal-entries') || '').includes(${JSON.stringify(heldId)})`);
  ok('(W5d) READ-ONLY: a page made in the stale tab is HELD - it does not reach localStorage (it cannot clobber the live tab)', storedWhileStale === false, String(storedWhileStale));
  // the deploy "finishes": the server now reports the build the reloaded page will actually be
  await setBuild('');
  await app.evalJs(`[...document.querySelectorAll('.wz-stale-banner button')][0].click(); true;`);
  await sleep(1500);
  await app.waitFor(`document.readyState === 'complete'`, { timeout: 15000, label: 'reloaded' }).catch(() => {});
  await arrival().catch(() => {});
  await sleep(2500);
  const afterReload = await snap();
  ok('(W5e) after Reload the banner is gone and the tab is live again', !(await exists('.wz-stale-banner')) && !(await app.evalJs(`document.getElementById('root').hasAttribute('inert')`)), JSON.stringify(afterReload));
  const onServer = await app.evalJs(`fetch('/api/sync', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lastSyncAt: null, push: {} }) }).then((r) => r.json()).then((j) => (j.pull.journalEntries || []).some((e) => e.id === ${JSON.stringify(heldId)})).catch(() => 'ERR')`);
  ok('(W5f) the edit made while stale SURVIVED the reload: the new load pushed it, and the account now has it', onServer === true, String(onServer));
});

const failed = checks.filter((c) => !c.pass).length;
console.log(failed === 0 ? `\nB101-WALK VERIFY: PASS (${checks.length} checks)` : `\nB101-WALK VERIFY: FAIL — ${failed}/${checks.length} failed`);
await setBuild('').catch(() => {});
process.exit(failed === 0 ? 0 : 1);
