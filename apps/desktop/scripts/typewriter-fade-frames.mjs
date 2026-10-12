// TYPEWRITER-FADE-ORDER - one stamped frame of the typewriter's fade: a 30-line page in Free Write, typed at the end so the history
// has scrolled up into the fade band. Usage (from any worktree; paths resolve from this file):
//   node apps/desktop/scripts/typewriter-fade-frames.mjs <label>        e.g. unfixed | fixed
// Writes docs/evidence/typewriter-fade/<label>-<sha>-scrolled-history.png (+ .json with the computed mask). Needs dist-web built and a
// granted box turn (WS_BOX_TURN). Called by typewriter-fade-verify.mjs; runnable alone.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { withHarness } from './runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = execSync('git rev-parse --show-toplevel', { cwd: here, encoding: 'utf8' }).trim();
const SHA = execSync('git rev-parse --short HEAD', { cwd: here, encoding: 'utf8' }).trim();
const OUT = join(repo, 'docs', 'evidence', 'typewriter-fade');
const label = process.argv[2] || 'frame';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 30 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the history that rides up into the page.`).join('\n');

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });   // splash-hold: never shoot under it
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/twf'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(600);
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  // THE HARNESS'S OWN FIXTURE (chat 1, 2026-10-12: the old ' and on' frame put no line into the fade band, so the images could not
  // SHOW the order the harness asserts): eight new lines typed with real Enters, then the writer's own scroll settles the oldest
  // visible line inside the box's first line - the band is full, exactly as typewriter-fade.mjs measures it.
  for (let i = 1; i <= 8; i += 1) { await app.typeKeys(`\nAnd the writer goes on, line ${i} of the new ones.`); await sleep(120); }
  try { await app.waitFor("document.querySelector('.mode-scroll')?.dataset.scrolled === 'true'", { label: 'scrolled', timeout: 6000 }); } catch { /* recorded */ }
  await sleep(1200);
  await app.evalJs(`(() => {
    const scroll = document.querySelector('.mode-scroll'); const ed = document.querySelector('${ED}'); if (!scroll || !ed) return null;
    const box = scroll.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(ed).lineHeight) || 28;
    const r = document.createRange(); r.selectNodeContents(ed); const mids = [];
    for (const rc of r.getClientRects()) { if (rc.height < 4) continue; const mid = (rc.top + rc.bottom) / 2 - box.top; if (!mids.some((m) => Math.abs(m - mid) < 4)) mids.push(mid); }
    mids.sort((a, b) => a - b); const first = mids.find((m) => m >= 0); if (first == null) return null;
    if (first > lh / 2) scroll.scrollTop = scroll.scrollTop + (first - lh / 2); return true;
  })()`);
  await sleep(500);
  const mask = await app.evalJs("(() => { const s = document.querySelector('.mode-scroll'); const cs = s && getComputedStyle(s); return cs ? (cs.webkitMaskImage || cs.maskImage) : null; })()");
  const when = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const name = `${label}-${SHA}-scrolled-history`;
  await app.evalJs(`(() => { const d = document.createElement('div'); d.id = 'fix-shot-stamp';
    d.style.cssText = 'position:fixed;right:8px;bottom:6px;z-index:2147483647;font:11px/1.2 monospace;color:#9a9a9a;background:rgba(0,0,0,.55);padding:3px 6px;pointer-events:none';
    d.textContent = ${JSON.stringify(`typewriter fade @ ${SHA} · ${label} · ${when}`)}; document.body.appendChild(d); return true; })()`);
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify({ sha: SHA, label, when, mask }, null, 2) + '\n');
  console.log(`TYPEWRITER-FADE FRAME: ${name}.png`);
});
