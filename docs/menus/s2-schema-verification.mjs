// S2 — EXECUTE M2 FOR REAL, against a throwaway embedded Postgres.
// NEVER production: this boots its own cluster in the scratchpad on a
// non-default port, and destroys it at the end.
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const HERE = 'C:/Users/nickh/AppData/Local/Temp/claude/c--Users-nickh-writer-studio/82afeb8c-c897-4257-b07e-052cf3793ac7/scratchpad/pgtest';
const REPO = 'C:/Users/nickh/writer-studio/.claude/menus';
const PORT = 55432;

const say = (ok, msg) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
// jsonb DOES NOT PRESERVE KEY ORDER — it stores a normalised representation.
// So JSON.stringify equality is the wrong test for a round-trip: it reports a
// difference that does not exist in the data. Compare by value, order-blind,
// which is also how the app reads these objects (by field name).
const deepEq = (a, b) => {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
  return ka.every(k => deepEq(a[k], b[k]));
};
let red = 0;
const check = (ok, msg) => { if (!ok) red++; say(ok, msg); };

const pgsql = new EmbeddedPostgres({
  databaseDir: path.join(HERE, 'cluster'),
  user: 'postgres', password: 'postgres',
  port: PORT, persistent: false,
});

console.log('booting throwaway postgres on :' + PORT + ' …');
await pgsql.initialise();
await pgsql.start();
await pgsql.createDatabase('wrizo_s2');

const client = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', password: 'postgres', database: 'wrizo_s2' });
await client.connect();

// --- the app's own init schema, then the incremental adds ----------------
const initSql = readFileSync(path.join(REPO, 'apps/server/migrations/001_init.sql'), 'utf8');
await client.query(initSql);
console.log('001_init.sql applied');

// Extract every `alter table ... add column if not exists ...` from migrate.ts
// and run them IN ORDER — this is the real boot path's statement list, read
// from the shipped source rather than retyped.
const migrateTs = readFileSync(path.join(REPO, 'apps/server/src/migrate.ts'), 'utf8');
// `\s*` after the paren matters: the two CREATE TABLE calls (drawers,
// journal_entries) are multi-line — `pool.query(\n  \`create table …\`)` — so a
// regex demanding the backtick immediately after `(` silently skips them and
// the alters then run against tables that were never made.
const stmts = [...migrateTs.matchAll(/pool\.query\(\s*`([^`]+)`/g)].map(m => m[1].trim())
  .filter(s => /^alter table|^create table/i.test(s));
console.log(`found ${stmts.length} incremental DDL statements in migrate.ts`);

async function runBoot(label) {
  for (const s of stmts) await client.query(s);
  console.log(`boot ${label}: ${stmts.length} statements OK`);
}

// --- GATE 1: idempotence, PROVEN BY EXECUTION (boot twice) ---------------
await runBoot('#1');
await runBoot('#2');
check(true, 'migration boots TWICE without error (idempotence proven by execution, not by reading `if not exists`)');

const cols = await client.query(`
  select table_name, column_name, data_type from information_schema.columns
  where (table_name='journal_entries' and column_name='page_settings')
     or (table_name='users' and column_name='page_defaults')
  order by table_name`);
check(cols.rows.length === 2, `both columns exist after two boots: ${JSON.stringify(cols.rows)}`);
check(cols.rows.every(r => r.data_type === 'jsonb'), 'both columns are jsonb');

// --- GATE 2: the API round-trip ------------------------------------------
const SETTINGS = {
  margins: 'wide', lineSpacing: 1.9,
  pageNumbers: { on: true, placement: 'bottom-right' },
  headers: { on: true, text: 'Chapter One' },
  footers: { on: false, text: '' },
};

const u = await client.query(`insert into users (id, email, pass_hash) values (gen_random_uuid(), 's2@test', 'x') returning id`);
const userId = u.rows[0].id;

// PATCH page_settings — the same UPDATE shape the sync upsert performs
await client.query(
  `insert into journal_entries (id, user_id, text, created_at, updated_at, page_settings)
   values ($1,$2,$3,now(),now(),$4::jsonb)`,
  ['s2-page-1', userId, 'hello', JSON.stringify(SETTINGS)]);
const back = await client.query(`select page_settings from journal_entries where id=$1`, ['s2-page-1']);
check(deepEq(back.rows[0].page_settings, SETTINGS),
  `page_settings round-trips value-equal (jsonb reorders keys; the app reads by name): ${JSON.stringify(back.rows[0].page_settings)}`);

// A page never dressed reads SQL null -> the grandfather fixed point
await client.query(
  `insert into journal_entries (id, user_id, text, created_at, updated_at)
   values ($1,$2,$3,now(),now())`, ['s2-page-plain', userId, 'undressed']);
const plain = await client.query(`select page_settings from journal_entries where id=$1`, ['s2-page-plain']);
check(plain.rows[0].page_settings === null,
  'an undressed page reads SQL null (grandfather fixed point: null -> JS undefined -> app fallback)');

// PUT page_defaults
const DEFAULTS = { ...SETTINGS, margins: 'narrow', headers: { on: false, text: '' } };
await client.query(`update users set page_defaults=$2::jsonb where id=$1`, [userId, JSON.stringify(DEFAULTS)]);
const gotDefaults = await client.query(`select page_defaults from users where id=$1`, [userId]);
check(deepEq(gotDefaults.rows[0].page_defaults, DEFAULTS),
  'page_defaults round-trips value-equal via the GET/PUT columns');

// BIRTH FROM DEFAULTS — the client copies the user's defaults at creation.
// Simulated exactly as store/persistence.createJournalPage does: read the
// defaults, write them onto the NEW row.
const born = gotDefaults.rows[0].page_defaults;
await client.query(
  `insert into journal_entries (id, user_id, text, created_at, updated_at, page_settings)
   values ($1,$2,$3,now(),now(),$4::jsonb)`,
  ['s2-page-born', userId, '', JSON.stringify(born)]);
const bornBack = await client.query(`select page_settings from journal_entries where id=$1`, ['s2-page-born']);
check(deepEq(bornBack.rows[0].page_settings, DEFAULTS),
  'a NEW page is born from the writer\'s defaults (R6 "reset to defaults on a new page")');

// and changing defaults later must NOT re-dress the already-written page
await client.query(`update users set page_defaults=$2::jsonb where id=$1`,
  [userId, JSON.stringify({ ...DEFAULTS, margins: 'wide' })]);
const untouched = await client.query(`select page_settings from journal_entries where id=$1`, ['s2-page-born']);
check(untouched.rows[0].page_settings.margins === 'narrow',
  'changing defaults LATER does not re-dress a page already written (why birth is a copy, not a live link)');

await client.end();
await pgsql.stop();
console.log(`\n${red === 0 ? 'S2 GREEN' : 'S2 RED (' + red + ' failed)'}`);
process.exit(red ? 1 : 0);
