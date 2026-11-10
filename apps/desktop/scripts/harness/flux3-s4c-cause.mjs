// THROWAWAY (never merged): who removes the compile layer after the Esc tap.
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LINE = ' and the corridor keeps going forward with more plain words now, on and on across the measure of the page until it wraps again and again, line after line';
const HOOK = `(() => { window.__rm = []; const log = (k, t) => { try { if (t && t.nodeType === 1 && (t.hasAttribute('data-flux3-compile') || t.classList.contains('flux3-compile-word') || t.classList.contains('flux3-compile-row') || t.querySelector && t.querySelector('[data-flux3-compile]'))) window.__rm.push({ k, at: Math.round(performance.now()), cls: t.className, stack: String(new Error().stack).split('\n').slice(2, 8).join(' | ') }); } catch (e) {} };
  const rc = Node.prototype.removeChild; Node.prototype.removeChild = function (c) { log('removeChild', c); return rc.call(this, c); };
  const rm = Element.prototype.remove; Element.prototype.remove = function () { log('remove', this); return rm.call(this); };
  const rcs = Element.prototype.replaceChildren; Element.prototype.replaceChildren = function (...a) { try { [...this.children].forEach((c) => log('replaceChildren', c)); } catch (e) {} return rcs.apply(this, a); }; })();`;
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  const id = `cause-${Date.now()}`;
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'An older line.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await ev(`localStorage.setItem('wrizo-ambiance-dial', '50'); localStorage.removeItem('wrizo-mode-page-${id}'); history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000 });
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
  await sleep(1500);
  for (const ch of LINE + LINE + LINE) { await app.typeKeys(ch); await sleep(22); }
  await app.mouseMove(8, 8);
  for (let i = 0; i < 60; i += 1) { await sleep(100); if ((await ev("document.querySelectorAll('[data-flux3-compile] .flux3-compile-row').length")) >= 2) break; }
  await ev(HOOK);
  await ev("window.__upAt = null; addEventListener('keyup', (e) => { if (e.key === 'Escape') window.__upAt = Math.round(performance.now()); }, true); true");
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(60);
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(1500);
  console.log('CAUSE ' + JSON.stringify(await ev('({ up: window.__upAt, rm: window.__rm.slice(0, 6), overlay: document.querySelectorAll(\'[data-flux3-compile]\').length })')));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); process.exit(1); }
console.log('CAUSE DONE');
