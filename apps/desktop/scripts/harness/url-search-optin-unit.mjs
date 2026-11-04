// url-search-optin-unit.mjs - BROWSERLESS proof that WS_URL_SEARCH is opt-in and leaves an untouched harness file exactly as it was
// (Fable, Nov 4: "harness-only and opt-in ... with a check proving an untouched file is unaffected"). No browser, no box turn.
//   U1  with WS_URL_SEARCH unset, the driver's runtime-verify.mjs is origin/main's byte for byte once the opt-in is read as its unset value:
//       remove the opt-in's declaration block and write '/' for every ${URL_SEARCH} - the result must equal the merge base's file exactly.
//   U2  the unset value IS '/': the declaration evaluated with an empty environment gives '/', so `${base}${URL_SEARCH}#x` === `${base}/#x`.
//   U3  every page the driver opens goes through the opt-in: no `${base}/#` is left, and the three opens (goto, the reset, the launch) use it.
//   U4  liveness: set, it does reach the URL - '?arbor2=1' and '/?arbor2=1' both give '/?arbor2=1' (a check that cannot fail is not run).
//   U5  nothing opts in by accident: no harness or frames file sets WS_URL_SEARCH (only this proof names it).
// Run: node apps/desktop/scripts/harness/url-search-optin-unit.mjs  ->  "URL-SEARCH-OPTIN VERIFY: PASS (n checks)" or FAIL with the numbers.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const RV = path.resolve(here, '..', 'runtime-verify.mjs');
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); };
const norm = (s) => s.split('\r\n').join('\n');

const now = norm(fs.readFileSync(RV, 'utf8'));
const DECL = /\/\/ WS_URL_SEARCH \(opt-in[^\n]*\n\/\/[^\n]*\nconst URL_SEARCH = ([^\n]*);\n\n/;
const m = now.match(DECL);
ok('U0 the opt-in declaration is found (the proof reads the real file)', !!m);

// U1: against the merge base with main (the file as every other lane has it)
let base = null;
try {
  const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
  const mb = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: repo, encoding: 'utf8' }).trim();
  base = norm(execFileSync('git', ['show', `${mb}:apps/desktop/scripts/runtime-verify.mjs`], { cwd: repo, encoding: 'utf8', maxBuffer: 64 << 20 }));
} catch (e) { ok('U1 the merge base\'s runtime-verify.mjs could be read', false, String(e.message || e).slice(0, 200)); }
if (base != null && m) {
  const unset = now.replace(DECL, '').split('${URL_SEARCH}').join('/');
  const same = unset === base;
  let where = '';
  if (!same) { const a = unset.split('\n'), b = base.split('\n'); const i = a.findIndex((l, k) => l !== b[k]); where = `first difference at line ${i + 1}: ${JSON.stringify((a[i] || '').slice(0, 90))} vs ${JSON.stringify((b[i] || '').slice(0, 90))}`; }
  ok('U1 unset, the driver is the merge base\'s file byte for byte', same, same ? `${base.length} chars identical` : where);
}

// U2 / U4: the declaration's own expression, evaluated
const evalWith = (env) => (m ? new Function('process', `return ${m[1]};`)({ env }) : undefined);
const unsetVal = evalWith({}), emptyVal = evalWith({ WS_URL_SEARCH: '' });
ok('U2 unset (and empty) give "/" - so ${base}${URL_SEARCH}#x === ${base}/#x', unsetVal === '/' && emptyVal === '/', JSON.stringify({ unsetVal, emptyVal }));
const a1 = evalWith({ WS_URL_SEARCH: '?arbor2=1' }), a2 = evalWith({ WS_URL_SEARCH: '/?arbor2=1' });
ok('U4 liveness: set, the query reaches the URL', a1 === '/?arbor2=1' && a2 === '/?arbor2=1', JSON.stringify({ a1, a2 }));

// U3: every open goes through it
const left = (now.match(/\$\{base\}\/#/g) || []).length;
const uses = (now.match(/\$\{base\}\$\{URL_SEARCH\}#/g) || []).length;
ok('U3 every page the driver opens takes the opt-in (none left at ${base}/#; goto, reset and launch use it)', left === 0 && uses === 3, JSON.stringify({ left, uses }));

// U5: no file opts in by accident
const scripts = path.resolve(here, '..');
const hits = [];
const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); } else if (/\.(mjs|js|sh|yml)$/.test(e.name) && p !== RV && p !== fileURLToPath(import.meta.url) && fs.readFileSync(p, 'utf8').includes('WS_URL_SEARCH')) hits.push(path.relative(scripts, p)); } };
walk(scripts);
ok('U5 no harness or frames file sets WS_URL_SEARCH (nothing opts in by accident)', hits.length === 0, hits.join(', ') || 'none');

const failed = results.filter((r) => !r.pass).length;
console.log(`URL-SEARCH-OPTIN VERIFY: ${failed ? `FAIL - ${failed}/${results.length} failed` : `PASS (${results.length} checks)`}`);
process.exit(failed ? 1 : 0);
