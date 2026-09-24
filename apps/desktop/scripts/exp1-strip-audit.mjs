// EXPERIMENT 1 §4 — THE STRIP AUDIT NICK'S LAW DEMANDS.
//
// His law, verbatim: "every clickable tool in it (other than INK or settings) is
// something that happens to a portion of the page that is SELECTED (or in the
// case of an indent or bullet, something that happens where the CURSOR is
// currently positioned)."
//
// The brief SEEDED this table and left S0 to complete it. A seeded table is
// research: it names seven rows, and the strip has more clickables than that. So
// this enumerates the population from SOURCE, parsed, and prints every clickable
// with the section it sits in — a hand-read list of a 1,175-line component is
// exactly the kind of count that looks measured and is not.
//
// It CLASSIFIES nothing by itself. A verdict against his law is a reading, and a
// script cannot make one; what it can do is guarantee the reading covers every
// clickable rather than the ones someone happened to notice. The verdicts live in
// the offer beside this output.
//
// Browserless. Run: node scripts/exp1-strip-audit.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const require = createRequire(join(repo, 'apps/server/package.json'));
const ts = require('typescript');

const REL = 'apps/desktop/src/components/Sliver.tsx';
const src = readFileSync(join(repo, REL), 'utf8').replace(/\r\n/g, '\n');
const sf = ts.createSourceFile(REL, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;

// --- the section headings, in line order --------------------------------
// A tool's section is the nearest heading ABOVE it. Read from the markup rather
// than assumed, so a section added later lands in the audit automatically.
const sections = [];
(function findHeadings(node) {
  if (ts.isJsxElement(node)) {
    const open = node.openingElement;
    const cls = open.attributes.properties.find(
      (p) => ts.isJsxAttribute(p) && p.name.getText(sf) === 'className');
    const clsText = cls && cls.initializer && ts.isStringLiteral(cls.initializer) ? cls.initializer.text : '';
    if (/\bwz-sliver-h\b/.test(clsText)) {
      // Which function renders the headings is DERIVED, not assumed. The first
      // version hardcoded `Sliver` and every attribution came back "(not a strip
      // section)" — the sections are rendered by `SliverToolsBody`. A gate built
      // on a guessed name fails silently by blanking its own output.
      let owner = '(top level)';
      for (let p = node.parent; p; p = p.parent) {
        if (ts.isFunctionDeclaration(p) && p.name) { owner = p.name.text; break; }
        if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && p.parent
            && ts.isVariableDeclaration(p.parent) && p.parent.name) { owner = p.parent.name.getText(sf); break; }
      }
      sections.push({ line: lineOf(node.getStart(sf)), label: node.getChildAt(1)?.getText(sf).trim() || '(unnamed)', owner });
    }
  }
  ts.forEachChild(node, findHeadings);
})(sf);
sections.sort((a, b) => a.line - b.line);
const sectionAt = (line) => {
  let cur = '(before the first section)';
  for (const s of sections) { if (s.line <= line) cur = s.label; else break; }
  return cur;
};

// --- every clickable ----------------------------------------------------
const clickables = [];
(function findClickables(node) {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName.getText(sf);
    const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
    const names = attrs.map((a) => a.name.getText(sf));
    const isButton = tag === 'button';
    const hasClick = names.includes('onClick');
    const role = attrs.find((a) => a.name.getText(sf) === 'role');
    const roleText = role && role.initializer && ts.isStringLiteral(role.initializer) ? role.initializer.text : '';
    const clickableRole = /^(button|menuitem|tab|switch|checkbox)$/.test(roleText);
    if (isButton || hasClick || clickableRole) {
      const cls = attrs.find((a) => a.name.getText(sf) === 'className');
      let clsText = '';
      if (cls && cls.initializer) {
        clsText = ts.isStringLiteral(cls.initializer) ? cls.initializer.text
          : cls.initializer.getText(sf).replace(/\s+/g, ' ').slice(0, 44);
      }
      const line = lineOf(node.getStart(sf));
      // ⚠ THE ENCLOSING FUNCTION MATTERS, and the first run of this script got it
      // wrong: Sliver.tsx holds SEVERAL components, so attributing a clickable to
      // "the nearest heading above it" put seven controls that live in helper
      // components (the toggle, the goal editor, the instruments row) inside the
      // `railBoard` section, which does not contain them. A section is only
      // meaningful WITHIN the component that renders the sections.
      let fn = '(top level)';
      for (let p = node.parent; p; p = p.parent) {
        if (ts.isFunctionDeclaration(p) && p.name) { fn = p.name.text; break; }
        if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && p.parent
            && ts.isVariableDeclaration(p.parent) && p.parent.name) { fn = p.parent.name.getText(sf); break; }
      }
      const owners = new Set(sections.map((x) => x.owner));
      clickables.push({ line, tag, role: roleText, cls: clsText, fn, section: owners.has(fn) ? sectionAt(line) : '(not in a sectioned component)' });
    }
  }
  ts.forEachChild(node, findClickables);
})(sf);
clickables.sort((a, b) => a.line - b.line);

