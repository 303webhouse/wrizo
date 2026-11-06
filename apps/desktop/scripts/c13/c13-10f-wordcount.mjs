#!/usr/bin/env node
// #13 step 10f, CLOSED as a check (Fable, Nov 5). Polish #10 item 4 (6a1b1caa, Oct 28) already made the one word counter
// (store/wordCount.ts, through withoutFontMarks); 10f has no split to make. This check records that and keeps it true. Browserless.
//
//   node apps/desktop/scripts/c13/c13-10f-wordcount.mjs
//
// (1) THE COUNTER: store/wordCount.ts exports wordCount and reads through withoutFontMarks; the seven surfaces that once kept
//     private copies (FirstRunGate, HomeFlow, ScriptEditor, Sliver, JournalEntry, PageEditor, QuickSprint) import it.
// (2) NO PRIVATE COPY: every word-splitting expression in apps/desktop/src (`.split(/\s+/)`, `.match(/\S+/g)`, `.split(' ')`) sits on
//     the list below, each with what it is and why it is not a word count of the page. A new one fails until it is listed or routed
//     through wordCount; a listed one that is gone fails too (the list cannot rot): a branch that deletes a listed file (step 11
//     HomeFlow, step 12a BeatWizard) removes its line here in the same commit.
// (3) LIVENESS: a private counter planted in a copy of PageEditor's text is caught; a list entry with no site is caught.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const SRC = path.join(ROOT, 'apps/desktop/src');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8').replace(/\r\n/g, '\n');
const SPLIT = /\.split\(\/\\s\+\/\)|\.match\(\/\\S\+\/g\)|\.split\(' '\)/;

// [file, a substring of the line, what it is]
const KNOWN = [
  ['store/wordCount.ts', 't.split(/\\s+/).length', 'THE counter (through withoutFontMarks)'],
  ['store/writingGoal.ts', 'removeMarkers(rest, readMarks(rest)).split(/\\s+/)', "countGoalWords: the goal's own definition (line tokens and lone marks are not words)"],
  ['components/tutor/assemble.ts', 'kept.trim().split(/\\s+/)', 'capSelection: the words of the slice actually SENT to the Tutor, not the page'],
  ['pages/BeatWizard.tsx', 'trimmed.split(/\\s+/).length', 'isLikelySentence: a sentence test on one line (BeatWizard goes in step 12a)'],
  ['store/markRuns.ts', "for (const c of m[1].split(' ')) {", "readSpanClose: a font mark's class list ({.lora .size-14}), not words"],
];
const SURFACES = ['components/FirstRunGate.tsx', 'components/HomeFlow.tsx', 'components/ScriptEditor.tsx', 'components/Sliver.tsx', 'pages/JournalEntry.tsx', 'pages/PageEditor.tsx', 'pages/QuickSprint.tsx'];

const walk = (dir) => fs.readdirSync(path.join(SRC, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.posix.join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.posix.join(dir, e.name)] : []));
const files = walk('.').map((f) => f.replace(/^\.\//, ''));
const sitesIn = (texts) => [...texts].flatMap(([f, t]) => t.split('\n').map((l, i) => ({ f, line: i + 1, text: l.trim() })).filter((s) => SPLIT.test(s.text) && !/^\s*(\/\/|\*)/.test(s.text)));
const audit = (sites, known) => ({
  unlisted: sites.filter((s) => !known.some(([f, sub]) => f === s.f && s.text.includes(sub))),
  stale: known.filter(([f, sub]) => !sites.some((s) => s.f === f && s.text.includes(sub))),
});

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const texts = new Map(files.map((f) => [f, read(f)]));
const wc = texts.get('store/wordCount.ts') ?? '';
ok('THE COUNTER: store/wordCount.ts exports wordCount and reads the text through withoutFontMarks', /export function wordCount\(text: string\): number/.test(wc) && /withoutFontMarks\(text \?\? ''\)/.test(wc));
const importers = SURFACES.filter((f) => texts.has(f) && /import \{[^}]*\bwordCount\b[^}]*\} from '(\.\.\/)+store\/wordCount'|import \{[^}]*\bwordCount\b[^}]*\} from '\.\.\/store\/wordCount'/.test(texts.get(f)));
ok(`THE COUNTER: the seven surfaces that kept private copies import it (${importers.length}/${SURFACES.filter((f) => texts.has(f)).length} present)`,
  importers.length === SURFACES.filter((f) => texts.has(f)).length && importers.length > 0, SURFACES.filter((f) => !importers.includes(f)).join(', '));
const sites = sitesIn(texts);
const { unlisted, stale } = audit(sites, KNOWN);
ok(`NO PRIVATE COPY: every word-splitting expression in src (${sites.length} across ${files.length} files) is on the list`, unlisted.length === 0, unlisted.map((s) => `${s.f}:${s.line} ${s.text.slice(0, 80)}`).join(' | '));
ok('NO PRIVATE COPY: every list entry still has its site (the list cannot rot)', stale.length === 0, stale.map(([f, sub]) => `${f}: ${sub}`).join(' | '));
ok('COVERAGE: the census read the source (files and sites found)', files.length > 100 && sites.length >= KNOWN.length, `${files.length} files, ${sites.length} sites`);
const planted = new Map(texts); planted.set('pages/PageEditor.tsx', texts.get('pages/PageEditor.tsx') + '\nconst words = draft.trim().split(/\\s+/).length;\n');
ok('LIVENESS: a private counter planted in PageEditor is caught as unlisted', audit(sitesIn(planted), KNOWN).unlisted.some((s) => s.f === 'pages/PageEditor.tsx'));
ok('LIVENESS: a list entry with no site is caught as stale', audit(sites, [...KNOWN, ['pages/PageEditor.tsx', 'never.split(/\\s+/)', 'planted']]).stale.length === 1);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nC13-10F WORDCOUNT: PASS (${checks.length} checks; 10f closed: one counter, ${KNOWN.length - 1} named non-counters)` : `\nC13-10F WORDCOUNT: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
