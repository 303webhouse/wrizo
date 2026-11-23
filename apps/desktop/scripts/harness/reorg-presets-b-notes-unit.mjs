// PRESETS-B item 3, BROWSERLESS: the "?" note of each new structure and preset (Fable, Nov 23, 3:45 pm: "item 3 as its own commit"; the PRESETS load sheet, section 1, first-slice-notes.md, copied word for word, never retyped).
// No browser, no box: the real presetNotes.ts, the lexicon's canonical words and the source of the two menus are read; each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   NOTES    all 12 structures and all 20 presets have their note: "In a line", "What it does", the example (where the sheet gives one), the credit, the line the "?" must say, the old names, each read back THROUGH THE LEXICON and equal to the sheet
//   RULES    the Poem's note has no example (the poet's rule); Fifteen Beats names no book and no product; the "?" must-say lines ride on the Class Essay, Thesis or Dissertation and Grant Application; the Classical Oration shows its old names;
//            the live 18 presets and 3 structures are given no note (nothing live changes); nothing gated and nothing unbuilt ("Quick Preset") is named
//   WIRING   the "?" is the app's own pressable DrawerNote (a button the keyboard reaches, never hover-only); both menus draw it; its words are lexicon words, none written into a component
// Run: node scripts/harness/reorg-presets-b-notes-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}

