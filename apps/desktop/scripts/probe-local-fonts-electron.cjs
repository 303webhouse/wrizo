// ITEM 207b S0 PROBE (Electron 31, the shipped shell) - needs a box turn (it opens a hidden window).
//   Run: node_modules/.bin/electron apps/desktop/scripts/probe-local-fonts-electron.cjs     (from the worktree; a display is required)
// QUESTION: does `queryLocalFonts` work in the app's own Electron, and what does its PERMISSION handling do?
// The shipped main process (src/main.ts) installs NO permission handler. This probe runs the same call under the two
// configurations that matter and prints one JSON line per case, then exits:
//   A  no handler at all                  (exactly what ships today)
//   B  a handler that records the permission name it is asked for, and DENIES it (what a locked-down app would do)
//   C  a handler that records the name and ALLOWS it
// The recorded name answers whether Electron 31 even asks for a `local-fonts` permission - the thing the design left unmeasured.
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CODE = `(async () => {
  const r = { api: typeof window.queryLocalFonts === 'function', secure: window.isSecureContext, origin: location.origin, protocol: location.protocol };
  if (!r.api) return r;
  try { const t = performance.now(); const f = await window.queryLocalFonts(); r.ok = true; r.faces = f.length; r.families = new Set(f.map(x => x.family)).size; r.ms = Math.round(performance.now() - t); }
  catch (e) { r.ok = false; r.error = e && e.name; r.message = String(e && e.message).slice(0, 140); }
  return r;
})()`;

async function runCase(label, configure) {
  console.log(JSON.stringify({ case: label, status: 'starting' }));
  // A file PER CASE (reusing one path across windows hit an intermittent ERR_FAILED(-2) on the second load, likely a
  // Windows file-handle race with the previous window's teardown) - and awaited via 'did-finish-load' rather than
  // trusting loadFile()'s own promise alone, which resolved before the renderer was actually ready to run script.
  const html = path.join(os.tmpdir(), `wrizo-207b-probe-${label}.html`);
  fs.writeFileSync(html, '<!doctype html><meta charset="utf-8"><title>probe</title><body>probe</body>');
  const ses = session.fromPartition('probe-' + label + '-' + Date.now());
  const asked = [];
  configure(ses, asked);
  const win = new BrowserWindow({ show: false, webPreferences: { session: ses, nodeIntegration: false, contextIsolation: true } });
  await new Promise((resolve, reject) => {
    win.webContents.once('did-finish-load', resolve);
    win.webContents.once('did-fail-load', (_e, code, desc) => reject(new Error(`did-fail-load ${code} ${desc}`)));
    win.loadFile(html).catch(reject);
  });
  let result;
  try { result = await win.webContents.executeJavaScript(CODE, true); }   // userGesture = true: queryLocalFonts needs transient activation
  catch (e) { result = { thrown: String(e && e.message).slice(0, 160) }; }
  console.log(JSON.stringify({ case: label, electron: process.versions.electron, chrome: process.versions.chrome, asked, result }));
  win.destroy();
  await new Promise((r) => setTimeout(r, 150));
  try { fs.unlinkSync(html); } catch { /* best-effort cleanup */ }
}

process.on('uncaughtException', (e) => console.log(JSON.stringify({ fatal: 'uncaughtException', message: String(e && e.message).slice(0, 300) })));
process.on('unhandledRejection', (e) => console.log(JSON.stringify({ fatal: 'unhandledRejection', message: String(e && e.message).slice(0, 300) })));
app.on('render-process-gone', (_e, _wc, details) => console.log(JSON.stringify({ fatal: 'render-process-gone', details })));
app.on('child-process-gone', (_e, details) => console.log(JSON.stringify({ fatal: 'child-process-gone', details })));
// Between cases every window is briefly destroyed with none open yet — without this, Electron (off macOS) quits the
// whole app the instant the window count hits zero, which is exactly what silently killed cases B and C.
app.on('window-all-closed', () => {});

app.whenReady().then(async () => {
  let exitCode = 0;
  for (const [label, configure] of [
    ['A-no-handler', () => {}],
    ['B-handler-denies', (ses, asked) => ses.setPermissionRequestHandler((_wc, permission, cb) => { asked.push(permission); cb(false); })],
    ['C-handler-allows', (ses, asked) => ses.setPermissionRequestHandler((_wc, permission, cb) => { asked.push(permission); cb(true); })],
  ]) {
    try { await runCase(label, configure); }
    catch (e) { console.log(JSON.stringify({ case: label, threw: String(e && e.message).slice(0, 200) })); exitCode = 1; }
  }
  app.exit(exitCode);
});
