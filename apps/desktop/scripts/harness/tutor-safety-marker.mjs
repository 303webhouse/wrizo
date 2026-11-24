// TUTOR-B ITEM 1 — THE SAFETY MESSAGE, BY MARKER (Fable, Nov 23, 6:14 pm; the words are Nick's, approved Nov 23, 5:23 pm, prompts.md section 8). BROWSERLESS, SERVER ONLY, NO KEY: the real route runs against a stand-in model.
// BASE tells the model to reply with ONE fixed marker when she says she herself is in danger; the server swaps any reply that holds the marker for the fixed words, which the model never writes.
//   SM1  a reply that is the marker alone comes out as the kit's section 8 words, BYTE FOR BYTE (the expected text is read from the kit's own file, prompts-v0.5.json, never retyped)
//   SM2  the marker with other text around it (before, after, both sides, twice, other case, spaces in the brackets) still shows ONLY the words; no marker and none of the model's other text reaches her
//   SM3  a reply with no marker is returned untouched (including one that says "safety" or holds other double brackets)
//   SM4  the swap is one model call and one unit of budget, and the reply shape (usage, model) is unchanged
//   SM5  the code's words equal the kit's: SAFETY_MESSAGE === the kit's section 8, three lines, no stray space
//   SM6  SPRINT: a reply that holds the marker is no writing prompt (the plain failure; the client's local deck answers)
//   MUT1 the swap removed from the route: SM1/SM2 go RED   MUT2 one character of the words changed (the site's name): SM1/SM5 go RED   MUT3 the marker only matched when it is the whole reply: SM2 goes RED
// RED on main (5487be6b), where there is no marker and no swap. Run (from apps/desktop): node scripts/harness/tutor-safety-marker.mjs
import fs from 'node:fs';
import path from 'node:path';
import { loadServer, swap, findHandler, callRoute, SERVER } from '../../../server/scripts/tutor-eval/load-server.mjs';
import { startStandInModel } from '../../../server/scripts/tutor-eval/stand-in-model.mjs';
import { withDepartures, SAFETY_MARKER } from '../../../server/scripts/tutor-eval/kit-departures.mjs';

