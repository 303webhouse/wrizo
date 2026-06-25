// Runtime UI verification harness (dependency-free — Node built-ins only).
//
// Why this exists: the W2 login gate (apiMe() -> LoginScreen in App.tsx) means
// the static `dist-web` bundle can't reach any screen without a running /auth
// server. To verify any UI ticket at runtime (J3, J4, J5, D-stream, future
// surfaces) we drive the REAL rendered bundle with a tiny auth/sync test-double
// so the production renderer mounts, then automate it over the Chrome DevTools
// Protocol using headless Edge/Chrome. No added dependencies — uses only
// node:http, node:child_process, global WebSocket (Node 22+), and a Chromium
// browser already installed on the machine. Stays inside the §8 allowlist.
//
// Usage as a library (per-ticket verification script):
//
//   import { withHarness } from './runtime-verify.mjs';
//   const results = await withHarness(async (app) => {
//     await app.freshSprint();                 // clean storage -> authed launcher -> scratch sprint
//     await app.setText('Hello world.');       // React-safe textarea input
//     await app.click('Finish');               // click a button/link by visible text
//     const entries = await app.localJSON('writer-studio-journal-entries');
//     return entries;
//   });
//
// Run the built-in self-test (proves the harness end-to-end):
//
//   pnpm --filter @writer-studio/desktop build:web
//   node apps/desktop/scripts/runtime-verify.mjs --selftest
//
// The auth/sync double returns an empty sync pull, so it never mutates the
// records the app writes locally — what you read back is the app's own state.

import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIST = path.resolve(HERE, '..', 'dist-web');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

