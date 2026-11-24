// PRESETS-B items 1 and 2, BROWSERLESS (Fable, Nov 23, 3:45 pm: the PRESETS-B load sheet, sections 2 and 3, copied word for word, never retyped).
// No browser, no box: the real planPresets.ts, docKinds.ts and the lexicon's canonical words are transpiled and run; each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
//   STRUCTS  twelve new structures join the three live ones in the PLAN tab: their ids, names and every row's heading and grey question, read back THROUGH THE LEXICON (a heading or a question that is not a lexicon word fails)
//   PRESETS  twenty new presets join the live eighteen in the PARTS menu: group, name, kind and every Part, in order; the sources Part wears the style guide's word; Title Page is the live Special Part
//   GROUPS   the menu's groups as given (Academic 4 new, Business 5, Web and Journalism 3, Creative 8); the live presets come first in each group
//   LIVE     the live 18 presets and 3 structures are unchanged (their ids, order, counts and the Parts of each)
//   GATES    Kishotenketsu, Zuihitsu, Braided Essay and the Game Design Document are NOT loaded (Freytag's Pyramid, Collage Essay, Lyric Essay and the How-To Guide stand in); the Heroine's Journey and Landay stay held
//   SETUP    a new preset leaves Page Setup and the Style Guide alone (it carries no setup of its own); Light sets only (Memoir 3 Parts, Thesis or Dissertation 8)
// Run: node scripts/harness/reorg-presets-b-unit.mjs   (from apps/desktop; browserless: needs no box turn)
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

