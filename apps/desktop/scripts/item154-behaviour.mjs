// ITEM 154 — THE FALSIFICATION, AT EVERY REWRITTEN SITE, WITHOUT A BROWSER.
//
// The rewrite tool proves the file says what was INTENDED (byte comparison).
// That is not proof the intent BEHAVES: reading the sites found three
// intents that were wrong (a probe whose absence the caller asserts, a
// negative assertion whose passing state is absence, a `||` fallback whose
// absence is consumed) — each a green check a mechanical conversion would
// have turned red. So this runs the OLD text and the NEW text of every
// changed evalJs argument against a stub DOM, in three worlds:
//
//   ABSENT  — every lookup misses. The OLD text must stay SILENT (that is
//             the defect); the NEW text must THROW, and by name ("no ...").
//             (The guard must fire by name in AT LEAST ONE of ABSENT / INNER.)
//   INNER   — the outer container is found, everything inside it misses; reaches
//             a guard that sits behind an earlier silent exit (`if (!row) return`).
//   PRESENT — every lookup hits. The NEW text must NOT throw its named
//             failure, and must perform EXACTLY the same acts as the old
//             (same verbs, same count): the rewrite may not change what a
//             passing run does.
//
// A site the stub cannot model (it throws something that is not a "no ..."
// failure for an unrelated reason) is reported INCONCLUSIVE, by name and
// reason — never counted as a pass. "Unmodelled" is not the same as "safe".
//
// This does not replace the pair: the stub cannot know what the real page
// does. It is the falsification that lets a green pair mean something — a
// guard shown to fire when it should and stay quiet when it should, before
// the run, not inferred from the run.
//
// ITS LIMIT, STATED SO THE NEXT READER INHERITS THE GAP AND NOT THE
// CONFIDENCE (the same posture as assertHittable's documented limit): it
// proves the transform is STRUCTURALLY right — the guard fires by name, the
// act is unchanged when the target exists, no code was dropped. It CANNOT
// tell a silent act from a probe whose absence is asserted, an
// expected-absent negative check, or a `||` fallback: in every one of those
// the converted text "behaves correctly" here and is still the wrong thing
// to have done. Those were found by READING each site, which is why the
// exemptions live in a reviewable table (item154-exemptions.mjs) and not in
// a pattern. A 147/147 here means "every rewrite does what it says", never
// "every rewrite should have been made".
//
// Mutation-tested on COPIES of the harness (--dir=): an inert guard, a
// dropped act, an inverted guard and a dropped statement are each reported
// as a FAIL with the right diagnosis; each mutation was asserted to have
// LANDED before the run.
//
// Run: node scripts/item154-behaviour.mjs [--base=<pre-rewrite commit>]
// (from apps/desktop; no browser, no box turn)
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = path.join(HERE, 'harness');
const baseArg = process.argv.find((a) => a.startsWith('--base='));
const BASE = baseArg ? baseArg.slice('--base='.length) : 'b5a13a1';
// --dir=<path> reads the AFTER text from a scratch copy of the harness (used to
// mutation-test this tool on copies, never on the committed tree).
const dirArg = process.argv.find((a) => a.startsWith('--dir='));
const AFTER_DIR = dirArg ? path.resolve(dirArg.slice('--dir='.length)) : HARNESS_DIR;
const PH = '__ITEM154_X__';

