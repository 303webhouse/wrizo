// THE GUIDE AS A WALK (PRESETS-B, Nov 25; Fable 7:10 pm and the Wrizors' frames guide-walk-*), BROWSERLESS: the real model, row ops and marks are transpiled and run. Each law has a mutant that must LAND and turn its check red.
//   MARKS     B/I/U/S live beside the card's text as ranges: toggling never changes the text; editing keeps a mark on its words; a mark over deleted text goes with it
//   FACE      a marked card draws its marks and its textContent stays the stored text; markup in the text stays text
//   STEPS     the Plan's leaf rows are the steps, its headings the groups; noted = her note OR words in its Part; skipped only while empty; pins and drawings are no step
//   PLACE     her saved place, else the first step not noted; a dropped step moves on to the next, or back when it was the last
//   NOTE      a note is written under the row's name (the name unchanged); writing one clears "skipped"; an empty note leaves the name alone
//   SKIP      Skip marks only an empty step; "Not skipped" removes the key (never false)
//   ADD       "Add a step after" lands right after it, under the same heading
//   RENAME    a rename (the Plan tab's own) keeps the note and keeps the marks on their words
//   SITES     every place that changes a card's text keeps its marks (the board editor, the split board, the Plan's rename)
//   SAVED     `walk` is written through the Doc-settings guard, and never copied into the defaults for new pages
//   HELD      while the walk is open the app behind it is inert (so no key lands on the page), and leaving lifts it and puts her caret back
//   BACK      the way-back chip stands on any page of the Doc, a Part still to be born included
//   SCENES    "Add scenes…" puts child cards (with the old Walk's question) one level under a step; the step stays a step, its scenes walk right after it, an Act stays a heading; a step added after a scene is a scene
//   WHICH     the Plan's structure is worked out from its rows' names (nothing saved), so a step's "?" can show that structure's own note
//   DROP      any step may be dropped (a noted one too), its scenes with it, to the Trash, with Undo
//   TABS      Plan and Assets stand greyed beside the card: locked as the app locks a tab (aria-disabled, data-locked, out of the Tab order, a line saying why)
//   THEMES    the spec's §8 words, Arbor, Flux and Machina (Machina's are the canonical ones)
// Run: node scripts/harness/reorg-guide-walk-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const J = (v) => JSON.stringify(v);
const read = (p) => { try { return fs.readFileSync(path.join(SRC, p), 'utf8').split('\r\n').join('\n'); } catch { return ''; } };
const FILES = ['store/textMarks.ts', 'reorg/walk/stepModel.ts', 'reorg/walk/stepOps.ts', 'reorg/backMenu/planOps.ts', 'components/BoardEditor.tsx', 'reorg/split/SplitBoard.tsx', 'reorg/docSettings.ts', 'store/pageDefaults.ts', 'components/board/BoardBoxes.tsx', 'reorg/walk/GuideWalk.tsx', 'reorg/walk/WalkHost.tsx', 'reorg/walk/structureOfPlan.ts', 'store/lexicon/canonical/chrome.ts', 'store/lexicon/overrides/arborReorg.ts', 'store/lexicon/overrides/fluxReorg.ts'];
const SOURCES = Object.fromEntries(FILES.map((f) => [f, read(f)]));

/** A tiny loader: the real modules, their relative imports resolved from src (with `src` overriding a file's text). */
function loader(src) {
  const cache = new Map();
  const load = (rel) => {
    if (cache.has(rel)) return cache.get(rel).exports;
    const code = src[rel] ?? read(rel);
    if (!code) throw new Error('no module ' + rel);
    const out = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const m = { exports: {} };
    cache.set(rel, m);
    new Function('require', 'module', 'exports', out)((p) => load(path.posix.join(path.posix.dirname(rel), p) + '.ts'), m, m.exports);
    return m.exports;
  };
  return load;
}