// THE SHEET, as data. STRUCTS: id, name, rows [heading, grey question]. NEW_PRESETS: id, group, label, Parts ('{sources}' is the sources Special Part).
const LIVE_PLAN = ['stasis', 'hero', 'three'];
const STRUCTS = [{"id":"circle","name":"Story Circle","rows":[["You","Who are they when nothing is being asked of them?"],["Need","What do they want, or lack, badly enough to move?"],["Go","What unfamiliar situation do they step into?"],["Search","How do they adapt, and what does adapting cost?"],["Find","What do they get that they came for?"],["Take","What price do they pay for it?"],["Return","How do they get back to where they started?"],["Change","What can they do now that they couldn't before?"]]},
  {"id":"seven","name":"Seven-Point","rows":[["Hook","Where does your main character start, as far from the ending as you can put them?"],["First Plot Turn","What event sets the story moving?"],["First Pinch","What pressure forces them to act?"],["Midpoint","When do they stop reacting and start choosing?"],["Second Pinch","What goes so wrong that all seems lost?"],["Second Plot Turn","What do they gain or learn that makes the ending possible?"],["Resolution","What does the ending settle?"]]},
  {"id":"freytag","name":"Freytag's Pyramid","rows":[["Introduction","What must we know before anything moves?"],["Rise","What complicates things, step by step?"],["Climax","What is the turning point, after which nothing can go back?"],["Return or Fall","What follows from the turn, and what last hope or doubt delays the end?"],["Catastrophe or Resolution","Where does it land?"]]},
  {"id":"beats","name":"Fifteen Beats","rows":[["Opening Image","What does your protagonist's life look like before anything changes?"],["Theme Stated","What does someone say, almost in passing, that this story is really about?"],["Set-Up","What is missing from this life, and who else lives in it?"],["Catalyst","What happens that there's no going back from?"],["Debate","What makes your protagonist hesitate before committing?"],["Break into Two","What choice takes them into a world that works by different rules?"],["B Story","Which relationship carries what this story is about?"],["Fun and Games","What are the scenes the reader came for (the trailer moments)?"],["Midpoint","What false victory or false defeat raises the stakes and starts the clock?"],["Bad Guys Close In","What tightens from outside, and what tightens from inside?"],["All Is Lost","What dies here, literally or in spirit?"],["Dark Night of the Soul","What does your protagonist realise, alone, before finding the way through?"],["Break into Three","What idea arrives from the two stories combining?"],["Finale","How does your protagonist prove they've changed by winning their own way?"],["Final Image","What does the after-picture show that the opening couldn't?"]]},
  {"id":"scene","name":"Scene–Sequel","rows":[["Goal","What does your character want by the end of this scene?"],["Conflict","What stands in the way, and how does it fight back?"],["Disaster","How does the scene end worse than it began?"],["Reaction","How does your character feel, in their body, right after?"],["Dilemma","What are the bad options now, and why is none of them good?"],["Decision","What do they choose, and what new goal does it set?"]]},
  {"id":"toulmin","name":"Toulmin","rows":[["Claim","What are you asking the reader to accept?"],["Grounds","What facts or evidence is it built on?"],["Warrant","Why do those facts support that claim: what is the link?"],["Backing","What supports the link itself?"],["Qualifier","How sure are you: always, usually, in these cases?"],["Rebuttal","When would the claim not hold?"]]},
  {"id":"rogerian","name":"Rogerian","rows":[["The Issue","What is the disagreement, described so both sides would nod?"],["Their View","What does the other side believe, in words they'd accept?"],["Where They're Right","In what situations does their view hold?"],["Your View","What do you believe, and where does it hold?"],["Common Ground","What would both sides gain by moving toward each other?"]]},
  {"id":"oration","name":"Classical Oration","rows":[["Opening","How do you win a hearing?"],["Background","What happened, or what is the situation?"],["The Map","What will you show, and in what order?"],["Proof","What are your reasons and your evidence?"],["Answering Objections","What is the strongest case against you, and your reply?"],["Close","What should they feel and do as you finish?"]]},
  {"id":"cars","name":"CARS: Create a Research Space","rows":[["Establish the Territory","What is the topic, and why does it matter to the field?"],["Establish the Niche","What is missing, unsettled or mistaken in what has been done?"],["Occupy the Niche","What will this work do about that gap?"]]},
  {"id":"imrad","name":"IMRaD","rows":[["Introduction","What is known, what isn't, and what question does this paper answer?"],["Methods","What did you do, exactly, so someone else could repeat it?"],["Results","What did you find, before you say what it means?"],["Discussion","What do the results mean, what are their limits, and what comes next?"],["Abstract (write me last)","In five sentences, what did you ask, do, find and conclude?"]]},
  {"id":"answer","name":"Answer First","rows":[["Situation","What does the reader already know and agree with?"],["Complication","What has changed, or gone wrong?"],["Question","What question does that raise in their mind?"],["Answer","What is your answer, in one sentence?"],["Support 1","What is one reason the answer is right?"],["Support 2","What is one reason the answer is right?"],["Support 3","What is one reason the answer is right?"]]},
  {"id":"inverted","name":"Inverted Pyramid","rows":[["Most Important","What must the reader know if they stop after one paragraph?"],["Next","What supports or explains it?"],["Background","What could be cut from the bottom without harm?"]]}];
