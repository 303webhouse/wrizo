// THE WALK'S AI PANEL (PRESETS-B, Nov 27; guide-walk-spec.md section 3.8; Fable 11:00 am: "to TUTOR-B's contract"), BROWSERLESS: the real pure modules are transpiled and run; the wiring is read from the source.
//   FOUR    the four questions are the template's, never the AI's: the spec's wording, the kind word by structure, TUTOR-B's step forms; the same as the server's copy wherever that copy is present
//   KINDS   every preset the Plan can come from has a kind from the server's fixed list
//   BODY    the walk body holds only TUTOR-B's nine keys, the four required ones always (the note may be empty), the others only when they say something, each within its cap
//   WIRE    the ask is { messages, theme, walk } and no other key
//   THREAD  one thread a step: her question last, the reply after it; another step's thread never travels; a failure keeps her question and Try again replays it; one ask at a time; "not configured" = AI off
//   SILENT  it never speaks first: nothing asks but a press
//   FOCUS   a press leaves her in the box, never nowhere
//   NOSAVE  the ask saves nothing
//   KEYS    inside the panel her arrows and Page keys are the box's, never a step
//   PLAN    no known structure (a Plan of her own names), no AI offered
//   TABS    the AI tab is lit beside the two locked ones
//   WORDS   the spec's section 8 words, Arbor, Flux and Machina; what travels is said behind a "?"
// Run: node scripts/harness/reorg-walk-ai-unit.mjs   (from apps/desktop; browserless: needs no box turn)
// WALK_SERVER_PROMPTS=<path to a tutorPrompts.ts> compares against that copy (before the route is merged).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const SERVER = process.env.WALK_SERVER_PROMPTS || path.join(HERE, '..', '..', '..', 'server', 'src', 'tutorPrompts.ts');
const J = (v) => JSON.stringify(v);
const read = (p) => { try { return fs.readFileSync(path.join(SRC, p), 'utf8').split('\r\n').join('\n'); } catch { return ''; } };

