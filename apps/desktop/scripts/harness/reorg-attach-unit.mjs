// REORG ATTACH ASSETS TO WHAT GOES OUT, THE TEXT'S HALF, BROWSERLESS (reorg-plan-v2, INK queue item 5b; the stage menus, A4: "Assets can be attached to the exported Doc, but only if she chooses, never by default", Nick, in the
// Back menu). No browser, no box turn. publishingText.ts is transpiled and run; each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
// publicationText(title, parts, format, ids, plan, attach) takes an optional sixth argument, { label, items: [{ title, md, txt, html }] }: the assets she ticked, already read and written for the three formats.
//   OFF     no attach, a null attach, or one with no items: the file is byte-identical to today's (nothing is added, no empty "Assets" heading)
//   ON      the assets go AFTER everything else the Doc carries (after the last Part, and after the endnotes), under one heading of the Parts' own level, each asset under its own title one level down, its words after it
//   ORDER   the assets go in the order given (the order they joined the Doc); the caller's order is kept, never sorted
//   ENDS    with an endnote in a Part, the endnotes stand BEFORE the assets (the endnotes are the Doc's own, the assets are attached to it)
//   NONE    with no Part chosen nothing goes out, the assets included (assets never go out alone); the count stays the number of Parts
//   BARE    an asset with no words goes out as its title alone (no blank block, no dropped heading)
//   ESC     a title with markup is escaped in the web file and left as typed in the other two
// Run: node scripts/harness/reorg-attach-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
const SRC = lf(fs.readFileSync(new URL('../../src/reorg/publishingText.ts', import.meta.url), 'utf8'));

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const part = (id, name, level, w, extra = {}) => ({ id, name, level, md: w, txt: w, html: '<p>' + w + '</p>', ...extra });
const PARTS = [part('a', 'Opening', 0, 'Open words.'), part('b', 'Close', 0, 'Close words.')];
const item = (title, w) => ({ title, md: w, txt: w, html: w ? '<p>' + w + '</p>' : '' });
const ATT = { label: 'Assets', items: [item('Chart', 'Chart words.'), item('Notes', 'Note words.')] };