const LIVE_PRESET_IDS = ['academic-research', 'argumentative-essay', 'literature-review', 'memo', 'report', 'proposal', 'meeting-minutes', 'blog-post', 'newsletter', 'news-story', 'feature', 'short-story', 'novel', 'personal-essay', 'screenplay-feature', 'tv-half-hour', 'tv-hour', 'short-film'];
const NEW_PRESETS = [{"id":"poem","group":"creative","label":"Poem","parts":["Poem"]},
  {"id":"memoir","group":"creative","label":"Memoir","parts":["Chapter 1","Chapter 2","Chapter 3"]},
  {"id":"flash-fiction","group":"creative","label":"Flash Fiction","parts":["Story"]},
  {"id":"novella","group":"creative","label":"Novella","parts":["Part One","Part Two","Part Three"]},
  {"id":"lyric-essay","group":"creative","label":"Lyric Essay","parts":["Section 1","Section 2","Section 3","Section 4","Section 5"]},
  {"id":"collage-essay","group":"creative","label":"Collage Essay","parts":["Fragment 1","Fragment 2","Fragment 3","Fragment 4","Fragment 5","Fragment 6","Fragment 7"]},
  {"id":"treatment","group":"creative","label":"Treatment","parts":["Logline","The World","Characters","Act One","Act Two","Act Three","Tone"]},
  {"id":"how-to-guide","group":"creative","label":"How-To Guide","parts":["What You'll Be Able to Do","What You Need","Steps","If It Goes Wrong","What Next"]},
  {"id":"class-essay","group":"academic","label":"Class Essay","parts":["Introduction","Body 1","Body 2","Body 3","Conclusion","{sources}"]},
  {"id":"thesis-or-dissertation","group":"academic","label":"Thesis or Dissertation","parts":["Title Page","Abstract","Chapter 1","Chapter 2","Chapter 3","Chapter 4","Chapter 5","{sources}"]},
  {"id":"lab-report","group":"academic","label":"Lab Report","parts":["Title Page","Aim","Method","Results","Discussion","{sources}"]},
  {"id":"research-proposal","group":"academic","label":"Research Proposal","parts":["Title Page","The Question","Background","Method","Timeline","What It Will Add","{sources}"]},
  {"id":"grant-application","group":"business","label":"Grant Application","parts":["Summary","Need","Goals and Outcomes","Activities","Evaluation","Budget Narrative","About the Organization"]},
  {"id":"one-pager","group":"business","label":"One-Pager","parts":["The Point","Why It Matters","The Evidence","The Ask"]},
  {"id":"decision-memo","group":"business","label":"Decision Memo","parts":["Decision Needed","Options","Trade-Offs","Recommendation","What Happens Next"]},
  {"id":"product-spec","group":"business","label":"Product Spec","parts":["The Problem","Who It's For","What We'll Build","What We Won't","How We'll Know It Worked","Open Questions"]},
  {"id":"status-update","group":"business","label":"Status Update","parts":["Done","Next","Blocked","Decisions Needed"]},
  {"id":"op-ed","group":"web","label":"Op-Ed","parts":["The Claim","Why Now","The Evidence","The Other Side","What Should Happen"]},
  {"id":"profile","group":"web","label":"Profile","parts":["The Scene","Who They Are","Why Now","The Complication","Where It Leaves Them"]},
  {"id":"explainer","group":"web","label":"Explainer","parts":["The Question","The Short Answer","How It Works","What's Disputed","What Happens Next"]}];
const GATED = /kish|zuihitsu|braid|game.?design|heroine|landay/i;

