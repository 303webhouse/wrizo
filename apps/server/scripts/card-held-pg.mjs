// MOBILE-B (Fable, Nov 26) - "DOES THE ACCOUNT HOLD THE CARD WITH THIS ID?" AGAINST A REAL POSTGRES. The phone asks this one yes-or-no instead of downloading the whole account for each note.
// Real here: the server's own boot migration (migrate.ts), the real upsert that stores Boards (sync.ts), the real sign-in guard (auth.ts requireAuth) and the shipped router (cardHeldRoutes.ts), served by
// express on this machine. Stood in: the session itself (a test header names the writer) and the rate limiter (loadServer's stub).
//
// SAFETY: it refuses to run unless DATABASE_URL names a database on THIS machine. It makes its own test writers (fake `.invalid` addresses) and deletes them at the end.
// Run (needs a local Postgres): DATABASE_URL=postgres://user:pass@127.0.0.1:5432/dbname node apps/server/scripts/card-held-pg.mjs
import fs from 'node:fs';
import path from 'node:path';
import { loadServer, svRequire, SERVER_SRC } from './tutor-eval/load-server.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const url = process.env.DATABASE_URL || '';
let host = '';
try { host = new URL(url).hostname; } catch { /* not a URL */ }
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
  console.error('CARD-HELD-PG: refused. DATABASE_URL must name a database on this machine (localhost or 127.0.0.1); this check never touches any other.');
  process.exit(2);
}
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'local-check-secret';
process.env.NODE_ENV = 'test';

