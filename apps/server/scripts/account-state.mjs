// READ-ONLY COUNTS and the SERVER-SIDE WIPE of ONE account (Fable + Nick, Oct 29: "main" and "sample"). The owner's own terminal, via railway run.
//
//   ACCOUNT_EMAIL=<the address> railway run --service Postgres node apps/server/scripts/account-state.mjs --role main|sample --counts [--record]
//   ACCOUNT_EMAIL=<the address> railway run --service Postgres node apps/server/scripts/account-state.mjs --role main|sample --wipe --expect-id <id from --counts> [--record]
// Run from the writer-studio FOLDER (the Railway CLI takes its project from the folder; a worktree resolves to another product - see create-account.mjs).
//
// --counts   prints, per collection, total / live / in the Trash / purged, the lifetime word count and the number of opened themes. Writes nothing.
// --wipe     deletes the account's pages, boards, binders, Drawers and plans FOR GOOD through the app's OWN purge path: it mounts the REAL syncRouter from the
//            built server (dist/sync.js, unmodified) and sends it ordinary push records that carry `purgedAt`. The server then writes the SHELL itself (purged_at
//            set, every content column cleared, last-write-wins bypassed, a later stale push refused and acknowledged). NO raw DELETE or UPDATE of content here.
//            It never touches the users row: words_written and themes_opened are read before and after and the run FAILS if either went down.
//            Refuses unless: the pre-check passes (this app's project, a users table), --expect-id matches the account, and --role is given.
//            An account with nothing live and nothing in the Trash is reported "already empty" and left alone.
// --record   (sample only) writes the account's id (and nothing else) to ~/.wrizo/sample-account.json - the one id the seed will ever agree to rebuild.
//
// THE ADDRESS comes from the environment, is normalized, and is NEVER printed, logged or written. Output is counts, the account id and status words only.
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeEmail } from './set-password.mjs';
import { preflight, recordSampleId, sampleAccountFile } from './create-account.mjs';

const require = createRequire(import.meta.url);
const COLLECTIONS = [
  { key: 'journalEntries', table: 'journal_entries', label: 'pages+boards' },
  { key: 'projects', table: 'projects', label: 'binders' },
  { key: 'drawers', table: 'drawers', label: 'Drawers' },
  { key: 'storyPlans', table: 'story_plans', label: 'plans' },
];
const PUSH_CHUNK = 60;
// The app's built-in places (the Journal, the Shelf, the Trash: a board whose meta box carries systemKind) are not the writer's content: the in-app delete skips them
// (deleteSeams.ts softAll: `!getSystemKind(e)`), the client mints them itself, and they are neither counted as live nor purged here.
const SYS = `(page_type = 'board' and jsonb_typeof(boxes) = 'array' and exists (select 1 from jsonb_array_elements(boxes) b where jsonb_typeof(b) = 'object' and b ? 'systemKind'))`;

const iso = (v) => (v ? new Date(v).toISOString() : undefined);

export async function readState(db, userId) {
  const out = { collections: {}, user: null, sessions: 0, drafts: 0 };
  for (const c of COLLECTIONS) {
    const sys = c.table === 'journal_entries' ? SYS : 'false';
    const { rows } = await db.query(
      `select count(*)::int as total,
              count(*) filter (where purged_at is null and deleted_at is null and not ${sys})::int as live,
              count(*) filter (where purged_at is null and deleted_at is not null and not ${sys})::int as trashed,
              count(*) filter (where purged_at is not null)::int as purged,
              count(*) filter (where purged_at is null and ${sys})::int as builtin
         from ${c.table} where user_id = $1`, [userId]);
    out.collections[c.key] = rows[0];
  }
  const u = await db.query(`select words_written, themes_opened from users where id = $1`, [userId]);
  out.user = { wordsWritten: Number(u.rows[0]?.words_written ?? 0), themesOpened: Object.keys(u.rows[0]?.themes_opened ?? {}).filter((k) => u.rows[0].themes_opened[k]).length };
  out.sessions = (await db.query(`select count(*)::int as n from sessions_log where user_id = $1`, [userId])).rows[0].n;
  out.drafts = (await db.query(`select count(*)::int as n from drafts where user_id = $1`, [userId])).rows[0].n;
  return out;
}

