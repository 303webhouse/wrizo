// ARBOR - THE DARK-TYPEWRITER GLITCH, CAPTURED (Fable, Nov 8, ruling 3: "Capture the dark-Typewriter glitch now (log the page transform at
// rest/typing on a long page). If the zoom drops to none on a page-turn, it's #51 (INK's S4 TERM-ZOOM notes) -> FIX; else report what it is.")
// As named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor2-tw51.mjs), both page tones.
//   tw51-flag   the walked app under ?arbor2=1     tw51-plain   the same page with the flag OFF (the control: #51 would be in every theme)
// A long page opens in Free Write (Typewriter's zoom); a frame sampler (requestAnimationFrame, reads only: computed transform and rects) runs
// while the page sits at rest, then while Enter is typed until the page turns (ModeStage's pagination adds .flipping to .mode-page).
// It logs, per phase: the page's scale (the transform's matrix a), the frames at scale 1 while zoomed, the frames with .flipping, and under the
// flag the Arbor sheet's width against the page's (paper.ts re-measures every 300 ms). A CAPTURE, not a check: it prints its verdict line
// ("ARBOR-TW51 <screen> {...}", is51 true/false) and throws only when it is blind (no zoom, no turn, no frames).
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-TW51 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-TW51-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const LINE = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const LONG = Array.from({ length: 14 }, (_, i) => `${i + 1}. ${LINE}`).join('\n');
const key = async (app, k, code, vk, text) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text, unmodifiedText: text } : {}) });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};
const caretEnd = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()";
// the sampler: every frame, the page's scale and rect, its .flipping class, and the Arbor sheet's rect when one is drawn
const SAMPLER = `(() => { window.__tw = []; window.__twPhase = 'rest'; window.__twOn = true;
  const step = (t) => { if (!window.__twOn) return;
    const p = document.querySelector('.mode-page'), col = p && p.closest('.mode-pagecol');
    if (p) { const tf = getComputedStyle(p).transform, m = /matrix\\(([^,]+)/.exec(tf), r = p.getBoundingClientRect();
      const k = document.querySelector('.arbor2-paper[data-on="true"]'), kr = k ? k.getBoundingClientRect() : null;
      window.__tw.push({ t: Math.round(t), ph: window.__twPhase, zoom: col ? col.getAttribute('data-zoom') === 'true' : false, flip: p.classList.contains('flipping'),
        tf: tf === 'none' ? 'none' : (m ? Math.round(Number(m[1]) * 1000) / 1000 : tf.slice(0, 40)), w: Math.round(r.width), top: Math.round(r.top), sheetW: kr ? Math.round(kr.width) : null }); }
    requestAnimationFrame(step); };
  requestAnimationFrame(step); return true; })()`;
