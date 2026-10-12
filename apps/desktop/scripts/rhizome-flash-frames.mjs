// RHIZOME FLASH FADE - three stamped frames of the goal flash (Nick, 2026-10-10: "a bit brighter and fade back out slower"): the
// rhizome page crossing an 8-word goal, shot at the HOLD, MID-FADE (~600ms into the 1500ms fade) and AFTER. Each frame's .json
// records the field's own reading (data-flash, stroke, opacity, stroke-width). Paths resolve from this file - any worktree.
//   node apps/desktop/scripts/rhizome-flash-frames.mjs          (dist-web built, a granted box turn: WS_BOX_TURN)
// Writes docs/evidence/rhizome-flash/<sha>-<n>-<moment>.png (+ .json). Called by rhizome-flash-verify.mjs; runnable alone.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { withHarness } from './runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = execSync('git rev-parse --show-toplevel', { cwd: here, encoding: 'utf8' }).trim();
const SHA = execSync('git rev-parse --short HEAD', { cwd: here, encoding: 'utf8' }).trim();
const OUT = join(repo, 'docs', 'evidence', 'rhizome-flash');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const look = (app) => app.evalJs("(() => { const f = document.querySelector('.wz-rhizome-field'); const s = f && f.querySelector('.wz-rhizome-seg:not([data-thick=\"true\"])'); const cs = s && getComputedStyle(s); return f ? { flash: f.dataset.flash, stroke: cs && cs.stroke, opacity: cs && Number(cs.opacity), width: cs && cs.strokeWidth } : null; })()");
const shot = async (app, name) => {
  const reading = await look(app);
  const when = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  await app.evalJs(`(() => { const d = document.createElement('div'); d.id = 'fix-shot-stamp';
    d.style.cssText = 'position:fixed;right:8px;bottom:6px;z-index:2147483647;font:11px/1.2 monospace;color:#9a9a9a;background:rgba(0,0,0,.55);padding:3px 6px;pointer-events:none';
    d.textContent = ${JSON.stringify(`rhizome flash @ ${SHA} · ${name} · ${when}`)}; document.body.appendChild(d); return true; })()`);
  const file = `${SHA}-${name}`;
  writeFileSync(join(OUT, `${file}.png`), Buffer.from(await app.screenshot(), 'base64'));
  await app.evalJs("document.getElementById('fix-shot-stamp')?.remove()");
  writeFileSync(join(OUT, `${file}.json`), JSON.stringify({ sha: SHA, moment: name, when, reading }, null, 2) + '\n');
  console.log(`RHIZOME-FLASH FRAME: ${file}.png ${JSON.stringify(reading)}`);
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page' });
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.evalJs(`(() => { window.wrizoSetWritingGoal({ n: 8, unit: 'words' }); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: 7 }, (_, i) => 'word' + i).join(' ') }); })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: 'field' });
  await sleep(1500);
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  await app.typeKeys(' tail');
  try { await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash', timeout: 4000 }); } catch { /* recorded */ }
  await sleep(300);
  await shot(app, '1-hold');
  try { await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'fading'", { label: 'fading', timeout: 3000 }); } catch { /* recorded */ }
  await sleep(600);
  await shot(app, '2-mid-fade');
  try { await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'after', timeout: 3000 }); } catch { /* recorded */ }
  await sleep(500);
  await shot(app, '3-after');
});
