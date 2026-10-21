// TYPING-LATENCY - WHO READS THE EDITOR'S TEXT FROM THE DOM (Fable, Oct 16: "prove, by a source sweep plus a check, that NO save, sync,
// count, copy, export or Tutor path reads the editor's text via innerText/textContent of rendered rows - only from the model").
// Every `.innerText` / `.textContent` READ in apps/desktop/src is found (comments and assignments excluded) and must be one of the
// classified reads below, each with the surface it serves and why it is not a save/sync/count/copy/export/Tutor read. A read that is
// NOT classified fails the guard (a new path reading the page's DOM text cannot slip in unseen), and so does a classified read that is no
// longer there (the list cannot rot). The members are PRINTED, with their count, every run - a guard that reads zero files must say so.
// It also proves it can go red: a planted read in a copy of a save-path file must fail it (a liveness self-check).
// Browserless: node apps/desktop/scripts/typing-latency-readers-guard.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src');

// [file, a substring of the reading line, the surface, why it is not a save/sync/count/copy/export/Tutor read]
const CLASSIFIED = [
  ['store/lineRows.ts', "readEditorPlainText(el.innerText, null).plain;", 'page rows (editing)',
    'editorPlainText FALLBACK: runs only while the rows map is stale (an IME composition, between a native edit and its re-render); feeds the 211 controller and the strip\'s lit buttons, never a save'],
  ['store/lineRows.ts', 'row.textContent === mid[0]', 'page rows (editing)',
    'readNativeEdit: is the ONE row a typed letter landed in still the same row? (a structure test, not a text source)'],
  ['store/lineRows.ts', "plain = readEditorPlainText(el.textContent ?? '', null).plain;", 'page rows (editing: DOM -> model)',
    'readNativeEdit FALLBACK: the browser edited the DOM, and this is where the MODEL learns what it now says (textContent - independent of what is rendered); every save/count/copy/export/Tutor path then reads the model'],
  ['store/lineRows.ts', "const dom = readEditorPlainText(R.el.textContent ?? '', null).plain;", 'harness only',
    'verifyRows: the shadow-vs-DOM check, armed only by window.__wzVerifyRows (runtime-verify.mjs)'],
  ['store/lineRows.ts', 'row.textContent !== R.lines[i]', 'harness only', 'verifyRows, row by row'],
  ['store/hiddenMarksDom.ts', 'const raw = el.innerText;', 'page rows (editing) + the board card',
    'selectionEnds FALLBACK: caret offsets for the 211 rules while the rows map is stale, and on the card (no rows); an offset, not a saved text'],
  ['store/draftDecoration.ts', 'readEditorPlainText(el.innerText, getCaret(el));', 'the board card',
    'revealAtCaret: the card pop-up only - the page calls revealRowsAtCaret whenever rows are attached (ForwardOnlyEditor)'],
  ['components/ForwardOnlyEditor.tsx', 'readEditorPlainText(el.innerText, getPlainOffset(el));', 'a free-edit surface WITHOUT rows',
    'readNative FALLBACK: readNativeEdit returns null only when no rows are attached; the page always has rows'],
  ['components/BoardEditor.tsx', 'const plainNow = () => readEditorPlainText(el.innerText, null).plain;', 'the board card', 'the card pop-up\'s own editor (small; no rows)'],
  ['components/BoardEditor.tsx', 'let { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));', 'the board card',
    'the card pop-up\'s input, and (typed-literal) its composition end - the same read, now `let` so the commit can be escaped'],
  ['components/BoardEditor.tsx', 'const after = readEditorPlainText(el.innerText, getCaretOffset(el));', 'the board card', 'the card pop-up\'s em dash'],
  // connector-b (shipped @ 15dbd991) added this read and the guard was never told - red on main (found Oct 19, Fable Oct 21: fix on its own branch)
  ['components/BoardEditor.tsx', "entryId: eid, label: (el.textContent ?? '').trim()", 'the rail',
    'connector-b\'s thumbnail drag: a RAIL TILE\'s own text, read once at the press to label the drag ghost (the tile names a page or a board - not the editor, not a row); never saved, counted, copied, exported or sent'],
  // ---- SUPERSEDED by typed-literal (Oct 16): the composition end's read became `let { plain, caret } = ...` (its committed text is escaped),
  // so it is the entry above; this one, kept verbatim, would now match nothing and fail the rot check.
  // ['components/BoardEditor.tsx', 'const { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));', 'the board card', 'the card pop-up\'s composition end'],
  ['components/ScriptEditor.tsx', 'textNode.textContent?.length', 'the screenplay', 'a script element\'s caret clamp (no rows)'],
  ['components/ScriptEditor.tsx', "onInput={() => onInput(nodeRef.current?.textContent ?? '')}", 'the screenplay', 'a script element\'s own input (no rows)'],
  ['components/ScriptEditor.tsx', 'const text = node?.textContent ?? activeEl?.text', 'the screenplay', 'a script element (no rows)'],
  ['components/ScriptEditor.tsx', 'const domText = activeElRef.current?.textContent;', 'the screenplay', 'a script element (no rows)'],
  ['pages/JournalEntry.tsx', 'pageTextRef.current = el.innerText;', 'the Journal sheet', 'the Journal\'s plaintext sheet (no rows, a different surface)'],
  ['pages/JournalEntry.tsx', 'setWords(wordCount(el.innerText));', 'the Journal sheet', 'the Journal\'s plaintext sheet (no rows)'],
  ['pages/JournalEntry.tsx', "lastActionRef.current = { type: 'text', before: el.innerText };", 'the Journal sheet', 'the Journal\'s plaintext sheet (no rows)'],
  ['pages/JournalEntry.tsx', 'setGoalText(el.innerText);', 'the Journal sheet', 'the Journal\'s plaintext sheet (no rows)'],
];

