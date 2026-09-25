// WRITING-SURFACE S0 STEP 2 - the formatter's own proof (browserless; the real store/draftFormat.ts, esbuild-bundled).
// Run: node apps/desktop/scripts/writing-format-proof.mjs [--mutants]
//
// What it pins (each row is a thing a writer does, with the stored text it must produce):
//   TOGGLE   Bold/Italic/Underline/Strike pressed twice return the text to exactly what it was (frames B2/I2/U2: it was
//            `****x****`, and Italic-on-italic made a BOLD).
//   ACROSS   a selection spanning lines is marked line by line, prefixes left alone (frames BML/IML: select-all then Bold stored
//            one pair across the newline, which never rendered).
//   LINES    Bullet/Quote/Centre/Right act on every line the selection touches, and remove from all when all have it.
//   STRIP    "Copy My Words" strips stacked prefixes in any order.
// --mutants removes each rule alone and demands the proof turn red (the mutation is asserted to have LANDED first).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'src');
const FILE = join(SRC, 'store', 'draftFormat.ts');
const requireDesktop = createRequire(join(here, '..', 'package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const tmp = join(tmpdir(), 'wrizo-format-proof');
mkdirSync(tmp, { recursive: true });

async function load(tag, transform) {
  let source = readFileSync(FILE, 'utf8');
  if (transform) {
    const t = transform(source);
    if (t === source) throw new Error(`mutation ${tag} did not land`);
    source = t;
  }
  const dir = join(tmp, tag); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'draftFormat.ts'), source);
  const outfile = join(dir, 'out.mjs');
  await esbuild.build({ entryPoints: [join(dir, 'draftFormat.ts')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'silent' });
  return import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
}

function run(mod) {
  const { applyFormat, stripMarkdownConventions } = mod;
  const results = [];
  const check = (name, got, want) => results.push({ name, pass: JSON.stringify(got) === JSON.stringify(want), got, want });
  // press(text, [start,end], action...) -> the stored text and the selection after each press
  const press = (text, s, e, ...acts) => {
    let r = { text, start: s, end: e };
    const trail = [];
    for (const a of acts) { r = applyFormat(r.text, r.start, r.end, a); trail.push(r.text); }
    return { text: r.text, trail, start: r.start, end: r.end };
  };
  const W = 'Plain card words';

  // ---- TOGGLE ----
  for (const [a, m] of [['bold', '**'], ['italic', '*'], ['underline', '__'], ['strike', '~~']]) {
    const r = press(W, 0, 5, a, a);
    check(`TOGGLE ${a}: press once wraps, press again returns the text to exactly what it was`, [r.trail[0], r.text], [`${m}Plain${m} card words`, W]);
    check(`TOGGLE ${a}: the selection is the CONTENT after each press (so the second press reads the run as its own)`, [r.start, r.end], [0, 5]);
  }
  check('TOGGLE: Italic on an italic word does NOT make it bold', press(W, 0, 5, 'italic', 'italic').trail[1], W);
  check('TOGGLE: bold then italic stores bold-italic; Italic again drops ONLY the italic (`**` stays)', press(W, 0, 5, 'bold', 'italic', 'italic').trail, ['**Plain** card words', '***Plain*** card words', '**Plain** card words']);
  check('TOGGLE: bold then italic then Bold drops only the bold (`*` stays)', press(W, 0, 5, 'bold', 'italic', 'bold').text, '*Plain* card words');
  check('TOGGLE: a bold-italic run `***Plain***` is read as BOTH - Italic on it leaves bold, Bold on it leaves italic, from the word or the whole run', [press('***Plain***', 3, 8, 'italic').text, press('***Plain***', 3, 8, 'bold').text, press('***Plain***', 0, 11, 'italic').text], ['**Plain**', '*Plain*', '**Plain**']);
  check('TOGGLE: a mixed multi-line selection (one bold line, one plain) becomes bold on BOTH, then clears', [press('**a**\nb', 0, 7, 'bold').text, press('**a**\nb', 0, 7, 'bold', 'bold').text], ['**a**\n**b**', 'a\nb']);
  check('TOGGLE: a part of a run splits it - `b` of `**abc**` -> `**a**b**c**`', press('**abc**', 3, 4, 'bold').text, '**a**b**c**');
  check('TOGGLE: a part touching the run\'s edge drops the marker instead of leaving an empty pair', [press('**abc**', 2, 3, 'bold').text, press('**abc**', 4, 5, 'bold').text], ['a**bc**', '**ab**c']);
  check('TOGGLE: a collapsed caret inside a run removes the run\'s markers', press('**abc**', 4, 4, 'bold').text, 'abc');
  check('TOGGLE: a collapsed caret in plain text inserts an empty pair, and the same press removes it again', press(W, 3, 3, 'bold', 'bold').trail, ['Pla****in card words', W]);
  check('TOGGLE: selecting the markers too (the whole run) and pressing Bold removes the run', press('a **bold** b', 2, 10, 'bold').text, 'a bold b');
  check('TOGGLE: a mixed selection (one bold word, one plain) becomes UNIFORMLY bold, with no run nested in itself', press('**a** b', 0, 7, 'bold').text, '**a b**');
  check('TOGGLE: ...and a second press clears it', press('**a** b', 0, 7, 'bold', 'bold').text, 'a b');
  check('TOGGLE: trailing whitespace is not swept inside the mark', press('word  ', 0, 6, 'bold').text, '**word**  ');

  // ---- ACROSS ----
  const TWO = 'First para.\nSecond para.';
  check('ACROSS: select-all then Bold marks EACH line, never one pair across the newline', press(TWO, 0, TWO.length, 'bold').text, '**First para.**\n**Second para.**');
  check('ACROSS: select-all then Bold twice is the identity', press(TWO, 0, TWO.length, 'bold', 'bold').text, TWO);
  check('ACROSS: Italic across lines the same', press(TWO, 0, TWO.length, 'italic').text, '*First para.*\n*Second para.*');
  check('ACROSS: the selection after covers both lines\' content (start of line 1, end of line 2)', [press(TWO, 0, TWO.length, 'bold').start, press(TWO, 0, TWO.length, 'bold').end], [2, 2 + 'First para.'.length + 5 + 'Second para.'.length]);
  check('ACROSS: italic then underline on two lines stacks the second mark OUTSIDE (the selection reaches line 1\'s closing star and line 2\'s opening star, never their partners)', press(TWO, 0, TWO.length, 'italic', 'underline').text, '__*First para.*__\n__*Second para.*__');
  check('ACROSS: ...and pressing Underline again peels only the underline', press(TWO, 0, TWO.length, 'italic', 'underline', 'underline').text, '*First para.*\n*Second para.*');
  const LIST = '- item one\n- item two\n\nplain line';
  check('ACROSS: a list is marked AFTER its "- ", so it stays a list; blank lines get nothing', press(LIST, 0, LIST.length, 'bold').text, '- **item one**\n- **item two**\n\n**plain line**');
  check('ACROSS: ...and pressing again restores it', press(LIST, 0, LIST.length, 'bold', 'bold').text, LIST);
  check('ACROSS: a quote/heading/indent prefix is left in front of the mark', press('> quoted\n# Head\n\tindented', 0, 27, 'bold').text, '> **quoted**\n# **Head**\n\t**indented**');
  check('ACROSS: a selection that starts and ends mid-line marks only the selected parts', press('one two\nthree four', 4, 13, 'bold').text, 'one **two**\n**three** four');

  // ---- LINES ----
  const THREE = 'alpha\nbeta\ngamma';
  check('LINES: Bullet with a multi-line selection bullets EVERY line', press(THREE, 0, THREE.length, 'bullet').text, '- alpha\n- beta\n- gamma');
  check('LINES: Bullet again removes it from all of them', press(THREE, 0, THREE.length, 'bullet', 'bullet').text, THREE);
  check('LINES: Bullet on a partly-bulleted selection completes the list', press('- alpha\nbeta', 0, 12, 'bullet').text, '- alpha\n- beta');
  check('LINES: Quote across lines, and back', [press(THREE, 0, THREE.length, 'quote').text, press(THREE, 0, THREE.length, 'quote', 'quote').text], ['> alpha\n> beta\n> gamma', THREE]);
  check('LINES: Centre across lines; Right then REPLACES it (a line cannot be both)', [press(THREE, 0, THREE.length, 'align-center').text, press(THREE, 0, THREE.length, 'align-center', 'align-right').text], ['>< alpha\n>< beta\n>< gamma', '>> alpha\n>> beta\n>> gamma']);
  check('LINES: Left clears alignment on every selected line', press('>< a\n>> b', 0, 9, 'align-left').text, 'a\nb');
  check('LINES: Bullet on a centred line stacks outside the alignment (the last applied is outermost), and toggling it off finds it again', press('>< title', 3, 3, 'bullet', 'bullet').trail, ['- >< title', '>< title']);
  check('LINES: Bullet on an indented line goes AFTER the tabs (so Outdent still finds them)', press('\tnote', 2, 2, 'bullet').text, '\t- note');
  check('LINES: blank lines in a selection are left blank', press('a\n\nb', 0, 4, 'bullet').text, '- a\n\n- b');
  check('LINES: a single caret still acts on its own line only (unchanged)', press(THREE, 8, 8, 'bullet').text, 'alpha\n- beta\ngamma');

  // ---- STRIP ----
  check('STRIP: "Copy My Words" removes stacked prefixes in ANY order (bullet inside an indent, quote inside a bullet)', stripMarkdownConventions('\t- one\n- > two\n>< **three**'), 'one\ntwo\nthree');
  return results;
}

const base = run(await load('base'));
const bad = base.filter(r => !r.pass);
for (const r of base) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `\n        got  ${JSON.stringify(r.got)}\n        want ${JSON.stringify(r.want)}`}`);
console.log(`\n${base.length - bad.length}/${base.length} checks passed`);
let ok = bad.length === 0;

if (process.argv.includes('--mutants')) {
  const M = [
    ['no toggle: wrap always', (s) => s.replace("if (action === 'bold') return toggleInline(", "if (action === 'bold') return wrapSelection(").replace("if (action === 'italic') return toggleInline(", "if (action === 'italic') return wrapSelection(")],
    ['selection is one pair across lines', (s) => s.replace("const segs = selectedSegments(text, start, end);", "const segs = [{ a: start, b: end, ls: text.lastIndexOf('\\n', Math.max(0, start - 1)) + 1 }];")],
    ['prefixes not skipped', (s) => s.replace("let a = Math.max(start, ls, ls + leadLength(text.slice(ls, le)));", "let a = Math.max(start, ls);")],
    ['star runs read as plain pairs (bold-italic unreadable)', (s) => s.replace("if (mark !== '*' && mark !== '**') {", "if (true) {")],
    ['mixed selection removes instead of applying', (s) => s.replace("const removing = plans.every(pl => pl.marked);", "const removing = plans.some(pl => pl.marked);")],
    ['a part of a run is not split', (s) => s.replace("const inner = runs.find(r => r.open + ml <= A && B <= r.close) ?? null;", "const inner = runs.find(r => r.open + ml === A && B === r.close) ?? null;")],
    ['a new mark may cut across another mark\'s run', (s) => s.replace('if (overlaps && !inside && !covers) {', 'if (false) {')],
    ['line tools act on the caret line only', (s) => s.replace('if (le >= end || le >= text.length) break;', 'break;')],
  ];
  for (const [name, fn] of M) {
    let landed = true; let res;
    try { res = run(await load(`m-${name.replace(/\W+/g, '-')}`, fn)); } catch (e) { landed = !/did not land/.test(String(e)); res = null; if (landed) console.log(`MUTANT ${name}: build error ${e.message}`); }
    if (!landed) { console.log(`MUTANT ${name}: DID NOT LAND (instrument bug)`); ok = false; continue; }
    const red = res ? res.filter(r => !r.pass).length : -1;
    console.log(`MUTANT ${red > 0 ? 'KILLED' : 'SURVIVED'}  ${name}  (${red} red)`);
    if (red <= 0) ok = false;
  }
}
process.exit(ok ? 0 : 1);
