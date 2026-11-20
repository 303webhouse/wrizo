// REORG THE DOC'S KIND MENU, ITS ACTS, BROWSERLESS (Fable, Nov 20, 4:15 pm; the approved draft claude/wrizors/kind-menu-presets-draft.md). The real parts.ts, docSettings.ts, docKinds.ts and docKindActs.ts are transpiled and run
// together against the in-memory store of reorg-parts-unit.mjs (every write logged in order); each law is given a mutant (a text rewrite of docKindActs.ts) that must LAND and turn its own check red.
//   STYLE   choosing a style guide saves it to the Doc's own record, sets that style's Page Setup on every Part of the Doc (None leaves the Page Setup alone), and gives a Part still wearing a sources word the new style's word; her own names stay
//   SPECIAL one click adds a Special Part in its right place, named by the style guide, as a template where it is one; asked twice it is found, not made twice; AP has no sources Part; a loose page becomes the Doc's one Part first
//   PRESET  in an empty Doc the preset's Parts become the Doc (its one empty Part is the first); in a Doc with words they go after hers and hers are byte-identical and in their places; the style's Page Setup is set on the new Parts only
//   KIND    a screenplay preset is for a Screenplay Doc and a standard one for any other; the other way round writes nothing
//   WORDS   no act writes a Part's text, ink or cards
// Run: node scripts/harness/reorg-kind-acts-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const REORG = new URL('../../src/reorg/', import.meta.url);
const lf = (s) => s.split('\r\n').join('\n');
const readSrc = (name) => lf(fs.readFileSync(new URL(name, REORG), 'utf8'));
const ACTS = 'docKindActs.ts';
const actsText = fs.existsSync(new URL(ACTS, REORG)) ? readSrc(ACTS) : '';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const J = (v) => JSON.stringify(v);
const FALLBACK = { margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };

