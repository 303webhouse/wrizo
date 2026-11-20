// REORG THE DOC'S KIND MENU, THE PURE HALF, BROWSERLESS (Fable, Nov 20, 4:15 pm: "NICK APPROVED the Doc presets as drafted (claude/wrizors/kind-menu-presets-draft.md): Style Guide, the presets, Special Parts, Page
// Setup moved in. You build the menu's acts on your Parts layer and the new column"). No browser, no box: the real docKinds.ts is transpiled and run; each law is given a mutant (a text rewrite of the source)
// that must LAND and turn its own check red. The acts that write (applyStyleGuide, addSpecialPart, applyPreset) are reorg-kind-acts-unit.mjs.
//   NAMES    what a style guide calls the sources Part: MLA Works Cited, APA References, Chicago Bibliography, none Sources, AP no such Part; a Part's name follows the style when it still wears a style's own word
//   SETUP    the Page Setup a style guide sets (the draft's table): MLA, APA and Chicago 1-inch margins, double spaced, 12 pt, the page number top right; AP single spaced, no page numbers; None sets nothing
//   SPECIAL  a Special Part goes in its right place: Title Page first, Abstract after it, Table of Contents after that, Acknowledgements in the front, the sources Part near the end (before an Appendix), Appendix last;
//            a Part already there is found, not made twice (by its template or its name, no saved tag)
//   PRESETS  the list as approved: 3 academic, 4 business, 4 web and journalism, 3 creative, 4 screenplay; every Part named as drafted; the sources Part wears the style guide's word (and AP has none);
//            MLA's Academic Research drops the Title Page and the Abstract and opens with the heading block
//   PLAN     what a preset adds: in an empty Doc the preset's Parts are the Doc (its one empty Part is the first of them); in a Doc with words they go after hers and nothing of hers is in the plan
// Run: node scripts/harness/reorg-kinds-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = new URL('../../src/reorg/docKinds.ts', import.meta.url);
const lf = (s) => s.split('\r\n').join('\n');
const exists = fs.existsSync(SRC);
const srcText = exists ? lf(fs.readFileSync(SRC, 'utf8')) : '';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const J = (v) => JSON.stringify(v);
const P = (id, name, template = null) => ({ id, name, template });

