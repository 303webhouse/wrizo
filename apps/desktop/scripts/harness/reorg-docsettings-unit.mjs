// REORG DOC-WIDE SETTINGS, BROWSERLESS (Fable, Nov 20, 4:15 pm: "NICK RULED A: build the Doc-wide settings column (nullable jsonb on projects, your TU5 recipe: migrate.ts, the projects upsert
// in sync.ts, types/records.ts, reorg/docSettings.ts), red first, behind the switch. It holds a Doc's own settings, starting with its style guide, plus your waiting export setting").
// No browser, no box: the real docSettings.ts is transpiled and run against an in-memory store that LOGS EVERY WRITE; the three files that carry the column (types, migrate, sync) are read as source;
// each law is given a mutant (a text rewrite) that must LAND and turn its own check red.
//   SET   a setting is written to the Doc's own record (the projects row's docSettings) and to nothing else: no entry row, no other project key but updatedAt; a clear removes the key, and the last key
//         leaves docSettings as {} (an empty record, never null: a null is a device that never chose, and the server keeps what it has for it); the same value again writes nothing; a key this client does not know (a newer client's) survives a write
//         (the first reading, SUPERSEDED Nov 20: "removes docSettings altogether (absent, never null, never {})")
//   READ  the style guide a Part is under is its Doc's own; with none on the Doc, the page's own pageSettings.styleGuide (what a page held before the column); with neither, none
//   LOOSE a loose page (the app's own set, one Part) is its own Doc: its style guide is its own pageSettings.styleGuide, and the app's shared set is never written
//   VAL   only mla, apa, chicago and ap are stored; "none" is stored as the key's absence; anything else is refused and writes nothing; an export format outside md, txt, html is refused
//   COL   the column reaches the server and back: types/records.ts (Project.docSettings), migrate.ts (alter table projects add column if not exists doc_settings jsonb), the projects upsert (insert
//         column, parameter, the update on conflict) and rowToProject (null -> absent)
// Run: node scripts/harness/reorg-docsettings-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = new URL('../../src/reorg/docSettings.ts', import.meta.url);
const lf = (s) => s.split('\r\n').join('\n');
const read = (u) => (fs.existsSync(u) ? lf(fs.readFileSync(u, 'utf8')) : '');
const exists = fs.existsSync(SRC);
const srcText = read(SRC);
const RECORDS = new URL('../../src/types/records.ts', import.meta.url);
const MIGRATE = new URL('../../../server/src/migrate.ts', import.meta.url);
const SYNC = new URL('../../../server/src/sync.ts', import.meta.url);

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const FALLBACK = { margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };

function makeStore() {
  const S = { projects: [], rows: [], log: [], clock: 0, defaults: null };
  const iso = () => new Date(Date.UTC(2026, 0, 1, 0, 0, S.clock++)).toISOString();
  const api = {
    getJournalEntry: (id) => { const r = S.rows.find((x) => x.id === id); return r ? clone(r) : null; },
    getProject: (id) => { const p = S.projects.find((x) => x.id === id); return p ? clone(p) : null; },
    isAutoSet: (p) => !!p && (p.id.startsWith('top-set-') || p.id.startsWith('auto-set-')),
    saveProject: (p) => { const row = clone(p); row.updatedAt = iso(); const i = S.projects.findIndex((x) => x.id === row.id); if (i >= 0) S.projects[i] = row; else S.projects.push(row); S.log.push({ op: 'project', id: row.id }); },
    saveJournalEntry: (e) => { const row = clone(e); row.updatedAt = iso(); const i = S.rows.findIndex((x) => x.id === row.id); if (i >= 0) S.rows[i] = row; else S.rows.push(row); S.log.push({ op: 'entry', id: row.id }); },
    getUserPageDefaults: () => S.defaults,
  };
  return { S, api };
}

function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const { S, api } = makeStore();
  const mods = { '../types': { PAGE_SETTINGS_FALLBACK: FALLBACK }, '../store/persistence': api, '../store/pageDefaults': api, './flag': { REORG: false } };
  const module = { exports: {} };
  new Function('require', 'exports', 'module', 'window', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, module.exports, module, undefined);
  return { D: module.exports, S, api };
}

function fixture(src) {
  const L = load(src);
  L.S.projects.push({ id: 'doc1', title: 'The Doc', type: 'creative', kind: 'book', storyPlanId: null, createdAt: 'x', updatedAt: 'x' });
  L.S.projects.push({ id: 'top-set-1', title: 'Top', type: 'creative', storyPlanId: null, createdAt: 'x', updatedAt: 'x' });
  L.S.rows.push({ id: 'p1', text: 'one', projectId: 'doc1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x', pageSettings: { ...FALLBACK, styleGuide: 'chicago' } });
  L.S.rows.push({ id: 'p2', text: 'two', projectId: 'doc1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x' });
  L.S.rows.push({ id: 'loose', text: 'alone', projectId: 'top-set-1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x' });
  L.S.log.length = 0;
  return L;
}
const proj = (L, id = 'doc1') => L.api.getProject(id);

