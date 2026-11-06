#!/usr/bin/env node
// #13 step 10h: the persistence split keeps ONE cache (the seeding law: the hazard is the cache, AGENTS.md). Browserless.
//
//   node apps/desktop/scripts/c13/c13-10h-persistence.mjs --base <rev>
//
// (1) ONE CACHE: in all of apps/desktop/src exactly one module declares the collection cache (`const cache`) and exactly one defines
//     its hydration (`function hydrate`), both store/persistence/core.ts; every part that reads the cache imports it from './core'
//     (none declares a `cache` of its own).
// (2) THE API: store/persistence.ts exports exactly the names it exported at <base>, no more (the internals the parts share, such as
//     cache, dirty, upsert, notify, scheduleFlush, never join it), and it loads every part, the seams included (they register on load).
// (3) LIVENESS: a second `const cache` planted in a part, an internal planted in the barrel, and a part dropped from the barrel each FAIL.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = path.join(ROOT, 'apps/desktop/src');
const bi = process.argv.indexOf('--base');
const base = bi > 0 ? process.argv[bi + 1] : null;
if (!base) { console.error('usage: --base <rev>'); process.exit(2); }
const walk = (d) => fs.readdirSync(path.join(SRC, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.posix.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.posix.join(d, e.name)] : []));
const files = walk('.').map((f) => f.replace(/^\.\//, ''));
const texts = new Map(files.map((f) => [f, fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n')]));
const PARTS_DIR = 'store/persistence/';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const cacheDecls = (t) => [...t].filter(([, s]) => /^(export )?const cache\b/m.test(s)).map(([f]) => f);
const hydrateDefs = (t) => [...t].filter(([, s]) => /^(export )?function hydrate\b/m.test(s)).map(([f]) => f);
const ownCache = (t) => [...t].filter(([f, s]) => f.startsWith(PARTS_DIR) && f !== `${PARTS_DIR}core.ts` && /\bcache\b/.test(s)
  && !/^import \{[^}]*\bcache\b[^}]*\} from '\.\/core';/m.test(s)).map(([f]) => f);
const oneCache = (t) => { const c = cacheDecls(t), h = hydrateDefs(t), o = ownCache(t); return { pass: c.length === 1 && c[0] === `${PARTS_DIR}core.ts` && h.length === 1 && h[0] === `${PARTS_DIR}core.ts` && o.length === 0, c, h, o }; };
const real = oneCache(texts);
ok('ONE CACHE: one module declares the cache and one defines its hydration, both store/persistence/core.ts; every other part that names the cache imports it from ./core',
  real.pass, JSON.stringify({ cache: real.c, hydrate: real.h, partsWithTheirOwn: real.o }));
const users = [...texts].filter(([f, s]) => f.startsWith(PARTS_DIR) && /^import \{[^}]*\bcache\b[^}]*\} from '\.\/core';/m.test(s)).length;
ok(`COVERAGE: the parts that read the cache import it (${users} of ${[...texts.keys()].filter((f) => f.startsWith(PARTS_DIR)).length} parts)`, users >= 10, String(users));

// (2) the barrel
const exportsOfText = (s) => {
  const out = new Set();
  for (const m of s.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
  for (const m of s.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}/gm)) for (const p of m[1].split(',')) { const n = p.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop(); if (n) out.add(n); }
  return out;
};
const was = exportsOfText(execFileSync('git', ['show', `${base}:apps/desktop/src/store/persistence.ts`], { cwd: ROOT, encoding: 'utf8' }).replace(/\r\n/g, '\n'));
const barrelOf = (s) => ({ names: exportsOfText(s), parts: [...s.matchAll(/^(?:export \{[^}\n]*\} from|export \* from|import) '\.\/persistence\/([A-Za-z0-9-]+)';$/gm)].map((m) => m[1]) });
const partFiles = [...texts.keys()].filter((f) => f.startsWith(PARTS_DIR)).map((f) => f.slice(PARTS_DIR.length).replace(/\.ts$/, '')).sort();
const api = (s) => { const b = barrelOf(s); const extra = [...b.names].filter((n) => !was.has(n)), lost = [...was].filter((n) => !b.names.has(n)), unloaded = partFiles.filter((p) => !b.parts.includes(p));
  return { pass: extra.length === 0 && lost.length === 0 && unloaded.length === 0 && b.parts.includes('seams'), extra, lost, unloaded, n: b.names.size, parts: b.parts.length }; };
const barrel = texts.get('store/persistence.ts');
const realApi = api(barrel);
ok(`THE API: store/persistence.ts exports exactly its ${was.size} names at ${base} (now ${realApi.n}) and loads all ${partFiles.length} parts, the seams included`,
  realApi.pass, JSON.stringify({ extra: realApi.extra, lost: realApi.lost, unloaded: realApi.unloaded }));

// (3) liveness
const planted = new Map(texts); planted.set(`${PARTS_DIR}boards.ts`, texts.get(`${PARTS_DIR}boards.ts`) + '\nconst cache = { projects: [] };\n');
ok('LIVENESS: a second `const cache` planted in a part is caught', !oneCache(planted).pass);
ok('LIVENESS: an internal (cache) planted in the barrel is caught', !api(barrel.replace("} from './persistence/core';", ", cache } from './persistence/core';")).pass);
ok('LIVENESS: the seams dropped from the barrel are caught', !api(barrel.replace("import './persistence/seams';\n", '')).pass);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nC13-10H PERSISTENCE: PASS (${checks.length} checks)` : `\nC13-10H PERSISTENCE: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
