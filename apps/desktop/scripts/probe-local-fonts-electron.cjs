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

const html = path.join(os.tmpdir(), 'wrizo-207b-probe.html');
fs.writeFileSync(html, '<!doctype html><meta charset="utf-8"><title>probe</title><body>probe</body>');

const CODE = `(async () => {
  const r = { api: typeof window.queryLocalFonts === 'function', secure: window.isSecureContext, origin: location.origin, protocol: location.protocol };
  if (!r.api) return r;
  try { const t = performance.now(); const f = await window.queryLocalFonts(); r.ok = true; r.faces = f.length; r.families = new Set(f.map(x => x.family)).size; r.ms = Math.round(performance.now() - t); }
  catch (e) { r.ok = false; r.error = e && e.name; r.message = String(e && e.message).slice(0, 140); }
  return r;
})()`;

async function runCase(label, configure) {
  const ses = session.fromPartition('probe-' + label + '-' + Date.now());
  const asked = [];
  configure(ses, asked);
  const win = new BrowserWindow({ show: false, webPreferences: { session: ses, nodeIntegration: false, contextIsolation: true } });
  await win.loadFile(html);
  let result;
  try { result = await win.webContents.executeJavaScript(CODE, true); }   // userGesture = true: queryLocalFonts needs transient activation
  catch (e) { result = { thrown: String(e && e.message).slice(0, 160) }; }
  console.log(JSON.stringify({ case: label, electron: process.versions.electron, chrome: process.versions.chrome, asked, result }));
  win.destroy();
}

app.whenReady().then(async () => {
  await runCase('A-no-handler', () => {});
  await runCase('B-handler-denies', (ses, asked) => ses.setPermissionRequestHandler((_wc, permission, cb) => { asked.push(permission); cb(false); }));
  await runCase('C-handler-allows', (ses, asked) => ses.setPermissionRequestHandler((_wc, permission, cb) => { asked.push(permission); cb(true); }));
  app.quit();
});
