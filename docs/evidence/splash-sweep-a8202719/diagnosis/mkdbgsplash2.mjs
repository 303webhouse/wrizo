// DIAGNOSTIC COPY #2 of splash.mjs (this desk; original untouched): times openAppThemed's reload() and logs the splash state at the instant it returns, for EVERY call (S12 included), plus what the previous step left behind.
// Usage: node mkdbgsplash2.mjs <src> <dst>
import { readFileSync, writeFileSync } from 'node:fs';
const [src, dst] = process.argv.slice(2);
let t = readFileSync(src, 'utf8');
const crlf = t.includes('\r\n'); if (crlf) t = t.replace(/\r\n/g, '\n');
const marker = "  await app.reload();\n};\n\nconst splashState";
const n = t.split(marker).length - 1; console.log('insertion points:', n); if (n !== 1) process.exit(1);
const repl = "  const __t0 = Date.now();\n  await app.reload();\n  const __dt = Date.now() - __t0;\n  console.log('RELOADDBG ' + JSON.stringify({ theme, reloadMs: __dt, splashAtReturn: await app.evalJs(\"!!document.querySelector('.wz-splash')\") }));\n};\n\nconst splashState";
t = t.replace(marker, repl);
if (crlf) t = t.replace(/\n/g, '\r\n');
writeFileSync(dst, t); console.log('written');