const s = loadServer({ files: ['env.ts', 'db.ts', 'migrate.ts', 'asyncHandler.ts', 'logSafe.ts', 'passwordHash.ts', 'build.ts', 'wordCount.ts', 'rail.ts', 'railRoutes.ts', 'sync.ts', 'cardHeldRoutes.ts'] });
// loadServer stands auth.js in with a pass-through; this check wants the REAL sign-in guard, so the real auth.ts is written over the stand-in
const ts = svRequire('typescript');
fs.writeFileSync(path.join(s.tmp, 'auth.js'), ts.transpileModule(fs.readFileSync(path.join(SERVER_SRC, 'auth.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText);
fs.writeFileSync(path.join(s.tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\n');

const { pool } = s.load('db.ts');
const made = [];
let server = null;
try {
  const { runMigrations } = s.load('migrate.ts');
  await runMigrations();
  const { upsertJournalEntries } = s.load('sync.ts');

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mk = async (tag) => { const r = await pool.query(`insert into users (email, pass_hash) values ($1, 'x') returning id`, [`held-check-${tag}-${stamp}@example.invalid`]); made.push(r.rows[0].id); return r.rows[0].id; };
  const A = await mk('a'); const B = await mk('b');

  const T = '2026-11-26T10:00:00.000Z';
  const card = (id, extra = {}) => ({ id, kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'a card', updatedAt: T, ...extra });
  const entry = (id, boxes, extra = {}) => ({ id: `${id}-${stamp}`, text: 'Board', projectId: null, pageType: 'board', boxes, createdAt: T, updatedAt: T, ...extra });
  const rejected = [
    ...await upsertJournalEntries(A, [
      entry('live', [card('other'), card('n-live')]),
      entry('deadboard', [card('n-on-deleted-board')], { deletedAt: T }),
      entry('tomb', [card('n-card-deleted', { deletedAt: T })]),
      entry('page', undefined, { pageType: 'manuscript', text: 'the words n-only-in-text and [{"id":"n-only-in-text"}]' }),
      entry('empty', []),
      entry('purged', [card('n-purged')]),
    ]),
    ...await upsertJournalEntries(B, [entry('theirs', [card('n-theirs')])]),
  ];
  await upsertJournalEntries(A, [entry('purged', undefined, { purgedAt: T, updatedAt: '2026-11-26T11:00:00.000Z' })]);
  ok('HELD0 the test rows were stored by the real upsert', rejected.length === 0, JSON.stringify(rejected));

  let routes = null;
  try { routes = s.load('cardHeldRoutes.ts'); } catch (e) { ok('HELD the route exists (apps/server/src/cardHeldRoutes.ts)', false, String(e.message).split('\n')[0].slice(0, 160)); }
  if (routes) {
    const express = svRequire('express');
    const app = express();
    app.use((req, _res, next) => { req.session = { userId: req.headers['x-test-writer'] || undefined }; next(); });   // the session, stood in; requireAuth behind it is the real one
    app.use('/api', routes.cardHeldRouter);
    server = await new Promise((r) => { const sv = app.listen(0, '127.0.0.1', () => r(sv)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    const ask = async (writer, id) => {
      const res = await fetch(`${base}/api/card-held/${encodeURIComponent(id)}`, { headers: writer ? { 'x-test-writer': writer } : {} });
      let body = null; try { body = await res.json(); } catch { /* not JSON */ }
      return { status: res.status, body, cache: res.headers.get('cache-control') };
    };
    const says = (r, held) => r.status === 200 && JSON.stringify(r.body) === JSON.stringify({ held });
    const show = (r) => `${r.status} ${JSON.stringify(r.body)}`;
    const expect = async (name, writer, id, held) => { const r = await ask(writer, id); ok(name, says(r, held), show(r)); };

    await expect('HELD1 a Card on her Board: yes, and the answer is nothing but yes', A, 'n-live', true);
    await expect('HELD2 a Card on a Board she deleted: yes (it arrived; it is never added again)', A, 'n-on-deleted-board', true);
    await expect('HELD3 a Card she deleted in place: yes', A, 'n-card-deleted', true);
    await expect('HELD4 an id the account has never seen: no', A, 'n-never', false);
    await expect('HELD5 part of an id is not the id: no', A, 'n-liv', false);
    await expect('HELD6 the id written in a page\'s words is not a Card: no', A, 'n-only-in-text', false);
    await expect('HELD7 another writer\'s Card: no', A, 'n-theirs', false);
    await expect('HELD8 and that writer is told yes for it', B, 'n-theirs', true);
    await expect('HELD9 a Board deleted for good keeps no Card: no', A, 'n-purged', false);
    await expect('HELD10 an id made of quotes and SQL is just an id nobody has: no', A, `x"}]' or true --`, false);
    const out = await ask(null, 'n-live');
    ok('HELD11 signed out: refused 401, no yes or no', out.status === 401 && !(out.body && 'held' in out.body), show(out));
    const fresh = await ask(A, 'n-live');
    ok('HELD12 the answer is not to be kept by the browser (no-store)', /no-store/.test(fresh.cache || ''), String(fresh.cache));
    const index = fs.readFileSync(path.join(SERVER_SRC, 'index.ts'), 'utf8');
    const at = index.indexOf("app.use('/api', cardHeldRouter);");
    ok('HELD13 the server mounts it behind the session', at > index.indexOf('app.use(sessionMiddleware);') && at > -1, `mount at ${at}`);
  }
} catch (e) {
  ok('the check ran to the end', false, String((e && e.stack) || e).slice(0, 400));
} finally {
  if (server) server.close();
  try { for (const id of made) { await pool.query('delete from journal_entries where user_id = $1', [id]); await pool.query('delete from users where id = $1', [id]); } } catch { /* the database is thrown away */ }
  try { await pool.end(); } catch { /* ignore */ }
  s.cleanup();
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  [' + String(c.detail).slice(0, 300) + ']' : ''}`);
const failed = checks.filter((c) => !c.pass);
console.log(`\nCARD-HELD-PG VERIFY: ${failed.length ? 'FAIL (' + failed.length + ' of ' + checks.length + ')' : 'PASS (' + checks.length + ' checks)'}`);
process.exit(failed.length ? 1 : 0);
