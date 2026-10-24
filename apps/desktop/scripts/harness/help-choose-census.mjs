// W4 "HELP ME CHOOSE" - THE CENSUS HALF (browserless; Fable's brief Oct 23, Downloads\w4-help-me-choose-brief.md; content: Downloads\w3-deck-content.md §3 + the rulings at its top).
// WRITTEN BEFORE THE BUILD (red on main): there is no src/decks/helpMeChoose.ts yet, so every check reads FAIL (never a crash) until the module exists.
// This file is the CONTRACT as much as the test - the module is written to meet it. The DOM half (Arbor's librarian, Flux's RUN DIAGNOSTIC, Esc/focus, "Begin" dealing in the current Drawer, the
// dress, the lime line by thirds, the slide timing) is help-choose.mjs's, on a box turn.
//
// THE MODULE'S CONTRACT (src/decks/helpMeChoose.ts - pure, no React, no storage):
//   export const Q1: readonly string[]                        the ten Q1 answer ids, in the doc's order
//   export const Q3: readonly string[]                        ['little', 'shape', 'everything']
//   export function q2Options(q1: string): readonly string[]  Q2's answer ids for that Q1 ([] when there is no second question)
//   export function pickFor(q1: string, q2: string | null): { pick: Choice; alt: Choice | null; browse: true }
//        Choice = { deck: string /* a DeckDefinition.id in decks/library */, answers: Record<string, string> /* the deck's OWN deal answers (questionId -> option id), {} when the deck asks */ }
//   export const WALK_SHIPPED: boolean                         the ONE switch: false until W1 (the Walk) has merged - then every Q3 answer opens as Open
//   export function q3Landing(q3: string, walkShipped?: boolean): { view: 'walk' | 'open'; helpOpen: boolean }
//   export function whyKeyFor(c: Choice): string               the lexicon key of that pick's "why" line (helpWhy<Pick>)
//   Bound to W3's real registry (decks/library/index.ts DECKS, merged in train #6): every Choice is validated against it below - a deck id that does not exist, or an answer the deck does not ask, FAILS.
//
// RULED (Fable, Oct 24): H1 - "a novel or novella" -> Three-Act deals with answers {} (the deck asks Novel vs Novella itself); H2 - Feature Story's Q2 answers map a person -> profile, a trend -> trend,
//   something I found -> investigative (the deck's own option ids). "Fifteen Beats (Feature, with the Pilot note)" is the deck's OWN pilot option: feature-screenplay { form: 'pilot' } (it deals the Feature
//   beats and carries the Pilot note natively - nothing for W4 to add).
//
// Run (repo root):  node apps/desktop/scripts/harness/help-choose-census.mjs        (W4_REPO=<worktree> to read another checkout)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.W4_REPO || join(here, '..', '..', '..', '..'));
const DESKTOP = join(REPO, 'apps', 'desktop');
const SRC = join(DESKTOP, 'src');
const MODULE = join(SRC, 'decks', 'helpMeChoose.ts');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 240) : '')); };

