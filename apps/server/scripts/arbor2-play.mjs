// ARBOR v2 MOCKUP - a local place for Nick to PLAY with the Arbor mockup (Fable, Oct 30: "run the mockup on his PC (a local server + a
// throwaway local database seeded with the sample content, the same way Chat 1 proved the seed) ... Never point it at production").
//
// What it does, all on this PC, all on 127.0.0.1:
//   1. a THROWAWAY Postgres (embedded-postgres, in a temp folder; deleted when this stops) - the same as scripts/harness/sample-screens.mjs
//   2. the sample world seeded into it by Chat 1's own runSeed (scripts/sample-seed.mjs), on a made-up account (sample@example.invalid)
//   3. the REAL built server (apps/server/dist) serving the REAL built web app (apps/desktop/dist-web), pointed at that database only
//   4. a front door on PLAY_PORT that signs the browser in as the sample account on the first visit (the password is made here, held in this
//      process only, never printed or written) and then passes every request straight through to the server
// Nick opens ONE link:  http://127.0.0.1:3400/?arbor2=1   ... and stops it all with Ctrl+C (the database is deleted).
//
// NEVER PRODUCTION: the database address is built here from 127.0.0.1 and a fixed local port, checked before anything is written, and handed
// to the server explicitly; any DATABASE_URL already in the environment is ignored and dropped from the server's environment.
// Needs: pnpm --filter @writer-studio/server build  and  pnpm --filter @writer-studio/desktop build:web  (this script checks both exist).
// Run (repo root):  EMBEDDED_PG_FROM=<package.json whose install has embedded-postgres>  [SAMPLE_CONTENT=<content.md>]  node apps/server/scripts/arbor2-play.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const server = join(here, '..');
const desktop = join(server, '..', 'desktop');
const CONTENT = process.env.SAMPLE_CONTENT || join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads', 'sample-account-content.md');
for (const [what, p] of [['the server build', join(server, 'dist', 'index.js')], ['the web build', join(desktop, 'dist-web', 'index.html')], ['the sample content', CONTENT]]) {
  if (!existsSync(p)) { console.error(`Missing ${what}: ${p}`); process.exit(2); }
}
const PG_PORT = 54335, APP_PORT = 3401, PLAY_PORT = 3400, HOST = '127.0.0.1';
const DB = `postgres://postgres:postgres@${HOST}:${PG_PORT}/play`;
if (new URL(DB).hostname !== '127.0.0.1') { console.error('Refusing: the database is not on this PC.'); process.exit(2); }
delete process.env.DATABASE_URL;   // whatever was there, it is not used and never reaches the server

const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(server, 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const root = mkdtempSync(join(tmpdir(), 'arbor2-play-'));
const pg = new EmbeddedPostgres({ databaseDir: join(root, 'data'), user: 'postgres', password: 'postgres', port: PG_PORT, persistent: false, initdbFlags: ['--encoding=UTF8', '--locale=C'] });
let srv = null, door = null, stopping = false;
const stop = async (code = 0) => {
  if (stopping) return; stopping = true;
  console.log('\nStopping: the server, the front door, and the throwaway database (deleted).');
  if (door) door.close();
  if (srv) srv.kill();
  await sleep(500);
  await pg.stop().catch(() => {});
  rmSync(root, { recursive: true, force: true });
  process.exit(code);
};
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

try {
  console.log('Starting a throwaway Postgres on this PC...');
  await pg.initialise(); await pg.start(); await pg.createDatabase('play');
  process.env.DATABASE_URL = DB; process.env.SESSION_SECRET = randomBytes(16).toString('hex'); process.env.NODE_ENV = 'development';
  await reqSrv(join(server, 'dist', 'migrate.js')).runMigrations();
  const pool = new Pool({ connectionString: DB });
  const { hashPassword } = reqSrv(join(server, 'dist', 'passwordHash.js'));
  const PW = randomBytes(12).toString('base64url');
  const EMAIL = 'sample@example.invalid';
  const uid = String((await pool.query(`insert into users (email, pass_hash, name) values ($1,$2,'Sample') returning id`, [EMAIL, await hashPassword(PW)])).rows[0].id);
  const sampleFile = join(root, 'sample.json');
  writeFileSync(sampleFile, JSON.stringify({ userId: uid, recordedAt: new Date().toISOString() }));
  console.log('Seeding the sample content (Chat 1\'s seed)...');
  const { runSeed } = await import(pathToFileURL(join(server, 'scripts', 'sample-seed.mjs')).href);
  const code = await runSeed({ pool, url: DB, email: EMAIL, md: readFileSync(CONTENT, 'utf8'), mode: 'seed', expectId: uid, sampleFile, log: () => {}, err: (l) => console.error(l.replace(EMAIL, '<sample>')) });
  if (code !== 0) throw new Error('the seed did not finish cleanly');
  await reqSrv(join(server, 'dist', 'db.js')).pool.end().catch(() => {});

  // the real server on the throwaway database (its environment carries only the local address)
  srv = spawn(process.execPath, [join(server, 'dist', 'index.js')], { env: { ...process.env, PORT: String(APP_PORT), DATABASE_URL: DB, NODE_ENV: 'development' }, stdio: 'ignore' });
  let up = false;
  for (let i = 0; i < 60 && !up; i++) { try { up = (await fetch(`http://${HOST}:${APP_PORT}/healthz`)).ok; } catch { /* not up yet */ } if (!up) await sleep(500); }
  if (!up) throw new Error('the server did not come up');

  // the front door: the first visit signs the browser in (and marks Arbor + first-run done in ITS storage), then everything passes through
  const signIn = async () => {
    const r = await fetch(`http://${HOST}:${APP_PORT}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PW }) });
    if (r.status !== 200) throw new Error('sign-in failed ' + r.status);
    return r.headers.getSetCookie();
  };
  const BOOT = `<!doctype html><meta charset="utf-8"><title>Opening Wrizo</title><script>
try { localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', 'plateau'); } catch (e) {}
location.replace('/?arbor2=1#/');
</script>`;
  door = createServer(async (req, res) => {
    try {
      const signed = /(?:^|;\s*)arbor2play=1/.test(req.headers.cookie || '');
      if (!signed && req.method === 'GET' && (req.headers.accept || '').includes('text/html')) {
        const cookies = await signIn();
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'set-cookie': [...cookies, 'arbor2play=1; Path=/; HttpOnly; SameSite=Lax'] });
        res.end(BOOT);
        return;
      }
      // the Host header passes through UNCHANGED: the server rejects a POST whose Origin is not `protocol://host` (index.ts, item 224), and
      // the browser's Origin is this front door's address - rewriting Host to the inner port would refuse every save
      const up2 = httpRequest({ host: HOST, port: APP_PORT, method: req.method, path: req.url, headers: req.headers }, (r) => { res.writeHead(r.statusCode || 502, r.headers); r.pipe(res); });
      up2.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
      req.pipe(up2);
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain' }); res.end('The local play server could not sign in: ' + (e && e.message));
    }
  });
  await new Promise((r) => door.listen(PLAY_PORT, HOST, r));
  console.log(`\nREADY. Open:  http://${HOST}:${PLAY_PORT}/?arbor2=1\n(this PC only; a throwaway database with the sample content; Ctrl+C stops it and deletes the database)`);
  await pool.end().catch(() => {});
  srv.on('exit', (c) => { if (!stopping) { console.error(`The server stopped (${c}).`); stop(1); } });
} catch (e) {
  console.error('Could not start:', e && e.message);
  await stop(1);
}
