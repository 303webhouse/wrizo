// CI-FRAMES (Oct 29, the "frames" job on GitHub Actions): build a branch, serve it, and capture NAMED screens in both page tones at
// 1366 and 1920, as PNGs plus a manifest. NOT in harness/: run-suite runs every .mjs there, and this writes images.
// It reads nothing but the built bundle: the workflow builds the lane's branch into build/ and runs THIS file from the trusted tooling checkout.
//
// Run (from the tooling checkout's apps/desktop):
//   node scripts/ci-frames.mjs --dist <path-to-dist-web> --out <dir> [--screens a,b|all] [--themes plateau,flux] [--tones light,dark] [--widths 1366,1920]
//        [--screens-file <path to a .mjs that default-exports { name: async (app, ctx) => {...} }>]
//
// THE THEME IS THE THEME, NOT ONLY THE PAGE TONE (the 645fdf6 lesson, scripts/page-templates-frames.mjs): `data-page` may paint under one
// theme and be ignored by another. Every row records the attributes the document actually carried, and a light frame byte-identical to
// its dark twin is FLAGGED in the manifest (sameAsOtherTone) and in the summary line, never silently shipped as two looks.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withHarness } from './runtime-verify.mjs';

const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt; };
const list = (s) => String(s).split(',').map((x) => x.trim()).filter(Boolean);
const DIST = arg('dist', null);
const OUT = path.resolve(arg('out', 'frames-out'));
const THEMES = list(arg('themes', 'plateau'));
const TONES = list(arg('tones', 'light,dark'));
const WIDTHS = list(arg('widths', '1366,1920')).map(Number);
const HEIGHT = { 1366: 768, 1920: 1080 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write.';

const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const press = async (app, selector) => {
  const pt = await app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(selector)}); if (!b) return null;
    const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  if (!pt) return false;
  await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y);
  return true;
};

// THE BUILT-IN SCREENS. Each one starts on a fresh Desk (the caller does that) and ends on the screen. A seed goes through the app's own
// seams (window.wrizo*), never raw storage (AGENTS.md "HOW TO SEED A FIXTURE").
const SCREENS = {
  'front-door': async (app) => {
    await waitSoft(app, "!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await sleep(900);
  },
  'blank-page': async (app) => {
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await sleep(900);
  },
  'blank-page-draft': async (app) => {
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await app.click('Draft'); await sleep(900);
  },
  'page-with-words': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fr-words', text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    await app.evalJs("location.hash = '#/page/fr-words'");
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page with words' });
    await sleep(900);
  },
  'page-drawer': async (app) => {
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await app.click('Draft'); await sleep(500);
    if (!(await app.evalJs(`!!document.querySelector(".wz-sliver[data-open='true']")`))) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await waitSoft(app, `!!document.querySelector(".wz-sliver[data-open='true']")`, { label: 'drawer open', timeout: 3000 });
    await sleep(700);
  },
  'journal': async (app) => {
    for (let i = 0; i < 4; i++) {
      await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `fr-j${i}`, text: `${WORDS} (${i + 1})`, createdAt: `2026-04-0${i + 1}T00:00:00.000Z`, origin: 'loose', source: 'page' })})`);
    }
    await sleep(400);
    await app.goto('/journal');
    await sleep(1400);
  },
};

let EXTRA = {};
const screensFile = arg('screens-file', null);
if (screensFile) EXTRA = (await import(pathToFileURL(path.resolve(screensFile)).href)).default || {};
const ALL = { ...SCREENS, ...EXTRA };
const want = arg('screens', 'all');
const NAMES = want === 'all' ? Object.keys(SCREENS) : list(want);
const unknown = NAMES.filter((n) => !ALL[n]);
if (unknown.length) { console.error(`CI-FRAMES: unknown screen(s): ${unknown.join(', ')}. Known: ${Object.keys(ALL).join(', ')}`); process.exit(2); }
if (!DIST) { console.error('CI-FRAMES: --dist <dist-web> is required'); process.exit(2); }
if (WIDTHS.some((w) => !HEIGHT[w])) { console.error(`CI-FRAMES: widths must be 1366 and/or 1920 (got ${WIDTHS.join(',')})`); process.exit(2); }

const freshDesk = async (app, theme, tone, w) => {
  await app.emulateDpr(1, w, HEIGHT[w]);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: tone, fade: 'on' }))});
    localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  // the opening splash plays on every load; the 50 ms hold override above is the harness's test speed, and a frame is only taken once it is GONE
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
};

const rows = [];
const md5 = (f) => createHash('md5').update(readFileSync(f)).digest('hex');
mkdirSync(OUT, { recursive: true });

await withHarness(async (app) => {
  for (const theme of THEMES) for (const w of WIDTHS) for (const name of NAMES) for (const tone of TONES) {
    const file = `${name}__${theme}-${tone}__${w}.png`;
    const row = { screen: name, theme, tone, width: w, height: HEIGHT[w], file };
    try {
      await freshDesk(app, theme, tone, w);
      await ALL[name](app, { theme, tone, width: w });
      // a frame of the opening splash is not a frame of the screen: refuse it rather than ship it
      if (await app.evalJs("!!document.querySelector('.wz-splash')")) throw new Error('the opening splash is still on screen');
      writeFileSync(path.join(OUT, file), Buffer.from(await app.screenshot(), 'base64'));
      row.status = 'ok';
      row.md5 = md5(path.join(OUT, file));
      row.hash = await app.evalJs('location.hash');
      row.attrs = await app.evalJs("({ theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), voice: document.documentElement.getAttribute('data-voice') })");
    } catch (e) { row.status = 'failed'; row.error = String(e && e.message || e).slice(0, 300); }
    rows.push(row);
    console.log(`${row.status === 'ok' ? 'ok    ' : 'FAILED'} ${file}${row.error ? '  -- ' + row.error : ''}`);
  }
}, { dist: path.resolve(DIST) });

// the light/dark guard: a frame byte-identical to its other-tone twin is one look, not two
const same = [];
for (const r of rows) {
  const twin = rows.find((x) => x.screen === r.screen && x.theme === r.theme && x.width === r.width && x.tone !== r.tone && x.status === 'ok');
  r.sameAsOtherTone = !!(r.status === 'ok' && twin && twin.md5 === r.md5);
  if (r.sameAsOtherTone && r.tone === 'light') same.push(`${r.screen}/${r.theme}/${r.width}`);
}
writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ built: process.env.BUILT_SHA || null, rows }, null, 2) + '\n');
const bad = rows.filter((r) => r.status !== 'ok');
console.log(`CI-FRAMES: ${rows.length - bad.length}/${rows.length} frames captured${bad.length ? `, ${bad.length} FAILED` : ''}`);
console.log(same.length ? `CI-FRAMES TONES: light is byte-identical to dark for: ${same.join(', ')} (that theme ignores the page tone here)` : 'CI-FRAMES TONES: every light frame differs from its dark twin');
process.exit(bad.length ? 1 : 0);