// THE SHEET, as data: id, name, then the note's lines (null: the note has none).
const STRUCT_NOTES = [
  {"id":"circle","name":"Story Circle","line":"A character leaves what they know, gets what they wanted, pays for it, and comes home changed.","does":"It draws a story as a circle with eight stops. The first half takes your character out of the familiar, and the second half brings them back different. Because it is a circle, the last stop sits beside the first, so you can see exactly what changed.","eg":"A night-shift baker who has never left her street wants her late father's bread recipe back from the cousin who took it. She crosses the country to get it, learns what it cost her father to write it, and comes home able to change it.","credit":"after Dan Harmon's story circle.","must":null,"names":null},
  {"id":"seven","name":"Seven-Point","line":"Seven turning points, planned from the ending backwards.","does":"You decide where the story ends, then set the opening as its opposite. The five points between are the steps that carry your character from one to the other. Many writers fill the last row first.","eg":"The ending: a timid archivist exposes a forged charter in front of the whole council. So the opening: she can't bring herself to correct a colleague's spelling. The midpoint: she stops hiding what she has found and starts hunting the forger.","credit":"after Dan Wells's seven-point structure.","must":null,"names":null},
  {"id":"freytag","name":"Freytag's Pyramid","line":"The five-part rise and fall of a classical tragedy.","does":"It puts the turning point in the middle, not near the end. Everything before it climbs toward that moment, and everything after follows from it.","eg":"A proud bridge-builder is warned about the river. He builds faster as a rival closes in, and opens the bridge in a storm against advice. The first cracks show while one engineer still thinks it can be saved. The bridge falls.","credit":"Gustav Freytag, *Die Technik des Dramas* (1863).","must":null,"names":null},
  {"id":"beats","name":"Fifteen Beats","line":"Fifteen moments a film-shaped story usually passes through, in order.","does":"It breaks three acts into smaller named moments, so you can see what is missing between the big turns. Treat the beats as questions to answer, not as page numbers to hit.","eg":null,"credit":null,"must":null,"names":null},
  {"id":"scene","name":"Scene–Sequel","line":"A scene where someone tries for something, then a quieter stretch where they take it in and choose again.","does":"The first three steps (goal, conflict, disaster) are the action. The last three (reaction, dilemma, decision) are the breath after it. The decision becomes the next scene's goal, which is how one scene pulls the next.","eg":"Marta wants to hand her brother's letter to the ferry captain before the boat leaves. A deckhand won't let anyone aboard without a ticket, and the gangway is already lifting. The ferry pulls out with the letter still in her hand. She sits on a bollard with the letter crushed in her fist, shaking. Wait a week for the next boat, pay a stranger to chase it, or open the letter herself. She hires a fisherman to run her out to the ferry's first stop.","credit":"after Dwight Swain.","must":null,"names":null},
  {"id":"toulmin","name":"Toulmin","line":"An argument taken apart into six working pieces.","does":"It makes you say not only what you claim and what your evidence is, but why that evidence supports that claim. The last two rows keep the argument honest about how far it reaches.","eg":"Claim: the town library should open on Sundays. Grounds: Sunday is when most new readers could come. Warrant: a public service should be open when the public is free. Qualifier: at least in term time. Rebuttal: unless weekday hours would be cut to pay for it.","credit":"Stephen Toulmin, *The Uses of Argument* (1958).","must":null,"names":null},
  {"id":"rogerian","name":"Rogerian","line":"An argument that states the other side fairly first, and ends on common ground.","does":"It asks you to describe the opposing view so well that the people who hold it would accept your account, before you give your own. It suits a reader who already disagrees and needs to be heard before they will keep reading.","eg":"Should a shopping street close to cars at weekends? Shopkeepers fear losing customers who drive, and they are right that deliveries need access. You show that more people come on foot when it is closed. Common ground: close it from noon, with a delivery window each morning.","credit":"named for the psychologist Carl Rogers; set out for writers by Young, Becker and Pike (1970).","must":null,"names":null},
  {"id":"oration","name":"Classical Oration","line":"The six-part speech taught in ancient Greek and Roman schools, and still the skeleton of most persuasive essays.","does":"It orders a case the way a listener needs it: win a hearing, give the facts, say what you will show, show it, answer the other side, and close.","eg":"A student's speech for a later school start. It opens on the 6:40 bus, gives the timetable, promises three reasons, gives them, answers \"practice will run late\", and ends by asking for a one-term trial.","credit":"classical rhetoric. The names vary a little between the ancient handbooks.","must":null,"names":"Opening (exordium) · Background (narratio) · The Map (partitio) · Proof (confirmatio) · Answering Objections (refutatio) · Close (peroratio)."},
  {"id":"cars","name":"CARS: Create a Research Space","line":"Three moves that open a research paper by making room for it.","does":"First you show the topic matters to your field. Then you point to what is missing or unsettled. Then you say how your work fills that gap. It shapes the introduction only, not the whole paper.","eg":"City beekeeping has grown fast, and cities now count their hives. Nobody has measured whether rooftop hives crowd out wild bees. This study counts wild bees near forty rooftops over two summers.","credit":"John Swales, *Genre Analysis* (1990).","must":null,"names":null},
  {"id":"imrad","name":"IMRaD","line":"Introduction, Methods, Results and Discussion: the order most science papers follow.","does":"It keeps what you did apart from what you found, and what you found apart from what you think it means, so a reader can check each on its own. The Abstract comes last in the list because most writers write it last.","eg":"Studies show plants calm offices; none has tested a classroom during a timed task. Two classes, one with twelve plants and one without, the same twenty-minute attention test, four weeks. The plant class scored eleven per cent higher in weeks three and four; weeks one and two were level. The gap appears only after two weeks, which suggests habit rather than novelty; two classes is a small sample.","credit":"no single author. It is the common shape of a scientific paper.","must":null,"names":null},
  {"id":"answer","name":"Answer First","line":"Say the answer at the top, then the reasons under it.","does":"It opens with what the reader already knows, what has changed, and the question that raises. Then it gives your answer at once. The reasons follow, so a busy reader can stop early and still have the point.","eg":"The shop has always closed on Mondays. A new bus route now brings its biggest crowds on Mondays. Should it open? Yes, for a short day. Three reasons follow: the footfall, the staff who have asked for hours, and a cheap three-month trial.","credit":"the pyramid shape, after Barbara Minto.","must":null,"names":null},
  {"id":"inverted","name":"Inverted Pyramid","line":"The most important thing first, the least important last.","does":"A news story is written so it can be cut from the bottom and still make sense. A reader who stops after one paragraph has the news.","eg":"First: the footbridge over the river closes on Monday for six weeks of repairs. Next: the detour adds ten minutes, and the council says why now. Last: the bridge was last repaired thirty years ago.","credit":"a long-standing newsroom convention, with no single author.","must":null,"names":null},
];
const PRESET_NOTES = [
  {"id":"poem","name":"Poem","line":"A bare page for one poem.","does":"It gives the poem a Part of its own and nothing else. There is no question on the page, because the empty page is the form.","eg":null,"credit":null,"must":null,"names":null},
  {"id":"memoir","name":"Memoir","line":"A book about one part of your own life, in chapters.","does":"It starts you with three chapters. A memoir follows one stretch or one thread of a life, not the whole of it, so the first job is choosing which.","eg":"The year a daughter ran her father's failing hardware shop: the day she took the keys, the winter the heating broke, the morning she sold it.","credit":null,"must":null,"names":null},
  {"id":"flash-fiction","name":"Flash Fiction","line":"A whole story in a page or two.","does":"One Part, built around the one moment the story can't do without. Everything else is cut or implied.","eg":"A man returns a library book forty years late, and the librarian recognises her own handwriting in the margin.","credit":null,"must":null,"names":null},
  {"id":"novella","name":"Novella","line":"A long story, or a short novel, in three parts.","does":"It is longer than a story and tighter than a novel, and usually follows one thread without side plots. Each Part asks what has to be true by its end.","eg":"One summer a surveyor spends mapping a valley that is about to be flooded.","credit":null,"must":null,"names":null},
  {"id":"lyric-essay","name":"Lyric Essay","line":"An essay that moves by image and sound more than by argument.","does":"Five sections, each held together by an image or a sound. The white space between them does some of the work.","eg":"A grandfather's workshop, told through five smells.","credit":null,"must":null,"names":null},
  {"id":"collage-essay","name":"Collage Essay","line":"An essay made of separate pieces set side by side.","does":"Seven fragments with gaps between them. The reader makes the connections in the gaps, so what you leave out matters as much as what you put in.","eg":"Moving house, told through a packing list, an overheard argument, a floor plan described in words, and four more pieces.","credit":null,"must":null,"names":null},
  {"id":"treatment","name":"Treatment","line":"The story of a film or pilot told in prose, before the script.","does":"It tells the whole story in the present tense, act by act, with the world, the people and the tone set out first. It is what a writer shows someone before writing scenes. It makes an ordinary Doc, not a Screenplay Doc.","eg":"Two estranged sisters inherit a travelling puppet theatre and one last booked tour.","credit":null,"must":null,"names":null},
  {"id":"how-to-guide","name":"How-To Guide","line":"Instructions that take someone from \"can't\" to \"can\".","does":"It starts with what the reader will be able to do at the end, lists what they need, and gives the steps in order. \"If It Goes Wrong\" covers the two or three mistakes everyone makes.","eg":"How to bleed a radiator.","credit":null,"must":null,"names":null},
  {"id":"class-essay","name":"Class Essay","line":"A short school essay: your answer, your reasons, and what they add up to.","does":"It opens with your answer to the question you were set. Each reason gets its own Part, with an example. The end says what the reasons add up to.","eg":"\"Should the school day start later?\" answered yes, with a reason each about sleep, buses and after-school jobs.","credit":null,"must":"Three body Parts is a starting point, not a rule. Add or remove one whenever your argument needs it.","names":null},
  {"id":"thesis-or-dissertation","name":"Thesis or Dissertation","line":"A long research work in chapters, with its front and back pages in place.","does":"It starts you with a Title Page, an Abstract, five chapters and the sources Part. Each chapter asks what it proves that the thesis needs.","eg":"How three coastal towns rebuilt their harbours: one chapter per town, between an opening and a closing chapter.","credit":null,"must":"Your department's rules come first. Rename, add or remove Parts to match them.","names":null},
  {"id":"lab-report","name":"Lab Report","line":"The write-up of one experiment: what you tried to find out, what you did, and what you found.","does":"It keeps the method apart from the results, and the results apart from what you think they mean, so someone else could repeat the work and check it.","eg":"Does basil grow faster under blue light? Two trays, four weeks, a ruler.","credit":null,"must":null,"names":null},
  {"id":"research-proposal","name":"Research Proposal","line":"A plan for research you haven't done yet, written to win approval or funding.","does":"It names one question, shows what is already known and where that stops, and says how you would find out and how long it would take. The last Part says who would be able to do or know something new.","eg":"A proposal to interview night-shift bus drivers about how route changes affect their sleep.","credit":null,"must":null,"names":null},
  {"id":"grant-application","name":"Grant Application","line":"A funding request, in the seven sections most funders ask for.","does":"It walks from a short summary through the need, the goals, the work, how you will know it worked, and what each cost buys, to who you are.","eg":"A community choir asks a local foundation for a year of rehearsal-space rent.","credit":null,"must":"If your funder gives its own headings, use theirs. Rename these Parts, or add your own with New Part.","names":null},
  {"id":"one-pager","name":"One-Pager","line":"One page that makes one point and asks for one thing.","does":"It forces a choice about what matters most. If a reader gives it thirty seconds, they should leave knowing the point and what you want from them.","eg":"One page asking a housing board to fund bike racks at three buildings.","credit":null,"must":null,"names":null},
  {"id":"decision-memo","name":"Decision Memo","line":"A memo that sets out a choice so someone can make it.","does":"It says what must be decided, by whom and by when, before anything else. Then it gives the real options and what each costs, and only then your recommendation.","eg":"A clinic manager must choose between longer evening hours and opening on Saturdays.","credit":null,"must":null,"names":null},
  {"id":"product-spec","name":"Product Spec","line":"What you will build, for whom, and how you will know it worked.","does":"It starts from what someone can't do today, not from the feature. \"What We Won't\" is there because readers assume more is included than you plan to build.","eg":"Letting a small bakery's customers reorder last week's box in one tap.","credit":null,"must":null,"names":null},
  {"id":"status-update","name":"Status Update","line":"Where a piece of work stands, in four short parts.","does":"It separates what is finished from what is stuck, and puts the decisions you need from the reader where they can't be missed.","eg":"A Friday update on an office move: what is packed, what moves on Monday, the lift that is out of order, and who must approve weekend access.","credit":null,"must":null,"names":null},
  {"id":"op-ed","name":"Op-Ed","line":"A short opinion piece that makes one claim and argues it.","does":"It states what you think in a form someone could disagree with, says why it matters now, and takes on the best argument against you before it ends.","eg":"The town should stop charging for library cards.","credit":null,"must":null,"names":null},
  {"id":"profile","name":"Profile","line":"A portrait of one person, built from scenes and reporting.","does":"It opens by showing the person doing something, then says who they are and why a reader should meet them now. \"The Complication\" is the part that doesn't fit the easy version of them.","eg":"The last person in a village who still repairs clocks.","credit":null,"must":null,"names":null},
  {"id":"explainer","name":"Explainer","line":"One question, answered plainly for a reader who is new to it.","does":"It gives the short answer early, then the working detail. \"What's Disputed\" keeps it honest about where informed people disagree.","eg":"\"Why does our river flood every third spring?\"","credit":null,"must":null,"names":null},
];
const LIVE_PRESET_IDS = ['academic-research', 'argumentative-essay', 'literature-review', 'memo', 'report', 'proposal', 'meeting-minutes', 'blog-post', 'newsletter', 'news-story', 'feature', 'short-story', 'novel', 'personal-essay', 'screenplay-feature', 'tv-half-hour', 'tv-hour', 'short-film'];
const LIVE_PLAN_IDS = ['stasis', 'hero', 'three'];
const LINES = ['line', 'does', 'eg', 'credit', 'must', 'names'];

