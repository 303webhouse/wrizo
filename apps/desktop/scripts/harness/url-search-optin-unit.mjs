// url-search-optin-unit.mjs - BROWSERLESS proof that WS_URL_SEARCH is opt-in and leaves an untouched harness file exactly as it was
// (Fable, Nov 4: "harness-only and opt-in ... with a check proving an untouched file is unaffected"). No browser, no box turn.
//   U1  with WS_URL_SEARCH unset, the driver's runtime-verify.mjs is origin/main's byte for byte once the opt-in is read as its unset value:
//       remove the opt-in's declaration block and write '/' for every ${URL_SEARCH} - the result must equal the merge base's file exactly.
//       PARKED in r2 (Nov 5; red on main since the merge - there the merge base is main itself). Successor U1b: anchored on the commit that
//       introduced the opt-in - (a) there it changed nothing else, (b) the declaration is still that one, (c) unset, no other use is left;
//       U1L proves U1b can fail.
//   U2  the unset value IS '/': the declaration evaluated with an empty environment gives '/', so `${base}${URL_SEARCH}#x` === `${base}/#x`.
//       [U1b(c), U1L and U2 PARKED Nov 15 - the Arbor pin (Fable's ruling): successors U1b(c2), U1L2, U2b and its liveness U2L]
//       [U1b(c2) and U1L2 PARKED Nov 20 - the Machina pin (Machina's look on by default): successors U1b(c3), U1L3; U2M and its liveness U2ML]
//       [U1b(c3) and U1L3 PARKED Nov 23 - the Flux pin (the redesign on by default): successors U1b(c4), U1L4; U2F and its liveness U2FL]
//   U3  every page the driver opens goes through the opt-in: no `${base}/#` is left, and the three opens (goto, the reset, the launch) use it.
//   U4  liveness: set, it does reach the URL - '?arbor2=1' and '/?arbor2=1' both give '/?arbor2=1' (a check that cannot fail is not run).
//   U5  nothing opts in by accident: no harness or frames file sets WS_URL_SEARCH (only this proof names it).   [PARKED Nov 10 - see U5b]
//   U5b nothing opts in by accident: no harness or frames file SETS WS_URL_SEARCH (an assignment in code, comments stripped); files may READ it
//       (Arbor's pinned files fail when it carries no pin). Coverage printed; MUT-U5b a file that sets it must be caught.
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
// the Machina pin (ARBOR, Nov 20, machina/look; Machina's look on by default, Fable Nov 19): one named block after Arbor's, ending in its one statement and a blank line
const MPIN = /\/\/ MACHINA'S LOOK IS ON BY DEFAULT[^\n]*\n(?:\/\/[^\n]*\n)*\{ const s = process\.env\.WS_URL_SEARCH;[^\n]*\n\n/;
// the Flux pin (INK, Nov 23; the redesign on by default, Fable's 2:30 pm ruling): one named block after Machina's, ending in its one statement and a blank line
const FPIN = /\/\/ THE FLUX REDESIGN IS ON BY DEFAULT[^\n]*\n(?:\/\/[^\n]*\n)*\{ const s = process\.env\.WS_URL_SEARCH;[^\n]*\n\n/;
// the Arbor pin (Nov 15): one named block before the opt-in's comment, ending in its one assignment and a blank line
const PIN = /\/\/ THE ARBOR REDESIGN IS ON BY DEFAULT[^\n]*\n(?:\/\/[^\n]*\n)*if \(!process\.env\.WS_URL_SEARCH && process\.env\.WS_ARBOR2 !== 'default'\) process\.env\.WS_URL_SEARCH = '\?arbor2=0';\n\n/;
ok('U0 the opt-in declaration is found (the proof reads the real file)', !!m);

// ARCHIVED PARK (#13 step 14): archive/url-search-optin-unit.mjs.parked.md record 1

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
// PARKED 2026-11-15 (SUPERSEDED - FABLE RULED, Nov 15, 10:40 pm: the redesign is on by default, and the harness pins today's Arbor (?arbor2=0) for any file that doesn't ask for the redesign - runtime-verify.mjs sets WS_URL_SEARCH to '?arbor2=0' before the opt-in's declaration when no query is named and WS_ARBOR2 is not 'default': the opt-in now has one more foothold, the pin, by ruling). Original, verbatim:
// { const u = unsetOf(now); ok('U1b(c) today, unset, nothing named URL_SEARCH is left', u != null && !u.includes('URL_SEARCH'), u == null ? 'no declaration' : `${(u.match(/URL_SEARCH/g) || []).length} left`); }
// SUCCESSOR U1b(c2): today, unset, nothing named URL_SEARCH is left but the declaration and the ONE ruled foothold, the Arbor pin block
// PARKED 2026-11-20 (ARBOR, machina/look; SUPERSEDED by Machina's look shipping on by default, Fable Nov 19: "Machina's look SHIPS this weekend" - the driver
// carries a SECOND pin block, Machina's (?machina2=0 unless WS_MACHINA2=default), on Arbor's ruled pattern; measured: 6 uses left outside the Arbor block).
// Original, verbatim:
// { const u = unsetOf(now); const p = now.match(PIN); const v = u == null ? null : u.replace(PIN, '');
//   ok('U1b(c2) today, unset, nothing named URL_SEARCH is left but the declaration and the Arbor pin (one block, Fable Nov 15)', !!p && v != null && !v.includes('URL_SEARCH'), v == null ? 'no declaration' : `pin ${!!p}; ${(v.match(/URL_SEARCH/g) || []).length} left`); }
// SUCCESSOR U1b(c3): today, unset, nothing named URL_SEARCH is left but the declaration and the TWO named pin blocks, Arbor's and Machina's (each one block)
// PARKED 2026-11-23 (INK; SUPERSEDED by the Flux pin, Fable Nov 23, 2:30 pm: the driver carries a THIRD pin block, Flux's (?flux3=0 unless WS_FLUX3=default), on Arbor's ruled pattern). Original, verbatim:
// { const u = unsetOf(now); const p = now.match(PIN), q = now.match(MPIN); const v = u == null ? null : u.replace(PIN, '').replace(MPIN, '');
//   ok('U1b(c3) today, unset, nothing named URL_SEARCH is left but the declaration, the Arbor pin and the Machina pin (one block each)', !!p && !!q && v != null && !v.includes('URL_SEARCH'), v == null ? 'no declaration' : `pin ${!!p}, machina pin ${!!q}; ${(v.match(/URL_SEARCH/g) || []).length} left`); }
// SUCCESSOR U1b(c4): today, unset, nothing named URL_SEARCH is left but the declaration and the THREE named pin blocks, Arbor's, Machina's and Flux's (each one block)
{ const u = unsetOf(now); const p = now.match(PIN), q = now.match(MPIN), f = now.match(FPIN); const v = u == null ? null : u.replace(PIN, '').replace(MPIN, '').replace(FPIN, '');
  ok('U1b(c4) today, unset, nothing named URL_SEARCH is left but the declaration, the Arbor pin, the Machina pin and the Flux pin (one block each)', !!p && !!q && !!f && v != null && !v.includes('URL_SEARCH'), v == null ? 'no declaration' : `pin ${!!p}, machina pin ${!!q}, flux pin ${!!f}; ${(v.match(/URL_SEARCH/g) || []).length} left`); }
// PARKED 2026-11-15 (SUPERSEDED - FABLE RULED, Nov 15, 10:40 pm: the redesign is on by default, and the harness pins today's Arbor (?arbor2=0) for any file that doesn't ask for the redesign - runtime-verify.mjs sets WS_URL_SEARCH to '?arbor2=0' before the opt-in's declaration when no query is named and WS_ARBOR2 is not 'default': today's file carries the pin, so "footholdFree(today)" is false by ruling). Original, verbatim:
// // U1L liveness (a check that cannot fail is not run): the same test REJECTS today's file with a stray use, and with a changed declaration
// {
//   const stray = now.replace(DECL, (d) => d + 'const STRAY = URL_SEARCH;\n');
//   const changed = now.replace(DECL, (d) => d.replace(/;\n\n$/, ' || \'/\';\n\n'));
//   const live = footholdFree(now, introDecl) && stray !== now && !footholdFree(stray, introDecl) && changed !== now && !footholdFree(changed, introDecl);
//   ok('U1L liveness: U1b passes today\'s file and fails both mutants (a stray use; a changed declaration)', live, JSON.stringify({ today: footholdFree(now, introDecl), stray: footholdFree(stray, introDecl), changed: footholdFree(changed, introDecl) }));
// }
// SUCCESSOR U1L2: the same liveness with the pin block taken out first (it is U1b(c2)'s one named foothold) - the test still rejects a stray use and a
// changed declaration
// PARKED 2026-11-20 (ARBOR, machina/look; SUPERSEDED with U1b(c2) above: the Machina pin is a second named block, so "the pin block out" leaves its uses).
// Original, verbatim:
// {
//   const noPin = (t) => t.replace(PIN, '');
//   const stray = now.replace(DECL, (d) => d + 'const STRAY = URL_SEARCH;\n');
//   const changed = now.replace(DECL, (d) => d.replace(/;\n\n$/, ' || \'/\';\n\n'));
//   const live = !!now.match(PIN) && footholdFree(noPin(now), introDecl) && stray !== now && !footholdFree(noPin(stray), introDecl) && changed !== now && !footholdFree(noPin(changed), introDecl);
//   ok('U1L2 liveness: with the pin block out, U1b passes today\'s file and fails both mutants (a stray use; a changed declaration)', live, JSON.stringify({ pin: !!now.match(PIN), today: footholdFree(noPin(now), introDecl), stray: footholdFree(noPin(stray), introDecl), changed: footholdFree(noPin(changed), introDecl) }));
// }
// SUCCESSOR U1L3: the same liveness with BOTH pin blocks taken out first - the test still rejects a stray use and a changed declaration
// PARKED 2026-11-23 (INK; SUPERSEDED with U1b(c3) above: the Flux pin is a third named block, so "both pins out" leaves its uses). Original, verbatim:
// {
//   const noPins = (t) => t.replace(PIN, '').replace(MPIN, '');
//   const stray = now.replace(DECL, (d) => d + 'const STRAY = URL_SEARCH;\n');
//   const changed = now.replace(DECL, (d) => d.replace(/;\n\n$/, ' || \'/\';\n\n'));
//   const live = !!now.match(PIN) && !!now.match(MPIN) && footholdFree(noPins(now), introDecl) && stray !== now && !footholdFree(noPins(stray), introDecl) && changed !== now && !footholdFree(noPins(changed), introDecl);
//   ok('U1L3 liveness: with both pin blocks out, U1b passes today\'s file and fails both mutants (a stray use; a changed declaration)', live, JSON.stringify({ pin: !!now.match(PIN), mpin: !!now.match(MPIN), today: footholdFree(noPins(now), introDecl), stray: footholdFree(noPins(stray), introDecl), changed: footholdFree(noPins(changed), introDecl) }));
// }
// SUCCESSOR U1L4: the same liveness with ALL THREE pin blocks taken out first - the test still rejects a stray use and a changed declaration
{
  const noPins = (t) => t.replace(PIN, '').replace(MPIN, '').replace(FPIN, '');
  const stray = now.replace(DECL, (d) => d + 'const STRAY = URL_SEARCH;\n');
  const changed = now.replace(DECL, (d) => d.replace(/;\n\n$/, ' || \'/\';\n\n'));
  const live = !!now.match(PIN) && !!now.match(MPIN) && !!now.match(FPIN) && footholdFree(noPins(now), introDecl) && stray !== now && !footholdFree(noPins(stray), introDecl) && changed !== now && !footholdFree(noPins(changed), introDecl);
  ok('U1L4 liveness: with the three pin blocks out, U1b passes today\'s file and fails both mutants (a stray use; a changed declaration)', live, JSON.stringify({ pin: !!now.match(PIN), mpin: !!now.match(MPIN), fpin: !!now.match(FPIN), today: footholdFree(noPins(now), introDecl), stray: footholdFree(noPins(stray), introDecl), changed: footholdFree(noPins(changed), introDecl) }));
}

// U2 / U4: the declaration's own expression, evaluated
const evalWith = (env) => (m ? new Function('process', `return ${m[1]};`)({ env }) : undefined);
const unsetVal = evalWith({}), emptyVal = evalWith({ WS_URL_SEARCH: '' });
// PARKED 2026-11-15 (SUPERSEDED - FABLE RULED, Nov 15, 10:40 pm: the redesign is on by default, and the harness pins today's Arbor (?arbor2=0) for any file that doesn't ask for the redesign - runtime-verify.mjs sets WS_URL_SEARCH to '?arbor2=0' before the opt-in's declaration when no query is named and WS_ARBOR2 is not 'default'). Original, verbatim:
// ok('U2 unset (and empty) give "/" - so ${base}${URL_SEARCH}#x === ${base}/#x', unsetVal === '/' && emptyVal === '/', JSON.stringify({ unsetVal, emptyVal }));
// SUCCESSOR U2b: the pin and the declaration evaluated together, as the driver runs them: unset (and empty) give '/?arbor2=0'; WS_ARBOR2=default gives '/'
// (the redesign's own default); a named query still wins
const pinCode = (now.match(PIN) || [''])[0].split('\n').filter((l) => /^if \(/.test(l)).join('\n');
const evalPinned = (env, code = pinCode) => (m ? new Function('process', `${code}\nreturn ${m[1]};`)({ env: { ...env } }) : undefined);
const p0 = evalPinned({}), p1 = evalPinned({ WS_URL_SEARCH: '' }), p2 = evalPinned({ WS_ARBOR2: 'default' }), p3 = evalPinned({ WS_URL_SEARCH: '?arbor2=1' });
ok('U2b unset (and empty) give "/?arbor2=0" (today\'s Arbor pinned); WS_ARBOR2=default gives "/" (the redesign); a named query wins', !!pinCode && p0 === '/?arbor2=0' && p1 === '/?arbor2=0' && p2 === '/' && p3 === '/?arbor2=1', JSON.stringify({ pinCode: !!pinCode, p0, p1, p2, p3 }));
// U2L liveness: with the pin taken out, U2b's read goes red (unset is '/' again)
const q0 = evalPinned({}, '');
ok('U2L liveness: without the pin, unset gives "/" - U2b\'s read goes RED', q0 === '/' && q0 !== '/?arbor2=0', JSON.stringify({ q0 }));
// U2M (ARBOR, Nov 20, machina/look): both pins and the declaration evaluated together, as the driver runs them: unset (and empty) give
// '/?arbor2=0&machina2=0'; WS_MACHINA2=default gives '/?arbor2=0' (the look); WS_ARBOR2=default gives '/?machina2=0'; both default give '/'; a named query wins
const mpinCode = (now.match(MPIN) || [''])[0].split('\n').filter((l) => /^\{ const s = /.test(l)).join('\n');
const both = `${pinCode}\n${mpinCode}`;
const mp = [evalPinned({}, both), evalPinned({ WS_URL_SEARCH: '' }, both), evalPinned({ WS_MACHINA2: 'default' }, both), evalPinned({ WS_ARBOR2: 'default' }, both),
  evalPinned({ WS_ARBOR2: 'default', WS_MACHINA2: 'default' }, both), evalPinned({ WS_URL_SEARCH: '?arbor2=1' }, both)];
ok('U2M both pins: unset/empty "/?arbor2=0&machina2=0"; WS_MACHINA2=default "/?arbor2=0"; WS_ARBOR2=default "/?machina2=0"; both "/"; a named query wins',
  !!mpinCode && JSON.stringify(mp) === JSON.stringify(['/?arbor2=0&machina2=0', '/?arbor2=0&machina2=0', '/?arbor2=0', '/?machina2=0', '/', '/?arbor2=1']), JSON.stringify({ mpinCode: !!mpinCode, mp }));
// U2ML liveness: without the Machina pin, unset gives '/?arbor2=0' - U2M's read goes RED
const mq = evalPinned({}, pinCode);
ok('U2ML liveness: without the Machina pin, unset gives "/?arbor2=0" - U2M\'s read goes RED', mq === '/?arbor2=0' && mq !== '/?arbor2=0&machina2=0', JSON.stringify({ mq }));
// U2F (INK, Nov 23, the Flux pin): the three pins and the declaration evaluated together, as the driver runs them
const fpinCode = (now.match(FPIN) || [''])[0].split('\n').filter((l) => /^\{ const s = /.test(l)).join('\n');
const all3 = `${both}\n${fpinCode}`;
const fp = [evalPinned({}, all3), evalPinned({ WS_URL_SEARCH: '' }, all3), evalPinned({ WS_FLUX3: 'default' }, all3), evalPinned({ WS_ARBOR2: 'default', WS_MACHINA2: 'default' }, all3), evalPinned({ WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' }, all3), evalPinned({ WS_URL_SEARCH: '?arbor2=1' }, all3)];
ok('U2F three pins: unset/empty "/?arbor2=0&machina2=0&flux3=0"; WS_FLUX3=default "/?arbor2=0&machina2=0"; the other two default "/?flux3=0"; all three "/"; a named query wins',
  !!fpinCode && JSON.stringify(fp) === JSON.stringify(['/?arbor2=0&machina2=0&flux3=0', '/?arbor2=0&machina2=0&flux3=0', '/?arbor2=0&machina2=0', '/?flux3=0', '/', '/?arbor2=1']), JSON.stringify({ fpinCode: !!fpinCode, fp }));
// U2FL liveness: without the Flux pin, unset gives '/?arbor2=0&machina2=0' - U2F's read goes RED
const fq = evalPinned({}, both);
ok('U2FL liveness: without the Flux pin, unset gives "/?arbor2=0&machina2=0" - U2F\'s read goes RED', fq === '/?arbor2=0&machina2=0' && fq !== '/?arbor2=0&machina2=0&flux3=0', JSON.stringify({ fq }));
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
// ---- PARKED 2026-11-10 (SUPERSEDED - its premise "only this proof names it" fell when Arbor's pinned files began READING WS_URL_SEARCH to prove the
// room pin took (arbor2-keycost/-roompin/-sleep/-swap fail when it carries no pin) and naming it in their Run: lines; none of them SETS it. The check
// tested mentions, not setting; full pair 42928277885). Kept VERBATIM, no longer run; the successor follows.
// ok('U5 no harness or frames file sets WS_URL_SEARCH (nothing opts in by accident)', hits.length === 0, hits.join(', ') || 'none');
// SUCCESSOR U5b: the claim as worded - a SET is an assignment in code (comments stripped): env.WS_URL_SEARCH = ..., WS_URL_SEARCH: ... in an env
// object, ['WS_URL_SEARCH'] = ..., or a shell WS_URL_SEARCH=... / export. A READ (process.env.WS_URL_SEARCH || '') is not a set.
const codeOnly = (t) => t.split('\n').filter((l) => !/^\s*(\/\/|#|\*|\/\*)/.test(l)).join('\n');
const SETS = /env\.WS_URL_SEARCH\s*=(?!=)|\bWS_URL_SEARCH\s*:|\[\s*['"]WS_URL_SEARCH['"]\s*\]\s*=(?!=)|(?:^|[\s;&|(])(?:export\s+)?WS_URL_SEARCH=/m;
const setters = hits.filter((rel) => SETS.test(codeOnly(fs.readFileSync(path.join(scripts, rel), 'utf8'))));
ok(`U5b no harness or frames file SETS WS_URL_SEARCH (nothing opts in by accident) - coverage: ${hits.length} file(s) mention it, ${setters.length} set it`, setters.length === 0, JSON.stringify({ setters, mention: hits }));
const mutSet = "const q = process.env.WS_URL_SEARCH || '';\nprocess.env.WS_URL_SEARCH = '?arbor2=1';\n";
const mutRead = "// Run: WS_URL_SEARCH='?arbor2=1' node x.mjs\nconst q = process.env.WS_URL_SEARCH || '';\n";
ok('MUT-U5b the setter test catches a file that sets it (and passes one that only reads and names it)', SETS.test(codeOnly(mutSet)) && !SETS.test(codeOnly(mutRead)), '');

const failed = results.filter((r) => !r.pass).length;
console.log(`URL-SEARCH-OPTIN VERIFY: ${failed ? `FAIL - ${failed}/${results.length} failed` : `PASS (${results.length} checks)`}`);
process.exit(failed ? 1 : 0);
