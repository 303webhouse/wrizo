// ITEM 141 — THE SETTLE GUARD. Browserless, in the seed-guard.mjs shape.
//
// WHAT IT IS FOR. A harness that reads a `window.wrizo*` seam as its first probe
// after arriving on a page is reading a document that may not have booted. The
// seams are attached by the app's own module init; a navigation only asks the
// browser to START loading. So `goto()` then `evalJs('window.wrizoX...')` is a
// race, and it is the WORST kind: when it loses, the seam is `undefined` and the
// file dies with a TypeError inside whichever check happened to be first —
// reporting nothing about the thing it was testing.
//
// item97.mjs paid this. Its own source records it: it "read `window.wrizoPairing`
// with no navigation and no wait in front of it", and every check that called
// `birth()` passed for a day against a page that had never finished loading.
//
//   THE WAITFOR IS THE PROOF; NAVIGATION IS NOT.
//
// A navigation is a request. A `waitFor` is an observation — it polls until the
// app has actually rendered something, which is the only evidence the seams are
// installed. Nothing else counts, and in particular:
//
//   A `sleep()` IS NOT A SETTLE. It is a guess about a machine that is sometimes
//   slower than the guess. This guard rejects it explicitly, because a fixed
//   sleep is exactly what someone reaches for when a waitFor feels like
//   ceremony, and it fails on the loaded box rather than the quiet one.
//
// ---------------------------------------------------------------------------
// WHAT IS *NOT* A VIOLATION, and why each exemption is needed rather than
// convenient:
//
//   · A SEAM NAMED INSIDE A `waitFor` CONDITION. That is the settle itself —
//     `waitFor("typeof window.wrizoPairing === 'object'")` polls until the seam
//     exists, which is the fix, not the defect. Counting it would flag item97's
//     own repair and make the guard argue against the thing it is enforcing.
//   · A SEAM IN A COMMENT. Prose that quotes code is not code. item97's file
//     describes its own bug in a comment; a guard that reads prose would report
//     the confession as the crime.
//   · A SEAM REACHED THROUGH A HELPER that itself navigates and waits. Harness
//     files hoist `freshDesk`/`seedFixture` helpers, and the settle lives inside
//     them. Resolved ONE level, which is what the manual sweep of this class
//     needed to go from 12 apparent instances to 1 real one.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.join(HERE, '..', '..');
const HARNESS = path.join(DESKTOP, 'scripts', 'harness');

// --- stripping comments without eating strings -------------------------------
// A line comment inside a string ('https://…', a regex, a CSS selector) is not a
// comment. This walks characters and tracks quote state, which is the same
// discipline the durability matcher in seed-guard.mjs uses; a regex over lines
// would corrupt the input upstream of every check below.
function stripComments(src) {
  let out = '';
  let quote = null;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quote) {
      out += c;
      if (c === '\\') { out += src[i + 1] ?? ''; i += 1; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      if (nl < 0) return out;
      // keep the newline so line numbers survive
      out += '\n';
      i = nl;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) return out;
      for (const ch of src.slice(i, end + 2)) if (ch === '\n') out += '\n';
      i = end + 1;
      continue;
    }
    out += c;
  }
  return out;
}

// --- paren matching, so a call's own arguments can be bounded ----------------
function closeParen(text, open) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === '\\') { i += 1; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '(') depth += 1;
    else if (c === ')') { depth -= 1; if (depth === 0) return i; }
  }
  return -1;
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

