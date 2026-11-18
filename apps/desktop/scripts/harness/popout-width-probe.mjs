// A PROBE, not a check (Fable Nov 18, 1:45 pm: Machina's panel is "the mark's width, 417"): the signed-out splash's mark box in each theme at 1366 and 1920, so the pop-out's width is read from the app, not guessed. Always passes; prints POPOUT-WIDTH lines.
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_ANON ??= '1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
await withHarness(async (app) => {
  for (const theme of ['plateau', 'flux', 'machina']) {
    for (const [w, h] of [[1366, 768], [1920, 1080]]) {
      await app.emulateDpr(1, w, h);
      await app.goto('/');
      await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', '${theme}'); true`);
      await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
      await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
      await sleep(1500);
      const r = await app.evalJs(`(() => { const out = {}; const q = (s) => document.querySelector(s);
        const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, x: Math.round(b.left), y: Math.round(b.top) }; };
        out.theme = document.documentElement.getAttribute('data-theme'); out.arbor = document.documentElement.getAttribute('data-arbor2');
        out.logo = box(q('.wz-logo')); out.mark = box(q('.wz-mark')); out.hero = box(q('.wz-hero')); out.front = box(q('.arbor2-front-mark')); out.tagline = box(q('.wz-tagline'));
        out.svgs = [...document.querySelectorAll('.wz-arrival svg, .wz-arrival img')].slice(0, 6).map((e) => ({ tag: e.tagName, cls: String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className), ...box(e) }));
        out.doors = [...document.querySelectorAll('.wz-arrival button')].map((b) => ({ t: (b.textContent || '').trim(), ...box(b) }));
        return out; })()`);
      console.log(`POPOUT-WIDTH ${theme} ${w} ${JSON.stringify(r)}`);
    }
  }
}, { label: 'popout-width-probe' });
console.log('POPOUT-WIDTH-PROBE VERIFY: PASS (0 checks, a probe)');