console.log(`${REL}\nsections: ${sections.length} | clickables: ${clickables.length}\n`);
console.log('SECTIONS (in order):');
for (const s of sections) console.log(`  line ${String(s.line).padStart(4)}  ${s.label}`);

console.log('\nCLICKABLES, by section:');
let last = null;
for (const c of clickables) {
  if (c.section !== last) { console.log(`\n  [${c.section}]`); last = c.section; }
  console.log(`    ${String(c.line).padStart(4)}  <${c.tag}${c.role ? ` role=${c.role}` : ''}> ${c.cls}   [fn=${c.fn}]`);
}

// --- the TOOLS as the writer meets them ---------------------------------
// ⚠ A SECTION CAN HOLD A TOOL WITHOUT HOLDING A <button>. `railControls` came
// back with ZERO clickables, which is false as a statement about the strip: its
// tools are rendered through `<SliverToggle>`, so the button lives in the helper
// while the TOOL lives in the section. Counting only buttons audits the markup;
// Nick's law is about tools. So component usages inside a sectioned component
// count as tool slots too.
const toolSlots = [];
(function findSlots(node) {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName.getText(sf);
    if (/^[A-Z]/.test(tag)) {
      let fn = '(top level)';
      for (let p = node.parent; p; p = p.parent) {
        if (ts.isFunctionDeclaration(p) && p.name) { fn = p.name.text; break; }
        if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && p.parent
            && ts.isVariableDeclaration(p.parent) && p.parent.name) { fn = p.parent.name.getText(sf); break; }
      }
      const owners = new Set(sections.map((x) => x.owner));
      if (owners.has(fn)) {
        const line = lineOf(node.getStart(sf));
        const label = node.attributes.properties
          .filter(ts.isJsxAttribute)
          .find((a) => /^(label|title|aria-label)$/.test(a.name.getText(sf)));
        toolSlots.push({
          line, tag, fn, section: sectionAt(line),
          label: label && label.initializer ? label.initializer.getText(sf).replace(/\s+/g, ' ').slice(0, 40) : '',
        });
      }
    }
  }
  ts.forEachChild(node, findSlots);
})(sf);
toolSlots.sort((a, b) => a.line - b.line);

console.log('\nCOMPONENT TOOL SLOTS inside sections (a tool need not be a <button> here):');
{
  let lastS = null;
  for (const s of toolSlots) {
    if (s.section !== lastS) { console.log(`\n  [${s.section}]`); lastS = s.section; }
    console.log(`    ${String(s.line).padStart(4)}  <${s.tag}> ${s.label}`);
  }
}

const bySection = new Map();
for (const c of clickables) bySection.set(c.section, (bySection.get(c.section) ?? 0) + 1);
console.log('\nCOUNT BY SECTION:');
for (const [s, n] of [...bySection].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${s}`);

// The brief's seeded table named SEVEN rows. If the real population is larger,
// the seeded table was candidates — which is the thing this script exists to say
// out loud rather than leave for a reader to notice.
console.log(`\nThe brief's seeded table named 7 rows; the parsed population is ${clickables.length} clickables`
  + ` across ${sections.length} sections.`);
console.log('Verdicts against his law are a READING and live in the offer, not here.');
