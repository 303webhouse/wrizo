// TUTOR-B ITEM 7 STEP 1 — THE TUTOR'S NOTES ON FILE (TUTOR build-list item 7, "Memory, step 1"; rules-of-the-road section 8 and R13). BROWSERLESS, SERVER ONLY, NO KEY, NO DATABASE:
// the real rules (apps/server/src/tutorNotes.ts) and the real routes (tutorNotesRoutes.ts) run against a stand-in database that reads the route's own SQL text,
// so a statement that loses its `user_id = $1` really does reach another writer's rows here.
// Fable's ruled shape (Nov 23, 10:44 pm): its own server table, one row per note; kept only on her yes; she can see, edit and wipe them; wipe truly deletes; only the server reads
// them for an ask; never sent to another writer.
//   TN1  kept only on her yes: GET and every other request make no row; POST with kind, text and source makes exactly one; a bad kind, an empty or over-long text, a bad source, or any
//        extra key (a user id, a note id) is refused 400 and makes no row; at the cap (100) the next is refused 409
//   TN2  she sees, edits and wipes: GET lists hers, oldest first; PATCH changes the text or the kind of one; DELETE removes one; DELETE on the collection removes all of hers
//   TN3  wipe truly deletes: remove and wipe are SQL deletes and nothing else; the table has no deleted_at, no archive and no second copy; after a wipe a GET is empty and the stand-in table holds no row of hers
//   TN4  never another writer's: through the real routes, B's GET shows none of A's; B's PATCH and DELETE of A's note id answer 404 and change nothing; B's wipe leaves A's alone; EVERY statement carries
//        user_id = $1 and $1 is the session's id (a request cannot change it); a note id that is not a uuid answers 404 (never a database error)
//   TN5  only the server reads them for an ask: notesForAsk returns her own notes as "kind: text" lines and nothing of anyone else's; the router has exactly the five routes (no other way to read a note); the
//        sync route and the Tutor chat route do not touch the table
//   TN6  the migration: tutor_notes is created on the boot path with the kinds and sources checked in the table, a 1 to 400 text, on delete cascade from the writer, no deleted_at; and it is mounted before the chat route
//   MUT1 a delete that loses its user scope: TN4 goes RED   MUT2 a wipe that only hides (a deleted_at): TN3 goes RED   MUT3 the cap removed: TN1 goes RED   MUT4 extra keys allowed: TN1 goes RED
//   MUT5 a list that loses its user scope: TN4 goes RED   MUT6 the notes mounted after the chat route: TN6 goes RED   MUT7 a note saved on GET (a proposal kept without her yes): TN1 goes RED
//   FL1  the note filter (check M8; runner-kit.md v0.3 section 4): the kit's twenty-three made-up notes N1-N23 come out as marked
//   FL2  the matching rules: whole words, any case, a star is any ending, ADD capitals only, a phrase as written, an apostrophe does not join a word, a writing word clears List B and never List A
//   FL3  every entry of the kit's three lists does its job (A always stops, B stops alone and clears with a writing word, C clears B); and the kit's check on the lists themselves: no List C entry matches an A or B entry, and no A or B entry matches a C entry
//   FL4  only a PROPOSAL is filtered (Fable, Nov 24): her own note and her interview answer are kept as written; a stopped proposal is refused 422 with no row; a clean one is kept on her yes; an edit is hers
//   FL5  the filter is wired at the one place a proposed note is kept, and is a pure module
//   MUT8 List A emptied: FL1 N9-N11, N13-N17 go RED   MUT9 step 2 removed: FL1 N12, N18, N20-N22 go RED   MUT10 a writing word clears List A too: N11 goes RED   MUT11 ADD in any case   MUT12 no star   MUT13 no word boundary
//   MUT14 a proposal kept without the filter   MUT15 her own note filtered too: FL4 goes RED   MUT16 'memo' as a stem again (the v0.2 fault): N21 and the lists check go RED   MUT17 'parent' as a stem again: FL2 goes RED
// RED on main, where the table and the routes do not exist. Run (from apps/desktop): node scripts/harness/tutor-notes.mjs
import fs from 'node:fs';
import path from 'node:path';
import { loadServer, swap, SERVER_SRC } from '../../../server/scripts/tutor-eval/load-server.mjs';

let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${String(detail).replace(/\s+/g, ' ').slice(0, 400)}]` : ''}`); if (!cond) fails += 1; };
const read = (f) => fs.readFileSync(path.join(SERVER_SRC, f), 'utf8').replace(/\r\n/g, '\n');
const FILES = ['env.ts', 'asyncHandler.ts', 'logSafe.ts', 'tutorNoteFilter.ts', 'tutorNotes.ts', 'tutorNotesRoutes.ts'];

