// THE AUDIT'S DRIVER (writing audit, session 1): everything that touches the browser, over the harness facade (scripts/runtime-verify.mjs, untouched). Real trusted key events (CDP Input.dispatchKeyEvent -
// the browser's own input layer, as a writer's keyboard), real viewport, the app's own seeding seams (window.wrizoCreateJournalPage - never raw storage, AGENTS.md "HOW TO SEED A FIXTURE").
// No account, no secrets: the harness serves dist-web with its in-process auth double.
import fs from 'node:fs';
import path from 'node:path';
import { probeInstall } from './probe.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };

// theme -> the localStorage value the app reads, and the URL flag that turns that theme's redesign ON
export const THEMES = {
  plateau: { label: 'arbor', flag: 'arbor2' },
  flux: { label: 'flux', flag: 'flux3' },
  machina: { label: 'machina', flag: 'machina2' },
};

const VK = { Enter: 13, Backspace: 8, Delete: 46, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, PageUp: 33, PageDown: 34, Tab: 9, Escape: 27 };
const PUNCT = { ' ': ['Space', 32], '.': ['Period', 190], ',': ['Comma', 188], "'": ['Quote', 222], '?': ['Slash', 191], '!': ['Digit1', 49], ';': ['Semicolon', 186], ':': ['Semicolon', 186], '"': ['Quote', 222] };
const mods = ({ shift, ctrl, alt }) => (alt ? 1 : 0) | (ctrl ? 2 : 0) | (shift ? 8 : 0);

function charInfo(ch) {
  if (/[a-z]/i.test(ch)) return { code: 'Key' + ch.toUpperCase(), vk: ch.toUpperCase().charCodeAt(0) };
  if (/[0-9]/.test(ch)) return { code: 'Digit' + ch, vk: ch.charCodeAt(0) };
  const p = PUNCT[ch];
  return p ? { code: p[0], vk: p[1] } : { code: 'Unidentified', vk: 0 };
}