const SRC = {
  notes: rd('reorg/presetNotes.ts'), note: rd('reorg/PresetNote.tsx'), kindMenu: rd('reorg/DocKindMenu.tsx'), presetsMenu: rd('reorg/backMenu/PresetsMenu.tsx'),
  chrome: rd('store/lexicon/canonical/chrome.ts'),
};

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  const W = () => load(src.chrome).CANONICAL_CHROME;
  const tables = () => { const m = load(src.notes); return { S: m.STRUCTURE_NOTES, P: m.PRESET_NOTES }; };
  const read = (note, w) => Object.fromEntries(LINES.map((k) => [k, note && note[k] ? w[note[k]] : null]));
  t('NOTES', () => {
    const w = W(), { S, P } = tables();
    const bad = [];
    for (const [tbl, list] of [[S, STRUCT_NOTES], [P, PRESET_NOTES]]) {
      for (const n of list) {
        const got = read(tbl[n.id], w);
        const want = Object.fromEntries(LINES.map((k) => [k, n[k]]));
        if (J(got) !== J(want)) bad.push({ id: n.id, got: LINES.filter((k) => got[k] !== want[k]).map((k) => [k, String(got[k]).slice(0, 50)]) });
      }
    }
    const ids = J(Object.keys(S).sort()) === J(STRUCT_NOTES.map((n) => n.id).sort()) && J(Object.keys(P).sort()) === J(PRESET_NOTES.map((n) => n.id).sort());
    const labels = ['reorgPreNoteLabel', 'reorgPreNoteEg', 'reorgPreNoteCredit', 'reorgPreNoteNames'].every((k) => typeof w[k] === 'string' && w[k].length > 0) && /\{name\}/.test(w.reorgPreNoteLabel || '');
    return { pass: bad.length === 0 && ids && labels, detail: J({ bad: bad.slice(0, 3), ids, labels }) };
  });
  t('RULES', () => {
    const w = W(), { S, P } = tables();
    const all = Object.values(S).concat(Object.values(P));
    const text = all.flatMap((n) => LINES.filter((k) => n[k]).map((k) => w[n[k]])).join('\n');
    const poem = P.poem, beats = S.beats, oration = S.oration;
    const must = ['class-essay', 'thesis-or-dissertation', 'grant-application'].every((id) => P[id] && P[id].must) && Object.keys(P).filter((id) => P[id].must).length === 3;
    const live = LIVE_PRESET_IDS.filter((id) => P[id]).concat(LIVE_PLAN_IDS.filter((id) => S[id]));
    const mustSay = P['class-essay'] && w[P['class-essay'].must] === 'Three body Parts is a starting point, not a rule. Add or remove one whenever your argument needs it.';
    const grant = P['grant-application'] && /New Part/.test(w[P['grant-application'].must]) && !/Quick Preset/.test(text);
    return { pass: !!poem && !poem.eg && !!beats && !beats.eg && !beats.credit && !/save the cat|snyder|dorothy|oz\b/i.test(text) && must && !!mustSay && !!grant
      && !!oration && !!oration.names && Object.values(S).filter((n) => n.names).length === 1 && live.length === 0 && !/kish|zuihitsu|braid|game design/i.test(text),
    detail: J({ poem: !!poem && !poem.eg, beats, must, live }) };
  });
  t('WIRING', () => {
    const w = W();
    const comp = src.note, kind = src.kindMenu, plan = src.presetsMenu;
    const sentences = STRUCT_NOTES.concat(PRESET_NOTES).flatMap((n) => [n.line, n.does]).filter(Boolean).map((s) => s.slice(0, 40));
    const written = sentences.filter((s) => [comp, kind, plan, src.notes].some((f) => f.includes(s)));
    return { pass: /import \{ DrawerNote \} from '\.\.\/components\/DrawerNote'/.test(comp) && /<DrawerNote\b/.test(comp) && !/onMouse(Enter|Over|Leave)|onPointer(Enter|Over)|onHover/.test(comp)
      && /PresetNote/.test(kind) && /PRESET_NOTES/.test(kind) && /PresetNote/.test(plan) && /STRUCTURE_NOTES/.test(plan) && written.length === 0 && typeof w.reorgPreNoteLabel === 'string',
    detail: J({ drawerNote: /<DrawerNote\b/.test(comp), kind: /PresetNote/.test(kind), plan: /PresetNote/.test(plan), written: written.length }) };
  });
  return R;
}

