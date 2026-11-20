// REORG PUBLISHING AS A VIEW + EXPORT, BROWSERLESS (Fable, Nov 20, 11:45 am; apps/desktop/src/reorg/publishingText.ts). No browser, no box: the real publishingText.ts is transpiled and run, and each law
// is given a mutant (a text rewrite of the source) that must land and turn its own check red.
//   ORD   the file is in the DOC's order whatever order the Parts were chosen in
//   ALL   no Parts chosen (null) = every Part; an empty choice goes out as nothing (count 0, no content)
//   SUB   only the chosen Parts' words are in the file; an unchosen Part's words are nowhere in it
//   WORDS every chosen Part's words are in the file byte for byte (md and txt), in order; strip the title and the headings and the rest is the Parts' own words, nothing added
//   HEAD  md headings go by the level as drawn (## ### ####), a Part the writer did not name has none, and with no title the base is one deeper up (# ## ###); txt headings are the plain name
//   TITLE a Doc of one loose page (title null) puts nothing above its words; a Doc with a title leads with it (md: # title)
//   EMPTY a Part with no words and no name goes out as nothing; a named Part with no words keeps its heading
//   LVL   a level outside 0..2 is held to the range; the heading never grows past ####
//   HTML  Export > Web (HTML): the same Parts in the Doc's order as one web page; headings h1 (title), h2 to h4 by level; names and the title are escaped; the page is whole (doctype, charset, title) (Fable, Nov 20)
//   HTMLMD  the page's words as web markup (publishingHtml.ts): strong, em, u, s, headings, quote, list, align and indent, typed escapes as the character; no marker or app class left (Fable, Nov 20)
// Run: node scripts/harness/reorg-publish-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = new URL('../../src/reorg/publishingText.ts', import.meta.url);
const lf = (s) => s.split('\r\n').join('\n');
const exists = fs.existsSync(SRC);
const srcText = exists ? lf(fs.readFileSync(SRC, 'utf8')) : '';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

function load(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('module', 'exports', out)(m, m.exports);
  return m.exports;
}

const P = (id, name, level, md, txt = md, html = md ? `<p>${md}</p>` : '') => ({ id, name, level, md, txt, html });
const PARTS = [
  P('a', 'Opening', 0, 'It was **dark**.\nVery dark.', 'It was dark.\nVery dark.'),
  P('b', '', 0, 'Unnamed words, kept.'),
  P('c', 'The turn', 1, 'Then a light.\r\nAnd a door.', 'Then a light.\nAnd a door.'),
  P('d', 'Deeper', 2, 'Down here.'),
  P('e', '', 0, ''),
  P('f', 'Named but empty', 0, ''),
  P('g', 'Close', 0, 'The end \u{1F600} of it.'),
];

