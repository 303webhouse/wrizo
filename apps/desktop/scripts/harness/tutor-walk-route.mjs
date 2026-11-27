// TUTOR-B — THE GUIDE'S WALK REACHES THE TUTOR (guide-walk-spec.md section 3.8; Fable, Nov 27: "build the walk's route ... the route speaks only on her press").
// BROWSERLESS, NO KEY, NO BOX TURN: the REAL /tutor/chat route (tutor.ts) runs against a stand-in model on localhost, so what the model RECEIVES is read, not assumed.
// A walk's ask is `{ messages, theme?, walk }`: `walk` is her step. The route builds the walk's task, sends her step as ONE <walk-step> turn and nothing else of hers.
//   WR1  the system prompt is BASE + the Tutor hat + her theme's voice + the walk's task + CONTEXT, exactly
//   WR2  the model receives exactly two turns: the <walk-step> block built from the body's fields, then her words, last
//   WR3  no notes on file travel with it, and the notes are not even read, for a writer who has some (R13)
//   WR4  a walk body that also carries delta, bible or selection is refused: no model call, no budget spent
//   WR5  any other key, at the top or inside `walk`, is refused
//   WR6  every field is capped: a wrong type, a missing structure, step, kind or note, a kind off the list, or a field over its cap is refused; a long note travels cut at 2,000 and says so
//   WR7  an empty note is lawful and says "(none yet)"; preset, question, about, before and after may be left out
//   WR8  she speaks first and last: a thread passes with the block just before her latest words; a thread whose last turn is the aid's is refused (R9: it never speaks first)
//   WR9  a `walk` that is not an object is refused, never answered as an ordinary ask (which would send her notes)
//   WR10 the reply guard holds: a reply that says "I" is asked for again with the same walk task; twice, and she sees the fallback line
//   WR11 the safety marker still gets her the safety words
//   WR12 a walk ask spends the same daily budget as any other ask
//   WR13 switched off or with no key, it answers "not configured" and calls nothing
//   WR14 an ordinary ask is what it was: its own task, her notes on file, no walk block
//   MUT1 her notes sent on a walk: WR3 RED   MUT2 the ordinary task: WR1 RED   MUT3 delta let through: WR4 RED   MUT4 the block after her words: WR2 RED
//   MUT5 the aid may speak first: WR8 RED    MUT6 a bad walk falls through to an ordinary ask: WR9 RED
// Run (from apps/desktop): node scripts/harness/tutor-walk-route.mjs
import fs from 'node:fs';
import path from 'node:path';
import { loadServer, findHandler, callRoute, swap } from '../../../server/scripts/tutor-eval/load-server.mjs';
import { startStandInModel } from '../../../server/scripts/tutor-eval/stand-in-model.mjs';

let fails = 0; let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${String(detail).slice(0, 400)}]` : ''}`); if (!cond) fails += 1; };

const model = await startStandInModel();
process.env.TUTOR_API_KEY = 'harness-key-not-real';
process.env.TUTOR_BASE_URL = `http://127.0.0.1:${model.port}`;
process.env.TUTOR_DAILY_BUDGET = '5000';
process.env.TUTOR_GLOBAL_DAILY_BUDGET = '50000';
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';
delete process.env.TUTOR_DISABLED;

const FILES = ['env.ts', 'asyncHandler.ts', 'logSafe.ts', 'tutorPrompts.ts', 'tutorGuard.ts', 'tutorNoteFilter.ts', 'tutorNotes.ts', 'tutorNotesRoutes.ts', 'tutor.ts'];
// every writer here HAS a note on file, so "no notes travel" means something
const reads = [];
global.__tutorWalkPool = {
  async query(sql, params) {
    reads.push(params[0]);
    return { rows: [{ id: '00000000-0000-4000-8000-000000000001', kind: 'goal', text: 'NOTE-ON-FILE-SENTINEL', source: 'own', created_at: new Date(1700000000000), updated_at: new Date(1700000000000) }], rowCount: 1 };
  },
};

