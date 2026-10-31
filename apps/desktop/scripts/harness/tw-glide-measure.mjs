// TYPEWRITER GLIDE - MEASURE (Fable, Oct 31, ledger 166). Not a verdict file: it MEASURES how long the typewriter's history glide takes to settle after a
// burst of typing, so the box and a hosted runner can be compared and the glide's cap checked. Same page and same typing as typewriter-fade.mjs.
// It prints one line, `TW-GLIDE: settleMs=<n> ...`, and EXITS 0 unless the glide outlasts GLIDE_CAP_MS (the ruled duration, below) - which is the claim.
// Run: node scripts/harness/tw-glide-measure.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 30 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the history that rides up into the page.`).join('\n');
// the RULED duration (Oct 31; useTypewriterFade BACKLOG_CAP_MS): the glide of a burst's history finishes within this of the last keystroke, whatever the frame pacing or machine load
const GLIDE_CAP_MS = 1000;
let line = 'TW-GLIDE: NO RESULT';
let pass = false;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs('window.__wzTwTrace = []');   // read once, when the hook mounts
  await app.evalJs("location.hash = '#/page/twf'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(600);
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
  // a sampler: scrollTop on every animation frame, stamped with the page clock
  await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); window.__tws = []; window.__twsOn = true;
    const tick = () => { if (!window.__twsOn) return; window.__tws.push([Math.round(performance.now()), sc.scrollTop]); requestAnimationFrame(tick); }; requestAnimationFrame(tick); return true; })()`);
  for (let i = 1; i <= 8; i += 1) { await app.typeKeys(`\nAnd the writer goes on, line ${i} of the new ones.`); await sleep(120); }
  const lastKey = await app.evalJs('Math.round(performance.now())');
  await sleep(14000);
  const r = await app.evalJs(`(() => { window.__twsOn = false; const s = window.__tws; const T = window.__wzTwTrace || [];
    const n = {}; for (const e of T) n[e.d] = (n[e.d] || 0) + 1;
    let lastMove = 0; for (let i = 1; i < s.length; i += 1) if (Math.abs(s[i][1] - s[i - 1][1]) > 0.5) lastMove = s[i][0];
    const end = s.length ? s[s.length - 1][1] : null;
    const frames = s.length; const span = s.length > 1 ? s[s.length - 1][0] - s[0][0] : 0;
    return { lastMove, end, frames, fps: span ? Math.round(frames * 1000 / span) : null, trace: n, steps: T.filter((e) => e.d === 'step').length }; })()`);
  if (process.env.WS_TW_TRACE === '1') console.log('TW-TRACE: ' + JSON.stringify(await app.evalJs('window.__wzTwTrace')));
  const settleMs = r.lastMove - lastKey;
  // and it ARRIVED: the old engine left this fixture at scrollTop 995 (box and Actions); a glide that finishes early at the wrong place is not a glide that finished
  pass = settleMs <= GLIDE_CAP_MS && r.end >= 950;
  line = `TW-GLIDE: settleMs=${settleMs} (cap ${GLIDE_CAP_MS}) scrollTopEnd=${r.end} frames=${r.frames} fps=${r.fps} steps=${r.steps} trace=${JSON.stringify(r.trace)}`;
});
console.log(line);
console.log(pass ? 'TW-GLIDE VERIFY: PASS' : 'TW-GLIDE VERIFY: FAIL');
process.exit(pass ? 0 : 1);
