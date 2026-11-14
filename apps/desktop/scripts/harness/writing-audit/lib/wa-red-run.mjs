// BUG #96 - THE BATCH'S RED CHECKS IN THE STANDING SUITE. A shipped fix's red check (writing-audit/reds-NN.mjs) is a file the pair never ran: the suite reads scripts/harness/*.mjs only, and the checks print
// `RED-NN [tag] PASS`, which is not a verdict shape (verdict-shapes.mjs wants `NAME: PASS|FAIL`). Each scripts/harness/wa-red-NN.mjs is a thin wrapper that calls this: it runs the fix's check file(s) in child processes (one per theme where
// the check is a page's geometry), with the audit's own environment (theme / flag off / light / 1366 x 768, strict), and prints ONE verdict line `WA-RED-NN: PASS` or `WA-RED-NN: FAIL - <which>`.
//   - the children inherit the environment, so the box grant, the box-take token and the reaper's pre-flight mark pass through; every child is a withHarness run (its own browser, its own profile) and the wrapper waits on process exit
//   - a child's output goes to a FILE (never a pipe: run-suite.mjs law 1); only a failing child's FAIL lines and last lines are echoed, so no child's own verdict-shaped line stands in for the wrapper's
//   - the checks do not depend on the parked leg (HARNESS_PARKED): the default leg runs them, the parked leg says so and passes without a browser
// Harness only: no product file, no change to any check.
import { spawn } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHILD_TIMEOUT_MS = 6 * 60 * 1000;
export const ALL = ['plateau', 'flux', 'machina'];

function runChild(script, theme) {
  return new Promise((resolve) => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'wa-red-'));
    const out = path.join(dir, `${script}.${theme || 'none'}.txt`);
    const fd = openSync(out, 'w');
    const env = { ...process.env, WA_FLAG: 'off', WA_TONE: 'light', WA_W: '1366', WA_H: '768', WA_STRICT: '1' };
    if (theme) env.WA_THEME = theme;
    const t0 = Date.now();
    const child = spawn(process.execPath, [path.join(WA, script)], { cwd: process.cwd(), env, stdio: ['ignore', fd, fd], windowsHide: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; try { child.kill(); } catch { /* gone */ } }, CHILD_TIMEOUT_MS);
    child.on('exit', (code) => {
      clearTimeout(timer);
      try { closeSync(fd); } catch { /* closed */ }
      let text = '';
      try { text = readFileSync(out, 'utf8'); } catch { /* unreadable */ }
      resolve({ script, theme, code: timedOut ? -1 : code, timedOut, text, secs: Math.round((Date.now() - t0) / 1000) });
    });
    child.on('error', (e) => { clearTimeout(timer); try { closeSync(fd); } catch { /* closed */ } resolve({ script, theme, code: -2, timedOut: false, text: String(e), secs: 0 }); });
  });
}

/** steps: [{ script: 'reds-65.mjs', themes: ['plateau','flux','machina'] | [] (no theme: a node-only check, or one that does not depend on it) }] */
export async function runReds({ name, steps }) {
  if (process.env.HARNESS_PARKED === '1') { console.log(`${name}: PASS (parked leg: the checks do not depend on it; the default leg runs them)`); return; }
  const bad = [];
  let runs = 0;
  for (const s of steps) {
    for (const theme of (s.themes && s.themes.length ? s.themes : [null])) {
      runs += 1;
      const r = await runChild(s.script, theme);
      const ok = r.code === 0;
      console.log(`  ${s.script}${theme ? ' ' + theme : ''}: ${ok ? 'green' : r.timedOut ? 'TIMED OUT' : 'RED (exit ' + r.code + ')'} in ${r.secs}s`);
      if (!ok) {
        bad.push(`${s.script}${theme ? ' ' + theme : ''}`);
        const lines = r.text.split(/\r?\n/);
        const fails = lines.filter((l) => /^FAIL\b/.test(l)).slice(0, 6);
        for (const l of (fails.length ? fails : lines.filter((l) => l.trim()).slice(-4))) console.log('    ' + l.replace(/^\s+/, '').slice(0, 400));
      }
    }
  }
  console.log(bad.length ? `${name}: FAIL - ${bad.length} of ${runs} run(s) red: ${bad.join(', ')}` : `${name}: PASS (${runs} run(s) green)`);
  process.exitCode = bad.length ? 1 : 0;
}
