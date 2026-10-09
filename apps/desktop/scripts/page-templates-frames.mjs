// PAGE-TEMPLATES-MOVE - THE FRAMES Fable asked for (2026-10-08): a blank page (dark and light), the Templates section (Screenplay
// live, then Outline, Title page, Bibliography, Custom), and the after-states: Screenplay on an empty page and on a page with words,
// and Sprout - the blank Free Write page's one door (Nick's rulings, 2026-10-08).
// NOT in harness/: run-suite runs every .mjs there, and this writes PNGs into the tracked tree. Frames, run by hand.
// Run: node scripts/page-templates-frames.mjs   (from apps/desktop, dist-web built, box turn granted)
// Output: docs/evidence/page-templates/<theme>/<frame>.png plus frames.json (one row per frame, with what the DOM said).
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from './runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', 'docs', 'evidence', 'page-templates');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const SCRIPT = '.script-sheet, .script-page, .script-el';
const WORDS = 'Words already here on this page.';
// THE THEME IS THE THEME, NOT ONLY THE PAGE TONE (Fable, 2026-10-09: the 645fdf6 "light" frames were byte-identical to the dark
// ones). `data-page` paints only under Flux - Plateau, the default and the look approved as "dark", ignores it - so the page tone
// alone changed nothing. DARK = Plateau (the approved look); LIGHT = Flux with its LIGHT page, the product's only light paper.
// Each row records the attributes the document actually carried, and every light frame is compared to its dark twin by MD5.
const THEMES = [
  { id: 'light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'dark', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
].filter((t) => !process.env.FRAMES_ONLY || process.env.FRAMES_ONLY === t.id);
const rows = [];

const freshDesk = async (app, prefs, theme) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(prefs))});
    localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const shot = async (app, theme, name, extra = {}) => {
  const dir = join(OUT, theme); mkdirSync(dir, { recursive: true });
  let file = `${name}.png`;
  try { writeFileSync(join(dir, file), Buffer.from(await app.screenshot(), 'base64')); } catch (e) { file = `SHOT-FAILED ${e.message}`; }
  rows.push({ theme, frame: name, file: `${theme}/${file}`, hash: await app.evalJs('location.hash'),
    attrs: await app.evalJs("({ theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page') })"),
    beginningsRow: await app.evalJs("!!document.querySelector('.wz-beginnings')"), ...extra });
};
// OPEN means the strip's own state, `.wz-sliver[data-open="true"]` - NOT that its body or a section is in the DOM: the body stays
// mounted while the drawer is shut, so a presence test reads "open" on a closed strip (the 33b5a80 turn's frames showed exactly that,
// and every real press then landed on a closed drawer).
const openStrip = async (app) => {
  if (!(await app.evalJs(`!!document.querySelector(".wz-sliver[data-open='true']")`))) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  return waitSoft(app, `!!document.querySelector(".wz-sliver[data-open='true']")`, { label: 'strip open', timeout: 3000 });
};
const pressTemplate = async (app, key) => {
  const pt = await app.evalJs(`(() => { const b = document.querySelector('.wz-template-live[data-template="${key}"]'); if (!b) return null;
    b.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  if (!pt) return false;
  await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y);
  return true;
};
const settle = async (app) => {
  await waitSoft(app, `!!document.querySelector('${SCRIPT}')`, { label: 'script' });
  await sleep(900);
};

await withHarness(async (app) => {
  for (const th of THEMES) {
    // the blank page, its default mode and Draft
    await freshDesk(app, th.prefs, th.theme);
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await sleep(900);
    await shot(app, th.id, 'blank-page');
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page, Draft' });
    await app.click('Draft'); await sleep(500);
    await sleep(700);
    await shot(app, th.id, 'blank-page-draft');
    // the Templates section, open
    const opened = await openStrip(app);
    await app.evalJs("document.querySelector('.wz-sliver-templates')?.scrollIntoView({ block: 'center' })");
    await sleep(400);
    await shot(app, th.id, 'templates-section', { opened,
      buttons: await app.evalJs("[...document.querySelectorAll('.wz-sliver-templates button')].map(b => ({ name: b.getAttribute('aria-label'), live: b.classList.contains('wz-template-live') }))") });
    // Screenplay, on an empty page and on a page with words
    await freshDesk(app, th.prefs, th.theme);
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page, Draft' });
    await app.click('Draft'); await sleep(500);
    await sleep(500);
    await openStrip(app);
    const pressed = await pressTemplate(app, 'screenplay');
    await settle(app);
    await shot(app, th.id, 'after-screenplay-empty-page', { pressed });

    await freshDesk(app, th.prefs, th.theme);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fr-screenplay', text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    await app.evalJs("location.hash = '#/page/fr-screenplay'");
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page with words' });
    await sleep(500);
    await app.click('Draft'); await sleep(700);
    await openStrip(app);
    const pressed2 = await pressTemplate(app, 'screenplay');
    await settle(app);
    await shot(app, th.id, 'after-screenplay-page-with-words', { pressed: pressed2,
      chip: await app.evalJs("document.querySelector('.wz-back-to-board')?.textContent.trim() ?? null") });

    // Sprout: the blank Free Write page's one door, pressed
    await freshDesk(app, th.prefs, th.theme);
    await app.goto('/page/new');
    await waitSoft(app, "!!document.querySelector('.wz-beginning[data-beginning=\"sprout\"]')", { label: 'Sprout door' });
    await sleep(500);
    const spt = await app.evalJs(`(() => { const b = document.querySelector('.wz-beginning[data-beginning="sprout"]'); if (!b) return null;
      const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (spt) { await app.mouseDown(spt.x, spt.y); await sleep(60); await app.mouseUp(spt.x, spt.y); }
    await waitSoft(app, "!!document.querySelector('.fl-invite')", { label: 'invite' });
    await sleep(700);
    await shot(app, th.id, 'after-sprout-blank-free-write', { pressed: !!spt });
  }
  mkdirSync(OUT, { recursive: true });
  // a reshoot of ONE theme keeps the other theme's rows (FRAMES_ONLY)
  const prior = existsSync(join(OUT, 'frames.json')) ? JSON.parse(readFileSync(join(OUT, 'frames.json'), 'utf8')) : [];
  const shotThemes = new Set(rows.map((r) => r.theme));
  const all = prior.filter((r) => !shotThemes.has(r.theme)).concat(rows);
  // the light/dark MD5 guard: a light frame byte-identical to its dark twin is the 645fdf6 bug, not evidence
  const md5 = (f) => { try { return createHash('md5').update(readFileSync(join(OUT, f))).digest('hex'); } catch { return null; } };
  const same = [];
  for (const r of all.filter((x) => x.theme === 'light')) {
    const twin = all.find((x) => x.theme === 'dark' && x.frame === r.frame);
    const a = md5(r.file), b = twin ? md5(twin.file) : null;
    r.md5 = a; r.sameAsDark = !!a && a === b;
    if (r.sameAsDark) same.push(r.frame);
  }
  writeFileSync(join(OUT, 'frames.json'), JSON.stringify(all, null, 2) + '\n');
  console.log(`PAGE-TEMPLATES THEME GUARD: ${same.length ? `FAIL - light frames identical to dark: ${same.join(', ')}` : 'PASS - no light frame is identical to its dark twin'}`);
  console.log(`PAGE-TEMPLATES FRAMES: ${rows.length} frames, ${rows.filter((r) => r.file.includes('SHOT-FAILED')).length} failed shots -> docs/evidence/page-templates/`);
});
