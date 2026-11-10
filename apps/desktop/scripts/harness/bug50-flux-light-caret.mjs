// BUG #50 - Flux's block caret on the LIGHT page, live (no flag): the shared orange at .82 read 1.79:1 against the paper (#F4F7F8), under the
// 4.5 floor (found by flux3-s4.mjs's INFO CARET-CONTROL, Nov 7; the flag's own fix is S4 r8's). The fix, in styles/06-flux-v2.css: on the light
// page a solid, darker orange of the same family, #A84E00 (5.2:1 on the paper); the dark tone keeps its caret.
//
// THE PAGE, seeded through the app's seam (wrizoCreateJournalPage; never raw storage): a loose page, opened in Free Write, no flag.
//
//   CARET-LIGHT  the block caret on the light page is >= 4.5:1 against the page under it (computed colours: the caret's colour composited over
//                the first opaque background under its centre), in the orange family (hue 15-45 degrees).
//   CARET-DARK   the dark tone keeps its caret: the shared orange, rgba(255, 152, 0, 0.82).
//   CARET-THEME  another theme (Arbor) has no block caret (the rule is Flux's only).
//   MUT-CARET    (landed: a pattern matched exactly once in the served index-*.css, replaced in flight) the light page's caret back to the
//                shared orange: CARET-LIGHT fails.
//   B            the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src.
//
// Run: node scripts/harness/bug50-flux-light-caret.mjs (from apps/desktop; a box turn, or a hosted runner).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const PAGE = 'bug50-page';
const TEXT = 'The caret stands at the end of this line on the light page.';

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

// the caret's ink against the page under it, read in the page (computed colours; the caret's alpha composited over that page)
const CARET_INK = `(() => {
  const bc = document.querySelector('.flux-block-caret'); if (!bc) return null; const r = bc.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const rgba = (s) => { if (!s || !s.startsWith('rgb')) return null; const v = s.replace(/[^0-9.,]/g, '').split(',').map(Number); return v.length >= 3 ? [v[0], v[1], v[2], v.length > 3 ? v[3] : 1] : null; };
  const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).filter((e) => e !== bc).map((e) => ({ e, c: rgba(getComputedStyle(e).backgroundColor) })).find((x) => x.c && x.c[3] >= 0.99);
  const cc = rgba(getComputedStyle(bc).backgroundColor); if (!cc || !under) return { caret: getComputedStyle(bc).backgroundColor, page: null, ratio: null };
  const page = under.c.slice(0, 3), ink = cc.slice(0, 3).map((v, k) => v * cc[3] + page[k] * (1 - cc[3]));
  const lum = (c) => { const l = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
  const a = lum(ink), b = lum(page);
  return { caret: getComputedStyle(bc).backgroundColor, page, pageEl: String(under.e.className || under.e.tagName).slice(0, 60), ink: ink.map(Math.round), ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2) };
})()`;

const MUTANTS = {
  // the light page's caret back to the shared orange (the live build before the fix): CARET-LIGHT fails
  caret: [/\.flux-block-caret\{background:#a84e00(?=[;}])/gi, '.flux-block-caret{background:rgba(255,152,0,.82)'],
};

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});

  let mutant = null;
  const landed = {};
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/index-*.css', requestStage: 'Response' }] });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      if (mutant) {
        const [from, to] = MUTANTS[mutant];
        const n = (text.match(from) || []).length;
        landed[mutant] = n;
        if (n === 1) text = text.replace(from, to);
      }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* the request is gone */ } }
  });

  // the page, through the seam (on the Desk: no flush handler is mounted)
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: PAGE, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(400);

  // preferences (not collections), set before the reload as the app reads them at boot
  const caretOf = async ({ tone, theme = 'flux' }) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); })()`);
    await ev(`history.replaceState(null, '', '/#/page/${PAGE}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await ev("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); return true; })()");
    await app.mouseMove(8, 8);
    if (theme === 'flux') await app.waitFor("!!document.querySelector('.flux-block-caret')", { timeout: 4000, label: 'the block caret' }).catch(() => {});
    await sleep(800);
    const st = await ev("({ theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), flag: document.documentElement.hasAttribute('data-flux3'), block: !!document.querySelector('.flux-block-caret'), served: ([...document.scripts].map((s) => s.getAttribute('src') || '').find((s) => /index-/.test(s)) || '').replace(/^.*\\//, '') })");
    return { st, ink: await ev(CARET_INK) };
  };

  const hueOf = (c) => { if (!c) return null; const [r, g, b] = c, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return null; return mx === r ? (60 * (g - b)) / (mx - mn) : null; };
  const lightOk = (x) => !!x && x.st.theme === 'flux' && x.st.page === 'light' && !x.st.flag && !!x.ink && x.ink.ratio !== null && x.ink.ratio >= 4.5
    && hueOf(x.ink.ink) !== null && hueOf(x.ink.ink) >= 15 && hueOf(x.ink.ink) <= 45;

  const light = await caretOf({ tone: 'light' });
  ok(`CARET-LIGHT the block caret on the light page (no flag) is >= 4.5:1 against the page under it (${light.ink && light.ink.ratio}:1), in the orange family (hue ${light.ink && light.ink.ink ? Math.round(hueOf(light.ink.ink)) : null})`,
    lightOk(light), JSON.stringify(light));
  const dark = await caretOf({ tone: 'dark' });
  ok('CARET-DARK the dark tone keeps its caret (the shared orange, rgba(255, 152, 0, 0.82))', dark.st.page === 'dark' && !!dark.ink && dark.ink.caret === 'rgba(255, 152, 0, 0.82)', JSON.stringify(dark));
  const arbor = await caretOf({ tone: 'light', theme: 'plateau' });
  ok('CARET-THEME another theme (Arbor, light page) has no block caret', arbor.st.theme === 'plateau' && !arbor.st.block, JSON.stringify(arbor.st));

  mutant = 'caret'; landed.caret = undefined;
  let mut;
  try { mut = await caretOf({ tone: 'light' }); } finally { mutant = null; }
  ok(`MUT-CARET (landed, in index-*.css) the light page's caret back to the shared orange: CARET-LIGHT fails (${mut.ink && mut.ink.ratio}:1)`, landed.caret === 1 && !lightOk(mut), JSON.stringify({ landed: landed.caret, ink: mut.ink }));

  ok(`B the build: served ${light.st.served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && light.st.served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBUG50 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBUG50 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