// ---- the in-memory store (copied from reorg-parts-unit.mjs): every write is logged IN ORDER --------------------------------------------------------
function makeStore() {
  const S = { rows: [], projects: [], seq: 0, clock: 0, log: [], onWrite: null, defaults: null };
  const iso = () => new Date(Date.UTC(2026, 0, 1, 0, 0, S.clock++)).toISOString();
  const live = () => S.rows.filter((r) => !r.deletedAt);
  const note = (op, id, extra = {}) => { S.log.push({ op, id, ...extra }); if (S.onWrite) S.onWrite(op, id); };
  const api = {
    getJournalEntries: () => live().map(clone),
    getJournalEntry: (id) => { const r = live().find((x) => x.id === id); return r ? clone(r) : null; },
    getJournalEntryIncludingDeleted: (id) => { const r = S.rows.find((x) => x.id === id); return r ? clone(r) : null; },
    saveJournalEntry: (e) => { const row = clone(e); row.updatedAt = iso(); const i = S.rows.findIndex((x) => x.id === row.id); if (i >= 0) S.rows[i] = row; else S.rows.push(row); note('save', row.id, { text: row.text }); },
    softDeleteEntry: (id) => { const r = S.rows.find((x) => x.id === id); if (!r) return; r.deletedAt = iso(); note('delete', id); },
    restoreEntry: (id) => { const r = S.rows.find((x) => x.id === id); if (r) { delete r.deletedAt; note('restore', id); } },
    createBinderPage: (docId, pageType) => { const e = { id: `p${(S.seq += 1)}`, text: '', projectId: docId, pageType, source: 'page', origin: 'project', pageSettings: { ...FALLBACK, size: 11 }, createdAt: iso(), updatedAt: iso() }; S.rows.push(e); note('create', e.id); return clone(e); },
    createBinder: (title, kind, drawerId, type = 'creative') => { const p = { id: `d${(S.seq += 1)}`, title: title.trim() || 'Untitled', type, kind, storyPlanId: null, createdAt: iso(), updatedAt: iso(), ...(drawerId ? { drawerId } : {}) }; S.projects.push(p); note('project', p.id); return clone(p); },
    getProject: (id) => { const p = S.projects.find((x) => x.id === id); return p ? clone(p) : null; },
    getSystemKind: () => null, isPairedPlanBoard: () => false, flushNow: () => {},
    // place.ts reorderSections, verbatim in behaviour: write orderIndex only where it changes
    reorderSections: (ids) => { let n = 0; ids.forEach((id, i) => { const e = api.getJournalEntry(id); if (!e || e.orderIndex === i) return; api.saveJournalEntry({ ...e, orderIndex: i }); n += 1; }); return n; },
    firstPlainLine: (t) => { for (const l of String(t).split('\n')) { const s = l.replace(/[*_#>]/g, '').trim(); if (s) return s; } return undefined; },
    getUserPageDefaults: () => S.defaults,
    isAutoSet: (p) => !!p && (p.id.startsWith('top-set-') || p.id.startsWith('auto-set-')),
  };
  return { S, api };
}

const MARKRUNS = (() => { const o = ts.transpileModule(lf(fs.readFileSync(new URL('../../src/store/markRuns.ts', import.meta.url), 'utf8')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText; const m = { exports: {} }; new Function('module', 'exports', o)(m, m.exports); return m.exports; })();

// ---- every module of the layer, transpiled and wired to each other; only the store is stubbed -----------------------------------------------------------
function loadAll(acts) {
  const { S, api } = makeStore();
  api.saveProject = (p) => { const row = clone(p); row.updatedAt = 'u' + (S.clock++); const i = S.projects.findIndex((x) => x.id === row.id); if (i >= 0) S.projects[i] = row; else S.projects.push(row); S.log.push({ op: 'project', id: row.id }); };   // the Doc's own record (docSettings.ts)
  const ext = {
    '../types': { PAGE_SETTINGS_FALLBACK: FALLBACK }, '../store/persistence': api, '../store/persistence/restore': api, '../store/place': api, '../store/entryText': api, '../store/pageDefaults': api,
    '../store/wordCount': { wordCount: (t) => { const s = String(t ?? '').trim(); return s ? s.split(/\s+/).length : 0; } }, '../store/markRuns': MARKRUNS,
    '../store/boxTombstones': { liveBoxes: (b) => (b ?? []).filter((x) => !x.deletedAt && !x.purgedAt) }, './flag': { REORG: false },
    '../store/scriptDoc': { createEmptyScriptDoc: () => ({ elements: [] }) }, '../store/scriptText': { serializeScriptDoc: () => '' },
  };
  const cache = {};
  const mod = (rel) => {
    const file = rel.replace('./', '') + '.ts';
    if (cache[file]) return cache[file].exports;
    const src = file === ACTS ? acts : readSrc(file);
    const out = ts.transpileModule(src, TS_OPTS).outputText;
    const m = { exports: {} }; cache[file] = m;
    new Function('require', 'exports', 'module', 'window', out)((p) => { if (p in ext) return ext[p]; if (p.startsWith('./')) return mod(p); throw new Error('unstubbed import ' + p); }, m.exports, m, undefined);
    return m.exports;
  };
  return { A: mod('./docKindActs'), P: mod('./parts'), D: mod('./docSettings'), S, api };
}

const DOC = 'doc1';
/** a Doc she made: its Parts' texts and names, in order; `kind` the Doc's kind */
function fixture(acts, parts, kind = 'book') {
  const L = loadAll(acts);
  L.S.projects.push({ id: DOC, title: 'The Doc', type: 'creative', kind, storyPlanId: null, createdAt: 'x', updatedAt: 'x', drawerId: 'dr1' });
  const ids = [];
  parts.forEach(([text, name], i) => {
    const e = L.api.createBinderPage(DOC, 'manuscript');
    L.api.saveJournalEntry({ ...L.api.getJournalEntry(e.id), text, orderIndex: i, pageSettings: { ...FALLBACK, size: 11, ...(name ? { name } : {}) } });
    ids.push(e.id);
  });
  L.ids = ids; L.S.log.length = 0;
  return L;
}
const names = (L) => L.P.partsOfDoc(DOC).map((p) => (p.named ? p.name : '(' + p.words + 'w)'));
const texts = (L) => L.P.partsOfDoc(DOC).map((p) => (L.api.getJournalEntry(p.id) || {}).text);
const ps = (L, id) => (L.api.getJournalEntry(id) || {}).pageSettings || {};
const SETUP_KEYS = ['margins', 'lineSpacing', 'size', 'pageNumbers', 'headers', 'footers'];
const setupOf = (L, id) => J(SETUP_KEYS.map((k) => ps(L, id)[k]));
const MLA = J(['normal', 2, 12, { on: true, placement: 'top-right' }, { on: false, text: '' }, { on: false, text: '' }]);

function suite(acts) {
  const R = {};
  if (!acts) return R;
  // STYLE
  {
    const L = fixture(acts, [['Intro words', ''], ['Body words', 'Mine'], ['', 'Works Cited']]);
    const r = L.A.applyStyleGuide(L.ids[0], 'apa');
    const stored = (L.api.getProject(DOC).docSettings || {}).styleGuide;
    const allSet = L.ids.every((id) => setupOf(L, id) === J(['normal', 2, 12, { on: true, placement: 'top-right' }, { on: false, text: '' }, { on: false, text: '' }]));
    const renamed = names(L).join('|');
    const keep = ps(L, L.ids[1]).name === 'Mine' && ps(L, L.ids[2]).name === 'References';
    const wordsSame = J(texts(L)) === J(['Intro words', 'Body words', '']);
    const apOne = L.A.applyStyleGuide(L.ids[0], 'ap');
    const apSetup = setupOf(L, L.ids[0]) === J(['normal', 1, 12, { on: false, placement: 'bottom-center' }, { on: false, text: '' }, { on: false, text: '' }]);
    const apName = ps(L, L.ids[2]).name === 'References';   // AP has no word: the name stays
    L.A.applyStyleGuide(L.ids[0], 'chicago');
    const none = L.A.applyStyleGuide(L.ids[0], 'none');
    const cleared = !('docSettings' in L.api.getProject(DOC));
    const untouched = setupOf(L, L.ids[0]) === setupOf(L, L.ids[1]) && ps(L, L.ids[2]).name === 'Sources';
    L.S.log.length = 0;
    const again = L.A.applyStyleGuide(L.ids[0], 'none');
    R.STYLE = { pass: r.ok && stored === 'apa' && allSet && keep && wordsSame && r.setUp === 3 && r.renamed === 1 && apOne.ok && apSetup && apName && none.ok && cleared && untouched && again.ok && L.S.log.length === 0 && r.ok, detail: J({ r, stored, allSet, renamed, keep, wordsSame, apSetup, apName, cleared, untouched, again: L.S.log.length }) };
  }
  // SPECIAL
  {
    const L = fixture(acts, [['One', ''], ['Two', ''], ['Three', '']]);
    L.A.applyStyleGuide(L.ids[0], 'mla');
    const t = L.A.addSpecialPart(L.ids[1], 'title');
    const s = L.A.addSpecialPart(L.ids[1], 'sources');
    const a = L.A.addSpecialPart(L.ids[1], 'appendix');
    const ab = L.A.addSpecialPart(L.ids[1], 'abstract');
    const order = names(L).join('|');
    const tp = ps(L, t.id), sp = ps(L, s.id);
    const before = L.S.projects.length + ':' + L.api.getJournalEntries().length;
    const twice = L.A.addSpecialPart(L.ids[1], 'title');
    const wordsSame = J(L.ids.map((id) => L.api.getJournalEntry(id).text)) === J(['One', 'Two', 'Three']);
    const apa = fixture(acts, [['One', '']]);
    apa.A.applyStyleGuide(apa.ids[0], 'ap'); apa.S.log.length = 0;
    const none = apa.A.addSpecialPart(apa.ids[0], 'sources');
    const wrote = apa.S.log.length;
    // a loose page: the app's own set, one Part: it becomes the Doc's first, and the new Part is its second
    const LP = loadAll(acts);
    LP.S.projects.push({ id: 'top-set-1', title: 'Top', type: 'creative', storyPlanId: null, createdAt: 'x', updatedAt: 'x' });
    LP.S.rows.push({ id: 'loose', text: 'alone', projectId: 'top-set-1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x', origin: 'journal' });
    const lr = LP.A.addSpecialPart('loose', 'title');
    const lp = lr.ok ? LP.P.partsOfDoc(LP.api.getJournalEntry('loose').projectId) : [];
    R.SPECIAL = {
      pass: t.ok && t.made && s.ok && a.ok && ab.ok && order === 'Title Page|Abstract|(1w)|(1w)|(1w)|Works Cited|Appendix' && tp.template === 'title' && sp.template === 'bibliography' && twice.ok && twice.made === false && twice.id === t.id
        && before === L.S.projects.length + ':' + L.api.getJournalEntries().length && wordsSame && none.ok === false && none.reason === 'no-sources' && wrote === 0
        && lr.ok && lp.length === 2 && lp[0].id === lr.id && lp[1].id === 'loose' && LP.api.getJournalEntry('loose').text === 'alone',
      detail: J({ order, tp: tp.template, sp: sp.template, twice, wordsSame, none, wrote, lr, lp: lp.map((p) => p.id) }),
    };
  }
  // PRESET + KIND + WORDS
  {
    const E = fixture(acts, [['', '']]);
    const r1 = E.A.applyPreset(E.ids[0], 'personal-essay');
    const empty = names(E).join('|') === 'Opening|Turn|Reflection' && r1.ok && r1.reused === E.ids[0] && r1.made.length === 2 && E.P.partsOfDoc(DOC)[0].id === E.ids[0];
    const L = fixture(acts, [['Her chapter one words', 'Chapter One'], ['Her second page', ''], ['', '']]);
    L.A.applyStyleGuide(L.ids[0], 'mla');
    L.api.saveJournalEntry({ ...L.api.getJournalEntry(L.ids[1]), pageSettings: { ...ps(L, L.ids[1]), margins: 'wide', lineSpacing: 1.2 } });   // her own page dress: a preset never sets the style over it
    const hersBefore = L.ids.map((id) => J(L.api.getJournalEntry(id)));
    L.S.log.length = 0;
    const r2 = L.A.applyPreset(L.ids[0], 'argumentative-essay');
    const after = L.P.partsOfDoc(DOC);
    const want = ['Chapter One', '(3w)', '(0w)', 'Introduction', 'Background', 'Claim and Evidence 1', 'Claim and Evidence 2', 'Claim and Evidence 3', 'Counterargument', 'Rebuttal', 'Conclusion', 'Works Cited'];
    const hersSame = L.ids.every((id, i) => J(L.api.getJournalEntry(id)) === hersBefore[i]) && J(after.slice(0, 3).map((p) => p.id)) === J(L.ids);
    const newSetUp = r2.ok && r2.made.every((id) => setupOf(L, id) === MLA) && r2.reused === null && r2.made.length === 9;
    const shown = J(names(L)) === J(want);
    const tplOk = ps(L, r2.made[r2.made.length - 1]).template === 'bibliography';
    // the Academic Research preset's Title Page is the template; a Screenplay preset on a standard Doc, and a standard one on a Screenplay Doc, are refused and write nothing
    const AC = fixture(acts, [['', '']]);
    AC.A.applyStyleGuide(AC.ids[0], 'apa');
    const ar = AC.A.applyPreset(AC.ids[0], 'academic-research');
    const tp = ar.ok ? ps(AC, AC.P.partsOfDoc(DOC)[0].id).template : null;
    const K1 = fixture(acts, [['words', '']]); K1.S.log.length = 0;
    const k1 = K1.A.applyPreset(K1.ids[0], 'tv-half-hour'); const w1 = K1.S.log.length;
    const K2 = fixture(acts, [['', '']], 'screenplay'); K2.S.log.length = 0;
    const k2 = K2.A.applyPreset(K2.ids[0], 'personal-essay'); const w2 = K2.S.log.length;
    const k3 = K2.A.applyPreset(K2.ids[0], 'tv-half-hour');
    const scr = K2.P.partsOfDoc(DOC).map((p) => p.name).join('|');
    const scrKinds = K2.P.partsOfDoc(DOC).slice(1).every((p) => p.kind === 'script') && K2.P.partsOfDoc(DOC).slice(1).every((p) => !!K2.api.getJournalEntry(p.id).script);   // a Screenplay Doc's new Parts are screenplay pages
    const k4 = K1.A.applyPreset(K1.ids[0], 'no-such-preset');
    R.PRESET = { pass: empty && hersSame && newSetUp && shown && tplOk && ar.ok && tp === 'title', detail: J({ empty, hersSame, newSetUp, shown, names: names(L), tplOk, ar: ar.ok, tp }) };
    R.KIND = { pass: k1.ok === false && k1.reason === 'wrong-kind' && w1 === 0 && k2.ok === false && k2.reason === 'wrong-kind' && w2 === 0 && k3.ok && scr === 'Cold Open|Act One|Act Two|Tag' && scrKinds && k4.ok === false && k4.reason === 'unknown-preset', detail: J({ k1, w1, k2, w2, k3: k3.ok, scr, k4 }) };
    // WORDS: no act wrote a Part's text, ink or cards
    const everyWrite = L.S.log.filter((l) => l.op === 'save').length > 0;
    R.WORDS = { pass: everyWrite && J(L.ids.map((id) => L.api.getJournalEntry(id).text)) === J(['Her chapter one words', 'Her second page', '']) && L.api.getJournalEntries().filter((e) => !L.ids.includes(e.id)).every((e) => (e.text || '') === '' && !(e.strokes && e.strokes.length) && !(e.boxes && e.boxes.length)), detail: J({ everyWrite }) };
  }
  return R;
}

const exists = !!actsText;
ok('the real docKindActs.ts exists', exists, 'src/reorg/docKindActs.ts is missing');
const base = exists ? suite(actsText) : {};
for (const k of ['STYLE', 'SPECIAL', 'PRESET', 'KIND', 'WORDS']) ok(`${k} on the real docKindActs.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

const MUT = [
  ['the style guide is not saved to the Doc', 'STYLE', (t) => t.replace("setDocSetting(entryId, { styleGuide: style === 'none' ? null : style });", () => '')],
  ['the Page Setup is set on the first Part only', 'STYLE', (t) => t.replace('for (const id of ids) if (patchSetup(id, setup)) setUp += 1;', () => 'for (const id of ids.slice(0, 1)) if (patchSetup(id, setup)) setUp += 1;')],
  ['a name of her own is renamed with the style', 'STYLE', (t) => t.replace('const next = followStyle(p.name, style);', () => "const next = p.named ? 'References' : p.name;")],
  ['setting the Page Setup writes her words', 'STYLE', (t) => t.replace('saveJournalEntry({ ...e, pageSettings: base as unknown as PageSettings });', () => "saveJournalEntry({ ...e, text: (e.text ?? '') + '!', pageSettings: base as unknown as PageSettings });")],
  ['a Special Part goes to the end, not to its place', 'SPECIAL', (t) => t.replace('afterId: plan.afterId, name, template', () => 'afterId: undefined, name, template')],
  ['a Special Part is made twice', 'SPECIAL', (t) => t.replace('if (plan.existing) return { ok: true, id: plan.existing, made: false };', () => '')],
  ['AP gets a sources Part', 'SPECIAL', (t) => t.replace("if (name === null) return { ok: false, reason: 'no-sources' };", () => '')],
  ['the Title Page is a plain Part, not the template', 'SPECIAL', (t) => t.replace('template: specialTemplate(kind), level: 0 });\n  if (!id)', () => 'template: null, level: 0 });\n  if (!id)')],
  ['a preset goes in front of hers', 'PRESET', (t) => t.replace('let prev = plan.after;', () => 'let prev: string | null = null;')],
  ['a preset sets the Page Setup on hers too', 'PRESET', (t) => t.replace('made.push(id);', () => 'made.push(id); if (setup) for (const p of partsOfDoc(doc.docId)) patchSetup(p.id, setup);')],
  ['a Screenplay Doc\'s preset Parts are text pages', 'KIND', (t) => t.replace('level: 0, seed: seed() }', () => 'level: 0 }')],
  ['a screenplay preset is taken on a standard Doc', 'KIND', (t) => t.replace("if ((preset.kind === 'screenplay') !== isScreenplay) return { ok: false, reason: 'wrong-kind' };", () => '')],
];
for (const [name, key, fn] of MUT) {
  const after = exists ? fn(actsText) : actsText;
  const landed = exists && after !== actsText;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-KIND-ACTS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-KIND-ACTS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
