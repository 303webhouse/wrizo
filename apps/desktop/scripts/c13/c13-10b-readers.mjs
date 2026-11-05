#!/usr/bin/env node
// #13 step 10b: every source reader of types/index.ts, its own regex verbatim, answers the same on the file before the split and on
// srcText's joined barrel now. Browserless.
//
//   node apps/desktop/scripts/c13/c13-10b-readers.mjs --base <rev>
//
// Each line names the reader and also shows what a bare read of the barrel would answer: a reader that would be blind or red there
// is one srcText has to carry (global-css.mjs BARRELS).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { srcText } from '../global-css.mjs';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = path.join(ROOT, 'apps/desktop/src');
const bi = process.argv.indexOf('--base');
const base = bi > 0 ? process.argv[bi + 1] : null;
if (!base) { console.error('usage: --base <rev>'); process.exit(2); }
const noCR = (s) => s.replace(/\r\n?/g, '\n');
const before = noCR(execFileSync('git', ['show', `${base}:apps/desktop/src/types/index.ts`], { cwd: ROOT, encoding: 'utf8' }));
const after = noCR(srcText(SRC, 'types/index.ts'));
const bare = noCR(fs.readFileSync(path.join(SRC, 'types/index.ts'), 'utf8'));

const readers = {
  'guided-add-scenes W8 (the Box type gains nothing)': (t) => !/childWord|isScene|scenes\?:/.test(t),
  'guided-w1 K9 (boardKind / homeView on Box)': (t) => /boardKind\?: 'board' \| 'book';/.test(t) && /homeView\?: /.test(t) && /kind: 'text' \| 'ink' \| 'page-pin' \| 'connection' \| 'board-meta';/.test(t),
  'guided-w5 L7 (Box.lit)': (t) => /\blit\?: boolean;/.test(t),
  'page-templates-r2 P1 (PageSettings.template)': (t) => /template\?: PageTemplate;/.test(t) && /export type PageTemplate = 'outline' \| 'title' \| 'bibliography';/.test(t),
  'sized-by-hand-logic S5 (sizedByHand?: true)': (t) => /sizedByHand\?: true;/.test(t),
  'guided-w3 NT1 (no .prompt reader)': (t) => !/\b(?:box|b|card|popupBox|x|c)\??\.prompt\b/.test(t),
  'item204-proofing-merge-proof (the two constants)': (t) => { const d = t.match(/PROOFING_DEFAULT_DIALECT: ProofingDialect = '([^']+)'/), n = t.match(/PROOFING_TOMBSTONE_DAYS = (\d+)/); return d && n ? `${d[1]} ${n[1]}` : false; },
};
const lines = (t) => t.split('\n').filter((l) => l.trim() && !/^(import|export \* from) /.test(l)).sort();
let bad = 0;
for (const [name, f] of Object.entries(readers)) {
  const b = f(before), a = f(after);
  if (b !== a) bad++;
  console.log(`${b === a ? 'SAME' : 'DIFF'}  ${name}: before ${b}, joined ${a}  (a bare read of the barrel: ${f(bare)})`);
}
const same = JSON.stringify(lines(before)) === JSON.stringify(lines(after));
if (!same) bad++;
console.log(`${same ? 'SAME' : 'DIFF'}  the joined text holds the same lines as the file before (${lines(before).length}), in part order`);
// liveness: the joined read of a planted part must change a reader's answer
const planted = after.replace('sizedByHand?: true;', 'sizedByHand?: boolean;');
const live = readers['sized-by-hand-logic S5 (sizedByHand?: true)'](planted) === false;
if (!live) bad++;
console.log(`${live ? 'PASS' : 'FAIL'}  LIVENESS: a planted edit in a part changes a reader's answer`);
console.log(bad ? `\nC13-10B READERS: FAIL (${bad})` : `\nC13-10B READERS: PASS (${Object.keys(readers).length} readers, the line set, liveness)`);
process.exit(bad ? 1 : 0);