const NAV_RE = /\.(goto|reload)\s*\(|location\s*\.\s*(hash|href)\s*=/g;
const SETTLE_RE = /\.waitFor\s*\(/g;
const SEAM_RE = /window\s*\.\s*wrizo[A-Za-z0-9_]*/g;
const SLEEP_RE = /\bsleep\s*\(/g;

// Local helpers, so a settle that lives inside one still counts. Matches
// `const name = async (…) =>` / `function name(`, which is every helper shape
// these files use.
//
// A SETTLE IS NOT ONLY `waitFor`. pw1.mjs rolls its own — a `while` loop that
// re-evaluates an expression until it is true — and that is a settle by every
// property that matters: it OBSERVES rather than assumes, and it cannot pass
// before the page says so. A guard that recognised only the house spelling would
// have called four honest reads a violation, which is how a guard teaches people
// to work around it. What is rejected is `sleep()`, and the difference is not
// the spelling: a poll ends when the condition holds, a sleep ends when the
// clock says so.
const POLLS_RE = /while\s*\([^)]*\)[\s\S]{0,200}?evalJs|for\s*\(;;\)[\s\S]{0,200}?evalJs/;

function helperBodies(text) {
  const bodies = new Map();
  const re = /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(|function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1] || m[2];
    // body: from the definition to the end of its enclosing braces, bounded by
    // the next top-level definition — one level, deliberately.
    const brace = text.indexOf('{', m.index);
    if (brace < 0) continue;
    let depth = 0;
    let quote = null;
    let end = -1;
    for (let i = brace; i < text.length; i += 1) {
      const c = text[i];
      if (quote) {
        if (c === '\\') { i += 1; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '{') depth += 1;
      else if (c === '}') { depth -= 1; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) continue;
    const body = text.slice(brace, end + 1);
    bodies.set(name, {
      body,
      navigates: new RegExp(NAV_RE.source).test(body),
      settles: new RegExp(SETTLE_RE.source).test(body) || POLLS_RE.test(body),
      span: [m.index, end],
    });
  }
  // HELPERS CALL HELPERS, so resolve to a FIXPOINT rather than one level.
  // pw1's `waitOr` does not settle anything itself — it calls `settle`, which
  // polls. Stopping at one level would judge `waitOr` a no-op and flag the four
  // reads it legitimately guards. Iterating to a fixpoint costs nothing here and
  // removes the arbitrary depth that a "one level" rule smuggles in.
  for (let pass = 0; pass < bodies.size + 1; pass += 1) {
    let changed = false;
    for (const [, h] of bodies) {
      for (const [otherName, other] of bodies) {
        if (other === h) continue;
        if (!new RegExp(`\\b${otherName}\\s*\\(`).test(h.body)) continue;
        if (other.settles && !h.settles) { h.settles = true; changed = true; }
        if (other.navigates && !h.navigates) { h.navigates = true; changed = true; }
      }
    }
    if (!changed) break;
  }
  return bodies;
}

// --- the scan ----------------------------------------------------------------
// Events in SOURCE ORDER, walking a two-state machine: a navigation unsettles
// the document, a waitFor settles it, and a seam probe read while UNSETTLED is
// the violation. The order is the whole rule — a waitFor that ran BEFORE the
// navigation proves nothing about the document that came after it.
export function violationsIn(source) {
  const text = stripComments(source);
  const helpers = helperBodies(text);

  // Every waitFor's argument span: a seam named inside one is the settle itself.
  const settleSpans = [];
  for (const m of text.matchAll(SETTLE_RE)) {
    const open = text.indexOf('(', m.index);
    const close = closeParen(text, open);
    if (close > 0) settleSpans.push([open, close]);
  }
  const insideSettle = (i) => settleSpans.some(([a, b]) => i >= a && i <= b);

  // A helper's own body is scanned through its CALL SITE, not where it is
  // defined, so its internal seam reads are not judged out of order.
  const helperSpans = [...helpers.values()].map((h) => h.span);
  const insideHelperDef = (i) => helperSpans.some(([a, b]) => i >= a && i <= b);

  const events = [];
  for (const m of text.matchAll(NAV_RE)) {
    if (insideHelperDef(m.index)) continue;
    events.push({ at: m.index, kind: 'nav' });
  }
  for (const m of text.matchAll(SETTLE_RE)) {
    if (insideHelperDef(m.index)) continue;
    events.push({ at: m.index, kind: 'settle' });
  }
  for (const m of text.matchAll(SLEEP_RE)) {
    if (insideHelperDef(m.index)) continue;
    events.push({ at: m.index, kind: 'sleep' });
  }
  for (const m of text.matchAll(SEAM_RE)) {
    if (insideHelperDef(m.index)) continue;
    if (insideSettle(m.index)) continue;
    events.push({ at: m.index, kind: 'seam', name: m[0] });
  }
  // Helper CALLS expand to what the helper does, one level.
  for (const [name, h] of helpers) {
    if (!h.navigates && !h.settles) continue;
    const callRe = new RegExp(`\\b${name}\\s*\\(`, 'g');
    for (const m of text.matchAll(callRe)) {
      if (insideHelperDef(m.index)) continue;
      if (m.index >= h.span[0] && m.index <= h.span[1]) continue;
      if (h.navigates) events.push({ at: m.index, kind: 'nav' });
      if (h.settles) events.push({ at: m.index + 0.5, kind: 'settle' });
    }
  }

  events.sort((a, b) => a.at - b.at);

  const found = [];
  let settled = false;
  for (const e of events) {
    if (e.kind === 'nav') settled = false;
    else if (e.kind === 'settle') settled = true;
    else if (e.kind === 'sleep') { /* NOT a settle, deliberately — see the header */ }
    else if (e.kind === 'seam' && !settled) {
      found.push({ line: lineOf(text, e.at), seam: e.name });
    }
  }
  return found;
}

// --- the real tree -----------------------------------------------------------
// ONLY BROWSER HARNESSES ARE SCANNED, and the test is whether the file opens a
// browser at all — `withHarness` — not what it is named.
//
// The browserless guards in this directory (seed-guard.mjs, and this file)
// quote seam calls as SYNTHETIC FIXTURE TEXT to drive their own matchers. They
// have no `app`, never navigate, and cannot race a page that does not exist —
// yet the shape reads identically in source, so the first version of this scan
// reported three "violations" in seed-guard.mjs's self-proofs. A file with no
// harness is not a harness, and a guard that cannot tell the difference reports
// its neighbours' test fixtures as defects.
//
// This is deliberately a PROPERTY of the file rather than a name exclusion: the
// next browserless guard is covered without anyone remembering to add it, and a
// real harness cannot dodge the scan by renaming itself.
// The test is an actual IMPORT of withHarness, not the mere appearance of the
// word. The first version tested for the word and flagged THIS FILE — whose
// prose and matcher both name it — which is the same fault it had just fixed in
// seed-guard.mjs, one level up: a guard reading its own description as evidence.
// Importing the thing is what makes a file able to open a browser; saying the
// name is not.
const isHarness = (src) => /import\s*\{[^}]*withHarness[^}]*\}\s*from/.test(src);

const files = existsSync(HARNESS) ? readdirSync(HARNESS).filter((f) => f.endsWith('.mjs')) : [];
const worklist = {};
let population = 0;
let scanned = 0;
let skippedBrowserless = 0;
for (const f of files) {
  const src = readFileSync(path.join(HARNESS, f), 'utf8');
  if (!isHarness(src)) { skippedBrowserless += 1; continue; }
  scanned += 1;
  const hits = violationsIn(src);
  if (hits.length) { worklist[f] = hits; population += 1; }
}

ok(`141: no harness reads a window.wrizo* seam before a settle — the waitFor is the proof, navigation is not. ${population} file(s) carry the shape`,
  population === 0, JSON.stringify({
    filesInDir: files.length, harnessesScanned: scanned, browserlessSkipped: skippedBrowserless,
    population, worklist,
  }, null, 1));

// COVERAGE IS ITS OWN CHECK, because the population check CANNOT distinguish
// "nothing is wrong" from "nothing was looked at". It already failed that way
// once, during this file's own construction: a mangled classifier rejected every
// file, and the guard reported a clean zero while scanning NOTHING. It was green
// and blind, and only the coverage number in its own detail gave it away.
//
// So the scan must prove it looked. A harness directory that yields no harnesses
// is a broken classifier, not a clean tree — never count from a view you cut.
ok(`141 (coverage): the scan actually READ the harnesses — ${scanned} of ${files.length} files classified as browser harnesses. A population of zero means nothing unless this number is right, and a classifier that rejects everything reports a clean tree while looking at none of it`,
  scanned > 50 && scanned + skippedBrowserless === files.length,
  JSON.stringify({ filesInDir: files.length, harnessesScanned: scanned, browserlessSkipped: skippedBrowserless }));

// --- falsifications ----------------------------------------------------------
// The scanner is only worth its green if it reds on the shape it names. Each
// below is the guard turned against a synthetic file, because proving these
// against the real tree would mean breaking the real tree.
const F = {
  bare: "await app.goto('/');\nawait app.evalJs('window.wrizoCreateJournalPage()');",
  settled: "await app.goto('/');\nawait app.waitFor(\"!!document.querySelector('.wz-arrival')\");\nawait app.evalJs('window.wrizoCreateJournalPage()');",
  staleSettle: "await app.waitFor(\"!!document.querySelector('.wz-arrival')\");\nawait app.goto('/');\nawait app.evalJs('window.wrizoCreateJournalPage()');",
  noNav: "await app.evalJs('window.wrizoCreateJournalPage()');",
  slept: "await app.goto('/');\nawait sleep(500);\nawait app.evalJs('window.wrizoCreateJournalPage()');",
  inComment: "await app.goto('/');\n// it read window.wrizoPairing with no wait in front of it\nawait app.waitFor('x');\nawait app.evalJs('1');",
  seamInWaitFor: "await app.goto('/');\nawait app.waitFor(\"typeof window.wrizoPairing === 'object'\");\nawait app.evalJs('window.wrizoPairing.birth()');",
  viaHelper: "const freshDesk = async (app) => {\n  await app.goto('/');\n  await app.waitFor(\"!!document.querySelector('.wz-arrival')\");\n};\nawait freshDesk(app);\nawait app.evalJs('window.wrizoCreateJournalPage()');",
  hashNav: "await app.goto('/');\nawait app.waitFor('x');\nawait app.evalJs(\"location.hash = '#/page/p1'\");\nawait app.evalJs('window.wrizoCreateJournalPage()');",
};

ok('141 FALSIFICATION: goto then a seam read with NO wait is FLAGGED — the exact shape item97 carried, and the one this guard exists for',
  violationsIn(F.bare).length === 1, JSON.stringify(violationsIn(F.bare)));

ok('141 (the control): goto, waitFor, THEN the seam read is clean — so the guard is a matcher rather than a wall that reds on every seam it sees',
  violationsIn(F.settled).length === 0, JSON.stringify(violationsIn(F.settled)));

ok('141 FALSIFICATION: a waitFor BEFORE the navigation does not settle what comes after it — order is the whole rule, and a guard that merely counted both tokens would pass this file',
  violationsIn(F.staleSettle).length === 1, JSON.stringify(violationsIn(F.staleSettle)));

ok('141 FALSIFICATION: a seam read with NO navigation at all is FLAGGED — reading about:blank is the same defect arrived at sooner, and item97 reached its seam with neither a navigation nor a wait',
  violationsIn(F.noNav).length === 1, JSON.stringify(violationsIn(F.noNav)));

ok('141 FALSIFICATION: a sleep() does NOT settle — a fixed pause is a guess about a machine that is sometimes slower than the guess, and it is exactly what gets reached for when a waitFor feels like ceremony',
  violationsIn(F.slept).length === 1, JSON.stringify(violationsIn(F.slept)));

ok('141 (the control): a seam named in a COMMENT is not a read — item97 describes its own bug in prose, and a guard that read prose would report the confession as the crime',
  violationsIn(F.inComment).length === 0, JSON.stringify(violationsIn(F.inComment)));

ok('141 (the control): a seam named inside a waitFor CONDITION is the settle itself, not an unguarded probe — counting it would flag item97\'s own repair and make the guard argue against the thing it enforces',
  violationsIn(F.seamInWaitFor).length === 0, JSON.stringify(violationsIn(F.seamInWaitFor)));

ok('141 (the control): a settle reached through a HELPER counts — freshDesk and friends hoist the navigate-and-wait, and resolving one level is what took the manual sweep of this class from 12 apparent instances to 1 real one',
  violationsIn(F.viaHelper).length === 0, JSON.stringify(violationsIn(F.viaHelper)));

ok('141 FALSIFICATION: a hash navigation UNSETTLES an already-settled page — location.hash is how these files travel between surfaces, and a guard that only watched goto/reload would miss every one of them',
  violationsIn(F.hashNav).length === 1, JSON.stringify(violationsIn(F.hashNav)));

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM141 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM141 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
