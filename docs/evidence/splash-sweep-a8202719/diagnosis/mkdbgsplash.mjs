// Builds a DIAGNOSTIC COPY of splash.mjs that logs the page state right after openAppThemed(flux) at S12, before the failing waitFor (this desk; the original file is untouched).
// Usage: node mkdbgsplash.mjs <src> <dst>. Exits 1 if the insertion point is not found exactly once.
import { readFileSync, writeFileSync } from 'node:fs';
const [src, dst] = process.argv.slice(2);
let t = readFileSync(src, 'utf8');
const crlf = t.includes('\r\n'); if (crlf) t = t.replace(/\r\n/g, '\n');
const marker = "    await app.waitFor(\"!!document.querySelector('.wz-splash')\", { label: `S12 settle (${theme})` });";
const n = t.split(marker).length - 1;
console.log('insertion points:', n);
if (n !== 1) process.exit(1);
const dbg = `    for (const ms of [0, 150, 600, 1500]) { await new Promise((r) => setTimeout(r, ms === 0 ? 0 : ms)); console.log('S12DBG ' + JSON.stringify({ theme, ms, state: await app.evalJs(\`(() => ({ splash: !!document.querySelector('.wz-splash'), holdAttr: document.documentElement.dataset.splashHold ?? null, dataTheme: document.documentElement.getAttribute('data-theme'), ls: Object.keys(localStorage), ss: Object.keys(sessionStorage), hash: location.hash, body: document.body.innerText.slice(0, 60), api: !!window.wrizoTheme }))()\`) })); }
`;
t = t.replace(marker, dbg + marker);
if (crlf) t = t.replace(/\n/g, '\r\n');
writeFileSync(dst, t); console.log('written');