const summarise = (rows) => {
  const scale = (r) => (r.tf === 'none' ? 1 : typeof r.tf === 'number' ? r.tf : null);
  const by = (ph) => rows.filter((r) => r.ph === ph);
  const phase = (ph) => { const rs = by(ph), sc = rs.map(scale).filter((v) => v !== null);
    return { frames: rs.length, zoomed: rs.filter((r) => r.zoom).length, scaleMin: sc.length ? Math.min(...sc) : null, scaleMax: sc.length ? Math.max(...sc) : null,
      atOne: rs.filter((r) => r.zoom && scale(r) !== null && Math.abs(scale(r) - 1) < 0.02).length, flipping: rs.filter((r) => r.flip).length,
      flipNone: rs.filter((r) => r.flip && r.tf === 'none').length,
      sheetOff: rs.filter((r) => r.sheetW !== null && Math.abs(r.sheetW - r.w) > 2).length }; };
  // the turn itself: the frames from the first .flipping frame to 200 ms after the last, with the scale, the page width and the sheet's
  const f0 = rows.findIndex((r) => r.flip), f1 = rows.map((r) => r.flip).lastIndexOf(true);
  const win = f0 < 0 ? [] : rows.filter((r) => r.t >= rows[f0].t - 50 && r.t <= rows[f1].t + 200);
  const strip = win.filter((_, i) => i % 3 === 0).map((r) => [r.t - rows[f0].t, r.flip ? 'F' : '-', r.tf, r.w, r.sheetW]);
  return { rest: phase('rest'), typing: phase('typing'), turnMs: f0 < 0 ? null : rows[f1].t - rows[f0].t, strip: strip.slice(0, 40) };
};
const capture = async (app, name, on) => {
  const id = `arbor-tw51-${on ? 'flag' : 'plain'}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: LONG, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?arbor2=1' : '/')} + ${JSON.stringify('#/page/' + id)})`); await app.reload();
  await waitSoft(app, `document.documentElement.getAttribute('data-arbor2') ${on ? "=== 'true'" : '== null'}`, { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 10000 }))) fail(name, { blind: 'no editor' });
  const zoomed = await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 6000 });
  if (!zoomed) fail(name, { blind: 'no Typewriter zoom on the Free Write page' });
  await sleep(1500);   // past the open's own turn (a page longer than one sheet turns once as it mounts)
  const ctx = await app.evalJs(`(() => { const s = document.querySelector('.mode-scroll'), e = document.querySelector('.forward-only-editor');
    return { page: document.documentElement.getAttribute('data-page'), room: document.documentElement.getAttribute('data-arbor2-room'), theme: document.documentElement.getAttribute('data-theme'),
      sheet: s ? s.clientHeight : null, content: e ? e.scrollHeight : null, w: innerWidth }; })()`);
  await app.evalJs(SAMPLER);
  await sleep(1500);   // AT REST
  await app.evalJs("window.__twPhase = 'typing'");
  await app.evalJs(caretEnd); await sleep(200);
  let turned = false, keys = 0;
  for (; keys < 90 && !turned; keys++) {
    await key(app, 'Enter', 'Enter', 13, '\r'); await sleep(70);
    turned = await app.evalJs("window.__tw.some((r) => r.ph === 'typing' && r.flip)");
  }
  for (let i = 0; i < 6; i++) { await key(app, 'a', 'KeyA', 65, 'a'); await sleep(90); }   // a few letters after the turn: the page at rest under typing
  await sleep(900);
  await app.evalJs('window.__twOn = false');
  const rows = await app.evalJs('window.__tw');
  if (!Array.isArray(rows) || rows.length < 20) fail(name, { blind: 'the sampler drew no frames', n: Array.isArray(rows) ? rows.length : null, ...ctx });
  const s = summarise(rows);
  if (!turned) fail(name, { blind: 'no page turn in 90 Enters', keys, ...ctx, rest: s.rest, typing: s.typing });
  // PARKED 2026-11-08 (SUPERSEDED - Actions frames 42535756776, 8 of 8 lines: is51 read FALSE while every strip showed the zoomed page at scale
  // 0.997-1 for ~550 ms of each turn. The premise was wrong: Chrome computes mode-flip's 'none' keyframe as matrix(1, ...), never the string
  // 'none', so flipNone counted nothing; the instrument, not the app). Original, verbatim:
  // // #51 by its own definition: during the turn the zoomed page's transform is 'none' (scale 1), where at rest it is the zoom (~1.6)
  // const is51 = s.typing.flipNone > 0 && s.rest.scaleMin !== null && s.rest.scaleMin > 1.2;
  // say(name, { is51, keys, ...ctx, rest: s.rest, typing: s.typing, turnMs: s.turnMs, strip: s.strip });
  // SUCCESSOR: #51 is the zoom dropping to scale 1 (within .02) on a .flipping frame, where at rest the page is zoomed (> 1.2).
  const atOneFlipping = rows.filter((r) => r.flip && r.zoom && (r.tf === 'none' || (typeof r.tf === 'number' && Math.abs(r.tf - 1) < 0.02))).length;
  const is51 = atOneFlipping > 0 && s.rest.scaleMin !== null && s.rest.scaleMin > 1.2;
  say(name, { is51, atOneFlipping, keys, ...ctx, rest: s.rest, typing: s.typing, turnMs: s.turnMs, strip: s.strip });
};

export default guarded({
  'tw51-flag': async (app) => { await capture(app, 'tw51-flag', true); },
  'tw51-plain': async (app) => { await capture(app, 'tw51-plain', false); },
}, { verdict: ['ARBOR-TW51'] });
