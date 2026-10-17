// Builds a DIAGNOSTIC COPY of resume-on-open.mjs with three fixture repairs and nothing else (this desk; INK's file is untouched):
//   (1) before E3's coldBoot(2500): location.hash = '#/'   (E2 leaves the born page open, so the reload is a deep link)
//   (2) before E6's coldBoot: location.hash = '#/'          (E5 leaves a deep-linked page open)
//   (3) activeTab waits 1200 ms before reading             (the strip paints its active class a beat after the address settles)
// Usage: node mkpatched.mjs <src> <dst>. Prints each replacement's count; exits 1 if any did not land exactly once.
import { readFileSync, writeFileSync } from 'node:fs';
const [src, dst] = process.argv.slice(2);
let t = readFileSync(src, 'utf8');
const crlf = t.includes('\r\n');
const reps = [
  ["await app.evalJs(\"window.wrizoRecordLastPlace('test-user', 'page', 'roo-a')\");\n    await coldBoot(2500);",
   "await app.evalJs(\"window.wrizoRecordLastPlace('test-user', 'page', 'roo-a')\");\n    await app.evalJs(\"location.hash = '#/'\"); await sleep(400);\n    await coldBoot(2500);"],
  ["const activeTab = () => app.evalJs(\"document.querySelector('.desk-mode-tab.active')?.textContent || null\");",
   "const activeTab = async () => { await sleep(1200); return app.evalJs(\"document.querySelector('.desk-mode-tab.active')?.textContent || null\"); };"],
];
if (crlf) t = t.replace(/\r\n/g, '\n');
let bad = 0;
for (const [a, b] of reps) { const n = t.split(a).length - 1; console.log(`replacement x${n}: ${a.slice(0, 70).replace(/\n/g, ' ')}...`); if (n !== 1) bad++; t = t.replace(a, b); }
// E6: find the board scenario's coldBoot and put the hash reset in front of it
const i6 = t.indexOf('// ---- E6: a board');
const j6 = t.indexOf('await coldBoot(', i6);
if (i6 < 0 || j6 < 0) { console.log('E6 coldBoot not found'); bad++; } else { t = t.slice(0, j6) + "await app.evalJs(\"location.hash = '#/'\"); await sleep(400);\n    " + t.slice(j6); console.log('E6 hash reset inserted'); }
if (crlf) t = t.replace(/\n/g, '\r\n');
writeFileSync(dst, t);
console.log(bad ? 'FAILED' : 'OK');
process.exit(bad ? 1 : 0);
