// TYPEWRITER GLIDE - THE KEYBOARD CANCELS IT (Fable, Oct 31, ledger 166 review of 85412cd8).
// The history glide (useTypewriterFade) excuses ONE scroll that is not where it left the box: a drop to the very top, because the editor's re-render of a typed line
// clamps scrollTop to 0 and the glide rides that out to its absolute target. A REAL Ctrl+Home (or a PageUp from within a page of the top, or an ArrowUp run to line 1)
// is also a drop to the top - so the engine must tell them apart: a key that moves the view is the writer's scroll, and the writer STAYS where the key put them.
// Three scenarios, each on a fresh page with a backlog gliding (the same 30 lines + typed burst as tw-glide-measure.mjs); the key is sent mid-glide:
//   K1  Ctrl+Home      - the view goes to the top and stays there
//   K2  PageUp         - the view goes up a page (from within a page of the top: the clamp's case) and stays
//   K3  ArrowUp x 70   - the caret runs up to the first lines, the view follows, and stays
// "Stays" = from 300 ms after the key to 1.5 s, scrollTop never rises above where the box was at 300 ms (+2 px) - i.e. the glide did not drag the writer back down.
// Run: node scripts/harness/typewriter-glide-keys.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 30 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the history that rides up into the page.`).join('\n');
const rec = [];
const ok = (name, pass, detail) => rec.push({ name, pass: !!pass, detail });

// CDP's own key events carry no editing command of their own for these (Chromium resolves Ctrl+Home / PageUp to MoveToBeginningOfDocument / MovePageUp in the
// browser process, which an injected event bypasses): `commands` names it, exactly as a real press resolves. The keydown (key: 'Home' / 'PageUp') the page sees is a real one.
const KEYS = {
  K1: { label: 'Ctrl+Home', key: 'Home', code: 'Home', vk: 36, modifiers: 2, times: 1, commands: ['moveToBeginningOfDocument'] },
  K2: { label: 'PageUp', key: 'PageUp', code: 'PageUp', vk: 33, modifiers: 0, times: 1, commands: ['movePageUp'] },
  K3: { label: 'ArrowUp x 70', key: 'ArrowUp', code: 'ArrowUp', vk: 38, modifiers: 0, times: 70 },
};

await withHarness(async (app) => {
  const press = async (k) => {
    const p = { key: k.key, code: k.code, windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk, modifiers: k.modifiers, ...(k.commands ? { commands: k.commands } : {}) };
    for (let i = 0; i < k.times; i += 1) {
      await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    }
  };

  for (const [id, k] of Object.entries(KEYS)) {
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
    // type until a glide is IN FLIGHT with the view off the top (the last of step/land is a step; scrollTop past 100): the key lands on a travelling glide
    const inflight = `(() => { const T = window.__wzTwTrace || []; let last = null; for (let i = T.length - 1; i >= 0; i -= 1) if (T[i].d === 'step' || T[i].d === 'land') { last = T[i].d; break; }
      return { gliding: last === 'step', top: document.querySelector('.mode-scroll').scrollTop }; })()`;
    // is "Line 01" (the first line of the page) inside the window? (the scroller's own box is not the viewport on this page, so the window is the measure)
    const line1 = `(() => { const ed = document.querySelector('${ED}'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const i = n.nodeValue.indexOf('Line 01'); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 7); const b = r.getBoundingClientRect();
        return { top: Math.round(b.top), visible: b.top >= 0 && b.bottom <= window.innerHeight }; } } return null; })()`;
    let top0 = 0; let gliding = false;
    for (let i = 1; i <= 8; i += 1) {
      await app.typeKeys(`\nAnd the writer goes on, line ${i} of the new ones.`);
      const s = await app.evalJs(inflight);
      top0 = s.top; gliding = s.gliding;
      if (gliding && top0 > 100) break;
      await sleep(60);
    }
    await app.evalJs(`(() => { const sc = document.querySelector('.mode-scroll'); window.__tws = []; window.__twsOn = true; window.__twt0 = performance.now();
      // frames AND scroll events: the browser's scroll for a key lands between frames, and a glide that resets it sets it again before the next frame's sample -
      // a 'scroll' event is dispatched with the box where the key left it
      sc.addEventListener('scroll', () => { if (window.__twsOn) window.__tws.push([Math.round(performance.now() - window.__twt0), sc.scrollTop, 'scroll']); }, { passive: true });
      const tick = () => { if (!window.__twsOn) return; window.__tws.push([Math.round(performance.now() - window.__twt0), sc.scrollTop]); requestAnimationFrame(tick); }; requestAnimationFrame(tick); return true; })()`);
    const trace0 = await app.evalJs('(window.__wzTwTrace || []).length');
    const tPress = await app.evalJs('Math.round(performance.now() - window.__twt0)');
    const before = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
    await press(k);
    await sleep(300);
    const tMark = await app.evalJs('Math.round(performance.now() - window.__twt0)');
    const settled = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
    const line1At300 = await app.evalJs(line1);
    await sleep(1500);
    const line1End = await app.evalJs(line1);
    // reached = the lowest scrollTop any frame saw from the press on (where the KEY took the view, even if a glide then dragged it back);
    // settled = the box 300 ms after the key; max/end = after that, to 1.5 s
    const r = await app.evalJs(`(() => { window.__twsOn = false; const all = window.__tws.filter((x) => x[0] >= ${tPress}); const s = window.__tws.filter((x) => x[0] >= ${tMark});
      const T = (window.__wzTwTrace || []).slice(${trace0});
      return { reached: Math.min(...all.map((x) => x[1])), max: Math.max(...s.map((x) => x[1])), end: s.length ? s[s.length - 1][1] : null, frames: s.length,
        aborts: T.filter((e) => e.d === 'abort').length, lands: T.filter((e) => e.d === 'land').length }; })()`);
    const browserPos = settled;
    const detail = JSON.stringify({ top0, gliding, before: Math.round(before), settled: Math.round(settled), line1At300, line1End, ...r });
    const sinceMax = r.max;
    ok(`${id} (premise): a glide was IN FLIGHT with the view off the top (scrollTop > 100) when ${k.label} was pressed`, gliding && top0 > 100, detail);
    const stays = sinceMax <= browserPos + 2 && r.end <= browserPos + 2;
    if (id === 'K1' || id === 'K3') {
      ok(`${id}: ${k.label} mid-glide takes the writer to the TOP of the page (line 1 in view at 300 ms) and the glide does NOT drag them back down (line 1 still in view, box unmoved, at 1.5 s)`,
        !!(line1At300 && line1At300.visible && line1End && line1End.visible) && stays, detail);
    } else {
      ok(`${id}: ${k.label} mid-glide moves the view up (${Math.round(before)} -> ${Math.round(browserPos)}) and the glide does NOT drag the writer back down (still there, box unmoved, at 1.5 s)`,
        browserPos < before - 50 && stays, detail);
    }
  }
});

for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
const pass = rec.length > 0 && rec.every((c) => c.pass);
console.log(`TYPEWRITER-GLIDE-KEYS VERIFY: ${pass ? 'PASS' : 'FAIL'} (${rec.filter((c) => c.pass).length}/${rec.length})`);
process.exit(pass ? 0 : 1);
