// EXPERIMENT 1 — THE WORD GUARD.
//
// The on-screen rule, after two corrections to this desk:
//   1. "connections" — REFUSED. The board already owns that word.
//      `boardFooterToggle` is "Show connections", sitting with `boardThreadGrab`
//      ("Drag to connect"), and there is a `'connection'` Box KIND meaning
//      exactly that — a thread between two cards (pageExport's boardBody skips
//      it BY NAME). One word would have meant two things on adjacent surfaces.
//   2. "links" — right for the COLUMN, unnecessary on screen. Nick, verbatim:
//      *"'Links' works for the backend, at least. Not sure that needs to be used
//      in the UI, though."*
// So: NO NOUN ON SCREEN. Acts and a state — "Link to…", "Unlink", "Linked".
// `page_links` stays the column's name and appears nowhere a writer can see.
//
// A ruling that lives only in a reviewer's memory gets undone by the next hand,
// so it is asserted mechanically here, in both directions.
//
// Browserless: transpiles deskLexicon.ts with the real compiler and stubs its
// two imports (react, theme) — nothing here needs either.

import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const require = createRequire(join(repo, 'apps/server/package.json'));
const ts = require('typescript');

const REL = 'apps/desktop/src/store/deskLexicon.ts';
const src = readFileSync(join(repo, REL), 'utf8');

let js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;
// Stub the two imports. Asserted rather than assumed: if the import list ever
// grows, this fails loudly instead of silently testing a stale copy.
const beforeStub = js;
js = js.replace(/^import \{ useEffect, useState \} from 'react';$/m,
  'const useEffect = () => {}; const useState = () => [0, () => {}];');
js = js.replace(/^import \{ useTheme.*from '\.\/theme';$/m,
  "const useTheme = () => 'plateau';");
if (js === beforeStub || /^import /m.test(js)) {
  console.log('FAIL — deskLexicon.ts imports changed; this guard could not stub them.');
  console.log('       unstubbed: ' + (js.match(/^import .*$/gm) || []).join(' | '));
  process.exit(1);
}

const tmp = join(tmpdir(), 'wrizo-exp1-lexicon-guard');
mkdirSync(tmp, { recursive: true });
const modPath = join(tmp, 'deskLexicon.mjs');
writeFileSync(modPath, js, 'utf8');
const lex = await import(pathToFileURL(modPath).href);

let failures = 0;
const fail = (msg) => { failures++; console.log('  FAIL ' + msg); };
const ok = (msg) => console.log('  ok   ' + msg);

// Blank comment BODIES while preserving byte positions, so reported line numbers
// stay true. Same helper the (g) census needed, for the same reason.
const blankComments = (s) => {
  let out = '';
  let mode = 'code';
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    if (mode === 'code') {
      if (c === '/' && n === '/') { mode = 'line'; out += '  '; i++; continue; }
      if (c === '/' && n === '*') { mode = 'block'; out += '  '; i++; continue; }
      if (c === "'") mode = 'sq';
      else if (c === '"') mode = 'dq';
      else if (c === '`') mode = 'tpl';
      out += c; continue;
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += c; } else out += ' '; continue; }
    if (mode === 'block') {
      if (c === '*' && n === '/') { mode = 'code'; out += '  '; i++; continue; }
      out += c === '\n' ? c : ' '; continue;
    }
    out += c;
    if (c === '\\') { if (i + 1 < s.length) { out += s[i + 1]; i++; } continue; }
    if (mode === 'sq' && c === "'") mode = 'code';
    else if (mode === 'dq' && c === '"') mode = 'code';
    else if (mode === 'tpl' && c === '`') mode = 'code';
  }
  return out;
};

const T = (id) => {
  const v = lex.canonicalDeskTerm(id);
  // A missing term must be a failure, not `undefined` flowing into a regex and
  // quietly passing — or worse, throwing halfway and leaving later claims unrun.
  if (typeof v !== 'string') { fail(`${id} has no canonical string (got ${String(v)})`); return ''; }
  return v;
};

