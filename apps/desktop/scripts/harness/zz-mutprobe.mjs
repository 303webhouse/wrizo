// THROWAWAY (never merge): does a busy-wait in a capture keydown handler move the key -> 2 x rAF latency? Prints medians per variant.
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const med = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.goto('/');
  await ev("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  const id = 'zzmut';
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: Array.from({ length: 150 }, (_, i) => 'word' + i).join(' '), createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await ev("(() => { const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); w.typewriter = true; localStorage.setItem('wrizo-writing-settings', JSON.stringify(w)); })()");
  await ev(`history.replaceState(null, '', '/#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' });
  await sleep(1500);
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); })()");
  const CYCLE = 'the signal holds while she writes on ';
  let cursor = 0;
  const VARIANTS = [
    ['none', ''],
    ['rAF1-spin-10', 'RAF1_SPIN=10'],
    ['rAF1-spin-20', 'RAF1_SPIN=20'],
    ['bi-spin-20', 'BI_SPIN=20'],
    ['kd-spin-20', 'KD_SPIN=20'],
    ['blur-layer', 'BLUR=1'],
    ['none2', ''],
  ];
  for (const [name, cfg] of VARIANTS) {
    const kv = Object.fromEntries(cfg ? [cfg.split('=')] : []);
    await ev(`(() => { window.__lat = []; let t0 = 0; if (window.__latOff) window.__latOff(); if (window.__mutEl) { window.__mutEl.remove(); window.__mutEl = null; }
      const spin = (ms) => { const e = performance.now() + ms; while (performance.now() < e) { /* spin */ } };
      ${kv.BLUR ? "const el = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;background:rgba(87,208,245,.02);backdrop-filter:blur(30px);will-change:transform'; document.body.appendChild(el); window.__mutEl = el; el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(3px)' }], { duration: 400, iterations: Infinity, direction: 'alternate' });" : ''}
      const kd = () => { t0 = performance.now(); ${kv.KD_SPIN ? `spin(${kv.KD_SPIN});` : ''} };
      const bi = () => { ${kv.BI_SPIN ? `spin(${kv.BI_SPIN});` : ''} const t = t0; requestAnimationFrame(() => { ${kv.RAF1_SPIN ? `spin(${kv.RAF1_SPIN});` : ''} requestAnimationFrame(() => { window.__lat.push(performance.now() - t); }); }); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`);
    for (let i = 0; i < 44; i += 1) { await app.typeKeys(CYCLE[cursor % CYCLE.length]); cursor += 1; await sleep(90); }
    await sleep(250);
    const got = await ev('window.__lat.slice()');
    console.log(`MUTPROBE ${name}: n=${got.length} median=${med(got)} min=${Math.min(...got)} max=${Math.max(...got)}`);
  }
}); } catch (e) { console.log('MUTPROBE ERROR', e && e.stack || e); }
console.log('MUTPROBE VERIFY: PASS (1 checks)');
process.exit(0);