function suite(src) {
  const R = {};
  if (!src) return R;
  // SET
  {
    const L = fixture(src);
    const w1 = L.D.setDocSetting('p2', { styleGuide: 'apa' });
    const p1 = proj(L);
    const onlyProject = L.S.log.length === 1 && L.S.log[0].op === 'project' && L.S.log[0].id === 'doc1';
    const keysKept = p1.title === 'The Doc' && p1.kind === 'book' && JSON.stringify(p1.docSettings) === '{"styleGuide":"apa"}';
    L.S.log.length = 0;
    const same = L.D.setDocSetting('p2', { styleGuide: 'apa' });
    const noWrite = same === false && L.S.log.length === 0;
    // a newer client's key survives
    const q = proj(L); q.docSettings = { ...q.docSettings, fromANewerClient: { keep: 'me' } }; L.S.projects[0] = q;
    L.D.setDocSetting('p1', { export: { format: 'html' } });
    const p2 = proj(L);
    const ds2 = p2.docSettings || {}; const survives = !!ds2.fromANewerClient && ds2.fromANewerClient.keep === 'me' && ds2.styleGuide === 'apa' && !!ds2.export && ds2.export.format === 'html';
    // a clear removes the key; the last key removes the object (never null, never {})
    L.D.setDocSetting('p1', { styleGuide: null });
    const c1 = proj(L).docSettings;
    L.D.setDocSetting('p1', { export: null });
    const c2 = proj(L);
    const q2 = proj(L); q2.docSettings = { styleGuide: 'mla' }; L.S.projects[0] = q2;
    L.D.setDocSetting('p1', { styleGuide: null });
    const c3 = proj(L);
    // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:50 pm: an older device that re-sends a project without docSettings must not wipe the stored ones, so the server keeps what it has when a push carries none; CLEARING therefore writes {}, never null and never absence). The original, verbatim:
    // const cleared = !('styleGuide' in (c1 || {})) && (c1 || {}).fromANewerClient && c3 && !('docSettings' in c3) && !JSON.stringify(c1).includes('null') && !JSON.stringify(c2.docSettings || {}).includes('null') && !('export' in (c2.docSettings || {}));
    // SUCCESSOR: the last key removed leaves docSettings = {} on the Doc's record (never absent, never null); the other readings stand
    const cleared = !('styleGuide' in (c1 || {})) && (c1 || {}).fromANewerClient && c3 && JSON.stringify(c3.docSettings) === '{}' && !JSON.stringify(c1).includes('null') && !JSON.stringify(c2.docSettings || {}).includes('null') && !('export' in (c2.docSettings || {}));
    R.SET = { pass: w1 === true && onlyProject && keysKept && noWrite && survives && cleared, detail: JSON.stringify({ w1, onlyProject, keysKept, noWrite, survives, cleared, c1, c3: c3 && Object.keys(c3) }) };
  }
  // READ
  {
    const L = fixture(src);
    const own = L.D.styleGuideOf('p1');            // the Part's own page says chicago, the Doc has none
    L.D.setDocSetting('p1', { styleGuide: 'mla' });
    const doc1 = L.D.styleGuideOf('p1'), doc2 = L.D.styleGuideOf('p2');   // the Doc's own wins, for every Part
    L.D.setDocSetting('p1', { styleGuide: null });
    const back = L.D.styleGuideOf('p1'), none = L.D.styleGuideOf('p2');
    R.READ = { pass: own === 'chicago' && doc1 === 'mla' && doc2 === 'mla' && back === 'chicago' && none === null, detail: JSON.stringify({ own, doc1, doc2, back, none }) };
  }
  // LOOSE
  {
    const L = fixture(src);
    const w = L.D.setDocSetting('loose', { styleGuide: 'ap' });
    const e = L.api.getJournalEntry('loose');
    const sharedUntouched = !L.S.log.some((l) => l.op === 'project') && !('docSettings' in (proj(L, 'top-set-1') || {}));
    const exportRefused = L.D.setDocSetting('loose', { export: { format: 'md' } }) === false;
    R.LOOSE = { pass: w === true && (e.pageSettings || {}).styleGuide === 'ap' && L.D.styleGuideOf('loose') === 'ap' && sharedUntouched && exportRefused && !('docSettings' in e), detail: JSON.stringify({ w, sg: (e.pageSettings || {}).styleGuide, sharedUntouched, exportRefused }) };
  }
  // VAL
  {
    const L = fixture(src);
    const bad = [L.D.setDocSetting('p1', { styleGuide: 'turabian' }), L.D.setDocSetting('p1', { export: { format: 'docx' } }), L.D.setDocSetting('p1', { styleGuide: '' })];
    const wrote = L.S.log.length;
    L.D.setDocSetting('p1', { styleGuide: 'ap' });
    L.D.setDocSetting('p1', { styleGuide: 'none' });
    const afterNone = proj(L);
    // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:50 pm: clearing leaves {} on the record, never absence). The original, verbatim:
    // R.VAL = { pass: bad.every((b) => b === false) && wrote === 0 && !('docSettings' in afterNone), detail: JSON.stringify({ bad, wrote, afterNone: Object.keys(afterNone) }) };
    R.VAL = { pass: bad.every((b) => b === false) && wrote === 0 && JSON.stringify(afterNone.docSettings) === '{}', detail: JSON.stringify({ bad, wrote, afterNone: Object.keys(afterNone) }) };
  }
  return R;
}

