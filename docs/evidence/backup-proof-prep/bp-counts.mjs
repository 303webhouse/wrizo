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
  const v = await client.query("select current_setting('server_version_num')::int as n");
  const major = Math.floor(v.rows[0].n / 10000);
  const t = await client.query("select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name");
  const rows = [];
  for (const { table_name } of t.rows) {
    const q = 'select count(*)::bigint as c from "public"."' + table_name.replace(/"/g, '""') + '"';
    const r = await client.query(q);
    rows.push({ table: table_name, rows: Number(r.rows[0].c) });
  }
  const total = rows.reduce((a, r) => a + r.rows, 0);
  for (const r of rows) console.log('BPCOUNT ' + r.table + ' ' + r.rows);
  console.log('BPCOUNT-SUMMARY serverMajor=' + major + ' tables=' + rows.length + ' totalRows=' + total + ' seconds=' + ((Date.now() - t0) / 1000).toFixed(1));
  if (process.env.BP_OUT) writeFileSync(process.env.BP_OUT, JSON.stringify({ serverMajor: major, rows }, null, 2) + '\n');
} catch (e) {
  console.log('BPCOUNT-ERROR ' + redact(e && e.code ? e.code + ' ' + (e.message || '') : (e && e.message) || e));
  process.exitCode = 1;
} finally { try { await client.end(); } catch { /* gone */ } }
