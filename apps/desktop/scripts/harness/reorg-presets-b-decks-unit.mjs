// PRESETS-B item 4, BROWSERLESS: the eight new decks (Relationship Map, Timeline, Literature Map, Narrow My Question, Pitch Story, Logic Model, Interview Notes, Memory Map), loaded the way the live decks are
// (Fable, Nov 23, 11:23 pm: "items 4 (the eight decks) and 5 (search words) from sections 4-5; the team's calls D1-D5 and S1-S4 are accepted"; the PRESETS load sheet v2, section 4, copied word for word, never retyped).
// No browser, no box: the real decks/library, decks/content.ts, decks/formCounts.ts and the lexicon are bundled with esbuild against a fake browser (guided-w3.mjs's own way); each law is given a mutant (a text rewrite of a source file)
// that must LAND and turn its own check red.
//   REG      22 decks are registered (the 14 live + the 8); each new deck is in the room the sheet names (D4: Timeline and Memory Map sit in The Fiction Room)
//   DEAL     every deck x every answer deals the sheet's cards, in the sheet's order and titles (a dealt card is named "Event (1)", "Event (2)" - Feature Story's own numbering); the deal question and its three answers (D1); a Tie card is threaded to both neighbours (D3)
//   WORDS    every step's question, "?" sentence and example read back through the deck's content table AND the dealt card's prompt, equal to the sheet; a dealt card has an empty body (the question is the placeholder)
//   PAGE     no two cards of any deal overlap, every card sits inside the page's width
//   FORMS    each new deck is listed in the Forms panel exactly once, in its room's group; its cover line is the deck's own "In a line"; the deck's "?" note (a line and what it does) is in the lexicon
// Run: node scripts/harness/reorg-presets-b-decks-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { srcText, bundleText } from '../global-css.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// THE SHEET, as data (load sheet v2, section 4): the deck's id, name, room, deal question and answers, "?" note, and every card's title, question, "?" sentence and example.
const SHEET = [
  {"id":"relationship-map","name":"Relationship Map","roomLine":"The Fiction Room","deal":{"q":"How many people on the map?","opts":["Three","Four","Five"]},"note":{"line":"Who wants what from whom.","does":"One card for each person, and one for each tie between two of them. It shows the pull between people before you write a scene, and it makes a one-sided tie easy to spot."},"rows":[{"stepId":"person","title":"Person","q":"What do they want from the person they're tied to?","e":"A person card names one person by what they want from someone else on the map.","x":"Ines wants her older brother to say, once, that she was right to stay."},{"stepId":"tie","title":"Tie","q":"What holds these two together, and which of them needs it more?","e":"A tie card holds what binds two people, and which way the need runs.","x":"Ines and Tomas share the house and its debt. He needs her signature, and she needs his blessing."}]},
  {"id":"timeline","name":"Timeline","roomLine":"The Fiction Room","deal":{"q":"How many events to start with?","opts":["Three","Five","Seven"]},"note":{"line":"What happened, in the order it happened.","does":"One card for each event, kept in date order. That is the order things happened, which need not be the order you tell them. Seeing both is the point."},"rows":[{"stepId":"event","title":"Event","q":"What happened, when, and who knows about it?","e":"An event card pins one thing that happened to its date and to the people who know.","x":"March 1931: the mill closes for good. Only the foreman knows it won't reopen."}]},
  {"id":"literature-map","name":"Literature Map","roomLine":"The Academy","deal":{"q":"How many themes to start with?","opts":["Three","Four","Five"]},"note":{"line":"Your sources, grouped by what they are about.","does":"One card for each theme. You place your sources on the themes they speak to. The map then shows which themes are crowded, which rest on one source, and where your sources disagree."},"rows":[{"stepId":"theme","title":"Theme","q":"Which sources speak to this, and do they agree?","e":"A theme card gathers the sources on one idea, so you can see where they agree and where they split.","x":"Naps and recall: four studies find a short nap helps. One finds no effect in adults over sixty."}]},
  {"id":"narrow-my-question","name":"Narrow My Question","roomLine":"The Academy","deal":null,"note":{"line":"From a big topic to one question you can answer.","does":"Five cards that shrink a subject step by step, until it fits the time and the pages you have. Most stuck papers are stuck at the first or second card."},"rows":[{"stepId":"topic","title":"Topic","q":"What is the broad subject?","e":"The topic is the wide subject you start from, before it has a question in it.","x":"School lunches."},{"stepId":"curious","title":"What I'm Curious About","q":"What about it do you actually want to know?","e":"Curiosity is the part of the topic you'd read about even if no one had set it.","x":"Why so much of the food ends up in the bin."},{"stepId":"who-cares","title":"Who Cares","q":"Who would want the answer?","e":"Naming who wants the answer tells you what kind of answer is worth finding.","x":"The kitchen manager who pays for the waste, and the parents on the lunch committee."},{"stepId":"one-question","title":"One Question I Can Answer","q":"What question could you answer in the time and pages you have?","e":"A question you can answer is small enough for your time and pages, and still worth asking.","x":"Do students at my school throw away less when lunch comes after break and not before it?"},{"stepId":"find-out","title":"How I'd Find Out","q":"Where would the answer come from?","e":"How you'd find out names where the evidence would come from, before you promise an answer.","x":"Weigh the bins for two weeks on each timetable, and ask thirty students why."}]},
  {"id":"pitch-story","name":"Pitch Story","roomLine":"The Business Desk","deal":null,"note":{"line":"A pitch told as a short story: the trouble, the timing, the answer, the proof, the ask.","does":"Five cards in the order a room needs to hear them. Each is something you say out loud, so each should fit in a breath or two."},"rows":[{"stepId":"problem","title":"The Problem","q":"Who has it, and how much does it hurt?","e":"The problem is a real person's trouble, sized so the room can feel it.","x":"Four thousand people cycle to this station, and the only repair shop shuts before their train gets back."},{"stepId":"why-now","title":"Why Now","q":"What has changed that makes this the moment?","e":"Why now is the change that makes this the moment and not last year.","x":"The council has just doubled the bike parking at the station."},{"stepId":"solution","title":"The Solution","q":"What do you do about it?","e":"The solution is what you do about the problem, said in one breath.","x":"A van at the station three evenings a week that mends a bike while its owner is at work."},{"stepId":"proof","title":"Proof","q":"What shows it works?","e":"Proof is the evidence that it works: a trial, a number, or a customer's own words.","x":"A four-week trial mended 212 bikes, and half the owners came back."},{"stepId":"ask","title":"The Ask","q":"What do you want from this room?","e":"The ask is the one thing you want from this room, as a number or a yes.","x":"Six thousand for a second-hand van, repaid over two years."}]},
  {"id":"logic-model","name":"Logic Model","roomLine":"The Business Desk","deal":null,"note":{"line":"The chain from what you put in to what changes.","does":"Five cards, each leading to the next. Funders often ask for one, because it shows whether the work you plan could really produce the change you promise."},"rows":[{"stepId":"inputs","title":"Inputs","q":"What do you need: people, money, places?","e":"Inputs are what the work needs before it can start.","x":"A church kitchen on Saturdays, two volunteer cooks and money for ingredients."},{"stepId":"activities","title":"Activities","q":"What will you do with them?","e":"Activities are what you actually do with the inputs.","x":"A ten-week course where twelve teenagers cook one full meal each Saturday."},{"stepId":"outputs","title":"Outputs","q":"What will exist when you've done it?","e":"Outputs are the countable things that exist once the activities are done.","x":"Ten sessions run, twelve teenagers trained, and 120 meals cooked and taken home."},{"stepId":"outcomes","title":"Outcomes","q":"What will be different for the people you serve?","e":"Outcomes are what changes for the people you serve because of those outputs.","x":"By the end, nine of the twelve cook dinner at home at least once a week."},{"stepId":"impact","title":"Impact","q":"What larger change does that feed?","e":"Impact is the larger, slower change that your outcomes feed into.","x":"Teenagers on the estate who can feed themselves, and families who rely less on takeaways."}]},
  {"id":"interview-notes","name":"Interview Notes","roomLine":"The Newsroom","deal":{"q":"How many people did you talk to?","opts":["Two","Three","Four"]},"note":{"line":"One card for each person you spoke to.","does":"Each card keeps who the person is, their best line, and what only they know. When you sit down to write, you can see all your voices at once and notice whose is missing."},"rows":[{"stepId":"interview","title":"Interview","q":"Who are they, what is their best quote, and what do they know that no one else does?","e":"An interview card keeps one person's place in the story: who they are, their best line and what only they can tell you.","x":"The night porter, twenty-two years at the hotel: \"Nobody rings after two unless something's wrong.\" Only he saw who left by the kitchen door."}]},
  {"id":"memory-map","name":"Memory Map","roomLine":"The Fiction Room","deal":{"q":"How many memories to start with?","opts":["Three","Five","Seven"]},"note":{"line":"One card for each memory, with what you're not sure of.","does":"A memoir is built from memories, and memory fills its own gaps. Marking what you are sure of and what you aren't keeps the writing honest. It often shows where the story is."},"rows":[{"stepId":"memory","title":"Memory","q":"What do you remember, and what are you unsure of?","e":"A memory card holds one memory and marks which parts you are sure of and which you have filled in since.","x":"The kitchen of the flat on Calle Alta: I am sure of the yellow oilcloth. I am not sure my grandmother was still alive that summer."}]}
];