// ---- COL (source) -----------------------------------------------------------------------------------------------------------------------------------
// the 16th parameter of the projects upsert, EVALUATED for three projects: one that never chose (docSettings absent), one that cleared ({}), one that chose
function sendsRight(sync) {
  const m = /16th param[^\n]*\n\s*([^\n]*?)\],/.exec(sync);
  if (!m) return false;
  let send; try { send = new Function('p', 'return ' + m[1]); } catch { return false; }
  try { return send({}) === null && send({ docSettings: undefined }) === null && send({ docSettings: {} }) === '{}' && send({ docSettings: { styleGuide: 'apa' } }) === '{"styleGuide":"apa"}'; } catch { return false; }
}

function colSuite(files) {
  const { records, migrate, sync } = files;
  const types = /docSettings\?: DocSettings/.test(records) && /export type DocSettings = /.test(records);
  const mig = /alter table projects add column if not exists doc_settings jsonb/.test(migrate);
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:50 pm: an older device that re-sends a project without docSettings must not wipe the stored ones, so the server keeps what it has when a push carries none; CLEARING therefore writes {}, never null and never absence). The original, verbatim:
  // const ins = /insert into projects\s*\n?\s*\([^)]*\btutor, doc_settings\)/.test(sync) && /\$16::jsonb/.test(sync) && /doc_settings = excluded\.doc_settings/.test(sync) && /JSON\.stringify\(p\.docSettings \?\? null\)/.test(sync);
  // SUCCESSOR: the update on conflict KEEPS the stored settings when the push carries none (coalesce)
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 5:05 pm: proved on a real Postgres 16, JSON.stringify(null) is the string 'null', which ::jsonb makes a JSON null and not SQL NULL, so coalesce keeps it and the stored settings are wiped; the absent case must send a true JS null). The original, verbatim:
  // const ins = /insert into projects\s*\n?\s*\([^)]*\btutor, doc_settings\)/.test(sync) && /\$16::jsonb/.test(sync) && /doc_settings = coalesce\(excluded\.doc_settings, projects\.doc_settings\)/.test(sync) && /JSON\.stringify\(p\.docSettings \?\? null\)/.test(sync);
  // SUCCESSOR: the 16th parameter is evaluated, not read: absent -> JS null (so SQL NULL), {} -> '{}', a set value -> its JSON
  const ins = /insert into projects\s*\n?\s*\([^)]*\btutor, doc_settings\)/.test(sync) && /\$16::jsonb/.test(sync) && /doc_settings = coalesce\(excluded\.doc_settings, projects\.doc_settings\)/.test(sync) && sendsRight(sync);
  const row = /docSettings: r\.doc_settings \?\? undefined/.test(sync);
  return { pass: types && mig && ins && row, detail: JSON.stringify({ types, mig, ins, row }) };
}
const colFiles = { records: read(RECORDS), migrate: read(MIGRATE), sync: read(SYNC) };

