// MACHINA'S BARS FROM THE FIRST PAINT (the Wrizors' item 7, relayed by Fable, Nov 25: "Machina's top bar and rail drew dark in some frames and light in
// others with the same settings"). Machina's bars are dark in BOTH tones, and that lives in styles/machina-v2.css, which loads in its own chunk
// (main.tsx). If the app draws before the chunk lands, the bars are painted by the older rules - light - and change under her eyes.
//   B1  (boot, a slowed network) the first moment a bar is in the document, Machina's look is already on: data-machina2, and the bar painted dark
//   B2  once settled, the same (premise: the look and the dark bar are what this page ends at)
//   B3  with the look's chunk refused altogether, the app still draws (the page is never held hostage to its dress)
//   MUT the first-sight reading with the bar light (planted) turns B1's judge red
// The product's own looks: the driver pins older themes and the reorg off for files that do not ask, so this one asks, before the driver loads.
// Needs a box turn or an Actions runner.  Run: node scripts/harness/machina-bars-boot.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const BARS = '.chrome-top.sprint-nav, .desk-frame-strip, .desk-rail';
// runs in the page before any of the app's own scripts: notes how the first bar to appear is painted
const WATCH = `(() => {
  window.__firstBar = null;
  const read = (el) => ({ cls: String(el.className).slice(0, 40), look: document.documentElement.hasAttribute('data-machina2'), bg: getComputedStyle(el).backgroundColor, splash: !!document.querySelector('.wz-splash'), at: Math.round(performance.now()) });
  const look = () => { if (window.__firstBar) return; const el = document.querySelector('${BARS}'); if (el) window.__firstBar = read(el); };
  new MutationObserver(look).observe(document, { childList: true, subtree: true });
})()`;
// dark: every channel low (Machina's bar is #1E262E cool, #201E1B neutral)
const dark = (bg) => { const m = /rgba?\((\d+), (\d+), (\d+)/.exec(bg || ''); return !!m && +m[1] < 80 && +m[2] < 80 && +m[3] < 80 && !/, 0\)$/.test(bg); };
const good = (r) => !!r && r.look === true && dark(r.bg);
// every bar that is drawn: what it is PAINTED on (its own ground, or the first one under it)
const ALL = `(() => { const out = {}; for (const sel of '${BARS}'.split(', ')) { const el = [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().height > 0); if (!el) continue;
  let n = el, bg = 'rgba(0, 0, 0, 0)'; while (n) { bg = getComputedStyle(n).backgroundColor; if (!/, 0\\)$/.test(bg) && bg !== 'transparent') break; n = n.parentElement; }
  out[sel] = bg; } return { look: document.documentElement.hasAttribute('data-machina2'), theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), bars: out }; })()`;
const allDark = (r) => !!r && Object.keys(r.bars).length > 0 && Object.values(r.bars).every(dark);

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-theme','machina'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'light', fade: 'on' }))");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'mb-1', text: 'One line.', createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' }); window.wrizoFlushNow()");
  await sleep(500);
  await app.evalJs("location.hash = '#/page/mb-1'");
  await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page')", { label: 'the page', timeout: 15000 });

  await app.cdp('Page.enable');
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: WATCH });
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: -1, uploadThroughput: -1 });
  await app.reload();
  await app.waitFor("!!window.__firstBar", { label: 'a bar', timeout: 30000 });
  const first = await app.evalJs('window.__firstBar');
  ok('B1 the first moment a bar is in the document, Machina\'s look is on and the bar is painted dark', good(first), J(first));
  await sleep(4000);
  const later = await app.evalJs(`(() => { const el = document.querySelector('${BARS}'); return el ? { look: document.documentElement.hasAttribute('data-machina2'), bg: getComputedStyle(el).backgroundColor } : null; })()`);
  ok('B2 settled, the look is on and the bar is dark', good(later), J(later));
  const settled = await app.evalJs(ALL);
  ok('B2b settled, EVERY drawn bar is painted dark', allDark(settled), J(settled));
  ok('MUT the same first sight with a light bar turns B1\'s judge red', !good({ ...(later || {}), bg: 'rgb(244, 245, 246)' }) && good(later), J(later));

  // B3: the chunk refused - the app must still draw
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await app.cdp('Network.setBlockedURLs', { urls: ['*mount-*.js', '*mount-*.css'] });
  await app.reload();
  let drew = true;
  try { await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page')", { label: 'the page without the look', timeout: 20000 }); } catch { drew = false; }
  const noLook = await app.evalJs("document.documentElement.hasAttribute('data-machina2')");
  ok('B3 with the look\'s chunk refused the app still draws her page', drew, J({ drew, look: noLook }));
  await sleep(1500);
  console.log(`DIAG bars without the look (page light): ${J(await app.evalJs(ALL))}`);
  await app.cdp('Network.setBlockedURLs', { urls: [] });

  // B4: a switch to Machina while the app is open (she boots in Arbor), on a slowed network
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page') && !document.querySelector('.wz-splash')", { label: 'the page in Arbor', timeout: 30000 });
  await sleep(1500);
  await app.cdp('Network.emulateNetworkConditions', { offline: false, latency: 1500, downloadThroughput: -1, uploadThroughput: -1 });
  await app.evalJs("window.wrizoTheme.set('machina'); null");
  await sleep(150);
  const flip = await app.evalJs(ALL);
  await sleep(7000);
  const flipped = await app.evalJs(ALL);
  ok('B4a after a switch to Machina, settled, the look is on and every drawn bar is dark', flipped.look === true && allDark(flipped), J(flipped));
  ok('B4b the moment after the switch every drawn bar is already painted as it settles', JSON.stringify(flip.bars) === JSON.stringify(flipped.bars), J({ first: flip, settled: flipped }));
});
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nMACHINA-BARS-BOOT VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-BARS-BOOT VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
