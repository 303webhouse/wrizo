#!/usr/bin/env node
// #13 step 10c: the lexicon split (store/deskLexicon.ts -> store/lexicon/{terms, canonical/*, overrides/*}) changes no word. Browserless.
//
//   node apps/desktop/scripts/c13/c13-10c-lexicon.mjs --base <rev>
//
// (1) DUMP: the real module bundled at <base> and as it is now (esbuild, the th-machina-source recipe); for every key in its
//     CANONICAL_TERMS (the window seam), deskTerm(key, theme) for no theme and each ThemeId: every value identical, and the key list
//     identical IN ORDER (Object.keys of CANONICAL, which the spreads must keep).
// (2) INLINE: srcText of deskLexicon.ts (global-css.mjs INLINE_PARTS, each part's body put back in place of its wiring line) is the
//     file at <base> exactly, but for the import lines: so every reader that cuts the text between `const CANONICAL` and
//     `const OVERRIDES` cuts what it cut before.
// (3) LIVENESS: a dump with one value planted different, and a text with one character planted different, each read as DIFFERENT.
//
//   --new <key>=<word>[,<key>=<word>...]   (a later step that ADDS keys, e.g. 10e's progressDrawer) every key not named is held to
//        (1) and (2) as before (the named keys' union member and entry lines are set aside); each named key must be new at <base>, in
//        the table now, and read <word> in every theme reading.
//   --gone <file>   (a later step that DELETES keys, #13 step 11) the file lists one key per line. Each must be in the table at <base>
//        and absent now (no key, no word in any theme); every other key is held to (1) as before, in order. (2) sets aside the gone
//        keys from <base>'s text the way the delete makes them go: a union line keeps its indent and loses only the gone members (a
//        line left with none goes), and each gone key's own entry line goes.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { srcText } from '../global-css.mjs';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const DESKTOP = path.join(ROOT, 'apps/desktop');
const bi = process.argv.indexOf('--base');
const base = bi > 0 ? process.argv[bi + 1] : null;
if (!base) { console.error('usage: --base <rev>'); process.exit(2); }
const ni = process.argv.indexOf('--new');
const NEW = new Map(ni > 0 ? process.argv[ni + 1].split(',').map((p) => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; }) : []);
const gi = process.argv.indexOf('--gone');
const GONE = new Set(gi > 0 ? fs.readFileSync(process.argv[gi + 1], 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')) : []);
// <base>'s text with the gone keys taken out as step 11's delete takes them (see --gone above)
const withoutGone = (t) => t.split('\n').flatMap((l) => {
  const m = /^(\s*)((?:\|\s*'[A-Za-z0-9_]+'\s*)+)(;?)\s*$/.exec(l);
  if (m && !/^\s*\/\//.test(l)) {
    const members = [...m[2].matchAll(/'([A-Za-z0-9_]+)'/g)].map((x) => x[1]);
    const keep = members.filter((k) => !GONE.has(k));
    if (keep.length === members.length) return [l];
    return keep.length ? [`${m[1]}${keep.map((k) => `| '${k}'`).join(' ')}${m[3]}`] : [];
  }
  const e = /^\s*([A-Za-z0-9_]+):/.exec(l);
  return e && GONE.has(e[1]) ? [] : [l];
}).join('\n');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// the scratch lives inside apps/desktop so the bundler finds node_modules (react) from either tree
const SCRATCH = path.join(DESKTOP, '.c13-10c-scratch');
fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });
try {
  // <base>'s src, written out from the object store
  const baseSrc = path.join(SCRATCH, 'base-src');
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', base, 'apps/desktop/src'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const f of files) { const d = path.join(baseSrc, f.slice('apps/desktop/src/'.length)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, execFileSync('git', ['show', `${base}:${f}`], { cwd: ROOT, maxBuffer: 64 << 20 })); }

  const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm');
  const esb = fs.readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d));
  const bin = path.join(pnpmDir, esb, 'node_modules', 'esbuild', 'bin', 'esbuild');
  const bundle = (srcDir, name) => {
    const entry = path.join(SCRATCH, `${name}-entry.ts`), out = path.join(SCRATCH, `${name}.mjs`);
    fs.writeFileSync(entry, `export * from '${srcDir.split(path.sep).join('/')}/store/deskLexicon';\n`);
    execFileSync(process.execPath, [bin, entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=error', '--external:@fontsource/*',
      '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true', '--define:import.meta.env.MODE="production"'], { stdio: 'pipe' });
    return out;
  };
  // a minimal browser, so the module's window seam (wrizoDeskLexicon: t, CANONICAL_TERMS) is set at import
  globalThis.window = globalThis;
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const THEMES = [undefined, 'plateau', 'flux', 'machina'];
  const dumpOf = async (srcDir, name) => {
    delete globalThis.wrizoDeskLexicon;
    await import(pathToFileURL(bundle(srcDir, name)).href);
    const seam = globalThis.wrizoDeskLexicon;
    const keys = seam.CANONICAL_TERMS;
    return { keys, values: Object.fromEntries(keys.map((k) => [k, THEMES.map((th) => seam.t(k, th))])) };
  };
  const beforeAll = await dumpOf(baseSrc, 'base');
  const nowAll = await dumpOf(path.join(DESKTOP, 'src'), 'now');
  // the named gone keys are checked on their own and set aside from <base>; every other key is held to the base exactly
  if (GONE.size) {
    const notAtBase = [...GONE].filter((k) => !beforeAll.keys.includes(k));
    const stillHere = [...GONE].filter((k) => nowAll.keys.includes(k));
    const stillReads = [...GONE].filter((k) => THEMES.some((th) => { try { return globalThis.wrizoDeskLexicon.t(k, th) !== undefined; } catch { return false; } }));
    ok(`GONE: all ${GONE.size} listed keys are in the table at ${base}, and none is in it now or reads a word in any theme`,
      notAtBase.length === 0 && stillHere.length === 0 && stillReads.length === 0, JSON.stringify({ notAtBase, stillHere, stillReads }));
  }
  const before = { keys: beforeAll.keys.filter((k) => !GONE.has(k)), values: beforeAll.values };
  // the named new keys are checked on their own and set aside; every other key is held to the base exactly
  for (const [k, word] of NEW) ok(`NEW: '${k}' is new (absent at ${base}), in the table now, and reads '${word}' in all ${THEMES.length} theme readings`,
    !before.keys.includes(k) && nowAll.keys.includes(k) && nowAll.values[k].every((v) => v === word), JSON.stringify(nowAll.values[k]));
  const now = { keys: nowAll.keys.filter((k) => !NEW.has(k)), values: nowAll.values };
  const differs = (a, b) => JSON.stringify(a.keys) !== JSON.stringify(b.keys) || a.keys.some((k) => JSON.stringify(a.values[k]) !== JSON.stringify(b.values[k]));
  const valueDiffs = before.keys.filter((k) => JSON.stringify(before.values[k]) !== JSON.stringify(now.values[k]));
  ok(`DUMP: ${before.keys.length} keys x ${THEMES.length} theme readings (none, ${THEMES.slice(1).join(', ')}) = ${before.keys.length * THEMES.length} values, identical at ${base} and now`,
    !differs(before, now), valueDiffs.slice(0, 5).join(', '));
  ok('DUMP: the key list (Object.keys of CANONICAL) is identical IN ORDER', JSON.stringify(before.keys) === JSON.stringify(now.keys), `${before.keys.length} vs ${now.keys.length}`);
  ok('DUMP coverage: the dump read the real table (900+ keys, overrides that differ under flux and machina)',
    beforeAll.keys.length >= 900 && before.keys.some((k) => before.values[k][2] !== before.values[k][1]) && before.keys.some((k) => before.values[k][3] !== before.values[k][1]), String(before.keys.length));
  const planted = JSON.parse(JSON.stringify(now)); planted.values[planted.keys[0]][2] += 'x';
  ok('LIVENESS: one value planted different reads as DIFFERENT', differs(before, planted));
  const swapped = JSON.parse(JSON.stringify(now)); [swapped.keys[0], swapped.keys[1]] = [swapped.keys[1], swapped.keys[0]];
  ok('LIVENESS: two keys planted out of order read as DIFFERENT', differs(before, swapped));

  // (2) the inline read
  const noImports = (t) => t.replace(/\r\n/g, '\n').split('\n').filter((l) => !/^import\s/.test(l)).join('\n');
  // <base> read the way a reader reads it: inline when <base> is already split (its parts exist), else its plain text (the split's parent)
  const baseSplit = fs.existsSync(path.join(baseSrc, 'store/lexicon/terms.ts'));
  const was = withoutGone(noImports(baseSplit ? srcText(baseSrc, 'store/deskLexicon.ts') : fs.readFileSync(path.join(baseSrc, 'store/deskLexicon.ts'), 'utf8')));
  let read = noImports(srcText(path.join(DESKTOP, 'src'), 'store/deskLexicon.ts'));
  for (const k of NEW.keys()) read = read.replaceAll(` | '${k}'`, '').split('\n').filter((l) => !new RegExp(`^\\s*${k}:`).test(l)).join('\n');
  const bare = noImports(fs.readFileSync(path.join(DESKTOP, 'src/store/deskLexicon.ts'), 'utf8'));
  const firstDiff = [...was].findIndex((c, i) => c !== read[i]);
  ok(`INLINE: srcText of deskLexicon.ts is the file at ${base} exactly, but for its import lines (${was.split('\n').length} lines)`, read === was,
    firstDiff >= 0 ? `first difference at char ${firstDiff}: ${JSON.stringify(was.slice(firstDiff, firstDiff + 60))} vs ${JSON.stringify(read.slice(firstDiff, firstDiff + 60))}` : `${read.length} vs ${was.length}`);
  ok('INLINE premise: a bare read of deskLexicon.ts is NOT the old text (the seam is what carries the readers)', bare !== was && bare.split('\n').length < 100, String(bare.split('\n').length));
  ok('LIVENESS: a text planted one character different reads as DIFFERENT', read.replace("boardModeOpen: 'Open'", "boardModeOpen: 'Opem'") !== was && read.includes("boardModeOpen: 'Open'"));
} finally {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nC13-10C LEXICON: PASS (${checks.length} checks)` : `\nC13-10C LEXICON: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
