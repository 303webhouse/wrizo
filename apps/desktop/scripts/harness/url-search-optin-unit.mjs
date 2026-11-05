// url-search-optin-unit.mjs - BROWSERLESS proof that WS_URL_SEARCH is opt-in and leaves an untouched harness file exactly as it was
// (Fable, Nov 4: "harness-only and opt-in ... with a check proving an untouched file is unaffected"). No browser, no box turn.
//   U1  with WS_URL_SEARCH unset, the driver's runtime-verify.mjs is origin/main's byte for byte once the opt-in is read as its unset value:
//       remove the opt-in's declaration block and write '/' for every ${URL_SEARCH} - the result must equal the merge base's file exactly.
//       PARKED in r2 (Nov 5; red on main since the merge - there the merge base is main itself). Successor U1b: anchored on the commit that
//       introduced the opt-in - (a) there it changed nothing else, (b) the declaration is still that one, (c) unset, no other use is left;
//       U1L proves U1b can fail.
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

// U1 PARKED (r2, Nov 5) - SUPERSEDED: it compared against the merge base of HEAD and origin/main. On the opt-in's own branch that was main
// without the opt-in; once merged, on main the merge base IS main - the opt-in included - so U1 could never pass there (red on main since
// 650f9a74). Kept verbatim below, not run. Successor: U1b.
// // U1: against the merge base with main (the file as every other lane has it)
// let base = null;
// try {
//   const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
//   const mb = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: repo, encoding: 'utf8' }).trim();
//   base = norm(execFileSync('git', ['show', `${mb}:apps/desktop/scripts/runtime-verify.mjs`], { cwd: repo, encoding: 'utf8', maxBuffer: 64 << 20 }));
// } catch (e) { ok('U1 the merge base\'s runtime-verify.mjs could be read', false, String(e.message || e).slice(0, 200)); }
// if (base != null && m) {
//   const unset = now.replace(DECL, '').split('${URL_SEARCH}').join('/');
//   const same = unset === base;
//   let where = '';
//   if (!same) { const a = unset.split('\n'), b = base.split('\n'); const i = a.findIndex((l, k) => l !== b[k]); where = `first difference at line ${i + 1}: ${JSON.stringify((a[i] || '').slice(0, 90))} vs ${JSON.stringify((b[i] || '').slice(0, 90))}`; }
//   ok('U1 unset, the driver is the merge base\'s file byte for byte', same, same ? `${base.length} chars identical` : where);
// }

// U1b (successor): anchored on the commit that INTRODUCED the opt-in, wherever the proof runs (branch, main, a later train):
//   (a) at that commit, unset, the driver was its parent's file byte for byte - the opt-in, as it came in, changed nothing else;
//   (b) today's declaration is that declaration, unchanged;
//   (c) today, unset, nothing named URL_SEARCH is left - the opt-in has no foothold but its declaration and the opens (U3 counts those).
// With U2 (unset is '/') and U3 (every open takes it), (a)-(c) mean: unset, every URL the driver opens is the one it opened before the opt-in.
const unsetOf = (text) => { const d = text.match(DECL); return d ? text.replace(DECL, '').split('${URL_SEARCH}').join('/') : null; };
const footholdFree = (text, intro) => { const d = text.match(DECL), u = unsetOf(text); return !!d && !!intro && d[0] === intro && u != null && !u.includes('URL_SEARCH'); };
let introDecl = null;
try {
  const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
  const rel = 'apps/desktop/scripts/runtime-verify.mjs';
  const intro = execFileSync('git', ['log', '--reverse', '--format=%H', '-S// WS_URL_SEARCH (opt-in', '--', rel], { cwd: repo, encoding: 'utf8' }).trim().split('\n')[0];
  if (!intro) throw new Error('no commit introduces the opt-in in this history (a shallow clone?)');
  const at = norm(execFileSync('git', ['show', `${intro}:${rel}`], { cwd: repo, encoding: 'utf8', maxBuffer: 64 << 20 }));
  const before = norm(execFileSync('git', ['show', `${intro}^:${rel}`], { cwd: repo, encoding: 'utf8', maxBuffer: 64 << 20 }));
  const d = at.match(DECL); introDecl = d ? d[0] : null;
  const u = unsetOf(at), same = u != null && u === before;
  let where = '';
  if (!same && u != null) { const x = u.split('\n'), y = before.split('\n'); const i = x.findIndex((l, k) => l !== y[k]); where = `first difference at line ${i + 1}: ${JSON.stringify((x[i] || '').slice(0, 90))} vs ${JSON.stringify((y[i] || '').slice(0, 90))}`; }
  ok('U1b(a) at the commit that introduced the opt-in, unset, the driver was its parent\'s file byte for byte', same, same ? `${intro.slice(0, 8)}: ${before.length} chars identical` : `${intro.slice(0, 8)}: ${where || 'no declaration at the introducing commit'}`);
} catch (e) { ok('U1b(a) the introducing commit and its parent could be read', false, String(e.message || e).slice(0, 200)); }
ok('U1b(b) today\'s declaration is the one the opt-in introduced, unchanged', !!m && !!introDecl && m[0] === introDecl, introDecl ? (m && m[0] === introDecl ? 'identical' : 'changed') : 'no introducing declaration');
{ const u = unsetOf(now); ok('U1b(c) today, unset, nothing named URL_SEARCH is left', u != null && !u.includes('URL_SEARCH'), u == null ? 'no declaration' : `${(u.match(/URL_SEARCH/g) || []).length} left`); }
// U1L liveness (a check that cannot fail is not run): the same test REJECTS today's file with a stray use, and with a changed declaration
{
  const stray = now.replace(DECL, (d) => d + 'const STRAY = URL_SEARCH;\n');
  const changed = now.replace(DECL, (d) => d.replace(/;\n\n$/, ' || \'/\';\n\n'));
  const live = footholdFree(now, introDecl) && stray !== now && !footholdFree(stray, introDecl) && changed !== now && !footholdFree(changed, introDecl);
  ok('U1L liveness: U1b passes today\'s file and fails both mutants (a stray use; a changed declaration)', live, JSON.stringify({ today: footholdFree(now, introDecl), stray: footholdFree(stray, introDecl), changed: footholdFree(changed, introDecl) }));
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