// Everything this feature says on screen, or in an exported file.
// Includes TOOLS' rail ids as well as the menu's own. The rail and the menu are
// two lanes speaking ONE vocabulary, and a roster that listed only this lane's
// keys is exactly how `zoneLinked: "This page's connections"` passed this guard
// on the way in.
const CONNECT_IDS = [
  'railConnect',
  'menuWritingLabel',
  'connectMenuLink', 'connectMenuNoteThis', 'connectMenuMakeCard', 'connectMenuUnlink',
  'connectRailSelectedEmpty', 'connectRailUnlink', 'connectExportNote',
  'connectAnchorAmbiguous', 'connectAnchorLost',
  // item190-exp1-rail (TOOLS) — the rail's own strings, held to the same ruling.
  'tutorTabLinked', 'zoneLinked', 'zoneLinkedWaiting', 'cascadeSettingsExpConnectFromPage',
];
// The board's thread vocabulary — the words that already mean "a thread between
// two cards". Listed explicitly so adding one is a deliberate act.
const BOARD_THREAD_IDS = [
  'boardFooterToggle', 'boardThreadGrab', 'boardThreadPrefix', 'boardThreadUntitled',
];

console.log("CLAIM 0 — DEFAULT-DENY: nothing outside the board's own terms may say the board's noun");
{
  // ⚠ WHY THIS CLAIM EXISTS, AND WHY IT IS FIRST. The earlier version checked
  // only the `connect*` ids — MY OWN roster. So when TOOLS' rail arrived on
  // item190-exp1-rail carrying `zoneLinked: "This page's connections"`, the guard
  // passed: the collision was in another lane's key and the guard could not see
  // it. A guard whose population is its author's own work is a guard that passes
  // while blind — the same lesson the (g) census taught, in a second costume.
  //
  // So the population is now EVERY canonical term, default-deny, with the board's
  // own thread vocabulary as the ONLY declared exception. That is the direction
  // that scales: a new key anywhere fails until it is either clean or declared.
  const before = failures;
  const allIds = lex.CANONICAL_IDS || [];
  if (allIds.length === 0) {
    fail('could not enumerate the lexicon ids — refusing to report a clean run over an unknown population');
  }
  let scanned = 0;
  for (const id of allIds) {
    if (BOARD_THREAD_IDS.includes(id)) continue;
    const v = lex.canonicalDeskTerm(id);
    if (typeof v !== 'string') continue;
    scanned++;
    if (/\bconnections?\b/i.test(v)) {
      fail(`${id} says the board's noun for a card thread: ${JSON.stringify(v)}`
        + ' — either reword it, or declare it in BOARD_THREAD_IDS if it really is about card threads');
    }
  }
  if (failures === before) ok(`${scanned} terms scanned; only the ${BOARD_THREAD_IDS.length} declared board terms use "connection(s)"`);
}

console.log("CLAIM 1 — the page side uses NO noun at all (Nick's word)");
{
  // This no longer checks that a noun is used consistently; it checks that there
  // is none. Two families are forbidden: the board's noun, and any noun for this
  // feature itself. "Link to…", "Unlink" and "Linked" are an ACT and a STATE and
  // must pass — so the patterns are narrow rather than banning the stem.
  const FORBIDDEN = [
    [/\bconnections?\b/i, "the board's noun for a card thread"],
    [/\blinks\b/i, 'a plural noun for this feature'],
    [/\b(a|the|this|its)\s+link\b/i, 'a singular noun for this feature'],
  ];
  const before = failures;
  for (const id of CONNECT_IDS) {
    const v = T(id);
    for (const [re, why] of FORBIDDEN) {
      if (re.test(v)) fail(`${id} uses ${why}: ${JSON.stringify(v)}`);
    }
  }
  if (failures === before) ok("no noun on the page side, and none of the board's vocabulary");
}

console.log("CLAIM 2 — and the board has not taken the page side's words either");
{
  const before = failures;
  // The reverse direction still matters: a board string saying "Unlink" or
  // "Linked" would read as this feature on the wrong surface.
  for (const id of BOARD_THREAD_IDS) {
    const v = T(id);
    if (/\b(unlink|linked)\b/i.test(v)) {
      fail(`${id} speaks the page side's words: ${JSON.stringify(v)} — the collision, reversed`);
    }
  }
  if (failures === before) ok('board thread terms avoid "Unlink"/"Linked"');
}

