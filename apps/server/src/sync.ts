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
    kind: r.kind ?? undefined,
    lastActivityAt: iso(r.last_activity_at) ?? undefined,
    lastActivityType: r.last_activity_type ?? undefined,
    lastActivePageId: r.last_active_page_id ?? undefined,
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
    surface: r.surface ?? undefined,
    deskOpenedAt: iso(r.desk_opened_at) ?? undefined,
    updatedAt: iso(r.updated_at),
  };
}

function rowToDraft(r: any) {
  return { id: r.id, text: r.text, updatedAt: iso(r.updated_at) };
}

function rowToJournalEntry(r: any) {
  return {
    id: r.id,
    text: r.text ?? '',
    projectId: r.project_id ?? null,
    sessionId: r.session_id ?? undefined,
    starred: r.starred ?? undefined,
    source: r.source ?? undefined,
    shelved: r.shelved ?? undefined,
    beatId: r.beat_id ?? undefined,
    pageType: r.page_type ?? undefined,
    orderIndex: r.order_index ?? undefined,
    importedAt: iso(r.imported_at) ?? undefined,
    boxes: r.boxes ?? undefined,
    script: r.script ?? undefined,
    origin: r.origin ?? undefined,
    // TU1 S1 — the Tutor's thread, the `script`/`boxes` recipe exactly:
    // SQL null -> JS undefined, never an empty object/array (the ticket's
    // own null<->undefined fixed-point requirement).
    tutor: r.tutor ?? undefined,
    tags: r.tags ?? undefined,
    routedProjectIds: r.routed_project_ids ?? undefined,
    strokes: r.strokes ?? undefined,
    deletedAt: iso(r.deleted_at) ?? undefined,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

// --- upserts (last-write-wins on updated_at, scoped to user) --------------

async function upsertProjects(userId: string, records: any[]): Promise<void> {
  for (const p of records) {
    if (!p?.id || !p?.updatedAt || !p?.createdAt) continue;
    try {
      await pool.query(
        `insert into projects
           (id, user_id, title, type, sprint_text, story_plan_id, drawer_id, kind,
            last_activity_at, last_activity_type, last_active_page_id, deleted_at, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict (id) do update set
           title = excluded.title, type = excluded.type,
           sprint_text = excluded.sprint_text, story_plan_id = excluded.story_plan_id,
           drawer_id = excluded.drawer_id, kind = excluded.kind,
           last_activity_at = excluded.last_activity_at,
           last_activity_type = excluded.last_activity_type,
           last_active_page_id = excluded.last_active_page_id,
           deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
         where projects.user_id = excluded.user_id
           and excluded.updated_at > projects.updated_at`,
        [p.id, userId, p.title ?? '', p.type ?? 'creative', p.sprintText ?? null,
         p.storyPlanId ?? null, p.drawerId ?? null, p.kind ?? null, p.lastActivityAt ?? null, p.lastActivityType ?? null,
         p.lastActivePageId ?? null, p.deletedAt ?? null, p.createdAt, p.updatedAt],
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
            words, duration_sec, surface, desk_opened_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (id) do update set
           project_id = excluded.project_id, started_at = excluded.started_at,
           first_keystroke_at = excluded.first_keystroke_at, ended_at = excluded.ended_at,
           words = excluded.words, duration_sec = excluded.duration_sec,
           surface = excluded.surface, desk_opened_at = excluded.desk_opened_at,
           updated_at = excluded.updated_at
         where sessions_log.user_id = excluded.user_id
           and excluded.updated_at > sessions_log.updated_at`,
        [s.id, userId, s.projectId ?? null, s.startedAt ?? null, s.firstKeystrokeAt ?? null,
         s.endedAt ?? null, s.words ?? 0, s.durationSec ?? 0, s.surface ?? null, s.deskOpenedAt ?? null, s.updatedAt],
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

async function upsertJournalEntries(userId: string, records: any[]): Promise<void> {
  for (const e of records) {
    if (!e?.id || !e?.updatedAt || !e?.createdAt) continue;
    try {
      await pool.query(
        `insert into journal_entries
           (id, user_id, project_id, text, session_id, starred, source, shelved, beat_id, page_type,
            order_index, imported_at, boxes, script, origin, tutor, tags, routed_project_ids, strokes, deleted_at, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb,$20,$21,$22)
         on conflict (id) do update set
           project_id = excluded.project_id, text = excluded.text, session_id = excluded.session_id,
           starred = excluded.starred, source = excluded.source, shelved = excluded.shelved,
           beat_id = excluded.beat_id, page_type = excluded.page_type, order_index = excluded.order_index,
           imported_at = excluded.imported_at, boxes = excluded.boxes, script = excluded.script,
           origin = excluded.origin, tutor = excluded.tutor, tags = excluded.tags, routed_project_ids = excluded.routed_project_ids,
           strokes = excluded.strokes, deleted_at = excluded.deleted_at, updated_at = excluded.updated_at
         where journal_entries.user_id = excluded.user_id
           and excluded.updated_at > journal_entries.updated_at`,
        [e.id, userId, e.projectId ?? null, e.text ?? '', e.sessionId ?? null,
         e.starred ?? null, e.source ?? null, e.shelved ?? false, e.beatId ?? null, e.pageType ?? null,
         e.orderIndex ?? null, e.importedAt ?? null, JSON.stringify(e.boxes ?? null), JSON.stringify(e.script ?? null), e.origin ?? null, JSON.stringify(e.tutor ?? null), JSON.stringify(e.tags ?? null), JSON.stringify(e.routedProjectIds ?? null), JSON.stringify(e.strokes ?? null),
         e.deletedAt ?? null, e.createdAt, e.updatedAt],
      );
    } catch (err) {
      console.error('[sync] journal_entry upsert failed', e.id, err);
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
  await upsertJournalEntries(userId, Array.isArray(push.journalEntries) ? push.journalEntries : []);

  res.json({
    serverTime: new Date().toISOString(),
    pull: {
      projects: (await pull('projects', userId, lastSyncAt)).map(rowToProject),
      storyPlans: (await pull('story_plans', userId, lastSyncAt)).map(rowToStoryPlan),
      sessions: (await pull('sessions_log', userId, lastSyncAt)).map(rowToSession),
      drafts: (await pull('drafts', userId, lastSyncAt)).map(rowToDraft),
      drawers: (await pull('drawers', userId, lastSyncAt)).map(rowToDrawer),
      journalEntries: (await pull('journal_entries', userId, lastSyncAt)).map(rowToJournalEntry),
    },
  });
}));