const ROOM_BY_LINE = { 'The Fiction Room': 'fiction', 'The Academy': 'academy', 'The Business Desk': 'business', 'The Newsroom': 'newsroom' };
const NEW_IDS = SHEET.map((d) => d.id);
const GROUP_OF_ROOM = { fiction: 'FICTION', academy: 'ACADEMIC', business: 'BUSINESS', newsroom: 'NEWSROOM' };

let nonce = 0;
async function load(over = {}) {
  nonce += 1;
  const lines = [
    `export const __n = ${nonce};`,
    "export { deskTerm } from './store/deskLexicon';",
    "export { DECKS } from './decks/library';",
    "export { materializeDeck } from './decks/engine';",
    "export { DECK_CONTENT } from './decks/content';",
    "export { FORMS_GROUPS, coverTermKey } from './decks/formCounts';",
  ];
  const res = await build({
    stdin: { contents: lines.join('\n'), resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [path.join(DESKTOP, 'node_modules')],
    external: ['@fontsource/*', '@fontsource-variable/*'],
    plugins: [{ name: 'ov', setup(b) { b.onLoad({ filter: /\.ts$/ }, (args) => {
      const rel = path.relative(SRC, args.path).split('\\').join('/');
      const text = noCR(bundleText(SRC, rel));
      return { contents: over[rel] ? over[rel](text) : text, loader: 'ts' };
    }); } }],
  });
  const map = new Map();
  globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } };
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }) };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  return await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
}
async function tryLoad(over) { try { return { M: await load(over) }; } catch (e) { return { err: String((e && e.message) || e).split('\n')[0].slice(0, 220) }; } }

