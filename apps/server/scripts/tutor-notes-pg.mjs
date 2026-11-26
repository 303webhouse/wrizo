// TUTOR-B ITEM 7 STEP 1 — THE NOTES TABLE AGAINST A REAL POSTGRES (Fable, Nov 24: "run tutor-notes against a real Postgres on Actions: gen_random_uuid needs Postgres 13+, and the table is made at boot").
// tutor-notes.mjs checks the rules and the SQL text against a stand-in database. This one runs the server's OWN boot migration (runMigrations from migrate.ts) and the shipped router
// (tutorNotesRoutes.ts, its real SQL) against an actual database, so it proves what the stand-in cannot: the boot path creates the table, gen_random_uuid() works, the table's own checks
// refuse a bad row, the SQL is valid, a wipe leaves no row behind, another writer cannot touch a note, and the notes go with the account.
//
// SAFETY: it refuses to run unless DATABASE_URL names a database on THIS machine (localhost, 127.0.0.1 or ::1). It can never reach production. It makes its own test writers (fake
// `.invalid` addresses) and deletes them at the end (their notes go with them: on delete cascade).
//
// Run (needs a local Postgres 13+; the Actions job tutor-notes-pg.yml starts one):
//   DATABASE_URL=postgres://user:pass@127.0.0.1:5432/dbname node apps/server/scripts/tutor-notes-pg.mjs
import { loadServer } from './tutor-eval/load-server.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const url = process.env.DATABASE_URL || '';
let host = '';
try { host = new URL(url).hostname; } catch { /* not a URL */ }
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
  console.error('TUTOR-NOTES-PG: refused. DATABASE_URL must name a database on this machine (localhost or 127.0.0.1); this check never touches any other.');
  process.exit(2);
}
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'local-check-secret';
process.env.NODE_ENV = 'test';

const s = loadServer({ files: ['env.ts', 'db.ts', 'migrate.ts', 'asyncHandler.ts', 'logSafe.ts', 'tutorNoteFilter.ts', 'tutorNotes.ts', 'tutorNotesRoutes.ts'] });
const { pool } = s.load('db.ts');
const { runMigrations } = s.load('migrate.ts');
const routes = s.load('tutorNotesRoutes.ts');
const rules = s.load('tutorNotes.ts');

