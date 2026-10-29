// ACCOUNT-STATE (apps/server/scripts/account-state.mjs) - the counts and the server-side wipe, proven against a REAL throwaway Postgres with the REAL schema
// (dist/migrate.js) and the REAL sync router (dist/sync.js): the wipe is an ordinary purge push, so the proof is the server's own rules, not a copy of them.
//   D1  --counts: before the wipe the target holds live / Trash / already-purged rows in all four collections, and the counts say so (no write)
//   D2  --wipe (through the script, as a child process): live 0 and Trash 0 in all four collections; every row is a purged shell (purged_at set, text ''
//       and the page's boxes/ink/links null) - none deleted, none left readable
//   D3  words_written and themes_opened are exactly what they were; the sessions log keeps its rows
//   D4  a bystander account (same tables) is untouched: counts, text and boxes identical
//   D5  a STALE push for a purged id (a newer updatedAt, a non-purge record) is refused and acknowledged by the real route, and the row stays a shell
//   D6  refusals: no --expect-id / a wrong one -> stopped, nothing changed; an unknown address -> stopped; an already-empty account -> "already empty", nothing pushed
//   D7  the address and the password hash appear nowhere in the script's output
//   D8  --record (sample): writes the id ONLY; a second run leaves the file alone; a different account is refused
// Mutant (asserted to have LANDED): MD1 the same rows pushed WITHOUT purgedAt (an ordinary save, not a purge) leave the account non-empty - so D2 would catch a wipe that
//   forgot the purge mark.
// Run (repo root; the server built):  EMBEDDED_PG_FROM=C:/path/to/package.json-with-embedded-postgres  node apps/server/scripts/harness/account-state-db.mjs
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '..', 'account-state.mjs');
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(here, '..', '..', 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');
const PORT = 54332;
const URL_ = `postgres://postgres:postgres@127.0.0.1:${PORT}/t`;

const checks = [];
const ok = (n, p, d = '') => { checks.push([n, p]); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? `  [${String(d).slice(0, 500)}]` : ''}`); };
const root = mkdtempSync(join(tmpdir(), 'acct-state-'));
const pg = new EmbeddedPostgres({ databaseDir: join(root, 'data'), user: 'postgres', password: 'postgres', port: PORT, persistent: false });
await pg.initialise(); await pg.start(); await pg.createDatabase('t');

// the real schema, from the built server
process.env.DATABASE_URL = URL_; process.env.SESSION_SECRET = 'proof'; process.env.NODE_ENV = 'development';
await reqSrv(join(here, '..', '..', 'dist', 'migrate.js')).runMigrations();
const pool = new Pool({ connectionString: URL_ });
const acct = await import(pathToFileURL(script).href);

const EMAIL = 'target-owner@example.invalid';
const OTHER = 'bystander@example.invalid';
const HASH = '$2a$12$thisIsAnObviousFakeHashForTheProofOnlyXXXXXXXXXXXXXXXXXXXX';
const T = '2026-10-01T10:00:00.000Z';
const mkUser = async (email, words, themes) => (await pool.query(`insert into users (email, pass_hash, name, words_written, themes_opened) values ($1,$2,'x',$3,$4::jsonb) returning id`, [email, HASH, words, JSON.stringify(themes)])).rows[0].id;
const A = await mkUser(EMAIL, 31000, { copper: true, midnight: true });
const B = await mkUser(OTHER, 500, {});
const seed = async (uid, tag) => {
  const e = (id, text, extra = {}) => pool.query(`insert into journal_entries (id, user_id, text, boxes, created_at, updated_at, deleted_at, purged_at) values ($1,$2,$3,$4::jsonb,$5,$5,$6,$7)`,
    [`${tag}-${id}`, uid, text, extra.purged ? null : JSON.stringify([{ id: 'b1', text: 'a card' }]), T, extra.deleted ?? null, extra.purged ?? null]);   // an already-purged row is a real shell (boxes null)
  await e('p1', 'a live page'); await e('p2', 'another live page'); await e('board1', 'a board'); await e('t1', 'in the Trash', { deleted: T }); await e('x1', '', { deleted: T, purged: T });
  await pool.query(`insert into projects (id, user_id, title, type, created_at, updated_at) values ($1,$2,'a binder','creative',$3,$3)`, [`${tag}-proj`, uid, T]);
  await pool.query(`insert into drafts (id, user_id, text, updated_at) values ($1,$2,'scratch words',$3)`, [`${tag}-proj`, uid, T]);
  await pool.query(`insert into drawers (id, user_id, name, "order", created_at, updated_at) values ($1,$2,'a drawer',0,$3,$3)`, [`${tag}-dr`, uid, T]);
  await pool.query(`insert into story_plans (id, user_id, project_id, framework_id, beat_notes, created_at, updated_at) values ($1,$2,$3,'three-act','[]'::jsonb,$4,$4)`, [`${tag}-sp`, uid, `${tag}-proj`, T]);
  await pool.query(`insert into sessions_log (id, user_id, project_id, started_at, word_count, updated_at) values ($1,$2,$3,$4,120,$4)`, [`${tag}-s`, uid, `${tag}-proj`, T]).catch(() => {});
};
await seed(A, 'a'); await seed(B, 'b');
const bystanderBefore = JSON.stringify((await pool.query(`select id, text, boxes, deleted_at, purged_at from journal_entries where user_id = $1 order by id`, [B])).rows);

const run = (args, env = {}) => spawnSync(process.execPath, [script, ...args], { env: { ...process.env, DATABASE_PUBLIC_URL: URL_, DATABASE_URL: URL_, RAILWAY_PROJECT_NAME: '', ACCOUNT_EMAIL: EMAIL, SAMPLE_ACCOUNT_FILE: join(root, 'sample.json'), ...env }, encoding: 'utf8', timeout: 120000 });
const all = (r) => `${r.stdout}\n${r.stderr}`;
try {
  // D1
  const counts = run(['--role', 'main', '--counts']);
  const st = await acct.readState(pool, A);
  ok(`D1 --counts reads without writing: exit ${counts.status}; pages+boards live ${st.collections.journalEntries.live}, Trash ${st.collections.journalEntries.trashed}, purged ${st.collections.journalEntries.purged}; binders ${st.collections.projects.live}, Drawers ${st.collections.drawers.live}, plans ${st.collections.storyPlans.live}`,
    counts.status === 0 && st.collections.journalEntries.live === 3 && st.collections.journalEntries.trashed === 1 && st.collections.journalEntries.purged === 1 && st.collections.projects.live === 1 && st.collections.drawers.live === 1 && st.collections.storyPlans.live === 1 && /main before:/.test(counts.stdout), counts.stdout.trim().split('\n').slice(-1)[0]);

  // D6 refusals (nothing may change)
  const noId = run(['--role', 'main', '--wipe']);
  const wrongId = run(['--role', 'main', '--wipe', '--expect-id', 'not-this-one']);
  const unknown = run(['--role', 'main', '--wipe', '--expect-id', String(A)], { ACCOUNT_EMAIL: 'nobody@example.invalid' });
  const unchanged = (await acct.readState(pool, A)).collections.journalEntries.live === 3;
  ok(`D6a refusals change nothing: no --expect-id (exit ${noId.status}), a wrong one (${wrongId.status}), an unknown address (${unknown.status}); the account still has its 3 live pages`, noId.status === 1 && wrongId.status === 1 && unknown.status === 1 && unchanged);

  // D2 / D3 the wipe
  const w = run(['--role', 'main', '--wipe', '--expect-id', String(A)]);
  const after = await acct.readState(pool, A);
  const rows = (await pool.query(`select id, text, boxes, deleted_at, purged_at from journal_entries where user_id = $1`, [A])).rows;
  const shells = rows.every((r) => r.purged_at && r.text === '' && r.boxes === null);
  const c = after.collections;
  ok(`D2 the wipe (exit ${w.status}) empties the account through the sync route: live 0 and Trash 0 in all four collections; ${rows.length} page rows are all purged shells (text '', boxes null)`,
    w.status === 0 && acct.isEmpty(after) && c.journalEntries.purged === 5 && c.projects.purged === 1 && c.drawers.purged === 1 && c.storyPlans.purged === 1 && shells && /records sent, 0 rejected, 0 failed/.test(w.stdout), w.stdout.trim().split('\n').slice(-3).join(' | '));
  const drafts = (await pool.query(`select text from drafts where user_id = $1`, [A])).rows.map((r) => r.text);
  ok(`D3 words_written (${after.user.wordsWritten}) and opened themes (${after.user.themesOpened}) are exactly what they were (31000 / 2); the binder's scratch draft is cleared by the server's own shell (${J(drafts)})`,
    after.user.wordsWritten === 31000 && after.user.themesOpened === 2 && drafts.every((t) => t === ''));
  // D4
  const bystanderAfter = JSON.stringify((await pool.query(`select id, text, boxes, deleted_at, purged_at from journal_entries where user_id = $1 order by id`, [B])).rows);
  const bst = await acct.readState(pool, B);
  ok('D4 the bystander account is untouched: every page row identical, its binder/Drawer/plan live, its words 500', bystanderAfter === bystanderBefore && bst.collections.projects.live === 1 && bst.collections.drawers.live === 1 && bst.collections.storyPlans.live === 1 && bst.user.wordsWritten === 500);
  // D5 a stale push
  const m = await acct.mountSyncRouter(URL_, A);
  const stale = await (await fetch(`${m.url}/api/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lastSyncAt: null, pull: false, push: { journalEntries: [{ id: 'a-p1', text: 'a stale device brings this back', createdAt: T, updatedAt: '2030-01-01T00:00:00.000Z' }] } }) })).json();
  await m.close();
  const back = (await pool.query(`select text, purged_at from journal_entries where id = 'a-p1'`)).rows[0];
  ok(`D5 a stale non-purge push (updatedAt 2030) onto a purged page is acknowledged (${J(stale.acknowledgedPurged)}) and the row stays a shell`, stale.acknowledgedPurged?.journalEntries?.includes('a-p1') && back.text === '' && !!back.purged_at);
  // D6 already empty
  const again = run(['--role', 'main', '--wipe', '--expect-id', String(A)]);
  ok(`D6b an already-empty account is reported "already empty" and nothing is pushed (exit ${again.status})`, again.status === 0 && /already empty/.test(again.stdout) && !/records sent/.test(again.stdout));
  // D7 secrets
  const out = [counts, noId, wrongId, unknown, w, again].map(all).join('\n');
  ok('D7 neither the address nor the password hash appears in any output of any run', !out.includes('example.invalid') && !out.includes(HASH) && !out.includes('thisIsAnObvious'));
  // D8 record
  const sampleFile = join(root, 'sample.json');
  const rec = run(['--role', 'sample', '--counts', '--record']);
  const first = existsSync(sampleFile) ? JSON.parse(readFileSync(sampleFile, 'utf8')) : null;
  const rec2 = run(['--role', 'sample', '--counts', '--record']);
  const rec3 = run(['--role', 'sample', '--counts', '--record'], { ACCOUNT_EMAIL: OTHER });
  ok(`D8 --record writes the id only (keys ${J(first && Object.keys(first).sort())}); a second run leaves it (${rec2.status}); a different account is refused (${rec3.status})`,
    rec.status === 0 && first && first.userId === String(A) && J(Object.keys(first).sort()) === J(['recordedAt', 'userId']) && rec2.status === 0 && /already records this account/.test(rec2.stdout) && rec3.status === 1 && !readFileSync(sampleFile, 'utf8').includes('@'));

  // MD1 mutant: the bystander's rows pushed as ordinary saves (no purgedAt) - the account must NOT be empty after
  const recs = await acct.purgeRecords(pool, B);
  for (const k of Object.keys(recs)) for (const r of recs[k]) delete r.purgedAt;
  const m2 = await acct.mountSyncRouter(URL_, B);
  await acct.pushPurges(m2.url, recs);
  await m2.close();
  const mut = await acct.readState(pool, B);
  ok(`MD1 (mutant): with the purge mark left off (LANDED: ${recs.journalEntries.length} page records sent as ordinary saves) the account is still not empty - live ${mut.collections.journalEntries.live}, Trash ${mut.collections.journalEntries.trashed} - so D2's emptiness check is real`, !acct.isEmpty(mut));
} finally {
  await reqSrv(join(here, '..', '..', 'dist', 'db.js')).pool.end().catch(() => {}); await pool.end(); await pg.stop(); rmSync(root, { recursive: true, force: true });
}
function J(v) { return JSON.stringify(v); }
const failed = checks.filter((c) => !c[1]).length;
console.log(failed ? `\nACCOUNT-STATE VERIFY: FAIL - ${failed}/${checks.length} failed` : `\nACCOUNT-STATE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed ? 1 : 0);