function boot(mutate = {}) {
  const s = loadServer({ files: FILES, mutate });
  fs.writeFileSync(path.join(s.tmp, 'db.js'), 'exports.pool = global.__tutorWalkPool;\r\n');
  const handler = findHandler(s.load('tutor.ts').tutorRouter, '/tutor/chat');
  return { s, handler, P: s.load('tutorPrompts.ts'), G: s.load('tutorGuard.ts') };
}

const STEP = { preset: 'Novel', structure: 'Three-Act Structure', kind: 'stories', step: 'Midpoint', question: 'What changes the game halfway through?', about: 'The middle of the story turns it.', note: 'Maren finds the ledger.', before: 'Rising Complications', after: 'Crisis' };
const ASKED = 'What does a Midpoint do in Three-Act Structure?';
const body = (walk = STEP, over = {}) => ({ messages: [{ role: 'writer', text: ASKED }], theme: 'arbor', walk, ...over });
const ANSWER = 'A Midpoint turns the question over.\nWhat does the ledger change?\nRead: Midpoint (Three-Act Structure), your note for this step';
const textOf = (m) => (typeof m.content === 'string' ? m.content : (m.content || []).map((p) => p.text || '').join(''));

let threw = null;   // a mutant that only crashes the route proves nothing
const send = async (b, payload, userId = 'u-a', replies = [ANSWER]) => {
  model.reset(); model.say(...replies); reads.length = 0;
  const r = await callRoute(b.handler, payload, userId);
  if (r.thrown) threw = r.thrown;
  const sent = model.requests[0] || null;
  return { r, sent, calls: model.requests.length, msgs: sent ? sent.messages : [], system: sent ? String(sent.system || '') : '', all: JSON.stringify(model.requests), reads: reads.length };
};
const refused = async (b, payload) => { const x = await send(b, payload); return x.r.status === 400 && x.calls === 0 && x.reads === 0; };