const SRC = { plan: rd('reorg/backMenu/planPresets.ts'), kinds: rd('reorg/docKinds.ts'), chrome: rd('store/lexicon/canonical/chrome.ts'), decks: rd('store/lexicon/canonical/decks.ts') };

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  const words = () => ({ ...load(src.chrome).CANONICAL_CHROME, ...load(src.decks).CANONICAL_DECKS });
  const plan = () => load(src.plan).PLAN_PRESETS;
  const K = () => load(src.kinds);
  t('STRUCTS', () => {
    const W = words(), P = plan();
    const bad = [];
    for (const s of STRUCTS) {
      const p = P.find((x) => x.id === s.id);
      if (!p) { bad.push({ missing: s.id }); continue; }
      if (W[p.name] !== s.name) bad.push({ id: s.id, name: W[p.name], want: s.name });
      const got = p.rows.map((r) => [W[r.title], r.prompt ? W[r.prompt] : undefined, r.depth]);
      const want = s.rows.map(([h, q]) => [h, q, 0]);
      if (J(got) !== J(want)) bad.push({ id: s.id, got: got.slice(0, 2), want: want.slice(0, 2), n: [got.length, want.length] });
    }
    const order = P.map((x) => x.id).join();
    const wantOrder = LIVE_PLAN.concat(STRUCTS.map((s) => s.id)).join();
    return { pass: bad.length === 0 && order === wantOrder && P.length === 15, detail: J({ bad: bad.slice(0, 3), order }) };
  });
  t('PRESETS', () => {
    const k = K();
    const by = (id) => k.PRESETS.find((p) => p.id === id);
    const bad = [];
    for (const n of NEW_PRESETS) {
      const p = by(n.id);
      if (!p) { bad.push({ missing: n.id }); continue; }
      const none = k.presetParts(p, 'none'), apa = k.presetParts(p, 'apa'), ap = k.presetParts(p, 'ap');
      const expand = (style) => n.parts.flatMap((x) => (x === '{sources}' ? (k.sourcesName(style) ? [k.sourcesName(style)] : []) : [x]));
      if (p.group !== n.group || p.label !== n.label || p.kind !== 'standard' || J(none) !== J(expand('none')) || J(apa) !== J(expand('apa')) || J(ap) !== J(expand('ap'))) bad.push({ id: n.id, group: p.group, label: p.label, kind: p.kind, none });
    }
    return { pass: bad.length === 0 && k.PRESETS.length === 38, detail: J({ n: k.PRESETS.length, bad: bad.slice(0, 3) }) };
  });
  t('GROUPS', () => {
    const k = K();
    const groups = {};
    for (const p of k.PRESETS) groups[p.group] = (groups[p.group] || 0) + 1;
    const liveFirst = ['academic', 'business', 'web', 'creative', 'screenplay'].every((g) => {
      const ids = k.PRESETS.filter((p) => p.group === g).map((p) => p.id);
      const liveN = ids.filter((id) => LIVE_PRESET_IDS.includes(id)).length;
      return ids.slice(0, liveN).every((id) => LIVE_PRESET_IDS.includes(id));
    });
    return { pass: J(groups) === J({ academic: 7, business: 9, web: 7, creative: 11, screenplay: 4 }) && liveFirst, detail: J({ groups, liveFirst }) };
  });
  t('LIVE', () => {
    const k = K();
    const ids = k.PRESETS.slice(0, 18).map((p) => p.id);
    const std = k.PRESETS.filter((p) => LIVE_PRESET_IDS.includes(p.id));
    const mla = k.presetParts(k.PRESETS.find((p) => p.id === 'academic-research'), 'mla');
    const P = plan();
    const counts = LIVE_PLAN.map((id) => (P.find((x) => x.id === id) || { rows: [] }).rows.length);
    return { pass: J(ids) === J(LIVE_PRESET_IDS) && std.length === 18 && mla[0] === 'Heading Block' && J(P.slice(0, 3).map((x) => x.id)) === J(LIVE_PLAN) && J(counts) === J([7, 15, 12]), detail: J({ ids, counts }) };
  });
  t('GATES', () => {
    const k = K(), P = plan(), W = words();
    const inKinds = k.PRESETS.filter((p) => GATED.test(p.id + ' ' + p.label + ' ' + p.parts.join(' '))).map((p) => p.id);
    const inPlan = P.filter((p) => GATED.test(p.id + ' ' + W[p.name])).map((p) => p.id);
    const swaps = ['lyric-essay', 'collage-essay', 'how-to-guide'].every((id) => k.PRESETS.some((p) => p.id === id)) && P.some((p) => p.id === 'freytag');
    return { pass: inKinds.length === 0 && inPlan.length === 0 && swaps, detail: J({ inKinds, inPlan, swaps }) };
  });
  t('SETUP', () => {
    const k = K();
    const byId = (id) => k.PRESETS.find((p) => p.id === id);
    const fields = NEW_PRESETS.map((n) => byId(n.id)).filter(Boolean).map((p) => Object.keys(p).filter((x) => !['id', 'group', 'label', 'kind', 'parts', 'variants'].includes(x)));
    const lab = byId('lab-report'), prop = byId('research-proposal'), thesis = byId('thesis-or-dissertation');
    const first = [lab, prop, thesis].map((p) => (p ? k.presetParts(p, 'none')[0] : null));
    const special = first.every((n) => n && k.specialOf({ id: 'x', name: n, template: null }) === 'title');
    const light = byId('memoir') && k.presetParts(byId('memoir'), 'none').length === 3 && thesis && k.presetParts(thesis, 'none').length === 8;
    const treatment = byId('treatment') && byId('treatment').kind === 'standard';
    const empty = lab ? k.planPreset(lab, 'none', [{ id: 'e1', name: '', words: 0, template: null }]) : null;
    return { pass: fields.length === 20 && fields.every((f) => f.length === 0) && special && !!light && !!treatment && !!empty && empty.firstName === 'Title Page' && J(empty.add) === J(['Aim', 'Method', 'Results', 'Discussion', 'Sources']), detail: J({ fields: fields.flat(), first, light: !!light, empty }) };
  });
  return R;
}

