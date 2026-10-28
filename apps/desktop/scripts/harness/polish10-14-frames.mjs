// POLISH #10 item 14 - FRAMES (a box turn). The rail's place block with a long rack name, Arbor + Flux, dark + light, as PNGs for Fable's eyes.
// Run: node scripts/harness/polish10-14-frames.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const out = process.argv[2];
if (!out) { console.error('usage: node polish10-14-frames.mjs <outDir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  for (const [skin, themeId] of [['arbor', 'plateau'], ['flux', 'flux']]) {
    for (const tone of ['dark', 'light']) {
      await app.emulateDpr(1, 1400, 900);
      await app.goto('/');
      await q(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1');`);
      await app.reload();
      try { await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'front door' }); await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 }); } catch { /* the frame shows what is there */ }
      await sleep(700);
      await q(`window.wrizoTheme && window.wrizoTheme.set('${themeId}')`);
      await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${tone}' })`);
      await q(`(() => { const d = window.wrizoCreateDrawer('The Late Ferry Crossing To The Far Side'); const man = window.wrizoCreateProject('Manuscript', 'creative'); window.wrizoSetProjectDrawer(man.id, d.id); window.wrizoCreateJournalPage({ id: 'f14-p1', text: 'The ferry leaves at dusk.', projectId: man.id, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' }); window.wrizoFlushNow(); })()`);
      await sleep(500);
      await q("location.hash = '#/page/f14-p1'");
      try { await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page' }); } catch { /* ditto */ }
      await sleep(1000);
      fs.writeFileSync(path.join(out, `p14-rail-${skin}-${tone}.png`), Buffer.from(await app.screenshot(), 'base64'));
    }
  }
});
console.log('POLISH10-14 FRAMES: written to ' + out);
