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
    // TU5 S1 — the book's Bible: SQL null → JS undefined, never a literal null
    // (the grandfather byte-identity fixed point, the origin/tutor recipe).
    tutor: r.tutor ?? undefined,
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
    // BM1 S2 — the pairing pointer, the exact origin/script null↔undefined
    // recipe: SQL null → JS undefined, never an empty/`null` literal (the
    // grandfather byte-identity fixed point).
    planBoardId: r.plan_board_id ?? undefined,
    // TU1 S1 — the Tutor's thread, the `script`/`boxes` recipe exactly:
    // SQL null -> JS undefined, never an empty object/array (the ticket's
    // own null<->undefined fixed-point requirement).
    tutor: r.tutor ?? undefined,
    // ITEM 83 M2 (R6) — the page's own sheet dress. The exact
    // origin/script/tutor recipe: SQL null → JS undefined, never `null` and
    // never an empty object, so a page never dressed stays byte-identical to
    // today and the app's own defaults govern it.
    pageSettings: r.page_settings ?? undefined,
    // EXPERIMENT 1 — the page's own anchors and links (one object with two
    // arrays; see migrate.ts for the shape, taken from the brief's §2). The
    // exact origin/script/tutor/pageSettings recipe: SQL null → JS undefined,
    // never `null` and never an empty object, so a page that has never been
    // linked stays byte-identical to today. NOTHING WRITES DURING A READ:
    // this mapper hands the stored object straight back and RE-FINDS NOTHING
    // — anchor resolution is the client's, and `resolveAnchors` is pure. An
    // anchor whose words moved is re-found at read time in the CLIENT and the
    // updated hint is written back only by an ordinary page save, never from
    // inside a read.
    pageLinks: r.page_links ?? undefined,
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
            last_activity_at, last_activity_type, last_active_page_id, deleted_at, created_at, updated_at, tutor)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)
         on conflict (id) do update set
           title = excluded.title, type = excluded.type,
           sprint_text = excluded.sprint_text, story_plan_id = excluded.story_plan_id,
           drawer_id = excluded.drawer_id, kind = excluded.kind,
           last_activity_at = excluded.last_activity_at,
           last_activity_type = excluded.last_activity_type,
           last_active_page_id = excluded.last_active_page_id,
           deleted_at = excluded.deleted_at, updated_at = excluded.updated_at,
           tutor = excluded.tutor,
           synced_at = now()
         where projects.user_id = excluded.user_id
           and excluded.updated_at > projects.updated_at`,
        // TU5 S1 — tutor rides as the 15th param, `JSON.stringify(p.tutor ?? null)`
        // ($15::jsonb): a project with no bible sends SQL null, so the column
        // stays null and the row is byte-identical to today (grandfather).
        [p.id, userId, p.title ?? '', p.type ?? 'creative', p.sprintText ?? null,
         p.storyPlanId ?? null, p.drawerId ?? null, p.kind ?? null, p.lastActivityAt ?? null, p.lastActivityType ?? null,
         p.lastActivePageId ?? null, p.deletedAt ?? null, p.createdAt, p.updatedAt, JSON.stringify(p.tutor ?? null)],
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
           deleted_at = excluded.deleted_at, updated_at = excluded.updated_at,
           synced_at = now()
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
           updated_at = excluded.updated_at,
           synced_at = now()
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
           text = excluded.text, updated_at = excluded.updated_at,
           synced_at = now()
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
           deleted_at = excluded.deleted_at, updated_at = excluded.updated_at,
           synced_at = now()
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
            order_index, imported_at, boxes, script, origin, tutor, tags, routed_project_ids, strokes, deleted_at, created_at, updated_at, plan_board_id, page_settings, page_links)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb,$20,$21,$22,$23,$24::jsonb,$25::jsonb)
         on conflict (id) do update set
           project_id = excluded.project_id, text = excluded.text, session_id = excluded.session_id,
           starred = excluded.starred, source = excluded.source, shelved = excluded.shelved,
           beat_id = excluded.beat_id, page_type = excluded.page_type, order_index = excluded.order_index,
           imported_at = excluded.imported_at, boxes = excluded.boxes, script = excluded.script,
           origin = excluded.origin, tutor = excluded.tutor, tags = excluded.tags, routed_project_ids = excluded.routed_project_ids,
           strokes = excluded.strokes, deleted_at = excluded.deleted_at, updated_at = excluded.updated_at,
           plan_board_id = excluded.plan_board_id,
           /* ITEM 83 M2 (R6) — the page's own sheet dress, riding the same
              last-writer-wins guard (the updated_at comparison below) as
              every column above it. No special-casing: dress is page data. */
           page_settings = excluded.page_settings,
           /* EXPERIMENT 1 — the page's own links, riding the SAME
              last-writer-wins guard (the updated_at comparison below) as
              every column above it. A LINK CHANGE IS A PAGE CHANGE, so
              there is nothing to special-case: links are page data.
              Whole-column resolution is the known limit — see migrate.ts. */
           page_links = excluded.page_links,
           /* ITEM 198 — the server's own sync cursor, stamped by Postgres and
              never by a client. It sits INSIDE the last-writer-wins guard
              below, so only an ACCEPTED write moves it. Kept last in this set
              deliberately: it is the only assignment here that is NOT of the
              form column = excluded.column, and a reader scanning for the
              column list should not have to step over it.
              (No backticks in this comment on purpose — it lives INSIDE a
              template literal, and a backtick here ends the SQL string.) */
           synced_at = now()
         where journal_entries.user_id = excluded.user_id
           and excluded.updated_at > journal_entries.updated_at`,
        [e.id, userId, e.projectId ?? null, e.text ?? '', e.sessionId ?? null,
         e.starred ?? null, e.source ?? null, e.shelved ?? false, e.beatId ?? null, e.pageType ?? null,
         e.orderIndex ?? null, e.importedAt ?? null, JSON.stringify(e.boxes ?? null), JSON.stringify(e.script ?? null), e.origin ?? null, JSON.stringify(e.tutor ?? null), JSON.stringify(e.tags ?? null), JSON.stringify(e.routedProjectIds ?? null), JSON.stringify(e.strokes ?? null),
         e.deletedAt ?? null, e.createdAt, e.updatedAt, e.planBoardId ?? null, JSON.stringify(e.pageSettings ?? null), JSON.stringify(e.pageLinks ?? null)],
      );
    } catch (err) {
      console.error('[sync] journal_entry upsert failed', e.id, err);
    }
  }
}