const combos = (deck) => deck.questions.reduce((acc, q) => acc.flatMap((a) => q.options.map((o) => ({ ...a, [q.id]: o.id }))), [{}]);
const rectsOverlap = (a, b) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;
const COUNT_WORD = { Two: 2, Three: 3, Four: 4, Five: 5, Seven: 7 };

function suite(M) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail: String(detail).slice(0, 300) }; };
  const decks = M.DECKS;
  const byId = Object.fromEntries(decks.map((d) => [d.id, d]));
  const T = (k) => M.deskTerm(k);
  const dealt = (id, answers) => M.materializeDeck(byId[id], answers, []);
  const cards = (id, answers) => dealt(id, answers).boxes.filter((b) => b.kind === 'text');

  // REG
  {
    const missing = NEW_IDS.filter((id) => !byId[id]);
    const wrongRoom = SHEET.filter((d) => byId[d.id] && byId[d.id].room !== ROOM_BY_LINE[d.roomLine]).map((d) => d.id);
    const names = SHEET.filter((d) => byId[d.id] && T(byId[d.id].nameTerm) !== d.name).map((d) => d.id);
    keep('REG', decks.length === 22 && missing.length === 0 && wrongRoom.length === 0 && names.length === 0 && new Set(decks.map((d) => d.id)).size === 22, JSON.stringify({ n: decks.length, missing, wrongRoom, names }));
  }

  // DEAL: the deal question and its answers (D1), then every answer's cards in order
  const dealBad = [];
  for (const d of SHEET) {
    const deck = byId[d.id]; if (!deck) { dealBad.push(d.id + ' missing'); continue; }
    if (d.deal) {
      const q = deck.questions[0];
      if (deck.questions.length !== 1 || T(q.promptTerm) !== d.deal.q || !same(q.options.map((o) => T(o.labelTerm)), d.deal.opts)) dealBad.push(d.id + ' question');
    } else if (deck.questions.length !== 0) dealBad.push(d.id + ' has a question the sheet does not');
    for (const a of combos(deck)) {
      const n = d.deal ? COUNT_WORD[T(deck.questions[0].options.find((o) => o.id === a[deck.questions[0].id]).labelTerm)] : null;
      const got = cards(d.id, a).map((b) => [b.deckStep && b.deckStep.step, b.text.split('\n')[0]]);
      let want;
      if (!d.deal) want = d.rows.map((x, i) => [x.stepId, x.title]);
      else if (d.rows.length === 2) {   // Relationship Map: n people in a row, then a Tie between each neighbouring pair
        const [p, t] = d.rows;
        want = [...Array.from({ length: n }, (_, i) => [p.stepId, `${p.title} (${i + 1})`]), ...Array.from({ length: n - 1 }, (_, i) => [t.stepId, `${t.title} (${i + 1})`])];
      } else want = Array.from({ length: n }, (_, i) => [d.rows[0].stepId, `${d.rows[0].title} (${i + 1})`]);
      if (!same(got, want)) dealBad.push(`${d.id} ${JSON.stringify(a)}: ${JSON.stringify(got).slice(0, 120)}`);
    }
  }
  // D3: a Tie is threaded to the Person cards either side of it
  {
    const rel = byId['relationship-map'];
    if (rel) for (const a of combos(rel)) {
      const deal = dealt('relationship-map', a); const txt = deal.boxes.filter((b) => b.kind === 'text'); const th = deal.boxes.filter((b) => b.kind === 'connection');
      const people = txt.filter((b) => b.deckStep.step === 'person'), ties = txt.filter((b) => b.deckStep.step === 'tie');
      const ok = ties.length === people.length - 1 && th.length === 2 * ties.length
        && ties.every((t, i) => th.some((c) => (c.connA === t.id && c.connB === people[i].id) || (c.connB === t.id && c.connA === people[i].id)) && th.some((c) => (c.connA === t.id && c.connB === people[i + 1].id) || (c.connB === t.id && c.connA === people[i + 1].id)));
      if (!ok) dealBad.push('relationship-map ' + JSON.stringify(a) + ' ties not threaded to both neighbours');
    }
  }
  keep('DEAL', dealBad.length === 0, dealBad.slice(0, 3).join(' | '));

  // WORDS
  {
    const bad = [];
    for (const d of SHEET) for (const row of d.rows) {
      const c = M.DECK_CONTENT[d.id] && M.DECK_CONTENT[d.id][row.stepId];
      if (!c || c.q !== row.q || c.e !== row.e || c.x !== row.x) bad.push(`${d.id}.${row.stepId}`);
    }
    for (const d of SHEET) if (byId[d.id]) for (const a of combos(byId[d.id])) for (const b of cards(d.id, a)) {
      const nl = b.text.indexOf('\n'); const body = nl < 0 ? '' : b.text.slice(nl + 1);
      const row = d.rows.find((x) => x.stepId === (b.deckStep && b.deckStep.step));
      if (body !== '' || !row || b.prompt !== row.q || b.deckStep.deck !== d.id) bad.push(`${d.id} dealt ${b.text.split('\n')[0]}`);
    }
    keep('WORDS', bad.length === 0, bad.slice(0, 4).join(' | '));
  }

  // PAGE
  {
    const bad = [];
    for (const d of SHEET) if (byId[d.id]) for (const a of combos(byId[d.id])) {
      const cs = cards(d.id, a);
      for (let i = 0; i < cs.length; i++) {
        if (cs[i].x < 0 || cs[i].x + cs[i].w > 1 + 1e-9 || cs[i].w <= 0) bad.push(`${d.id} ${JSON.stringify(a)} #${i} outside the page`);
        for (let j = i + 1; j < cs.length; j++) if (rectsOverlap(cs[i], cs[j])) bad.push(`${d.id} ${JSON.stringify(a)} #${i}/#${j} overlap`);
      }
    }
    keep('PAGE', bad.length === 0, bad.slice(0, 3).join(' | '));
  }

  // FORMS
  {
    const g = M.FORMS_GROUPS || [];
    const all = g.flatMap((x) => x.decks);
    const bad = [];
    for (const d of SHEET) {
      const room = ROOM_BY_LINE[d.roomLine];
      const grp = g.find((x) => x.decks.includes(d.id));
      if (all.filter((id) => id === d.id).length !== 1 || !grp || grp.group !== GROUP_OF_ROOM[room] || grp.room !== room) bad.push(d.id + ' not listed once in its room');
      const cover = T(M.coverTermKey(d.id));
      if (cover !== d.note.line) bad.push(d.id + ' cover');
      const nk = 'deckNote' + d.id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
      if (T(nk + 'Line') !== d.note.line || T(nk + 'Does') !== d.note.does) bad.push(d.id + ' note');
    }
    keep('FORMS', bad.length === 0 && new Set(all).size === all.length && all.length === decks.length, bad.slice(0, 4).join(' | ') + ' ' + all.length);
  }
  return r;
}

