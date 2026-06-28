import { Router, type Request, type Response } from 'express';
import { pool } from './db';
import { requireAuth } from './auth';
import { asyncHandler } from './asyncHandler';

// Record-level last-write-wins sync. All queries are scoped to the session
// user_id; a pushed record only overwrites a stored row when its updated_at is
// strictly newer. Soft deletes travel as ordinary records with deleted_at set.

export const syncRouter = Router();
syncRouter.use(requireAuth);

function iso(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value as string).toISOString();
}

// --- row <-> client mappers ----------------------------------------------

function rowToProject(r: any) {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    sprintText: r.sprint_text ?? undefined,
    storyPlanId: r.story_plan_id ?? null,
    drawerId: r.drawer_id ?? undefined,
    lastActivityAt: iso(r.last_activity_at) ?? undefined,
    lastActivityType: r.last_activity_type ?? undefined,
    deletedAt: iso(r.deleted_at) ?? undefined,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function rowToDrawer(r: any) {
  return {
    id: r.id,
    name: r.name,
    order: r.order ?? 0,
    deletedAt: iso(r.deleted_at) ?? undefined,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function rowToStoryPlan(r: any) {
  return {
    id: r.id,
    projectId: r.project_id,
    frameworkId: r.framework_id,
    currentBeatId: r.current_beat_id ?? null,
    beatNotes: r.beat_notes ?? [],
    deletedAt: iso(r.deleted_at) ?? undefined,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function rowToSession(r: any) {
  return {
    id: r.id,
    projectId: r.project_id ?? null,
    startedAt: iso(r.started_at),
    firstKeystrokeAt: iso(r.first_keystroke_at),
    endedAt: iso(r.ended_at),
    words: r.words ?? 0,
    durationSec: r.duration_sec ?? 0,
    updatedAt: iso(r.updated_at),
  };
}

function rowToDraft(r: any) {
  return { id: r.id, text: r.text, updatedAt: iso(r.updated_at) };
}

// --- upserts (last-write-wins on updated_at, scoped to user) --------------

async function upsertProjects(userId: string, records: any[]): Promise<void> {
  for (const p of records) {
    if (!p?.id || !p?.updatedAt || !p?.createdAt) continue;
    try {
      await pool.query(
        `insert into projects
           (id, user_id, title, type, sprint_text, story_plan_id, drawer_id,
            last_activity_at, last_activity_type, deleted_at, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         on conflict (id) do update set
           title = excluded.title, type = excluded.type,
           sprint_text = excluded.sprint_text, story_plan_id = excluded.story_plan_id,
           drawer_id = excluded.drawer_id,
           last_activity_at = excluded.last_activity_at,
           last_activity_type = excluded.last_activity_type,
           deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
         where projects.user_id = excluded.user_id
           and excluded.updated_at > projects.updated_at`,
        [p.id, userId, p.title ?? '', p.type ?? 'creative', p.sprintText ?? null,
         p.storyPlanId ?? null, p.drawerId ?? null, p.lastActivityAt ?? null, p.lastActivityType ?? null,
         p.deletedAt ?? null, p.createdAt, p.updatedAt],
      );
    } catch (err) {
      console.error('[sync] project upsert failed', p.id, err);
    }
  }
}

async function upsertStoryPlans(userId: string, records: any[]): Promise<void> {
  for (const s of records) {
    if (!s?.id || !s?.updatedAt || !s?.createdAt) continue;
    try {
      await pool.query(
        `insert into story_plans
           (id, user_id, project_id, framework_id, current_beat_id, beat_notes,
            deleted_at, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
         on conflict (id) do update set
           project_id = excluded.project_id, framework_id = excluded.framework_id,
           current_beat_id = excluded.current_beat_id, beat_notes = excluded.beat_notes,
           deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
         where story_plans.user_id = excluded.user_id
           and excluded.updated_at > story_plans.updated_at`,
        [s.id, userId, s.projectId ?? '', s.frameworkId ?? '', s.currentBeatId ?? null,
         JSON.stringify(s.beatNotes ?? []), s.deletedAt ?? null, s.createdAt, s.updatedAt],
      );
    } catch (err) {
      console.error('[sync] story_plan upsert failed', s.id, err);
    }
  }
}

async function upsertSessions(userId: string, records: any[]): Promise<void> {
  for (const s of records) {
    if (!s?.id || !s?.updatedAt) continue;
    try {
      await pool.query(
        `insert into sessions_log
           (id, user_id, project_id, started_at, first_keystroke_at, ended_at,
            words, duration_sec, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (id) do update set
           project_id = excluded.project_id, started_at = excluded.started_at,
           first_keystroke_at = excluded.first_keystroke_at, ended_at = excluded.ended_at,
           words = excluded.words, duration_sec = excluded.duration_sec,
           updated_at = excluded.updated_at
         where sessions_log.user_id = excluded.user_id
           and excluded.updated_at > sessions_log.updated_at`,
        [s.id, userId, s.projectId ?? null, s.startedAt ?? null, s.firstKeystrokeAt ?? null,
         s.endedAt ?? null, s.words ?? 0, s.durationSec ?? 0, s.updatedAt],
      );
    } catch (err) {
      console.error('[sync] session upsert failed', s.id, err);
    }
  }
}

async function upsertDrafts(userId: string, records: any[]): Promise<void> {
  for (const d of records) {
    if (!d?.id || !d?.updatedAt) continue;
    try {
      await pool.query(
        `insert into drafts (id, user_id, text, updated_at)
         values ($1,$2,$3,$4)
         on conflict (id) do update set
           text = excluded.text, updated_at = excluded.updated_at
         where drafts.user_id = excluded.user_id
           and excluded.updated_at > drafts.updated_at`,
        [d.id, userId, d.text ?? '', d.updatedAt],
      );
    } catch (err) {
      console.error('[sync] draft upsert failed', d.id, err);
    }
  }
}

async function upsertDrawers(userId: string, records: any[]): Promise<void> {
  for (const d of records) {
    if (!d?.id || !d?.updatedAt || !d?.createdAt) continue;
    try {
      await pool.query(
        `insert into drawers
           (id, user_id, name, "order", deleted_at, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (id) do update set
           name = excluded.name, "order" = excluded."order",
           deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
         where drawers.user_id = excluded.user_id
           and excluded.updated_at > drawers.updated_at`,
        [d.id, userId, d.name ?? '', d.order ?? 0, d.deletedAt ?? null, d.createdAt, d.updatedAt],
      );
    } catch (err) {
      console.error('[sync] drawer upsert failed', d.id, err);
    }
  }
}

// --- pulls (everything updated since lastSyncAt) --------------------------

async function pull(table: string, userId: string, lastSyncAt: string | null) {
  const { rows } = await pool.query(
    `select * from ${table}
     where user_id = $1 and ($2::timestamptz is null or updated_at > $2)`,
    [userId, lastSyncAt],
  );
  return rows;
}

syncRouter.post('/sync', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  const lastSyncAt: string | null = req.body?.lastSyncAt ?? null;
  const push = req.body?.push ?? {};

  await upsertProjects(userId, Array.isArray(push.projects) ? push.projects : []);
  await upsertStoryPlans(userId, Array.isArray(push.storyPlans) ? push.storyPlans : []);
  await upsertSessions(userId, Array.isArray(push.sessions) ? push.sessions : []);
  await upsertDrafts(userId, Array.isArray(push.drafts) ? push.drafts : []);
  await upsertDrawers(userId, Array.isArray(push.drawers) ? push.drawers : []);

  res.json({
    serverTime: new Date().toISOString(),
    pull: {
      projects: (await pull('projects', userId, lastSyncAt)).map(rowToProject),
      storyPlans: (await pull('story_plans', userId, lastSyncAt)).map(rowToStoryPlan),
      sessions: (await pull('sessions_log', userId, lastSyncAt)).map(rowToSession),
      drafts: (await pull('drafts', userId, lastSyncAt)).map(rowToDraft),
      drawers: (await pull('drawers', userId, lastSyncAt)).map(rowToDrawer),
    },
  });
}));