function suite(src) {
  const R = {};
  if (!src) return R;
  const K = load(src);
  // NAMES
  {
    const names = ['mla', 'apa', 'chicago', 'none', 'ap'].map((s) => K.sourcesName(s));
    const follows = [K.followStyle('Works Cited', 'apa'), K.followStyle('References', 'mla'), K.followStyle('Bibliography', 'none'), K.followStyle('Sources', 'chicago'), K.followStyle('My Own Name', 'apa'), K.followStyle('Works Cited', 'ap')];
    R.NAMES = { pass: J(names) === J(['Works Cited', 'References', 'Bibliography', 'Sources', null]) && J(follows) === J(['References', 'Works Cited', 'Sources', 'Bibliography', 'My Own Name', 'Works Cited']), detail: J({ names, follows }) };
  }
  // SETUP
  {
    const dbl = { margins: 'normal', lineSpacing: 2, size: 12, pageNumbers: { on: true, placement: 'top-right' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };
    const ap = { margins: 'normal', lineSpacing: 1, size: 12, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' } };
    const got = ['mla', 'apa', 'chicago', 'ap', 'none'].map((s) => K.pageSetupFor(s));
    const fresh = K.pageSetupFor('mla'); fresh.pageNumbers.on = false;   // a copy: changing it never changes the table
    R.SETUP = { pass: J(got[0]) === J(dbl) && J(got[1]) === J(dbl) && J(got[2]) === J(dbl) && J(got[3]) === J(ap) && got[4] === null && K.pageSetupFor('mla').pageNumbers.on === true, detail: J(got) };
  }
  // SPECIAL
  {
    const body = [P('b1', 'One'), P('b2', 'Two'), P('b3', 'Three')];
    const place = (parts, kind) => K.placeSpecial(parts, kind);
    const t1 = place(body, 'title');                                                    // first
    const withTitle = [P('t', 'Title Page', 'title'), ...body];
    const a1 = place(withTitle, 'abstract');                                            // after the Title Page
    const withAbs = [P('t', 'Title Page', 'title'), P('a', 'Abstract'), ...body];
    const c1 = place(withAbs, 'toc');                                                   // after the Abstract
    const ack = place(body, 'ack');                                                     // the front, before the body
    const s1 = place(body, 'sources');                                                  // near the end: after the body
    const withApp = [...body, P('x', 'Appendix')];
    const s2 = place(withApp, 'sources');                                               // before the Appendix
    const ap1 = place(body, 'appendix');                                                // last
    const ap2 = place([...body, P('w', 'Works Cited', 'bibliography')], 'appendix');   // after the sources too
    const dup = place([...body, P('w', 'References', 'bibliography')], 'sources');      // already there (its template), whatever its name
    const dup2 = place([P('t', 'title page')], 'title');                                // already there (its name, any case)
    const ackAfterToc = place([P('t', 'Title Page', 'title'), P('a', 'Abstract'), P('c', 'Table of Contents'), ...body], 'ack');   // front specials keep their order
    R.SPECIAL = {
      pass: J(t1) === J({ afterId: null, existing: null }) && J(a1) === J({ afterId: 't', existing: null }) && J(c1) === J({ afterId: 'a', existing: null }) && J(ack) === J({ afterId: null, existing: null })
        && J(s1) === J({ afterId: 'b3', existing: null }) && J(s2) === J({ afterId: 'b3', existing: null }) && J(ap1) === J({ afterId: 'b3', existing: null }) && J(ap2) === J({ afterId: 'w', existing: null })
        && J(dup) === J({ afterId: null, existing: 'w' }) && J(dup2) === J({ afterId: null, existing: 't' }) && J(ackAfterToc) === J({ afterId: 'c', existing: null }),
      detail: J({ t1, a1, c1, ack, s1, s2, ap1, ap2, dup, dup2, ackAfterToc }),
    };
  }
  // PRESETS
  {
    const groups = {};
    for (const p of K.PRESETS) groups[p.group] = (groups[p.group] || 0) + 1;
    const by = (id) => K.PRESETS.find((p) => p.id === id);
    const names = (id, style) => (by(id) ? K.presetParts(by(id), style) : null);
    const acad = names('academic-research', 'apa'), acadMla = names('academic-research', 'mla'), acadAp = names('academic-research', 'ap'), acadNone = names('academic-research', 'none');
    const wantAcad = ['Title Page', 'Abstract', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion', 'References', 'Appendix'];
    const arg = names('argumentative-essay', 'mla');
    const lit = names('literature-review', 'chicago');
    const memo = names('memo', 'none'), report = names('report', 'none'), proposal = names('proposal', 'none'), minutes = names('meeting-minutes', 'none');
    const blog = names('blog-post', 'none'), news = names('newsletter', 'none'), story = names('news-story', 'none'), feat = names('feature', 'none');
    const short = names('short-story', 'none'), novel = names('novel', 'none'), pe = names('personal-essay', 'none');
    const fi = names('screenplay-feature', 'none'), half = names('tv-half-hour', 'none'), hour = names('tv-hour', 'none'), film = names('short-film', 'none');
    const kinds = Object.fromEntries(K.PRESETS.map((p) => [p.id, p.kind]));
    R.PRESETS = {
      pass: J(groups) === J({ academic: 3, business: 4, web: 4, creative: 3, screenplay: 4 }) && K.PRESETS.length === 18
        && J(acad) === J(wantAcad) && J(acadMla) === J(['Heading Block', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion', 'Works Cited', 'Appendix'])
        && J(acadAp) === J(['Title Page', 'Abstract', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion', 'Appendix']) && acadNone[7] === 'Sources'
        && J(arg) === J(['Introduction', 'Background', 'Claim and Evidence 1', 'Claim and Evidence 2', 'Claim and Evidence 3', 'Counterargument', 'Rebuttal', 'Conclusion', 'Works Cited'])
        && J(lit) === J(['Introduction', 'Theme 1', 'Theme 2', 'Theme 3', 'Gaps', 'Conclusion', 'Bibliography'])
        && J(memo) === J(['Header', 'Purpose', 'Discussion', 'Action Needed']) && J(report) === J(['Executive Summary', 'Introduction', 'Findings', 'Recommendations', 'Appendix'])
        && J(proposal) === J(['Summary', 'The Problem', 'The Approach', 'Timeline', 'Budget', 'Team', 'Next Steps']) && J(minutes) === J(['Attendees', 'Agenda', 'Decisions', 'Action Items'])
        && J(blog) === J(['Headline', 'Introduction', 'Section 1', 'Section 2', 'Section 3', 'Takeaway']) && J(news) === J(['Opening', 'Main Story', 'Quick Hits', 'Sign-Off'])
        && J(story) === J(['Headline', 'Lede', 'Nut Graf', 'Body', 'Background']) && J(feat) === J(['Headline', 'Opening Scene', 'Nut Graf', 'Body', 'Kicker'])
        && J(short) === J(['Part 1', 'Part 2', 'Part 3']) && J(novel) === J(['Front Matter', 'Chapter 1', 'Chapter 2', 'Chapter 3']) && J(pe) === J(['Opening', 'Turn', 'Reflection'])
        && J(fi) === J(['Act One', 'Act Two A', 'Act Two B', 'Act Three']) && J(half) === J(['Cold Open', 'Act One', 'Act Two', 'Tag']) && J(hour) === J(['Teaser', 'Act One', 'Act Two', 'Act Three', 'Act Four', 'Act Five']) && J(film) === J(['Beginning', 'Middle', 'End'])
        && ['screenplay-feature', 'tv-half-hour', 'tv-hour', 'short-film'].every((id) => kinds[id] === 'screenplay') && Object.entries(kinds).filter(([, k]) => k === 'standard').length === 14,
      detail: J({ groups, acad, acadMla, acadAp, acadNone: acadNone && acadNone[7], arg }),
    };
  }
  // PLAN
  {
    const preset = (id) => K.PRESETS.find((p) => p.id === id);
    const empty = [{ id: 'e1', name: '', words: 0, template: null }];
    const emptyMany = [{ id: 'e1', name: '', words: 0, template: null }, { id: 'e2', name: '', words: 0, template: null }];
    const hers = [{ id: 'h1', name: 'Chapter', words: 40, template: null }, { id: 'h2', name: '', words: 0, template: null }];
    const pe = preset('personal-essay');
    const a = K.planPreset(pe, 'none', empty);        // an empty Doc: its one empty Part is the first of the preset's Parts
    const b = K.planPreset(pe, 'none', emptyMany);    // several empty Parts: the first is reused, the others are not hers to remove and stay (after)
    const c = K.planPreset(pe, 'none', hers);         // a Doc with words: all new, after the last Part, nothing of hers touched
    const d = K.planPreset(pe, 'none', []);           // no Parts at all (a Doc with nothing): all new
    R.PLAN = {
      pass: J(a) === J({ reuse: 'e1', add: ['Turn', 'Reflection'], firstName: 'Opening', after: 'e1' }) && J(b) === J({ reuse: 'e1', add: ['Turn', 'Reflection'], firstName: 'Opening', after: 'e1' })
        && J(c) === J({ reuse: null, add: ['Opening', 'Turn', 'Reflection'], firstName: null, after: 'h2' }) && J(d) === J({ reuse: null, add: ['Opening', 'Turn', 'Reflection'], firstName: null, after: null }),
      detail: J({ a, b, c, d }),
    };
  }
  return R;
}

ok('the real docKinds.ts exists', exists, 'src/reorg/docKinds.ts is missing');
const base = exists ? suite(srcText) : {};
for (const k of ['NAMES', 'SETUP', 'SPECIAL', 'PRESETS', 'PLAN']) ok(`${k} on the real docKinds.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

const MUT = [
  ['APA calls the sources Part Works Cited', 'NAMES', (t) => t.replace("apa: 'References'", () => "apa: 'Works Cited'")],
  ['a name of her own is renamed with the style', 'NAMES', (t) => t.replace('word && SOURCE_WORDS.includes(name.trim().toLowerCase()) ? word : name', () => 'word ? word : name')],
  ['AP has a sources Part', 'NAMES', (t) => t.replace("ap: null }", () => "ap: 'Sources' }")],
  ['MLA is not double spaced', 'SETUP', (t) => t.replace("mla: { margins: 'normal', lineSpacing: 2,", () => "mla: { margins: 'normal', lineSpacing: 1.6,")],
  ['None sets a Page Setup', 'SETUP', (t) => t.replace("style === 'none' ? null :", () => "style === 'none' ? SETUP.mla :")],
  ['the table is handed out, not copied', 'SETUP', (t) => t.replace('JSON.parse(JSON.stringify(SETUP[style])) as PageSetupPatch', () => 'SETUP[style]')],
  ['the Appendix is not last: the sources go after it', 'SPECIAL', (t) => t.replace("if (specialOf(p) !== 'appendix') afterId = p.id;", () => 'afterId = p.id;')],
  ['a Special Part is made twice', 'SPECIAL', (t) => t.replace('if (there) return { afterId: null, existing: there.id };', () => '')],
  ['the front Parts do not keep their order', 'SPECIAL', (t) => t.replace('abstract: 1, toc: 2,', () => 'abstract: 2, toc: 1,')],
  ['MLA keeps the Title Page and the Abstract', 'PRESETS', (t) => t.replace('const list = preset.variants?.[style] ?? preset.parts;', () => 'const list = preset.parts;')],
  ['AP gets a sources Part', 'PRESETS', (t) => t.replace('(n === S ? (word ? [word] : []) : [n])', () => "(n === S ? [word ?? 'Sources'] : [n])")],
  ['a preset is missing', 'PRESETS', (t) => t.replace("  scr('short-film', 'Short Film', ['Beginning', 'Middle', 'End']),\n", () => '')],
  ['a Doc with words has a blank Part taken for the Doc', 'PLAN', (t) => t.replace('const empty = parts.length > 0 && parts.every(', () => 'const empty = parts.length > 0 && parts.some(')],
  ['the new Parts go to the front, not after hers', 'PLAN', (t) => t.replace('after: parts.length ? parts[parts.length - 1].id : null }', () => 'after: null }')],
];
for (const [name, key, fn] of MUT) {
  const after = exists ? fn(srcText) : srcText;
  const landed = exists && after !== srcText;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-KINDS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-KINDS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
