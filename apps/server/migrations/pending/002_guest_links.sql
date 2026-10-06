-- GUEST LOGIN (item 225) — the guest_links table. PENDING: NOT applied.
-- migrate.ts reads only 001_init.sql, so this file cannot run on boot. It lands
-- only on Nick's word (the table is beyond the four users columns he approved).
-- Once landed, add it to migrate.ts as an idempotent `create table if not exists`.

create table guest_links (
  token_hash text primary key,                 -- sha256 hex of the raw token; the token itself is never stored
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index guest_links_user on guest_links (user_id);