console.log('CLAIM 3 — the ruled strings are exactly what was ruled');
{
  const before = failures;
  // Pinned, because these five ARE the ruling. A later "improvement" to any of
  // them is a change to a decision, not to a string.
  const RULED = {
    connectMenuLink: 'Link to…',
    connectMenuUnlink: 'Unlink',
    connectRailUnlink: 'Unlink',
    // The rail's tab is TOOLS' key — pinned where it actually renders
    // (Tutor.tsx), not on a duplicate of mine that nothing called.
    tutorTabLinked: 'Linked',
    connectExportNote: 'Linked material isn’t included.',
  };
  for (const [id, want] of Object.entries(RULED)) {
    if (T(id) !== want) fail(`${id} is ${JSON.stringify(T(id))}, ruled ${JSON.stringify(want)}`);
  }
  if (failures === before) ok('all five ruled strings verbatim');
}

console.log('CLAIM 4 — the take-off act names itself; never a bare "Remove"');
{
  const before = failures;
  // The standing rule is REMOVE UNLINKS AND NEVER DELETES. It used to be kept by
  // adding words to "Remove" ("Remove this link"); "Unlink" keeps it in the verb.
  // Either satisfies it. A BARE "Remove" never does — it does not say which of
  // the two it will do.
  for (const id of ['connectMenuUnlink', 'connectRailUnlink']) {
    const v = T(id).trim();
    if (/^remove$/i.test(v)) {
      fail(`${id} is a bare "Remove" — it must say which of the two it does`);
    } else if (!/^unlink$/i.test(v) && !/^remove\s+\S/i.test(v)) {
      fail(`${id} is neither "Unlink" nor "Remove <something>": ${JSON.stringify(v)}`);
    }
    if (/\bdelete/i.test(v)) fail(`${id} says delete; the act unlinks`);
  }
  if (failures === before) ok('both take-off labels name the act');
}

console.log('CLAIM 5 — neither refusal reads as a deletion');
{
  const before = failures;
  for (const id of ['connectAnchorAmbiguous', 'connectAnchorLost']) {
    const v = T(id);
    if (/\b(deleted|discarded|lost forever|gone for good)\b/i.test(v)) {
      fail(`${id} reads as a deletion: ${JSON.stringify(v)}`);
    }
  }
  // §1 rule 4: a lost anchor is KEPT, is marked, and STILL OPENS its target.
  // Saying only "gone" would read as a deletion however it was meant, so the
  // wording has to carry both halves positively.
  const lost = T('connectAnchorLost');
  if (!/\bkept\b/i.test(lost)) fail('connectAnchorLost does not say it is KEPT — §1 rule 4 requires it');
  if (!/\bopens?\b/i.test(lost)) fail('connectAnchorLost does not say it still OPENS — §1 rule 4 requires that too');
  if (failures === before) ok('both refusals keep the anchor, in words');
}

