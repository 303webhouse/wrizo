// QUICK PRESET (PRESETS-B item 14, Nov 25), BROWSERLESS. No browser, no box turn: the real docKinds.ts is transpiled and run, and docKindActs.ts, DocKindMenu.tsx and the lexicon are read as text. Each law is given a mutant that must LAND and turn its own check red.
//   PARSE    her typed list becomes Part names: a name per line; a lone line with commas splits at the commas; spaces gathered; empty lines gone; braces gone (a typed {sources} is a name); each name cut to 120; at most 40; order and repeats are hers
//   PRESET   the throwaway preset has no stored id she could pick again (id 'quick'), takes the Doc's kind, and is NOT in PRESETS (the list of 38 is unchanged)
//   ACT      applyQuickPreset adds the Parts through the SAME act as a preset (applyPresetOf), writes nothing for an empty list, and keeps no list (no storage, no setting, no saved preset)
//   MENU     the Quick Preset row is the FIRST child of the Presets list, ahead of every group; its form lives in component state (never stored); Add is off while the list is empty; Cancel and closing the list drop the text
//   WORDS    every word is a lexicon key, in the canonical words and in the DeskTermId union, and the block says PROPOSED
// Run: node scripts/harness/reorg-quick-preset-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const SRC = { kinds: rd('reorg/docKinds.ts'), acts: rd('reorg/docKindActs.ts'), menu: rd('reorg/DocKindMenu.tsx'), chrome: rd('store/lexicon/canonical/chrome.ts'), terms: rd('store/lexicon/terms.ts') };
const KEYS = ['reorgQuickPreset', 'reorgQuickPresetLabel', 'reorgQuickPresetPlaceholder', 'reorgQuickPresetHint', 'reorgQuickPresetOne', 'reorgQuickPresetMany', 'reorgQuickPresetMax', 'reorgQuickPresetAdd', 'reorgQuickPresetCancel'];
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 200) }; } };
  t('PARSE', () => {
    const k = load(src.kinds);
    const bs = String.fromCharCode(92);
    const long = 'x'.repeat(130);
    const many = Array.from({ length: 45 }, (_, i) => 'P' + i).join('\n');
    const cases = [
      ['Introduction\nMiddle\nEnd', ['Introduction', 'Middle', 'End']],
      ['Intro, Middle, End', ['Intro', 'Middle', 'End']],
      ['  Act   One  \n\n\n  Act Two\n', ['Act One', 'Act Two']],
      ['Title Page, Abstract\nBody', ['Title Page, Abstract', 'Body']],   // two lines: commas are part of a name
      ['{sources}\nSources', ['sources', 'Sources']],
      ['Interlude\nInterlude', ['Interlude', 'Interlude']],
      ['\r\nOne\r\nTwo\r\n', ['One', 'Two']],
      ['   \n  ', []],
      ['', []],
      [long, ['x'.repeat(120)]],
    ];
    const bad = [];
    for (const [input, want] of cases) { const got = k.parseQuickNames(input); if (J(got) !== J(want)) bad.push([input.slice(0, 20), got.slice(0, 3), want.slice(0, 3)]); }
    const capped = k.parseQuickNames(many);
    const capOk = capped.length === 40 && capped[0] === 'P0' && capped[39] === 'P39' && k.QUICK_MAX === 40;
    void bs;
    return { pass: bad.length === 0 && capOk, detail: J({ bad: bad.slice(0, 3), capLen: capped.length }) };
  });
  t('PRESET', () => {
    const k = load(src.kinds);
    const q = k.quickPreset(['A', 'B'], 'screenplay');
    const s = k.quickPreset(['A'], 'standard');
    const listed = k.PRESETS.some((p) => p.id === 'quick');
    return { pass: q.id === 'quick' && q.kind === 'screenplay' && q.group === 'screenplay' && s.kind === 'standard' && J(q.parts) === J(['A', 'B']) && !listed && k.PRESETS.length === 38, detail: J({ n: k.PRESETS.length, listed }) };
  });
  t('ACT', () => {
    const a = noComments(src.acts);
    const fn = a.slice(a.indexOf('export function applyQuickPreset('), a.indexOf('function applyPresetOf('));
    const viaSame = /applyPresetOf\(entryId, quickPreset\(/.test(fn) && /function applyPresetOf\(/.test(a) && /return applyPresetOf\(entryId, preset\)/.test(a);
    const emptyWrites = /if \(!names\.length\) return \{ ok: true, made: \[\], reused: null \}/.test(fn) && fn.indexOf('!names.length') < fn.indexOf('ensureDoc(');
    const keepsNothing = !/localStorage|sessionStorage|setDocSetting|saveJournalEntry|saveProject|createBinder/.test(fn);
    return { pass: viaSame && emptyWrites && keepsNothing, detail: J({ viaSame, emptyWrites, keepsNothing }) };
  });
  t('MENU', () => {
    const m = noComments(src.menu);
    const i = m.indexOf('data-doc-sub="presets"');
    const body = m.slice(i, m.indexOf("sub === it && it === 'templates'"));
    const quickAt = body.indexOf('data-quick-preset');
    const groupAt = body.indexOf('GROUPS.filter');
    const first = quickAt > 0 && quickAt < groupAt;
    const stateOnly = /useState\(''\)/.test(m) && !/localStorage|sessionStorage/.test(m);
    const addOff = /data-quick-add="" disabled=\{names\.length === 0\}/.test(m);
    const drops = /setQuickOpen\(false\); setQuickText\(''\)/.test(m) && /data-quick-cancel="" onClick=\{\(\) => setQuickOpen\(false\)\}/.test(m);
    const viaAct = /act\(\(\) => \{ applyQuickPreset\(entry\.id, quickText\); \}\)/.test(m);
    return { pass: first && stateOnly && addOff && drops && viaAct, detail: J({ first, stateOnly, addOff, drops, viaAct }) };
  });
  t('WORDS', () => {
    const c = load(src.chrome).CANONICAL_CHROME;
    const missing = KEYS.filter((k) => typeof c[k] !== 'string' || !src.terms.includes("'" + k + "'"));
    const usedInMenu = KEYS.filter((k) => src.menu.includes("'" + k + "'"));
    const proposed = /QUICK PRESET[^\n]*\n[^\n]*PROPOSED/.test(src.chrome) || /PROPOSED[^\n]*\n(?:[^\n]*\n){0,1}\s*reorgQuickPreset:/.test(src.chrome);
    const strings = [...src.menu.matchAll(/>([A-Z][A-Za-z ]{4,})</g)].map((m) => m[1]).filter((s) => /Quick|Add Parts|Cancel/.test(s));
    return { pass: missing.length === 0 && usedInMenu.length >= 8 && proposed && strings.length === 0, detail: J({ missing, usedInMenu: usedInMenu.length, proposed, strings }) };
  });
  return R;
}

const sub = (txt, from, to) => { const out = txt.split(from).join(to); return out === txt ? null : out; };
const MUTANTS = [
  ['a name is not trimmed', 'PARSE', (s) => ({ ...s, kinds: sub(s.kinds, ".replace(/\\s+/g, ' ').trim().slice(0, QUICK_NAME_MAX)", ".slice(0, QUICK_NAME_MAX)") })],
  ['a brace stays in a name', 'PARSE', (s) => ({ ...s, kinds: sub(s.kinds, ".replace(/[{}]/g, '')", '') })],
  ['the list is not capped', 'PARSE', (s) => ({ ...s, kinds: sub(s.kinds, '.slice(0, QUICK_MAX)', '') })],
  ['the quick preset is listed with the others', 'PRESET', (s) => ({ ...s, kinds: sub(s.kinds, 'export const PRESETS: readonly Preset[] = [...LIVE_PRESETS, ...FIRST_SLICE_PRESETS];', "export const PRESETS: readonly Preset[] = [...LIVE_PRESETS, ...FIRST_SLICE_PRESETS, { id: 'quick', group: 'creative', label: 'Quick Preset', kind: 'standard', parts: [] }];") })],
  ['Quick Preset has its own way of adding Parts', 'ACT', (s) => ({ ...s, acts: sub(s.acts, 'return applyPresetOf(entryId, quickPreset(names, isScreenplay ? \'screenplay\' : \'standard\'));', 'return { ok: true, made: [], reused: null };') })],
  ['an empty list still makes the Doc', 'ACT', (s) => ({ ...s, acts: sub(s.acts, "  if (!names.length) return { ok: true, made: [], reused: null };\n  const doc = ensureDoc(entryId);\n  if (!doc.ok) return { ok: false, reason: 'no-doc' };\n  const isScreenplay", "  const doc = ensureDoc(entryId);\n  if (!names.length) return { ok: true, made: [], reused: null };\n  if (!doc.ok) return { ok: false, reason: 'no-doc' };\n  const isScreenplay") })],
  ['the typed list is remembered', 'ACT', (s) => ({ ...s, acts: sub(s.acts, "  const names = parseQuickNames(text);\n", "  const names = parseQuickNames(text);\n  localStorage.setItem('quick', text);\n") })],
  ['Quick Preset sits below the groups', 'MENU', (s) => ({ ...s, menu: sub(s.menu, '<button type="button" data-quick-preset=""', '{GROUPS.filter(() => false)}<button type="button" data-quick-preset=""') })],
  ['Add is on with an empty list', 'MENU', (s) => ({ ...s, menu: sub(s.menu, 'disabled={names.length === 0}', '') })],
  ['the text outlives the list', 'MENU', (s) => ({ ...s, menu: sub(s.menu, "setQuickOpen(false); setQuickText('');", 'setQuickOpen(false);') })],
  ['a word is a string in the menu', 'WORDS', (s) => ({ ...s, menu: sub(s.menu, "{t('reorgQuickPresetCancel')}", 'Cancel') })],
];

const results = [];
const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
for (const [name, v] of Object.entries(suite(SRC))) check(name, v.pass, v.detail);
for (const [label, expect, mut] of MUTANTS) {
  const m = mut(SRC);
  const landed = Object.values(m).every((x) => x !== null && x !== undefined);
  const R = landed ? suite(m) : {};
  const red = Object.entries(R).filter(([, v]) => !v.pass).map(([k]) => k);
  check('MUTANT: ' + label, landed && red.includes(expect), J({ landed, red }));
}
let fail = 0;
for (const c of results) { if (!c.pass) fail++; console.log((c.pass ? 'PASS  ' : 'FAIL  ') + c.name + (c.pass ? '' : '   ' + c.detail)); }
console.log(fail ? `\n${fail} FAILED of ${results.length}` : `\nall ${results.length} PASS`);
process.exit(fail ? 1 : 0);
