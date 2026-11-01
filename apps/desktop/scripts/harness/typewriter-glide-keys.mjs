// TYPEWRITER GLIDE - THE KEYBOARD CANCELS IT (Fable, Oct 31, ledger 166 review of 85412cd8).
// The history glide (useTypewriterFade) excuses ONE scroll that is not where it left the box: a DROP TO THE VERY TOP, because the editor's re-render of a typed line clamps
// scrollTop to 0 and the glide rides that out to its absolute target. A real Ctrl+Home / PageUp / ArrowUp run can land the box on the top too - so the engine must tell them
// apart: a view key is the writer's scroll, and the writer STAYS where the key put them. The browser names no such scroll (no wheel, touch or press), so the engine listens
// for the key itself (VIEW_KEYS in useTypewriterFade).
// Each scenario: the 30-line page, a typed burst until a glide is IN FLIGHT with the view off the top, then
//   C0  (control) no key; the box is dropped to scrollTop 0 - the re-render's clamp - and the glide RIDES IT OUT to its target (the excuse stands)
//   K1  a Ctrl+Home keydown, then the box lands on the top
//   K2  a PageUp keydown, then the box lands on the top (a page up from within a page of it - the clamp's case)
//   K3  an ArrowUp keydown, then the box lands on the top
// and the box is watched for 150 ms: K1-K3 it STAYS at the top (never above 2 px: the glide is cancelled), C0 it is carried back to where the glide was going.
// The key and the landing are STAGED together, in one page task: a keydown event (dispatched from the editor; the engine reads only its `key`) and, straight after it, the caret to the
// start of the page and scrollTop = 0 - what a real Ctrl+Home / PageUp run does, with nothing in between. A TRUSTED key through CDP was tried and cannot be staged this way: its own scroll is
// smooth and geometry-dependent (Ctrl+Home on this page reveals the caret at scrollTop ~169, not 0), it deviates the box from the glide's last write BEFORE any landing (so even the old engine
// cancelled on that deviation), and the editor's own caret reset races it. What reaches ONLY the drop-to-the-top excuse is the box landing on <= 1 with nothing before it - which is staged here.
// Run: node scripts/harness/typewriter-glide-keys.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 30 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the history that rides up into the page.`).join('\n');
const rec = [];
const ok = (name, pass, detail) => rec.push({ name, pass: !!pass, detail });

const SCENARIOS = {
  C0: { label: 'no key (the re-render clamp)', key: null },
  K1: { label: 'Ctrl+Home', key: { key: 'Home', ctrl: true } },
  K2: { label: 'PageUp', key: { key: 'PageUp' } },
  K3: { label: 'ArrowUp', key: { key: 'ArrowUp' } },
};