async function run(mutate) {
  const b = boot(mutate);
  const wrong = [];
  const need = (id, cond, got = '') => { if (!cond) wrong.push(`${id} ${String(got).slice(0, 200)}`); };
  try {
    for (const theme of ['arbor', 'flux', 'machina', undefined, 'nonsense']) {
      const x = await send(b, body(STEP, { theme }));
      const want = b.P.buildSystemPrompt({ hat: 'tutor', voice: b.P.voiceForTheme(theme), task: 'walk' });
      need('WR1', x.r.status === 200 && x.system === want, `theme ${theme}: ${x.r.status} ${x.system.slice(0, 80)}`);
    }

    const x = await send(b, body());
    need('WR2', x.msgs.length === 2 && x.msgs.every((m) => m.role === 'user') && textOf(x.msgs[0]) === b.P.wrapWalkStep(STEP) && textOf(x.msgs[1]) === ASKED, JSON.stringify(x.msgs));
    need('WR2', x.r.body?.configured === true && x.r.body.reply === ANSWER && x.r.body.usage?.inputTokens === 10 && typeof x.r.body.model === 'string', JSON.stringify(x.r.body));
    need('WR3', x.reads === 0 && !x.all.includes('NOTE-ON-FILE-SENTINEL') && !x.all.includes('<notes-on-file>'), `reads=${x.reads}`);

    for (const key of ['delta', 'bible', 'selection']) need('WR4', await refused(b, body(STEP, { [key]: 'Her page words.' })), key);

    need('WR5', await refused(b, body(STEP, { page: 'Her page words.' })), 'a new top key');
    need('WR5', await refused(b, body({ ...STEP, draft: 'Her page words.' })), 'a new key in walk');
    need('WR5', await refused(b, body(JSON.parse('{"structure":"S","kind":"stories","step":"A","note":"","__proto__x":"y","constructor":"y"}'))), 'an object\'s own word as a key');

    for (const key of ['structure', 'kind', 'step', 'note']) { const w = { ...STEP }; delete w[key]; need('WR6', await refused(b, body(w)), `missing ${key}`); }
    for (const key of ['structure', 'step']) need('WR6', await refused(b, body({ ...STEP, [key]: '' })), `empty ${key}`);
    for (const key of Object.keys(STEP)) need('WR6', await refused(b, body({ ...STEP, [key]: 7 })), `a number for ${key}`);
    need('WR6', await refused(b, body({ ...STEP, kind: 'poems' })), 'a kind off the list');
    const CAPS = { preset: 2000, structure: 2000, step: 2000, before: 2000, after: 2000, question: 4000, about: 4000, note: 17000 };
    for (const [key, cap] of Object.entries(CAPS)) {
      need('WR6', await refused(b, body({ ...STEP, [key]: 'x'.repeat(cap + 1) })), `${key} over ${cap}`);
      const at = await send(b, body({ ...STEP, [key]: 'x'.repeat(cap) }));
      need('WR6', at.r.status === 200, `${key} at ${cap}: ${at.r.status}`);
    }
    need('WR6', await refused(b, body(STEP, { messages: [{ role: 'writer', text: 'x'.repeat(4001) }] })), 'a message over its cap');
    const long = await send(b, body({ ...STEP, note: 'n'.repeat(9000) }));
    need('WR6', textOf(long.msgs[0] || {}).includes(`${'n'.repeat(2000)} [cut]`) && !long.all.includes('n'.repeat(2001)), 'a long note is cut at 2,000');

    const bare = { structure: 'Three-Act Structure', kind: 'stories', step: 'Midpoint', note: '' };
    const y = await send(b, body(bare));
    need('WR7', y.r.status === 200 && textOf(y.msgs[0] || {}).includes('her note for this step: (none yet)') && !/preset:|step before:|step after:/.test(textOf(y.msgs[0] || {})), textOf(y.msgs[0] || {}));

    const thread = [{ role: 'writer', text: 'Ask me questions about my Midpoint' }, { role: 'tutor', text: 'What does she want?' }, { role: 'writer', text: 'Her brother back.' }];
    const t = await send(b, body(STEP, { messages: thread }));
    need('WR8', t.r.status === 200 && t.msgs.map((m) => m.role).join() === 'user,assistant,user,user' && textOf(t.msgs[2]).startsWith('<walk-step>') && textOf(t.msgs[3]) === 'Her brother back.', JSON.stringify(t.msgs.map((m) => m.role)));
    need('WR8', await refused(b, body(STEP, { messages: thread.slice(0, 2) })), 'the last turn is the aid\'s');
    need('WR8', await refused(b, body(STEP, { messages: [] })), 'no words of hers');

    for (const walk of [null, 'Midpoint', 7, [], [STEP], false]) need('WR9', await refused(b, body(walk)), JSON.stringify(walk));

    const g = await send(b, body(), 'u-a', ['I think the ledger matters.', ANSWER]);
    need('WR10', g.calls === 2 && model.requests[1].system === model.requests[0].system && JSON.stringify(model.requests[1].messages) === JSON.stringify(model.requests[0].messages) && g.r.body.reply === ANSWER, `calls=${g.calls} ${g.r.body?.reply}`);
    const g2 = await send(b, body(), 'u-a', ['I think so.', 'I still think so.']);
    need('WR10', g2.calls === 2 && g2.r.body.reply === b.G.FALLBACK_LINE, g2.r.body?.reply);

    const marker = await send(b, body(), 'u-a', [b.P.SAFETY_MARKER]);
    const safety = b.P.withSafetyMessage(b.P.SAFETY_MARKER);
    need('WR11', safety !== b.P.SAFETY_MARKER ? marker.calls === 1 && marker.r.body.reply === safety : false, marker.r.body?.reply);

    const w = await send(b, { messages: [{ role: 'writer', text: 'Where does this drag?' }], theme: 'arbor' });
    need('WR14', w.system === b.P.buildSystemPrompt({ hat: 'tutor', voice: 'arbor', task: 'ask' }) && w.all.includes('NOTE-ON-FILE-SENTINEL') && !w.all.includes('<walk-step>'), `reads=${w.reads}`);
  } finally { b.s.cleanup(); }
  return wrong;
}