function suite(src) {
  const R = {};
  if (!src) return R;
  const X = load(src);
  const out = (title, fmt, ids) => X.publicationText(title, PARTS, fmt, ids);
  const idsOf = (c) => c;
  // ORD
  {
    const asked = out('T', 'md', ['g', 'a', 'c']);
    const natural = out('T', 'md', ['a', 'c', 'g']);
    const iA = asked.content.indexOf('Opening'), iC = asked.content.indexOf('The turn'), iG = asked.content.indexOf('Close');
    R.ORD = { pass: asked.content === natural.content && iA >= 0 && iA < iC && iC < iG, detail: JSON.stringify({ iA, iC, iG }) };
  }
  // ALL
  {
    const all = out('T', 'md', null), every = out('T', 'md', PARTS.map((p) => p.id)), none = out('T', 'md', []);
    R.ALL = { pass: all.content === every.content && all.count === PARTS.length && none.count === 0 && none.content === '', detail: JSON.stringify({ allCount: all.count, none }) };
  }
  // SUB
  {
    const sub = out('T', 'txt', ['a', 'g']);
    const pass = sub.count === 2 && sub.content.includes('It was dark.') && sub.content.includes('The end \u{1F600} of it.') && !sub.content.includes('Then a light') && !sub.content.includes('Unnamed words') && !sub.content.includes('Down here');
    R.SUB = { pass, detail: JSON.stringify(sub) };
  }
  // WORDS: strip title and headings; what is left is the bodies, joined by blank lines
  for (const fmt of ['md', 'txt']) {
    const ids = ['a', 'b', 'c', 'd', 'g'];
    const r = out('T', fmt, ids);
    const bodies = PARTS.filter((p) => ids.includes(p.id)).map((p) => (fmt === 'md' ? p.md : p.txt).replace(/\s+$/, ''));
    let left = r.content;
    left = left.replace(fmt === 'md' ? /^# T\n\n/ : /^T\n\n/, '');
    for (const p of PARTS) if (p.name) left = left.replace(fmt === 'md' ? new RegExp(`^#{2,4} ${p.name}\\n\\n`, 'm') : new RegExp(`^${p.name}\\n\\n`, 'm'), '');
    R[`WORDS-${fmt}`] = { pass: left === bodies.join('\n\n') + '\n', detail: JSON.stringify({ left: left.slice(0, 160) }) };
  }
  // HEAD
  {
    const md = out('T', 'md', null).content, tx = out('T', 'txt', null).content;
    const heads = md.split('\n').filter((l) => /^#+ /.test(l));
    const want = ['# T', '## Opening', '### The turn', '#### Deeper', '## Named but empty', '## Close'];
    const noTitle = out(null, 'md', null).content.split('\n').filter((l) => /^#+ /.test(l));
    const wantNo = ['# Opening', '## The turn', '### Deeper', '# Named but empty', '# Close'];
    const plain = !/^#/m.test(tx) && tx.includes('\n\nOpening\n\nIt was dark.') && tx.startsWith('T\n\n');
    R.HEAD = { pass: JSON.stringify(heads) === JSON.stringify(want) && JSON.stringify(noTitle) === JSON.stringify(wantNo) && plain && !md.includes('Unnamed words, kept.\n\n## '), detail: JSON.stringify({ heads, noTitle, plain }) };
  }
  // TITLE
  {
    const one = [P('x', '', 0, 'Just a loose page.')];
    const a = X.publicationText(null, one, 'md', null), b = X.publicationText('A Doc', one, 'md', null);
    R.TITLE = { pass: a.content === 'Just a loose page.\n' && b.content === '# A Doc\n\nJust a loose page.\n', detail: JSON.stringify({ a: a.content, b: b.content }) };
  }
  // EMPTY
  {
    const md = out('T', 'md', ['e']).content, named = out('T', 'md', ['f']).content;
    R.EMPTY = { pass: md === '# T\n' && named === '# T\n\n## Named but empty\n', detail: JSON.stringify({ md, named }) };
  }
  // LVL
  {
    const odd = [P('p', 'Neg', -3, 'one'), P('q', 'Deep', 9, 'two')];
    const md = X.publicationText('T', odd, 'md', null).content.split('\n').filter((l) => /^#+ /.test(l));
    R.LVL = { pass: JSON.stringify(md) === JSON.stringify(['# T', '## Neg', '#### Deep']), detail: JSON.stringify(md) };
  }
  // HTML (Fable, Nov 20: "Export > Web (HTML) beside Markdown and Plain Text"): the same Parts, the same order, as one web page
  {
    const H = (title, ids) => X.publicationText(title, PARTS, 'html', ids);
    const headsOf = (s) => [...s.matchAll(/<h([1-6])>(.*?)<\/h\1>/g)].map((m) => `${m[1]}:${m[2]}`);
    const all = H('T', null);
    const heads = headsOf(all.content), noTitle = headsOf(H(null, null).content);
    const want = ['1:T', '2:Opening', '3:The turn', '4:Deeper', '2:Named but empty', '2:Close'];
    const wantNo = ['1:Opening', '2:The turn', '3:Deeper', '1:Named but empty', '1:Close'];
    const sub = H('T', ['g', 'a']);
    const iA = sub.content.indexOf('Opening'), iG = sub.content.indexOf('Close');
    const subOk = sub.count === 2 && iA >= 0 && iA < iG && !sub.content.includes('The turn') && !sub.content.includes('Down here');
    // every chosen Part's own web words, once, in order; an unnamed Part has no heading of its own words
    const order = ['a', 'b', 'c', 'd', 'g'].map((id) => PARTS.find((p) => p.id === id).html).map((h) => all.content.indexOf(h));
    const ordered = order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1]));
    const ESC = [P('x', 'A <b> & "q"', 0, 'one')];
    const esc = X.publicationText('T <i>', ESC, 'html', null).content;
    const escOk = esc.includes('<h1>T &lt;i&gt;</h1>') && esc.includes('<h2>A &lt;b&gt; &amp; "q"</h2>') && !esc.includes('<b>') && !esc.includes('<i>');
    const none = H('T', []);
    const w = (X.wrapHtml || (() => ''))('T <i>', '<p>x</p>');
    const wrapOk = w.startsWith('<!doctype html>') && w.includes('<meta charset="utf-8">') && w.includes('<title>T &lt;i&gt;</title>') && w.includes('<p>x</p>') && w.endsWith('</html>\n') && !w.includes('<title>T <i>');
    R.HTML = { pass: JSON.stringify(heads) === JSON.stringify(want) && JSON.stringify(noTitle) === JSON.stringify(wantNo) && subOk && ordered && escOk && none.count === 0 && none.content === '' && wrapOk, detail: JSON.stringify({ heads, noTitle, subOk, order, escOk, wrapOk }) };
  }
  void idsOf;
  return R;
}

// ---- baseline ---------------------------------------------------------------------------------------------------------------------------------------
ok('the real publishingText.ts exists', exists, 'src/reorg/publishingText.ts is missing');
const base = exists ? suite(srcText) : {};
const KEYS = ['ORD', 'ALL', 'SUB', 'WORDS-md', 'WORDS-txt', 'HEAD', 'TITLE', 'EMPTY', 'LVL', 'HTML'];
for (const k of KEYS) ok(`${k} on the real publishingText.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

// ---- mutants ----------------------------------------------------------------------------------------------------------------------------------------
const MUT = [
  ['the file follows the order the Parts were ticked in', 'ORD', (t) => t.replace('return parts.filter((p) => want.has(p.id));', () => 'return ids.map((i) => parts.find((p) => p.id === i)).filter((p) => !!p) as PubPart[];')],
  ['no choice (null) goes out as nothing', 'ALL', (t) => t.replace('if (!ids) return parts.slice();', () => 'if (!ids) return [];')],
  ['an empty choice goes out as every Part', 'ALL', (t) => t.replace('if (chosen.length === 0) return { content: \'\', count: 0 };', () => '')],
  ['an unchosen Part still goes out', 'SUB', (t) => t.replace('return parts.filter((p) => want.has(p.id));', () => 'return parts.slice();')],
  // ORIGINAL, SUPERSEDED Nov 20 (publishingText.ts now has a third format, so the body line names html too; the mutant stands on the new line):
  // ['the file trims a Part\'s words from the front', 'WORDS-md', (t) => t.replace("const body = (format === 'md' ? p.md : p.txt).replace(/\\s+$/, '');", () => "const body = (format === 'md' ? p.md : p.txt).trim().replace(/^\\S+\\s*/, '');")],
  ['the file trims a Part\'s words from the front', 'WORDS-md', (t) => t.replace("const body = (format === 'md' ? p.md : format === 'html' ? p.html : p.txt).replace(/\\s+$/, '');", () => "const body = (format === 'md' ? p.md : p.txt).trim().replace(/^\\S+\\s*/, '');")],
  // ORIGINAL, SUPERSEDED Nov 20 (publishingText.ts now has a third format, so the body line names html too; the mutant stands on the new line):
  // ['the .txt carries the .md conventions', 'WORDS-txt', (t) => t.replace("const body = (format === 'md' ? p.md : p.txt)", () => 'const body = (p.md)')],
  ['the .txt carries the .md conventions', 'WORDS-txt', (t) => t.replace("const body = (format === 'md' ? p.md : format === 'html' ? p.html : p.txt)", () => 'const body = (p.md)')],
  ['an unnamed Part gets a heading of its own words', 'HEAD', (t) => t.replace('const name = p.name.trim();', () => "const name = p.name.trim() || body.split('\\n')[0];")],
  ['the headings ignore the level', 'HEAD', (t) => t.replace("Math.max(0, Math.min(2, p.level))", () => '0')],
  ['a titleless Doc keeps the deeper base', 'HEAD', (t) => t.replace('const base = title === null ? 1 : 2;', () => 'const base = 2;')],
  ['a loose page gets a title anyway', 'TITLE', (t) => t.replace('if (title !== null) blocks.push', () => "if (true) blocks.push").replace('head(title, 1)', () => "head(String(title ?? ''), 1)")],
  ['an empty unnamed Part leaves a blank block', 'EMPTY', (t) => t.replace('if (!body && !name) continue;', () => 'if (!body && !name) blocks.push(\'\');')],
  ['a named empty Part loses its heading', 'EMPTY', (t) => t.replace('if (!body && !name) continue;', () => 'if (!body) continue;')],
  ['a level above the range is not held', 'LVL', (t) => t.replace('Math.max(0, Math.min(2, p.level))', () => 'Math.max(0, p.level)')],
  ['the web page\'s headings ignore the level', 'HTML', (t) => t.replace('base + Math.max(0, Math.min(2, p.level))', () => 'base')],
  ['a Part\'s name goes into the web page unescaped', 'HTML', (t) => t.replace('`<h${level}>${esc(name)}</h${level}>`', () => '`<h${level}>${name}</h${level}>`')],
  ['the web page\'s title goes into its head unescaped', 'HTML', (t) => t.replace('<title>${esc(title)}</title>', () => '<title>${title}</title>')],
  ['the web page carries the plain words instead of the Part\'s own markup', 'HTML', (t) => t.replace("format === 'html' ? p.html : p.txt", () => 'p.txt')],
  ['the web page leaves out its charset', 'HTML', (t) => t.replace('<meta charset="utf-8">\\n', () => '')],
];
for (const [name, key, fn] of MUT) {
  const after = exists ? fn(srcText) : srcText;
  const landed = exists && after !== srcText;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, JSON.stringify({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

// ---- THE PAGE'S WORDS AS WEB MARKUP (publishingHtml.ts): the same readers the page paints from, semantic tags out, no marker left behind ------------------------------------------
const HSRC = new URL('../../src/reorg/publishingHtml.ts', import.meta.url);
const hExists = fs.existsSync(HSRC);
const hText = hExists ? lf(fs.readFileSync(HSRC, 'utf8')) : '';
const MARKRUNS = (() => { const o = ts.transpileModule(lf(fs.readFileSync(new URL('../../src/store/markRuns.ts', import.meta.url), 'utf8')), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText; const m = { exports: {} }; new Function('module', 'exports', o)(m, m.exports); return m.exports; })();
function loadHtml(src) {
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { if (p === '../store/markRuns') return MARKRUNS; throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const HCASES = [
  ['**b** and *i* and __u__ and ~~s~~', '<p><strong>b</strong> and <em>i</em> and <u>u</u> and <s>s</s></p>'],
  ['***x*** y', '<p><strong><em>x</em></strong> y</p>'],
  ['**outer *inner* more**', '<p><strong>outer <em>inner</em> more</strong></p>'],
  ['# Head\nbody', '<h1>Head</h1>\n<p>body</p>'],
  ['## Sub\n\nline one\nline two\n\nnext', '<h2>Sub</h2>\n<p>line one<br>\nline two</p>\n<p>next</p>'],
  ['a < b & c > d', '<p>a &lt; b &amp; c &gt; d</p>'],
  ['2 * 3 * 4', '<p>2 * 3 * 4</p>'],
  ['typed \\*not italic\\* here', '<p>typed *not italic* here</p>'],
  ['> a quote', '<blockquote><p>a quote</p></blockquote>'],
  ['- one\n- two\n\nafter', '<ul><li>one</li><li>two</li></ul>\n<p>after</p>'],
  ['>< centred', '<p style="text-align:center">centred</p>'],
  ['>> right', '<p style="text-align:right">right</p>'],
  ['>| indented', '<p style="margin-left:2em">indented</p>'],
  ['\tfirst line', '<p style="text-indent:2em">first line</p>'],
  ['[sized]{.size-14} plain', '<p><span style="font-size:14pt">sized</span> plain</p>'],
  ['', ''],
];
function suiteHtml(src) {
  const R = {};
  if (!src) return R;
  const X = loadHtml(src);
  const bad = HCASES.map(([i, want]) => [i, want, X.markdownToHtml(i)]).filter(([, want, got]) => want !== got);
  const all = HCASES.map(([i]) => X.markdownToHtml(i)).join('\n');
  const residue = /\*\*|~~|__|md-mark|md-h|class=/.test(all.replace('2 * 3 * 4', ''));
  const plain = X.plainToHtml('a<b\nc\n\n') === '<p>a&lt;b<br>\nc</p>' && X.plainToHtml('   ') === '';
  R.HTMLMD = { pass: bad.length === 0 && !residue && plain, detail: JSON.stringify({ bad: bad.slice(0, 3), residue, plain }) };
  return R;
}
ok('the real publishingHtml.ts exists', hExists, 'src/reorg/publishingHtml.ts is missing');
const hBase = suiteHtml(hText);
ok('HTMLMD on the real publishingHtml.ts: the page\'s conventions become strong, em, u, s, h1-h6, blockquote, ul, aligned and indented paragraphs; typed escapes are the character; no marker or app class is left in the text', hBase.HTMLMD && hBase.HTMLMD.pass, hBase.HTMLMD ? hBase.HTMLMD.detail : 'missing');
const HMUT = [
  ['an escape\'s backslash is left in the text', (t) => t.replace('if (!escapes.has(i)) out += escH(rest[i]);', () => 'out += escH(rest[i]);')],
  ['bold is not marked up', (t) => t.replace("bold: '<strong>'", () => "bold: ''").replace("bold: '</strong>'", () => "bold: ''")],
  ['the words are not escaped', (t) => t.replace('out += escH(rest[i]);', () => 'out += rest[i];')],
  ['the lines of a paragraph are run together', (t) => t.replace('prev.html += `<br>\\n${html}`', () => 'prev.html += html')],
  ['a heading is read as a paragraph', (t) => t.replace("kind = 'h';", () => "kind = 'p';")],
  ['a block indent is dropped', (t) => t.replace("block ? `margin-left:${block * 2}em` : ''", () => "''")],
];
for (const [name, fn] of HMUT) {
  const after = hExists ? fn(hText) : hText;
  const landed = hExists && after !== hText;
  let res = null, err = null;
  try { res = landed ? suiteHtml(after) : null; } catch (e) { err = e; }
  ok(`MUT ${name}: it LANDED and HTMLMD goes RED`, landed && !err && !!res && res.HTMLMD && res.HTMLMD.pass === false, JSON.stringify({ landed, err: err && String(err.message).slice(0, 120) }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-PUBLISH-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PUBLISH-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
