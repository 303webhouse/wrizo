// THE GUIDE (PRESETS-B, Nov 25: guide-brief-nov24.md), BROWSERLESS. No browser, no box turn: the real presetGuide.ts, docKinds.ts and planPresets.ts are transpiled and run, and the panel and the act are read as text.
// Each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   PURE      the module has no storage, fetch, document, window, React or store import (rule 1)
//   LIVE      WALKS EVERY PATH: every landing and every alternative is a preset that is in the app, or Blank; every structure is a structure in the app; the live lists are read from the SOURCE TEXT of docKinds.ts / planPresets.ts, independent of the module
//   NOWHERE   no shown answer leads nowhere; no question but the first has fewer than two answers (a one-answer question is skipped); every question has a prompt and every answer a word
//   ROWS      the rows that CHANGED or DROPPED against the table, as the report lists them (so a preset that ships later changes this list and nothing else)
//   ALT       an alternative is never its own pick; a row whose landing was replaced by its alternative has no alternative
//   BLANK     "Not sure yet" lands on Blank (no preset, no structure, no style) and writes nothing; Blank is `BLANK`
//   STYLE     only a school paper and research ask a style, and a style is MLA, APA or Chicago or none
//   PANEL     the panel imports no store write (persistence, docKindActs, presetGuideActs) and keeps no storage; Back and Close call nothing but its own state and `onClose`; Start is the host's `onStart`
//   LEX       every word the panel and the module use is a `guide*` lexicon key that is in the canonical words (no string of the Guide's own)
//   ACT       presetGuideActs.ts runs applyPreset, then applyStyleGuide, then the one live Plan loader (planPresetLoad.ts), and BackPlan.tsx uses that same loader
// Run: node scripts/harness/reorg-guide-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const J = (v) => JSON.stringify(v);
function load(src, deps = {}) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { if (deps[p]) return deps[p]; throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}

const SRC = {
  guide: rd('reorg/presetGuide.ts'), kinds: rd('reorg/docKinds.ts'), plan: rd('reorg/backMenu/planPresets.ts'),
  panel: rd('reorg/GuidePanel.tsx'), acts: rd('reorg/presetGuideActs.ts'), loader: rd('reorg/backMenu/planPresetLoad.ts'), backplan: rd('reorg/backMenu/BackPlan.tsx'),
  chrome: rd('store/lexicon/canonical/chrome.ts'), terms: rd('store/lexicon/terms.ts'),
};

