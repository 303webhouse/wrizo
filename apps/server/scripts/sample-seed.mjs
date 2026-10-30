// THE SAMPLE-ACCOUNT SEED. Rebuilds ONE account - the one recorded in ~/.wrizo/sample-account.json - from the content file, through the server's real sync route.
// It is the owner's own terminal, via railway run, like create-account.mjs and account-state.mjs (Run from the writer-studio FOLDER: the Railway CLI takes its project from the folder).
//
//   railway run --service Postgres node apps/server/scripts/sample-seed.mjs --counts [--content <path>]
//   railway run --service Postgres node apps/server/scripts/sample-seed.mjs --seed --expect-id <id from --counts> [--content <path>]
//
//   build the server first:   pnpm --filter @writer-studio/server build
//
// HOW (Fable's sample-seed-rules.md): the content is turned into records by driving the app's own store (build-world.mjs: createDrawer, createBinder, the deck engine, graftTo, ...);
// a non-empty account is first emptied through the app's own purge path (account-state.mjs: purge records through the REAL syncRouter - never a raw DELETE); the new records go in
// through the same route (ordinary pushes: the server upserts, counts words and keeps every rule it has). Nothing here writes a content row any other way.
//
// GUARDS (the wipe-before-seed guards, A and B):
//   A  the email is typed at a prompt (the same readLine create-account uses) - never read from an environment variable (PowerShell keeps those in its history file in plain text)
//   B  the target id MUST equal the id in ~/.wrizo/sample-account.json (written by create-account.mjs --record-as sample). No file, or a different id: refused. This is the ONLY
//      account this script will ever wipe. The main account is refused by the same rule (its id is not the recorded one).
//   +  --seed needs --expect-id (from a --counts run); --counts first prints the id and the counts; the pre-check (this app's project and a users table) runs before anything.
//   +  the content file's md5 must be the one the seed was written against (a different file needs --allow-new-content, a conscious act).
//
// OUTPUT: counts, ids and status words only. Never the email, a password, a hash, a database address or any of the writing.
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeEmail, readLine } from './set-password.mjs';
import { preflight, sampleAccountFile } from './create-account.mjs';
import { readState, describe, isEmpty, purgeRecords, mountSyncRouter, pushPurges } from './account-state.mjs';
import { buildWorld } from './sample-seed/build-world.mjs';
import { CONTENT_MD5 } from './sample-seed/parse-content.mjs';

const require = createRequire(import.meta.url);
const flag = (n) => process.argv.includes(n);
const argAfter = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const PUSH_CHUNK = 40;
const ORDER = ['drawers', 'projects', 'storyPlans', 'journalEntries'];

/** Guard B, as a pure function (the harness calls it too): the recorded sample id, or a refusal reason. */
export function checkSampleTarget(file, targetId) {
  if (!existsSync(file)) return { ok: false, reason: 'no sample account is recorded (the id file is missing) - create it with create-account.mjs --record-as sample' };
  let rec; try { rec = JSON.parse(readFileSync(file, 'utf8')); } catch { return { ok: false, reason: 'the sample id file cannot be read' }; }
  if (!rec || typeof rec.userId !== 'string' || !rec.userId) return { ok: false, reason: 'the sample id file holds no id' };
  if (rec.userId !== String(targetId)) return { ok: false, reason: 'this account is NOT the recorded sample account - refused (it will not be wiped or seeded)' };
  return { ok: true };
}

