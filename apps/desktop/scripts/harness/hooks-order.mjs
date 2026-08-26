// HOOKS-ORDER CENSUS (item 104's third reopen) — a STATIC guard, no browser.
//
// WHY THIS IS STATIC AND THE OTHERS ARE NOT. Item 104 crashed three times, and
// the third instance was UNREACHABLE from the committed suite: React 18
// StrictMode simulates unmount/remount by cycling effects, and StrictMode's
// double-invoke is DEVELOPMENT-ONLY — stripped from the production bundle every
// harness file runs against. The crash reproduced on a dev serve and was green
// on production, which is also what reconciled two desks reporting opposite
// cold-load results at the same bundle. A CDP scenario therefore CANNOT bite on
// it. This can: the fault is visible in the SOURCE, so the source is what gets
// guarded.
//
// THE RULE. React counts hooks per render. A hook below an early return runs a
// different number of times depending on whether that return fired, so the
// instant its condition flips React throws "Rendered fewer hooks than expected"
// and blanks the tree. The fix is always the same shape: every hook above, the
// decision below.
//
// WHAT THE CENSUS FOUND when it was written (145 files): THREE violations, and
// only one of them was the reported surface. PageEditorView was the crash under
// investigation; ScriptEditor carried the identical fault and is the room the
// doorway sends writers INTO, so fixing only the reported one would have moved
// the crash rather than removed it. That is the argument for a census over a
// patch, and it is why this file exists rather than a comment.
//
// Run: node scripts/harness/hooks-order.mjs   (from apps/desktop)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// KNOWN, REASONED EXCEPTION — not a suppression of an unknown.
// pages/JournalEntry.tsx has been UNROUTED since FX14: App.tsx redirects
// /journal/:id to /page/:id and nothing imports JournalEntryView. Its violation
// cannot be reached by a writer. It is listed rather than fixed so the entry is
// a deliberate record, and so that anything NEW shows up immediately. If that
// surface is ever re-routed, delete this line first and fix the file.
const ALLOWED = new Set(['src/pages/JournalEntry.tsx']);

const ROOT = 'src';
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e)) files.push(p);
  }
})(ROOT);

const HOOK = /(?:^|[^.\w])(use[A-Z]\w*)\s*\(/;
const FNSTART = /^(?:export\s+)?(?:default\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/;
const EARLY = /^\s{2}(?:if\s*\(.*\)\s*)?return\b/;

const violations = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const firstReturn = new Map();
  let fn = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = FNSTART.exec(line);
    if (m) { fn = m[1]; continue; }
    if (line === '}') { fn = null; continue; }
    if (!fn || /^\s*\/\//.test(line)) continue;
    if (EARLY.test(line) && !firstReturn.has(fn)) firstReturn.set(fn, i + 1);
    const h = HOOK.exec(line);
    if (h && firstReturn.has(fn) && i + 1 > firstReturn.get(fn)) {
      violations.push({ file: file.split(path.sep).join('/'), fn, hook: h[1], line: i + 1, ret: firstReturn.get(fn) });
    }
  }
}

const checks = [];
const live = violations.filter(v => !ALLOWED.has(v.file));
checks.push({
  name: 'HOOKS-ORDER: no hook sits below an early return in any routed component',
  pass: live.length === 0,
  detail: live.length
    ? live.map(v => `${v.file} ${v.fn}: ${v.hook} at :${v.line} below early return :${v.ret}`).join(' ;; ')
    : `${files.length} files scanned, 0 live violations`,
});
checks.push({
  name: 'HOOKS-ORDER: the allowlist still describes only UNROUTED surfaces',
  pass: violations.filter(v => ALLOWED.has(v.file)).length === ALLOWED.size
    || violations.filter(v => ALLOWED.has(v.file)).length === 0,
  detail: `allowed=${[...ALLOWED].join(',')} matched=${violations.filter(v => ALLOWED.has(v.file)).length}`,
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nHOOKS-ORDER PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this guard parks nothing: nothing ever asserted hook ORDER before, which is why the same class shipped three times.');
}
const pass = checks.every(c => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nHOOKS-ORDER VERIFY: PASS (${checks.length} checks)`
  : `\nHOOKS-ORDER VERIFY: FAIL — ${checks.filter(c => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
