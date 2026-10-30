// SAMPLE-SCREENS: seeds the sample world into a THROWAWAY local Postgres (the same runSeed the owner runs against production), serves the real built app + server against it, signs in
// as the sample account in a real browser, and photographs every Drawer (Arbor, dark page): each board in Open and in Outline, one page per Drawer, the Journal and the Trash.
// A CAPTURE TOOL (no verdict line; not part of any suite pair). It needs a BOX TURN (WS_BOX_TURN) and the web build (pnpm --filter @writer-studio/desktop build:web) and the server build.
//
// The password is made here, held in this process only, and never printed or written; the address is example.invalid. Nothing here touches production.
// Run (repo root):  EMBEDDED_PG_FROM=<package.json with embedded-postgres>  SAMPLE_CONTENT=<content.md>  WS_BOX_TURN=<token>  node apps/server/scripts/harness/sample-screens.mjs [outDir]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const server = join(here, '..', '..');
const desktop = join(server, '..', 'desktop');
const OUT = process.argv[2] || join(process.env.USERPROFILE || process.env.HOME || '.', 'Downloads', 'sample-account-screens');
mkdirSync(OUT, { recursive: true });
const CONTENT = process.env.SAMPLE_CONTENT || join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads', 'sample-account-content.md');
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(server, 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');
const PG_PORT = 54334; const WEB_PORT = 3399;
const DB = `postgres://postgres:postgres@127.0.0.1:${PG_PORT}/t`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const root = mkdtempSync(join(tmpdir(), 'sample-screens-'));
const pg = new EmbeddedPostgres({ databaseDir: join(root, 'data'), user: 'postgres', password: 'postgres', port: PG_PORT, persistent: false, initdbFlags: ['--encoding=UTF8', '--locale=C'] });
let srv = null; let pool = null;
const manifest = [];
try {
  await pg.initialise(); await pg.start(); await pg.createDatabase('t');
  process.env.DATABASE_URL = DB; process.env.SESSION_SECRET = randomBytes(16).toString('hex'); process.env.NODE_ENV = 'development';
  await reqSrv(join(server, 'dist', 'migrate.js')).runMigrations();
  pool = new Pool({ connectionString: DB });
  const { hashPassword } = reqSrv(join(server, 'dist', 'passwordHash.js'));
  const PW = randomBytes(12).toString('base64url');
  const EMAIL = 'sample@example.invalid';
  const uid = String((await pool.query(`insert into users (email, pass_hash, name) values ($1,$2,'Sample') returning id`, [EMAIL, await hashPassword(PW)])).rows[0].id);
  const sampleFile = join(root, 'sample.json');
  writeFileSync(sampleFile, JSON.stringify({ userId: uid, recordedAt: new Date().toISOString() }));

  const { runSeed } = await import(pathToFileURL(join(server, 'scripts', 'sample-seed.mjs')).href);
  const code = await runSeed({ pool, url: DB, email: EMAIL, md: readFileSync(CONTENT, 'utf8'), mode: 'seed', expectId: uid, sampleFile, log: (l) => manifest.push(l), err: (l) => manifest.push(`ERR ${l}`) });
  if (code !== 0) throw new Error('the seed did not finish cleanly');
  await reqSrv(join(server, 'dist', 'db.js')).pool.end().catch(() => {});

  // the real server (it serves the built web app), on the throwaway database
  srv = spawn(process.execPath, [join(server, 'dist', 'index.js')], { env: { ...process.env, PORT: String(WEB_PORT), DATABASE_URL: DB, NODE_ENV: 'development' }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${WEB_PORT}/healthz`); if (r.ok) break; } catch { /* not up yet */ } await sleep(500); }

  // ids of the boards and pages to photograph, from the database
  const rows = (await pool.query(`select id, text, page_type, project_id, deleted_at, origin from journal_entries where user_id = $1 and purged_at is null`, [uid])).rows;
  const sets = (await pool.query(`select id, title, drawer_id from projects where user_id = $1 and purged_at is null`, [uid])).rows;
  const drawers = (await pool.query(`select id, name, "order" from drawers where user_id = $1 and purged_at is null order by "order", created_at`, [uid])).rows;
  const first = (t) => t.split('\n').find((l) => l.trim()) || '';
  const plan = [];
  for (const d of drawers) {
    const setIds = sets.filter((s) => s.drawer_id === d.id).map((s) => s.id);
    const inD = rows.filter((r) => setIds.includes(r.project_id) && !r.deleted_at);
    const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    for (const b of inD.filter((r) => r.page_type === 'board')) plan.push({ kind: 'board', drawer: slug, id: b.id, name: first(b.text) });
    // one page per Drawer: the one that shows the Drawer's room best
    const prefer = { 'the-ferry-letters': /^The six o.clock ferry/, 'low-water': null, thesis: /^# Chapter 1/, 'lamp-room-readers': /^# \[The Lamp Room Readers/, 'the-last-keeper': /^The Last Keeper\n/ }[slug];
    const pg1 = (slug === 'low-water' ? inD.find((r) => r.page_type === 'script') : prefer ? inD.find((r) => prefer.test(r.text)) : null) || inD.find((r) => r.page_type !== 'board');
    if (pg1) plan.push({ kind: 'page', drawer: slug, id: pg1.id, name: first(pg1.text) });
  }
  plan.push({ kind: 'journal', drawer: 'journal', id: '', name: 'Journal' });
  plan.push({ kind: 'trash', drawer: 'trash', id: '', name: 'Trash' });

  const { withHarness } = await import(pathToFileURL(join(desktop, 'scripts', 'runtime-verify.mjs')).href);
  const base = `http://127.0.0.1:${WEB_PORT}`;
  await withHarness(async (app) => {
    await app.waitFor(`document.readyState === 'complete'`, { label: 'document loaded' });
    await app.injectHelpers();
    await app.emulateDpr(1, 1440, 900);
    // sign in as the sample account (credentials held in this process only), keep the first-run gate out of the way, Arbor + dark page
    await app.evalJs(`fetch('/auth/login', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: ${JSON.stringify(EMAIL)}, password: ${JSON.stringify(PW)} }) }).then((r) => r.status)`, { awaitPromise: true }).then((s) => { if (s !== 200) throw new Error('sign-in failed ' + s); });
    await app.evalJs(`localStorage.setItem('wrizo-first-run-complete', '1'); document.documentElement.removeAttribute('data-theme'); document.documentElement.removeAttribute('data-page'); true;`);
    const modes = {};
    for (const p of plan) if (p.kind === 'board') modes[p.id] = 'open';
    // a client-side navigation AFTER the app has booted and the splash is gone (a hash set before a reload is overtaken by the resume pointer)
    const go = async (hash) => {
      await app.waitFor(`!document.querySelector('.wz-splash')`, { label: 'splash gone', timeout: 30000 }).catch(() => {});
      await sleep(800);
      await app.evalJs(`location.hash = ${JSON.stringify(hash)}; true;`);
    };
    const shoot = async (file, why) => {
      // the splash holds the screen until the first pull has landed: wait for it to go, then let the page settle
      await app.waitFor(`!document.querySelector('.wz-splash')`, { label: 'splash gone', timeout: 30000 }).catch(() => manifest.push(`WARN ${file}: the splash was still up`));
      await sleep(1600);
      const state = JSON.parse(await app.evalJs(`JSON.stringify({ h: location.hash, t: (document.title || '').slice(0, 40), cards: document.querySelectorAll('[data-box-id], .board-card, .outline-row, .wz-card').length })`));
      writeFileSync(join(OUT, file), Buffer.from(await app.screenshot(), 'base64'));
      manifest.push(`shot ${file}: ${why}; ${JSON.stringify(state)}`);
    };
    for (const p of plan) {
      const slug = `${String(plan.indexOf(p) + 1).padStart(2, '0')}-${p.drawer}-${p.kind}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28)}`;
      if (p.kind === 'board') {
        for (const mode of ['open', 'outline']) {
          await app.evalJs(`localStorage.setItem('wrizo-board-mode', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('wrizo-board-mode') || '{}'), { ${JSON.stringify(p.id)}: ${JSON.stringify(mode)} }))); true;`);
          await app.reload();
          await app.injectHelpers();
          await go(`#/page/${p.id}`);
          await shoot(`${slug}-${mode}.png`, `${p.name} (${mode})`);
        }
      } else {
        const hash = p.kind === 'page' ? `#/page/${p.id}` : p.kind === 'journal' ? '#/journal' : '#/trash';
        await app.reload();
        await app.injectHelpers();
        await go(hash);
        await shoot(`${slug}.png`, p.name);
      }
    }
  }, { targetUrl: base, verifyRows: false });
  writeFileSync(join(OUT, 'manifest.log.txt'), manifest.filter((l) => !/example\.invalid/.test(l)).join('\n') + '\n');
  console.log(`captured ${manifest.filter((l) => l.startsWith('shot ')).length} screens to ${OUT}`);
} finally {
  if (srv) srv.kill();
  await sleep(500);
  if (pool) await pool.end().catch(() => {});
  await pg.stop().catch(() => {}); rmSync(root, { recursive: true, force: true });
}
