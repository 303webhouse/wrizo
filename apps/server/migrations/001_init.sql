-- Writer Studio — initial schema (W1).
-- Client-generated string ids on sync tables; server-owned uuid for users.

create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  pass_hash text not null,
  created_at timestamptz not null default now()
);

create table projects (
  id text primary key,            -- client-generated ids
  user_id uuid not null references users(id),
  title text not null,
  type text not null,
  sprint_text text,
  story_plan_id text,
  last_activity_at timestamptz,
  last_activity_type text,
  deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table story_plans (
  id text primary key,
  user_id uuid not null references users(id),
  project_id text not null,
  framework_id text not null,
  current_beat_id text,
  beat_notes jsonb not null default '[]',
  deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table sessions_log (
  id text primary key,
  user_id uuid not null references users(id),
  project_id text,
  started_at timestamptz, first_keystroke_at timestamptz, ended_at timestamptz,
  words int, duration_sec int,
  updated_at timestamptz not null
);

create table drafts (
  id text primary key,            -- projectId or 'scratch'
  user_id uuid not null references users(id),
  text text not null default '',
  updated_at timestamptz not null
);

create index on projects (user_id, updated_at);
create index on story_plans (user_id, updated_at);