const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f)) files.push(p); } };
walk(SRC);

// a READ: `.innerText` / `.textContent` not followed by an assignment, on a line that is not a comment
const READ = /\.(innerText|textContent)\b(?!\s*=[^=])/;
const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);
function readsIn(text) {
  const out = [];
  text.replace(/\r\n/g, '\n').split('\n').forEach((line, i) => { if (!isComment(line) && READ.test(line)) out.push({ line: i + 1, text: line.trim() }); });
  return out;
}

const found = [];
for (const f of files) for (const r of readsIn(readFileSync(f, 'utf8'))) found.push({ file: relative(SRC, f).replace(/\\/g, '/'), ...r });
const classify = (r) => CLASSIFIED.find(([file, sub]) => file === r.file && r.text.includes(sub));
const unclassified = found.filter((r) => !classify(r));
const stale = CLASSIFIED.filter(([file, sub]) => !found.some((r) => r.file === file && r.text.includes(sub)));

console.log(`files scanned: ${files.length}; reads found: ${found.length}; classified entries: ${CLASSIFIED.length}`);
for (const r of found) { const c = classify(r); console.log(`  ${c ? 'OK ' : '!! '} ${r.file}:${r.line}  [${c ? c[2] : 'UNCLASSIFIED'}]  ${r.text.slice(0, 110)}`); }

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
ok('COVERAGE: the sweep read the source (a guard that read nothing would pass blind)', files.length > 50 && found.length > 0, `files ${files.length}, reads ${found.length}`);
ok('EVERY read of innerText/textContent in apps/desktop/src is classified - none is a save, sync, count, copy, export or Tutor path', unclassified.length === 0, JSON.stringify(unclassified));
ok('EVERY classified read still exists (the list cannot rot into a blanket pass)', stale.length === 0, JSON.stringify(stale.map(([f, s]) => `${f}: ${s}`)));
// the paths themselves: the save, copy, count, export, sync and Tutor modules read NO DOM text at all
const PATHS = ['pages/PageEditor.tsx', 'store/clipboard.ts', 'store/pageExport.ts', 'store/persistence.ts', 'store/api.ts', 'components/Tutor.tsx', 'store/tutorConsistency.ts', 'store/writingGoal.ts'];
const pathReads = found.filter((r) => PATHS.includes(r.file));
ok('THE PATHS: the page\'s save and counts (PageEditor), copy (clipboard), export (pageExport), sync (persistence, api) and the Tutor (Tutor, tutorConsistency) read no innerText/textContent at all - only the model', pathReads.length === 0, JSON.stringify(pathReads));
// liveness: a read planted in a copy of a save-path file must be caught
const planted = readsIn("const words = editorEl.innerText.split(' ');\n").map((r) => ({ file: 'pages/PageEditor.tsx', ...r }));
ok('LIVENESS: a planted innerText read in the save path is caught as unclassified (the guard can go red)', planted.length === 1 && !classify(planted[0]), JSON.stringify(planted));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTYPING-LATENCY READERS VERIFY: PASS (${checks.length} checks, ${found.length} reads classified)` : `\nTYPING-LATENCY READERS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