export const isEmpty = (st) => Object.values(st.collections).every((c) => c.live === 0 && c.trashed === 0);

export function describe(role, when, st) {
  const parts = COLLECTIONS.map((c) => { const x = st.collections[c.key]; return `${c.label} ${x.total} (live ${x.live}, Trash ${x.trashed}, purged ${x.purged}${x.builtin ? `, built-in ${x.builtin}` : ''})`; });
  return `${role} ${when}: ${parts.join('; ')}; sessions ${st.sessions}; drafts ${st.drafts}; lifetime words ${st.user.wordsWritten}; themes opened ${st.user.themesOpened}`;
}

// The purge records: every row not yet purged, as the ordinary push record the client itself sends for a purge.
export async function purgeRecords(db, userId) {
  const now = new Date().toISOString();
  const recs = { journalEntries: [], projects: [], drawers: [], storyPlans: [] };
  const rec = (r, extra = {}) => ({ id: r.id, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at), deletedAt: iso(r.deleted_at), purgedAt: now, ...extra });
  for (const r of (await db.query(`select id, created_at, updated_at, deleted_at from journal_entries where user_id = $1 and purged_at is null and not ${SYS}`, [userId])).rows) recs.journalEntries.push(rec(r));
  for (const r of (await db.query(`select id, created_at, updated_at, deleted_at, type from projects where user_id = $1 and purged_at is null`, [userId])).rows) recs.projects.push(rec(r, { type: r.type }));
  for (const r of (await db.query(`select id, created_at, updated_at, deleted_at from drawers where user_id = $1 and purged_at is null`, [userId])).rows) recs.drawers.push(rec(r));
  for (const r of (await db.query(`select id, created_at, updated_at, deleted_at, project_id, framework_id from story_plans where user_id = $1 and purged_at is null`, [userId])).rows) recs.storyPlans.push(rec(r, { projectId: r.project_id, frameworkId: r.framework_id }));
  return recs;
}

// Mounts the REAL sync router (built server) behind a stub session for ONE user, on a loopback port. Returns { url, close }.
export async function mountSyncRouter(dbUrl, userId) {
  process.env.DATABASE_URL = dbUrl;
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || `wipe-${randomBytes(16).toString('hex')}`;
  let local = false; try { const h = new URL(dbUrl).hostname; local = h === '127.0.0.1' || h === 'localhost'; } catch { /* TLS on */ }
  process.env.NODE_ENV = local ? 'development' : 'production';   // db.ts: TLS on for the public Railway address, off for a loopback database
  const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  if (!existsSync(join(dist, 'sync.js'))) { console.error('Build the server first: pnpm --filter @writer-studio/server build'); process.exit(2); }
  const express = require('express');
  const { syncRouter } = require(join(dist, 'sync.js'));
  const app = express();
  app.use((req, _res, next) => { req.session = { userId }; next(); });
  app.use('/api/sync', express.json({ limit: '60mb' }));
  app.use('/api', syncRouter);
  const http = require('node:http');
  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const { pool: builtPool } = require(join(dist, 'db.js'));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((res) => { server.close(res); server.closeAllConnections(); }), endPool: () => builtPool.end() };   // the built server's own pool: ended by the caller when it is done (a Windows exit with it open aborts)
}