export function makeDriver(app, cfg) {
  const ev = (js) => app.evalJs(js);
  const errors = [];
  app.tap((method, p) => {
    if (method === 'Runtime.consoleAPICalled' && p && p.type === 'error') errors.push('console.error: ' + (p.args || []).map((a) => (a.value !== undefined ? String(a.value) : a.description || '')).join(' ').slice(0, 300));
    else if (method === 'Runtime.exceptionThrown' && p && p.exceptionDetails) errors.push('exception: ' + ((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text || '').slice(0, 300));
  });
  let n = 0;
  const PROBE = `(${probeInstall.toString()})()`;
  const waitFor = (expr, label, timeout = 12000) => app.waitFor(expr, { timeout, label });

  const d = {
    errors,
    cfg,
    ev,
    async boot() {
      await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
      await app.emulateDpr(1, cfg.width, cfg.height);
      await app.goto('/');
      await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50');
        localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme', ${JSON.stringify(cfg.theme)});
        { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(cfg.tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); }`);
      if (cfg.flag === 'on') await ev(`history.replaceState(null, '', '/?${THEMES[cfg.theme].flag}=1#/')`);
      await app.reload();
      await waitFor("!!document.querySelector('.wz-arrival')", 'the Desk', 20000);
      await waitFor("!document.querySelector('.wz-splash')", 'splash gone', 20000).catch(() => {});
      await ev(PROBE);
    },
    /** a fresh page holding `text`, opened in `mode` ('drafting' = Draft, 'journal' = Free Write, 'revise'), the editor mounted and its rows in place */
    async openPage(text, mode = 'drafting', opts = {}) {
      const id = `wa-${Date.now().toString(36)}-${++n}`;
      const row = { id, text, createdAt: new Date().toISOString(), origin: 'journal', source: 'page' };
      await ev(`location.hash = '#/'`);
      await sleep(150);
      await ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
      await ev(`localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)})`);
      if (opts.typewriter === 'on' || opts.typewriter === 'off') await ev(`localStorage.setItem('wrizo-typewriter-page-${id}', ${JSON.stringify(opts.typewriter)})`);
      await ev(`location.hash = '#/page/${id}'`);
      await waitFor(`!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')`, 'the editor', 15000);
      await waitFor(`window.__wa && window.__wa.read().text === ${JSON.stringify(text)}`, 'the editor holds the seeded text', 8000);
      await waitFor("!document.querySelector('.wz-splash')", 'splash gone', 8000).catch(() => {});
      await sleep(350);
      await d.still();
      d.errors.length = 0;
      return id;
    },
    read: () => ev('window.__wa.read()'),
    /** wait until the page's rect and the scroll position have not changed for `quiet` consecutive looks (cap `capMs`): the Typewriter glides, the page eases in; a read in the middle is a read of the animation */
    async still(capMs = 3000, quiet = 3, gapMs = 150) {
      const key = (r) => JSON.stringify([r.page, r.scroll && r.scroll.top, r.scroll && r.scroll.win, r.tw]);
      let last = null, same = 0; const t0 = Date.now();
      while (Date.now() - t0 < capMs) {
        const k = key(await d.read());
        same = k === last ? same + 1 : 0; last = k;
        if (same >= quiet) return Date.now() - t0;
        await sleep(gapMs);
      }
      return -1;
    },
    /** the native caret as PAINTED, from screenshots (the caret blinks, so up to `tries` looks, 100 ms apart):
     *  1. the forced-magenta caret (probe.arm); 2. if the colour cannot be forced (run 42918956962: nothing magenta in 8 looks), the caret by DIFFERENCE - the same frame with and without the selection
     *  (removeAllRanges, then the selection is put back exactly where it was). `via` says which found it; null if neither ever does. */
    async pixelCaret(tries = 6) {
      await ev('window.__wa.arm()');
      for (let i = 0; i < tries; i++) {
        const shot = await app.cdp('Page.captureScreenshot', { format: 'png' });
        const r = await ev(`window.__wa.scan(${JSON.stringify(shot.data)})`);
        if (r) return { ...r, via: 'color', tries: i + 1 };
        await sleep(100);
      }
      const at = await ev('(() => { const r = window.__wa.read(); return { a: r.anchor, f: r.focus }; })()');
      if (at.a === null) return null;
      for (let i = 0; i < tries; i++) {
        const A = await app.cdp('Page.captureScreenshot', { format: 'png' });
        await ev('window.__wa.clear()');
        await sleep(60);
        const B = await app.cdp('Page.captureScreenshot', { format: 'png' });
        await ev(`window.__wa.place(${at.a}, ${at.f})`);
        const r = await ev(`window.__wa.diff(${JSON.stringify(A.data)}, ${JSON.stringify(B.data)})`);
        if (r && r.width <= 8) return { ...r, via: 'diff', tries: tries + i + 1 };
        await sleep(100);
      }
      return null;
    },
    stops: () => ev('window.__wa.stops()'),
    /** a real mouse click (count 2 = double, 3 = triple) at viewport (x, y) */
    async click(x, y, count = 1) {
      const base = { x, y, button: 'left', pointerType: 'mouse' };
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0, pointerType: 'mouse' });
      for (let i = 1; i <= count; i++) {
        await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', ...base, buttons: 1, clickCount: i });
        await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base, buttons: 0, clickCount: i });
      }
    },
    /** press at (x0, y0), move in steps, release at (x1, y1) */
    async drag(x0, y0, x1, y1, steps = 8) {
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: y0, buttons: 0, pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
      for (let i = 1; i <= steps; i++) await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps, buttons: 1, button: 'left', pointerType: 'mouse' });
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: y1, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
    },
    box: (p) => ev(`window.__wa.boxAt(${p})`),
    place: (a, f) => ev(`window.__wa.place(${a}, ${f === undefined ? 'undefined' : f})`),
    dom: (len = 500) => ev(`window.__wa.dom(${len})`),
    /** two animation frames: what the browser and React do in answer to a keystroke before the next paint */
    frames: () => ev('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))'),

    async key(key, { shift = false, ctrl = false, alt = false } = {}) {
      const m = mods({ shift, ctrl, alt });
      if (key === 'Enter') {
        await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r', modifiers: m });
        await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, modifiers: m });
        return;
      }
      if (VK[key]) {
        const p = { key, code: key, windowsVirtualKeyCode: VK[key], nativeVirtualKeyCode: VK[key], modifiers: m };
        await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
        await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
        return;
      }
      // a letter with a modifier (Ctrl+A, Ctrl+Z ...): a trusted combo, no text
      const { code, vk } = charInfo(key);
      const p = { key: shift ? key.toUpperCase() : key.toLowerCase(), code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: m };
      await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    },
    /** type characters one real key at a time ('\n' is an Enter) */
    async type(s, gapMs = 12) {
      for (const ch of s) {
        if (ch === '\n') { await d.key('Enter'); }
        else {
          const { code, vk } = charInfo(ch);
          const upper = ch !== ch.toLowerCase();
          await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text: ch, unmodifiedText: ch, modifiers: upper ? 8 : 0 });
          await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: upper ? 8 : 0 });
        }
        if (gapMs) await sleep(gapMs);
      }
    },
    async perform(st) {
      if (st.k === 'type') return d.type(st.s, st.gap ?? 12);
      if (st.k === 'key') return d.key(st.key, st);
      if (st.k === 'place') { const ok = await d.place(st.a, st.f); if (!ok) throw new Error('place failed'); return; }
      throw new Error('driver: unknown step ' + JSON.stringify(st));
    },
    async shot(name) {
      if (!cfg.out) return null;
      try {
        const dir = path.join(cfg.out, 'shots'); fs.mkdirSync(dir, { recursive: true });
        const f = path.join(dir, name.replace(/[^A-Za-z0-9._-]+/g, '_') + '.png');
        fs.writeFileSync(f, Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
        return f;
      } catch { return null; }
    },
  };
  return d;
}
