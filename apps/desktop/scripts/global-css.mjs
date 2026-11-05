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
// Only the barrels named here: a file is never read as a barrel because of its shape. A part sits beside its barrel or one folder
// down (components/cascade/, step 10d), as a .ts or .tsx file.
// A script that WALKS every file reads each by its plain path (fs.readFileSync); through srcText a barrel's lines would be read twice,
// once joined and once in the parts.
import fs from 'node:fs';
import path from 'node:path';

export const BARRELS = ['types/index.ts', 'components/CascadePanels.tsx'];
export const REEXPORT_LINE = /^export \* from '\.\/((?:[A-Za-z0-9-]+\/)?[A-Za-z0-9-]+)';(\r?\n|$)/gm;

export function barrelParts(srcDir, rel) {
  const text = fs.readFileSync(path.join(srcDir, rel), 'utf8');
  const parts = [];
  let at = 0;
  for (const m of text.matchAll(REEXPORT_LINE)) {
    if (m.index !== at) throw new Error(`${rel}: text other than an export * line at offset ${at}`);
    const base = path.join(srcDir, path.dirname(rel), m[1]);
    const hit = [`${base}.ts`, `${base}.tsx`].find((p) => fs.existsSync(p));
    if (!hit) throw new Error(`${rel}: no part ${m[1]}.ts or .tsx`);
    parts.push(hit);
    at = m.index + m[0].length;
  }
  if (at !== text.length || parts.length === 0) throw new Error(`${rel}: text other than an export * line at offset ${at}`);
  return parts;
}

export function barrelText(srcDir, rel) {
  return barrelParts(srcDir, rel).map((p) => fs.readFileSync(p, 'utf8')).join('');
}

// A module that keeps code of its own after a split (step 10g's BoardEditor.tsx) is not a barrel. MODULE_PARTS names, for such a
// module, the files a reader of the old module reads, in a fixed order, the module ITSELF among them so the entry says where its own
// text sits: srcText of the module returns them joined (each by its plain path); srcText of any part alone is that part's own text.
// The split's own branch adds its entry; c13-10-split-check.mjs proves the lines moved, and the branch's readers check runs each
// reader's own regex on the old file and on the join.
export const MODULE_PARTS = {};

export function moduleParts(srcDir, rel) {
  const parts = MODULE_PARTS[rel];
  if (!parts.includes(rel)) throw new Error(`MODULE_PARTS['${rel}'] does not list the module itself`);
  if (new Set(parts).size !== parts.length) throw new Error(`MODULE_PARTS['${rel}'] lists a part twice`);
  for (const p of parts) if (!fs.existsSync(path.join(srcDir, p))) throw new Error(`MODULE_PARTS['${rel}']: no file ${p}`);
  return parts.map((p) => path.join(srcDir, p));
}

// A module whose split leaves a WIRING LINE where each part's text used to stand (step 10c's deskLexicon.ts: a `...CANONICAL_CHROME,`
// spread for each run of the CANONICAL literal, a re-export for the DeskTermId union) reads with each part's body put back in place
// of its line: the old text exactly, but for the import lines (c13-10c-lexicon.mjs proves it). A part's body is its text after its
// import lines and the blank line under them, less its wrapper when it has one (an `export const X = {` first line and a
// `} satisfies ...;` last line). srcText of a part alone is that part's own text.
export const INLINE_PARTS = {
  'store/deskLexicon.ts': [
    { at: "export type { DeskTermId } from './lexicon/terms';", part: 'store/lexicon/terms.ts' },
    { at: '  ...CANONICAL_CHROME,', part: 'store/lexicon/canonical/chrome.ts' },
    { at: '  ...CANONICAL_DECKS,', part: 'store/lexicon/canonical/decks.ts' },
    { at: '  ...CANONICAL_SETTINGS,', part: 'store/lexicon/canonical/settings.ts' },
    { at: '  ...CANONICAL_HELP,', part: 'store/lexicon/canonical/help.ts' },
    { at: '  ...FLUX_OVERRIDES,', part: 'store/lexicon/overrides/flux.ts' },
    { at: '  ...MACHINA_OVERRIDES,', part: 'store/lexicon/overrides/machina.ts' },
  ],
};

export function partBody(text) {
  const ls = text.split(/\r?\n/);
  if (ls[ls.length - 1] === '') ls.pop();
  let i = 0;
  while (i < ls.length && /^import\s/.test(ls[i])) i++;
  if (i > 0 && ls[i] === '') i++;
  let body = ls.slice(i);
  if (body.length >= 2 && /^export const [A-Za-z_$][\w$]* = \{$/.test(body[0]) && /^\} satisfies .*;$/.test(body[body.length - 1])) body = body.slice(1, -1);
  return body;
}

export function inlineText(srcDir, rel) {
  const text = fs.readFileSync(path.join(srcDir, rel), 'utf8');
  const EOL = text.includes('\r\n') ? '\r\n' : '\n';
  const ls = text.split(/\r?\n/);
  for (const { at, part } of INLINE_PARTS[rel]) {
    const hits = ls.reduce((n, l) => n + (l === at ? 1 : 0), 0);
    if (hits !== 1) throw new Error(`INLINE_PARTS['${rel}']: the line "${at}" occurs ${hits} times`);
    ls.splice(ls.indexOf(at), 1, ...partBody(fs.readFileSync(path.join(srcDir, part), 'utf8')));
  }
  return ls.join(EOL);
}

// For a harness's own esbuild onLoad, which hands each loaded .ts file's text (with any mutant applied) to the bundler: a module in
// INLINE_PARTS loads as its inline text, so a mutant written against the old module (file: 'store/deskLexicon.ts') still lands in
// the bundle as well as in the source reads. Its part imports, unused once the bodies are in place, are dropped by esbuild as it drops
// any unused TypeScript import. Every other file loads as its own text: a barrel or MODULE_PARTS join would declare its parts twice.
export function bundleText(srcDir, ...rel) {
  const r = path.join(...rel).split(path.sep).join('/');
  if (Object.prototype.hasOwnProperty.call(INLINE_PARTS, r)) return inlineText(srcDir, r);
  return fs.readFileSync(path.join(srcDir, ...rel), 'utf8');
}

export function srcText(srcDir, ...rel) {
  const r = path.join(...rel).split(path.sep).join('/');
  if (r === 'index.css') return globalCss(srcDir);
  if (BARRELS.includes(r)) return barrelText(srcDir, r);
  if (Object.prototype.hasOwnProperty.call(MODULE_PARTS, r)) return moduleParts(srcDir, r).map((p) => fs.readFileSync(p, 'utf8')).join('');
  if (Object.prototype.hasOwnProperty.call(INLINE_PARTS, r)) return inlineText(srcDir, r);
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