// --- pulls (everything updated since lastSyncAt) --------------------------

// ITEM 198 - THE PULL FILTERS ON THE SERVER'S OWN CLOCK, WITH AN OVERLAP.
//
// It used to filter on `updated_at`: a CLIENT stamp, compared against a cursor that is the
// SERVER's serverTime. An edit stamped before another device's last sync and pushed after it
// (the ordinary offline-edit shape) was on the server and never returned; and when that other
// device edited the same record, last-writer-wins on the same client stamp destroyed the edit
// it had never been shown - on the server AND on both devices. `synced_at` is stamped by
// Postgres (`now()`, on insert by the column default and in every on-conflict set), never a
// parameter and never from a client, and the cursor is Postgres's own `now()` too (dbNow), so
// stamp and cursor count the SAME clock. `updated_at` is untouched: it stays the LWW key.
//
// THE IN-FLIGHT WINDOW, NAMED. `now()` is the START of the writing transaction. A write whose
// transaction starts before this pull and COMMITS after it is invisible to this pull's snapshot
// yet carries a stamp OLDER than the cursor this response hands back - so a plain `> cursor`
// would miss it for good. The window is exactly (commit - stamp): each upsert is one statement
// in its own implicit transaction, so it is that statement's run time (a lock wait on the same
// row counts; queueing for a pooled connection does not - it happens before the statement
// starts). Because the cursor now comes from the same Postgres clock as the stamp, there is NO
// app-versus-database clock skew in that window any more - only the statement's own run time.
// PULL_OVERLAP_MS is 10s: it reaches back that far, so a write that
// commits within 10s of its own stamp is always caught by the next pull. It is cheap because
// the client skips any record that is not newer than the one it holds (applyCollection), so the
// price is a few re-sent rows per pull, only those written in the last 10 seconds. It is a
// BOUND, not magic: a statement that runs longer than 10s can still slip past it.
const PULL_OVERLAP_MS = 10_000;

