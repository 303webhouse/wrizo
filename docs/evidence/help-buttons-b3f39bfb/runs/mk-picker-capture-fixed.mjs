// Throwaway diagnostic copy of templates-picker-capture.mjs (NOT committed; output to the scratchpad, not the tree). TOOLS' script shoots while the splash (now on main) still covers the page: both of its frames are the splash.
// This copy (1) sets the splash hold and the tutor-disclosure keys like the other harnesses, (2) waits for .wz-splash to clear before the screenshot, (3) writes into the scratchpad. All three edits are COUNTED.
import { readFileSync, writeFileSync } from 'node:fs';
const dir = 'C:/Users/nickh/writer-studio/.claude/worktrees/hbm/apps/desktop/scripts/harness/';
let s = readFileSync(dir + 'templates-picker-capture.mjs', 'utf8');
const SD = 'C:/Users/nickh/AppData/Local/Temp/claude/c--Users-nickh-writer-studio/f1a2ee78-3ca4-459c-a8bc-9aa1df8d26b4/scratchpad/hbm-picker-frames';
const edits = [
  ["const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'templates-picker');", "const OUT = " + JSON.stringify(SD) + ";"],
  ["localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});", "localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});"],
  ["    await save(app, theme);", "    await app.waitFor(\"!document.querySelector('.wz-splash')\", { label: 'splash gone', timeout: 15000 }).catch(() => {}); await sleep(600);\r\n    await save(app, theme);"],
];
for (const [a, b] of edits) { const n = s.split(a).length - 1; if (n !== 1) throw new Error('edit did not land exactly once (' + n + '): ' + a.slice(0, 50)); s = s.replace(a, () => b); }
writeFileSync(dir + 'templates-picker-capture-fixed.mjs', s);
console.log('patched 3 sites');