// Common Chromium locations per platform; first existing one wins. Override
// with the CLAUDE_VERIFY_BROWSER env var (absolute path to an executable).
const BROWSER_CANDIDATES = {
  win32: [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ],
  darwin: [
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/microsoft-edge', '/usr/bin/google-chrome',
    '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ],
};

function findBrowser() {
  if (process.env.CLAUDE_VERIFY_BROWSER && existsSync(process.env.CLAUDE_VERIFY_BROWSER)) {
    return process.env.CLAUDE_VERIFY_BROWSER;
  }
  for (const p of BROWSER_CANDIDATES[process.platform] || []) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'No Chromium browser found. Install Edge or Chrome, or set CLAUDE_VERIFY_BROWSER to its path.',
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- static server + auth/sync test-double --------------------------------
function startServer(dist) {
  const sendJson = (res, obj) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const server = http.createServer(async (req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    // Auth/sync double: let the real renderer past the W2 login gate. Empty
    // sync pull = no-op, so it never touches records the app writes locally.
    if (p === '/auth/me' || p.startsWith('/auth/')) {
      return sendJson(res, { id: 'test-user', email: 'tester@example.com' });
    }
    if (p === '/api/sync') {
      return sendJson(res, { serverTime: new Date(0).toISOString(), pull: {} });
    }
    const rel = p === '/' || p === '' ? '/index.html' : p;
    const file = path.join(dist, rel);
    if (file.startsWith(dist) && existsSync(file) && !file.endsWith(path.sep)) {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      return res.end(body);
    }
    // SPA fallback (hash routing rarely needs it, but harmless).
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(await readFile(path.join(dist, 'index.html')));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// --- browser process + DevTools endpoint ----------------------------------
function killBrowser(proc, udd) {
  // Headless Edge/Chrome reparents its renderer/gpu/utility processes, so
  // taskkill on the spawn pid alone leaves zombies. Kill the spawn tree AND any
  // browser process sharing our unique --user-data-dir (matched by basename, so
  // the user's own browser is never touched).
  const tag = path.basename(udd);
  try {
    if (process.platform === 'win32') {
      try { execFileSync('taskkill', ['/pid', String(proc.pid), '/t', '/f'], { stdio: 'ignore' }); } catch {}
      try {
        execFileSync('powershell.exe', ['-NoProfile', '-Command',
          `Get-CimInstance Win32_Process -Filter "Name='msedge.exe' or Name='chrome.exe'" | ` +
          `Where-Object { $_.CommandLine -like '*${tag}*' } | ` +
          `ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }`,
        ], { stdio: 'ignore' });
      } catch {}
    } else if (proc && !proc.killed) {
      proc.kill('SIGKILL');
    }
  } catch {
    // best-effort teardown
  }
}

async function removeDir(dir) {
  for (let i = 0; i < 5; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return; } catch {}
    await sleep(150);
  }
}

function launchBrowser(browser, udd, url) {
  const proc = spawn(browser, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking',
    `--user-data-dir=${udd}`, '--remote-debugging-port=0', url,
  ], { stdio: 'ignore' });
  return proc;
}

async function readCdpPort(udd) {
  const portFile = path.join(udd, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    if (existsSync(portFile)) {
      const first = readFileSync(portFile, 'utf8').split('\n')[0].trim();
      if (first) return Number(first);
    }
    await sleep(100);
  }
  throw new Error('Browser never wrote DevToolsActivePort');
}

async function pageWsUrl(cdpPort) {
  for (let i = 0; i < 100; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(100);
  }
  throw new Error('CDP page target never appeared');
}

// --- minimal CDP client ----------------------------------------------------
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const evWaiters = [];
  let msgId = 0;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
      return;
    }
    if (m.method) {
      for (let i = evWaiters.length - 1; i >= 0; i--) {
        if (evWaiters[i].method === m.method) {
          evWaiters[i].resolve(m.params);
          evWaiters.splice(i, 1);
        }
      }
    }
  };
  const ready = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const cdp = (method, params = {}) => {
    const id = ++msgId;
    return new Promise((resolve, reject) => {
      pending.set(id, (m) => (m.error ? reject(new Error(method + ': ' + JSON.stringify(m.error))) : resolve(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
  const waitEvent = (method, timeout = 8000) =>
    new Promise((resolve) => {
      const w = { method, resolve };
      evWaiters.push(w);
      setTimeout(() => {
        const i = evWaiters.indexOf(w);
        if (i >= 0) { evWaiters.splice(i, 1); resolve(null); }
      }, timeout);
    });
  return { ws, ready, cdp, waitEvent };
}

// Page-side helpers injected into every fresh document.
const PAGE_HELPERS = `
window.__diag = () => ({
  href: location.href,
  buttons: [...document.querySelectorAll('button, a, [role=button]')].map(b => b.textContent.trim()).filter(Boolean),
  body: (document.body ? document.body.innerText : '').slice(0, 300),
});
window.__click = (label) => {
  const els = [...document.querySelectorAll('button, a, [role=button]')];
  const el = els.find(x => x.textContent.trim() === label) || els.find(x => x.textContent.includes(label));
  if (!el) throw new Error('clickable not found: ' + label + ' :: have [' + els.map(x => x.textContent.trim()).filter(Boolean).join(' | ') + ']');
  el.click();
  return true;
};
window.__setText = (text, sel) => {
  const el = document.querySelector(sel || 'textarea');
  if (!el) throw new Error('element not found: ' + (sel || 'textarea') + '; diag=' + JSON.stringify(window.__diag()));
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return el.value;
};
`;

// --- the harness facade given to scenario code ----------------------------
function makeApp(base, cdp, waitEvent) {
  const evalJs = async (expression) => {
    const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('page eval: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const injectHelpers = () => evalJs(PAGE_HELPERS);

  const app = {
    base,
    evalJs,
    /** Re-inject page helpers (call after a full reload). */
    injectHelpers,
    /** Click a button/link/role=button by exact-then-substring visible text. */
    click: (label) => evalJs(`__click(${JSON.stringify(label)})`),
    /** Set a React-controlled input/textarea's value (selector defaults to 'textarea'). */
    setText: (text, sel) => evalJs(`__setText(${JSON.stringify(text)}, ${sel ? JSON.stringify(sel) : 'undefined'})`),
    /**
     * Dispatch a genuine PEN pointer sequence (down → moves → up) over a
     * selector's bounding box via CDP Input, so the page sees real
     * PointerEvents with pointerType === 'pen' (not synthetic). `points` are
     * normalized 0..1 within the element box; an optional per-point `p` becomes
     * pointer pressure (CDP `force`). This is what makes pen-vs-touch routing
     * verifiable on real input.
     */
    penStroke: async (selector, points, { pressure = 0.5 } = {}) => {
      const rect = await evalJs(
        `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('penStroke: no element ' + ${JSON.stringify(selector)}); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`,
      );
      const at = (np) => ({ x: rect.x + np.x * rect.w, y: rect.y + np.y * rect.h, f: np.p ?? pressure });
      const pen = (type, q) => cdp('Input.dispatchMouseEvent', {
        type, x: q.x, y: q.y, button: 'left',
        buttons: type === 'mouseReleased' ? 0 : 1,
        clickCount: 1, pointerType: 'pen', force: type === 'mouseReleased' ? 0 : q.f,
      });
      await pen('mousePressed', at(points[0]));
      for (let i = 1; i < points.length; i++) await pen('mouseMoved', at(points[i]));
      await pen('mouseReleased', at(points[points.length - 1]));
    },
    /**
     * Emulate a HiDPI device (devicePixelRatio) so canvas/backing-store sizing
     * can be verified the way real tablets/phones hit it — headless defaults to
     * dpr 1, which hides replaced-element canvas sizing bugs.
     */
    emulateDpr: (dpr, width = 1024, height = 1400) =>
      cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false }),
    /**
     * Type text into the currently-focused editable element via CDP, driving
     * the real beforeinput/input pipeline (so contenteditable handlers fire as
     * for a genuine keypress run). Focus the target first.
     */
    type: (text) => cdp('Input.insertText', { text }),
    /**
     * Type via real per-character key events (keyDown with a `text` field +
     * keyUp), which trigger the full keydown→beforeinput→input pipeline. More
     * faithful than insertText for custom contenteditable editors where
     * insertText may not dispatch beforeinput. Focus the target first.
     */
    typeKeys: async (text) => {
      for (const ch of text) {
        const isEnter = ch === '\n';
        const key = isEnter ? 'Enter' : ch;
        const code = ch === ' ' ? 'Space'
          : isEnter ? 'Enter'
          : /[a-zA-Z]/.test(ch) ? 'Key' + ch.toUpperCase()
          : /[0-9]/.test(ch) ? 'Digit' + ch
          : 'Unidentified';
        await cdp('Input.dispatchKeyEvent', { type: 'keyDown', text: isEnter ? '\r' : ch, key, code });
        await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
      }
    },
    /**
     * Press a single key (down+up) via CDP — e.g. 'Backspace', 'Delete',
     * 'Enter'. Used to prove the forward-only permanence rail blocks erasure.
     */
    key: async (key) => {
      const vk = { Backspace: 8, Delete: 46, Enter: 13, Tab: 9 }[key] || 0;
      const p = { key, code: key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
      await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      await cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
    },
    /**
     * Dispatch a TOUCH drag (pointerType === 'touch') over a selector's box via
     * CDP Input — a resting palm / finger. Used to prove palm rejection: the
     * pen handler ignores it and, because the canvas is pass-through, it falls
     * to the page.
     */
    touchDrag: async (selector, points) => {
      const rect = await evalJs(
        `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('touchDrag: no element ' + ${JSON.stringify(selector)}); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`,
      );
      const at = (np) => ({ x: rect.x + np.x * rect.w, y: rect.y + np.y * rect.h });
      const touch = (type, q) => cdp('Input.dispatchTouchEvent', { type, touchPoints: q ? [{ x: q.x, y: q.y }] : [] });
      await touch('touchStart', at(points[0]));
      for (let i = 1; i < points.length; i++) await touch('touchMove', at(points[i]));
      await touch('touchEnd', null);
    },
    /** Parse a localStorage key as JSON (null if absent). */
    localJSON: async (key) => {
      const raw = await evalJs(`localStorage.getItem(${JSON.stringify(key)})`);
      return raw ? JSON.parse(raw) : null;
    },
    /** Poll a boolean JS expression until true (or throw on timeout). */
    waitFor: async (expr, { timeout = 6000, label = expr } = {}) => {
      for (let i = 0; i < timeout / 100; i++) {
        if (await evalJs(`!!(${expr})`)) return;
        await sleep(100);
      }
      throw new Error('waitFor timed out: ' + label + '; diag=' + JSON.stringify(await evalJs('__diag()')));
    },
    /** Hard reload and wait for the load event + helpers. */
    reload: async () => {
      const loaded = waitEvent('Page.loadEventFired');
      await cdp('Page.reload', {});
      await loaded;
      await sleep(150);
      await injectHelpers();
    },
    /** Navigate to a hash route (same-document; helpers persist). */
    goto: async (hash) => {
      await cdp('Page.navigate', { url: `${base}/#${hash.replace(/^#/, '')}` });
      await sleep(200);
    },
    /**
     * Writer Studio convenience: clear all local data, land on a deterministic
     * first-run authed launcher, then click into a fresh scratch sprint. The
     * sprint surface is the forward-only editor (CW2) — drive it with
     * typeKeys/key after focusing it; the old setText (textarea .value) won't
     * register on the contenteditable.
     */
    freshSprint: async () => {
      await cdp('Page.navigate', { url: `${base}/#/` });
      await sleep(200);
      await evalJs('localStorage.clear()');
      await app.reload();
      await app.waitFor("[...document.querySelectorAll('button,a')].some(b=>b.textContent.includes('Start writing'))", { label: 'launcher Start writing' });
      await app.click('Start writing');
      await app.waitFor("document.querySelector('.forward-only-editor, textarea')", { label: 'sprint writing surface' });
      await injectHelpers();
    },
  };
  return app;
}

/**
 * Boot the harness, run `scenario(app)`, and tear everything down. Returns
 * whatever the scenario returns. Throws if boot fails; scenario errors
 * propagate after cleanup.
 */
export async function withHarness(scenario, opts = {}) {
  const dist = opts.dist || DEFAULT_DIST;
  if (!existsSync(path.join(dist, 'index.html'))) {
    throw new Error(`No built bundle at ${dist}. Run: pnpm --filter @writer-studio/desktop build:web`);
  }
  const browserPath = findBrowser();
  const udd = path.join(os.tmpdir(), `ws-runtime-verify-${process.pid}`);

  const { server, port } = await startServer(dist);
  const base = `http://127.0.0.1:${port}`;
  let proc;
  let ws;
  try {
    proc = launchBrowser(browserPath, udd, `${base}/#/`);
    const cdpPort = await readCdpPort(udd);
    const wsUrl = await pageWsUrl(cdpPort);
    const conn = connect(wsUrl);
    ws = conn.ws;
    await conn.ready;
    await conn.cdp('Page.enable');
    await conn.cdp('Runtime.enable');
    const app = makeApp(base, conn.cdp, conn.waitEvent);
    // Wait for the first authed render, then inject helpers.
    await app.injectHelpers().catch(() => {});
    return await scenario(app);
  } finally {
    try { ws && ws.close(); } catch {}
    killBrowser(proc, udd);
    await sleep(300);
    await removeDir(udd);
    server.close();
  }
}

// --- built-in self-test (also a template for ticket scenarios) ------------
async function selfTest() {
  const checks = [];
  const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
  await withHarness(async (app) => {
    // Boot reaches the authed launcher (past the W2 gate).
    await app.reload();
    await app.waitFor("[...document.querySelectorAll('button,a')].some(b=>b.textContent.includes('Start writing'))", { label: 'launcher' });
    ok('boots past the W2 login gate to the launcher', true);

    // Drive a scratch sprint end to end and read back the app's own state.
    // The surface is the forward-only editor (CW2): focus + type real keys.
    await app.freshSprint();
    ok('reaches a scratch sprint writing surface', true);
    await app.evalJs("(document.querySelector('.forward-only-editor, textarea')||{}).focus && document.querySelector('.forward-only-editor, textarea').focus()");
    await app.typeKeys('Harness self-test sentence. ');
    await app.click('Finish');
    await app.waitFor("!!localStorage.getItem('writer-studio-journal-entries')", { label: 'journal write' });
    const entries = (await app.localJSON('writer-studio-journal-entries')) || [];
    const live = entries.filter((e) => !e.deletedAt);
    ok('a finished sprint commits one live journal entry', live.length === 1, `live=${live.length}`);
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(checks, null, 2));
  const pass = checks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(pass ? '\nSELFTEST: PASS' : '\nSELFTEST: FAIL');
  process.exit(pass ? 0 : 1);
}

// Run the self-test when invoked directly with --selftest.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--selftest')) {
  selfTest().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('SELFTEST ERROR:', err.stack || err.message);
    process.exit(1);
  });
}