// ITEM 198 (refinement, Fable) - THE CURSOR IS POSTGRES'S CLOCK. It was `new Date()` in this
// process, while every synced_at stamp is Postgres's `now()`: two machines' clocks again, only
// smaller. A skew beyond the overlap would have missed writes exactly as the client-stamp did.
// `select now()` is one cheap round trip per sync. It is read AFTER the pushes and BEFORE the
// pulls, so it is never later than any pull's snapshot: a row that commits in between is
// returned now and again next time (harmless - the client skips what is not newer), never
// missed. `now()` is the start of that statement, so this is a lower bound on the moment the
// pulls ran, which is the safe direction. node-pg hands the timestamptz back as a Date (whole
// milliseconds, truncated DOWN), which again errs toward returning more, not less.
async function dbNow(): Promise<string> {
  const { rows } = await pool.query(`select now() as t`);
  return new Date(rows[0].t).toISOString();
}

async function pull(table: string, userId: string, lastSyncAt: string | null) {
  const { rows } = await pool.query(
    `select * from ${table}
     where user_id = $1
       and ($2::timestamptz is null or synced_at > $2::timestamptz - ($3::int * interval '1 millisecond'))`,
    [userId, lastSyncAt, PULL_OVERLAP_MS],
  );
  return rows;
}

// ITEM 83 M2 (R6) — the writer's own default page dress.
//
// WHY THIS IS NOT PART OF /sync. Every collection /sync carries is a set of
// records with ids and updated_at, reconciled last-writer-wins. `page_defaults`
// is one singleton value on the user row with no id and no clock of its own —
// forcing it into that shape would mean inventing a record type and a
// timestamp for a field the writer edits from one place. A plain read/write
// pair is the honest shape, and it rides the same `requireAuth` +
// session-scoped `userId` the rest of this router already enforces.
//
// Read returns null when never set — the null↔undefined fixed point every
// additive column in this codebase keeps: a writer who has never chosen
// defaults is byte-identical to today, and the client falls back to the app's
// own constants rather than to a server-invented object.
syncRouter.get('/page-defaults', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  const { rows } = await pool.query(`select page_defaults from users where id = $1`, [userId]);
  res.json({ pageDefaults: rows[0]?.page_defaults ?? null });
}));

syncRouter.put('/page-defaults', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  // The body is the settings object itself, or null to clear. Stored as-is:
  // the shape is documented at migrate.ts's own column comment and mirrored in
  // types/index.ts; the server does not re-validate a shape the client owns,
  // exactly as `tutor`/`boxes`/`script` jsonb already work here.
  const next = req.body?.pageDefaults ?? null;
  await pool.query(`update users set page_defaults = $2::jsonb where id = $1`,
    [userId, JSON.stringify(next)]);
  res.json({ pageDefaults: next });
}));

