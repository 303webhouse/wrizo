// THE ASSETS SHE ATTACHES ARE REMEMBERED PER DOC, BROWSERLESS (Fable, Nov 21, 1:15 pm, on item 5b: "REMEMBER the ticks per Doc like Include the Plan (docSettings export.attach = asset ids), not session-only").
// The real reorg/docSettings.ts is transpiled and run over a stub store (the reorg-plan-remember-unit.mjs recipe); each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
// An asset's id here is its key as the Back menu ticks it: the entry's id, then "|", then the card's id when it is one card of a board ("page-1|", "board-1|c1").
//   SET    export.attach is stored on the Doc's own record beside the format and includePlan, as the list she ticked (in the order given, each once), nothing else changes, and the same list again writes nothing
//   KEEP   the format, includePlan and attach live side by side: setting one never drops another
//   CLEAR  attach null takes the key off, and so does an empty list (never [] and never null); with the others still there export holds them; with nothing else the export key goes and docSettings is {}
//   VAL    only a list of non-empty strings is stored: a string, an object, a list holding a number or an empty string is refused and writes nothing
//   LOOSE  a loose page has no export setting to keep: refused, and nothing is written
//   READ   attachedOf(page) is the stored list for the Doc this page is a Part of; absent, malformed, a loose page and a missing page read as none
//   PRUNE  taking an asset off the Doc takes its tick off too (an asset added again later is not found ticked); the other ticks stay; an asset that was never ticked leaves export untouched
// Run: node scripts/harness/reorg-attach-remember-unit.mjs   (from apps/desktop; browserless: needs no box turn)
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
  for (const id of ['p1', 'a1', 'b1']) S.rows.push({ id, text: id, projectId: id === 'p1' ? 'doc1' : 'top-set-1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x' });
  S.rows.push({ id: 'loose', text: 'alone', projectId: 'top-set-1', pageType: 'manuscript', createdAt: 'x', updatedAt: 'x' });
  return { D: module.exports, S };
}
const ds = (L) => L.S.projects.find((p) => p.id === 'doc1').docSettings;
const set = (L, attach) => L.D.setDocSetting('p1', { export: { attach } });

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SET', () => {
    const L = load(src);
    const a = set(L, ['a1|', 'b1|c1', 'a1|']), saves = L.S.saves, again = set(L, ['a1|', 'b1|c1']);
    return { pass: a === true && J(ds(L)) === J({ export: { attach: ['a1|', 'b1|c1'] } }) && again === false && L.S.saves === saves, detail: J({ a, again, ds: ds(L) }) };
  });
  t('KEEP', () => {
    const L = load(src);
    L.D.setDocSetting('p1', { export: { format: 'html', includePlan: true } });
    set(L, ['a1|']);
    const all = J(ds(L));
    L.D.setDocSetting('p1', { export: { format: 'md' } });
    const after = J(ds(L));
    return { pass: all === J({ export: { format: 'html', includePlan: true, attach: ['a1|'] } }) && after === J({ export: { format: 'md', includePlan: true, attach: ['a1|'] } }), detail: J({ all, after }) };
  });
  t('CLEAR', () => {
    const L = load(src);
    L.D.setDocSetting('p1', { export: { format: 'html' } });
    set(L, ['a1|']);
    const c1 = set(L, null);
    const withFormat = J(ds(L));
    const L2 = load(src);
    set(L2, ['a1|']);
    const c2 = set(L2, []);
    const alone = J(ds(L2));
    const none = set(load(src), null), noneEmpty = set(load(src), []);
    return { pass: c1 === true && withFormat === J({ export: { format: 'html' } }) && c2 === true && alone === '{}' && !alone.includes('[]') && !alone.includes('null') && none === false && noneEmpty === false, detail: J({ c1, withFormat, c2, alone, none, noneEmpty }) };
  });
  t('VAL', () => {
    const L = load(src);
    const bad = ['a1|', { a: 1 }, [1], [''], ['a1|', 2], true].map((v) => set(L, v));
    return { pass: bad.every((b) => b === false) && L.S.saves === 0 && ds(L) === undefined, detail: J({ bad, saves: L.S.saves, ds: ds(L) }) };
  });
  t('LOOSE', () => {
    const L = load(src);
    const r = L.D.setDocSetting('loose', { export: { attach: ['a1|'] } });
    return { pass: r === false && L.S.saves === 0, detail: J({ r, saves: L.S.saves }) };
  });
  t('READ', () => {
    const L = load(src);
    const none = L.D.attachedOf('p1');
    set(L, ['a1|', 'b1|c1']);
    const on = L.D.attachedOf('p1'), loose = L.D.attachedOf('loose'), gone = L.D.attachedOf('nope');
    const proj = L.S.projects.find((p) => p.id === 'doc1');
    proj.docSettings = { export: { attach: 'a1|' } };
    const str = L.D.attachedOf('p1');
    proj.docSettings = { export: { attach: ['a1|', 7, '', 'b1|'] } };
    const mixed = L.D.attachedOf('p1');
    return { pass: J(none) === '[]' && J(on) === J(['a1|', 'b1|c1']) && J(loose) === '[]' && J(gone) === '[]' && J(str) === '[]' && J(mixed) === J(['a1|', 'b1|']), detail: J({ none, on, loose, gone, str, mixed }) };
  });
  t('PRUNE', () => {
    const L = load(src);
    L.D.addDocAsset('p1', { entryId: 'a1' }); L.D.addDocAsset('p1', { entryId: 'b1' });
    set(L, ['a1|', 'b1|']);
    const rm = L.D.removeDocAsset('p1', { entryId: 'a1' });
    const left = J(L.D.attachedOf('p1'));
    L.D.removeDocAsset('p1', { entryId: 'b1' });
    const last = J(ds(L));
    const L2 = load(src);
    L2.D.addDocAsset('p1', { entryId: 'a1' }); L2.D.addDocAsset('p1', { entryId: 'b1' });
    set(L2, ['b1|']);
    const before = J(ds(L2));
    L2.D.removeDocAsset('p1', { entryId: 'a1' });
    const untouched = J(L2.D.attachedOf('p1'));
    return { pass: rm === true && left === J(['b1|']) && !last.includes('attach') && !last.includes('assets') && untouched === J(['b1|']) && before.includes('attach'), detail: J({ rm, left, last, untouched }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
for (const k of ['SET', 'KEEP', 'CLEAR', 'VAL', 'LOOSE', 'READ', 'PRUNE']) ok(`${k} on the real docSettings.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'docSettings.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

// the mutants: [name, the check it must turn red, the rewrite]
const MUT = [
  ['a string is accepted as the list', 'VAL', (t) => t.replace('!isAttachList(patch.export.attach)) return false;', () => ') {}')],
  ['a list holding an empty string is accepted', 'VAL', (t) => t.replace("typeof x === 'string' && x.length > 0)", () => "typeof x === 'string')")],
  ['an empty list is stored as []', 'CLEAR', (t) => t.replace('(Array.isArray(merged.attach) && merged.attach.length === 0)', () => 'false')],
  ['clearing writes null, not the absence', 'CLEAR', (t) => t.replace('delete merged.attach;', () => 'merged.attach = null;')],
  ['a tick given twice is stored twice', 'SET', (t) => t.replace('merged.attach = [...new Set(merged.attach as string[])];', () => 'merged.attach = merged.attach;')],
  ['a write of one export key drops the others', 'KEEP', (t) => t.replace('const merged: Record<string, unknown> = { ...(cur.export as object | undefined), ...patch.export };', () => 'const merged: Record<string, unknown> = { ...patch.export };')],
  ['a malformed stored list reads as ticked', 'READ', (t) => t.replace('return Array.isArray(a) ? a.filter', () => 'return typeof a === "string" ? [a] : Array.isArray(a) ? a.filter')],
  ['an asset taken off the Doc stays ticked', 'PRUNE', (t) => t.replace('pruneAttach(entryId, attachKey(asset));', () => '')],
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
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-ATTACH-REMEMBER-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ATTACH-REMEMBER-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