function parseTexts(text, filePath) {
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const out = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isEvalJs = (ts.isPropertyAccessExpression(callee) && callee.name.text === 'evalJs') || (ts.isIdentifier(callee) && callee.text === 'evalJs');
      if (isEvalJs && node.arguments.length > 0) {
        const arg = node.arguments[0];
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        let parse = null;
        if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) parse = arg.text;
        else if (ts.isTemplateExpression(arg)) {
          parse = arg.head.text;
          for (const s of arg.templateSpans) { parse += PH; parse += s.literal.text; }
        }
        out.push({ line: line + 1, parse });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

// The stub world. Everything is built INSIDE the vm context so every object
// shares one realm (an Array literal in the evaluated code is the context's
// own Array, whose `find` is patched below).
const SETUP = `
(function () {
  var g = globalThis;
  g.__log = [];
  g.__world = 'absent';
  function many() { return [makeEl(), makeEl(), makeEl(), makeEl()]; }
  var VERBS = { click: 1, focus: 1, blur: 1, dispatchEvent: 1, scrollIntoView: 1, submit: 1 };
  function perm(name) {
    return new Proxy(function () {}, {
      get: function (t, k) {
        if (k === Symbol.toPrimitive) return function () { return ''; };
        if (k === Symbol.iterator) return function* () {};
        if (k === 'then') return undefined;
        return perm(name + '.' + String(k));
      },
      apply: function () { return perm(name + '()'); },
      construct: function () { return perm('new ' + name); },
      set: function () { return true; },
    });
  }
  function makeEl() {
    return new Proxy(function () {}, {
      get: function (t, k) {
        if (k === Symbol.toPrimitive) return function () { return 'x'; };
        if (k === Symbol.iterator) return function* () { yield makeEl(); };
        if (k === 'then') return undefined;
        if (k === 'length') return 1;
        if (typeof k === 'string' && VERBS[k]) return function () { g.__log.push(k); return undefined; };
        if (k === 'textContent' || k === 'innerText' || k === 'value' || k === 'nodeValue') return 'x';
        if (k === 'querySelector') return function () { return g.__world === 'present' ? makeEl() : null; };
        if (k === 'querySelectorAll') return function () { return g.__world === 'present' ? many() : []; };
        if (k === 'getAttribute') return function () { return ''; };
        return perm('el.' + String(k));
      },
      apply: function () { return makeEl(); },
      set: function () { return true; },
    });
  }
  g.document = new Proxy({}, {
    get: function (t, k) {
      if (k === 'querySelector') return function () { return g.__world === 'absent' ? null : makeEl(); };
      if (k === 'querySelectorAll') return function () { return g.__world === 'absent' ? [] : many(); };
      if (k === 'body' || k === 'documentElement' || k === 'activeElement') return makeEl();
      return perm('document.' + String(k));
    },
    set: function () { return true; },
  });
  // In the PRESENT world a predicate cannot be modelled, so \`find\` hits; in
  // the ABSENT world it misses — that is the only distinction being tested.
  Array.prototype.find = function () { return g.__world === 'absent' ? undefined : this[0]; };
  ['window', 'location', 'localStorage', 'sessionStorage', 'getComputedStyle', 'NodeFilter',
   'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'Event', 'CustomEvent', 'MutationObserver',
   'navigator', 'performance', 'requestAnimationFrame', 'fetch', 'XMLHttpRequest', '${PH}']
    .forEach(function (n) { g[n] = perm(n); });
})();
`;

function run(code, world) {
  const ctx = vm.createContext({});
  vm.runInContext(SETUP, ctx);
  ctx.__world = world;
  let threw = null;
  try { vm.runInContext(code, ctx, { timeout: 250 }); }
  catch (e) { threw = String(e && e.message !== undefined ? e.message : e); }
  return { threw, log: [...ctx.__log] };
}

const isNamed = (msg) => typeof msg === 'string' && msg.startsWith('no ');

const files = readdirSync(HARNESS_DIR).filter((f) => f.endsWith('.mjs')).sort();
let changed = 0;
const good = [];
const failures = [];
const inconclusive = [];

for (const f of files) {
  let baseText;
  try { baseText = execFileSync('git', ['show', `${BASE}:apps/desktop/scripts/harness/${f}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch { continue; }
  const before = parseTexts(baseText, f);
  const after = parseTexts(readFileSync(path.join(AFTER_DIR, f), 'utf8'), f);
  if (before.length !== after.length) { failures.push(`${f}: evalJs argument count changed ${before.length} -> ${after.length}`); continue; }
  for (let i = 0; i < before.length; i += 1) {
    const b = before[i];
    const a = after[i];
    if (b.parse === a.parse || a.parse === null) continue;
    changed += 1;
    const where = `${f}:${a.line}`;
    // Three worlds. ABSENT: every lookup misses. PRESENT: every lookup hits.
    // INNER: the outer container is found but everything looked up INSIDE it
    // misses — this reaches a guard sitting behind an earlier `if (!row) return`.
    const R = {
      oldA: run(b.parse, 'absent'), newA: run(a.parse, 'absent'),
      oldI: run(b.parse, 'inner'), newI: run(a.parse, 'inner'),
      oldP: run(b.parse, 'present'), newP: run(a.parse, 'present'),
    };

    // PRESENT world FIRST: a guard that fires when the target IS there is the
    // worst failure, and must not be masked by anything found in a miss world.
    if (isNamed(R.newP.threw)) { failures.push(`${where}: the NEW text threw "${R.newP.threw.slice(0, 60)}" when the target IS present`); continue; }
    if ((R.newP.threw !== null || R.oldP.threw !== null) && R.newP.threw !== R.oldP.threw) {
      inconclusive.push(`${where}: present-world stub gap (old: ${R.oldP.threw && R.oldP.threw.slice(0, 40)} / new: ${R.newP.threw && R.newP.threw.slice(0, 40)})`);
      continue;
    }
    if (R.oldP.log.join(',') !== R.newP.log.join(',')) {
      failures.push(`${where}: present-world acts differ — old [${R.oldP.log.join(',')}] vs new [${R.newP.log.join(',')}]`);
      continue;
    }

    // MISS worlds: the guard must fire, BY NAME, in at least one of them.
    const fires = [];
    if (isNamed(R.newA.threw)) fires.push(['absent', R.oldA]);
    if (isNamed(R.newI.threw)) fires.push(['inner', R.oldI]);
    if (fires.length === 0) {
      const others = [R.newA.threw, R.newI.threw].filter((t) => t !== null);
      // A native TypeError on a null target is what an UNGUARDED act does: the
      // failure exists, but it is not the named one this item is about.
      const native = others.find((t) => t.startsWith('Cannot read properties of'));
      if (others.length === 0) failures.push(`${where}: the NEW text did NOT throw in ANY miss world — the guard is inert`);
      else if (native) failures.push(`${where}: no NAMED failure in any miss world — only a native TypeError ("${native.slice(0, 50)}"): the guard is missing or inert`);
      else inconclusive.push(`${where}: no named failure reached; stub gap -- ${others[0].slice(0, 70)}`);
      continue;
    }
    // ...where the OLD text must have stayed silent (that is the defect).
    const badOld = fires.find(([, old]) => isNamed(old.threw));
    if (badOld) { failures.push(`${where}: the OLD text already threw a named failure in the ${badOld[0]} world`); continue; }
    const actedOld = fires.find(([, old]) => old.log.length !== 0);
    if (actedOld) { inconclusive.push(`${where}: the OLD text acted in the ${actedOld[0]} world (log ${actedOld[1].log.join(',')}) — the stub cannot model this absence`); continue; }
    good.push(`${where}${fires[0][0] === 'inner' ? '  (reached in the inner-miss world — an earlier exit shadows the all-absent one)' : ''}`);
  }
}

console.log(`ITEM 154 BEHAVIOUR — ${changed} changed evalJs arguments, old vs new, three worlds each (base ${BASE})`);
console.log(`  CONCLUSIVE, correct:   ${good.length}   (absent: old silent, new throws by name; present: same acts, no throw)`);
console.log(`  FAILED:                ${failures.length}`);
console.log(`  INCONCLUSIVE (stub):   ${inconclusive.length}   (named below — not counted as a pass)`);
for (const x of failures) console.log(`    FAIL  ${x}`);
for (const x of inconclusive) console.log(`    ????  ${x}`);
if (failures.length) process.exit(1);
