// BACKUP PROOF - per-table row counts (this desk). Reads the database address from the environment (PGADDR, or the standard PG* variables); NEVER prints, logs or writes the address or any part of it.
// Prints ONLY: the server's major version, each public table's name and exact row count, a total, and the elapsed time. Optional: BP_OUT=<file> writes the same table (names + counts only) as JSON.
// Run (from apps/server so `pg` resolves):  node <this file>        PGSSL=1 to force TLS (a Railway public proxy needs it).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('C:/Users/nickh/writer-studio/apps/server/package.json');
const pg = require('pg');
const t0 = Date.now();
const addr = process.env.PGADDR || '';
const secrets = [];
if (addr) { secrets.push(addr); try { const u = new URL(addr); for (const p of [u.hostname, decodeURIComponent(u.username), decodeURIComponent(u.password), u.pathname.replace(/^\//, '')]) if (p) secrets.push(p); } catch { /* not a URL: only the whole string is redacted */ } }
for (const k of ['PGPASSWORD', 'PGUSER', 'PGHOST', 'PGDATABASE']) if (process.env[k]) secrets.push(process.env[k]);
const redact = (s) => { let o = String(s); for (const x of secrets.sort((a, b) => b.length - a.length)) o = o.split(x).join('<redacted>'); return o; };
const useTls = process.env.PGSSL === '1' || /rlwy\.net|railway/i.test(addr + (process.env.PGHOST || ''));
const client = new pg.Client(addr ? { connectionString: addr, ssl: useTls ? { rejectUnauthorized: false } : undefined } : { ssl: useTls ? { rejectUnauthorized: false } : undefined });
try {
  await client.connect();
  await client.query("set time zone 'UTC'");   // row text of timestamps must not depend on the server's zone, or two servers could never fingerprint equal
  const v = await client.query("select current_setting('server_version_num')::int as n");
  const major = Math.floor(v.rows[0].n / 10000);
  const t = await client.query("select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name");
  // WRONG-DATABASE GUARD (Fable, Oct 18, after a first run reached another system's database): Wrizo's database always has BOTH `users` and `journal_entries`. If either is missing this is not Wrizo's database:
  // print ONLY "wrong database, stopped" - no table name, no count, no version - write nothing, count nothing, and exit non-zero so the caller stops before any dump.
  const have = new Set(t.rows.map((x) => x.table_name));
  if (!have.has('users') || !have.has('journal_entries')) { console.log('wrong database, stopped'); process.exitCode = 3; throw Object.assign(new Error('wrong database'), { bpWrongDb: true }); }
  const rows = [];
  for (const { table_name } of t.rows) {
    const q = 'select count(*)::bigint as c from "public"."' + table_name.replace(/"/g, '""') + '"';
    const r = await client.query(q);
    // CONTENT FINGERPRINT: md5 over the md5 of every row's text, order-independent - a hash only, no content leaves the database; equal counts with different content differ here.
    const f = await client.query("select coalesce(md5(string_agg(md5(t::text), '' order by md5(t::text))), md5('')) as fp from \"public\".\"" + table_name.replace(/"/g, '""') + "\" t");
    rows.push({ table: table_name, rows: Number(r.rows[0].c), fp: f.rows[0].fp });
  }
  const total = rows.reduce((a, r) => a + r.rows, 0);
  for (const r of rows) console.log('BPCOUNT ' + r.table + ' ' + r.rows + ' fp=' + r.fp.slice(0, 12));
  console.log('BPCOUNT-SUMMARY serverMajor=' + major + ' tables=' + rows.length + ' totalRows=' + total + ' seconds=' + ((Date.now() - t0) / 1000).toFixed(1));
  if (process.env.BP_OUT) writeFileSync(process.env.BP_OUT, JSON.stringify({ serverMajor: major, rows }, null, 2) + '\n');
} catch (e) {
  if (e && e.bpWrongDb) { /* already said "wrong database, stopped" with exit code 3; say nothing more */ }
  else {
    console.log('BPCOUNT-ERROR ' + redact(e && e.code ? e.code + ' ' + (e.message || '') : (e && e.message) || e));
    process.exitCode = 1;
  }
} finally { try { await client.end(); } catch { /* gone */ } }