function handlerFor(method, routePath) {
  for (const layer of routes.tutorNotesRouter.stack) if (layer.route && layer.route.path === routePath && layer.route.methods[method]) { const st = layer.route.stack; return st[st.length - 1].handle; }
  return null;
}
async function call(method, routePath, { userId, body, id } = {}) {
  const h = handlerFor(method, routePath);
  if (!h) return { status: 0, body: null, thrown: 'no such route' };
  const req = { body: body === undefined ? {} : body, params: id === undefined ? {} : { id }, session: { userId }, query: {} };
  const res = { statusCode: 200, body: undefined };
  let finish; const done = new Promise((r) => { finish = r; });
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (x) => { res.body = x; finish(); return res; };
  let thrown = null;
  h(req, res, (e) => { if (e) thrown = String((e && e.message) || e).slice(0, 200); finish(); });
  await Promise.race([done, new Promise((r) => setTimeout(r, 15000))]);
  return { status: res.statusCode, body: res.body, thrown };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const add = (userId, over = {}) => call('post', '/tutor/notes', { userId, body: { kind: 'tendency', text: 'Writes best in the morning.', source: 'own', ...over } });
const count = async (userId) => (await pool.query('select count(*)::int as n from tutor_notes where user_id = $1', [userId])).rows[0].n;
const refused = async (sql, params) => { try { await pool.query(sql, params); return null; } catch (e) { return e.code || 'error'; } };

const made = [];
try {
  // PG1 — the boot path
  const version = Number((await pool.query('show server_version_num')).rows[0].server_version_num);
  ok(`PG1 the database is Postgres 13 or newer (gen_random_uuid needs it; this is ${Math.floor(version / 10000)})`, version >= 130000, String(version));
  let bootErr = null;
  try { await runMigrations(); await runMigrations(); } catch (e) { bootErr = String((e && e.message) || e).slice(0, 200); }
  ok('PG1 the server\'s own boot migration runs, and runs again, with no error (the table is made with `create table if not exists`)', bootErr === null, bootErr || '');

  // PG2 — the table's shape
  const cols = (await pool.query(`select column_name, data_type, is_nullable, column_default from information_schema.columns where table_name = 'tutor_notes' order by ordinal_position`)).rows;
  const col = (n) => cols.find((c) => c.column_name === n);
  ok('PG2 tutor_notes has exactly id, user_id, kind, text, source, created_at, updated_at (no deleted_at, no archive, nowhere for a wiped note to hide)',
    cols.map((c) => c.column_name).join(',') === 'id,user_id,kind,text,source,created_at,updated_at', cols.map((c) => c.column_name).join(','));
  ok('PG2 id is a uuid made by gen_random_uuid(); user_id is a uuid and not null; the times are timestamptz and not null',
    col('id') && col('id').data_type === 'uuid' && /gen_random_uuid/.test(col('id').column_default || '') && col('user_id').data_type === 'uuid' && col('user_id').is_nullable === 'NO'
    && col('created_at').data_type === 'timestamp with time zone' && col('updated_at').data_type === 'timestamp with time zone' && col('created_at').is_nullable === 'NO');
  const fk = (await pool.query(`select confdeltype from pg_constraint where conrelid = 'tutor_notes'::regclass and contype = 'f'`)).rows;
  ok('PG2 the foreign key to users deletes the notes with the account (on delete cascade)', fk.length === 1 && fk[0].confdeltype === 'c', JSON.stringify(fk));
  const idx = (await pool.query(`select indexdef from pg_indexes where tablename = 'tutor_notes' and indexname = 'tutor_notes_user_created'`)).rows;
  ok('PG2 the index by writer exists (user_id, created_at)', idx.length === 1 && /\(user_id, created_at\)/.test(idx[0].indexdef), JSON.stringify(idx));

  // two test writers (fake addresses; removed at the end)
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mk = async (tag) => { const r = await pool.query(`insert into users (email, pass_hash) values ($1, 'x') returning id`, [`pg-check-${tag}-${stamp}@example.invalid`]); made.push(r.rows[0].id); return r.rows[0].id; };
  const A = await mk('a'); const B = await mk('b');

  // PG3 — the table itself refuses a bad row, whatever the route would have said
  const bad = [
    ['a kind that is not one of the four', "insert into tutor_notes (user_id, kind, text, source) values ($1, 'mood', 'x', 'own')"],
    ['a source that is not one of the three', "insert into tutor_notes (user_id, kind, text, source) values ($1, 'goal', 'x', 'ai')"],
    ['an empty text', "insert into tutor_notes (user_id, kind, text, source) values ($1, 'goal', '', 'own')"],
    ['a text of 401 characters', "insert into tutor_notes (user_id, kind, text, source) values ($1, 'goal', repeat('x', 401), 'own')"],
    ['no text at all', "insert into tutor_notes (user_id, kind, text, source) values ($1, 'goal', null, 'own')"],
    ['a writer who does not exist', "insert into tutor_notes (user_id, kind, text, source) values ('00000000-0000-4000-8000-0000000000ff', 'goal', 'x', 'own')"],
  ];
  const badWrong = [];
  for (const [name, sql] of bad) { const code = await refused(sql, sql.includes('$1') ? [A] : []); if (!code) badWrong.push(name); }
  const good400 = await refused("insert into tutor_notes (user_id, kind, text, source) values ($1, 'goal', repeat('x', 400), 'own')", [A]);
  await pool.query('delete from tutor_notes where user_id = $1', [A]);
  ok('PG3 the table itself refuses each bad row (bad kind, bad source, empty, 401 characters, null, an unknown writer) and accepts exactly 400 characters', badWrong.length === 0 && good400 === null, badWrong.join(' | ') + (good400 ? ' 400:' + good400 : ''));

  // PG4 — the shipped routes, the real SQL
  const none = await call('get', '/tutor/notes', { userId: A });
  ok('PG4 she has none to begin with, and a GET makes no row', none.status === 200 && none.body.notes.length === 0 && (await count(A)) === 0, JSON.stringify(none.body));
  const a1 = await add(A, { text: 'First, from her own hand.', source: 'own' });
  const a2 = await add(A, { kind: 'goal', text: 'Finish the draft by spring.', source: 'interview' });
  const a3 = await add(A, { kind: 'blocker', text: 'Stalls on opening lines.', source: 'proposed' });
  const adds = [a1, a2, a3];
  ok('PG4 three notes, one of each source, are kept: 201, a real uuid, ISO times, the kind and source she sent',
    adds.every((r) => r.status === 201 && UUID.test(r.body.note.id) && !Number.isNaN(Date.parse(r.body.note.createdAt)) && r.body.note.createdAt === new Date(r.body.note.createdAt).toISOString()) && a2.body.note.kind === 'goal' && a3.body.note.source === 'proposed',
    JSON.stringify(adds.map((r) => r.status)));
  ok('PG4 three rows are in the table', (await count(A)) === 3);
  const listed = await call('get', '/tutor/notes', { userId: A });
  ok('PG4 she sees all three, oldest first', listed.body.notes.map((n) => n.text).join('|') === 'First, from her own hand.|Finish the draft by spring.|Stalls on opening lines.', listed.body.notes.map((n) => n.text).join('|'));
  const edit = await call('patch', '/tutor/notes/:id', { userId: A, id: a2.body.note.id, body: { text: 'Finish the draft by summer.', kind: 'interest' } });
  const afterEdit = (await pool.query('select kind, text, updated_at >= created_at as moved from tutor_notes where id = $1', [a2.body.note.id])).rows[0];
  ok('PG4 she edits one: 200, the row now holds the new text and kind, and its updated time did not go backwards', edit.status === 200 && afterEdit.text === 'Finish the draft by summer.' && afterEdit.kind === 'interest' && afterEdit.moved === true, JSON.stringify(afterEdit));
  const wrongEdit = await call('patch', '/tutor/notes/:id', { userId: A, id: a2.body.note.id, body: { kind: 'mood' } });
  ok('PG4 a bad edit is refused 400 and the row is unchanged', wrongEdit.status === 400 && (await pool.query('select kind from tutor_notes where id = $1', [a2.body.note.id])).rows[0].kind === 'interest');

  // PG5 — another writer can touch nothing of hers
  const bList = await call('get', '/tutor/notes', { userId: B });
  const bEdit = await call('patch', '/tutor/notes/:id', { userId: B, id: a1.body.note.id, body: { text: 'Written by someone else.' } });
  const bDel = await call('delete', '/tutor/notes/:id', { userId: B, id: a1.body.note.id });
  const stillA = (await pool.query('select text from tutor_notes where id = $1', [a1.body.note.id])).rows[0];
  ok('PG5 another writer sees none of hers, and cannot edit or delete her note: the same 404 as an id that does not exist, and the row is untouched',
    bList.body.notes.length === 0 && bEdit.status === 404 && bDel.status === 404 && stillA && stillA.text === 'First, from her own hand.', JSON.stringify([bList.body.notes.length, bEdit.status, bDel.status]));
  const bAdd = await add(B, { text: 'B keeps one.' });
  const bWipe = await call('delete', '/tutor/notes', { userId: B });
  ok('PG5 another writer\'s wipe deletes only her own notes, and says how many (1); all three of hers remain', bAdd.status === 201 && bWipe.status === 200 && bWipe.body.deleted === 1 && (await count(A)) === 3 && (await count(B)) === 0, JSON.stringify(bWipe.body));
  const notUuid = await call('delete', '/tutor/notes/:id', { userId: A, id: "1; drop table tutor_notes; --" });
  ok('PG5 an id that is not a uuid answers 404 and never reaches the database as an error', notUuid.status === 404 && !notUuid.thrown && (await count(A)) === 3);

  // PG6 — deleting is deleting
  const del = await call('delete', '/tutor/notes/:id', { userId: A, id: a1.body.note.id });
  const gone = (await pool.query('select count(*)::int as n from tutor_notes where id = $1', [a1.body.note.id])).rows[0].n;
  const again = await call('delete', '/tutor/notes/:id', { userId: A, id: a1.body.note.id });
  ok('PG6 deleting one note removes its row (a count of that id is 0), and deleting it again is 404', del.status === 200 && del.body.deleted === 1 && gone === 0 && again.status === 404);
  const wipe = await call('delete', '/tutor/notes', { userId: A });
  ok('PG6 wipe removes every note she has, says how many (2), and the table holds no row of hers afterwards, hidden or not', wipe.status === 200 && wipe.body.deleted === 2 && (await count(A)) === 0, JSON.stringify(wipe.body));
  const wipeNone = await call('delete', '/tutor/notes', { userId: A });
  ok('PG6 wiping when there are none is fine (0)', wipeNone.status === 200 && wipeNone.body.deleted === 0);

  // PG7 — the cap, and what the filter does to a proposal
  let last = null;
  for (let i = 0; i < 100; i += 1) last = await add(A, { text: `Note number ${i + 1}.` });
  const over = await add(A, { text: 'One too many.' });
  ok('PG7 the 100th note is kept and the 101st is refused 409, with exactly 100 rows', last.status === 201 && over.status === 409 && (await count(A)) === 100, `${last.status}/${over.status}/${await count(A)}`);
  await call('delete', '/tutor/notes', { userId: A });
  const adhd = 'Has ADHD and prefers short tasks.';
  const prop = await add(A, { text: adhd, source: 'proposed' });
  const own = await add(A, { text: adhd, source: 'own' });
  ok('PG7 a PROPOSED note that guesses at her health is refused 422 with no row; the same words typed by her own hand are kept', prop.status === 422 && own.status === 201 && (await count(A)) === 1, `${prop.status}/${own.status}`);

  // PG8 — the one reader for an ask
  const forAsk = await rules.notesForAsk(routes.sqlNotesStore, A);
  const forB = await rules.notesForAsk(routes.sqlNotesStore, B);
  ok('PG8 the one reader for an ask returns her own notes as "kind: text" lines from the real table, and nothing for a writer with none', forAsk.length === 1 && forAsk[0] === `tendency: ${adhd}` && forB.length === 0, JSON.stringify(forAsk));

  // PG9 — the notes go with the account
  await pool.query('delete from users where id = $1', [A]);
  made.splice(made.indexOf(A), 1);
  const orphan = (await pool.query('select count(*)::int as n from tutor_notes where user_id = $1', [A])).rows[0].n;
  ok('PG9 when a writer\'s account is deleted her notes go with it', orphan === 0, String(orphan));
} catch (e) {
  ok('the check ran to the end', false, String((e && e.stack) || e).slice(0, 400));
} finally {
  try { for (const id of made) await pool.query('delete from users where id = $1', [id]); } catch { /* best effort */ }
  try { await pool.end(); } catch { /* ignore */ }
  s.cleanup();
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  [' + String(c.detail).slice(0, 300) + ']' : ''}`);
const failed = checks.filter((c) => !c.pass);
console.log(`\nTUTOR-NOTES-PG VERIFY: ${failed.length ? 'FAIL (' + failed.length + ' of ' + checks.length + ')' : 'PASS (' + checks.length + ' checks)'}`);
process.exit(failed.length ? 1 : 0);
