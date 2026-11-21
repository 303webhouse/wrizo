// "INCLUDE THE PLAN" IS REMEMBERED PER DOC, BROWSERLESS (Fable, Nov 21, 12:10 am: "the tick is REMEMBERED per Doc in your export setting (docSettings export.includePlan, beside format), not reset each opening").
// The real reorg/docSettings.ts is transpiled and run over a stub store (the reorg-docsettings-unit.mjs recipe); each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   SET    export.includePlan true is stored on the Doc's own record beside the format, nothing else changes, and the same value again writes nothing
//   KEEP   the format and includePlan live side by side: setting one never drops the other
//   CLEAR  includePlan null takes the key off (never a null, never false); with the format still there export holds the format alone; with nothing else the export key goes and docSettings is {} (the last key removed leaves {})
//   VAL    only a true boolean is stored: a string, a number or false is refused and writes nothing
//   LOOSE  a loose page has no export setting to keep: refused, and nothing is written
//   READ   includePlanOf(page) is true only for a stored true on the Doc this page is a Part of: absent, malformed, a loose page and a missing page read false
// Run: node scripts/harness/reorg-plan-remember-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const SRC = lf(fs.readFileSync(new URL('../../src/reorg/docSettings.ts', import.meta.url), 'utf8'));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const FALLBACK = { margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };

function load(src) {
  const S = { projects: [], rows: [], saves: 0 };
  const api = {
    getJournalEntry: (id) => { const r = S.rows.find((x) => x.id === id); return r ? clone(r) : null; },
    getProject: (id) => { const p = S.projects.find((x) => x.id === id); return p ? clone(p) : null; },
    isAutoSet: (p) => !!p && (p.id.startsWith('top-set-') || p.id.startsWith('auto-set-')),
    saveProject: (p) => { const row = clone(p); const i = S.projects.findIndex((x) => x.id === row.id); if (i >= 0) S.projects[i] = row; else S.projects.push(row); S.saves += 1; },
    saveJournalEntry: (e) => { const row = clone(e); const i = S.rows.findIndex((x) => x.id === row.id); if (i >= 0) S.rows[i] = row; else S.rows.push(row); S.saves += 1; },
    getUserPageDefaults: () => null,
  };
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mods = { '../types': { PAGE_SETTINGS_FALLBACK: FALLBACK }, '../store/persistence': api, '../store/pageDefaults': api, './flag': { REORG: false } };
  const module = { exports: {} };
  new Function('require', 'exports', 'module', 'window', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, module.exports, module, undefined);
  S.projects.push({ id: 'doc1', title: 'The Doc', type: 'creative', storyPlanId: null, createdAt: 'x', updatedAt: 'x' });
  S.projects.push({ id: 'top-set-1', title: 'Top', type: 'creative', storyPlanId: null, createdAt: 'x', updatedAt: 'x' });
  S.rows.push({ id: 'p1', text: 'one', projectId: 'doc1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x' });
  S.rows.push({ id: 'loose', text: 'alone', projectId: 'top-set-1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x' });
  return { D: module.exports, S };
}
const ds = (L) => L.S.projects.find((p) => p.id === 'doc1').docSettings;

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SET', () => {
    const L = load(src);
    const a = L.D.setDocSetting('p1', { export: { includePlan: true } }), saves = L.S.saves, again = L.D.setDocSetting('p1', { export: { includePlan: true } });
    return { pass: a === true && J(ds(L)) === J({ export: { includePlan: true } }) && again === false && L.S.saves === saves, detail: J({ a, again, ds: ds(L) }) };
  });
  t('KEEP', () => {
    const L = load(src);
    L.D.setDocSetting('p1', { export: { format: 'html' } });
    L.D.setDocSetting('p1', { export: { includePlan: true } });
    const both = J(ds(L));
    L.D.setDocSetting('p1', { export: { format: 'md' } });
    const after = J(ds(L));
    return { pass: both === J({ export: { format: 'html', includePlan: true } }) && after === J({ export: { format: 'md', includePlan: true } }), detail: J({ both, after }) };
  });
  t('CLEAR', () => {
    const L = load(src);
    L.D.setDocSetting('p1', { export: { format: 'html', includePlan: true } });
    const c1 = L.D.setDocSetting('p1', { export: { includePlan: null } });
    const withFormat = J(ds(L));
    const L2 = load(src);
    L2.D.setDocSetting('p1', { export: { includePlan: true } });
    const c2 = L2.D.setDocSetting('p1', { export: { includePlan: null } });
    const alone = J(ds(L2));
    const none = load(src).D.setDocSetting('p1', { export: { includePlan: null } });
    return { pass: c1 === true && withFormat === J({ export: { format: 'html' } }) && c2 === true && alone === '{}' && !alone.includes('null') && !withFormat.includes('null') && none === false, detail: J({ c1, withFormat, c2, alone, none }) };
  });
  t('VAL', () => {
    const L = load(src);
    const bad = ['yes', 1, 0, 'true', false].map((v) => L.D.setDocSetting('p1', { export: { includePlan: v } }));
    return { pass: bad.every((b) => b === false) && L.S.saves === 0 && ds(L) === undefined, detail: J({ bad, saves: L.S.saves, ds: ds(L) }) };
  });
  t('LOOSE', () => {
    const L = load(src);
    const r = L.D.setDocSetting('loose', { export: { includePlan: true } });
    return { pass: r === false && L.S.saves === 0, detail: J({ r, saves: L.S.saves }) };
  });
  t('READ', () => {
    const L = load(src);
    const none = L.D.includePlanOf('p1');
    L.D.setDocSetting('p1', { export: { includePlan: true } });
    const on = L.D.includePlanOf('p1'), loose = L.D.includePlanOf('loose'), gone = L.D.includePlanOf('nope');
    L.S.projects.find((p) => p.id === 'doc1').docSettings = { export: { includePlan: 'true' } };
    const str = L.D.includePlanOf('p1');
    L.S.projects.find((p) => p.id === 'doc1').docSettings = { export: { includePlan: 1 } };
    const num = L.D.includePlanOf('p1');
    return { pass: none === false && on === true && loose === false && gone === false && str === false && num === false, detail: J({ none, on, loose, gone, str, num }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
for (const k of ['SET', 'KEEP', 'CLEAR', 'VAL', 'LOOSE', 'READ']) ok(`${k} on the real docSettings.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'docSettings.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

// the mutants: [name, the check it must turn red, the rewrite]
const MUT = [
  ['a non-boolean includePlan is stored', 'VAL', (t) => t.replace("&& patch.export.includePlan !== true) return false;", () => ') {}')],
  ['false is stored as a value', 'VAL', (t) => t.replace('&& patch.export.includePlan !== true) return false;', () => "&& typeof patch.export.includePlan !== 'boolean') return false;")],
  ['clearing writes false, not the absence', 'CLEAR', (t) => t.replace('delete merged.includePlan;', () => 'merged.includePlan = false;')],
  ['a write of one export key drops the other', 'KEEP', (t) => t.replace('const merged: Record<string, unknown> = { ...(cur.export as object | undefined), ...patch.export };', () => 'const merged: Record<string, unknown> = { ...patch.export };')],
  ['an empty export object is left behind', 'CLEAR', (t) => t.replace('if (Object.keys(merged).length === 0) delete next.export;', () => 'if (false) delete next.export;')],
  ['a stored string reads as on', 'READ', (t) => t.replace('=== true;', () => '? true : false;')],
];
for (const [name, key, fn] of MUT) {
  const after = fn(SRC);
  const landed = after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-PLAN-REMEMBER-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PLAN-REMEMBER-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
