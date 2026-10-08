// PAGE-TEMPLATES-MOVE - THE FRAMES Fable asked for (2026-10-08): a blank page (dark and light), the Templates section (Screenplay
// live, then Outline, Title page, Bibliography, Custom), and the after-states: Screenplay on an empty page and on a page with words,
// and Sprout - the blank Free Write page's one door (Nick's rulings, 2026-10-08).
// NOT in harness/: run-suite runs every .mjs there, and this writes PNGs into the tracked tree. Frames, run by hand.
// Run: node scripts/page-templates-frames.mjs   (from apps/desktop, dist-web built, box turn granted)
// Output: docs/evidence/page-templates/<theme>/<frame>.png plus frames.json (one row per frame, with what the DOM said).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from './runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', 'docs', 'evidence', 'page-templates');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const SCRIPT = '.script-sheet, .script-page, .script-el';
const WORDS = 'Words already here on this page.';
const THEMES = [
  { id: 'light', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'dark', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
];
const rows = [];

const freshDesk = async (app, prefs) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(prefs))});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const shot = async (app, theme, name, extra = {}) => {
  const dir = join(OUT, theme); mkdirSync(dir, { recursive: true });
  let file = `${name}.png`;
  try { writeFileSync(join(dir, file), Buffer.from(await app.screenshot(), 'base64')); } catch (e) { file = `SHOT-FAILED ${e.message}`; }
  rows.push({ theme, frame: name, file: `${theme}/${file}`, hash: await app.evalJs('location.hash'),
    beginningsRow: await app.evalJs("!!document.querySelector('.wz-beginnings')"), ...extra });
};
const openStrip = async (app) => {
  if (!(await app.evalJs("!!document.querySelector('.wz-sliver-templates')"))) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  return waitSoft(app, "!!document.querySelector('.wz-sliver-templates')", { label: 'templates', timeout: 3000 });
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
    await freshDesk(app, th.prefs);
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
    await freshDesk(app, th.prefs);
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page, Draft' });
    await app.click('Draft'); await sleep(500);
    await sleep(500);
    await openStrip(app);
    const pressed = await pressTemplate(app, 'screenplay');
    await settle(app);
    await shot(app, th.id, 'after-screenplay-empty-page', { pressed });

    await freshDesk(app, th.prefs);
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
    await freshDesk(app, th.prefs);
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
  writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
  console.log(`PAGE-TEMPLATES FRAMES: ${rows.length} frames, ${rows.filter((r) => r.file.includes('SHOT-FAILED')).length} failed shots -> docs/evidence/page-templates/`);
});
