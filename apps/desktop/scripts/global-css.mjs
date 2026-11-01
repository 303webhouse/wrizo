// The global CSS as ONE text (#13 step 6). index.css is an ordered list of `@import './styles/<x>.css';` lines, and the build
// inlines them in that order. globalCss() does the same on the source: each import line, with its line ending, is replaced by
// that file's text. So a script that read index.css before the split reads byte-for-byte the same text now
// (c13-6-css-split.mjs check proves it against the commit before the split).
//
//   globalCss(srcDir)                  the joined text (srcDir = apps/desktop/src)
//   srcText(srcDir, rel)               fs.readFileSync(path.join(srcDir, rel), 'utf8'), except that 'index.css' reads the joined text:
//                                      the drop-in for a script's own read helper, so the helper's other handling is unchanged
//   globalCssFileHolding(srcDir, s)    the path of the ONE file under src/styles/ whose text contains s (throws on none or several):
//                                      for a mutant that edits a rule in place and restores it after
import fs from 'node:fs';
import path from 'node:path';

export function srcText(srcDir, rel) {
  return path.normalize(rel) === 'index.css' ? globalCss(srcDir) : fs.readFileSync(path.join(srcDir, rel), 'utf8');
}

export const IMPORT_LINE = /^@import '\.\/styles\/([a-z0-9-]+\.css)';(\r?\n|$)/gm;

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