// ---- the stand-in database: it reads the SQL text the route sends and does what that text says ----
function makeDb() {
  const rows = []; // { id, user_id, kind, text, source, created_at, updated_at, deleted_at? }
  const log = [];
  let n = 0;
  const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  const stamp = () => new Date(1700000000000 + n * 1000).toISOString();
  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, ' ').trim();
    log.push({ sql: s, params });
    const scoped = /user_id = \$1/.test(s);
    const byId = /\bid = \$2\b/.test(s);
    const match = (r) => (!scoped || r.user_id === params[0]) && (!byId || r.id === params[1]);
    if (/^select count\(\*\)/.test(s)) return { rows: [{ n: rows.filter(match).length }], rowCount: 1 };
    if (/^select .* from tutor_notes/.test(s)) return { rows: rows.filter((r) => !r.deleted_at).filter(match).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)).map((r) => ({ ...r })), rowCount: 0 };
    if (/^insert into tutor_notes/.test(s)) {
      const r = { id: uuid(), user_id: params[0], kind: params[1], text: params[2], source: params[3], created_at: stamp(), updated_at: stamp() };
      rows.push(r); return { rows: [{ ...r }], rowCount: 1 };
    }
    if (/^update tutor_notes set deleted_at/.test(s)) { let c = 0; for (const r of rows) if (match(r)) { r.deleted_at = stamp(); c += 1; } return { rows: [], rowCount: c }; }
    if (/^update tutor_notes set kind/.test(s)) {
      const hit = rows.filter((r) => !r.deleted_at && match(r));
      for (const r of hit) { if (params[2] != null) r.kind = params[2]; if (params[3] != null) r.text = params[3]; r.updated_at = stamp(); }
      return { rows: hit.map((r) => ({ ...r })), rowCount: hit.length };
    }
    if (/^delete from tutor_notes/.test(s)) {
      let c = 0;
      for (let i = rows.length - 1; i >= 0; i -= 1) if (match(rows[i])) { rows.splice(i, 1); c += 1; }
      return { rows: [], rowCount: c };
    }
    throw new Error('stand-in database: a statement it does not know: ' + s.slice(0, 100));
  }
  return { rows, log, query };
}

// a fresh copy of the server's files (optionally one mutated), with the stand-in database behind them
function boot(mutate = {}, preset = null) {
  process.env.SESSION_SECRET = 'harness-secret';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';
  const s = loadServer({ files: FILES, mutate });
  const db = preset || makeDb();
  fs.writeFileSync(path.join(s.tmp, 'db.js'), 'exports.pool = global.__tutorNotesPool;\r\n');
  global.__tutorNotesPool = { query: db.query };
  const routes = s.load('tutorNotesRoutes.ts');
  const rules = s.load('tutorNotes.ts');
  return { s, db, routes, rules };
}