await withHarness(async (app) => {
  // a glide is IN FLIGHT when the engine's last step/land is a STEP issued within the last 100 ms (a glide is 160 ms; a step that no land followed is not enough - in steady typing
  // each step replaces the last glide before it lands)
  const inflight = `(() => { const T = window.__wzTwTrace || []; let last = null; for (let i = T.length - 1; i >= 0; i -= 1) if (T[i].d === 'step' || T[i].d === 'land') { last = T[i]; break; }
    return { gliding: !!last && last.d === 'step' && performance.now() - last.t < 100, top: document.querySelector('.mode-scroll').scrollTop }; })()`;

  for (const [id, sc] of Object.entries(SCENARIOS)) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 15000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    // read once, when the hook mounts; every event is stamped with the page clock (window.__twt0 below) so the engine's decisions can be lined up with the key and the drop
    await app.evalJs("(() => { const a = []; a.push = function (e) { e.t = Math.round(performance.now()); return Array.prototype.push.call(this, e); }; window.__wzTwTrace = a; return true; })()");
    await app.evalJs("location.hash = '#/page/twf'");
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
    await sleep(600);
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
    // the sampler (frames), and the DROP: the box lands on the top (what a key's scroll, or the re-render's clamp, does). It runs IN THE PAGE - for a key, a task after its keydown;
    // for the control, called at once - so it lands while the glide is still travelling (a glide is 160 ms; every round trip from here costs a good part of that). It records
    // whether a glide was in flight at that instant (the last of step/land in the engine's trace is a step) and where the box was.
    await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); window.__tws = []; window.__twsOn = true; window.__twt0 = performance.now(); window.__dropInfo = null;
      const tick = () => { if (!window.__twsOn) return; window.__tws.push([Math.round(performance.now() - window.__twt0), sc.scrollTop]); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
      window.__drop = () => { if (window.__dropInfo) return; const T = window.__wzTwTrace || []; let last = null; for (let i = T.length - 1; i >= 0; i -= 1) if (T[i].d === 'step' || T[i].d === 'land') { last = T[i]; break; }
        if (window.__armKey) { const ed = document.querySelector('${ED}'); const n = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT).nextNode(); const q = document.createRange(); q.setStart(n, 0); q.collapse(true); const g = getSelection(); g.removeAllRanges(); g.addRange(q); }
        window.__dropInfo = { t: Math.round(performance.now() - window.__twt0), gliding: !!last && last.d === 'step' && performance.now() - last.t < 160, age: last ? Math.round(performance.now() - last.t) : null, top: sc.scrollTop, n: T.length }; sc.scrollTop = 0; };
      // the key, then the landing, in ONE task: the engine sees a view key's keydown and, at its next look, the box on the top
      window.__fireKey = (key, ctrl) => { window.__keyN = (window.__wzTwTrace || []).length; window.__armKey = key; document.querySelector('${ED}').dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: !!ctrl, bubbles: true, cancelable: true })); window.__drop(); };
      return true; })()`);
    // type, a character at a time, until a glide is IN FLIGHT with the view off the top (the last of step/land is a step; scrollTop past 100) - then send the key at once
    let s0 = { gliding: false, top: 0 };
    // two lines of it: the engine's catch-up steps are capped at 2 lines (train-12i), so the view climbs a little slower, and one line was sometimes spent before scrollTop passed 100
    const sentence = `${String.fromCharCode(10)}And the writer goes on, line after line, with the history riding up into the page.`;
    const text = sentence + sentence;
    for (const ch of text) {
      await app.typeKeys(ch);
      s0 = await app.evalJs(inflight);
      if (s0.gliding && s0.top > 100) break;
    }
    await app.evalJs(sc.key ? `window.__fireKey(${JSON.stringify(sc.key.key)}, ${!!sc.key.ctrl})` : 'window.__drop()');
    await sleep(150);   // short on purpose: ~200 ms on, the EDITOR's own re-render puts the caret back at the end of the text and the engine follows it (correctly)
    const r = await app.evalJs(`(() => { window.__twsOn = false; const d = window.__dropInfo || { t: 0, gliding: false, top: 0, n: 0 }; const s = window.__tws.filter((x) => x[0] > d.t + 40); const T = (window.__wzTwTrace || []).slice(window.__keyN != null ? window.__keyN : d.n);
      return { drop: d, max: s.length ? Math.max(...s.map((x) => x[1])) : null, end: s.length ? s[s.length - 1][1] : null, frames: s.length, aborts: T.filter((e) => e.d === 'abort').length,
        lands: T.filter((e) => e.d === 'land').length, events: T.slice(0, 5), around: (window.__wzTwTrace || []).filter((e) => e.t > window.__twt0 + d.t - 250 && e.t < window.__twt0 + d.t + 120).map((e) => e.d + '@' + Math.round(e.t - window.__twt0 - d.t)), frames20: window.__tws.filter((x) => x[0] >= d.t - 30).slice(0, 14).map((x) => x[0] - d.t + ':' + Math.round(x[1])) }; })()`);
    const detail = JSON.stringify(r);
    const topBefore = r.drop.top;
    ok(`${id} (premise): a glide was IN FLIGHT with the view off the top (scrollTop > 100) when ${sc.label} landed the box on the top`, r.drop.gliding && topBefore > 100, detail);
    if (sc.key) {
      ok(`${id}: ${sc.label} mid-glide is the WRITER's scroll - the box STAYS on the top (never above 2 px for the 150 ms after), the glide is cancelled and does not drag the writer back down`,
        r.max <= 2 && r.end <= 2 && r.aborts >= 1, detail);
    } else {
      ok(`${id} (control): with NO key, the drop to the top is the re-render's clamp - the glide rides it out and carries the box back (it ends well off the top)`,
        r.end > 20 && r.aborts === 0, detail);
    }
  }
});

for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
const pass = rec.length > 0 && rec.every((c) => c.pass);
console.log(`TYPEWRITER-GLIDE-KEYS VERIFY: ${pass ? 'PASS' : 'FAIL'} (${rec.filter((c) => c.pass).length}/${rec.length})`);
process.exit(pass ? 0 : 1);
