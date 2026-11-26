// VISUAL - WHAT LOADS, BROWSERLESS. The ruling (Fable, Nov 25): the painter (InkStratum) loads where a page has saved ink; the drawing tools (the INK tab with its Studio, and the input that makes
// strokes) load on the first INK open; a page with no ink and no open INK loads neither. So none of the three may be reachable from the app's entry by STATIC imports (a static import puts it in the
// first download), and each must still be reachable by a dynamic import(). Walked with the TypeScript parser, so `import type` and type-only names do not count. A mutant (a static import added back)
// must land and turn the check red. The browser files (visual-1a1.mjs, L1-L4) count the requests themselves.
// Run: node scripts/harness/visual-ink-loads-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');
const ENTRY = path.join(SRC, 'main.tsx');
const INK = { painter: 'components/InkStratum.tsx', tab: 'components/ink/InkTab.tsx', capture: 'components/ink/inkCapture.ts' };

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const rel = (f) => path.relative(SRC, f).split(path.sep).join('/');

function resolve(from, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (/\.tsx?$/.test(c) && fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** The static (value) imports and the dynamic import()s of one file. */
function imports(file, source) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.ES2020, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const stat = [], dyn = [];
  const typeOnly = (node) => {
    if (ts.isImportDeclaration(node)) {
      const c = node.importClause;
      if (!c) return false;
      if (c.isTypeOnly) return true;
      return !c.name && !!c.namedBindings && ts.isNamedImports(c.namedBindings) && c.namedBindings.elements.length > 0 && c.namedBindings.elements.every((e) => e.isTypeOnly);
    }
    return !!node.isTypeOnly;
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && !typeOnly(node)) stat.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) dyn.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { stat, dyn };
}

/** Everything the entry reaches statically, and every file anything in src reaches dynamically. */
function walk(read) {
  const seen = new Set(), dyn = new Set(), queue = [ENTRY], staticFrom = {};
  const every = new Set([ENTRY]);
  const frontier = [ENTRY];
  while (queue.length) {
    const f = queue.shift();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const s of imports(f, read(f)).stat) {
      const t = resolve(f, s);
      if (!t) continue;
      if (!staticFrom[rel(t)]) staticFrom[rel(t)] = rel(f);
      queue.push(t);
    }
  }
  // dynamic edges, followed from every module reachable by any edge
  while (frontier.length) {
    const f = frontier.shift();
    const { stat, dyn: d } = imports(f, read(f));
    for (const s of [...stat, ...d]) {
      const t = resolve(f, s);
      if (!t) continue;
      if (d.includes(s)) dyn.add(rel(t));
      if (!every.has(t)) { every.add(t); frontier.push(t); }
    }
  }
  return { statics: new Set([...seen].map(rel)), dyn, staticFrom };
}

const read = (f) => fs.readFileSync(f, 'utf8');
const real = walk(read);
for (const [name, file] of Object.entries(INK)) {
  const exists = fs.existsSync(path.join(SRC, file));
  ok(`LD ${name}: ${file} is NOT in the first download (no static import reaches it from main.tsx)`, exists && !real.statics.has(file), exists ? `statically imported by ${real.staticFrom[file] || 'nothing'}` : 'the file does not exist');
  ok(`LD ${name}: and it is still loaded on demand (a dynamic import() reaches it)`, real.dyn.has(file), [...real.dyn].filter((d) => /ink/i.test(d)).join(', '));
}

// the mutant: a static import of the painter put back in PageEditor must be seen
{
  const host = path.join(SRC, 'pages', 'PageEditor.tsx');
  const mutated = "import { InkStratum as __mutant } from '../components/InkStratum';\nvoid __mutant;\n" + read(host);
  const m = walk((f) => (f === host ? mutated : read(f)));
  ok('LD mutant: a static import of the painter added to PageEditor is caught', m.statics.has(INK.painter), String(m.statics.has(INK.painter)));
}

const pass = checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  (' + c.detail + ')'}`);
console.log(pass ? `\nVISUAL INK LOADS UNIT: PASS (${checks.length})` : `\nVISUAL INK LOADS UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