function handlerFor(router, method, routePath) {
  for (const layer of router.stack) if (layer.route && layer.route.path === routePath && layer.route.methods[method]) { const st = layer.route.stack; return st[st.length - 1].handle; }
  return null;
}
async function call(b, method, routePath, { userId = 'u-a', body, id } = {}) {
  const h = handlerFor(b.routes.tutorNotesRouter, method, routePath);
  if (!h) return { status: 0, body: null, thrown: 'no such route' };
  const req = { body: body === undefined ? {} : body, params: id === undefined ? {} : { id }, session: { userId }, query: {} };
  const res = { statusCode: 200, body: undefined };
  let finish; const done = new Promise((r) => { finish = r; });
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (x) => { res.body = x; finish(); return res; };
  let thrown = null;
  h(req, res, (e) => { if (e) thrown = String((e && e.message) || e).slice(0, 200); finish(); });
  await Promise.race([done, new Promise((r) => setTimeout(r, 4000))]);
  return { status: res.statusCode, body: res.body, thrown };
}
const add = (b, userId, over = {}) => call(b, 'post', '/tutor/notes', { userId, body: { kind: 'tendency', text: 'Writes best in the morning.', source: 'own', ...over } });
const list = (b, userId) => call(b, 'get', '/tutor/notes', { userId });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ---- the source scans (TN3, TN5, TN6): they read the shipped files' text ----
function scans(files) {
  const f = {};
  const out = {};
  const routesSrc = files['tutorNotesRoutes.ts'];
  const migSrc = files['migrate.ts'];
  const idxSrc = files['index.ts'];
  const table = (migSrc.match(/create table if not exists tutor_notes \(([\s\S]*?)\n\s*\)`/) || [])[1] || '';
  out.table = !!table && /user_id uuid not null references users\(id\) on delete cascade/.test(table)
    && /kind text not null check \(kind in \('tendency', 'interest', 'blocker', 'goal'\)\)/.test(table)
    && /source text not null check \(source in \('proposed', 'interview', 'own'\)\)/.test(table)
    && /char_length\(text\) between 1 and 400/.test(table) && !/deleted|archived|purged|hidden/i.test(table);
  const sqlStatements = [...routesSrc.matchAll(/`((?:select|insert|update|delete)[^`]*)`/g)].map((m) => m[1].replace(/\s+/g, ' ').trim());
  out.onlyHardDeletes = sqlStatements.filter((q) => /^delete/.test(q)).length === 2 && sqlStatements.every((q) => !/deleted_at|archived|purged/i.test(q));
  out.allScoped = sqlStatements.length === 6 && sqlStatements.every((q) => /user_id = \$1/.test(q) || /^insert into tutor_notes \(user_id,/.test(q));
  const mount = idxSrc.indexOf("app.use('/api', tutorNotesRouter);");
  const chat = idxSrc.indexOf("app.use('/api', tutorRouter);");
  out.mount = mount > 0 && chat > 0 && mount < chat && /import \{ tutorNotesRouter \} from '\.\/tutorNotesRoutes';/.test(idxSrc);
  out.notRead = !/tutorNotes|tutor_notes/.test(files['sync.ts']) && !/tutor_notes/.test(files['tutor.ts']);
  out.noReaderRoute = !/notesForAsk/.test(routesSrc);
  return out;
}
const allFiles = () => ({ 'tutorNotesRoutes.ts': read('tutorNotesRoutes.ts'), 'migrate.ts': read('migrate.ts'), 'index.ts': read('index.ts'), 'sync.ts': read('sync.ts'), 'tutor.ts': read('tutor.ts') });

// =============================== the real tree ===============================
if (!fs.existsSync(path.join(SERVER_SRC, 'tutorNotes.ts')) || !fs.existsSync(path.join(SERVER_SRC, 'tutorNotesRoutes.ts'))) {
  ok(false, 'TN0 the notes rules and routes exist: apps/server/src/tutorNotes.ts and tutorNotesRoutes.ts');
  console.log(`\nTUTOR-NOTES VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(1);
}

// TN1
{
  const b = boot();
  const g0 = await list(b, 'u-a');
  const rowsAfterReads = b.db.rows.length;
  ok(g0.status === 200 && Array.isArray(g0.body.notes) && g0.body.notes.length === 0 && rowsAfterReads === 0, 'TN1 she has none to begin with, and a GET makes no row', JSON.stringify(g0.body));
  const a1 = await add(b, 'u-a');
  const n1 = a1.body && a1.body.note;
  ok(a1.status === 201 && n1 && UUID.test(n1.id) && n1.kind === 'tendency' && n1.text === 'Writes best in the morning.' && n1.source === 'own' && !!n1.createdAt && !!n1.updatedAt && b.db.rows.length === 1, 'TN1 her yes (POST with kind, text and source) makes exactly one row, and it comes back with its id', JSON.stringify(a1.body));
  const bads = [
    ['a kind that is not on the list', { kind: 'mood' }], ['no kind', { kind: undefined }], ['empty text', { text: '' }], ['spaces only', { text: '   ' }],
    ['text over 400', { text: 'x'.repeat(401) }], ['text that is not a string', { text: 42 }], ['a source that is not on the list', { source: 'guess' }], ['no source', { source: undefined }],
    ['an extra user id', { user_id: 'u-b' }], ['an extra note id', { id: '00000000-0000-4000-8000-0000000000ff' }], ['an extra field', { health: 'adhd' }],
  ];
  const wrong = [];
  for (const [name, over] of bads) { const r = await add(b, 'u-a', over); if (r.status !== 400) wrong.push(`${name}=${r.status}`); }
  ok(wrong.length === 0 && b.db.rows.length === 1, 'TN1 every bad request is refused 400 and makes no row (bad kind, bad source, empty, over-long, not a string, any extra key)', wrong.join(' ') || `rows=${b.db.rows.length}`);
  const bodiesBad = [];
  for (const body of [null, 'note', ['x'], 7]) { const r = await call(b, 'post', '/tutor/notes', { userId: 'u-a', body }); if (r.status !== 400) bodiesBad.push(String(body) + '=' + r.status); }
  ok(bodiesBad.length === 0 && b.db.rows.length === 1, 'TN1 a body that is not an object is refused 400', bodiesBad.join(' '));
  const a2 = await add(b, 'u-a', { text: '  trimmed  ', kind: 'goal', source: 'proposed' });
  ok(a2.status === 201 && a2.body.note.text === 'trimmed' && a2.body.note.source === 'proposed' && a2.body.note.kind === 'goal', 'TN1 text is trimmed; the three sources (proposed, interview, own) and the four kinds are accepted', JSON.stringify(a2.body));
  for (const k of ['interest', 'blocker']) for (const s of ['interview']) { const r = await add(b, 'u-a', { kind: k, source: s, text: k + ' ' + s }); if (r.status !== 201) ok(false, 'TN1 kind ' + k + ' from the ' + s + ' is accepted', r.status); }
  const long = await add(b, 'u-a', { text: 'y'.repeat(400) });
  ok(long.status === 201, 'TN1 a 400-character note is accepted (the edge)', long.status);
  // the cap
  const c = boot();
  let last = null; let made = 0;
  for (let i = 0; i < 100; i += 1) { last = await add(c, 'u-cap', { text: 'note ' + i }); if (last.status === 201) made += 1; }
  const over = await add(c, 'u-cap', { text: 'one too many' });
  const other = await add(c, 'u-other', { text: 'someone else, not capped' });
  ok(made === 100 && over.status === 409 && over.body.error === 'full' && c.db.rows.filter((r) => r.user_id === 'u-cap').length === 100 && other.status === 201, 'TN1 the 100th note is kept, the 101st is refused 409 (no row), and another writer is not held to her count', `made=${made} over=${over.status}`);
  b.s.cleanup(); c.s.cleanup();
}

// TN2 and TN3
{
  const b = boot();
  const x = (await add(b, 'u-a', { text: 'first', kind: 'interest' })).body.note;
  const y = (await add(b, 'u-a', { text: 'second', kind: 'blocker' })).body.note;
  const z = (await add(b, 'u-a', { text: 'third', kind: 'goal' })).body.note;
  const l = await list(b, 'u-a');
  ok(l.status === 200 && l.body.notes.map((n) => n.text).join() === 'first,second,third' && l.body.notes.every((n) => UUID.test(n.id) && n.createdAt && n.source), 'TN2 she sees every note she has, oldest first', JSON.stringify(l.body.notes.map((n) => n.text)));
  const e1 = await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-a', id: y.id, body: { text: 'second, changed' } });
  ok(e1.status === 200 && e1.body.note.text === 'second, changed' && e1.body.note.kind === 'blocker' && e1.body.note.id === y.id && e1.body.note.source === y.source, 'TN2 she edits the text of one note (its kind and id stay)', JSON.stringify(e1.body));
  const e2 = await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-a', id: y.id, body: { kind: 'goal' } });
  ok(e2.status === 200 && e2.body.note.kind === 'goal' && e2.body.note.text === 'second, changed', 'TN2 she changes the kind of one note (its text stays)', JSON.stringify(e2.body));
  const badEdits = []; for (const body of [{}, { text: '' }, { kind: 'mood' }, { text: 'ok', source: 'own' }, { id: x.id }, { user_id: 'u-b' }, null]) { const r = await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-a', id: y.id, body }); if (r.status !== 400) badEdits.push(JSON.stringify(body) + '=' + r.status); }
  const after = (await list(b, 'u-a')).body.notes.find((n) => n.id === y.id);
  ok(badEdits.length === 0 && after.text === 'second, changed' && after.kind === 'goal', 'TN2 a bad edit (nothing, empty, bad kind, an extra key) is refused 400 and changes nothing', badEdits.join(' '));
  const gone = await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-a', id: '00000000-0000-4000-8000-0000000000aa', body: { text: 'x' } });
  ok(gone.status === 404, 'TN2 an id that does not exist answers 404', gone.status);
  const d1 = await call(b, 'delete', '/tutor/notes/:id', { userId: 'u-a', id: x.id });
  const l2 = await list(b, 'u-a');
  ok(d1.status === 200 && d1.body.deleted === 1 && l2.body.notes.map((n) => n.text).join() === 'second, changed,third' && !b.db.rows.some((r) => r.id === x.id), 'TN2/TN3 she removes one note: it is gone from the list and from the table (a real delete)', JSON.stringify(d1.body));
  const d1b = await call(b, 'delete', '/tutor/notes/:id', { userId: 'u-a', id: x.id });
  ok(d1b.status === 404, 'TN2 removing it again answers 404', d1b.status);
  const w = await call(b, 'delete', '/tutor/notes', { userId: 'u-a' });
  const l3 = await list(b, 'u-a');
  ok(w.status === 200 && w.body.deleted === 2 && l3.body.notes.length === 0 && b.db.rows.length === 0, 'TN2/TN3 wipe removes all she has, says how many, and the stand-in table holds no row of hers afterwards (not even a hidden one)', JSON.stringify(w.body) + ' rows=' + b.db.rows.length);
  const w2 = await call(b, 'delete', '/tutor/notes', { userId: 'u-a' });
  ok(w2.status === 200 && w2.body.deleted === 0, 'TN2 wiping when there are none is fine (0)', JSON.stringify(w2.body));
  const sc = scans(allFiles());
  ok(sc.onlyHardDeletes, 'TN3 the route\'s SQL deletes with `delete from tutor_notes` (two statements) and has no deleted_at, archive or purge anywhere');
  ok(!/deleted_at|archived|purged/i.test((read('migrate.ts').match(/create table if not exists tutor_notes \(([\s\S]*?)\n\s*\)`/) || [])[1] || 'x'), 'TN3 the table itself has no column a deleted note could hide behind');
  b.s.cleanup();
}