// ------------------------------------------------------------------ the ORACLE: the content doc's §3, transcribed (this file is the independent reading - the module is checked against it, never against itself)
const Q1 = ['novel', 'short-story', 'screenplay', 'essay', 'research-paper', 'thesis', 'proposal', 'article', 'world-or-cast', 'poems'];
const FICTION = ['person-change', 'events-pressure', 'world-system', 'relationship-cast', 'image-voice'];
const Q2 = {
  novel: FICTION, 'short-story': FICTION,
  screenplay: ['feature', 'pilot'],
  essay: ['position', 'question'],
  'research-paper': ['question-method', 'argument-chapters'], thesis: ['question-method', 'argument-chapters'],
  proposal: ['problem-solution', 'funder-priorities'],
  article: ['person', 'trend', 'found'],
  'world-or-cast': ['world', 'people'],
  poems: [],
};
const Q3 = ['little', 'shape', 'everything'];
const C = (deck, answers = {}) => ({ deck, answers });
const SC = C('story-circle'), HJ = C('hero-journey'), FB = (form) => C('feature-screenplay', { form }), WB = C('worldbuilding'), CS = (count) => C('character-study', count ? { count } : {}), MP = C('from-my-pages'), SS = C('scene-sequel');
const TA = (format) => C('three-act', format ? { format } : {}), AE = (length) => C('argument-essay', { length }), RP = C('research-paper'), TH = (field) => C('thesis', { field }), BP = C('business-proposal'), GA = C('grant'), FS = (kind) => C('feature-story', { kind });
// [q1, q2, pick, alt]
const TABLE = [
  ['novel', 'person-change', SC, HJ], ['novel', 'events-pressure', TA(), FB('novel')], ['novel', 'world-system', WB, HJ], ['novel', 'relationship-cast', CS(), SC], ['novel', 'image-voice', MP, TA()],
  ['short-story', 'person-change', SC, TA('short-story')], ['short-story', 'events-pressure', TA('short-story'), SS], ['short-story', 'world-system', WB, TA('short-story')],
  ['short-story', 'relationship-cast', CS('two'), SS], ['short-story', 'image-voice', MP, SS],
  ['screenplay', 'feature', FB('feature'), SS], ['screenplay', 'pilot', FB('pilot'), SS],
  ['essay', 'position', AE('full'), MP], ['essay', 'question', MP, AE('short')],
  ['research-paper', 'question-method', RP, TH('sciences')], ['research-paper', 'argument-chapters', TH('humanities'), RP],
  ['thesis', 'question-method', TH('sciences'), RP], ['thesis', 'argument-chapters', TH('humanities'), AE('full')],
  ['proposal', 'problem-solution', BP, GA], ['proposal', 'funder-priorities', GA, BP],
  ['article', 'person', FS('profile'), MP], ['article', 'trend', FS('trend'), MP], ['article', 'found', FS('investigative'), MP],
  ['world-or-cast', 'world', WB, CS()], ['world-or-cast', 'people', CS(), WB],
  ['poems', null, MP, null],
];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// a Choice normalised for comparison: { deck, answers } with answers' keys sorted
const norm = (c) => (c == null ? null : { deck: c.deck, answers: Object.fromEntries(Object.entries(c.answers || {}).sort(([a], [b]) => (a < b ? -1 : 1))) });

