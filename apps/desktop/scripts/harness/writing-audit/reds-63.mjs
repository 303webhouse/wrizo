// RED-FIRST CHECK for #63 and #51 (no page-turn animation in any theme): 14 lines in Draft, then Shift+Enter four times so the text crosses the sheet's height (about 16 lines): the page turns.
// While it does (and for a second after), the page's own animation must not run: the page element never carries the `flipping` class, no animation named mode-flip is ever running on any element, and the page's rectangle
// (top, height, width), sampled on every frame, stays where it was (the old animation moved it up to 7 px and shrank it for half a second).
// RED on main today (the flip animation plays); GREEN once the animation is gone. The page-turn SOUND is not judged here (reds-63-sound.mjs).
// Run: node scripts/harness/writing-audit/reds-63.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-63.mjs; strict)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const NL = String.fromCharCode(10);
let bad = 0;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`RED-63 [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  for (const tw of ['off', 'on']) {
    const fails = [];
    try {
      const text = Array.from({ length: 14 }, (_, i) => `Line ${i + 1}`).join(NL);
      await d.surface('.forward-only-editor', false);
      await d.openPage(text, 'drafting', { typewriter: tw });
      await d.place(text.length); await sleep(tw === 'on' ? 1800 : 500); await d.still();
      // a recorder: every frame for 2.2 s, the page's rectangle, its class, and the animations running anywhere
      await ev(`(() => { const pg = document.querySelector('.mode-page'); window.__r63 = { frames: [], flipping: false, anims: [] }; const t0 = performance.now(); const tick = () => { const b = pg.getBoundingClientRect(); window.__r63.frames.push([Math.round(b.top * 100) / 100, Math.round(b.height * 100) / 100, Math.round(b.width * 100) / 100]); if (pg.classList.contains('flipping')) window.__r63.flipping = true; for (const a of document.getAnimations()) { const n = a.animationName || (a.effect && a.effect.getKeyframes ? 'x' : ''); if (a.animationName === 'mode-flip') window.__r63.anims.push(n); } if (performance.now() - t0 < 2200) requestAnimationFrame(tick); else window.__r63.done = true; }; requestAnimationFrame(tick); return true; })()`);
      for (let i = 0; i < 4; i++) { await d.key('Enter', { shift: true }); await sleep(60); }
      await sleep(2600);
      const r = await ev('window.__r63');
      const f = r.frames;
      const first = f[0] || [0, 0, 0];
      let dev = 0; for (const x of f) dev = Math.max(dev, Math.abs(x[0] - first[0]), Math.abs(x[1] - first[1]), Math.abs(x[2] - first[2]));
      console.log(`NOTE ${TAG} typewriter=${tw}: ${f.length} frames, page rect deviates by at most ${dev.toFixed(2)} px; flipping class seen: ${r.flipping}; mode-flip animations seen: ${r.anims.length}`);
      if (r.flipping) fails.push('the page element carried the flipping class');
      if (r.anims.length) fails.push('a mode-flip animation ran');
      if (dev > 0.5) fails.push(`the page rectangle moved by ${dev.toFixed(2)} px while the page turned`);
    } catch (e) { fails.push('harness: ' + String((e && e.message) || e).slice(0, 200)); }
    if (fails.length) bad++;
    console.log(`${fails.length ? 'FAIL' : 'PASS'}  page turn without animation, typewriter ${tw} [${TAG}]${fails.length ? ': ' + fails.join(' || ') : ''}`);
  }
});
console.log(`RED-63 [${TAG}] ${bad ? `FAIL - ${bad}` : 'PASS'}`);
process.exit(bad ? 1 : 0);
