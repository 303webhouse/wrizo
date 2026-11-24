// TUTOR-B ITEM 3 — THE REPLY GUARD (TUTOR build-list item 3; the kit's runner-kit.md section 1, M1 and M2). BROWSERLESS, SERVER ONLY, NO KEY: the real routes (apps/server/src/tutor.ts) run against a stand-in model on localhost.
// A reply that says "I" (M1) or flatters (M2) is asked for again ONCE; if it fails twice, she sees the plain fallback line; the retry is paid for from the SAME two daily budgets, so it can never carry a count past a cap.
//   RG1  a clean reply goes straight through: one model call, one unit of budget
//   RG2  every M1 word and every M2 phrase on the kit's FAIL lists makes the route ask again; the second, clean reply is the one she sees; the two calls' tokens are added so the session meter stays honest
//   RG3  fails twice: she sees exactly the fallback line ("No answer this time. Try asking again."), as a normal reply (status 200), never the bad text
//   RG4  what the check skips: anything in quotation marks, the sentence after the label "Example", the closing "Read:" line, the capital-letter "US"; and words only FLAGGED for the second reader (mine, great, perfect...) are never failed
//   RG5  the per-account budget: the retry takes a second unit; with one unit left it is refused (no second model call, the fallback shows) and the count never passes the cap
//   RG6  the global budget: the same, across accounts
//   RG7  a clean first reply never spends a second unit; a clean SPRINT line is one model call, today's cleaning
//   RG8  the SPRINT route is guarded with the same guard (Fable, Nov 23, call 3): a line that says "I"/"we" or flatters is asked for again once; the second, clean line is the one she gets; failing twice is the route's existing plain failure (502, so the client gives her a line from its local deck), never the chat fallback line; the retry is paid from the same two budgets and never passes a cap
//   MUT1 the guard removed: RG2/RG3 go RED   MUT2 the retry not paid for (a free second call): RG5 goes RED   MUT3 the fallback line swapped for the bad reply: RG3 goes RED   MUT4 the sprint guard removed: RG8 goes RED   MUT5 the sprint retry not paid for: RG8 goes RED
// RED on main (5487be6b), where nothing guards a reply. Run (from apps/desktop): node scripts/harness/tutor-reply-guard.mjs
import { loadServer, swap, findHandler, callRoute } from '../../../server/scripts/tutor-eval/load-server.mjs';
import { startStandInModel } from '../../../server/scripts/tutor-eval/stand-in-model.mjs';

let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${String(detail).slice(0, 500)}]` : ''}`); if (!cond) fails += 1; };
const FALLBACK = 'No answer this time. Try asking again.';
const GOOD = 'A reader may lose the thread at the second sentence. Which sentence carries the claim?\nRead: Part 1.';
const BODY = { messages: [{ role: 'writer', text: 'Where does this drag?' }] };

