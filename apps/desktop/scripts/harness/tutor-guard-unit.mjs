// BROWSERLESS CHECK for THE TUTOR COLUMN'S GUARD (Fable, Nov 21, 4:58 pm; reorg-plan-v2 section 5: "the `tutor` column on `projects` has no guard: a device on an older build that re-saves a project could blank its
// Consultant thread ... Same fix: send SQL NULL when absent, and `coalesce`"; proved as INK proved the Doc column's, reorg-docsettings-unit.mjs COL). The DATABASE half (a real throwaway Postgres) is
// apps/server/scripts/harness/tutor-guard-db.mjs; this is the half that runs everywhere: it reads the server's projects upsert.
//   G1  the update on conflict KEEPS the stored thread when the push carries none: `tutor = coalesce(excluded.tutor, projects.tutor)`
//   G2  the 15th parameter is EVALUATED, not read: absent (or undefined, or null) -> a TRUE JS null (SQL NULL); a thread -> its JSON. (JSON.stringify(null) is the string 'null', which ::jsonb makes a JSON null that coalesce keeps)
//   G3  the Doc column's guard is still as it was (doc_settings = coalesce(...), the 16th parameter): one guard does not undo the other
//   MUT each guard's edit goes RED: the plain `tutor = excluded.tutor` (G1), the parameter sent as the string 'null' (G2), the Doc guard dropped (G3)
// RED on the tree without the guard. Run (from apps/desktop): node scripts/harness/tutor-guard-unit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SYNC = path.resolve(here, '..', '..', '..', 'server', 'src', 'sync.ts');
let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${detail}]` : ''}`); if (!cond) fails += 1; };
const read = fs.readFileSync(SYNC, 'utf8').replace(/\r\n/g, '\n');

// the 15th parameter of the projects upsert, EVALUATED: the line that carries JSON.stringify(...tutor...) in the value list
function sendsTutorRight(sync) {
  const m = /p\.lastActivePageId \?\? null, p\.deletedAt \?\? null, p\.createdAt, p\.updatedAt, ([^\n]*?tutor[^\n]*?),\n/.exec(sync);
  if (!m) return { pass: false, detail: 'the parameter line was not found' };
  let send; try { send = new Function('p', 'return ' + m[1]); } catch { return { pass: false, detail: 'the parameter does not evaluate: ' + m[1] }; }
  try {
    const thread = { v: 1, facts: [] };
    const pass = send({}) === null && send({ tutor: undefined }) === null && send({ tutor: null }) === null && send({ tutor: thread }) === JSON.stringify(thread);
    return { pass, detail: JSON.stringify({ absent: send({}), thread: send({ tutor: thread }) }) };
  } catch (e) { return { pass: false, detail: String(e.message) }; }
}
function suite(sync) {
  const g1 = /\n\s*tutor = coalesce\(excluded\.tutor, projects\.tutor\),/.test(sync);
  const g2 = sendsTutorRight(sync);
  const g3 = /doc_settings = coalesce\(excluded\.doc_settings, projects\.doc_settings\),/.test(sync) && /p\.docSettings == null \? null : JSON\.stringify\(p\.docSettings\)/.test(sync);
  return { G1: { pass: g1, detail: String(g1) }, G2: g2, G3: { pass: g3, detail: String(g3) } };
}
const base = suite(read);
ok(base.G1.pass, 'G1 the update on conflict keeps the stored thread when the push carries none (tutor = coalesce(excluded.tutor, projects.tutor))', base.G1.detail);
ok(base.G2.pass, 'G2 the tutor parameter is evaluated: absent / undefined / null send a TRUE null, a thread sends its JSON', base.G2.detail);
ok(base.G3.pass, 'G3 the Doc column\'s guard is as it was (doc_settings coalesce, the 16th parameter)', base.G3.detail);

const MUT = [
  ['the plain "tutor = excluded.tutor"', 'G1', (s) => s.replace('tutor = coalesce(excluded.tutor, projects.tutor),', () => 'tutor = excluded.tutor,')],
  ['the absent case is sent as the string \'null\'', 'G2', (s) => s.replace('p.tutor == null ? null : JSON.stringify(p.tutor)', () => 'JSON.stringify(p.tutor ?? null)')],
  ['the Doc column\'s guard dropped', 'G3', (s) => s.replace('doc_settings = coalesce(excluded.doc_settings, projects.doc_settings),', () => 'doc_settings = excluded.doc_settings,')],
];
for (const [name, key, fn] of MUT) {
  // a mutant is made from the GUARDED source: it must land, and its guard's check must go red
  const guarded = read
    .replace(/\n\s*tutor = excluded\.tutor,/, () => '\n           tutor = coalesce(excluded.tutor, projects.tutor),')
    .replace('JSON.stringify(p.tutor ?? null)', () => 'p.tutor == null ? null : JSON.stringify(p.tutor)');
  const after = fn(guarded);
  const landed = after !== guarded;
  const res = landed ? suite(after) : null;
  ok(landed && !!res && res[key].pass === false, `MUT ${name}: it LANDED and ${key} goes RED`, JSON.stringify({ landed, pass: res && res[key].pass }));
}

console.log(fails ? `\nTUTOR-GUARD-UNIT VERIFY: FAIL - ${fails}/${checks} failed` : `\nTUTOR-GUARD-UNIT VERIFY: PASS (${checks} checks)`);
process.exit(fails ? 1 : 0);