// TN4
{
  const b = boot();
  const a1 = (await add(b, 'u-a', { text: 'A one' })).body.note;
  const a2 = (await add(b, 'u-a', { text: 'A two' })).body.note;
  const b1 = (await add(b, 'u-b', { text: 'B one' })).body.note;
  const lb = await list(b, 'u-b');
  ok(lb.body.notes.length === 1 && lb.body.notes[0].text === 'B one' && !JSON.stringify(lb.body).includes('A one') && !JSON.stringify(lb.body).includes('A two'), 'TN4 B\'s list holds B\'s note and nothing of A\'s', JSON.stringify(lb.body.notes.map((n) => n.text)));
  const pe = await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-b', id: a1.id, body: { text: 'B overwrote A' } });
  const rm = await call(b, 'delete', '/tutor/notes/:id', { userId: 'u-b', id: a1.id });
  const la = (await list(b, 'u-a')).body.notes;
  ok(pe.status === 404 && rm.status === 404 && JSON.stringify(pe.body) === JSON.stringify((await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-b', id: '00000000-0000-4000-8000-0000000000bb', body: { text: 'x' } })).body) && la.length === 2 && la[0].text === 'A one', 'TN4 B\'s edit and delete of A\'s note id answer 404 (the same answer as an id that does not exist) and change nothing', `${pe.status} ${rm.status} ${JSON.stringify(la.map((n) => n.text))}`);
  const wb = await call(b, 'delete', '/tutor/notes', { userId: 'u-b' });
  const la2 = (await list(b, 'u-a')).body.notes;
  ok(wb.body.deleted === 1 && la2.length === 2 && b.db.rows.filter((r) => r.user_id === 'u-b').length === 0, 'TN4 B\'s wipe deletes B\'s one note and leaves both of A\'s', JSON.stringify(wb.body));
  const nonUuid = [];
  for (const id of ['abc', '1', "1' or '1'='1", '../x', '']) {
    const r1 = await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-a', id, body: { text: 'x' } });
    const r2 = await call(b, 'delete', '/tutor/notes/:id', { userId: 'u-a', id });
    if (r1.status !== 404 || r2.status !== 404 || r1.thrown || r2.thrown) nonUuid.push(`${id}:${r1.status}/${r2.status}`);
  }
  ok(nonUuid.length === 0 && (await list(b, 'u-a')).body.notes.length === 2, 'TN4 an id that is not a uuid answers 404 (it never reaches the database as an error or an injection)', nonUuid.join(' '));
  // every statement, whichever route sent it
  b.db.log.length = 0;
  await list(b, 'u-z'); await add(b, 'u-z'); await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-z', id: a1.id, body: { text: 'z' } }); await call(b, 'delete', '/tutor/notes/:id', { userId: 'u-z', id: a1.id }); await call(b, 'delete', '/tutor/notes', { userId: 'u-z' });
  const odd = b.db.log.filter((q) => q.params[0] !== 'u-z' || !(/user_id = \$1/.test(q.sql) || /^insert into tutor_notes \(user_id,/.test(q.sql)));
  ok(b.db.log.length >= 6 && odd.length === 0, 'TN4 every statement the five routes send carries user_id = $1 (or inserts it as the first value), and $1 is the session\'s own id', `${b.db.log.length} statements; odd: ${odd.map((q) => q.sql.slice(0, 60)).join(' | ')}`);
  ok(scans(allFiles()).allScoped, 'TN4 in the shipped route file: six statements, each scoped by user_id = $1 (the source, not only the run)');
  b.s.cleanup();
}

// TN5
{
  const b = boot();
  await add(b, 'u-a', { text: 'likes short scenes', kind: 'interest' });
  await add(b, 'u-a', { text: 'stalls on openings', kind: 'blocker' });
  await add(b, 'u-b', { text: 'B only' });
  const store = b.routes.sqlNotesStore;
  const linesA = await b.rules.notesForAsk(store, 'u-a');
  const linesC = await b.rules.notesForAsk(store, 'u-c');
  ok(JSON.stringify(linesA) === JSON.stringify(['interest: likes short scenes', 'blocker: stalls on openings']) && linesC.length === 0 && !linesA.join().includes('B only'), 'TN5 the one reader for an ask returns her own notes as "kind: text" lines, nothing of another writer\'s, and nothing for a writer with none', JSON.stringify(linesA));
  const stack = b.routes.tutorNotesRouter.stack.filter((l) => l.route).map((l) => Object.keys(l.route.methods).join() + ' ' + l.route.path).sort();
  ok(JSON.stringify(stack) === JSON.stringify(['delete /tutor/notes', 'delete /tutor/notes/:id', 'get /tutor/notes', 'patch /tutor/notes/:id', 'post /tutor/notes']), 'TN5 the router has exactly the five routes (list, add, edit, remove, wipe): no route reads a note any other way', JSON.stringify(stack));
  const sc = scans(allFiles());
  ok(sc.noReaderRoute && sc.notRead, 'TN5 the notes reader is not behind any route, and neither /sync nor the Tutor chat touches the table');
  b.s.cleanup();
}

// TN6
{
  const sc = scans(allFiles());
  ok(sc.table, 'TN6 the migration creates tutor_notes with the kinds and sources checked by the table, a 1 to 400 text, on delete cascade from the writer, and no deleted_at');
  ok(sc.mount, 'TN6 the notes router is mounted before the Tutor chat router (the chat\'s ten-a-minute limit never throttles her own screen)');
  ok(/create index if not exists tutor_notes_user_created on tutor_notes \(user_id, created_at\)/.test(read('migrate.ts')), 'TN6 the table is indexed by writer');
}


// =============================== the note filter (check M8) ===============================
// the kit's twenty-three made-up notes (runner-kit.md v0.3 section 4), each with the result the kit marks: true = let through, false = stopped
const KIT_NOTES = [
  ['N1', 'Comma splices recur, about one per paragraph.', true],
  ['N2', 'Gets stuck at endings; the last scene is often missing.', true],
  ['N3', 'Working toward a finished novel draft by spring.', true],
  ['N4', 'Wants feedback on dialogue first.', true],
  ['N5', 'Asked for very plain feedback.', true],
  ['N6', 'Male narrators in every story so far.', true],
  ['N7', 'Uses white space between stanzas in poems.', true],
  ['N8', 'The essay loses focus after the second claim.', true],
  ['N9', 'Seems to rush the final chapters.', false],
  ['N10', 'Has ADHD and prefers short tasks.', false],
  ['N11', 'You are a young mother who writes poems at night.', false],
  ['N12', 'Anxious about sharing work.', false],
  ['N13', 'English is a second language; article errors are common.', false],
  ['N14', 'She avoids conflict in scenes.', false],
  ['N15', 'Perfectionism stalls revision.', false],
  ['N16', 'Writes about growing up Catholic.', false],
  ['N17', 'Probably a student; essays follow school prompts.', false],
  ['N18', 'Loses focus after an hour.', false],
  ['N19', 'Dialogue feels stiff in group scenes.', true],
  ['N20', 'You feel stuck most mornings.', false],
  ['N21', 'Poor memory for names.', false],
  ['N22', 'Poor command of English.', false],
  ['N23', 'Overuses parentheses in every paragraph.', true],
];
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
// a word from a list as it would appear in a note ("diagnos*" -> "diagnosing")
const asWritten = (w) => (w.endsWith('*') ? w.slice(0, -1) + 'ing' : w);

// everything the filter must do, run against one build of the files (the real one, or a mutant). Returns what went wrong, by name.
async function filterRun(mutate = {}) {
  const b = boot(mutate);
  const wrong = { kit: [], matching: [], lists: [], route: [], cross: [] };
  try {
    const F = b.s.load('tutorNoteFilter.ts');
    const pass = (t) => F.noteFilter(t).pass;
    for (const [id, text, want] of KIT_NOTES) if (pass(text) !== want) wrong.kit.push(id);
    const cases = [
      ['whole words only: "seamless" is not "seem", "transitions" is not "trans"', pass('Prefers seamless transitions.') === true],
      ['any letter case: all capitals still stop ADHD and SEEMS', pass('HAS ADHD AND PREFERS SHORT TASKS.') === false && pass('SEEMS to rush the end.') === false],
      ['a star is any ending: diagnosed, diagnosis, traumatic', pass('Was diagnosed years back.') === false && pass('A diagnosis came late.') === false && pass('Writes about traumatic days.') === false],
      ['a stem must not reach another word: "parentheses" is not "parent", "command" is not "comma", "memory" is not "memo"', pass('Uses parentheses.') === true && pass('Poor command of English.') === false && pass('Poor memory for names.') === false],
      ['ADD is capitals only: "Add a scene break" passes, "ADD" stops', pass('Add a scene break after the ending.') === true && pass('Has ADD.') === false],
      ['a phrase as written: "may be" stops, "may" alone does not', pass('It may be fine.') === false && pass('Wants to rush endings, may cut them.') === true],
      ['an apostrophe does not join a word to its neighbour: "she\'s" holds "she"', pass("She's quick to cut.") === false && pass('She’s quick to cut.') === false],
      ['a phrase\'s spaces may be any run, including a line break', pass('English as a second\nlanguage.') === false && pass("You’re a poet.") === false],
      ['List C clears List B ("Male narrators"), never List A ("Poems about grief" is stopped)', pass('Male narrators.') === true && pass('Male.') === false && pass('Poems about grief.') === false],
      ['nothing to propose: an empty or non-text note does not pass', pass('') === false && pass('   ') === false && pass(null) === false && pass(42) === false && F.noteFilter('').step === 0],
      ['the step is named: a List A hit is step 1, a List B hit with no List C is step 2', F.noteFilter('Seems to rush.').step === 1 && F.noteFilter('Anxious about sharing work.').step === 2 && F.noteFilter('Comma splices recur.').step === null],
    ];
    for (const [name, good] of cases) if (!good) wrong.matching.push(name);
    // every word of the kit's three lists does its job
    const A = F.LIST_A.flatMap((g) => g.words); const B = F.LIST_B.flatMap((g) => g.words); const C = F.LIST_C_WORDS;
    const aMiss = A.filter((w) => F.noteFilter(`Notes: ${asWritten(w)}.`).step !== 1 || F.noteFilter(`Notes: ${asWritten(w)} story.`).pass);
    // a List B word that a List C entry also matches clears itself (the kit's own lists: "memory" is matched by C's "memo*"); named here so a new overlap cannot slip in unseen
    const selfCleared = B.filter((w) => F.noteFilter(`${asWritten(w)}.`).pass);
    wrong.selfCleared = selfCleared;
    const bMiss = B.filter((w) => !selfCleared.includes(w)).filter((w) => F.noteFilter(`Notes: ${asWritten(w)}.`).step !== 2 || !F.noteFilter(`Notes: ${asWritten(w)} story.`).pass);
    const cMiss = C.filter((w) => !F.noteFilter(`A woman ${asWritten(w)}.`).pass);
    if (aMiss.length) wrong.lists.push('List A entries that do not always stop: ' + aMiss.join(' | '));
    if (bMiss.length) wrong.lists.push('List B entries that do not stop alone and clear with a writing word: ' + bMiss.join(' | '));
    if (cMiss.length) wrong.lists.push('List C words that do not clear a List B word: ' + cMiss.join(' | '));
    // the kit's check on the lists themselves: no List C entry matches an A or B entry, and no A or B entry matches a C entry (the check that would have caught the 'memo*' fault)
    wrong.cross = [];
    for (const c of C) for (const e of [...A, ...B]) if (F.entryMatches(e, asWritten(c)) || F.entryMatches(c, asWritten(e))) wrong.cross.push(c + ' ~ ' + e);
    wrong.counts = { A: A.length, B: B.length, C: C.length };
    // the route: only a PROPOSAL is filtered (Fable, Nov 24)
    const post = (userId, source, text) => call(b, 'post', '/tutor/notes', { userId, body: { kind: 'tendency', text, source } });
    const adhd = 'Has ADHD and prefers short tasks.';
    const own = await post('u-f', 'own', adhd);
    const intv = await post('u-f', 'interview', adhd);
    const rowsBefore = b.db.rows.length;
    const prop = await post('u-f', 'proposed', adhd);
    const prop2 = await post('u-f', 'proposed', 'Anxious about sharing work.');
    const prop3 = await post('u-f', 'proposed', 'Seems to rush the final chapters.');
    const rowsAfter = b.db.rows.length;
    const clean = await post('u-f', 'proposed', 'Comma splices recur, about one per paragraph.');
    const own2 = await post('u-f', 'own', 'Anxious about sharing work.');
    const edit = await call(b, 'patch', '/tutor/notes/:id', { userId: 'u-f', id: clean.body && clean.body.note && clean.body.note.id, body: { text: adhd } });
    if (own.status !== 201) wrong.route.push('her own note naming ADHD must be kept (' + own.status + ')');
    if (intv.status !== 201) wrong.route.push('her interview answer naming ADHD must be kept (' + intv.status + ')');
    if (own2.status !== 201) wrong.route.push('her own note "Anxious about sharing work." must be kept (' + own2.status + ')');
    if (prop.status !== 422 || prop2.status !== 422 || prop3.status !== 422 || rowsAfter !== rowsBefore) wrong.route.push('a proposed note that is stopped must be refused 422 with no row (' + [prop.status, prop2.status, prop3.status].join('/') + ', rows ' + rowsBefore + '->' + rowsAfter + ')');
    if (clean.status !== 201) wrong.route.push('a clean proposed note must be kept on her yes (' + clean.status + ')');
    if (edit.status !== 200 || !edit.body.note || edit.body.note.text !== adhd) wrong.route.push('editing a kept note is hers: it is never filtered (' + edit.status + ')');
  } finally { b.s.cleanup(); }
  return wrong;
}

{
  const w = await filterRun();
  ok(w.kit.length === 0, 'FL1 the kit\'s twenty-three made-up notes come out as marked (N1-N8, N19 and N23 let through; N9-N18 and N20-N22 stopped)', 'wrong: ' + w.kit.join(' '));
  ok(w.matching.length === 0, 'FL2 the matching rules: whole words, any case, a star is any ending, ADD capitals only, a phrase as written, an apostrophe does not join, List C clears B and never A', w.matching.join(' || '));
  ok(w.lists.length === 0, `FL3 every entry of the kit's lists does its job (${w.counts.A} in List A always stop, ${w.counts.B} in List B stop alone and clear with a writing word, ${w.counts.C} in List C clear a List B word)`, w.lists.join(' || ').slice(0, 380));
  ok(w.selfCleared.length === 0, "FL3 no List B word clears itself (v0.2's 'memo*' matched 'memory'; v0.3 uses whole words)", JSON.stringify(w.selfCleared));
  ok(w.cross.length === 0, 'FL3 the kit check on the lists themselves: no List C entry matches an A or B entry, and no A or B entry matches a C entry', w.cross.join(' | ').slice(0, 380));
  ok(w.route.length === 0, 'FL4 only a PROPOSAL is filtered: her own note and her interview answer are kept as she wrote them, a stopped proposal is refused 422 with no row, a clean one is kept on her yes, an edit is hers', w.route.join(' || '));
  const fsrc = read('tutorNoteFilter.ts'); const rsrc = read('tutorNotes.ts');
  ok(/import \{ noteFilter \} from '\.\/tutorNoteFilter';/.test(rsrc) && /body\.source === 'proposed' && !noteFilter\(text\)\.pass/.test(rsrc), 'FL5 the filter is wired where a proposed note is kept (tutorNotes.ts), and only there');
  ok(!/^import /m.test(fsrc), 'FL5 the filter is a pure module: no imports, no database, nothing it could send anywhere');
}

// =============================== the mutants ===============================
async function mutantRed(label, mutate, probe) {
  let red = false; let why = '';
  try { const b = boot(mutate); try { red = await probe(b); } finally { b.s.cleanup(); } } catch (e) { red = true; why = String(e.message).slice(0, 80); }
  ok(red, `${label} goes RED`, why);
}
// MUT1: a delete that loses its user scope
await mutantRed('MUT1 (a delete without its user scope: TN4)', { 'tutorNotesRoutes.ts': swap('`delete from tutor_notes where user_id = $1 and id = $2`', '`delete from tutor_notes where id = $2`') }, async (b) => {
  const a = (await add(b, 'u-a')).body.note;
  await call(b, 'delete', '/tutor/notes/:id', { userId: 'u-b', id: a.id });
  return (await list(b, 'u-a')).body.notes.length === 0; // B deleted A's note: the TN4 check (404 and A's list intact) fails
});
// MUT5: a list that loses its user scope
await mutantRed('MUT5 (a list without its user scope: TN4)', { 'tutorNotesRoutes.ts': swap('from tutor_notes where user_id = $1 order by created_at, id', 'from tutor_notes order by created_at, id') }, async (b) => {
  await add(b, 'u-a', { text: 'A secret' });
  return JSON.stringify((await list(b, 'u-b')).body).includes('A secret');
});
// MUT2: a wipe that only hides
await mutantRed('MUT2 (a wipe that only hides: TN3)', { 'tutorNotesRoutes.ts': swap('`delete from tutor_notes where user_id = $1`', '`update tutor_notes set deleted_at = now() where user_id = $1`') }, async (b) => {
  await add(b, 'u-a'); await call(b, 'delete', '/tutor/notes', { userId: 'u-a' });
  return b.db.rows.length > 0 || !scans({ ...allFiles(), 'tutorNotesRoutes.ts': read('tutorNotesRoutes.ts').replace('`delete from tutor_notes where user_id = $1`', '`update tutor_notes set deleted_at = now() where user_id = $1`') }).onlyHardDeletes;
});
// MUT3: the cap removed
await mutantRed('MUT3 (the cap removed: TN1)', { 'tutorNotes.ts': swap("if ((await store.count(userId)) >= NOTES_MAX_PER_WRITER) return { status: 409, json: { error: 'full', limit: NOTES_MAX_PER_WRITER } };", '') }, async (b) => {
  let last = null; for (let i = 0; i < 101; i += 1) last = await add(b, 'u-cap', { text: 'n' + i });
  return last.status === 201;
});
// MUT4: extra keys allowed
await mutantRed('MUT4 (extra keys allowed: TN1)', { 'tutorNotes.ts': swap("if (!isMap(body) || !onlyKeys(body, ['kind', 'text', 'source'])) return BAD;", "if (!isMap(body)) return BAD;") }, async (b) => (await add(b, 'u-a', { user_id: 'u-b' })).status === 201);
// MUT7: a note saved on GET
await mutantRed('MUT7 (a note kept without her yes: TN1)', { 'tutorNotes.ts': swap('return { status: 200, json: { notes: await store.list(userId) } };', "await store.insert(userId, { kind: 'tendency', text: 'a guess', source: 'proposed' }); return { status: 200, json: { notes: await store.list(userId) } };") }, async (b) => { await list(b, 'u-a'); return b.db.rows.length > 0; });
// MUT6: mounted after the chat route
{
  const files = allFiles();
  const idx = files['index.ts'];
  const mut = idx.replace("app.use('/api', tutorNotesRouter);\n", '').replace("app.use('/api', tutorRouter);", "app.use('/api', tutorRouter);\napp.use('/api', tutorNotesRouter);");
  ok(mut !== idx && !scans({ ...files, 'index.ts': mut }).mount, 'MUT6 (the notes mounted after the chat route: TN6) goes RED');
}


// ---- the filter's mutants (the kit: "with List A emptied, N9 to N11 and N13 to N17 must go red; with step 2 removed, N12, N18 and N20 to N22 must go red") ----
{
  const filterMut = async (label, mutate, expect) => {
    let w; try { w = await filterRun(mutate); } catch (e) { ok(false, `${label} could not run: ${String(e.message).slice(0, 90)}`); return; }
    const red = expect(w);
    ok(red, `${label} goes RED`, 'kit wrong: ' + w.kit.join(' ') + ' | matching: ' + w.matching.length + ' | route: ' + w.route.length);
  };
  await filterMut('MUT8 (List A emptied: FL1 N9-N11 and N13-N17)', { 'tutorNoteFilter.ts': swap('export const LIST_A_WORDS: readonly string[] = LIST_A.flatMap((g) => g.words);', 'export const LIST_A_WORDS: readonly string[] = [];') }, (w) => ['N9', 'N10', 'N11', 'N13', 'N14', 'N15', 'N16', 'N17'].every((id) => w.kit.includes(id)));
  await filterMut('MUT9 (step 2 removed: FL1 N12, N18 and N20-N22)', { 'tutorNoteFilter.ts': swap("if (b.length > 0 && hits(t, C_RES).length === 0) return { pass: false, step: 2, hits: b };", '') }, (w) => sameSet(w.kit.filter((id) => ['N12', 'N18', 'N20', 'N21', 'N22'].includes(id)), ['N12', 'N18', 'N20', 'N21', 'N22']));
  await filterMut('MUT10 (a writing word clears List A too: FL1 N11)', { 'tutorNoteFilter.ts': swap('if (a.length > 0) return { pass: false, step: 1, hits: a };', 'if (a.length > 0 && hits(t, C_RES).length === 0) return { pass: false, step: 1, hits: a };') }, (w) => w.kit.includes('N11') && w.matching.length > 0);
  await filterMut('MUT11 (ADD in any letter case: FL2)', { 'tutorNoteFilter.ts': swap("const CAPITALS_ONLY = new Set(['ADD']);", 'const CAPITALS_ONLY = new Set<string>([]);') }, (w) => w.matching.length > 0);
  await filterMut('MUT12 (a star not read as any ending: FL2/FL3)', { 'tutorNoteFilter.ts': swap("const star = entry.endsWith('*');", 'const star = false;') }, (w) => w.matching.length > 0 || w.lists.length > 0 || w.kit.length > 0);
  await filterMut('MUT13 (no whole-word boundary: FL2)', { 'tutorNoteFilter.ts': swap('return new RegExp(`${L}${body}${star ? \'\\\\p{L}*\' : \'\'}${R}`', 'return new RegExp(`${body}${star ? \'\\\\p{L}*\' : \'\'}`') }, (w) => w.matching.length > 0 || w.kit.length > 0);
  await filterMut('MUT14 (a proposal kept without the filter: FL4)', { 'tutorNotes.ts': swap("if (body.source === 'proposed' && !noteFilter(text).pass) return { status: 422, json: { error: 'not kept' } };", '') }, (w) => w.route.length > 0);
  await filterMut('MUT16 (memo a stem again, the v0.2 fault: N21 and the lists check)', { 'tutorNoteFilter.ts': swap("'memo', 'memos'", "'memo*', 'memos'") }, (w) => w.kit.includes('N21') && w.cross.length > 0);
  await filterMut('MUT17 (parent a stem again: FL2)', { 'tutorNoteFilter.ts': swap("'parent', 'parents'", "'parent*', 'parents'") }, (w) => w.matching.length > 0);
  await filterMut('MUT15 (her own note filtered too: FL4)', { 'tutorNotes.ts': swap("if (body.source === 'proposed' && !noteFilter(text).pass)", 'if (!noteFilter(text).pass)') }, (w) => w.route.length > 0);
}

console.log(fails === 0 ? `\nTUTOR-NOTES VERIFY: PASS (${checks} checks)` : `\nTUTOR-NOTES VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
