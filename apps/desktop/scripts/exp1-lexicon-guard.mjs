// EXPERIMENT 1 — THE WORD GUARD.
//
// Fable caught this desk reusing the board's own word: `boardFooterToggle` is
// "Show connections" and it toggles the THREADS BETWEEN CARDS (there is even a
// `'connection'` Box kind meaning exactly that). Calling a page's links
// "connections" too would make one word mean two things to the same writer on
// adjacent surfaces.
//
// A ruling that lives only in a reviewer's memory gets undone by the next hand,
// so this asserts it mechanically, in BOTH directions, and also proves the claim
// that the English lives in ONE place — because "it composes from one constant"
// is worth nothing if a later edit quietly hardcodes the noun again.
//
// Browserless: transpiles deskLexicon.ts with the real compiler and stubs its
// two imports (react, theme) — nothing here needs either.

import { execFileSync } from 'node:child_process';
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
// grows, the replace below stops matching and this guard fails loudly instead
// of silently testing a stale copy.
const before = js;
js = js.replace(/^import \{ useEffect, useState \} from 'react';$/m,
  'const useEffect = () => {}; const useState = () => [0, () => {}];');
js = js.replace(/^import \{ useTheme.*from '\.\/theme';$/m,
  "const useTheme = () => 'plateau';");
if (js === before || /^import /m.test(js)) {
  console.log('FAIL — deskLexicon.ts imports changed; this guard could not stub them.');
  console.log('       unstubbed: ' + (js.match(/^import .*$/gm) || []).join(' | '));
  process.exit(1);
}

const tmp = join(tmpdir(), 'wrizo-exp1-lexicon-guard');
mkdirSync(tmp, { recursive: true });
const p = join(tmp, 'deskLexicon.mjs');
writeFileSync(p, js, 'utf8');
const lex = await import(pathToFileURL(p).href);

const T = (id) => lex.canonicalDeskTerm(id);
let failures = 0;
const fail = (msg) => { failures++; console.log('  FAIL ' + msg); };
const ok = (msg) => console.log('  ok   ' + msg);

// The two vocabularies that must not overlap.
const CONNECT_IDS = [
  'connectMenuLink', 'connectMenuNoteThis', 'connectMenuMakeCard', 'connectMenuRemove',
  'connectRailTitle', 'connectRailRestingEmpty', 'connectRailSelectedEmpty',
  'connectRailRemove', 'connectTermOne', 'connectTermMany',
  'connectAnchorAmbiguous', 'connectAnchorLost',
];
// The board's thread vocabulary — the words that already mean "a thread between
// two cards". Listed explicitly so adding one is a deliberate act.
const BOARD_THREAD_IDS = [
  'boardFooterToggle', 'boardThreadGrab', 'boardThreadPrefix', 'boardThreadUntitled',
];

const word = (w) => new RegExp(`\\b${w}\\b`, 'i');

console.log('CLAIM 1 — the page\'s noun is NOT the board\'s noun');
{
  const one = T('connectTermOne');
  const many = T('connectTermMany');
  console.log(`  page's noun: "${one}" / "${many}"`);
  for (const forbidden of ['connection', 'connections']) {
    if (word(forbidden).test(one) || word(forbidden).test(many)) {
      fail(`the page's noun is "${forbidden}" — that is the board's word for a card thread`);
    }
  }
  // and no connect* string may smuggle it back in
  for (const id of CONNECT_IDS) {
    const v = T(id);
    for (const forbidden of ['connection', 'connections']) {
      if (word(forbidden).test(v)) fail(`${id} says "${forbidden}": ${JSON.stringify(v)}`);
    }
  }
  if (failures === 0) ok('no connect* term uses the board\'s noun');
}

console.log('CLAIM 2 — and the board has not taken the page\'s noun either');
{
  const before = failures;
  const one = T('connectTermOne');
  const many = T('connectTermMany');
  for (const id of BOARD_THREAD_IDS) {
    const v = T(id);
    if (word(one).test(v) || word(many).test(v)) {
      fail(`${id} says the page's noun: ${JSON.stringify(v)} — the collision, reversed`);
    }
  }
  if (failures === before) ok(`board thread terms avoid "${one}"/"${many}"`);
}

console.log('CLAIM 3 — the English lives in ONE place: every noun COMPOSES');
{
  const before = failures;
  const one = T('connectTermOne');
  const many = T('connectTermMany');
  // Each of these must contain the shared noun rather than a hardcoded copy, so
  // that changing the two constants changes all of them.
  const mustContainMany = ['connectRailTitle', 'connectRailRestingEmpty', 'connectRailSelectedEmpty'];
  const mustContainOne = ['connectMenuRemove', 'connectRailRemove', 'connectAnchorLost'];
  for (const id of mustContainMany) {
    if (!word(many).test(T(id))) fail(`${id} does not use connectTermMany ("${many}"): ${JSON.stringify(T(id))}`);
  }
  for (const id of mustContainOne) {
    if (!word(one).test(T(id))) fail(`${id} does not use connectTermOne ("${one}"): ${JSON.stringify(T(id))}`);
  }
  if (failures === before) ok('all six composed strings carry the shared noun');
}

console.log('CLAIM 4 — "Remove" is never bare (it unlinks, and must say so)');
{
  const before = failures;
  for (const id of ['connectMenuRemove', 'connectRailRemove']) {
    const v = T(id).trim();
    if (/^remove$/i.test(v)) fail(`${id} is a bare "Remove" — the menu must say which of the two it does`);
    if (!/^remove\b/i.test(v)) fail(`${id} no longer begins with "Remove": ${JSON.stringify(v)}`);
  }
  if (failures === before) ok('both remove terms name what they remove');
}

console.log('CLAIM 5 — neither refusal reads as a deletion');
{
  const before = failures;
  for (const id of ['connectAnchorAmbiguous', 'connectAnchorLost']) {
    const v = T(id);
    if (/\b(deleted|removed|discarded|lost forever|gone for good)\b/i.test(v)) {
      fail(`${id} reads as a deletion: ${JSON.stringify(v)}`);
    }
  }
  // the lost wording must positively say the link survives
  if (!/\bkept\b/i.test(T('connectAnchorLost'))) {
    fail('connectAnchorLost does not say the link is KEPT — §1 rule 4 requires it');
  }
  if (failures === before) ok('both refusals keep the anchor, in words');
}

console.log('\n' + (failures === 0
  ? 'EXP1 WORD GUARD: CLEAN'
  : `EXP1 WORD GUARD: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
