// THE ACCOUNT TOOLS (Fable, Oct 28: the wipe of Nick's account and the sample account; both run after #10 is live). BROWSERLESS and DATABASE-FREE - no box turn,
// no browser, no database address: a local http server stands in for the app's two routes, and a stub stands in for the database.
//   S1  the safety copy, on a pulled account holding live pages, a Trashed page and a purged shell: ok, and the three files exist
//   S2  account-pull.json read back from disk has the same counts; counts.txt names them; Everything.md carries the live pages' words AND the Trash after them
//   S3  neither the email nor the password is in any file the copy wrote, and the run printed nothing (the functions never print)
//   S4  refusals: an EMPTY account -> EMPTY; an existing folder -> FOLDER-EXISTS (nothing overwritten); a wrong password -> login-401; a failed pull -> pull-500;
//       a plain-http non-local address -> refused before a byte is sent
//   S5  create-account: a new email -> created (+ the id); a taken email (unique violation) -> exists, nothing changed; any other failure is rethrown
//   S6  the sample id file: written once with the user id ONLY (no email, no password), and a second write is refused
// Mutants (each asserted to have LANDED, through the proof seams): MS1 Everything.md emptied while the pull holds pages - EVERYTHING-EMPTY; MS1b the export throws -
//   EXPORT-FAILED and no folder; MS2 account-pull.json truncated after the write - READBACK-MISMATCH.
// Run: node apps/server/scripts/harness/account-tools.mjs   (needs the desktop's node_modules; nothing else)
import http from 'node:http';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const here = new URL('..', import.meta.url);
const copy = await import(new URL('safety-copy.mjs', here).href);
const acct = await import(new URL('create-account.mjs', here).href);

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);

const EMAIL = 'someone-private@example.invalid';
const PASSWORD = 'a-very-private-passphrase-123';
const T = '2026-10-20T10:00:00.000Z';
const entry = (id, text, extra = {}) => ({ id, text, createdAt: T, updatedAt: T, origin: 'journal', source: 'page', ...extra });
const PULL = {
  projects: [{ id: 'pr1', name: 'A novel', createdAt: T, updatedAt: T }],
  storyPlans: [], sessions: [{ id: 's1', date: T, words: 40 }], drafts: [], drawers: [{ id: 'd1', name: 'Novel', createdAt: T, updatedAt: T }],
  journalEntries: [
    entry('e1', 'The rope was already there, and the well took the bucket back colder still.'),
    entry('e2', 'A second page, written the next morning, about the map.', { createdAt: '2026-10-21T10:00:00.000Z' }),
    entry('e3', 'A page that went to the Trash and must still be saved.', { deletedAt: '2026-10-22T10:00:00.000Z' }),
    { id: 'e4', deletedAt: '2026-10-22T10:00:00.000Z', purgedAt: '2026-10-22T10:00:00.000Z', createdAt: T, updatedAt: T },   // a purge shell: Trashed first, then deleted for good
  ],
};

// a stand-in for the app's three routes: login (the fake credentials), the pull, logout
let pullStatus = 200; let pullBody = PULL; const seen = [];
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    seen.push(`${req.method} ${req.url}`);
    if (req.url === '/auth/login') {
      let b = {}; try { b = JSON.parse(body); } catch { /* */ }
      if (b.email === EMAIL && b.password === PASSWORD) { res.writeHead(200, { 'Set-Cookie': 'sid=abc; Path=/; HttpOnly' }); res.end('{}'); } else { res.writeHead(401); res.end('{}'); }
    } else if (req.url === '/api/sync') {
      if (pullStatus !== 200) { res.writeHead(pullStatus); res.end('{}'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ pull: pullBody }));
    } else if (req.url === '/auth/logout') { res.writeHead(204); res.end(); } else { res.writeHead(404); res.end(); }
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const root = mkdtempSync(join(tmpdir(), 'acct-tools-'));
const outputs = [];
const origLog = console.log; const origErr = console.error;
console.log = (...a) => { outputs.push(a.join(' ')); }; console.error = (...a) => { outputs.push(a.join(' ')); };