function suite(src) {
  const R = {};
  const PT = load(src);
  const go = (title, parts, fmt, ids, plan, attach) => { try { return PT.publicationText(title, parts, fmt, ids, plan, attach); } catch (e) { return { content: 'THREW ' + e.message, count: -1 }; } };
  // OFF
  {
    const was = ['md', 'txt', 'html'].map((f) => go('Budget', PARTS, f, null).content);
    const cases = [undefined, null, { label: 'Assets', items: [] }];
    const same = cases.every((at) => ['md', 'txt', 'html'].every((f, i) => go('Budget', PARTS, f, null, null, at).content === was[i]));
    R.OFF = { pass: same && !/Assets/.test(was.join('')), detail: J({ was }) };
  }
  // ON
  {
    const md = go('Budget', PARTS, 'md', null, null, ATT), txt = go('Budget', PARTS, 'txt', null, null, ATT), html = go('Budget', PARTS, 'html', null, null, ATT);
    const wantMd = '# Budget\n\n## Opening\n\nOpen words.\n\n## Close\n\nClose words.\n\n## Assets\n\n### Chart\n\nChart words.\n\n### Notes\n\nNote words.\n';
    const wantTxt = 'Budget\n\nOpening\n\nOpen words.\n\nClose\n\nClose words.\n\nAssets\n\nChart\n\nChart words.\n\nNotes\n\nNote words.\n';
    const wantHtml = '<h1>Budget</h1>\n<h2>Opening</h2>\n<p>Open words.</p>\n<h2>Close</h2>\n<p>Close words.</p>\n<h2>Assets</h2>\n<h3>Chart</h3>\n<p>Chart words.</p>\n<h3>Notes</h3>\n<p>Note words.</p>\n';
    R.ON = { pass: md.content === wantMd && txt.content === wantTxt && html.content === wantHtml && md.count === 2 && txt.count === 2 && html.count === 2, detail: J({ md, txt, html }) };
  }
  // ORDER
  {
    const rev = { label: 'Assets', items: [...ATT.items].reverse() };
    const md = go('Budget', PARTS, 'md', null, null, rev).content;
    R.ORDER = { pass: md.indexOf('### Notes') > 0 && md.indexOf('### Notes') < md.indexOf('### Chart'), detail: J(md) };
  }
  // ENDS
  {
    const withEnd = [part('a', 'Opening', 0, `Open${'\u0001'}z${'\u0002'}.`, { notes: [{ label: 'z', endnote: true, md: 'An endnote', txt: 'An endnote', html: 'An endnote' }] }), PARTS[1]];
    const md = go('Budget', withEnd, 'md', null, null, ATT).content;
    const i = md.indexOf('[^i]: An endnote'), j = md.indexOf('## Assets');
    R.ENDS = { pass: i > 0 && j > i && md.endsWith('Note words.\n'), detail: J(md) };
  }
  // NONE
  {
    const r = go('Budget', PARTS, 'md', [], null, ATT);
    const lone = go(null, PARTS, 'md', ['zz'], null, ATT);
    R.NONE = { pass: r.content === '' && r.count === 0 && lone.content === '', detail: J({ r, lone }) };
  }
  // BARE
  {
    const bare = { label: 'Assets', items: [item('Empty one', ''), item('Chart', 'Chart words.')] };
    const md = go('Budget', PARTS, 'md', null, null, bare).content;
    R.BARE = { pass: md.endsWith('## Assets\n\n### Empty one\n\n### Chart\n\nChart words.\n'), detail: J(md) };
  }
  // ESC
  {
    const odd = { label: 'Assets', items: [item('A <b> & C', 'Words.')] };
    const html = go('Budget', PARTS, 'html', null, null, odd).content, md = go('Budget', PARTS, 'md', null, null, odd).content;
    R.ESC = { pass: html.includes('<h3>A &lt;b&gt; &amp; C</h3>') && md.includes('### A <b> & C'), detail: J({ html, md }) };
  }
  return R;
}

let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
const KEYS = ['OFF', 'ON', 'ORDER', 'ENDS', 'NONE', 'BARE', 'ESC'];
for (const k of KEYS) ok(`${k} on the real publishingText.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'publishingText.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

// each mutant is a rewrite of the SOURCE that must LAND (the text changed) and turn its own check red
const MUT = [
  ['the assets are laid before the Parts, not after', 'ON', (t) => t.replace("  if (ends.length > 0) blocks.push(ends.join('\\n'));\n", () => "  if (ends.length > 0) blocks.push(ends.join('\\n'));\n  if (attach && attach.items.length > 0) blocks.unshift(head(attach.label, base));\n")],
  ['the assets stand before the endnotes', 'ENDS', (t) => t.replace("  if (ends.length > 0) blocks.push(ends.join('\\n'));\n", () => "  if (attach && attach.items.length > 0) blocks.push(head(attach.label, base));\n  if (ends.length > 0) blocks.push(ends.join('\\n'));\n")],
  ['the assets are sorted by title', 'ORDER', (t) => t.replace('for (const a of attach.items) {', () => 'for (const a of [...attach.items].sort((x, y) => x.title.localeCompare(y.title))) {')],
  ['an asset with no words loses its heading', 'BARE', (t) => t.replace("blocks.push(head(a.title, base + 1));", () => "if (a.md || a.txt) blocks.push(head(a.title, base + 1));")],
  ['the assets go out with no Part chosen', 'NONE', (t) => t.replace("if (chosen.length === 0) return { content: '', count: 0 };", () => "if (chosen.length === 0 && !(attach && attach.items.length > 0)) return { content: '', count: 0 };")],
  ['an asset title is not escaped in the web file', 'ESC', (t) => t.replace("head(a.title, base + 1)", () => "(format === 'html' ? `<h${base + 1}>${a.title}</h${base + 1}>` : head(a.title, base + 1))")],
];
for (const [name, key, fn] of MUT) {
  const after = fn(SRC);
  const landed = after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-ATTACH-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ATTACH-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
