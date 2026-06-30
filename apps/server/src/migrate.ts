import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './db';

// Run the initial migration on boot if the schema is absent. A single guard on
// the `users` table is enough at this scale (W3).
export async function runMigrations(): Promise<void> {
  const { rows } = await pool.query(
    `select to_regclass('public.users') as exists`,
  );
  if (!rows[0]?.exists) {
    const sql = readFileSync(join(__dirname, '..', 'migrations', '001_init.sql'), 'utf8');
    await pool.query(sql);
    // eslint-disable-next-line no-console
    console.log('[migrate] applied 001_init.sql');
  }
  // Incremental, idempotent column adds — safe to run on every boot (Postgres
  // `add column if not exists`), so existing deploys pick them up without a
  // separate migration runner at this scale.
  await pool.query(`alter table users add column if not exists name text`);

  // Drawers D1 — the new top-level org collection + a project's drawer pointer.
  // Same idempotent boot path as users.name (no migration file), so the live DB
  // picks them up on the next deploy.
  await pool.query(
    `create table if not exists drawers (
       id text primary key,
       user_id uuid not null references users(id),
       name text not null,
       "order" int not null default 0,
       deleted_at timestamptz,
       created_at timestamptz not null,
       updated_at timestamptz not null
     )`,
  );
  await pool.query(`alter table projects add column if not exists drawer_id text`);
  await pool.query(`create index if not exists drawers_user_updated on drawers (user_id, updated_at)`);

  // Pages & Shelf D2 — journal entries finally sync server-side (the client half
  // was always wired). Same idempotent boot path; carries every JournalEntry
  // field plus the two new D2 columns: `shelved` (Shelf vs Journal) and `beat_id`
  // (the Page↔Beat seam, no UI yet). jsonb for the array / ink fields.
  await pool.query(
    `create table if not exists journal_entries (
       id text primary key,
       user_id uuid not null references users(id),
       project_id text,
       text text not null default '',
       session_id text,
       starred boolean,
       source text,
       shelved boolean not null default false,
       beat_id text,
       tags jsonb,
       routed_project_ids jsonb,
       strokes jsonb,
       deleted_at timestamptz,
       created_at timestamptz not null,
       updated_at timestamptz not null
     )`,
  );
  await pool.query(`create index if not exists journal_entries_user_updated on journal_entries (user_id, updated_at)`);

  // B1 — Binder kind on projects + page type on journal entries. Same idempotent
  // boot path; new rows read null (treated as Other / untyped) — no backfill.
  await pool.query(`alter table projects add column if not exists kind text`);
  await pool.query(`alter table journal_entries add column if not exists page_type text`);
}