// budgets and the off switches are read when the server loads, so each has a server of its own
async function budgetAndOff() {
  const wrong = [];
  process.env.TUTOR_DAILY_BUDGET = '2';
  let b = boot();
  try {
    const first = await send(b, body(), 'u-budget');
    const second = await send(b, { messages: [{ role: 'writer', text: 'Hi.' }] }, 'u-budget');
    const third = await send(b, body(), 'u-budget');
    if (!(first.r.status === 200 && second.r.status === 200 && third.r.status === 429 && third.calls === 0)) wrong.push(`WR12 ${first.r.status},${second.r.status},${third.r.status}`);
  } finally { b.s.cleanup(); process.env.TUTOR_DAILY_BUDGET = '5000'; }
  for (const off of ['disabled', 'no key']) {
    if (off === 'disabled') process.env.TUTOR_DISABLED = '1'; else delete process.env.TUTOR_API_KEY;
    b = boot();
    try {
      const x = await send(b, body());
      if (!(x.r.status === 200 && x.r.body.configured === false && x.calls === 0)) wrong.push(`WR13 ${off}: ${JSON.stringify(x.r.body)}`);
    } finally { b.s.cleanup(); delete process.env.TUTOR_DISABLED; process.env.TUTOR_API_KEY = 'harness-key-not-real'; }
  }
  return wrong;
}

{
  const w = [...await run(), ...await budgetAndOff()];
  const pick = (id) => w.filter((x) => x.startsWith(`${id} `));
  const line = (id, msg) => ok(pick(id).length === 0, `${id} ${msg}`, pick(id).join(' || '));
  line('WR1', 'the system prompt is BASE + the Tutor hat + her theme\'s voice + the walk\'s task + CONTEXT');
  line('WR2', 'the model receives her step as one <walk-step> turn, then her words, and the reply comes back with its usage');
  line('WR3', 'no notes on file travel with a walk ask, and they are not read');
  line('WR4', 'a walk body carrying delta, bible or selection is refused with no model call');
  line('WR5', 'any other key, at the top or inside walk, is refused');
  line('WR6', 'every field is typed and capped; a long note travels cut at 2,000');
  line('WR7', 'an empty note is lawful and the optional fields may be left out');
  line('WR8', 'a thread passes with the block before her latest words; the aid never speaks first');
  line('WR9', 'a walk that is not an object is refused, never answered as an ordinary ask');
  line('WR10', 'the reply guard asks again with the same walk task, then falls back');
  line('WR11', 'the safety marker still gets her the safety words');
  line('WR12', 'a walk ask spends the same daily budget');
  line('WR13', 'switched off or with no key: not configured, nothing called');
  line('WR14', 'an ordinary ask is what it was');
}

// ---- mutants ----
const mutant = async (name, id, from, to) => {
  try {
    threw = null;
    const w = await run({ 'tutor.ts': swap(from, to) });
    ok(threw === null && w.some((x) => x.startsWith(`${id} `)), `${name}: ${id} goes RED`, threw ?? '');
  } catch (e) { ok(false, `${name} could not be built`, String(e.message)); }
};
await mutant('MUT1 her notes sent on a walk', 'WR3', 'walk ? [] : await readNotesForAsk', 'await readNotesForAsk');
await mutant('MUT2 the ordinary task on a walk', 'WR1', "task: walk ? 'walk' : 'ask'", "task: 'ask'");
await mutant('MUT3 delta let through on a walk', 'WR4', "const WALK_BODY_KEYS = ['messages', 'theme', 'walk'];", "const WALK_BODY_KEYS = ['messages', 'theme', 'walk', 'delta'];");
await mutant('MUT4 the block after her words', 'WR2', 'messages.splice(messages.length - 1, 0, { role: \'user\' as const, content: wrapWalkStep', 'messages.push({ role: \'user\' as const, content: wrapWalkStep');
await mutant('MUT5 the aid may speak first', 'WR8', "if (messages[messages.length - 1].role !== 'writer') return false;   // walk: the aid never speaks first (R9)", '');
await mutant('MUT6 a bad walk answered as an ordinary ask', 'WR9', "if ('walk' in body) {", "if ((body as { walk?: unknown }).walk) {");

await model.close();
console.log(fails === 0 ? `TUTOR-WALK-ROUTE VERIFY: PASS (${checks} checks)` : `TUTOR-WALK-ROUTE VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
