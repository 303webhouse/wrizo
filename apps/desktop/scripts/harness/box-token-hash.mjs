// BOX-TOKEN-HASH (Oct 23, after ledger (145)) - THE GRANT FILE HOLDS ONLY A HASH OF THE TOKEN. A committed verification scenario. BROWSERLESS: it opens no browser, takes no box turn and never
// reads, writes or clears the real grant - every check runs against a throwaway HOME (USERPROFILE/HOME pointed at a temp dir), with REAL processes, including a nested bash script.
//
// WHY. The process-tree binding of (141) tried to stop a lane from reading the token out of the (world-readable) grant file and presenting it. Under Git Bash the Windows parent link breaks
// across the second nested fork, so the guard refused its own owner's nested runner (ledger (145)). The binding is now optional and OFF by default; the hole is closed differently: the
// file stores sha256 of the token, so reading it yields nothing that is accepted.
//
// WHAT MUST BE PROVED (T7 and T8 matter most - they are the two halves of "the owner is never refused, the reader is never admitted"):
//   T1  writeGrant never puts the token in the file (no field holds it, its text does not occur in the file) - only tokenHash
//   T2  the right token matches; a wrong token is refused (token-mismatch)
//   T3  THE HASH READ OUT OF THE FILE IS NOT ACCEPTED AS A TOKEN (the copy-from-file attack)
//   T4  a grant in the OLD shape (plain `token`, item 140's) still matches exactly as before
//   T5  box-take with no token draws a 32-hex token, prints it once, stores only its hash; a wrong release is refused, the right one releases
//   T6  box-take takes UNBOUND by default (no holder fields); --bind records a holder
//   T7  LIVE, NESTED: a bash script takes the box, then runs the check through a function and a second `bash child.sh` (the shape that broke the binding) - with the token it is ALLOWED
//   T8  LIVE, FROM ANOTHER TREE: a WMI-created process (outside the script's tree) WITHOUT the token is refused (no-token-exported), and presenting the HASH from the file is refused (token-mismatch)
//   T9  the same WMI process WITH the token is allowed - the token, not the tree, is what proves ownership (stated as the design, not hidden)
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { checkGrantAt, writeGrantAt, hashToken } from '../box-grant.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const scripts = path.join(here, '..');
const GRANT_MOD = pathToFileURL(path.join(scripts, 'box-grant.mjs')).href;
const TAKE = path.join(scripts, 'box-take.mjs');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const tmp = mkdtempSync(path.join(os.tmpdir(), 'ws-tokhash-'));
const G = path.join(tmp, 'grant.json');
const TOKEN = 'a-handpicked-token-20261023';

// T1
writeGrantAt(G, 'lane-x', TOKEN);
const raw = readFileSync(G, 'utf8'); const rec = JSON.parse(raw);
ok('T1 the grant file holds no token: no `token` field, the token text occurs nowhere in the file, a 64-hex tokenHash is there', rec.token === undefined && !raw.includes(TOKEN) && /^[0-9a-f]{64}$/.test(rec.tokenHash || ''), raw.replace(/"tokenHash": "[0-9a-f]+"/, '"tokenHash": "..."').slice(0, 120));
// T2
const t2a = checkGrantAt(G, TOKEN); const t2b = checkGrantAt(G, TOKEN + 'x');
ok('T2 the right token matches; a wrong token is refused with token-mismatch', t2a.ok === true && t2b.ok === false && t2b.reason === 'token-mismatch', `${t2a.ok} / ${t2b.reason}`);
// T3
const t3 = checkGrantAt(G, rec.tokenHash);
ok('T3 the hash read out of the file is NOT accepted as a token (the copy-from-file attack)', t3.ok === false && t3.reason === 'token-mismatch', t3.reason);
// T4
const legacy = path.join(tmp, 'legacy.json');
writeFileSync(legacy, JSON.stringify({ lane: 'errata', token: 'errata-old-20260915', time: '2026-09-15T20:00:00.000Z' }), 'utf8');
const t4 = checkGrantAt(legacy, 'errata-old-20260915'); const t4b = checkGrantAt(legacy, 'nope');
ok('T4 a grant in the old shape (plain `token`) still matches, and still refuses a different token', t4.ok === true && t4b.ok === false && t4b.reason === 'token-mismatch', `${t4.ok} / ${t4b.reason}`);

// a throwaway HOME for every real process below
const home = path.join(tmp, 'home'); mkdirSync(home, { recursive: true });
const envHome = { ...process.env, USERPROFILE: home, HOME: home };
const takeFile = path.join(home, '.wrizo', 'box-turn.json');
const take = (...args) => spawnSync(process.execPath, [TAKE, ...args], { encoding: 'utf8', env: envHome });
const reset = () => rmSync(path.join(home, '.wrizo'), { recursive: true, force: true });