const model = await startStandInModel();
const setEnv = (daily, global) => {
  process.env.TUTOR_API_KEY = 'harness-key-not-real';
  process.env.TUTOR_BASE_URL = `http://127.0.0.1:${model.port}`;
  process.env.TUTOR_DAILY_BUDGET = String(daily);
  process.env.TUTOR_GLOBAL_DAILY_BUDGET = String(global);
  process.env.SESSION_SECRET = 'harness-secret';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';
  delete process.env.TUTOR_DISABLED;
};
// a fresh module = fresh in-memory budgets
const fresh = (opts = {}, daily = 500, global = 5000) => {
  setEnv(daily, global);
  const s = loadServer(opts);
  return { s, chat: findHandler(s.load('tutor.ts').tutorRouter, '/tutor/chat'), sprint: findHandler(s.load('tutor.ts').tutorRouter, '/tutor/sprint-prompt') };
};
const done = (r) => { r.s.cleanup(); };
const finish = () => {
  model.close();
  console.log(fails === 0 ? `\nTUTOR-REPLY-GUARD VERIFY: PASS (${checks} checks)` : `\nTUTOR-REPLY-GUARD VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(fails === 0 ? 0 : 1);
};

let r = fresh();
if (!r.s.has('tutorGuard.ts')) {
  ok(false, 'RG1 the guard exists: apps/server/src/tutorGuard.ts');
  done(r);
  // keep going: the route-level checks below must also be red on a tree with no guard, so the file's absence is not the only thing that fails
}

// ---- RG1 ----
model.reset(); model.say(GOOD);
const a = await callRoute(r.chat, BODY, 'u-rg1');
ok(a.status === 200 && a.body && a.body.reply === GOOD && model.requests.length === 1, 'RG1 a clean reply goes straight through: one model call', `calls=${model.requests.length}`);
done(r);

// ---- RG2: every word and phrase on the kit's fail lists ----
const M1_WORDS = ['I', "I'm", "I've", "I'd", "I'll", 'me', 'my', 'myself', 'we', "we're", "we've", 'our', 'ours', 'us'];
const M2_PHRASES = ['well done', 'good job', 'great job', 'nice work', 'nicely done', 'great question', 'love this', 'love the', 'love how', 'thank you', "you're welcome", 'happy to', 'glad to', 'pleased to', 'hope this helps', 'feel free', 'let me know', 'good luck', 'no problem', 'of course'];
const bad = (w) => `The second paragraph is where ${w} come to a stop. Which sentence carries the claim?\nRead: Part 2.`;
const sentences = [...M1_WORDS.map((w) => ['M1 ' + w, `Reading this, ${w} lose the thread at the second sentence. What does it have to do?\nRead: Part 1.`]), ...M2_PHRASES.map((p) => ['M2 ' + p, `Paragraph two: ${p}, and a reader moves on. Which sentence carries the claim?\nRead: Part 2.`])];
let notRetried = []; let notClean = []; let wrongUsage = [];
r = fresh();
for (const [name, text] of sentences) {
  model.reset(); model.say(text, GOOD);
  const x = await callRoute(r.chat, BODY, 'u-rg2-' + name.replace(/\W/g, ''));
  if (model.requests.length !== 2) notRetried.push(name);
  if (!(x.body && x.body.reply === GOOD)) notClean.push(name);
  if (!(x.body && x.body.usage && x.body.usage.inputTokens === 20 && x.body.usage.outputTokens === 20)) wrongUsage.push(name);
}
ok(notRetried.length === 0, `RG2 all ${sentences.length} words and phrases on the kit's M1 and M2 FAIL lists make the route ask again (two model calls)`, notRetried.join(', '));
ok(notClean.length === 0, 'RG2 the second, clean reply is the one she sees', notClean.join(', '));
ok(wrongUsage.length === 0, 'RG2 the usage is the SUM of both calls (so the session meter is honest)', wrongUsage.slice(0, 4).join(', '));
done(r);

// ---- RG3: fails twice ----
r = fresh();
model.reset(); model.say(bad('I'), 'Great job on this paragraph. What next?\nRead: Part 1.');
const t = await callRoute(r.chat, BODY, 'u-rg3');
ok(t.status === 200 && t.body && t.body.configured === true && t.body.reply === FALLBACK && model.requests.length === 2, 'RG3 a reply that fails twice shows exactly the fallback line, as a normal reply, after exactly two model calls', JSON.stringify(t.body));
ok(!JSON.stringify(t.body).includes('Great job'), 'RG3 the failed text is never shown');
done(r);

// ---- RG4: what is skipped, and what is only flagged ----
const clean = [
  ['a quote of her words', 'The line "I am going home, we left" opens with a short beat. Which beat does the reader keep?\nRead: Part 1.'],
  ['a curly quote', 'The line “My dog barked at us” reads flat after the long one. What changes between them?\nRead: Part 1.'],
  ['after the label Example', 'Example: My dog barked, we ran. → My dog barked; we ran.\nWhich of your places match?\nRead: Part 1.'],
  ['the Read line', 'Which sentence carries the claim?\nRead: My Story, Part 2.'],
  ['capital US', 'The US census figures sit in paragraph two without a source. Where do they come from?\nRead: Part 2.'],
  ['flag-only: mine', 'A coal mine and a claim of mine are different things. Which does the reader meet here?\nRead: Part 1.'],
  ['flag-only: great, perfect', 'A great deal of the scene is dialogue, and the pause is perfect for a reader to stop. Which line carries it?\nRead: Part 1.'],
];
r = fresh();
const retried = [];
for (const [name, text] of clean) {
  model.reset(); model.say(text, 'SHOULD NOT BE ASKED FOR');
  const x = await callRoute(r.chat, BODY, 'u-rg4-' + name.replace(/\W/g, ''));
  if (model.requests.length !== 1 || !(x.body && x.body.reply === text)) retried.push(name);
}
ok(retried.length === 0, 'RG4 quotes, the sentence after "Example", the "Read:" line, "US", and words only flagged for the second reader are NOT failed: one call, her reply untouched', retried.join(' | '));
done(r);

// ---- RG5: the per-account budget (3 units) ----
r = fresh({}, 3, 5000);
model.reset(); model.say(GOOD);
await callRoute(r.chat, BODY, 'u-rg5'); // unit 1
model.reset(); model.say(bad('I'), GOOD);
const second = await callRoute(r.chat, BODY, 'u-rg5'); // unit 2, retry takes unit 3
ok(second.body && second.body.reply === GOOD && model.requests.length === 2, 'RG5 with a unit to spare, the retry takes it: the request spends two units in all', `calls=${model.requests.length}`);
model.reset(); model.say(GOOD);
const over = await callRoute(r.chat, BODY, 'u-rg5');
ok(over.status === 429 && model.requests.length === 0, 'RG5 the cap held at 3: the next request is a 429 and the model is not called (the retry did not carry the count past the cap)', `status=${over.status} calls=${model.requests.length}`);
done(r);
r = fresh({}, 2, 5000);
model.reset(); model.say(GOOD);
await callRoute(r.chat, BODY, 'u-rg5b'); // unit 1
model.reset(); model.say(bad('we'), GOOD);
const last = await callRoute(r.chat, BODY, 'u-rg5b'); // unit 2 is the first call; the retry would be unit 3: refused
ok(last.status === 200 && last.body && last.body.reply === FALLBACK && model.requests.length === 1, 'RG5 with no unit left the retry is refused: no second model call, the fallback line shows', `calls=${model.requests.length} body=${JSON.stringify(last.body)}`);
model.reset(); model.say(GOOD);
const after = await callRoute(r.chat, BODY, 'u-rg5b');
ok(after.status === 429 && model.requests.length === 0, 'RG5 and the count stayed at the cap (2): the next request is a 429', `status=${after.status}`);
done(r);

// ---- RG6: the global budget (2 units, two accounts) ----
r = fresh({}, 500, 2);
model.reset(); model.say(GOOD);
await callRoute(r.chat, BODY, 'u-rg6a'); // global 1
model.reset(); model.say(bad('my'), GOOD);
const g = await callRoute(r.chat, BODY, 'u-rg6b'); // global 2; the retry would be 3: refused
ok(g.status === 200 && g.body && g.body.reply === FALLBACK && model.requests.length === 1, 'RG6 the retry is refused when the GLOBAL cap would be passed: one model call, the fallback line', `calls=${model.requests.length} body=${JSON.stringify(g.body)}`);
model.reset(); model.say(GOOD);
const g3 = await callRoute(r.chat, BODY, 'u-rg6c');
ok(g3.status === 429 && model.requests.length === 0, 'RG6 and the global count stayed at its cap: the next account\'s request is a 429', `status=${g3.status}`);
done(r);

// ---- RG7: no retry spend when clean; the sprint route is not guarded ----
r = fresh({}, 2, 5000);
for (let i = 0; i < 2; i++) { model.reset(); model.say(GOOD); await callRoute(r.chat, BODY, 'u-rg7'); }
model.reset(); model.say(GOOD);
const rg7 = await callRoute(r.chat, BODY, 'u-rg7');
ok(rg7.status === 429, 'RG7 clean replies spend exactly one unit each: two requests used a 2-unit budget, the third is refused', `status=${rg7.status}`);
model.reset(); model.say('Write about the last door you walked through.');
const sp = await callRoute(r.sprint, { seen: [] }, 'u-rg7s');
ok(sp.status === 200 && sp.body && sp.body.prompt === 'Write about the last door you walked through.' && model.requests.length === 1, 'RG7 a clean SPRINT line is one model call with today\'s one-line cleaning', JSON.stringify(sp.body));
done(r);

// ---- RG8: the SPRINT route, guarded the same way ----
const SPRINT_GOOD = 'Write about the last door you walked through.';
const sprintBad = ['I want you to describe a kitchen at dawn.', 'Great job so far: write the next sound you hear.', 'Write what we would see from the window.'];
r = fresh();
let sprintOk = true; const sprintWhy = [];
for (const [i, b] of sprintBad.entries()) {
  model.reset(); model.say(b, SPRINT_GOOD);
  const x = await callRoute(r.sprint, { seen: [] }, 'u-rg8-' + i);
  if (!(x.status === 200 && x.body && x.body.prompt === SPRINT_GOOD && model.requests.length === 2)) { sprintOk = false; sprintWhy.push(i + ':' + x.status + '/calls=' + model.requests.length); }
}
ok(sprintOk, 'RG8 a SPRINT line that says "I", "we" or flatters is asked for again once; the second, clean line is the one she gets', sprintWhy.join(' '));
model.reset(); model.say(sprintBad[0], sprintBad[1]);
const sprintTwice = await callRoute(r.sprint, { seen: [] }, 'u-rg8-twice');
ok(sprintTwice.status === 502 && model.requests.length === 2 && !JSON.stringify(sprintTwice.body).includes('No answer this time') && !(sprintTwice.body && sprintTwice.body.prompt), 'RG8 two failing SPRINT lines: the route\'s existing plain failure (502, no prompt), never the chat fallback line', JSON.stringify(sprintTwice.body) + ' calls=' + model.requests.length);
done(r);
r = fresh({}, 2, 5000);
model.reset(); model.say(SPRINT_GOOD); await callRoute(r.sprint, { seen: [] }, 'u-rg8b'); // unit 1
model.reset(); model.say(sprintBad[0], SPRINT_GOOD);
const sprintCap = await callRoute(r.sprint, { seen: [] }, 'u-rg8b'); // unit 2 is the first call; the retry would be unit 3: refused
ok(sprintCap.status === 502 && model.requests.length === 1, 'RG8 with one unit left the SPRINT retry is refused: no second model call', 'status=' + sprintCap.status + ' calls=' + model.requests.length);
model.reset(); model.say(SPRINT_GOOD);
const sprintAfter = await callRoute(r.sprint, { seen: [] }, 'u-rg8b');
ok(sprintAfter.status === 429 && model.requests.length === 0, 'RG8 the SPRINT count stops at the cap: the next request is refused and the model is not called', 'status=' + sprintAfter.status);
done(r);
r = fresh({}, 500, 2);
model.reset(); model.say(SPRINT_GOOD); await callRoute(r.sprint, { seen: [] }, 'u-rg8c1'); // global 1
model.reset(); model.say(sprintBad[0], SPRINT_GOOD);
const sprintGlobal = await callRoute(r.sprint, { seen: [] }, 'u-rg8c2'); // global 2; the retry would be 3: refused
model.reset(); model.say(SPRINT_GOOD);
const sprintGlobal3 = await callRoute(r.sprint, { seen: [] }, 'u-rg8c3');
ok(sprintGlobal.status === 502 && sprintGlobal3.status === 429, 'RG8 the global budget holds for the SPRINT retry too', 'status=' + sprintGlobal.status + '/' + sprintGlobal3.status);
done(r);

// ---- mutants ----
{
  const m1 = loadServerMut({ 'tutor.ts': (s) => s.replace(/!guardReply\([^)]*\)\.ok/g, 'false') });
  model.reset(); model.say(bad('I'), GOOD);
  const x = await callRoute(m1.chat, BODY, 'u-m1');
  ok(!(x.body && x.body.reply === GOOD && model.requests.length === 2), 'MUT1 the guard removed: RG2/RG3 go RED (the bad reply goes through, no second call)');
  done(m1);
  const m2 = loadServerMut({ 'tutor.ts': swap('const retryAllowed = consumeTutorBudget(req.session.userId!) && consumeGlobalTutorBudget();', 'const retryAllowed = true;') }, 2);
  model.reset(); model.say(GOOD);
  await callRoute(m2.chat, BODY, 'u-m2');
  model.reset(); model.say(bad('we'), GOOD);
  const y = await callRoute(m2.chat, BODY, 'u-m2');
  ok(model.requests.length === 2 && y.body && y.body.reply === GOOD, 'MUT2 the retry not paid for (a free second call): RG5 goes RED (the model is called a third time on a 2-unit budget)', `calls=${model.requests.length}`);
  done(m2);
  const m3 = loadServerMut({ 'tutorGuard.ts': swap("'No answer this time. Try asking again.'", "'Great job. I think this is fine.'") });
  model.reset(); model.say(bad('I'), bad('I'));
  const z = await callRoute(m3.chat, BODY, 'u-m3');
  ok(!(z.body && z.body.reply === FALLBACK), 'MUT3 the fallback line swapped: RG3 goes RED');
  done(m3);
  const m4 = loadServerMut({ 'tutor.ts': swap('if (line && !guardReply(line).ok) {', 'if (false) {') });
  model.reset(); model.say(sprintBad[0], SPRINT_GOOD);
  const w = await callRoute(m4.sprint, { seen: [] }, 'u-m4');
  ok(!(w.body && w.body.prompt === SPRINT_GOOD && model.requests.length === 2), 'MUT4 the sprint guard removed: RG8 goes RED (the bad line goes through, no second call)', JSON.stringify(w.body));
  done(m4);
  const m5 = loadServerMut({ 'tutor.ts': (src) => { const t = 'const retryAllowed = consumeTutorBudget(req.session.userId!) && consumeGlobalTutorBudget();'; const i = src.lastIndexOf(t); return src.slice(0, i) + 'const retryAllowed = true;' + src.slice(i + t.length); } }, 2);
  model.reset(); model.say(SPRINT_GOOD);
  await callRoute(m5.sprint, { seen: [] }, 'u-m5');
  model.reset(); model.say(sprintBad[0], SPRINT_GOOD);
  const v = await callRoute(m5.sprint, { seen: [] }, 'u-m5');
  ok(model.requests.length === 2 && v.body && v.body.prompt === SPRINT_GOOD, 'MUT5 the sprint retry not paid for: RG8 goes RED (a second call is made on the last unit)', 'calls=' + model.requests.length);
  done(m5);
}
function loadServerMut(mutate, daily = 500) {
  setEnv(daily, 5000);
  const s = loadServer({ mutate });
  return { s, chat: findHandler(s.load('tutor.ts').tutorRouter, '/tutor/chat'), sprint: findHandler(s.load('tutor.ts').tutorRouter, '/tutor/sprint-prompt') };
}

finish();