try {
  // S1 + S2 + S3
  const pulled = await copy.pullAccount(base, EMAIL, PASSWORD);
  const dir = join(root, 'copy-1');
  const r = await copy.makeSafetyCopy({ pull: pulled, outDir: dir });
  const files = existsSync(dir) ? readdirSync(dir).sort() : [];
  ok(`S1 the safety copy of a pulled account (2 live pages, 1 Trashed, 1 purged shell) is ok and writes account-pull.json, Everything.md (3 pages: the purged shell is not one) and counts.txt`,
    r.ok && J(files) === J(['Everything.md', 'account-pull.json', 'counts.txt']) && r.pages === 3, J({ code: r.code, files, pages: r.pages }));
  const back = copy.countsOf(JSON.parse(readFileSync(join(dir, 'account-pull.json'), 'utf8')));
  const md = readFileSync(join(dir, 'Everything.md'), 'utf8');
  const counts = readFileSync(join(dir, 'counts.txt'), 'utf8');
  ok(`S2 read back from disk the counts are the same (journalEntries ${J(back.journalEntries)}); counts.txt names them; Everything.md carries both live pages and the Trashed one after a "From the Trash" marker`,
    J(back) === J(r.counts) && back.journalEntries.total === 4 && back.journalEntries.live === 2 && back.journalEntries.trashed === 1 && back.journalEntries.purged === 1
      && /journalEntries\s+4 \/ 2 \/ 1 \/ 1/.test(counts) && /rope was already there/.test(md) && /second page/.test(md) && md.indexOf('## From the Trash') > md.indexOf('second page') && /must still be saved/.test(md.slice(md.indexOf('## From the Trash'))),
    J({ counts: counts.split('\n').slice(0, 7), trashMarker: md.indexOf('## From the Trash') }));
  const allText = files.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n') + outputs.join('\n');
  ok('S3 neither the email nor the password is in any file the copy wrote, and the functions printed nothing', !allText.includes(EMAIL) && !allText.includes(PASSWORD) && outputs.length === 0, J({ outputs: outputs.length }));

  // S4 refusals
  const empty = await copy.makeSafetyCopy({ pull: { projects: [], storyPlans: [], sessions: [], drafts: [], drawers: [], journalEntries: [] }, outDir: join(root, 'copy-empty') });
  const again = await copy.makeSafetyCopy({ pull: pulled, outDir: dir });
  const kept = readFileSync(join(dir, 'Everything.md'), 'utf8') === md;
  let loginErr = null; try { await copy.pullAccount(base, EMAIL, 'wrong-password-123'); } catch (e) { loginErr = e.message; }
  pullStatus = 500; let pullErr = null; try { await copy.pullAccount(base, EMAIL, PASSWORD); } catch (e) { pullErr = e.message; } pullStatus = 200;
  const before = seen.length; let unsafe = null; try { await copy.pullAccount('http://example.com', EMAIL, PASSWORD); } catch (e) { unsafe = e.message; }
  ok(`S4 refusals: EMPTY (${empty.code}, no folder: ${!existsSync(join(root, 'copy-empty'))}), FOLDER-EXISTS (${again.code}, nothing overwritten: ${kept}), wrong password (${loginErr}), failed pull (${pullErr}), plain http to a non-local host (${unsafe}, no request sent: ${seen.length === before})`,
    empty.code === 'EMPTY' && !empty.ok && !existsSync(join(root, 'copy-empty')) && again.code === 'FOLDER-EXISTS' && kept && loginErr === 'login-401' && pullErr === 'pull-500' && unsafe === 'unsafe-base' && seen.length === before, '');

  // S5 create-account, against a stub database
  const created = await acct.insertAccount({ query: async () => ({ rows: [{ id: 'u-123' }] }) }, { email: EMAIL, passHash: 'h', name: '' });
  const taken = await acct.insertAccount({ query: async () => { const e = new Error('dup'); e.code = '23505'; throw e; } }, { email: EMAIL, passHash: 'h', name: 'x' });
  let other = null; try { await acct.insertAccount({ query: async () => { const e = new Error('down'); e.code = '57P01'; throw e; } }, { email: EMAIL, passHash: 'h', name: 'x' }); } catch (e) { other = e.code; }
  let args = null; await acct.insertAccount({ query: async (sql, a) => { args = { sql, a }; return { rows: [{ id: 'u-9' }] }; } }, { email: EMAIL, passHash: 'h', name: '' });
  ok(`S5 create-account: a new email -> ${J(created)}; a taken email -> ${J(taken)}; another failure is rethrown (${other}); it is sign-up's own insert (users: email, pass_hash, name), and an empty name goes in as null`,
    created.status === 'created' && created.id === 'u-123' && taken.status === 'exists' && other === '57P01' && /insert into users \(email, pass_hash, name\)/.test(args.sql) && args.a[2] === null, J(args));

  // S6 the sample id file
  const idFile = join(root, 'sample-account.json');
  acct.recordSampleId(idFile, 'u-123');
  const rec = JSON.parse(readFileSync(idFile, 'utf8'));
  let second = null; try { acct.recordSampleId(idFile, 'u-999'); } catch (e) { second = e.code; }
  ok(`S6 the sample id file holds the user id only (keys: ${Object.keys(rec).sort().join(', ')}), and a second write is refused (${second}) with the first id intact (${JSON.parse(readFileSync(idFile, 'utf8')).userId})`,
    rec.userId === 'u-123' && J(Object.keys(rec).sort()) === J(['recordedAt', 'userId']) && second === 'EEXIST' && JSON.parse(readFileSync(idFile, 'utf8')).userId === 'u-123' && !readFileSync(idFile, 'utf8').includes('@'), '');

  // mutants
  // MS1: the Everything export comes back EMPTY while the pull holds pages - the copy must refuse
  const m1 = await copy.makeSafetyCopy({ pull: pulled, outDir: join(root, 'copy-m1'), exporter: async () => ({ filename: 'x.md', content: '', count: 0 }) });
  ok(`MS1 (mutant): with Everything.md holding 0 pages while the pull holds pages (LANDED: exporter returned count 0), the copy refuses - ${m1.code}`, !m1.ok && m1.code === 'EVERYTHING-EMPTY', J({ code: m1.code }));
  // MS1b: the export throws
  const m1b = await copy.makeSafetyCopy({ pull: pulled, outDir: join(root, 'copy-m1b'), exporter: async () => { throw new Error('boom'); } });
  ok(`MS1b (mutant): with the Everything export throwing (LANDED), the copy refuses - ${m1b.code} - and writes no folder (${!existsSync(join(root, 'copy-m1b'))})`, !m1b.ok && m1b.code === 'EXPORT-FAILED' && !existsSync(join(root, 'copy-m1b')), J({ code: m1b.code }));
  // MS2: account-pull.json cut after the write - the read-back must refuse
  const m2 = await copy.makeSafetyCopy({ pull: pulled, outDir: join(root, 'copy-m2'), afterWrite: (f) => writeFileSync(f, JSON.stringify({ ...pulled, journalEntries: pulled.journalEntries.slice(0, 1) })) });
  ok(`MS2 (mutant): with account-pull.json cut to 1 entry after the write (LANDED), the read-back refuses - ${m2.code}`, !m2.ok && m2.code === 'READBACK-MISMATCH', J({ code: m2.code }));
} finally {
  console.log = origLog; console.error = origErr;
  server.close();
  rmSync(root, { recursive: true, force: true });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nACCOUNT-TOOLS VERIFY: PASS (${checks.length} checks)` : `\nACCOUNT-TOOLS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
