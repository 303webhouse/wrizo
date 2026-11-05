// The global CSS as ONE text (#13 step 6). index.css is an ordered list of `@import './styles/<x>.css';` lines, and the build
// inlines them in that order. globalCss() does the same on the source: each import line, with its line ending, is replaced by
// that file's text. So a script that read index.css before the split reads byte-for-byte the same text now
// (c13-6-css-split.mjs check proves it against the commit before the split).
//
//   globalCss(srcDir)                  the joined text (srcDir = apps/desktop/src)
//   srcText(srcDir, ...rel)            fs.readFileSync(path.join(srcDir, ...rel), 'utf8'), except that 'index.css' reads the joined text:
//                                      the drop-in for a script's own read helper, so the helper's other handling is unchanged
//                                      (several parts, as join takes them: a read of join(SRC, 'store', f) keeps its folder)
//   globalCssFileHolding(srcDir, s)    the path of the ONE file under src/styles/ whose text contains s (throws on none or several):
//                                      for a mutant that edits a rule in place and restores it after
//
// The TypeScript barrels (#13 step 10): a module split into parts keeps its path as a barrel of `export * from './<x>';` lines.
// srcText reads a barrel named in BARRELS as its parts joined in that order, so a reader of the old module still reads every
// line it read before (the same lines, grouped by part: c13-10-split-check.mjs proves none was added, dropped or edited).
// Only the barrels named here: a file is never read as a barrel because of its shape.
import fs from 'node:fs';
import path from 'node:path';

export const BARRELS = ['types/index.ts'];
export const REEXPORT_LINE = /^export \* from '\.\/([A-Za-z0-9-]+)';(\r?\n|$)/gm;

export function barrelText(srcDir, rel) {
  const text = fs.readFileSync(path.join(srcDir, rel), 'utf8');
  const parts = [];
  let at = 0;
  for (const m of text.matchAll(REEXPORT_LINE)) {
    if (m.index !== at) throw new Error(`${rel}: text other than an export * line at offset ${at}`);
    parts.push(path.join(srcDir, path.dirname(rel), `${m[1]}.ts`));
    at = m.index + m[0].length;
  }
  if (at !== text.length || parts.length === 0) throw new Error(`${rel}: text other than an export * line at offset ${at}`);
  return parts.map((p) => fs.readFileSync(p, 'utf8')).join('');
}

export function srcText(srcDir, ...rel) {
  const r = path.join(...rel).split(path.sep).join('/');
  if (r === 'index.css') return globalCss(srcDir);
  if (BARRELS.includes(r)) return barrelText(srcDir, r);
  return fs.readFileSync(path.join(srcDir, ...rel), 'utf8');
}

// a file under src/styles/, or one folder down (src/styles/themes/, #13 step 8)
export const IMPORT_LINE = /^@import '\.\/styles\/((?:[a-z0-9-]+\/)?[a-z0-9-]+\.css)';(\r?\n|$)/gm;

export function globalCssParts(srcDir) {
  const index = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf8');
  const parts = [];
  let at = 0;
  for (const m of index.matchAll(IMPORT_LINE)) {
    if (m.index !== at) throw new Error(`index.css: text other than an import line at offset ${at}`);
    parts.push({ file: path.join(srcDir, 'styles', m[1]), name: m[1] });
    at = m.index + m[0].length;
  }
  if (at !== index.length) throw new Error(`index.css: text other than an import line at offset ${at}`);
  return parts;
}

export function globalCss(srcDir) {
  return globalCssParts(srcDir).map((p) => fs.readFileSync(p.file, 'utf8')).join('');
}

export function globalCssFileHolding(srcDir, needle) {
  const hits = globalCssParts(srcDir).filter((p) => fs.readFileSync(p.file, 'utf8').includes(needle));
  if (hits.length !== 1) throw new Error(`globalCssFileHolding: ${hits.length} files hold ${JSON.stringify(needle.slice(0, 80))}`);
  return hits[0].file;
}
