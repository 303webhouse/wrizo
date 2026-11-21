// REORG INCLUDE THE PLAN IN WHAT GOES OUT, THE TEXT'S HALF, BROWSERLESS (reorg-plan-v2, INK queue item 5a; the stage menus, L4: "[ ] Include the Plan in what goes out, only if she ticks it"). No browser, no box: the real
// publishingText.ts is transpiled and run; each law is given a mutant (a text rewrite of the source) that must LAND and turn its own check red.
// publicationText(title, parts, format, ids, plan) takes an optional fifth argument, { label, rows: [{ number, depth, title }] }: the Plan as an outline, her own rows in her own order.
//   OFF     no plan, a null plan, or a plan with no rows: the file is byte-identical to today's (nothing is added, no empty "Plan" heading)
//   ON      the Plan goes after the Doc's title and before the first Part, under a heading of the Parts' own level, as an outline: Markdown a nested list, Plain Text indented lines, Web a list indented by depth; every row
//           is its number and its title; and the Parts' words are unchanged
//   LOOSE   a loose page (no title) with the Plan ticked leads with the Plan
//   NONE    with no Part chosen nothing goes out, the Plan included (the Plan never goes out alone); the count stays the number of Parts
//   ESC     a title with markup is escaped in the web file and left as typed in the other two
// Run: node scripts/harness/reorg-plan-export-unit.mjs   (from apps/desktop; browserless: needs no box turn)
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
const part = (id, name, level, w) => ({ id, name, level, md: w, txt: w, html: '<p>' + w + '</p>' });
const PARTS = [part('a', 'Opening', 0, 'Open words.'), part('b', '', 1, 'Middle words.'), part('c', 'Close', 0, 'Close words.')];
const PLAN = { label: 'Plan', rows: [{ number: '1', depth: 0, title: 'Alpha' }, { number: '1.1', depth: 1, title: 'Sub' }, { number: '2', depth: 0, title: 'Beta' }] };

function suite(src) {
  const R = {};
  const PT = load(src);
  const go = (title, parts, fmt, ids, plan) => { try { return PT.publicationText(title, parts, fmt, ids, plan); } catch (e) { return { content: 'THREW ' + e.message, count: -1 }; } };
  // OFF
  {
    const was = ['md', 'txt', 'html'].map((f) => go('Budget', PARTS, f, null).content);
    const cases = [undefined, null, { label: 'Plan', rows: [] }];
    const same = cases.every((pl) => ['md', 'txt', 'html'].every((f, i) => go('Budget', PARTS, f, null, pl).content === was[i]));
    R.OFF = { pass: same && !/Plan/.test(was.join('')), detail: J({ was }) };
  }
  // ON
  {
    const md = go('Budget', PARTS, 'md', null, PLAN), txt = go('Budget', PARTS, 'txt', null, PLAN), html = go('Budget', PARTS, 'html', null, PLAN);
    const wantMd ='# Budget\n\n## Plan\n\n- 1 Alpha\n  - 1.1 Sub\n- 2 Beta\n\n## Opening\n\nOpen words.\n\nMiddle words.\n\n## Close\n\nClose words.\n';
    const wantTxt = 'Budget\n\nPlan\n\n1 Alpha\n  1.1 Sub\n2 Beta\n\nOpening\n\nOpen words.\n\nMiddle words.\n\nClose\n\nClose words.\n';
    const wantHtml = '<h1>Budget</h1>\n<h2>Plan</h2>\n<ul>\n<li style="margin-left:0em">1 Alpha</li>\n<li style="margin-left:1.5em">1.1 Sub</li>\n<li style="margin-left:0em">2 Beta</li>\n</ul>\n<h2>Opening</h2>\n<p>Open words.</p>\n<p>Middle words.</p>\n<h2>Close</h2>\n<p>Close words.</p>\n';
    R.ON = { pass: md.content === wantMd && txt.content === wantTxt && html.content === wantHtml && md.count === 3 && txt.count === 3 && html.count === 3, detail: J({ md, txt, html }) };
  }
  // LOOSE
  {
    const md = go(null, [PARTS[0]], 'md', null, PLAN);
    // a loose Part's own name is still its heading (publicationText's rule: a name she gave); the Plan leads, at the top level
    R.LOOSE = { pass: md.content === '# Plan\n\n- 1 Alpha\n  - 1.1 Sub\n- 2 Beta\n\n## Opening\n\nOpen words.\n', detail: J({ md }) };
  }
  // NONE
  {
    const none = ['md', 'txt', 'html'].map((f) => go('Budget', PARTS, f, [], PLAN));
    R.NONE = { pass: none.every((n) => n.content === '' && n.count === 0), detail: J({ none }) };
  }
  // ESC
  {
    const plan = { label: 'Plan', rows: [{ number: '1', depth: 0, title: 'A <b> & C' }] };
    const html = go('Budget', PARTS, 'html', null, plan), md = go('Budget', PARTS, 'md', null, plan), txt = go('Budget', PARTS, 'txt', null, plan);
    R.ESC = { pass: /<li style="margin-left:0em">1 A &lt;b&gt; &amp; C<\/li>/.test(html.content) && !/<b>/.test(html.content) && /- 1 A <b> & C/.test(md.content) && /\n1 A <b> & C\n/.test(txt.content), detail: J({ html, md, txt }) };
  }
  return R;
}

const base = suite(SRC);
const LAWS = ['OFF', 'ON', 'LOOSE', 'NONE', 'ESC'];
for (const k of LAWS) ok(`${k} on the real publishingText.ts`, base[k] && base[k].pass, base[k] ? base[k].detail : 'missing');

// the mutants: [name, the check it must turn red, the rewrite]
const MUT = [
  ['an empty plan still writes its heading', 'OFF', (t) => t.replace('if (plan && plan.rows.length > 0) blocks.push', () => 'if (plan) blocks.push')],
  ['the plan goes out with no Part chosen', 'NONE', (t) => t.replace("if (chosen.length === 0) return { content: '', count: 0 };", () => "if (chosen.length === 0 && !plan) return { content: '', count: 0 };")],
  ['a row loses its indent', 'ON', (t) => t.replace("'  '.repeat(r.depth)", () => "''")],
  ['a row loses its number', 'ON', (t) => t.replace('- ${r.number} ${r.title}', () => '- ${r.title}')],
  ['the plan comes after the Parts', 'ON', (t) => { const line = PLANLINE; return t.includes(line) ? t.replace(line + '\n', () => '').replace('  return { content: blocks.join', () => line + '\n  return { content: blocks.join') : t; }],
  ['the web file leaves a title unescaped', 'ESC', (t) => t.replace('${esc(`${r.number} ${r.title}`)}', () => '${`${r.number} ${r.title}`}')],
  ['the plan heading ignores a loose page', 'LOOSE', (t) => t.replace('head(plan.label, base)', () => 'head(plan.label, 2)')],
];
const PLANLINE = '  if (plan && plan.rows.length > 0) blocks.push(head(plan.label, base), planBlock(plan, format));';
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
console.log(bad ? `\nREORG-PLAN-EXPORT-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-PLAN-EXPORT-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