let checks = 0; let fails = 0;
const ok = (cond, msg, detail = '') => { checks += 1; if (!cond) fails += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${!cond && detail ? `  [${String(detail).slice(0, 500)}]` : ''}`); };

/** The real modules, transpiled; `src` overrides a file's text (the mutants). */
function loader(src = {}) {
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
/** A law, and a mutant that must LAND and turn it red. */
async function law(name, fn, mutant) {
  let result; try { result = await fn(loader(), read); } catch (e) { result = String(e && e.message); }
  ok(result === true, name, result);
  if (!mutant) return;
  const [file, from, to] = mutant;
  const was = read(file);
  const landed = was.includes(from);
  const src = { [file]: was.split(from).join(to) };
  let red; try { red = (await fn(loader(src), (p) => src[p] ?? read(p))) !== true; } catch { red = true; }
  ok(landed && red, `  mutant of "${name.split(':')[0]}" lands and turns it red`, landed ? 'stayed green' : 'did not land');
}

const ASK = 'reorg/walk/walkAsk.ts';
const THREADS = 'reorg/walk/walkThreads.ts';
const PANEL = 'reorg/walk/WalkAi.tsx';
const WALK = 'reorg/walk/GuideWalk.tsx';
const API = 'store/api.ts';
const PRESETS = 'reorg/backMenu/planPresets.ts';
const KINDS = ['stories', 'essays', 'arguments', 'papers', 'scripts'];
const presetIds = () => loader()(PRESETS).PLAN_PRESETS.map((p) => p.id);

await law('FOUR: a Midpoint in Three-Act is asked the spec\'s four, in order', (load) => {
  const q = load(ASK).walkQuestions({ step: 'Midpoint', structure: 'Three-Act Structure', kind: 'stories', next: 'Crisis', previous: 'Rising Complications' });
  const want = ['What does a Midpoint do in Three-Act Structure?', 'Show me Midpoints in well-known stories', 'How is a Midpoint different from the Crisis?', 'Ask me questions about my Midpoint'];
  return J(q) === J(want) || J(q);
}, [ASK, 'in well-known', 'in famous']);

await law('FOUR: an awkward step name uses its own wording, and the last step is compared with the one before', (load) => {
  const { walkQuestions } = load(ASK);
  const back = walkQuestions({ step: 'The Road Back', structure: "The Hero's Journey", kind: 'stories', next: 'Resurrection' });
  const last = walkQuestions({ step: 'Resolution', structure: 'Three-Act Structure', kind: 'stories', previous: 'Climax' });
  return (back[0] === "What does the Road Back do in The Hero's Journey?" && back[1] === 'Show me examples of the Road Back in well-known stories' && last[2] === 'How is a Resolution different from the Climax?') || J([back, last]);
}, [ASK, "['road back', ['the Road Back', 'examples of the Road Back']],", '']);

await law('FOUR: the client\'s copy is the server\'s, for every preset row (where the server has the copy)', (load) => {
  let server = '';
  try { server = fs.readFileSync(SERVER, 'utf8'); } catch { return 'no server prompts file at ' + SERVER; }
  if (!server.includes('export function walkQuestions')) { console.log('      (the route is not in this tree yet: nothing to compare)'); return true; }
  const m = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(server, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(() => ({}), m, m.exports);
  const mine = load(ASK);
  const canon = fs.readdirSync(path.join(SRC, 'store/lexicon/canonical')).map((f) => read('store/lexicon/canonical/' + f)).join(String.fromCharCode(10));
  const words = Object.fromEntries([...canon.matchAll(/^\s*((?:reorgPre|deck)[A-Za-z0-9]+):\s*(["'])((?:\\.|(?!\2).)*)\2,/gm)].map((x) => [x[1], x[3].replace(/\\(.)/g, '$1')]));
  const off = [];
  let n = 0;
  for (const p of load(PRESETS).PLAN_PRESETS) {
    if (J(mine.WALK_KINDS[p.id]) !== J(m.exports.WALK_KINDS[p.id])) off.push(`kind ${p.id}`);
    p.rows.forEach((r, i) => {
      const step = words[r.title];
      if (!step) { off.push(`no words for ${r.title}`); return; }
      const input = { step, structure: words[p.name], kind: mine.WALK_KINDS[p.id], next: words[p.rows[i + 1]?.title], previous: words[p.rows[i - 1]?.title] };
      n += 1;
      if (J(mine.walkQuestions(input)) !== J(m.exports.walkQuestions(input))) off.push(step);
    });
  }
  console.log(`      (compared ${n} rows with ${SERVER === path.join(HERE, '..', '..', '..', 'server', 'src', 'tutorPrompts.ts') ? "the tree's server" : 'the named server file'})`);
  return (n > 80 && off.length === 0) || J(off.slice(0, 8));
});

await law('KINDS: every preset has a kind from the fixed list', (load) => {
  const { WALK_KINDS } = load(ASK);
  const bad = presetIds().filter((id) => !KINDS.includes(WALK_KINDS[id]));
  return bad.length === 0 || J(bad);
}, [ASK, "imrad: 'papers',", '']);

const FULL = { structure: 'Three-Act Structure', kind: 'stories', step: 'Midpoint', note: '', question: 'What changes the game halfway through?', about: '', before: 'Rising Complications', after: undefined };
await law('BODY: only the nine keys, the four required always, empty optional ones left out', (load) => {
  const b = load(ASK).walkBody({ ...FULL, extra: 'x' });
  return J(b) === J({ structure: 'Three-Act Structure', kind: 'stories', step: 'Midpoint', note: '', question: 'What changes the game halfway through?', before: 'Rising Complications' }) || J(b);
}, [ASK, 'if (v) body[key] = v.slice(0, cap);', 'body[key] = v.slice(0, cap);']);
await law('BODY: each field stays within the route\'s cap', (load) => {
  const long = 'x'.repeat(30000);
  const b = load(ASK).walkBody({ preset: long, structure: long, kind: 'stories', step: long, question: long, about: long, note: long, before: long, after: long });
  const got = Object.fromEntries(Object.entries(b).filter(([k]) => k !== 'kind').map(([k, v]) => [k, v.length]));
  return J(got) === J({ structure: 2000, step: 2000, note: 17000, preset: 2000, question: 4000, about: 4000, before: 2000, after: 2000 }) || J(got);
}, [ASK, 'note: input.note.slice(0, 17000)', 'note: input.note']);

await law('WIRE: the walk\'s ask is { messages, theme, walk } and nothing else', (load, file) => {
  const fn = /export async function apiTutorWalk\([\s\S]*?\n\}/.exec(file(API))?.[0] ?? '';
  return /postJson\('\/api\/tutor\/chat', \{ messages, theme: tutorThemeName\(\), walk \}\)/.test(fn) || fn.slice(0, 300) || 'no apiTutorWalk';
}, [API, 'theme: tutorThemeName(), walk }', 'theme: tutorThemeName(), walk, delta: undefined }']);

const reply = (text) => async () => ({ ok: true, configured: true, reply: text });
await law('THREAD: her question goes last, the reply follows, and another step\'s thread never travels', async (load) => {
  const T = load(THREADS);
  const sent = [];
  const send = async (messages, walk) => { sent.push({ messages, walk }); return { ok: true, configured: true, reply: `R${sent.length}` }; };
  await T.askWalk('p/a', 'one', { step: 'A' }, send);
  await T.askWalk('p/b', 'two', { step: 'B' }, send);
  await T.askWalk('p/a', 'three', { step: 'A' }, send);
  const want = [{ role: 'writer', text: 'one' }, { role: 'tutor', text: 'R1' }, { role: 'writer', text: 'three' }];
  return (J(sent[2].messages) === J(want) && J(sent[1].messages) === J([{ role: 'writer', text: 'two' }]) && T.walkThread('p/a').turns.length === 4) || J(sent);
}, [THREADS, 'const turns = walkThread(key).turns;', "const turns = [...threads.values()].flatMap((x) => x.turns);"]);
await law('THREAD: a failure keeps her question, and Try again sends the same ask', async (load) => {
  const T = load(THREADS);
  const sent = [];
  await T.askWalk('k', 'one', { step: 'A', note: 'then' }, async (m, w) => { sent.push([m, w]); return { ok: false, configured: true }; });
  const failed = { ...T.walkThread('k') };
  await T.retryWalk('k', async (m, w) => { sent.push([m, w]); return { ok: true, configured: true, reply: 'fine' }; });
  const t = T.walkThread('k');
  return (failed.status === 'error' && failed.turns.length === 1 && J(sent[0]) === J(sent[1]) && t.status === 'idle' && t.turns.length === 2) || J([failed, sent, t]);
}, [THREADS, "status: 'error'", "status: 'idle'"]);
await law('THREAD: one ask at a time for a step', async (load) => {
  const T = load(THREADS);
  let calls = 0; let release;
  const first = T.askWalk('k', 'one', { step: 'A' }, () => { calls += 1; return new Promise((r) => { release = r; }); });
  await T.askWalk('k', 'two', { step: 'A' }, reply('no'));
  release({ ok: true, configured: true, reply: 'r' });
  await first;
  return (calls === 1 && T.walkThread('k').turns.length === 2) || J([calls, T.walkThread('k')]);
}, [THREADS, "if (was.status === 'sending' || !question) return;", 'if (!question) return;']);
await law('THREAD: "not configured" turns the AI off and adds no reply', async (load) => {
  const T = load(THREADS);
  const before = T.walkAiOff();
  await T.askWalk('k', 'one', { step: 'A' }, async () => ({ ok: true, configured: false }));
  return (before === false && T.walkAiOff() === true && T.walkThread('k').turns.length === 1) || J([before, T.walkAiOff(), T.walkThread('k')]);
}, [THREADS, 'off = true;', '']);
await law('THREAD: a long thread is capped to the route\'s count and ends with her', async (load) => {
  const T = load(THREADS);
  let last = [];
  for (let i = 0; i < 14; i += 1) await T.askWalk('k', `q${i}`, { step: 'A' }, async (m) => { last = m; return { ok: true, configured: true, reply: `r${i}` }; });
  return (last.length <= 20 && last[0].role === 'writer' && last[last.length - 1].text === 'q13') || J([last.length, last[0], last[last.length - 1]]);
}, [THREADS, 'capTutorHistory(turns)', 'turns']);

await law('SILENT: nothing asks but a press', (load, file) => {
  const code = file(PANEL);
  if (!code) return 'no panel';
  const effects = code.match(/use(Layout)?Effect\([\s\S]*?\n  \}, \[[^\]]*\]\);/g) ?? [];
  const spoken = effects.filter((e) => /askWalk|retryWalk|apiTutorWalk|ask\(/.test(e));
  return (spoken.length === 0 && /onClick=\{\(\) => ask\(q\)\}/.test(code)) || J(spoken);
}, [PANEL, 'const end = endRef.current;', 'ask(questions[0]); const end = endRef.current;']);

await law('FOCUS: a press never leaves her focus nowhere: it goes to the box, and no button she presses is disabled under her', (load, file) => {
  const code = file(PANEL);
  const asks = code.slice(code.indexOf('const ask = (text: string) => {'), code.indexOf('void askWalk('));
  return (/offRef\.current\?\.focus/.test(code) && /toBox\(\);/.test(asks) && /toBox\(\); void retryWalk/.test(code) && !/data-walk-ask=\{q\} disabled/.test(code)) || 'a press can drop her focus';
}, [PANEL, 'toBox(); void retryWalk', 'void retryWalk']);

await law('NOSAVE: the ask writes nothing of hers anywhere', (load, file) => {
  const both = file(THREADS) + file(PANEL) + file(ASK);
  if (!file(THREADS)) return 'no module';
  const hit = both.match(/localStorage|sessionStorage|persistence|saveBoardBoxes|saveJournalEntry|appendTutorMessage|advanceTutorCursor|setDocSetting/g);
  return !hit || J(hit);
}, [THREADS, 'off = true;', "off = true; localStorage.setItem('x', '1');"]);

await law('KEYS: in the panel her arrows and Page keys are the box\'s, never a step', (load, file) => {
  const code = file(WALK);
  const guard = code.indexOf("closest('[data-walk-ai]')) return;");
  const steps = code.indexOf("const dir = e.key === 'ArrowRight'");
  return (guard > 0 && steps > 0 && guard < steps) || J([guard, steps]);
}, [WALK, "closest('[data-walk-ai]')) return;", "closest('[data-walk-nowhere]')) return;"]);

await law('PLAN: no known structure, no AI offered', (load, file) => {
  return /const aiHere = !!\(structure && /.test(file(WALK)) || 'GuideWalk does not gate the panel on the structure';
}, [WALK, 'const aiHere = !!(structure && ', 'const aiHere = !!(']);

await law('TABS: the AI tab is lit and pressable beside the two locked ones', (load, file) => {
  const code = file(WALK);
  return (/data-walk-ai-tab=""/.test(code) && /aria-selected=\{aiOpen\}/.test(code) && /\['reorgBackPlan', 'drawerLinks'\]/.test(code)) || 'no lit AI tab';
}, [WALK, 'data-walk-ai-tab=""', 'data-walk-other=""']);

await law('WORDS: the section 8 words by theme, and what travels is said', (load, file) => {
  const canon = file('store/lexicon/canonical/chrome.ts'); const flux = file('store/lexicon/overrides/fluxReorg.ts');
  const miss = [];
  if (!/guideWalkAskHint: 'Ask about this step…'/.test(canon)) miss.push('hint');
  if (!/guideWalkAsked: 'You asked:'/.test(canon)) miss.push('asked');
  if (!/guideWalkAskHint: 'Query this step…'/.test(flux)) miss.push('flux hint');
  if (!/guideWalkAsked: 'QUERY:'/.test(flux)) miss.push('flux asked');
  if (!/guideWalkAskTravels: /.test(canon)) miss.push('travels');
  if (!/<DrawerNote label=\{t\('guideWalkAskTravelsLabel'\)\}>\{t\('guideWalkAskTravels'\)\}<\/DrawerNote>/.test(file(PANEL))) miss.push('the "?" is not on the panel');
  return miss.length === 0 || J(miss);
}, ['store/lexicon/overrides/fluxReorg.ts', "guideWalkAsked: 'QUERY:'", "guideWalkAsked: 'You asked:'"]);

console.log(fails === 0 ? `\nREORG-WALK-AI-UNIT VERIFY: PASS (${checks} checks)` : `\nREORG-WALK-AI-UNIT VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