const base = suite(SRC);
for (const k of ['STRUCTS', 'PRESETS', 'GROUPS', 'LIVE', 'GATES', 'SETUP']) ok(`${k} on the real planPresets.ts / docKinds.ts / lexicon`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

const MUT = [
  ['a Part of the Lab Report is renamed', 'PRESETS', 'kinds', (t) => t.replace("'Aim', 'Method', 'Results'", () => "'Aim', 'Methods', 'Results'")],
  ['the Class Essay writes its sources Part as a plain word, not the live one', 'PRESETS', 'kinds', (t) => t.replace("'Body 3', 'Conclusion', S]", () => "'Body 3', 'Conclusion', 'Sources']")],
  ['a preset is missing', 'PRESETS', 'kinds', (t) => t.replace(/ {2}std\('one-pager'.*\n/, () => '')],
  ['the Memoir loads its Full set, not the Light one', 'SETUP', 'kinds', (t) => t.replace("['Chapter 1', 'Chapter 2', 'Chapter 3']),\n  std('flash-fiction'", () => "['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4']),\n  std('flash-fiction'")],
  ['a new preset carries a Page Setup of its own', 'SETUP', 'kinds', (t) => t.replace("const std = (id: string, group: PresetGroup, label: string, parts: readonly string[], variants?: Preset['variants']): Preset => ({ id, group, label, kind: 'standard', parts,", () => "const std = (id: string, group: PresetGroup, label: string, parts: readonly string[], variants?: Preset['variants']): Preset => ({ id, group, label, kind: 'standard', pageSetup: 1, parts,")],
  ['the Zuihitsu is loaded in the Collage Essay\'s place', 'GATES', 'kinds', (t) => t.replace("std('collage-essay', 'creative', 'Collage Essay'", () => "std('zuihitsu', 'creative', 'Zuihitsu'")],
  ['the Game Design Document is loaded beside the How-To Guide', 'GATES', 'kinds', (t) => t.replace("  std('how-to-guide'", () => "  std('game-design-document', 'creative', 'Game Design Document', ['Pitch']),\n  std('how-to-guide'")],
  ['a live preset leaves the front of its group', 'LIVE', 'kinds', (t) => t.replace("std('memo', 'business', 'Memo'", () => "std('memo-2', 'business', 'Memo'")],
  ['the new presets go in front of the live ones', 'GROUPS', 'kinds', (t) => t.replace('[...LIVE_PRESETS, ...FIRST_SLICE_PRESETS]', () => '[...FIRST_SLICE_PRESETS, ...LIVE_PRESETS]')],
  ['a heading is written into the component, not the lexicon', 'STRUCTS', 'plan', (t) => t.replace("title: 'reorgPreRogerianTheIssue'", () => "title: 'The Issue' as never")],
  ['a row is indented, as if it were under an Act', 'STRUCTS', 'plan', (t) => t.replace("depth: 0, title: 'reorgPreToulminClaim'", () => "depth: 1, title: 'reorgPreToulminClaim'")],
  ['CARS loses a row', 'STRUCTS', 'plan', (t) => t.replace(/ {4}\{ depth: 0, title: 'reorgPreCarsEstablishTheTerritory'.*\n/, () => '')],
  ['a grey question is changed', 'STRUCTS', 'chrome', (t) => t.replace('What would both sides gain by moving toward each other?', () => 'What would both sides gain?')],
  ['Kishotenketsu is loaded in Freytag\'s Pyramid\'s place', 'GATES', 'chrome', (t) => t.replace('reorgPreFreytag: "Freytag\'s Pyramid"', () => 'reorgPreFreytag: "Kishōtenketsu"')],
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
console.log(bad ? `\nREORG-PRESETS-B-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PRESETS-B-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
