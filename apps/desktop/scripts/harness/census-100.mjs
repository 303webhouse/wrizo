// CENSUS #100 (ARBOR's turn 8, Nov 13): keys typed as the word goal is crossed are slow on main. Actions cannot give the box's milliseconds, so this reads the two relative meters built
// for the bug (a key's main-thread cost against the same run's control keys), bug100-goal-crossing.mjs and bug100-rhizome-fade.mjs, on the live build, and shoots the fade.
// STILL THERE: a crossing or fade check (G1-B, G1S, F1, F1F, FAF) is red. GONE: both files green (on Actions; the box has the last word on speed).
// CAN'T TELL: a file gave no verdict, or a premise or mutant check is red.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FRAMES, finish, kit, sleep, GONE, THERE, CANT } from './census/lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const runOne = (file) => {
  const log = path.join(FRAMES, `census-100-${file}.log.txt`);
  const fd = fs.openSync(log, 'w');   // output to a file, never a pipe
  const r = spawnSync(process.execPath, [path.join(here, file)], { stdio: ['ignore', fd, fd], env: { ...process.env }, timeout: 6 * 60 * 1000 });
  fs.closeSync(fd);
  const lines = fs.readFileSync(log, 'utf8').split(/\r?\n/);
  return { file, exit: r.status, verdict: lines.find((l) => /VERIFY:/.test(l) && !/ROWS-SHADOW/.test(l)) || null, failed: lines.filter((l) => /^FAIL\s/.test(l)).map((l) => l.slice(0, 200)) };
};
const runs = ['bug100-goal-crossing.mjs', 'bug100-rhizome-fade.mjs'].map(runOne);
const failed = runs.flatMap((r) => r.failed);
const slow = failed.filter((l) => /^FAIL\s+(G1|F1|FA)/.test(l) && !/MUT/.test(l));
const other = failed.filter((l) => !slow.includes(l));

let frames = [];
try {
  const { withHarness } = await import('../runtime-verify.mjs');
  await withHarness(async (app) => {
    const k = kit(app, '100');
    await k.openPage({ theme: 'plateau', room: 'light', text: 'one two three four five six seven', goal: { n: 8, unit: 'words' }, settings: { progress: 'words', progressStyle: 'rhizome' } });
    await k.q("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await app.typeKeys(' x');
    await k.waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'fading'", { timeout: 6000, label: 'the fade' });
    await sleep(500);
    await k.shot('fade');
    frames = k.frames;
    return [];
  }, { label: 'census-100-frame' });
} catch { /* the frame is evidence, not the verdict */ }

const noVerdict = runs.filter((r) => !r.verdict);
finish('100', {
  result: noVerdict.length ? CANT : slow.length ? THERE : other.length ? CANT : GONE,
  why: noVerdict.length ? `no verdict from ${noVerdict.map((r) => r.file).join(', ')}` : slow.length ? `${slow.length} crossing or fade checks are red on Actions` : other.length ? `the speed checks are green and these others are red: ${other.map((l) => l.replace(/^FAIL\s+/, '').split(' ')[0]).join(', ')}` : 'both relative meters are green on Actions; the box has not been run',
  readings: runs,
  frames,
});