/** Push the world's records through the mounted sync router, in collection order, in chunks. Returns { sent, rejected, failures, acknowledgedPurged }. */
export async function pushRecords(baseUrl, records) {
  let sent = 0; let rejected = 0; let failures = 0; let ackPurged = 0;
  for (const key of ORDER) {
    const list = records[key] ?? [];
    for (let i = 0; i < list.length; i += PUSH_CHUNK) {
      const chunk = list.slice(i, i + PUSH_CHUNK);
      const res = await fetch(`${baseUrl}/api/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lastSyncAt: null, pull: false, push: { [key]: chunk } }) });
      if (!res.ok) { failures += 1; continue; }
      const body = await res.json();
      sent += chunk.length;
      rejected += Object.values(body.rejected ?? {}).reduce((n, ids) => n + ids.length, 0);
      ackPurged += Object.values(body.acknowledgedPurged ?? {}).reduce((n, ids) => n + ids.length, 0);
    }
  }
  return { sent, rejected, failures, acknowledgedPurged: ackPurged };
}

/** Everything after the prompt. `email` comes from the caller (the prompt, or a proof); `log`/`err` take the output lines. Returns the exit code. */
export async function runSeed({ pool, url, email, md, mode, expectId, sampleFile, allowNewContent = false, endPool = true, log = console.log, err = console.error }) {
  let mounted = null; let code = 0;
  try {
    const pre = await preflight(pool);
    for (const line of pre.lines) log(line);
    if (!pre.ok) { err(`Stopped (${pre.code}): this is not the app's database. Nothing was changed.`); return 1; }
    const found = await pool.query(`select id from users where lower(email) = $1`, [email]);
    if (found.rows.length !== 1) { err(`Stopped: ${found.rows.length === 0 ? 'no account has that address' : 'more than one account matched'}. Nothing was changed.`); return 1; }
    const userId = String(found.rows[0].id);
    log(`account id: ${userId}`);

    // GUARD B - only the recorded sample account
    const target = checkSampleTarget(sampleFile, userId);
    if (!target.ok) { err(`Stopped: ${target.reason}. Nothing was changed.`); return 1; }
    log('this is the recorded sample account.');

    const before = await readState(pool, userId);
    log(describe('sample', 'before', before));

    // the content: build it (browserless) and report - nothing has touched the database yet
    const { records, report } = await buildWorld(md);
    log(`content md5 ${report.md5Matches ? 'matches' : 'DIFFERS from'} the one this seed was written against (${CONTENT_MD5.slice(0, 8)}...)`);
    log(`built: ${Object.entries(report.rows).filter(([k]) => ['drawers', 'projects', 'journalEntries', 'boards', 'grafts', 'childCards', 'bibleFacts'].includes(k)).map(([k, v]) => `${k} ${v}`).join(', ')}; words (pages) ${report.words.pageText}, (pages + cards + Bible) ${report.words.total}`);
    if (report.failures.length) { err(`Stopped: the content did not convert cleanly (${report.failures.length} problems):`); report.failures.forEach((f) => err(`  - ${f}`)); return 1; }
    if (!report.md5Matches && !allowNewContent) { err('Stopped: the content file is not the approved one (pass --allow-new-content to seed a revised file). Nothing was changed.'); return 1; }

    if (mode === 'counts') { log('counts only - nothing was changed.'); return 0; }

    if (expectId !== userId) { err('Stopped: --expect-id does not match this account (take it from a --counts run). Nothing was changed.'); return 1; }

    mounted = await mountSyncRouter(url, userId);
    if (!isEmpty(before)) {
      const recs = await purgeRecords(pool, userId);
      const r = await pushPurges(mounted.url, recs);
      log(`emptied through the app's purge path: ${r.sent} records, ${r.rejected} rejected, ${r.failures} failed requests`);
      if (r.rejected || r.failures) { err('Stopped: the wipe did not finish cleanly. Nothing was seeded.'); return 1; }
    }
    const afterWipe = await readState(pool, userId);
    if (!isEmpty(afterWipe)) { err('Stopped: the account is not empty after the wipe. Nothing was seeded.'); return 1; }

    const r = await pushRecords(mounted.url, records);
    log(`seed pushed through the app's sync route: ${r.sent} records sent, ${r.rejected} rejected, ${r.failures} failed requests`);
    const after = await readState(pool, userId);
    log(describe('sample', 'after', after));
    const grew = after.user.wordsWritten >= before.user.wordsWritten && after.user.themesOpened >= before.user.themesOpened;
    log(`words_written ${before.user.wordsWritten} -> ${after.user.wordsWritten} (measured seeded: ${report.words.pageText} in pages); not lowered: ${grew ? 'yes' : 'NO'}`);
    const expectedLive = records.journalEntries.filter((e) => !e.deletedAt).length;
    const got = after.collections.journalEntries.live;
    log(`live pages+boards ${got} (expected ${expectedLive}); Trash ${after.collections.journalEntries.trashed} (expected ${records.journalEntries.length - expectedLive})`);
    if (r.rejected || r.failures || !grew || got !== expectedLive) code = 1;
    return code;
  } catch (e) {
    err(`Could not finish (${e && e.code ? e.code : 'error'}).`);
    return 1;
  } finally {
    if (mounted) { await mounted.close(); if (endPool) await mounted.endPool(); }
  }
}

async function main() {
  const seed = flag('--seed'); const counts = flag('--counts');
  if (seed === counts) { console.error('Give exactly one of --counts or --seed.'); process.exit(2); }
  if (!process.stdin.isTTY) { console.error('Run this in a terminal you are typing into (it reads the email from the keyboard).'); process.exit(2); }
  const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  if (!url) { console.error('No database connection is set. Run it as: railway run --service Postgres node apps/server/scripts/sample-seed.mjs'); process.exit(2); }
  const contentPath = argAfter('--content') || join(homedir(), 'Downloads', 'sample-account-content.md');
  if (!existsSync(contentPath)) { console.error('The content file was not found (give --content <path>).'); process.exit(2); }
  const md = readFileSync(contentPath, 'utf8');

  const { Pool } = require('pg');
  let loopback = false;
  try { const h = new URL(url).hostname; loopback = h === '127.0.0.1' || h === 'localhost'; } catch { /* leave TLS on */ }
  const pool = new Pool({ connectionString: url, ssl: loopback ? false : { rejectUnauthorized: false }, max: 2 });
  try {
    // the pre-check runs BEFORE the question, as create-account does
    const pre = await preflight(pool);
    if (!pre.ok) { for (const line of pre.lines) console.log(line); console.error(`Stopped (${pre.code}): this is not the app's database. Nothing was changed.`); process.exitCode = 1; return; }
    // GUARD A - the email at a prompt, never the environment
    const email = normalizeEmail(await readLine('Sample account email: ', { hidden: false }));
    if (!email) { console.error('No email entered.'); process.exitCode = 2; return; }
    process.exitCode = await runSeed({ pool, url, email, md, mode: seed ? 'seed' : 'counts', expectId: argAfter('--expect-id'), sampleFile: sampleAccountFile(), allowNewContent: flag('--allow-new-content') });
  } catch (e) {
    console.error(`Could not finish (${e && e.code ? e.code : 'error'}).`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  // no process.exit() on the happy path (a Windows exit with fetch's keep-alive sockets open aborts); the timer is the backstop
  main().then(() => { setTimeout(() => process.exit(process.exitCode ?? 0), 4000).unref(); }, () => { console.error('Could not finish.'); process.exit(1); });
}