const MUTANTS = [
  ['a Tie is threaded to nobody', 'DEAL', 'decks/library/relationshipMap.ts', (t) => t.replace('threadTo:', () => 'xthreadTo:')],
  ['a Tie is threaded to one neighbour only', 'DEAL', 'decks/library/relationshipMap.ts', (t) => t.replace('threadTo: [`person-${i}`, `person-${i + 1}`]', () => 'threadTo: [`person-${i}`]')],
  ['the Timeline sits in The Academy', 'REG', 'decks/library/timeline.ts', (t) => t.replace("room: 'fiction'", () => "room: 'academy'")],
  ['a dealt Event is not numbered', 'DEAL', 'decks/library/timeline.ts', (t) => t.replace('`${TITLE} (${i + 1})`', () => '`${TITLE}`')],
  ['a deck\'s question is reworded', 'WORDS', 'decks/content.ts', (t) => t.replace('What happened, when, and who knows about it?', () => 'What happened?')],
  ['a deck\'s example is cut', 'WORDS', 'decks/content.ts', (t) => t.replace(" Only the foreman knows it won't reopen.", () => '')],
  ['Memory Map deals one too many', 'DEAL', 'decks/library/memoryMap.ts', (t) => t.replace("if (answers.count === 'seven') return 7;", () => "if (answers.count === 'seven') return 8;")],
  ['Narrow My Question loses its last card', 'DEAL', 'decks/library/narrowMyQuestion.ts', (t) => t.replace("  ['find-out', deskTerm('deckNarrowMyQuestionFindOutTitle')],\n", () => '')],
  ['the cards of a row all sit in the first column', 'PAGE', 'decks/library/rowSlots.ts', (t) => t.replace('x: colX(i, n, marginX, gap)', () => 'x: colX(0, n, marginX, gap)')],
  ['Interview Notes is missing from the Forms list', 'FORMS', 'decks/formCounts.ts', (t) => t.replace(", 'interview-notes'", () => '')],
  ['a cover line is not the deck\'s own line', 'FORMS', 'store/deskLexicon.ts', (t) => t.replace('helpCoverMemoryMap: ', () => "helpCoverMemoryMap: 'x' + ")],
  ['a deck\'s "?" note is changed', 'FORMS', 'store/deskLexicon.ts', (t) => t.replace('deckNoteTimelineDoes: "', () => 'deckNoteTimelineDoes: "X')],
  ['a deck is left out of the registry', 'REG', 'decks/library/index.ts', (t) => t.replace('  memoryMapDeck,\n', () => '')],
  ['a deal question is reworded', 'DEAL', 'store/deskLexicon.ts', (t) => t.replace('How many memories to start with?', () => 'How many?')],

];

const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass: !!pass, detail });
const base = await tryLoad({});
if (base.err) { ok('(premise) the real decks bundle', false, base.err); }
else {
  const S = suite(base.M);
  for (const k of ['REG', 'DEAL', 'WORDS', 'PAGE', 'FORMS']) ok(`${k} on the real deck library / content table / Forms list / lexicon`, S[k].pass, S[k].detail);
  for (const [name, key, file, fn] of MUTANTS) {
    const orig = noCR(bundleText(SRC, file));
    const text = fn(orig);
    const landed = text !== orig;
    const m = landed ? await tryLoad({ [file]: fn }) : { err: 'did not land' };
    const red = !m.err && !suite(m.M)[key].pass;
    ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && (red || !!m.err), JSON.stringify({ landed, err: m.err || null }));
  }
}
let failed = 0;
for (const x of results) { if (!x.pass) failed += 1; console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.name}${x.pass ? '' : '  -- ' + x.detail}`); }
console.log(`REORG-PRESETS-B-DECKS-UNIT VERIFY: ${failed ? `FAIL - ${failed}/${results.length} failed` : `PASS (${results.length} checks)`}`);
process.exit(failed ? 1 : 0);