// T5
const r5 = take('take', 'lane-y');
const drawn = (/WS_BOX_TURN=([0-9a-f]{32})\b/.exec(r5.stdout) || [])[1];
const g5 = existsSync(takeFile) ? JSON.parse(readFileSync(takeFile, 'utf8')) : {};
ok('T5 box-take with no token draws a 32-hex token, prints it once, and stores only its hash', !!drawn && g5.tokenHash === hashToken(drawn) && !readFileSync(takeFile, 'utf8').includes(drawn), `${r5.stdout.split('\n')[0].slice(0, 60)}`);
const wrong = take('release', 'not-it'); const stillThere = existsSync(takeFile);
const right = take('release', drawn || 'x'); const gone = !existsSync(takeFile);
ok('T5 a wrong release is refused and leaves the grant; the right token releases it', wrong.status === 1 && stillThere && right.status === 0 && gone, `${wrong.status}/${stillThere}/${right.status}/${gone}`);
// T6
reset(); take('take', 'lane-z', 'unbound-token-20261023');
const g6 = JSON.parse(readFileSync(takeFile, 'utf8'));
reset(); take('take', 'lane-z', 'bound-token-20261023', '--bind');
const g6b = JSON.parse(readFileSync(takeFile, 'utf8'));
ok('T6 box-take takes UNBOUND by default (no holder fields); --bind records a holder', g6.holderPid === undefined && Number.isInteger(g6b.holderPid), `${g6.holderPid} / ${g6b.holderPid}`);

// T7 / T8 / T9 - live. The token is chosen here; the script takes the box with it.
reset();
const LIVE = 'live-nested-token-20261023';
const checker = path.join(tmp, 'check.mjs');
writeFileSync(checker, `import { checkGrant } from ${JSON.stringify(GRANT_MOD)};\nconst r = checkGrant(process.env.WS_BOX_TURN);\nconsole.log('CHECK ' + JSON.stringify({ ok: r.ok, reason: r.reason || 'ok' }));\n`, 'utf8');
const toSh = (p) => p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (m, d) => `/${d.toLowerCase()}`);
const childSh = path.join(tmp, 'child.sh');
writeFileSync(childSh, `#!/bin/bash\nnode "${toSh(checker)}"\n`, 'utf8');
const outer = path.join(tmp, 'outer.sh');
// the nested shape that broke the binding: script -> function -> `bash child.sh` -> node, token exported in the script
writeFileSync(outer, `#!/bin/bash\nnode "${toSh(TAKE)}" take lane-live ${LIVE} > /dev/null\nexport WS_BOX_TURN=${LIVE}\nrun_it() { bash "${toSh(childSh)}"; }\nrun_it\n`, 'utf8');
const bash = ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files\\Git\\usr\\bin\\bash.exe'].find((p) => existsSync(p));
let t7 = null;
if (bash) { const r = spawnSync(bash, [outer], { encoding: 'utf8', env: envHome }); t7 = (/CHECK (\{.*\})/.exec(r.stdout) || [])[1]; }
ok('T7 LIVE, NESTED: a bash script takes the box and runs the check through a function and a second `bash child.sh` - with the token it is ALLOWED', !!t7 && JSON.parse(t7).ok === true, String(t7));

const liveHash = existsSync(takeFile) ? JSON.parse(readFileSync(takeFile, 'utf8')).tokenHash : '';
const foreign = (tokenValue) => {
  // a WMI-created process: its parent is the WMI provider host, outside this script's tree
  const ps = path.join(tmp, 'foreign.ps1'); const done = path.join(tmp, 'foreign.out');
  writeFileSync(ps, `param([string]$Tok)\n$env:USERPROFILE='${home}'; $env:HOME='${home}'\n$cmd = 'cmd /c "set USERPROFILE=${home}&& set HOME=${home}&& ' + $(if ($Tok) { 'set WS_BOX_TURN=' + $Tok + '&& ' } else { '' }) + '"${process.execPath}" "${checker}" > "${done}" 2>&1"'\n$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd }\n$deadline = (Get-Date).AddSeconds(30)\nwhile ((Get-Date) -lt $deadline) { if ((Test-Path $done) -and ((Get-Content $done -Raw) -match 'CHECK')) { break }; Start-Sleep -Milliseconds 300 }\n`, 'utf8');
  spawnSync('powershell', ['-NoProfile', '-File', ps, '-Tok', tokenValue || ''], { encoding: 'utf8' });
  const out = existsSync(done) ? readFileSync(done, 'utf8') : '';
  const m = /CHECK (\{.*\})/.exec(out); return m ? JSON.parse(m[1]) : null;
};
const noTok = foreign('');
ok('T8 LIVE, FROM ANOTHER TREE: a WMI-created process WITHOUT the token is refused (no token exported)', !!noTok && noTok.ok === false && noTok.reason === 'no-token-exported', JSON.stringify(noTok));
const hashTok = foreign(liveHash);
ok('T8 ... and one presenting the HASH read from the file is refused (token-mismatch)', !!hashTok && hashTok.ok === false && hashTok.reason === 'token-mismatch', JSON.stringify(hashTok));
const withTok = foreign(LIVE);
ok('T9 the same outside process WITH the token is allowed - the token, not the process tree, is what proves ownership (the design, stated)', !!withTok && withTok.ok === true, JSON.stringify(withTok));

rmSync(tmp, { recursive: true, force: true });
const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBOX-TOKEN-HASH VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBOX-TOKEN-HASH VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