// ------------------------------------------------------------------ bundling (esbuild CLI, the real source)
const pnpmDir = join(REPO, 'node_modules', '.pnpm');
const esbBin = () => join(pnpmDir, readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)), 'node_modules', 'esbuild', 'bin', 'esbuild');
const tmps = [];
function bundleFile(entry) {
  mkdirSync(join(DESKTOP, 'node_modules', '.cache'), { recursive: true });
  const tmp = mkdtempSync(join(DESKTOP, 'node_modules', '.cache', 'wz-w4-')); tmps.push(tmp);
  const out = join(tmp, 'bundle.mjs');
  execFileSync(process.execPath, [esbBin(), entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=error', '--external:@fontsource/*', '--external:@fontsource-variable/*',
    '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true'], { stdio: 'pipe', cwd: DESKTOP });
  return out;
}
async function load(entry) {
  if (!existsSync(entry)) return { err: `${entry.replace(REPO, '')} does not exist (red on main, as written)` };
  try {
    globalThis.window = globalThis; globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };
    return { m: await import(pathToFileURL(bundleFile(entry)).href + `?t=${Date.now()}-${Math.random()}`) };
  } catch (e) { return { err: String((e && e.message) || e).split('\n')[0].slice(0, 200) }; }
}
const run = async (fn) => { try { return await fn(); } catch (e) { return { threw: String((e && e.message) || e).slice(0, 160) }; } };

const L = await load(MODULE);
const m = L.m || null;
ok('(premise) the module src/decks/helpMeChoose.ts exists and bundles', !!m, L.err || Object.keys(m).join(','));

// C1 - the question lists
ok('C1: Q1 is the ten answers, in the doc\'s order', !!m && same(m.Q1, Q1), m ? JSON.stringify(m.Q1) : '');
ok('C1: Q3 is little / shape / everything', !!m && same(m.Q3, Q3), m ? JSON.stringify(m.Q3) : '');
// C2 - Q2 depends on Q1
{
  const got = m ? await run(() => Object.fromEntries(Q1.map((q) => [q, m.q2Options(q)]))) : null;
  ok('C2: Q2\'s answers are the doc\'s, per Q1 (fiction x5 / screenplay 2 / essay 2 / research+thesis 2 / proposal 2 / article 3 / world-or-cast 2 / poems none)', !!got && !got.threw && Q1.every((q) => same(got[q], Q2[q])), JSON.stringify(got).slice(0, 200));
  ok('C2: Q2 DEPENDS on Q1 - at least seven distinct answer sets, and the fiction Q1s share one', !!got && !got.threw && new Set(Q1.map((q) => JSON.stringify(got[q]))).size >= 7 && same(got.novel, got['short-story']), '');
}
// C3 - the census: every Q1 x Q2 combination -> the right pick + alternative
{
  const bad = []; let seen = 0;
  for (const [q1, q2, pick, alt] of TABLE) {
    const r = m ? await run(() => m.pickFor(q1, q2)) : null;
    seen += 1;
    if (!r || r.threw || !same(norm(r.pick), norm(pick)) || !same(norm(r.alt), norm(alt)) || r.browse !== true) bad.push(`${q1}/${q2}: ${r && r.threw ? r.threw : JSON.stringify(r)}`);
  }
  ok(`C3: the full pick table as a census - all ${TABLE.length} rows (every Q1 x Q2 combination, poems with no Q2) return the doc's pick and alternative, and "browse all" as the third line`, !!m && bad.length === 0 && seen === TABLE.length, bad.slice(0, 3).join(' || '));
  ok('C3: the census is COMPLETE - the oracle covers every Q1 x its Q2 set (a missing row would be invisible to a green run)', Q1.every((q) => (Q2[q].length === 0 ? TABLE.some((r) => r[0] === q && r[1] === null) : Q2[q].every((a) => TABLE.some((r) => r[0] === q && r[1] === a))))
    && TABLE.length === 26, `${TABLE.length} rows (5 + 5 fiction, 2 + 2 + 2 + 2 + 2 + 3 + 2, 1 poems)`);
  ok('C3: a pick is never its own alternative', TABLE.every(([, , p, a]) => a === null || !same(norm(a), norm(p))), '');
  ok('C3: Poems has NO alternative until the Verse Shape ships (W8): pick From my pages, alt null', !!m && (() => { const r = m.pickFor('poems', null); return r && r.pick.deck === 'from-my-pages' && r.alt === null; })(), '');
  ok('C3: the Pilot answer deals the deck\'s OWN pilot option (feature-screenplay, form: pilot - the Feature beats with the Pilot note, natively)', !!m && (() => { const r = m.pickFor('screenplay', 'pilot'); return r && same(norm(r.pick), norm(FB('pilot'))); })(), '');
  ok('C3 (H1, ruled): "a novel or novella" deals Three-Act with NO answers - the deck asks Novel vs Novella itself', !!m && (() => { const r = m.pickFor('novel', 'events-pressure'); return r && r.pick.deck === 'three-act' && Object.keys(r.pick.answers || {}).length === 0; })(), '');
}
// C9 - bound to the REAL registry (W3's decks/library, merged in train #6): every deck id exists and every answer is one the deck actually asks
{
  const R = await load(join(SRC, 'decks', 'library', 'index.ts'));
  const DECKS = R.m ? R.m.DECKS : null;
  const choices = [...new Map(TABLE.flatMap(([, , p, a]) => [p, a]).filter(Boolean).map((c) => [JSON.stringify(norm(c)), c])).values()];
  const problems = [];
  for (const c of choices) {
    const d = DECKS && DECKS.find((x) => x.id === c.deck);
    if (!d) { problems.push(`no deck ${c.deck}`); continue; }
    for (const [qid, oid] of Object.entries(c.answers || {})) {
      const q = d.questions.find((x) => x.id === qid);
      if (!q || !q.options.some((o) => o.id === oid)) problems.push(`${c.deck}: ${qid}=${oid} is not a question/option of that deck`);
    }
  }
  ok(`C9: every pick and alternative in the table (${choices.length} distinct) names a REAL deck in W3's registry and only answers that deck asks`, !!DECKS && problems.length === 0 && choices.length >= 17, problems.slice(0, 3).join(' | ') || (R.err || ''));
  if (m && DECKS) {
    const live = [];
    for (const [q1, q2] of TABLE) { const r = await run(() => m.pickFor(q1, q2)); for (const c of [r && r.pick, r && r.alt]) if (c && !c.threw && !DECKS.some((d) => d.id === c.deck)) live.push(c.deck); }
    ok('C9: ...and the MODULE\'s own output only ever names registered decks', live.length === 0, live.join(','));
  } else ok('C9: ...and the MODULE\'s own output only ever names registered decks', false, 'module absent');
}
// C4 - determinism
{
  let twice = false, shuffled = false;
  if (m) {
    const a = await run(() => TABLE.map(([q1, q2]) => norm(m.pickFor(q1, q2).pick)));
    const b = await run(() => TABLE.map(([q1, q2]) => norm(m.pickFor(q1, q2).pick)));
    twice = !a.threw && !b.threw && same(a, b);
    const order = [...TABLE.keys()].sort((x, y) => ((x * 7) % 26) - ((y * 7) % 26));
    const c = await run(() => order.map((i) => [i, norm(m.pickFor(TABLE[i][0], TABLE[i][1]).pick)]).sort((p, q) => p[0] - q[0]).map((x) => x[1]));
    shuffled = !c.threw && same(a, c);
  }
  ok('C4: determinism - the same answers give the same result twice, and in any order of asking', twice && shuffled, `twice=${twice} shuffled=${shuffled}`);
}
// C5 - nothing stored, nothing random: run the module with traps on every ambient the brief forbids
{
  let touched = [];
  if (m) {
    const trap = (name) => ({ get() { touched.push(name); throw new Error('touched ' + name); }, configurable: true });
    const saved = {};
    for (const k of ['localStorage', 'sessionStorage', 'indexedDB', 'fetch']) { saved[k] = Object.getOwnPropertyDescriptor(globalThis, k); Object.defineProperty(globalThis, k, trap(k)); }
    const rand = Math.random; Math.random = () => { touched.push('Math.random'); throw new Error('touched Math.random'); };
    const now = Date.now; Date.now = () => { touched.push('Date.now'); throw new Error('touched Date.now'); };
    try { for (const [q1, q2] of TABLE) { m.pickFor(q1, q2); m.q2Options(q1); } for (const q of Q3) { m.q3Landing(q, true); m.q3Landing(q, false); } } catch { /* recorded in touched */ }
    Math.random = rand; Date.now = now;
    for (const k of Object.keys(saved)) { if (saved[k]) Object.defineProperty(globalThis, k, saved[k]); else delete globalThis[k]; }
  }
  ok('C5: nothing stored, nothing varying - the whole module runs with localStorage / sessionStorage / indexedDB / fetch / Math.random / Date.now all trapped, and touches none', !!m && touched.length === 0, touched.join(','));
  const text = existsSync(MODULE) ? readFileSync(MODULE, 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '') : '';
  ok('C5: and the source names none of them (no storage key, no sync, no timer, no model)', !!m && !/localStorage|sessionStorage|indexedDB|fetch\(|Math\.random|Date\.now|new Date|setTimeout|XMLHttpRequest|\bsync\b/.test(text), '');
}
// C6 - Q3 and the W1-absent fallback
{
  const WALK = m ? await run(() => Object.fromEntries(Q3.map((q) => [q, m.q3Landing(q, true)]))) : null;
  const OPEN = m ? await run(() => Object.fromEntries(Q3.map((q) => [q, m.q3Landing(q, false)]))) : null;
  ok('C6: Q3 with the Walk shipped - "a little" opens the Walk with the first step\'s "?" open; "the shape" the Walk, "?" closed; "everything" Open (the table), no Walk',
    !!WALK && !WALK.threw && same(WALK.little, { view: 'walk', helpOpen: true }) && same(WALK.shape, { view: 'walk', helpOpen: false }) && same(WALK.everything, { view: 'open', helpOpen: false }), JSON.stringify(WALK));
  ok('C6: the W1-ABSENT fallback - with the Walk not shipped, ALL THREE answers open as Open, the "?" closed', !!OPEN && !OPEN.threw && Q3.every((q) => same(OPEN[q], { view: 'open', helpOpen: false })), JSON.stringify(OPEN));
  const text = existsSync(MODULE) ? readFileSync(MODULE, 'utf8').replace(/\r\n/g, '\n') : '';
  const flags = [...text.matchAll(/export const WALK_SHIPPED(?::\s*boolean)?\s*=\s*(true|false)\s*;/g)];
  ok('C6: the switch is ONE line - exactly one `export const WALK_SHIPPED = <boolean>;`, and q3Landing\'s default reads it (a one-line change when W1 lands)', flags.length === 1 && /q3Landing\([^)]*walkShipped(?::\s*boolean)?\s*=\s*WALK_SHIPPED/.test(text), `${flags.length} declaration(s)`);
  ok('C6: until W1 merges the shipped value is false (the fallback is the default, not an opt-in)', flags.length === 1 && flags[0][1] === 'false' && !!m && m.WALK_SHIPPED === false, flags[0] ? flags[0][1] : '');
}
// C7 - the "why" lines: one per distinct pick, in the lexicon, one short sentence
{
  const picks = [...new Map(TABLE.map(([, , p]) => [JSON.stringify(norm(p)), norm(p)])).values()];
  const keys = m ? await run(() => picks.map((p) => m.whyKeyFor(p))) : null;
  let lexicon = {};
  try { const raw = readFileSync(join(SRC, 'store', 'deskLexicon.ts'), 'utf8'); for (const k of (keys && !keys.threw ? keys : [])) { const mm = new RegExp(`^  ${k}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1,`, 'm').exec(raw); if (mm) lexicon[k] = mm[2]; } } catch { /* the checks record it */ }
  const names = keys && !keys.threw ? keys : [];
  ok(`C7: every distinct pick (${picks.length}) has its own helpWhy<Pick> key, none shared`, !!keys && !keys.threw && names.length === picks.length && new Set(names).size === picks.length && names.every((k) => /^helpWhy[A-Z]/.test(k)), JSON.stringify(names).slice(0, 160));
  ok('C7: each key is in the Arbor lexicon as ONE short sentence (a capital, one terminal stop, <= 18 words) - Fable reviews the strings with the screens', names.length === picks.length && names.every((k) => { const s = lexicon[k]; return typeof s === 'string' && /^[A-Z]/.test(s) && /[.]$/.test(s) && (s.match(/[.!?](\s|$)/g) || []).length === 1 && s.split(/\s+/).length <= 18; }), `${Object.keys(lexicon).length}/${picks.length} present`);
}
// C8 - it never opens itself: the module is inert on import; the live trigger is a single press (the DOM half proves the press). Here: no auto-open path in the source.
{
  const text = existsSync(MODULE) ? readFileSync(MODULE, 'utf8') : '';
  ok('C8: the module is pure data and functions - no React, no effect, no listener, nothing that could open a panel by itself', !!m && !/from 'react'|useEffect|addEventListener|document\.|window\./.test(text.replace(/\/\/.*$/gm, '')), '');
}

// C10 - the panel never opens itself and stores nothing (source half; the DOM half is help-choose.mjs D1 / L2)
{
  const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const panel = existsSync(join(SRC, 'components', 'HelpMeChoose.tsx')) ? strip(readFileSync(join(SRC, 'components', 'HelpMeChoose.tsx'), 'utf8')) : '';
  const STORAGE = /localStorage|sessionStorage|indexedDB|wrizo-|saveJournalEntry|scheduleFlush|setWritingSettings|fetch\(/;
  const mounts = ['components/SectionsPopout.tsx', 'components/DeckWizard.tsx'].map((f) => (existsSync(join(SRC, f)) ? strip(readFileSync(join(SRC, f), 'utf8')) : ''));
  // every <HelpMeChoose mount sits behind `{helpOpen &&`, and the only `setHelpOpen(true)` is inside an onClick
  const mountOk = (t) => (t.match(/<HelpMeChoose/g) || []).length === 1 && /\{helpOpen && <HelpMeChoose/.test(t) && (t.match(/setHelpOpen\(true\)/g) || []).length === 1 && /onClick=\{\(\) => setHelpOpen\(true\)\}/.test(t);
  ok('C10: the panel stores nothing - HelpMeChoose.tsx names no storage, sync or save path', panel.length > 0 && !STORAGE.test(panel), '');
  ok('C10: it NEVER opens itself - each of its two hosts mounts it exactly once, behind `{helpOpen &&`, and flips helpOpen to true ONLY from an onClick', mounts.every(mountOk), JSON.stringify(mounts.map(mountOk)));
  ok('C10: and it has no timer, no auto-open effect, no interval (the only effects are focus, Esc and focus-return)', panel.length > 0 && !/setTimeout|setInterval|requestAnimationFrame/.test(panel), '');
  const withStorage = STORAGE.test(panel + "\nlocalStorage.setItem('wrizo-help-seen','1');");
  const autoOpen = mountOk(mounts[0].replace('onClick={() => setHelpOpen(true)}', 'onClick={() => setHelpOpen(true)}').replace('{helpOpen && <HelpMeChoose', '{<HelpMeChoose'));
  ok('MUTANT: a localStorage write added to the panel - C10 must go RED (the mutation LANDED: the real panel is clean)', panel.length > 0 && !STORAGE.test(panel) && withStorage, '');
  ok('MUTANT: the panel mounted without its `helpOpen &&` gate (it would open by itself) - C10 must go RED (the mutation LANDED: the real host passes)', mountOk(mounts[0]) && !autoOpen, '');
}

// ------------------------------------------------------------------ MUTANTS: each rewrites the REAL module, asserts the mutation LANDED, bundles it, and re-runs the check it targets - which must go RED
if (m) {
  const moduleText = readFileSync(MODULE, 'utf8').replace(/\r\n/g, '\n');
  const mutated = async (name, from, to, redIf) => {
    const next = moduleText.replace(from, to);
    if (next === moduleText) { ok(`MUTANT: ${name} - the mutation LANDED`, false, 'did not land: ' + String(from).slice(0, 60)); return; }
    const dir = mkdtempSync(join(DESKTOP, 'node_modules', '.cache', 'wz-w4m-')); tmps.push(dir);
    const file = join(dir, 'helpMeChoose.ts'); writeFileSync(file, next);
    const r = await load(file);
    if (!r.m) { ok(`MUTANT: ${name} - the mutated module bundles (a crash is not a kill)`, false, r.err); return; }
    const red = await run(() => redIf(r.m));
    ok(`MUTANT: ${name} - its check must go RED (the mutation LANDED and the module still bundles)`, red === true, String(red && red.threw ? red.threw : red));
  };
  const rowsWrong = (mm) => TABLE.some(([q1, q2, pick, alt]) => { const r = mm.pickFor(q1, q2); return !same(norm(r.pick), norm(pick)) || !same(norm(r.alt), norm(alt)); });
  await mutated('Story Circle swapped for the Hero\'s Journey in the first row (C3)', "'novel/person-change': [STORY_CIRCLE, HERO]", "'novel/person-change': [HERO, STORY_CIRCLE]", rowsWrong);
  await mutated('the Pilot answer is dropped to the plain Feature form (C3)', "'screenplay/pilot': [beats('pilot'), SCENE_SEQUEL]", "'screenplay/pilot': [beats('feature'), SCENE_SEQUEL]", rowsWrong);
  await mutated('Poems gains an alternative before the Verse Shape exists (C3)', "'poems/': [MY_PAGES, null]", "'poems/': [MY_PAGES, SCENE_SEQUEL]", rowsWrong);
  await mutated('Q2 collapses to ONE shared answer list (C2: Q2 no longer depends on Q1)', "return Q2_BY_Q1[q1] ?? [];", "return FICTION;", (mm) => !same(mm.q2Options('poems'), Q2.poems) || !same(mm.q2Options('essay'), Q2.essay));
  await mutated('the Walk is declared shipped (C6: the W1-absent fallback)', 'export const WALK_SHIPPED = false;', 'export const WALK_SHIPPED = true;', (mm) => !same(mm.q3Landing('little'), { view: 'open', helpOpen: false }));
  await mutated('a Math.random tie-break is added to the pick (C5: nothing varying)', "const row = TABLE[`${q1}/${q2 ?? ''}`];", "const row = Math.random() < 2 ? TABLE[`${q1}/${q2 ?? ''}`] : undefined;", (mm) => { const rand = Math.random; let touched = false; Math.random = () => { touched = true; return 0; }; try { mm.pickFor('novel', 'person-change'); } finally { Math.random = rand; } return touched; });
  await mutated('a pick names a deck that does not exist (C9)', "const STORY_CIRCLE = C('story-circle');", "const STORY_CIRCLE = C('story-wheel');", (mm) => mm.pickFor('novel', 'person-change').pick.deck === 'story-wheel');
}

for (const t of tmps) rmSync(t, { recursive: true, force: true });
const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nHELP-CHOOSE-CENSUS VERIFY: PASS (${checks.length} checks)` : `\nHELP-CHOOSE-CENSUS VERIFY: FAIL - ${bad}/${checks.length} failed`);
process.exit(bad === 0 ? 0 : 1);