const card = (id, text, extra = {}) => ({ id, kind: 'text', x: 0, y: 0, w: 0.3, h: 0.1, z: 1, text, ...extra });
// a small grouped Plan: two Acts, three steps, one pin
const plan = () => [
  card('a1', 'Act One', { seq: 0 }),
  card('s1', 'Opening\nShe tends the orchard.', { seq: 1, parentId: 'a1' }),
  card('s2', 'Inciting Incident', { seq: 2, parentId: 'a1', planHint: 'What knocks life off course?' }),
  card('a2', 'Act Two', { seq: 3 }),
  card('s3', 'Midpoint', { seq: 4, parentId: 'a2' }),
  { id: 'p1', kind: 'page-pin', x: 0, y: 0, w: 0.3, h: 0.1, z: 1, entryId: 'e', seq: 5 },
];

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 220) }; } };
  const load = loader(src);

  t('MARKS', () => {
    const M = load('store/textMarks.ts');
    const base = card('c', 'Midpoint\nShe finds the ledger today');
    const at = base.text.indexOf('ledger');
    const bold = M.toggleCardMark(base, at, at + 6, 'b');
    const same = bold.text === base.text && J(bold.textMarks) === J([{ start: at, end: at + 6, b: true }]);
    const off = M.toggleCardMark(bold, at, at + 6, 'b');
    const gone = !('textMarks' in off) && off.text === base.text;
    const word = (c) => (c.textMarks ?? []).map((m) => c.text.slice(m.start, m.end)).join('|');
    const before = M.withCardText(bold, 'Midpoint\nAt night she finds the ledger today');
    const inside = M.withCardText(bold, 'Midpoint\nShe finds the ledXXger today');
    const justAfter = M.withCardText(bold, 'Midpoint\nShe finds the ledger! today');
    const justBefore = M.withCardText(bold, 'Midpoint\nShe finds the !ledger today');
    const deleted = M.withCardText(bold, 'Midpoint\nShe finds the today');
    const got = [word(before), word(inside), word(justAfter), word(justBefore), 'textMarks' in deleted];
    const both = M.toggleCardMark(M.toggleCardMark(base, 0, 8, 'i'), 3, 8, 'u');
    const split = J(both.textMarks) === J([{ start: 0, end: 3, i: true }, { start: 3, end: 8, i: true, u: true }]);
    return { pass: same && gone && J(got) === J(['ledger', 'ledXXger', 'ledger', 'ledger', false]) && split, detail: J({ same, gone, got, both: both.textMarks }) };
  });
  t('FACE', () => {
    const M = load('store/textMarks.ts');
    const text = 'a <b> & "c"\nbold word';
    const html = M.markedHtml(text, [{ start: 12, end: 16, b: true, s: true }]);
    const plain = html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    return { pass: plain === text && /<strong><s>bold<\/s><\/strong>/.test(html) && !/<b>/.test(html) && /BoardTextBox[\s\S]*markedHtml\(initialText, textMarks\)/.test(src['components/board/BoardBoxes.tsx']), detail: J(html) };
  });
  t('STEPS', () => {
    const S = load('reorg/walk/stepModel.ts');
    const boxes = plan().map((b) => (b.id === 's2' || b.id === 's1' ? { ...b, planSkipped: true } : b));
    const steps = S.walkSteps(boxes, new Set(), (id) => id === 's3');
    const view = steps.map((s) => [s.id, s.number, s.act, s.state]);
    const want = [['s1', 1, 'Act One', 'noted'], ['s2', 2, 'Act One', 'skipped'], ['s3', 3, 'Act Two', 'noted']];
    const flat = S.walkSteps([card('x', 'One', { seq: 0 }), card('y', 'Two', { seq: 1, planSkipped: true, planHint: 'h' })], new Set(), () => false).map((s) => [s.id, s.act, s.state, s.hint]);
    const hidden = S.walkSteps(plan(), new Set(['s2']), () => false).map((s) => s.id);
    const sum = S.walkSummary(steps);
    return { pass: J(view) === J(want) && J(flat) === J([['x', '', 'empty', ''], ['y', '', 'skipped', 'h']]) && J(hidden) === J(['s1', 's3']) && sum.noted === 2 && J(sum.skipped.map((s) => s.id)) === J(['s2']) && sum.next === 's2', detail: J({ view, flat, hidden, sum }) };
  });
  t('PLACE', () => {
    const S = load('reorg/walk/stepModel.ts');
    const steps = S.walkSteps(plan(), new Set(), () => false);
    const got = [S.placeIn(steps, 's3'), S.placeIn(steps, 'gone'), S.placeIn(steps, null), S.placeAfterDrop(steps, 's2'), S.placeAfterDrop(steps, 's3')];
    return { pass: J(got) === J(['s3', 's2', 's2', 's3', 's2']), detail: J(got) };
  });
  t('NOTE', () => {
    const O = load('reorg/walk/stepOps.ts');
    const boxes = plan().map((b) => (b.id === 's2' ? { ...b, planSkipped: true } : b));
    const w = O.setStepNote(boxes, 's2', 'A buyer arrives.');
    const s2 = w.find((b) => b.id === 's2');
    const cleared = O.setStepNote(w, 's2', '').find((b) => b.id === 's2');
    const marked = O.toggleStepMark(O.setStepNote(plan(), 's3', 'the ledger'), 's3', 4, 10, 'b').find((b) => b.id === 's3');
    return { pass: s2.text === 'Inciting Incident\nA buyer arrives.' && !('planSkipped' in s2) && !!s2.updatedAt && cleared.text === 'Inciting Incident' && w.filter((b, i) => b !== boxes[i]).length === 1 && marked.text === 'Midpoint\nthe ledger' && J(marked.textMarks) === J([{ start: 13, end: 19, b: true }]), detail: J({ s2, cleared, marked }) };
  });
  t('SKIP', () => {
    const O = load('reorg/walk/stepOps.ts');
    const on = O.setStepSkipped(plan(), 's2', true).find((b) => b.id === 's2');
    const off = O.setStepSkipped(O.setStepSkipped(plan(), 's2', true), 's2', false).find((b) => b.id === 's2');
    const noted = O.setStepSkipped(plan(), 's1', true).find((b) => b.id === 's1');
    return { pass: on.planSkipped === true && !('planSkipped' in off) && !('planSkipped' in noted), detail: J({ on, off, noted }) };
  });
  t('ADD', () => {
    const O = load('reorg/walk/stepOps.ts');
    const S = load('reorg/walk/stepModel.ts');
    const out = O.addStepAfter(plan(), 's1', 'A new step', () => 'n1');
    const end = O.addStepAtEnd(plan(), 'Coda', () => 'n2', 's3');
    const got = S.walkSteps(out, new Set(), () => false).map((s) => [s.id, s.act]);
    const last = S.walkSteps(end, new Set(), () => false).map((s) => [s.id, s.act]).pop();
    return { pass: J(got) === J([['s1', 'Act One'], ['n1', 'Act One'], ['s2', 'Act One'], ['s3', 'Act Two']]) && J(last) === J(['n2', 'Act Two']), detail: J({ got, last }) };
  });
  t('RENAME', () => {
    const P = load('reorg/backMenu/planOps.ts');
    const boxes = [card('c', 'Mid\nthe ledger', { textMarks: [{ start: 8, end: 14, b: true }] })];
    const out = P.renamePlanRow(boxes, 'c', 'The Midpoint')[0];
    return { pass: out.text === 'The Midpoint\nthe ledger' && out.text.slice(out.textMarks[0].start, out.textMarks[0].end) === 'ledger', detail: J(out) };
  });
  t('SITES', () => {
    const be = src['components/BoardEditor.tsx'], sp = src['reorg/split/SplitBoard.tsx'], po = src['reorg/backMenu/planOps.ts'];
    const got = { editor: /withCardText\(b, text\)/.test(be), split: (sp.match(/withCardText\(/g) ?? []).length >= 3, rename: /withCardText\(x, next\)/.test(po) };
    return { pass: got.editor && got.split && got.rename, detail: J(got) };
  });
  t('SAVED', () => {
    const ds = src['reorg/docSettings.ts'], pd = src['store/pageDefaults.ts'];
    const guard = /'walk' in patch/.test(ds);
    const stripped = /const \{[^}]*\bwalk\b[^}]*\.\.\.dress \}/.test(pd);
    return { pass: guard && stripped, detail: J({ guard, stripped }) };
  });
  t('HELD', () => {
    const w = src['reorg/walk/GuideWalk.tsx'];
    const got = { on: /setAttribute\('inert', ''\)/.test(w), off: /return \(\) => \{[\s\S]{0,200}removeAttribute\('inert'\)/.test(w), caret: /caret && back\.contains\(caret\.startContainer\) \? caret/.test(w), keys: /e\.stopPropagation\(\);\s*\/\/ nothing leaves the walk/.test(w) };
    return { pass: Object.values(got).every(Boolean), detail: J(got) };
  });
  t('BACK', () => {
    const h = src['reorg/walk/WalkHost.tsx'];
    const got = { born: /pageOfPath\(pathname\)/.test(h), unborn: /pathname === '\/page\/new' \? new URLSearchParams\(search\)\.get\('binder'\)/.test(h) && /newInDoc === docOfPage\(left\)/.test(h) };
    return { pass: got.born && got.unborn, detail: J(got) };
  });
  t('SCENES', () => {
    const O = load('reorg/walk/stepOps.ts');
    const S = load('reorg/walk/stepModel.ts');
    let n = 0;
    const made = O.addScenesUnder(plan(), 's1', 2, { title: 'Scene', question: 'Who wants what?', newId: () => 'c' + (++n) });
    const kids = made.filter((b) => b.parentId === 's1');
    const view = S.walkSteps(made, new Set(), () => false).map((s) => [s.id, s.act, s.under ?? '', s.state, s.hint]);
    const again = O.addScenesUnder(made, 'c1', 2, { title: 'Scene', question: 'q', newId: () => 'z' });
    const after = O.addStepAfter(made, 'c1', 'New step', () => 'c9').find((b) => b.id === 'c9');
    const flat = [card('x', 'One', { seq: 0, planHint: 'h' }), card('y', 'Two', { seq: 1, planHint: 'h' })];
    const flatView = S.walkSteps(O.addScenesUnder(flat, 'x', 1, { title: 'Scene', question: 'q', newId: () => 'k' }), new Set(), () => false).map((s) => s.id);
    const want = [['s1', 'Act One', '', 'noted', ''], ['c1', 'Act One', 'Opening', 'empty', 'Who wants what?'], ['c2', 'Act One', 'Opening', 'empty', 'Who wants what?'], ['s2', 'Act One', '', 'empty', 'What knocks life off course?'], ['s3', 'Act Two', '', 'empty', '']];
    return { pass: kids.length === 2 && kids[0].text === 'Scene 1\n' && kids[1].text === 'Scene 2\n' && J(view) === J(want) && again === made && after.parentId === 's1' && after.prompt === 'Who wants what?' && J(flatView) === J(['x', 'k', 'y']), detail: J({ view, flatView, after, same: again === made }) };
  });
  t('WHICH', () => {
    const W = load('reorg/walk/structureOfPlan.ts');
    const P = load('reorg/backMenu/planPresets.ts').PLAN_PRESETS;
    const word = (k) => k;
    const cards = (id) => P.find((p) => p.id === id).rows.map((r, i) => card('r' + i, word(r.title), { seq: i }));
    const got = [W.structureOfPlan(cards('circle'), word)?.id, W.structureOfPlan(cards('three'), word)?.id, W.structureOfPlan(cards('circle').slice(0, -1).concat(card('mine', 'My own', { seq: 20 })), word)?.id, W.structureOfPlan(plan(), word) ?? null];
    // a Plan of her own that happens to share one name with a structure is not that structure
    const one = W.structureOfPlan([cards('circle')[0], card('m1', 'Mine', { seq: 1 }), card('m2', 'Also mine', { seq: 2 })], word) ?? null;
    return { pass: J(got) === J(['circle', 'three', 'circle', null]) && one === null, detail: J({ got, one: one?.id ?? null }) };
  });
  t('DROP', () => {
    const w = src['reorg/walk/GuideWalk.tsx'];
    const got = { any: /const canDrop = !!step;/.test(w), scenes: /stashDeletedBoxes\(plan\.boardId, \[step\.id, \.\.\.scenesOf\(step\.id\)\]\)/.test(w), undo: /dropped\.ids\.forEach\(\(id\) => restoreDeletedBox\(dropped\.boardId, id\)\)/.test(w) };
    return { pass: Object.values(got).every(Boolean), detail: J(got) };
  });
  t('TABS', () => {
    const w = src['reorg/walk/GuideWalk.tsx'];
    const locked = w.match(/<button[^>]*data-locked="true"[^>]*>/g) ?? [];
    const ok = locked.length === 1 && /aria-disabled="true"/.test(locked[0]) && /tabIndex=\{-1\}/.test(locked[0]) && /aria-describedby="wz-walk-locked-note"/.test(locked[0]) && /id="wz-walk-locked-note"/.test(w) && /\['reorgBackPlan', 'drawerLinks'\]/.test(w) && !/data-locked="true"[^>]*onClick/.test(w);
    return { pass: ok, detail: J(locked) };
  });
  t('THEMES', () => {
    const canon = src['store/lexicon/canonical/chrome.ts'], a = src['store/lexicon/overrides/arborReorg.ts'], f = src['store/lexicon/overrides/fluxReorg.ts'];
    const word = (text, k) => { const m = new RegExp('^\\s*' + k + ":\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|\"([^\"]*)\")", 'm').exec(text); return m ? (m[1] ?? m[2]).replace(/\\'/g, "'") : null; };
    const TABLE = {
      guideWalkHead: ['Guide · Walk', 'The Guide', 'GUIDE // WALK'],
      guideWalkStepOf: ['Step {n} of {total}', 'step {n} of {total}', 'STEP {n}/{total}'],
      guideWalkKept: ['Saved in Plan', 'kept in your plan', 'SAVED TO SPINE'],
      guideWalkStateNoted: ['Noted', 'noted', 'NOTED'], guideWalkStateSkipped: ['Skipped', 'skipped', 'SKIPPED'], guideWalkStateEmpty: ['Empty', 'empty', 'NO INPUT'],
      guideWalkContinue: ['Continue Your Guide', 'Continue your Guide', 'Resume guide'],
      guideWalkNotSkipped: ['Not Skipped', 'Not skipped', 'CLEAR SKIP'],
      guideWalkPlaceholder: ['Note this step in your own words…', 'Jot it down in your own words…', 'Type the beat in your own words…'],
      guideWalkWrite: ['Write This Part →', 'Write this section →', 'Write this track →'],
      guideWalkOpenPlan: ['Walk the Plan ›', 'Walk the plan ›', 'Walk the spine ›'],
      guideWalkChip: ['Guide · {step} · {n} of {total}', 'The Guide · {step} · {n} of {total}', 'GUIDE · {step} · {n}/{total}'],
      guideStartGuided: ['Start Guided', 'Start guided', 'START GUIDED'], guideStartWriting: ['Start Writing', 'Start writing', 'Start writing'],
      guideWalkFormatHead: ['Format · Your Note on This Step', 'Format · your note on this step', "MARKUP · THIS STEP'S NOTE"],
    };
    const bad = Object.entries(TABLE).flatMap(([k, [m, ar, fl]]) => { const got = [word(canon, k), word(a, k), word(f, k)]; return J(got) === J([m, ar, fl]) ? [] : [[k, got]]; });
    return { pass: bad.length === 0, detail: J(bad.slice(0, 4)) };
  });
  return R;
}

const green = suite(SOURCES);
const sub = (f, from, to) => (s) => (s[f].includes(from) ? { ...s, [f]: s[f].split(from).join(to) } : null);
const M = 'store/textMarks.ts', S = 'reorg/walk/stepModel.ts', O = 'reorg/walk/stepOps.ts';
const MUTANTS = [
  ['typing at a mark\'s start joins the mark', 'MARKS', sub(M, 'x >= oldEnd ? x + delta : newEnd', 'x <= from ? x : x >= oldEnd ? x + delta : newEnd')],
  ['a mark over deleted text is kept', 'MARKS', sub(M, '.filter((m) => m.end > m.start)', '')],
  ['the face lets markup through', 'FACE', sub(M, ".replace(/</g, '&lt;')", '')],
  ['a written Part does not make a step noted', 'STEPS', sub(S, '|| written(r.boxId)', '')],
  ['a noted step still reads skipped', 'STEPS', sub(S, "noted ? 'noted' : box.planSkipped ? 'skipped'", "box.planSkipped ? 'skipped' : noted ? 'noted'")],
  ['the saved place is ignored', 'PLACE', sub(S, 'if (saved) return saved.id;', '')],
  ['a note keeps the step skipped', 'NOTE', sub(M, 'if (splitOutlineText(next).body.trim()) delete out.planSkipped;', '')],
  ['a noted step can be skipped', 'SKIP', sub(O, 'if (on && splitOutlineText(card.text).body.trim()) return boxes;', '')],
  ['a new step loses its heading', 'ADD', sub(O, '...(after.parentId ? { parentId: after.parentId } : {}),', '')],
  ['the Plan rename drops the marks\' place', 'RENAME', sub('reorg/backMenu/planOps.ts', '...withCardText(x, next)', '...x, text: next')],
  ['the board editor writes bare text', 'SITES', sub('components/BoardEditor.tsx', 'withCardText(b, text)', '{ ...b, text }')],
  ['the walk place is copied to new pages', 'SAVED', sub('store/pageDefaults.ts', 'walk, lengthLimit, ...dress', 'lengthLimit, ...dress')],
];

MUTANTS.push(
  ['a step with scenes turns into a heading', 'SCENES', sub(S, '&& !scened', '')],
  ['scenes may be nested twice', 'SCENES', sub(O, 'if (!parent || isScene(parent)) return boxes;', 'if (!parent) return boxes;')],
  ['any two shared names pick a structure', 'WHICH', sub('reorg/walk/structureOfPlan.ts', 'ENOUGH = 0.6', 'ENOUGH = 0.01')],
  ['a noted step cannot be dropped', 'DROP', sub('reorg/walk/GuideWalk.tsx', 'const canDrop = !!step;', "const canDrop = !!step && step.state !== 'noted';")],
  ['a locked tab is in the Tab order', 'TABS', sub('reorg/walk/GuideWalk.tsx', 'data-locked="true" tabIndex={-1}', 'data-locked="true" tabIndex={0}')],
  ['a Flux word falls back to Machina\'s', 'THEMES', sub('store/lexicon/overrides/fluxReorg.ts', "guideWalkKept: 'SAVED TO SPINE',", '')],
  ['the page behind the walk is left live', 'HELD', sub('reorg/walk/GuideWalk.tsx', "app?.setAttribute('inert', '');", '')],
  ['leaving forgets to lift it', 'HELD', sub('reorg/walk/GuideWalk.tsx', "app?.removeAttribute('inert');", '')],
  ['the chip is lost on a new Part', 'BACK', sub('reorg/walk/WalkHost.tsx', ' || (newInDoc && newInDoc === docOfPage(left))', '')],
);

const results = [];
const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
for (const [name, v] of Object.entries(green)) check(name, v.pass, v.detail);
for (const [label, expect, mut] of MUTANTS) {
  const m = mut(SOURCES);
  const red = m ? Object.entries(suite(m)).filter(([, v]) => !v.pass).map(([k]) => k) : [];
  check('MUTANT: ' + label, !!m && red.includes(expect), J({ landed: !!m, red }));
}
let fail = 0;
for (const c of results) { if (!c.pass) fail++; console.log((c.pass ? 'PASS  ' : 'FAIL  ') + c.name + (c.pass ? '' : '   ' + c.detail)); }
console.log(fail ? `\nREORG-GUIDE-WALK-UNIT VERIFY: FAIL - ${fail}/${results.length} failed` : `\nREORG-GUIDE-WALK-UNIT VERIFY: PASS (${results.length} checks)`);
process.exit(fail ? 1 : 0);