// ITEM 204 PART 2 — PROOFING: the writer's dictionary, dialect and ignore blob.
//
// The same read/write PAIR as `page_defaults` above, and outside `/sync` for the
// same reason: one singleton value on the user row with no id and no clock of its
// own. The per-key stamps inside `words` are the MERGE's data, not a record clock.
//
// ⛔ THE SERVER DOES NOT MERGE, AND THAT IS A RULING, NOT AN OMISSION. Convergence
// is the client's: it GETs, merges per key, and PUTs the MERGED set (an
// LWW-element-set over `words`). A server-side merge was considered and REFUSED —
// it would teach the server a shape the PUT above deliberately does not know ("the
// server does not re-validate a shape the client owns"), and it buys only the
// narrow window the client's merge already recovers from.
//
// So this PUT is a whole-blob overwrite, exactly like its neighbour. What makes
// that safe here is on the client: its boot pull MERGES and never replaces, and
// its store exposes no way to replace. The residual is named in the offer — a word
// can be briefly missing on another device until the device that added it syncs.
// ⛔ BOTH ROUTES ARE BEHIND `requireAuth`, AND THE MOUNT IS THE ONLY REASON THEY
// CAN CAST. `syncRouter.use(requireAuth)` at the top of this file (line 11) guards
// every route on this router, which is what makes `req.session.userId as string`
// safe here rather than a hopeful cast — the request cannot reach a handler
// unauthenticated. Cited because the cast is the kind of line a reader should be
// able to justify without leaving the function (Fable's review, 5).
syncRouter.get('/proofing', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  const { rows } = await pool.query(`select proofing from users where id = $1`, [userId]);
  res.json({ proofing: rows[0]?.proofing ?? null });
}));

syncRouter.put('/proofing', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  // The body is the MERGED record, or null to clear. Stored as-is: the shape is
  // documented at migrate.ts's own column comment and mirrored in types/index.ts.
  const next = req.body?.proofing ?? null;
  // ⛔ A CLEAR WRITES SQL NULL, NOT jsonb 'null' (Fable's review, 4).
  // `JSON.stringify(null)` is the STRING "null", which Postgres stores as a jsonb
  // null — a value that is not SQL NULL. The column would then have two different
  // "empty" states: absent (never proofed) and a jsonb null (cleared), which
  // `rows[0]?.proofing ?? null` cannot tell apart and which no reader should have
  // to. Passing a real null keeps the column's NULL meaning exactly one thing.
  await pool.query(`update users set proofing = $2::jsonb where id = $1`,
    [userId, next == null ? null : JSON.stringify(next)]);
  res.json({ proofing: next });
}));

syncRouter.post('/sync', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId as string;
  const lastSyncAt: string | null = req.body?.lastSyncAt ?? null;
  const push = req.body?.push ?? {};
  // ITEM 203 (P2) - a CHUNKED push sends several requests; only the last needs the pull. `pull: false` is a
  // push-only request: the upserts run and the six pulls do not. Absent (every existing client, and the ordinary
  // one-request sync) it is exactly what it always was.
  const wantPull = req.body?.pull !== false;

  await upsertProjects(userId, Array.isArray(push.projects) ? push.projects : []);
  await upsertStoryPlans(userId, Array.isArray(push.storyPlans) ? push.storyPlans : []);
  await upsertSessions(userId, Array.isArray(push.sessions) ? push.sessions : []);
  await upsertDrafts(userId, Array.isArray(push.drafts) ? push.drafts : []);
  await upsertDrawers(userId, Array.isArray(push.drawers) ? push.drawers : []);
  await upsertJournalEntries(userId, Array.isArray(push.journalEntries) ? push.journalEntries : []);

  // ITEM 198 - the cursor is POSTGRES's clock, taken after the pushes and before the pulls (see dbNow).
  const serverTime = await dbNow();
  res.json({
    serverTime,
    pull: wantPull ? {
      projects: (await pull('projects', userId, lastSyncAt)).map(rowToProject),
      storyPlans: (await pull('story_plans', userId, lastSyncAt)).map(rowToStoryPlan),
      sessions: (await pull('sessions_log', userId, lastSyncAt)).map(rowToSession),
      drafts: (await pull('drafts', userId, lastSyncAt)).map(rowToDraft),
      drawers: (await pull('drawers', userId, lastSyncAt)).map(rowToDrawer),
      journalEntries: (await pull('journal_entries', userId, lastSyncAt)).map(rowToJournalEntry),
    } : { projects: [], storyPlans: [], sessions: [], drafts: [], drawers: [], journalEntries: [] },
  });
}));