// THE APP TODAY, read from the source text (not through the module under test): the preset ids in docKinds.ts, the structure ids in planPresets.ts
const appPresets = (kinds) => [...kinds.matchAll(/\b(?:std|scr)\('([a-z0-9-]+)'/g)].map((m) => m[1]);
const appStructures = (plan) => [...plan.matchAll(/^\s*\{ id: '([a-z0-9-]+)', name: 'reorgPre/gm)].map((m) => m[1]);

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 200) }; } };
  const kinds = load(src.kinds);
  const plan = load(src.plan);
  const g = () => load(src.guide, { './docKinds': kinds, './backMenu/planPresets': plan });
  const P = new Set(appPresets(SRC.kinds)), S = new Set(appStructures(SRC.plan));

  t('PURE', () => {
    const body = src.guide.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
    const bad = body.match(/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|document\.|window\.|navigator\.|from 'react'|store\/persistence|Math\.random|Date\.now/g);
    const imports = [...src.guide.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
    const okImports = imports.every((i) => ['./docKinds', './backMenu/planPresets', '../store/lexicon/terms'].includes(i));
    return { pass: !bad && okImports, detail: J({ bad, imports }) };
  });
  t('LIVE', () => {
    const m = g(), paths = m.allPaths(m.LIVE);
    const sameLive = [...m.LIVE.presets].sort().join() === [...P].sort().join() && [...m.LIVE.structures].sort().join() === [...S].sort().join();
    const bad = [];
    const chk = (path, p, which) => {
      if (p.preset !== null && !P.has(p.preset)) bad.push([path.join('/'), which, 'preset', p.preset]);
      if (p.structure !== null && !S.has(p.structure)) bad.push([path.join('/'), which, 'structure', p.structure]);
      if (p.style !== null && !['mla', 'apa', 'chicago'].includes(p.style)) bad.push([path.join('/'), which, 'style', p.style]);
    };
    for (const { path, landing } of paths) { chk(path, landing.pick, 'pick'); if (landing.alt) chk(path, landing.alt, 'alt'); }
    return { pass: sameLive && paths.length > 20 && bad.length === 0, detail: J({ sameLive, paths: paths.length, bad: bad.slice(0, 6) }) };
  });
  t('NOWHERE', () => {
    const m = g(), tree = m.guideTree(m.LIVE);
    const bad = [];
    const go = (q, top, trail) => {
      if (!top && q.answers.length < 2) bad.push([trail, 'one-answer question', q.id]);
      if (!q.word || !/^guide/.test(q.word)) bad.push([trail, 'prompt', q.id]);
      for (const a of [...q.answers, ...q.more]) {
        if (!a.word || !/^guide/.test(a.word)) bad.push([trail, 'word', a.id]);
        if (a.next.kind === 'question') go(a.next, false, trail + '/' + a.id);
      }
    };
    go(tree, true, '');
    const leaves = m.allPaths(m.LIVE, tree);
    const everyShownLeads = [...tree.answers, ...tree.more].every((a) => leaves.some((l) => l.path[0] === a.id));
    return { pass: bad.length === 0 && everyShownLeads, detail: J({ bad: bad.slice(0, 6), everyShownLeads }) };
  });
  t('ROWS', () => {
    const m = g(), tree = m.guideTree(m.LIVE);
    const land = (...path) => { const s = m.walk(path, m.LIVE, tree); return s.kind === 'landing' ? { p: s.landing.pick, a: s.landing.alt } : null; };
    const show = (x) => (x ? [x.p.preset, x.p.structure, x.p.style, x.a ? [x.a.preset, x.a.structure] : null] : null);
    const want = {
      // kept whole
      'story/book/person': ['novel', 'three', null, ['novel', 'hero']],
      'story/few/nothing': ['short-story', null, null, ['short-story', 'circle']],
      'story/page/person': ['flash-fiction', 'three', null, ['flash-fiction', 'hero']],
      'script/film': ['screenplay-feature', null, null, ['treatment', null]],
      'script/tv-half': ['tv-half-hour', null, null, ['treatment', null]],
      'work/decide': ['decision-memo', null, null, ['memo', null]],
      'article/news': ['news-story', null, null, ['explainer', null]],
      'paper/argument/mla': ['argumentative-essay', null, 'mla', ['class-essay', null]],
      'paper/lab/not-sure': ['lab-report', null, null, ['class-essay', null]],
      'research/thesis/apa': ['thesis-or-dissertation', null, 'apa', null],
      'research/paper/chicago': ['academic-research', null, 'chicago', null],
      'essay/book': ['memoir', null, null, null],
      // CHANGED: the landing was not in the app, so its alternative is the landing (with no alternative)
      'story/book/puzzle': ['novel', 'seven', null, null],
      'story/book/two': ['novel', 'three', null, null],
      'script/stage': ['treatment', null, null, null],
      'script/audio': ['treatment', null, null, null],
      'paper/analysis/no': ['class-essay', null, null, null],
      'paper/comparison/chicago': ['class-essay', null, 'chicago', null],
      'paper/not-sure/apa': ['class-essay', null, 'apa', null],
      // DROPPED then SKIPPED: a question left with one answer is not asked
      'poem': ['poem', null, null, null],
      'grant': ['grant-application', null, null, null],
      'essay/essay': ['personal-essay', null, null, null],
    };
    const got = {}; const bad = [];
    for (const [k, v] of Object.entries(want)) {
      const r = show(land(...k.split('/')));
      got[k] = r;
      if (J(r) !== J(v)) bad.push([k, r, v]);
    }
    // DROPPED: answers that are not shown at all
    const hasAns = (q, id) => [...q.answers, ...q.more].some((a) => a.id === id);
    const droppedOk = !hasAns(tree, 'game') && !hasAns(tree.answers.find((a) => a.id === 'story').next, 'nope')
      && ['research', 'grant', 'article'].every((id) => hasAns(tree, id)) && ['story', 'script', 'poem', 'essay', 'paper', 'work'].every((id) => tree.answers.some((a) => a.id === id));
    const storyBook = tree.answers.find((a) => a.id === 'story').next.answers.find((a) => a.id === 'book').next;
    const soFar = storyBook.answers.map((a) => a.id).join();
    const soFarOk = soFar === 'person,puzzle,two,nothing';   // Kishotenketsu (image) and Braid (pieces) have neither landing nor alternative in the app: left out
    const poemSkipped = m.walk(['poem'], m.LIVE, tree).kind === 'landing' && m.walk(['grant'], m.LIVE, tree).kind === 'landing';
    return { pass: bad.length === 0 && droppedOk && soFarOk && poemSkipped, detail: J({ bad: bad.slice(0, 5), droppedOk, soFar, poemSkipped }) };
  });
  t('ALT', () => {
    const m = g(), bad = [];
    for (const { path, landing } of m.allPaths(m.LIVE)) {
      if (landing.alt && J(landing.alt) === J(landing.pick)) bad.push(['same', path.join('/')]);
      if (landing.alt && landing.alt.preset === null && !landing.blank) bad.push(['alt is Blank', path.join('/')]);
    }
    // a row's landing replaced by its alternative keeps no alternative: with the app short of Treatment as well, the film row would lose both
    const only = { presets: new Set(['memo']), structures: new Set() };
    const row = m.resolveRow({ preset: 'x-not-in-app', alt: 'memo' }, only);
    const none = m.resolveRow({ preset: 'x-not-in-app', alt: 'y-not-in-app' }, only);
    return { pass: bad.length === 0 && row && row.preset === 'memo' && row.alt === null && none === null, detail: J({ bad: bad.slice(0, 4), row, none }) };
  });
  t('BLANK', () => {
    const m = g();
    const n = m.NOT_SURE;
    return { pass: n.blank === true && n.pick.preset === null && n.pick.structure === null && n.pick.style === null && n.alt === null && m.BLANK.preset === null && m.BLANK.structure === null && m.BLANK.style === null, detail: J(n) };
  });
  t('STYLE', () => {
    const m = g();
    const asks = new Set();
    for (const { path, landing } of m.allPaths(m.LIVE)) if (landing.pick.style) asks.add(path[0]);
    const onlyThose = [...asks].every((k) => k === 'paper' || k === 'research');
    return { pass: onlyThose && asks.size === 2, detail: J([...asks]) };
  });
  t('PANEL', () => {
    const p = src.panel;
    const imp = [...p.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
    const noWrite = !imp.some((i) => /persistence|docKindActs|presetGuideActs|planPresetLoad|parts$/.test(i));
    const noStore = !/localStorage|sessionStorage|indexedDB|fetch\(|saveJournal|flushNow|applyPreset|startGuide/.test(p.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''));
    const startOnlyHost = (p.match(/onStart\(/g) ?? []).length === 4 && !/onStart\(\)/.test(p);
    const esc = /e\.key === 'Escape'/.test(p) && /onClose\(\)/.test(p) && /aria-modal="true"/.test(p) && /role="status"/.test(p);
    return { pass: noWrite && noStore && startOnlyHost && esc, detail: J({ imp, noWrite, noStore, startOnlyHost, esc }) };
  });
  t('LEX', () => {
    const chrome = load(src.chrome).CANONICAL_CHROME;
    const termsText = src.terms;
    const used = new Set([...src.guide.matchAll(/'(guide[A-Za-z0-9]+)'/g)].map((m) => m[1]).concat([...src.panel.matchAll(/'(guide[A-Za-z0-9]+)'/g)].map((m) => m[1])));
    const missing = [...used].filter((k) => typeof chrome[k] !== 'string' || !new RegExp(`'${k}'`).test(termsText));
    const strings = [...src.panel.matchAll(/>([A-Za-z][^<>{}]{3,})</g)].map((m) => m[1].trim()).filter((s) => !/^[a-z]+$/.test(s));
    return { pass: used.size > 60 && missing.length === 0 && strings.length === 0, detail: J({ used: used.size, missing: missing.slice(0, 5), strings }) };
  });
  t('ACT', () => {
    const a = src.acts.replace(/\/\/.*$/gm, '');
    const order = a.indexOf('applyPreset(') > 0 && a.indexOf('applyStyleGuide(') > a.indexOf('applyPreset(') && a.indexOf('loadPlanPreset(') > a.indexOf('applyStyleGuide(');
    const once = (a.match(/loadPlanPreset\(/g) ?? []).length === 1;
    const same = /loadPlanPreset/.test(src.backplan) && !/presetBoxes/.test(src.backplan) && /presetBoxes\(/.test(src.loader);
    return { pass: order && once && same, detail: J({ order, once, same }) };
  });
  return R;
}

const green = suite(SRC);
const reds = (R) => Object.entries(R).filter(([, v]) => !v.pass).map(([k]) => k);

// MUTANTS: each rewrites the source; it must LAND (the text changed) and turn its own check red
const sub = (txt, from, to) => { const out = txt.split(from).join(to); return out === txt ? null : out; };
const MUTANTS = [
  ['an id not in the app lands (the live check off)', 'LIVE', (s) => ({ ...s, guide: sub(s.guide, "if (live.presets.has(r.preset)) return", "if (true) return") })],
  ['a one-answer question is asked (no skipping)', 'NOWHERE', (s) => ({ ...s, guide: sub(s.guide, 'if (q.answers.length === 1) return q.answers[0].next;', '') })],
  ['an answer that leads nowhere is shown', 'NOWHERE', (s) => ({ ...s, guide: sub(s.guide, 'if (q.answers.length === 0) return null;', 'if (q.answers.length === 0) return q;') })],
  ['a row keeps its alternative after it became the landing', 'ALT', (s) => ({ ...s, guide: sub(s.guide, 'return { preset: r.alt, alt: null };', 'return { preset: r.alt, alt: r.alt };') })],
  ['"Not sure yet" starts a preset', 'BLANK', (s) => ({ ...s, guide: sub(s.guide, 'export const NOT_SURE: GuideLanding = { pick: BLANK,', "export const NOT_SURE: GuideLanding = { pick: { preset: 'memo', structure: null, style: null },") })],
  ['the module reaches for storage', 'PURE', (s) => ({ ...s, guide: s.guide + "\nexport const leak = () => localStorage.setItem('guide', '1');\n" })],
  ['the game question is shown (a preset not in the app)', 'ROWS', (s) => ({ ...s, guide: sub(s.guide, "row('idea', 'guideAnsGameIdea', 'game-pitch', 'game-design-document')", "row('idea', 'guideAnsGameIdea', 'game-pitch', 'game-design-document'), row('idea2', 'guideAnsGameIdea', 'memo')") })],
  ['the style question is asked of a work memo', 'STYLE', (s) => ({ ...s, guide: sub(s.guide, "const work = settle(question('work-after', 'guideQWork', rowAnswers(WORK, live)));", "const work = settle(question('work-after', 'guideQWork', styled(WORK, STYLE_SCHOOL, 'work-style', 'guideQStyleSchool', live)));") })],
  ['the panel writes the store on Close', 'PANEL', (s) => ({ ...s, panel: sub(s.panel, "import { createPortal } from 'react-dom';", "import { createPortal } from 'react-dom';\nimport { flushNow } from '../store/persistence';") })],
  ['a word of the Guide is a string in the panel', 'LEX', (s) => ({ ...s, panel: sub(s.panel, '{t(\'guideStart\')}</button></div>\n          </div>\n        )}', '>Start</button></div>\n          </div>\n        )}') })],
  ['Start loads the Plan before the preset', 'ACT', (s) => ({ ...s, acts: sub(s.acts, '  if (p.preset) {', '  if (structure) loadPlanPreset(entryId, structure, t);\n  if (p.preset) {') })],
];

const results = [];
const R0 = green;
const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
for (const [name, v] of Object.entries(R0)) check(name, v.pass, v.detail);
for (const [label, expect, mut] of MUTANTS) {
  const m = mut(SRC);
  const landed = Object.values(m).every((x) => x !== null);
  const R = landed ? suite(m) : {};
  const red = reds(R);
  check('MUTANT: ' + label, landed && red.includes(expect), J({ landed, red }));
}
let fail = 0;
for (const c of results) { if (!c.pass) fail++; console.log((c.pass ? 'PASS  ' : 'FAIL  ') + c.name + (c.pass ? '' : '   ' + c.detail)); }
console.log(fail ? `\n${fail} FAILED of ${results.length}` : `\nall ${results.length} PASS`);
process.exit(fail ? 1 : 0);
