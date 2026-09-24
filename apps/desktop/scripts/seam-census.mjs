// ITEM 148 — THE SEAM CENSUS: every `window.wrizo*` test seam in the app's source, and what each one DOES.
// Pure (a map of path -> source in, units out); no browser, no disk. The guard (harness/item148.mjs) feeds it the
// real tree, and feeds it MUTATED copies of the tree to prove the guard can go red.
//
// WHY THIS EXISTS. seed-guard's OBS-1 promised "the next seam cannot quietly opt out" and read ONE file
// (persistence.ts) for four VERBS (Create|Patch|Set|Pin). A verb list only sees the verbs someone thought of:
//   by verb   wrizoTouchInOrder (a 85-C seam of our own) was never in scope;
//   by file   wrizoBible (tutorBible.ts) wrote through saveProject and no scan ever opened its file;
//   by shape  wrizoPairing is a NAMESPACE - birth/pair/unpair write, and the seam's name carries no verb.
// So this reads EVERY file, follows EVERY attachment form, and judges each seam (each namespace MEMBER) by what its
// code reaches, not by what it is called.
//
// "DEBOUNCED WRITER" IS DERIVED, NEVER LISTED. It is any function whose call graph reaches `scheduleFlush` in
// persistence.ts, followed across modules through relative imports. A hand-kept list of writer names would be a
// verb list under another name. The flush machinery (`flushNow`, `durableSeam`, `durable*`) is a LEAF - a durable
// seam reaches storage by construction and would otherwise read as a storage writer.
//
// Each unit lands in exactly one class:
//   DURABLE      reaches a debounced writer AND routes through a flusher        (lawful; needs no entry)
//   UNDURABLE    reaches a debounced writer, no flusher                          (DEFECT - the footgun)
//   SYNC-WRITE   writes localStorage itself, immediately, no debounced writer   (needs a named, justified entry)
//   FLUSH        is the flush                                                    (needs an entry)
//   READ-ONLY    reaches no writer and no storage                                (needs an entry)
import ts from 'typescript';

export const FLUSHER_NAMES = (n) => n === 'flushNow' || /^durable/.test(n);
const PERSISTENCE = 'store/persistence.ts';
const SEAM_NAME = /^(?:__)?wrizo[A-Z][A-Za-z0-9]*$/;

const kindFor = (p) => (p.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

function parse(files) {
  const out = new Map();
  for (const [p, src] of files) out.set(p, ts.createSourceFile(p, src, ts.ScriptTarget.ES2022, true, kindFor(p)));
  return out;
}

const isFnLike = (n) => n && (ts.isArrowFunction(n) || ts.isFunctionExpression(n));

/** Identifier references (not property names, not declarations, not type positions) + whether a setItem/removeItem call is in there. */
function collect(node) {
  const refs = new Set();
  let storage = false;
  const visit = (n, parent) => {
    if (ts.isTypeNode(n) && !ts.isExpressionWithTypeArguments(n)) return;
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
        && (n.expression.name.text === 'setItem' || n.expression.name.text === 'removeItem')) storage = true;
    if (ts.isIdentifier(n) && parent) {
      const p = parent;
      const declName = (ts.isVariableDeclaration(p) || ts.isFunctionDeclaration(p) || ts.isParameter(p) || ts.isBindingElement(p)
        || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isFunctionExpression(p)) && p.name === n;
      const propName = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n);
      if (!declName && !propName) refs.add(n.text);
    }
    ts.forEachChild(n, (c) => visit(c, n));
  };
  visit(node, node.parent ?? null);
  return { refs, storage };
}

function indexFile(path, sf) {
  const defs = new Map();      // name -> [node]   (top-level: any initializer; nested: function-like only)
  const imports = new Map();   // local -> { spec, orig }
  const add = (name, node) => { if (!defs.has(name)) defs.set(name, []); defs.get(name).push(node); };
  const walk = (n, depth) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier) && n.importClause?.namedBindings && ts.isNamedImports(n.importClause.namedBindings)) {
      for (const el of n.importClause.namedBindings.elements) imports.set(el.name.text, { spec: n.moduleSpecifier.text, orig: (el.propertyName ?? el.name).text });
    }
    if (ts.isFunctionDeclaration(n) && n.name && n.body) add(n.name.text, n.body);
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      const top = depth <= 1;  // source file -> statement -> declaration list ... top-level statements only
      if (top || isFnLike(n.initializer)) add(n.name.text, n.initializer);
    }
    const nextDepth = ts.isSourceFile(n) ? 1 : (ts.isFunctionLike(n) || ts.isBlock(n) || ts.isModuleBlock(n) ? depth + 1 : depth);
    ts.forEachChild(n, (c) => walk(c, nextDepth));
  };
  walk(sf, 0);
  return { defs, imports };
}

function resolve(fromPath, spec, files) {
  if (!spec.startsWith('.')) return null;
  const parts = fromPath.split('/'); parts.pop();
  for (const seg of spec.split('/')) { if (seg === '.') continue; if (seg === '..') parts.pop(); else parts.push(seg); }
  const base = parts.join('/');
  for (const c of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) if (files.has(c)) return c;
  return null;
}