console.log('CLAIM 6 — and the ruling cannot be broken by a LITERAL in a component');
{
  // ⚠ WHY THIS CLAIM EXISTS. Everything above reads the LEXICON. A ruling about
  // what the writer reads can be broken by a hardcoded string in a component,
  // and it already was: `LinkedRail.tsx` writes its unlink control's accessible
  // name inline as `Remove this link — ${item.label}` — never routed through the
  // lexicon, so no amount of checking the lexicon could see it. The guard's
  // population was the wrong population, for the second time in this file.
  //
  // DECLARED EXCEPTIONS, not silent ones. A known site is listed with its owner
  // and why it still stands, so it stays visible and COUNTED; a NEW site fails.
  // That is the park discipline applied to a guard: the exception is recorded
  // verbatim rather than the check being quietly narrowed around it.
  // ⚠ EMPTY, AND THAT IS THE POINT. One declaration lived here: LinkedRail.tsx's
  // `Remove this link — ${item.label}`, superseded by the no-noun ruling but
  // untouchable from this lane because exp1.mjs asserted the string verbatim.
  // Fable routed it; TOOLS changed the label to the lexicon's "Unlink" and
  // PARKED their original assertion verbatim with its successor
  // (exp1.mjs §230-233). Merged at da17af8, so the declaration is dropped.
  //
  // It came out on the guard's own word, not on memory: the check FAILS when a
  // declaration matches nothing, so the moment TOOLS' fix landed this file said
  // "a DECLARED exception matched nothing" instead of passing with a dead
  // exemption still in it. An allowlist that cannot tell you it is stale is how
  // a temporary exception becomes permanent.
  //
  // The shape stays for the next one: exact literal, named owner, stated reason.
  const DECLARED = [];
  const FORBIDDEN_IN_SOURCE = [
    [/\bconnections?\b/i, "the board's noun for a card thread"],
    [/Remove this link/, 'the superseded take-off wording (now "Unlink")'],
  ];
  const SKIP = ['deskLexicon.ts', 'themeLexicon.ts'];

  const files = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) { if (name !== 'node_modules') walk(p); }
      else if (/\.(ts|tsx)$/.test(name) && !SKIP.some((s) => name === s)) files.push(p);
    }
  })(join(repo, 'apps/desktop/src'));

  const before = failures;
  let declaredHits = 0;
  let scanned = 0;
  for (const f of files) {
    const rel = f.replace(repo.replace(/\\/g, '/'), '').replace(/\\/g, '/').replace(/^\//, '');
    // ⚠ PARSED, NOT SCANNED — and this claim needed TWO corrections to get here.
    // First it read comment prose as literals, because an apostrophe in "the
    // module's own law" opens what a naive matcher thinks is a string. Stripping
    // comments fixed that and left one last false positive: `pageExport.ts` holds
    // the regex /[<>:"/\\|?*\x00-\x1f]/, whose `"` put a hand-rolled scanner into
    // string mode and desynchronised the rest of the file. Telling a regex literal
    // from division is not a job for a regex. The compiler is already loaded in
    // this file, so it does the job exactly.
    const raw = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    scanned++;
    const sf = ts.createSourceFile(f, raw, ts.ScriptTarget.Latest, true,
      /\.tsx$/.test(f) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const lits = [];
    (function visit(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        lits.push({ text: node.text, pos: node.getStart(sf) });
      } else if (ts.isTemplateExpression(node)) {
        // A template's literal chunks are what a writer reads; the ${...} holes
        // are values. `Remove this link — ${item.label}` must still be caught.
        lits.push({ text: node.head.text + node.templateSpans.map((s) => s.literal.text).join(' '), pos: node.getStart(sf) });
      }
      ts.forEachChild(node, visit);
    })(sf);
    for (const m of lits) {
      const text = m.text;
      // a CSS class / data attribute / id is not writer-facing
      if (/^[\w-]+$/.test(text) || /^[.#]/.test(text)) continue;
      for (const [re, why] of FORBIDDEN_IN_SOURCE) {
        if (!re.test(text)) continue;
        const line = raw.slice(0, m.pos).split('\n').length;
        const dec = DECLARED.find((d) => rel.endsWith(d.file.replace('apps/desktop/src', 'src')) || rel === d.file);
        if (dec && text === dec.literal) {
          declaredHits++;
          console.log(`  note ${rel}:${line} — DECLARED (${dec.owner}): ${JSON.stringify(text.slice(0, 60))}`);
          continue;
        }
        fail(`${rel}:${line} uses ${why} in a writer-facing literal: ${JSON.stringify(text.slice(0, 70))}`);
      }
    }
  }
  if (failures === before) {
    ok(`${scanned} source files scanned; ${declaredHits} declared exception(s), no new violations`);
  }
  // Only meaningful while something IS declared: a stale exemption must announce
  // itself, but an EMPTY allowlist is the healthy state, not a fault.
  if (DECLARED.length > 0 && declaredHits !== DECLARED.length) {
    fail(`a DECLARED exception matched nothing (${declaredHits}/${DECLARED.length}) — it is either fixed (remove it) or the matcher has gone blind`);
  }
}

console.log('\n' + (failures === 0
  ? 'EXP1 WORD GUARD: CLEAN'
  : `EXP1 WORD GUARD: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