export async function pushPurges(baseUrl, recs) {
  let sent = 0; let rejected = 0; let failures = 0;
  for (const c of COLLECTIONS) {
    const list = recs[c.key];
    for (let i = 0; i < list.length; i += PUSH_CHUNK) {
      const chunk = list.slice(i, i + PUSH_CHUNK);
      const res = await fetch(`${baseUrl}/api/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lastSyncAt: null, pull: false, push: { [c.key]: chunk } }) });
      if (!res.ok) { failures += 1; continue; }
      const body = await res.json();
      sent += chunk.length;
      rejected += Object.values(body.rejected ?? {}).reduce((n, ids) => n + ids.length, 0);
    }
  }
  return { sent, rejected, failures };
}

const flag = (name) => process.argv.includes(name);
const argAfter = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };

async function main() {
  const role = argAfter('--role');
  if (role !== 'main' && role !== 'sample') { console.error('--role takes "main" or "sample".'); process.exit(2); }
  const wipe = flag('--wipe'); const counts = flag('--counts');
  if (wipe === counts) { console.error('Give exactly one of --counts or --wipe.'); process.exit(2); }
  if (flag('--record') && role !== 'sample') { console.error('--record is for the sample account only.'); process.exit(2); }
  const email = normalizeEmail(process.env.ACCOUNT_EMAIL || '');
  if (!email) { console.error('ACCOUNT_EMAIL is not set.'); process.exit(2); }
  const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  if (!url) { console.error('No database connection is set. Run it as: railway run --service Postgres node apps/server/scripts/account-state.mjs'); process.exit(2); }

  const { Pool } = require('pg');
  let loopback = false;
  try { const h = new URL(url).hostname; loopback = h === '127.0.0.1' || h === 'localhost'; } catch { /* leave TLS on */ }
  const pool = new Pool({ connectionString: url, ssl: loopback ? false : { rejectUnauthorized: false }, max: 2 });
  let mounted = null;
  try {
    const pre = await preflight(pool);
    for (const line of pre.lines) console.log(line);
    if (!pre.ok) { console.error(`Stopped (${pre.code}): this is not the app's database. Nothing was changed.`); process.exitCode = 1; return; }

    const found = await pool.query(`select id from users where lower(email) = $1`, [email]);
    if (found.rows.length !== 1) { console.error(`Stopped: ${found.rows.length === 0 ? 'no account has that address' : 'more than one account matched'}. Nothing was changed.`); process.exitCode = 1; return; }
    const userId = String(found.rows[0].id);
    console.log(`${role} account id: ${userId}`);

    const before = await readState(pool, userId);
    console.log(describe(role, 'before', before));

    if (wipe) {
      if (argAfter('--expect-id') !== userId) { console.error('Stopped: --expect-id does not match this account (take it from a --counts run). Nothing was changed.'); process.exitCode = 1; return; }
      if (isEmpty(before)) { console.log(`${role}: already empty - nothing to wipe.`); }
      else {
        const recs = await purgeRecords(pool, userId);
        mounted = await mountSyncRouter(url, userId);
        const r = await pushPurges(mounted.url, recs);
        console.log(`purge pushed through the app's sync route: ${r.sent} records sent, ${r.rejected} rejected, ${r.failures} failed requests`);
        const after = await readState(pool, userId);
        console.log(describe(role, 'after', after));
        const keptUnlocks = after.user.wordsWritten >= before.user.wordsWritten && after.user.themesOpened >= before.user.themesOpened;
        const emptied = isEmpty(after) && Object.values(after.collections).every((c) => c.live === 0 && c.trashed === 0);
        console.log(`words_written and unlocks not lowered: ${keptUnlocks ? 'yes' : 'NO'}; account empty: ${emptied ? 'yes' : 'NO'}`);
        if (!keptUnlocks || !emptied || r.rejected || r.failures) process.exitCode = 1;
      }
    }

    if (flag('--record')) {
      const file = sampleAccountFile();
      if (existsSync(file)) {
        const had = JSON.parse(readFileSync(file, 'utf8')).userId;
        console.log(had === userId ? 'sample id file: already records this account.' : 'sample id file: records a DIFFERENT account - left alone.');
        if (had !== userId) process.exitCode = 1;
      } else { recordSampleId(file, userId); console.log('sample id file: written (the account id only).'); }
    }
  } catch (err) {
    console.error(`Could not finish (${err && err.code ? err.code : 'error'}).`);
    process.exitCode = 1;
  } finally {
    if (mounted) { await mounted.close(); await mounted.endPool(); }
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  // no process.exit() on the happy path: a Windows exit with fetch's keep-alive sockets still open aborts the process (0xC0000409). Everything is closed, so the loop drains; the timer is the backstop.
  main().then(() => { setTimeout(() => process.exit(process.exitCode ?? 0), 4000).unref(); }, () => { console.error('Could not finish.'); process.exit(1); });
}
