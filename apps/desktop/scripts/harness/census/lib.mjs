// THE L2 CENSUS (Fable, Nov 23, 1:00 pm): one red-first check per old bug, on the build as it ships (no ?arbor2=0 / ?machina2=0 pin), Actions only.
// A file ends in one word: GONE (exit 0), STILL THERE or CAN'T TELL (exit 1). A premise that does not hold is CAN'T TELL, never GONE.
// Frames go to $RUNNER_TEMP/suite/census-frames, which the workflow keeps as the leg's artifact.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
delete process.env.WS_URL_SEARCH;

export const GONE = 'GONE', THERE = 'STILL THERE', CANT = "CAN'T TELL";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const FRAMES = process.env.RUNNER_TEMP ? path.join(process.env.RUNNER_TEMP, 'suite', 'census-frames') : path.join(os.tmpdir(), 'census-frames');
fs.mkdirSync(FRAMES, { recursive: true });
const J = (x) => JSON.stringify(x);

export const dist = (a, b) => (a && b ? Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])) : Infinity);
export const prose = (n) => Array.from({ length: n }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the page the writer is in, long enough to read as a sentence.`).join('\n');

export function finish(id, out) {
  const result = out && [GONE, THERE, CANT].includes(out.result) ? out.result : CANT;
  console.log(`CENSUS #${id} READINGS ${JSON.stringify((out && out.readings) ?? null)}`);
  console.log(`CENSUS #${id} WHY ${(out && out.why) || 'the scenario gave no result'}`);
  console.log(`CENSUS #${id} FRAMES ${((out && out.frames) || []).join(', ') || 'none'}`);
  console.log(`CENSUS #${id}: ${result}`);
  console.log(result === GONE ? `\nCENSUS-${id} VERIFY: PASS (GONE)` : `\nCENSUS-${id} VERIFY: FAIL - ${result}`);
  process.exit(result === GONE ? 0 : 1);
}

export function kit(app, id) {
  const q = (js) => app.evalJs(js);
  let seq = 0;
  const frames = [];
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const splash = () => waitSoft("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' });
  const shot = async (name) => { const b64 = await app.screenshot(); const f = `census-${id}-${name}.png`; fs.writeFileSync(path.join(FRAMES, f), Buffer.from(b64, 'base64')); if (!frames.includes(f)) frames.push(f); return b64; };
  // the mean colour of a 5 x 5 patch at each point of a screenshot
  const patches = (b64, pts) => q(`(async () => { const i = new Image(); await new Promise((res, rej) => { i.onload = res; i.onerror = rej; i.src = 'data:image/png;base64,${b64}'; });
    const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0);
    return ${J(pts)}.map((p) => { const d = g.getImageData(Math.round(p.x) - 2, Math.round(p.y) - 2, 5, 5).data; const m = [0, 0, 0]; for (let k = 0; k < d.length; k += 4) { m[0] += d[k]; m[1] += d[k + 1]; m[2] += d[k + 2]; } return m.map((v) => Math.round(v / 25)); }); })()`);
  // a press only where the writer could press: the target hit-testable at its centre
  const press = async (sel) => {
    const hit = `(() => { const e = document.querySelector(${J(sel)}); if (!e || e.disabled) return false; const r = e.getBoundingClientRect(); if (!r.width) return false; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === e || e.contains(h)); })()`;
    if (!(await waitSoft(hit, { label: 'hit-testable ' + sel, timeout: 6000 }))) return false;
    const at = await q(`(() => { const r = document.querySelector(${J(sel)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y); await sleep(600);
    return true;
  };
  // a page made through the app's seams while on the Desk, its plain settings keys written, then opened by a reload
  const openPage = async ({ theme = 'plateau', tone = 'dark', mode = 'journal', text = '', room = null, settings = {}, goal = null, w = 1366, h = 768 }) => {
    await app.emulateDpr(1, w, h);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); true");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
    await splash();
    const pid = `census-${id}-${Date.now()}-${seq += 1}`;
    await q(`window.wrizoCreateJournalPage(${J({ id: pid, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    if (goal) await q(`window.wrizoSetWritingGoal(${J(goal)}); true`);
    await sleep(500);
    await q(`(() => { localStorage.setItem('wrizo-theme', ${J(theme)}); localStorage.setItem('wrizo-theme-prefs', ${J(JSON.stringify({ voice: 'serif', page: tone, fade: 'on' }))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, ${J(settings)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.setItem(${J(`wrizo-mode-page-${pid}`)}, ${J(mode)}); return true; })()`);
    await q(`history.replaceState(null, '', ${J(`/#/page/${pid}`)})`);
    await app.reload();
    const up = await waitSoft("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'the page' });
    await splash();
    if (room) await q(`document.documentElement.setAttribute('data-room', ${J(room)}); true`);
    await sleep(1600);
    return up ? pid : null;
  };
  // the pointer moves, as a writer's hand does: the chrome comes back (Flux's Free Write hides it altogether)
  const wake = async () => { for (let i = 0; i < 12; i += 1) { await app.mouseMove(40 + i * 30, 200 + (i % 4) * 25); await sleep(60); } await sleep(700); };
  return { app, q, waitSoft, splash, shot, patches, press, openPage, wake, frames };
}

export async function census(id, scenario) {
  let out = null;
  try {
    const { withHarness } = await import('../../runtime-verify.mjs');
    await withHarness(async (app) => { const k = kit(app, id); out = await scenario(k); out.frames = out.frames || k.frames; return []; }, { label: `census-${id}` });
  } catch (e) { out = { result: CANT, why: `the scenario threw: ${String(e && e.message).slice(0, 400)}`, readings: out && out.readings }; }
  finish(id, out);
}
