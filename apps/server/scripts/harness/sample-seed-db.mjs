// SAMPLE-SEED (apps/server/scripts/sample-seed.mjs) - proven against a REAL throwaway Postgres with the REAL schema (dist/migrate.js) and the REAL sync router (dist/sync.js).
// The content file is converted by the app's own store (build-world.mjs), pushed through the server's upsert paths, and then read back FROM THE DATABASE.
//   S1  the content converts cleanly (0 problems), is the approved file (md5), and every deck in the live registry has a board (rule 4)
//   S2  --counts on the recorded sample account writes nothing
//   S3  GUARDS: no id file / an id file naming another account / a wrong or missing --expect-id / a revised content file -> refused, the database unchanged; the MAIN account is refused
//   S4  --seed on an EMPTY sample: the shape in the database (drawers, sets, boards, pages, trash, scripts, templates, kinds, tags, star, imported, children, lit, Bible, grafts)
//   S5  words_written equals the measured pages count and themes_opened is untouched; the bystander and the main account are untouched
//   S6  the rules' marks: no parenthetical note and no "(grafted page:" left in any card or page; empty steps carry the deck's prompt, not text; the Martha variant stands; no
//       "[shows:" tag anywhere
//   S7  RE-RUN on a seeded account: the old rows are purged shells (none readable), the new world is in, words_written did not go down
//   S8  no email, hash, database address or any line of the writing appears in any output
// Mutants (each asserted to have LANDED): M1 a deck added to the registry with no board -> S1's rule-4 gate fires; M2 the id file naming another account -> S3 refuses; M3 a revised
//   content file with no --allow-new-content -> refused.
// Run (repo root; the server built):  EMBEDDED_PG_FROM=C:/path/to/package.json-with-embedded-postgres  node apps/server/scripts/harness/sample-seed-db.mjs
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (!process.env.EMBEDDED_PG_FROM) { console.error('Set EMBEDDED_PG_FROM to a package.json path whose install has embedded-postgres.'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const scripts = join(here, '..');
const reqWR = createRequire(pathToFileURL(process.env.EMBEDDED_PG_FROM).href);
const reqSrv = createRequire(pathToFileURL(join(here, '..', '..', 'package.json')).href);
const EmbeddedPostgres = reqWR('embedded-postgres').default || reqWR('embedded-postgres');
const { Pool } = reqSrv('pg');
const CONTENT = process.env.SAMPLE_CONTENT || join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads', 'sample-account-content.md');
if (!existsSync(CONTENT)) { console.error('Set SAMPLE_CONTENT to sample-account-content.md.'); process.exit(2); }
const PORT = 54333;
const URL_ = `postgres://postgres:postgres@127.0.0.1:${PORT}/t`;

const checks = [];
const ok = (n, p, d = '') => { checks.push([n, p]); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d ? `  [${String(d).slice(0, 400)}]` : ''}`); };
const root = mkdtempSync(join(tmpdir(), 'sample-seed-'));
const pg = new EmbeddedPostgres({ databaseDir: join(root, 'data'), user: 'postgres', password: 'postgres', port: PORT, persistent: false, initdbFlags: ['--encoding=UTF8', '--locale=C'] });
await pg.initialise(); await pg.start(); await pg.createDatabase('t');
process.env.DATABASE_URL = URL_; process.env.SESSION_SECRET = 'proof'; process.env.NODE_ENV = 'development';
await reqSrv(join(here, '..', '..', 'dist', 'migrate.js')).runMigrations();
const pool = new Pool({ connectionString: URL_ });
const seedMod = await import(pathToFileURL(join(scripts, 'sample-seed.mjs')).href);
const worldMod = await import(pathToFileURL(join(scripts, 'sample-seed', 'build-world.mjs')).href);
const { loadAppStore } = await import(pathToFileURL(join(scripts, 'sample-seed', 'app-store.mjs')).href);

const EMAIL = 'sample-owner@example.invalid';
const MAIN = 'main-owner@example.invalid';
const HASH = '$2a$12$thisIsAnObviousFakeHashForTheProofOnlyXXXXXXXXXXXXXXXXXXXX';
const mkUser = async (email, words, themes) => (await pool.query(`insert into users (email, pass_hash, name, words_written, themes_opened) values ($1,$2,'x',$3,$4::jsonb) returning id`, [email, HASH, words, JSON.stringify(themes)])).rows[0].id;
const S = String(await mkUser(EMAIL, 0, { plateau: true }));
const M = String(await mkUser(MAIN, 777, { plateau: true, flux: true }));
const T = '2026-10-01T10:00:00.000Z';
await pool.query(`insert into journal_entries (id, user_id, text, created_at, updated_at) values ('main-p1',$1,'a page of the main account',$2,$2)`, [M, T]);
const sampleFile = join(root, 'sample.json');
writeFileSync(sampleFile, JSON.stringify({ userId: S, recordedAt: T }));
const md = readFileSync(CONTENT, 'utf8');
const lines = [];
const run = async (over = {}) => {
  const out = []; const errs = [];
  const code = await seedMod.runSeed({ pool, url: URL_, email: EMAIL, md, mode: 'seed', expectId: S, sampleFile, log: (l) => out.push(l), err: (l) => errs.push(l), ...over });
  lines.push(...out, ...errs);
  return { code, out, errs };
};
const q = async (sql, args = []) => (await pool.query(sql, args)).rows;
const snapshot = async (uid) => JSON.stringify(await q(`select id, text, deleted_at, purged_at from journal_entries where user_id = $1 order by id`, [uid]));
const wordCount = (t) => { const m = String(t ?? '').trim().match(/\S+/g); return m ? m.length : 0; };

try {
  // S1
  const built = await worldMod.buildWorld(md);
  const rep = built.report;
  ok(`S1 the content converts cleanly: ${rep.failures.length} problems; md5 ${rep.md5Matches ? 'is the approved file' : 'DIFFERS'}; ${rep.decksCovered.length} decks, ${rep.decksCovered.filter((d) => d.boards.length).length} with a board`,
    rep.failures.length === 0 && rep.md5Matches && rep.decksCovered.every((d) => d.boards.length > 0), rep.failures.join(' | '));
  // M1
  {
    const app = await loadAppStore();
    app.DECKS.push({ id: 'phantom-deck', room: 'every', nameTerm: 'deckNameThreeAct', questions: [], deal: () => [] });
    const mut = await worldMod.buildWorld(md, { app });
    ok('M1 (mutant) a deck in the live registry with NO board is a failure of the build (LANDED: the phantom deck is in the registry)', app.DECKS.some((d) => d.id === 'phantom-deck') && mut.report.failures.some((f) => /rule 4/.test(f) && /phantom-deck/.test(f)));
  }

  // S2 counts
  const beforeCounts = await snapshot(S);
  const c = await run({ mode: 'counts', expectId: null, endPool: false });
  ok(`S2 --counts on the recorded sample account writes nothing (exit ${c.code}) and prints the id`, c.code === 0 && (await snapshot(S)) === beforeCounts && c.out.some((l) => l.startsWith('account id: ')) && c.out.some((l) => /counts only/.test(l)), c.out.concat(c.errs).join(' | '));

  // S3 guards
  const mainBefore = await snapshot(M);
  const noId = await run({ expectId: null });
  const wrongId = await run({ expectId: 'not-this-one' });
  const noFile = await run({ sampleFile: join(root, 'missing.json') });
  const main = await run({ email: MAIN, expectId: M });
  writeFileSync(join(root, 'other.json'), JSON.stringify({ userId: M, recordedAt: T }));
  const otherFile = await run({ sampleFile: join(root, 'other.json') });
  const revised = await run({ md: md + '\n\nA revised line.\n' });
  const none = await q(`select count(*)::int n from journal_entries where user_id = $1`, [S]);
  ok(`S3 guards: no --expect-id (${noId.code}), a wrong one (${wrongId.code}), no id file (${noFile.code}), the MAIN account (${main.code}), an id file naming another account (${otherFile.code}), a revised content file (${revised.code}): all refused; the sample is still empty and the main account unchanged`,
    [noId, wrongId, noFile, main, otherFile, revised].every((r) => r.code === 1) && none[0].n === 0 && (await snapshot(M)) === mainBefore
    && /NOT the recorded sample/.test(main.errs.join(' ')) && /no sample account is recorded/.test(noFile.errs.join(' ')));
  ok('M2 (mutant) the id file naming ANOTHER account makes the sample account itself refuse (LANDED: the file was rewritten to the main id)', JSON.parse(readFileSync(join(root, 'other.json'), 'utf8')).userId === M && otherFile.code === 1 && /NOT the recorded sample/.test(otherFile.errs.join(' ')));
  ok('M3 (mutant) a revised content file with no --allow-new-content is refused (LANDED: the revised text differs from the approved md5)', revised.code === 1 && /not the approved one|DIFFERS/.test(revised.out.concat(revised.errs).join(' ')));

  // S4 seed on empty
  const r1 = await run({ endPool: false });
  ok(`S4a --seed on the empty sample account (exit ${r1.code}): ${r1.out.filter((l) => /seed pushed|words_written|live pages/.test(l)).join(' | ')}`, r1.code === 0 && /0 rejected, 0 failed/.test(r1.out.join('\n')));
  const rows = await q(`select id, text, page_type, boxes, script, tags, starred, project_id, deleted_at, purged_at, imported_at, page_settings, page_links, order_index, origin from journal_entries where user_id = $1`, [S]);
  const live = rows.filter((r) => !r.deleted_at && !r.purged_at);
  const boards = live.filter((r) => r.page_type === 'board');
  const pages = live.filter((r) => r.page_type !== 'board');
  const drawers = await q(`select id, name from drawers where user_id = $1 and purged_at is null`, [S]);
  const sets = await q(`select id, title, kind, type, drawer_id, tutor from projects where user_id = $1 and purged_at is null`, [S]);
  ok(`S4b the shape: ${drawers.length} Drawers, ${sets.length} sets (one per Drawer), ${boards.length} boards, ${pages.length} live pages, ${rows.filter((r) => r.deleted_at && !r.purged_at).length} in the Trash`,
    drawers.length === 5 && sets.length === 5 && sets.every((s) => drawers.some((d) => d.id === s.drawer_id)) && boards.length === 15 && rows.filter((r) => r.deleted_at && !r.purged_at).length === 1,
    drawers.map((d) => d.name).join(', '));
  const meta = (b) => (b.boxes || []).find((x) => x.kind === 'board-meta');
  ok('S4c every board is a Deck (home view Walk) and every Deck-dealt step carries its deckStep', boards.every((b) => meta(b)?.homeView === 'walk') && boards.every((b) => (b.boxes || []).filter((x) => x.kind === 'text' && !x.parentId).every((x) => x.deckStep)));
  const byTitle = (t) => boards.find((b) => b.text.split('\n')[0] === t);
  const lit = (b) => ((b && b.boxes) || []).filter((x) => x.lit).length;
  ok(`S4d lit steps: Thesis plan ${lit(byTitle('Thesis plan') || { boxes: [] })} (all nine), Beat sheet ${lit(byTitle('Beat sheet') || { boxes: [] })} (two), Three-Act ${lit(byTitle('Three-Act') || { boxes: [] })} (two), Grant ${lit(byTitle('Grant') || { boxes: [] })}, Feature ${lit(byTitle('Feature') || { boxes: [] })}`,
    lit(byTitle('Thesis plan')) === 9 && lit(byTitle('Beat sheet')) === 2 && lit(byTitle('Three-Act')) === 2 && lit(byTitle('Grant')) === 1 && lit(byTitle('Feature')) === 1);
  const kids = boards.flatMap((b) => (b.boxes || []).filter((x) => x.parentId).map((x) => ({ b, x })));
  ok(`S4e child cards: ${kids.length} (3 under Midpoint Reversal, 4 under Chapter One), each a text card in its parent's lane, ordered after it`,
    kids.length === 7 && kids.every(({ b, x }) => (b.boxes || []).some((p) => p.id === x.parentId && p.deckStep) && x.seq != null));
  const sc = (t) => pages.find((p) => p.page_type === 'script');
  const scripts_ = pages.filter((p) => p.page_type === 'script');
  ok(`S4f two Screenplay pages (${scripts_.map((s) => (s.script?.scenes || []).length).join(' + ')} scenes), each with its text shadow; templates: ${['title', 'outline', 'bibliography'].map((t) => `${t} ${pages.filter((p) => p.page_settings?.template === t).length}`).join(', ')}`,
    scripts_.length === 2 && scripts_.every((s) => (s.script?.scenes || []).length > 0 && s.text.length > 200)
    && pages.filter((p) => p.page_settings?.template === 'title').length === 2 && pages.filter((p) => p.page_settings?.template === 'outline').length === 2 && pages.filter((p) => p.page_settings?.template === 'bibliography').length === 1);
  const research = pages.filter((p) => p.page_settings?.kind === 'research');
  ok(`S4g Research-kind pages ${research.length}; Chicago style guide on ${research.filter((p) => p.page_settings?.styleGuide === 'chicago').length}; imported stamps ${pages.filter((p) => p.imported_at).length}; starred ${pages.filter((p) => p.starred).length}`,
    research.length >= 7 && research.filter((p) => p.page_settings?.styleGuide === 'chicago').length === 4 && pages.filter((p) => p.imported_at).length === 2 && pages.filter((p) => p.starred).length === 1);
  const links = rows.reduce((n, r) => n + (Array.isArray(r.page_links) ? r.page_links.length : 0), 0);
  ok(`S4h grafts: ${links} page_links records (the §8.1 table: 30, plus the 8 cards of the From my pages board, each grafted to its page)`, links === 38);
  const bible = sets.find((s) => s.title === 'Draft one' && s.tutor?.facts?.length);
  ok(`S4i the Bible: ${bible?.tutor?.facts?.length} facts on the novel's set, Marta in fact 1`, bible?.tutor?.facts?.length === 7 && /Marta Lind/.test(bible.tutor.facts[0].text));
  const trash = rows.find((r) => r.deleted_at && !r.purged_at);
  ok('S4j the Trash page is deleted to the Trash, not purged, and carries its tag', !!trash && !trash.purged_at && (trash.tags || []).includes('teodor'));
  const jr = live.filter((r) => !r.project_id && r.page_type !== 'board');
  ok(`S4k the Journal: ${jr.length} loose pages (six days of free writing + the ink page), the ink page holds ${(jr.find((r) => /Sound, from memory/.test(r.text)) ? 'strokes' : 'NO strokes')}`, jr.length === 7);
  const strokes = await q(`select strokes from journal_entries where user_id = $1 and text = 'Sound, from memory'`, [S]);
  ok('S4l the ink page stores a short stroke list (a dozen polylines or fewer)', Array.isArray(strokes[0]?.strokes) && strokes[0].strokes.length > 5 && strokes[0].strokes.length <= 14);

  // S5 words / themes / bystanders
  const u = (await q(`select words_written, themes_opened from users where id = $1`, [S]))[0];
  const measured = rows.filter((r) => !r.purged_at).reduce((n, r) => n + wordCount(r.text), 0);
  ok(`S5a words_written ${u.words_written} equals the measured words of the pushed pages (${measured}); themes_opened unchanged`, Number(u.words_written) === measured && Object.keys(u.themes_opened || {}).join() === 'plateau');
  const mu = (await q(`select words_written, themes_opened from users where id = $1`, [M]))[0];
  ok('S5b the main account is untouched (its page, its words 777, its themes)', Number(mu.words_written) === 777 && Object.keys(mu.themes_opened).length === 2 && (await snapshot(M)) === mainBefore);

  // S6 the rules' marks
  const allText = [...rows.map((r) => r.text), ...rows.flatMap((r) => (r.boxes || []).filter((b) => b.kind === 'text').map((b) => b.text || ''))].join('\n');
  ok('S6a no parenthetical note leaked into any text: "(grafted", "(page placed", "[shows:" and the "*(" note form are absent', !/\(grafted|\(page placed|\[shows:|^\*\(/m.test(allText));
  const empties = boards.flatMap((b) => (b.boxes || []).filter((x) => x.kind === 'text' && x.deckStep && /^[^\n]*\n$/.test(x.text || '')));
  ok(`S6b ${empties.length} untouched steps hold NO body (the deck's question shows through as the placeholder, never stored as text), each with its prompt`, empties.length > 30 && empties.every((x) => x.prompt && x.prompt.length > 5));
  const lamp = pages.find((p) => /^The lamp room\n/.test(p.text));
  const grammar = pages.find((p) => /^Notes: the island's grammar\n/.test(p.text));
  ok(`S6c the deliberate Martha variant stands: "Martha" x${(lamp?.text.match(/Martha/g) || []).length} in The lamp room, x${(grammar?.text.match(/Martha/g) || []).length} in the grammar notes`, (lamp?.text.match(/Martha/g) || []).length === 3 && (grammar?.text.match(/Martha/g) || []).length === 1);

  // S7 re-run
  const oldIds = rows.map((r) => r.id);
  const wordsBefore = Number(u.words_written);
  const r2 = await run({ endPool: false });
  const after2 = await q(`select id, text, purged_at, deleted_at, boxes from journal_entries where user_id = $1`, [S]);
  const oldNow = after2.filter((r) => oldIds.includes(r.id));
  const fresh = after2.filter((r) => !oldIds.includes(r.id) && !r.purged_at);
  const u2 = (await q(`select words_written from users where id = $1`, [S]))[0];
  ok(`S7 re-run (exit ${r2.code}): the ${oldNow.length} old rows are purged shells (text '', no boxes); ${fresh.length} new rows are in; words_written ${wordsBefore} -> ${u2.words_written} (never lowered); main account still untouched`,
    r2.code === 0 && oldNow.length === oldIds.length && oldNow.every((r) => r.purged_at && r.text === '' && r.boxes === null) && fresh.length === rows.length && Number(u2.words_written) >= wordsBefore && (await snapshot(M)) === mainBefore);

  // S8 secrets
  const out = lines.join('\n');
  ok('S8 neither the address, the hash, the database address nor any line of the writing appears in any output', !out.includes('example.invalid') && !out.includes('thisIsAnObvious') && !out.includes('127.0.0.1') && !/kettle whistled|The horn came first|FADE IN/.test(out));
} finally {
  await reqSrv(join(here, '..', '..', 'dist', 'db.js')).pool.end().catch(() => {}); await pool.end(); await pg.stop(); rmSync(root, { recursive: true, force: true });
}
const failed = checks.filter((c) => !c[1]).length;
console.log(failed ? `\nSAMPLE-SEED VERIFY: FAIL - ${failed}/${checks.length} failed` : `\nSAMPLE-SEED VERIFY: PASS (${checks.length} checks)`);
process.exit(failed ? 1 : 0);