// ---- baseline -------------------------------------------------------------------------------------------------------------------------------------------
ok('the real docSettings.ts exists', exists, 'src/reorg/docSettings.ts is missing');
const base = exists ? suite(srcText) : {};
for (const k of ['SET', 'READ', 'LOOSE', 'VAL']) ok(`${k} on the real docSettings.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');
const colBase = colSuite(colFiles);
ok('COL the column reaches the server and back (types, migrate, the projects upsert, rowToProject)', colBase.pass, colBase.detail);

// ---- mutants ---------------------------------------------------------------------------------------------------------------------------------------------
const MUT = [
  ['a write to the Doc also rewrites a Part\'s row', 'SET', (t) => t.replace('saveProject(row);\n  return true;', () => 'saveProject(row); { const p1 = getJournalEntry(entryId); if (p1) saveJournalEntry({ ...p1 }); }\n  return true;')],
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:50 pm: clearing leaves {} on the record, never absence). The original, verbatim:
  // ['a clear leaves an empty docSettings behind', 'SET', (t) => t.replace('if (Object.keys(next).length === 0) delete row.docSettings; else row.docSettings', () => 'row.docSettings')],
  ['the last key removed deletes docSettings, so a device that never chose and a Doc that cleared look the same to the server', 'SET', (t) => t.replace('row.docSettings = next as DocSettings;', () => 'if (Object.keys(next).length === 0) delete row.docSettings; else row.docSettings = next as DocSettings;')],
  ['the same value is written again', 'SET', (t) => t.replace('if (JSON.stringify(next) === JSON.stringify(cur)) return false;', () => '')],
  ['a write drops a key it does not know', 'SET', (t) => t.replace('const next: Record<string, unknown> = { ...cur };', () => 'const next: Record<string, unknown> = {};')],
  ['the Doc\'s own style guide is not read', 'READ', (t) => t.replace('if (set && isStyleGuide(set.docSettings?.styleGuide)) return set.docSettings.styleGuide;', () => '')],
  ['the page\'s own style guide is not read', 'READ', (t) => t.replace('return isStyleGuide(e.pageSettings?.styleGuide) ? e.pageSettings.styleGuide : null;', () => 'return null;')],
  ['a loose page writes the app\'s shared set', 'LOOSE', (t) => t.replace('return set && !isAutoSet(set) ? set : null;', () => 'return set ?? null;')],
  ['any style guide word is stored', 'VAL', (t) => t.replace("if ('styleGuide' in patch && !isClear(patch.styleGuide) && !isStyleGuide(patch.styleGuide)) return false;", () => '')],
  ['"none" is stored as a word instead of the key\'s absence', 'VAL', (t) => t.replace("v === null || v === 'none'", () => 'v === null')],
  ['any export format is stored', 'VAL', (t) => t.replace("&& !isExportFormat(patch.export.format)) return false;", () => ') {}')],
];
for (const [name, key, fn] of MUT) {
  const after = exists ? fn(srcText) : srcText;
  const landed = exists && after !== srcText;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, JSON.stringify({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

const COLMUT = [
  ['the type is not on Project', 'records', (s) => s.replace('docSettings?: DocSettings;', () => '')],
  ['the migration does not add the column', 'migrate', (s) => s.replace('add column if not exists doc_settings jsonb', () => 'add column if not exists doc_settings_x jsonb')],
  ['the upsert does not carry the column in its insert', 'sync', (s) => s.replace('updated_at, tutor, doc_settings)', () => 'updated_at, tutor)')],
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 4:50 pm: an older device that re-sends a project without docSettings must not wipe the stored ones, so the server keeps what it has when a push carries none; CLEARING therefore writes {}, never null and never absence). The original, verbatim:
  // ['the upsert does not update the column on conflict', 'sync', (s) => s.replace('doc_settings = excluded.doc_settings,', () => '')],
  ['the upsert does not update the column on conflict', 'sync', (s) => s.replace('doc_settings = coalesce(excluded.doc_settings, projects.doc_settings),', () => '')],
  ['an older device\'s project without the field wipes the stored settings', 'sync', (s) => s.replace('doc_settings = coalesce(excluded.doc_settings, projects.doc_settings),', () => 'doc_settings = excluded.doc_settings,')],
  ['the pull does not map the column back', 'sync', (s) => s.replace('docSettings: r.doc_settings ?? undefined', () => 'docSettings: undefined')],
  // ORIGINAL, SUPERSEDED Nov 20 (Fable, 5:05 pm: proved on a real Postgres 16, JSON.stringify(null) is the string 'null', which ::jsonb makes a JSON null and not SQL NULL, so coalesce keeps it and the stored settings are wiped; the absent case must send a true JS null). The original, verbatim:
  // ['a project that never chose sends a literal object, not SQL null', 'sync', (s) => s.replace('JSON.stringify(p.docSettings ?? null)', () => 'JSON.stringify(p.docSettings ?? {})')],
  ['the absent case sends JSON.stringify(null): the string \'null\' that ::jsonb turns into a JSON null (the stored settings are wiped)', 'sync', (s) => s.replace('p.docSettings == null ? null : JSON.stringify(p.docSettings)', () => 'JSON.stringify(p.docSettings ?? null)')],
  ['a project that never chose sends an empty object, not SQL null', 'sync', (s) => s.replace('p.docSettings == null ? null : JSON.stringify(p.docSettings)', () => "p.docSettings == null ? '{}' : JSON.stringify(p.docSettings)")],
];
for (const [name, which, fn] of COLMUT) {
  const files = { ...colFiles };
  files[which] = fn(colFiles[which]);
  const landed = files[which] !== colFiles[which];
  const res = colSuite(files);
  ok(`MUT ${name}: it LANDED and COL goes RED`, landed && res.pass === false, JSON.stringify({ landed, pass: res.pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-DOCSETTINGS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-DOCSETTINGS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
