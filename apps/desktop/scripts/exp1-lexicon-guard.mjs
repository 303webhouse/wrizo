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

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
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

const T = (id) => {
  const v = lex.canonicalDeskTerm(id);
  // A missing term must be a failure, not `undefined` flowing into a regex and
  // quietly passing — or worse, throwing halfway and leaving later claims unrun.
  if (typeof v !== 'string') { fail(`${id} has no canonical string (got ${String(v)})`); return ''; }
  return v;
};

// Everything this feature says on screen, or in an exported file.
const CONNECT_IDS = [
  'connectMenuLink', 'connectMenuNoteThis', 'connectMenuMakeCard', 'connectMenuUnlink',
  'connectRailTab', 'connectRailRestingEmpty', 'connectRailSelectedEmpty',
  'connectRailUnlink', 'connectExportNote',
  'connectAnchorAmbiguous', 'connectAnchorLost',
];
// The board's thread vocabulary — the words that already mean "a thread between
// two cards". Listed explicitly so adding one is a deliberate act.
const BOARD_THREAD_IDS = [
  'boardFooterToggle', 'boardThreadGrab', 'boardThreadPrefix', 'boardThreadUntitled',
];

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
    connectRailTab: 'Linked',
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

console.log('\n' + (failures === 0
  ? 'EXP1 WORD GUARD: CLEAN'
  : `EXP1 WORD GUARD: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