const base = suite(SRC);
for (const k of ['NOTES', 'RULES', 'WIRING']) ok(`${k} on the real presetNotes.ts / PresetNote.tsx / menus / lexicon`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

const MUT = [
  ['a note\'s first line is changed', 'NOTES', 'chrome', (t) => t.replace('A bare page for one poem.', () => 'A page.')],
  ['the Poem is given an example', 'RULES', 'notes', (t) => t.replace('poem: { line:', () => "poem: { eg: 'reorgKindNoteMemoirEg', line:")],
  ['Fifteen Beats is given an example (its deck\'s names a book)', 'RULES', 'notes', (t) => t.replace('beats: { line:', () => "beats: { eg: 'reorgPreNoteCircleEg', line:")],
  ['a live preset is given a note', 'RULES', 'notes', (t) => t.replace('export const PRESET_NOTES: Record<string, PresetNote> = {\n', () => "export const PRESET_NOTES: Record<string, PresetNote> = {\n  memo: { line: 'reorgKindNotePoemLine', does: 'reorgKindNotePoemDoes' },\n")],
  ['the Class Essay loses its must-say line', 'RULES', 'notes', (t) => t.replace(", must: 'reorgKindNoteClassEssayMust'", () => '')],
  ['a gated name appears in a note', 'RULES', 'chrome', (t) => t.replace('Add or remove one whenever your argument needs it.', () => 'Add or remove one, as in the Kish\u014dtenketsu.')],
  ['the Grant Application note points at Quick Preset, which is not built', 'RULES', 'chrome', (t) => t.replace('or add your own with New Part.', () => 'or add your own with Quick Preset.')],
  ['the "?" is hover-only', 'WIRING', 'note', (t) => t.replace('<span className="reorg-preset-note" data-preset-note={id}>', () => '<span className="reorg-preset-note" onMouseEnter={() => {}} data-preset-note={id}>')],
  ['the PARTS menu forgets the "?"', 'WIRING', 'kindMenu', (t) => t.split('PRESET_NOTES').join('NO_NOTES')],
  ['the PLAN list forgets the "?"', 'WIRING', 'presetsMenu', (t) => t.split('STRUCTURE_NOTES').join('NO_NOTES')],
  ['a note\'s words are written into the component', 'WIRING', 'note', (t) => t.replace('export function PresetNoteButton', () => "const WRITTEN = 'A bare page for one poem.';\nexport function PresetNoteButton")],
];
for (const [name, key, file, fn] of MUT) {
  const text = SRC[file];
  const after = fn(text);
  const landed = after !== text;
  let res = null, err = null;
  try { res = landed ? suite({ ...SRC, [file]: after }) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-PRESETS-B-NOTES-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PRESETS-B-NOTES-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
