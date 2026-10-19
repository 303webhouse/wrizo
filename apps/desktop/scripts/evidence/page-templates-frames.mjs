// PAGE TEMPLATES R2 - THE FRAMES, for Nick: the five-row picker and the three new templates, Arbor and Flux, dark and light page tone.
//   01 the picker open on a blank page (Blank current)      02 an Outline page (derived numbers)      03 a Bibliography page (hanging indents)
//   04 a Title Page, filled                                  05 a template picked on a page with words: the NEW page and its "Opened as a new page - Back" chip
// Evidence, not a check: scripts/evidence/ (run-suite runs scripts/harness/, and this writes images). Run by hand.   Run: node scripts/evidence/page-templates-frames.mjs
// (from apps/desktop, dist-web built, box turn granted)   FRAMES_ONLY=<combo>
// Output: docs/evidence/page-templates-r2/<combo>/<frame>.png plus frames.json (light frames are compared to their dark twin by MD5).
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', '..', 'docs', 'evidence', 'page-templates-r2');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMBOS = [
  { id: 'arbor-dark', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'arbor-light', theme: 'plateau', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-light', theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
].filter((t) => !process.env.FRAMES_ONLY || process.env.FRAMES_ONLY === t.id);
const rows = []; const hashes = new Map();
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const SETTINGS = (template) => ({ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }, template });
const OUTLINE = ['Arrival', '\tThe late ferry', '\tGulls on the rail', 'The harbormaster', '\tWhat he saw', '\t\tThe lamp, twice', '\tWhat he left out', 'The crossing'].join('\n');
const BIB = ['Ahmed, Sara. *Harbors and Memory: Coastal Towns in Fiction*. Edinburgh: Northgate Press, 2019.', 'Bell, Marian. "The Last Ferry." *Island Review* 14, no. 2 (2021): 33-48.', 'Hollis, Dev. *Counting Gulls: A Field Guide to Waiting*. London: Tern & Quay, 2016.', 'Okafor, Lena. *Small Crossings*. New York: Ledger Books, 2022.'].join('\n');
const TITLE = 'Ada Marsh\n14 Quay Street\nOban PA6 5ZZ\nada@example.com\n>> About 62,000 words\n\n>< The Late Ferry\n>< by\n>< Ada Marsh';
const WORDS = 'The ferry was late, so Ada counted gulls instead of minutes.';

const shot = async (app, combo, name) => {
  const dir = join(OUT, combo.id); mkdirSync(dir, { recursive: true });
  let file = `${name}.png`; let md5 = null;
  try { const buf = Buffer.from(await app.screenshot(), 'base64'); writeFileSync(join(dir, file), buf); md5 = createHash('md5').update(buf).digest('hex'); } catch (e) { file = `SHOT-FAILED ${e.message}`; }
  hashes.set(`${combo.id}/${name}`, md5);
  const twin = combo.id.endsWith('-light') ? combo.id.replace('-light', '-dark') : null;
  rows.push({ combo: combo.id, frame: name, file: `${combo.id}/${file}`, md5, sameAsDarkTwin: twin ? hashes.get(`${twin}/${name}`) === md5 : null });
};

await withHarness(async (app) => {
  for (const combo of COMBOS) {
    const reset = async () => {
      await app.emulateDpr(1, 1400, 900);
      await app.goto('/');
      await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
        localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(combo.prefs))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)});
        localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
      await app.reload();
      await waitSoft(app, "!!document.querySelector('.wz-arrival')", { label: 'Desk' });
      await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    };
    const open = async (id, extra) => {
      await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: extra.text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
      if (extra.template) await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(id)}, { pageSettings: ${JSON.stringify(SETTINGS(extra.template))} })`);
      await app.evalJs('window.wrizoFlushNow()'); await sleep(450);
      await app.evalJs(`location.hash = '#/page/${id}'`);
      await waitSoft(app, "!!document.querySelector('.forward-only-editor, .wz-title-sheet')", { label: 'page', timeout: 9000 });
      await sleep(700);
      await app.click('Draft'); await sleep(900);
      await app.evalJs("if (!document.querySelector(\".wz-sliver[data-open='true']\")) document.querySelector('.wz-sliver-grip')?.click()"); await sleep(800);
    };
    // 01 - the picker on a blank page
    await reset();
    await app.goto('/page/new'); await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'unborn page' }); await sleep(700);
    await app.click('Draft'); await sleep(900);
    await app.evalJs("if (!document.querySelector(\".wz-sliver[data-open='true']\")) document.querySelector('.wz-sliver-grip')?.click()"); await sleep(800);
    await app.evalJs("document.querySelector('.wz-sliver-templates')?.scrollIntoView({ block: 'center' })"); await sleep(300);
    await shot(app, combo, '01-the-picker');
    // 02 - Outline, 03 - Bibliography, 04 - Title Page
    for (const [name, id, extra] of [
      ['02-outline', 'ptf-outline', { text: OUTLINE, template: 'outline' }],
      ['03-bibliography', 'ptf-bib', { text: BIB, template: 'bibliography' }],
      ['04-title-page', 'ptf-title', { text: TITLE, template: 'title' }],
    ]) {
      await reset();
      await open(id, extra);
      await app.evalJs("document.querySelector('.wz-sliver-templates')?.scrollIntoView({ block: 'center' })"); await sleep(300);
      await shot(app, combo, name);
    }
    // 05 - a template picked on a page with words: the new page and its chip
    await reset();
    await open('ptf-words', { text: WORDS });
    const pt = await app.evalJs("(() => { const b = document.querySelector('.wz-template-row[data-template=\"bibliography\"]'); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    if (pt) { await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y); await sleep(1200); }
    else rows.push({ combo: combo.id, frame: '05-new-page-note', error: 'the Bibliography row was not found' });
    await shot(app, combo, '05-new-page-note');
  }
  const same = rows.filter((r) => r.sameAsDarkTwin === true).map((r) => r.combo + '/' + r.frame);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'frames.json'), JSON.stringify({ rows, lightFramesByteIdenticalToDarkTwin: same }, null, 2));
  // eslint-disable-next-line no-console
  console.log(`PAGE-TEMPLATES-FRAMES: ${rows.length} frames written to ${OUT}; light frames byte-identical to their dark twin: ${same.length ? same.join(', ') : 'none'}`);
});