export function analyze(files) {
  const sfs = parse(files);
  const idx = new Map();
  for (const [p, sf] of sfs) idx.set(p, indexFile(p, sf));
  const cache = new Map();
  const infoOf = (node) => { if (!cache.has(node)) cache.set(node, collect(node)); return cache.get(node); };

  // Reach: the closure of names an expression touches. Returns { debounced, storage, reached }.
  const reach = (startFile, startRefs, startStorage) => {
    let debounced = false; let storage = startStorage;
    const seen = new Set();
    const queue = [...startRefs].map((r) => [startFile, r]);
    while (queue.length) {
      const [file, name] = queue.pop();
      const key = `${file}::${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (FLUSHER_NAMES(name)) continue;                                 // the flush machinery is a leaf
      if (file === PERSISTENCE && name === 'scheduleFlush') { debounced = true; continue; }
      const fi = idx.get(file);
      if (!fi) continue;
      if (fi.defs.has(name)) {
        for (const d of fi.defs.get(name)) { const { refs, storage: s } = infoOf(d); if (s) storage = true; for (const r of refs) queue.push([file, r]); }
      } else if (fi.imports.has(name)) {
        const { spec, orig } = fi.imports.get(name);
        const target = resolve(file, spec, files);
        if (target) queue.push([target, orig]);
      }
    }
    return { debounced, storage, reached: seen.size };
  };

  const seams = [];
  for (const [p, sf] of sfs) {
    const push = (name, rhs, node, form) => seams.push({ name, file: p, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, rhs, form });
    const visit = (n) => {
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const l = n.left;
        if (ts.isPropertyAccessExpression(l) && SEAM_NAME.test(l.name.text)) push(l.name.text, n.right, n, 'property');
        else if (ts.isElementAccessExpression(l) && ts.isStringLiteral(l.argumentExpression) && SEAM_NAME.test(l.argumentExpression.text)) push(l.argumentExpression.text, n.right, n, 'element');
      }
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'assign') {
        for (const a of n.arguments) if (ts.isObjectLiteralExpression(a)) for (const m of a.properties) {
          const nm = m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) ? m.name.text : null;
          if (nm && SEAM_NAME.test(nm)) push(nm, ts.isPropertyAssignment(m) ? m.initializer : m, m, 'assign');
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }

  const units = [];
  const unitFor = (key, file, line, node) => {
    const own = infoOf(node);
    const r = reach(file, own.refs, own.storage);
    const flush = [...own.refs].some(FLUSHER_NAMES);
    const writer = r.debounced;
    let klass;
    if (writer) klass = flush ? 'DURABLE' : 'UNDURABLE';
    else if (r.storage) klass = 'SYNC-WRITE';
    else if (flush && own.refs.has('flushNow')) klass = 'FLUSH';
    else klass = 'READ-ONLY';
    units.push({ key, file, line, klass, writer, flush, storage: r.storage });
  };
  for (const s of seams) {
    if (ts.isObjectLiteralExpression(s.rhs)) {
      for (const m of s.rhs.properties) {
        const mn = m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) ? m.name.text : null;
        if (!mn) continue;
        const val = ts.isPropertyAssignment(m) ? m.initializer : m;   // shorthand / method: the member itself
        unitFor(`${s.name}.${mn}`, s.file, s.line, val);
      }
    } else unitFor(s.name, s.file, s.line, s.rhs);
  }

  // The flushers must actually flush: a `durable*` wrapper that has been gutted turns every "DURABLE" verdict into a lie.
  const flusherDefs = [];
  const pf = idx.get(PERSISTENCE);
  const flusherProblems = [];
  if (pf) {
    const psf = sfs.get(PERSISTENCE);
    const scan = (n) => {
      const nm = (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) ? [n.name.text, n.initializer]
        : (ts.isFunctionDeclaration(n) && n.name && n.body) ? [n.name.text, n.body] : null;
      if (nm && /^durable/.test(nm[0])) { flusherDefs.push(nm[0]); if (!collect(nm[1]).refs.has('flushNow')) flusherProblems.push(nm[0]); }
      ts.forEachChild(n, scan);
    };
    scan(psf);
  }

  // Debounced writers in persistence.ts, derived: how many of its own top-level functions reach scheduleFlush.
  let debouncedWriters = 0;
  if (pf) {
    for (const [name, nodes] of pf.defs) {
      if (name === 'scheduleFlush' || FLUSHER_NAMES(name)) continue;
      const refs = new Set(); let st = false;
      for (const d of nodes) { const i = infoOf(d); i.refs.forEach((x) => refs.add(x)); if (i.storage) st = true; }
      if (reach(PERSISTENCE, refs, st).debounced) debouncedWriters += 1;
    }
  }
  return { units, seams, debouncedWriters, flusherDefs, flusherProblems, fileCount: files.size };
}

/** A textual cross-check of the attachment count: non-comment lines that assign to a wrizo* name. */
export function textualSeamCount(files) {
  let n = 0;
  for (const src of files.values()) {
    for (const line of src.split(/\r?\n/)) {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
      const re = /\b(?:__)?wrizo[A-Z][A-Za-z0-9]*['"\]]?\s*=(?!=)/g;
      let m; while ((m = re.exec(line))) { if (!/\?\s*:/.test(m[0])) n += 1; }
    }
  }
  return n;
}