const ORACLE = withDepartures(JSON.parse(fs.readFileSync(path.join(SERVER, 'scripts', 'tutor-eval', 'prompts-v0.5.json'), 'utf8')).blocks);
const WORDS = ORACLE.safetyMessage;
let fails = 0; let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${String(detail).slice(0, 400)}]` : ''}`); if (!cond) fails += 1; };
const finish = (model) => {
  if (model) model.close();
  console.log(fails === 0 ? `\nTUTOR-SAFETY-MARKER VERIFY: PASS (${checks} checks)` : `\nTUTOR-SAFETY-MARKER VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(fails === 0 ? 0 : 1);
};

const model = await startStandInModel();
process.env.TUTOR_API_KEY = 'harness-key-not-real';
process.env.TUTOR_BASE_URL = `http://127.0.0.1:${model.port}`;
process.env.TUTOR_DAILY_BUDGET = '500';
process.env.TUTOR_GLOBAL_DAILY_BUDGET = '5000';
process.env.TUTOR_MAX_TOKENS = '700';
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';
delete process.env.TUTOR_DISABLED;

const base = loadServer();
if (!base.has('tutorPrompts.ts')) { ok(false, 'SM0 the prompt file exists: apps/server/src/tutorPrompts.ts'); base.cleanup(); finish(model); }
const P = base.load('tutorPrompts.ts');
const chat = findHandler(base.load('tutor.ts').tutorRouter, '/tutor/chat');
const sprint = findHandler(base.load('tutor.ts').tutorRouter, '/tutor/sprint-prompt');
const BODY = { messages: [{ role: 'writer', text: 'I do not want to be here any more.' }] };
let n = 0;
const ask = async (handler, reply, body = BODY) => { model.reset(); model.say(reply); return callRoute(handler, body, 'u-sm-' + n++); };

// ---- SM1 ----
ok(typeof WORDS === 'string' && WORDS.startsWith('This matters more than the writing, so the writing help stops here.\n') && WORDS.split('\n').length === 3, 'SM0 the kit\'s section 8 words were read from the kit file: three lines', JSON.stringify(WORDS));
const r1 = await ask(chat, SAFETY_MARKER);
ok(r1.status === 200 && r1.body && r1.body.reply === WORDS && Buffer.from(r1.body.reply, 'utf8').equals(Buffer.from(WORDS, 'utf8')), 'SM1 a reply that is the marker alone comes out as the kit\'s section 8 words, byte for byte', JSON.stringify(r1.body && r1.body.reply));

// ---- SM2 ----
const variants = {
  'text before': `Of course. ${SAFETY_MARKER}`,
  'text after': `${SAFETY_MARKER}\nRead: Part 1.`,
  'both sides': `A reader may stop here. ${SAFETY_MARKER} What does the next line do?\nRead: Part 1.`,
  'twice': `${SAFETY_MARKER}\n${SAFETY_MARKER}`,
  'lower case': '[[wrizo-safety]]',
  'spaces inside the brackets': '[[ WRIZO-SAFETY ]]',
  'underscore': '[[WRIZO_SAFETY]]',
  'run together': '[[WRIZOSAFETY]]',
  'a long reply that also flatters and says I': `Great job. I think the writing is strong. ${SAFETY_MARKER} We can talk about it. Read: Part 1.`,
};
const bad2 = [];
for (const [name, reply] of Object.entries(variants)) {
  const r = await ask(chat, reply);
  const got = r.body && r.body.reply;
  if (!(r.status === 200 && got === WORDS && !/WRIZO|SAFETY\]|\[\[/i.test(got) && model.requests.length === 1)) bad2.push(name + ': ' + JSON.stringify(got).slice(0, 60) + ' calls=' + model.requests.length);
}
ok(bad2.length === 0, `SM2 the marker with other text around it, in ${Object.keys(variants).length} shapes, shows ONLY the words (no second model call, nothing of the model's other text, no marker)`, bad2.join(' | '));

// ---- SM3 ----
const plain = ['A reader may lose the thread at the second sentence. Which sentence carries the claim?\nRead: Part 1.', 'The safety of the harbour is the question in paragraph 2. What does the reader learn there?\nRead: Part 2.', 'Paragraph 3 uses [[a double bracket]] as a note. What does it mark?\nRead: Part 3.'];
const bad3 = [];
for (const reply of plain) { const r = await ask(chat, reply); if (!(r.body && r.body.reply === reply)) bad3.push(reply.slice(0, 30)); }
ok(bad3.length === 0, 'SM3 a reply with no marker is returned untouched (one that says "safety", one with other double brackets)', bad3.join(' | '));

// ---- SM4 ----
const r4 = await ask(chat, SAFETY_MARKER);
ok(model.requests.length === 1 && r4.body && r4.body.configured === true && r4.body.usage && r4.body.usage.inputTokens === 10 && r4.body.usage.outputTokens === 10 && r4.body.model, 'SM4 the swap is one model call, and the reply shape (configured, reply, usage, model) is unchanged', JSON.stringify(r4.body && { ...r4.body, reply: '...' }));

// ---- SM5 ----
ok(P.SAFETY_MESSAGE === WORDS && P.SAFETY_MARKER === SAFETY_MARKER, 'SM5 the words in the code equal the kit\'s section 8 exactly; the marker is the one the checks expect', `codeLen=${String(P.SAFETY_MESSAGE).length} kitLen=${WORDS.length}`);
ok(!/[ \t]$/m.test(P.SAFETY_MESSAGE) && !/\r/.test(P.SAFETY_MESSAGE) && !P.SAFETY_MESSAGE.startsWith('\n') && !P.SAFETY_MESSAGE.endsWith('\n'), 'SM5 no stray space, carriage return or blank line in the words');
ok(P.withSafetyMessage(SAFETY_MARKER) === WORDS && P.withSafetyMessage('A reply.') === 'A reply.' && P.holdsSafetyMarker('x [[WRIZO-SAFETY]] y') === true && P.holdsSafetyMarker('no') === false, 'SM5 the builder-side helpers behave: withSafetyMessage swaps, holdsSafetyMarker reads');

// ---- SM6 ----
const s1 = await ask(sprint, SAFETY_MARKER, { seen: [] });
const s2 = await ask(sprint, `Write about a door. ${SAFETY_MARKER}`, { seen: [] });
const s3 = await ask(sprint, 'Write about the last door you walked through.', { seen: [] });
ok(s1.status === 502 && !(s1.body && s1.body.prompt) && s2.status === 502 && !(s2.body && s2.body.prompt) && s3.status === 200 && s3.body.prompt === 'Write about the last door you walked through.', 'SM6 SPRINT: a reply that holds the marker is no writing prompt (502, no prompt); a normal prompt still comes through', JSON.stringify([s1.status, s2.status, s3.status]));

// ---- mutants ----
{
  const m1 = loadServer({ mutate: { 'tutor.ts': swap('const text = withSafetyMessage(response.content', 'const text = (response.content') } });
  const h1 = findHandler(m1.load('tutor.ts').tutorRouter, '/tutor/chat');
  const x1 = await ask(h1, SAFETY_MARKER);
  ok(!(x1.body && x1.body.reply === WORDS), 'MUT1 the swap removed from the route: SM1/SM2 go RED (the marker itself reaches her)');
  m1.cleanup();
  const m2 = loadServer({ mutate: { 'tutorPrompts.ts': swap('findahelpline.com lists', 'findahelpline.org lists') } });
  const h2 = findHandler(m2.load('tutor.ts').tutorRouter, '/tutor/chat');
  const x2 = await ask(h2, SAFETY_MARKER);
  ok(!(x2.body && x2.body.reply === WORDS), 'MUT2 one character of the words changed: SM1/SM5 go RED');
  m2.cleanup();
  const m3 = loadServer({ mutate: { 'tutorPrompts.ts': swap('return holdsSafetyMarker(reply) ? SAFETY_MESSAGE : reply;', 'return reply.trim() === SAFETY_MARKER ? SAFETY_MESSAGE : reply;') } });
  const h3 = findHandler(m3.load('tutor.ts').tutorRouter, '/tutor/chat');
  const x3 = await ask(h3, variants['both sides']);
  ok(!(x3.body && x3.body.reply === WORDS), 'MUT3 the marker only matched when it is the whole reply: SM2 goes RED');
  m3.cleanup();
}

base.cleanup();
finish(model);
