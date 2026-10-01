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
const FILES = ['draftFormat.ts', 'markRuns.ts', 'draftDecoration.ts', 'tabChord.ts', 'entryText.ts'];
const requireDesktop = createRequire(join(here, '..', 'package.json'));
const esbuild = createRequire(requireDesktop.resolve('vite'))('esbuild');
const tmp = join(tmpdir(), 'wrizo-format-proof');
mkdirSync(tmp, { recursive: true });

// A mutant is [name, file, transform]; the file it edits is copied (mutated) into a scratch dir beside unmutated copies of the
// others, so the bundle is the real modules with exactly one edit.
async function load(tag, mutant) {
  const dir = join(tmp, tag); mkdirSync(dir, { recursive: true });
  for (const f of FILES) {
    let source = readFileSync(join(SRC, 'store', f), 'utf8');
    if (mutant && mutant.file === f) {
      const t = mutant.fn(source);
      if (t === source) throw new Error(`mutation ${tag} did not land`);
      source = t;
    }
    writeFileSync(join(dir, f), source);
  }
  writeFileSync(join(dir, 'entry.ts'), "export * from './draftFormat'; export { readMarks } from './markRuns'; export { decorateMarkdownForCard } from './draftDecoration'; export { readLead, stripLine } from './markRuns'; export { createTabChord, CHORD_HOLD_MS } from './tabChord'; export { firstLine, firstPlainLine, plainLines, boardName, substantialLines } from './entryText';");
  const outfile = join(dir, 'out.mjs');
  await esbuild.build({ entryPoints: [join(dir, 'entry.ts')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'silent' });
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

  // ---- READER (step 3): the ONE reader the formatter and the decorator both use ----
  const { readMarks, decorateMarkdownForCard } = mod;
  const kinds = (line) => readMarks(line).map(r => `${r.kind}@${r.open}-${r.close}`);
  check('READER: stars with a space inside are TEXT - "2 * 3 * 4" has no run', kinds('2 * 3 * 4'), []);
  check('READER: a plain italic pair and a bold pair are runs, side by side', kinds('*a* **b**'), ['italic@0-2', 'bold@4-7']);
  check('READER: `***x***` is BOTH - bold outside, italic inside', kinds('***x***'), ['bold@0-5', 'italic@2-4']);
  check('READER: marks NEST - `__*x*__` is an underline holding an italic', kinds('__*x*__'), ['underline@0-5', 'italic@2-4']);
  check('READER: two runs that would CROSS cannot both stand - the later-opening one stays literal', kinds('**a *b** c*'), ['bold@0-6']);
  check('READER: an empty pair is a run (what Bold inserts at a bare caret)', kinds('****'), ['bold@0-2']);
  check('READER: single underscores and a lone `__` are text', [kinds('the file_name and snake_case'), kinds('an __unclosed run')], [[], []]);
  const visible = (html) => html.replace(/<span class="md-mark md-mark-hidden">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '');
  const chars = (html) => html.replace(/<[^>]+>/g, '');
  const D = (t) => decorateMarkdownForCard(t, null);
  check('DECORATOR: "2 * 3 * 4" shows its stars (no italic, nothing collapsed)', [visible(D('2 * 3 * 4')), D('2 * 3 * 4').includes('md-italic')], ['2 * 3 * 4', false]);
  check('DECORATOR: `__*x*__` paints underline AND italic and collapses all four markers', [visible(D('__*x*__')), D('__*x*__').includes('md-underline'), D('__*x*__').includes('md-italic')], ['x', true, true]);
  check('DECORATOR: `***x***` paints bold AND italic', [D('***x***').includes('md-bold'), D('***x***').includes('md-italic'), visible(D('***x***'))], [true, true, 'x']);
  const BATTERY = ['plain', '**b**', '*i*', '__u__', '~~s~~', '***bi***', '__*ui*__', '**__bu__**', '~~**bs**~~', '2 * 3 * 4', 'a**b**c', '**a *b** c*', '****', '__ __', '*a* and *b* and **c**', 'snake_case __x__ y_z', '**a** **b** **c**'];
  check('DECORATOR: every character is emitted exactly once - the stored text is the rendered text, markers included, over a battery of shapes', BATTERY.map(t => chars(D(t)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') === t), BATTERY.map(() => true));
  check('FORMAT: Italic on the 3 of "2 * 3 * 4" wraps ONLY the 3 - the literal stars are not paired with it - and a second press restores it', press('2 * 3 * 4', 4, 5, 'italic').trail.concat(press('2 * 3 * 4', 4, 5, 'italic', 'italic').text), ['2 * *3* * 4', '2 * 3 * 4']);
  check('FORMAT: a collapsed caret inside an empty bold pair `**|**` + Italic inserts its OWN pair inside (was: stripped one star from each side)', press('****', 2, 2, 'italic').text, '******');
  check('FORMAT: ...and Bold on that same caret removes the empty pair', press('****', 2, 2, 'bold').text, '');
  check('FORMAT: ...and Italic again on `***|***` removes only the italic pair', press('****', 2, 2, 'italic', 'italic').text, '****');

  // ---- ITEM 210: TITLES AND EXCERPTS ARE PLAIN TEXT (Nick: the title bar read "**TESTING** THE *DATABASE* SYNC") ----
  const { firstLine, plainLines, boardName, substantialLines } = mod;
  check('TITLES: Nick\'s own title - `**TESTING** THE *DATABASE* SYNC` - derives as plain words', firstLine('**TESTING** THE *DATABASE* SYNC'), 'TESTING THE DATABASE SYNC');
  check('TITLES: every kind of markup goes - heading mark, block token, bullet, quote, centring, tabs, strike, underline, nested', ['# Big Title', '>| >| Indented', '- a bullet', '> quoted', '>< centred', '\t\ttabbed', '~~struck~~ text', '__under__ *and* ***both***'].map(firstLine), ['Big Title', 'Indented', 'a bullet', 'quoted', 'centred', 'tabbed', 'struck text', 'under and both']);
  check('TITLES: a line that is only markup has nothing to read, so the NEXT line is the title (like a blank one)', [firstLine('****\n>| \nReal words'), firstLine('**  **\n\nSecond')], ['Real words', '**  **']);
  check('TITLES: and a page that is only markup is "Untitled" - never a stray asterisk', [firstLine('****'), firstLine('>| '), firstLine('   \n\n')], ['Untitled', 'Untitled', 'Untitled']);
  check('TITLES: what the page shows as text stays text - "2 * 3 * 4" and a lone underscore name are NOT mangled', [firstLine('2 * 3 * 4'), firstLine('the file_name'), firstLine('an __unclosed run')], ['2 * 3 * 4', 'the file_name', 'an __unclosed run']);
  check('TITLES: a board\'s name is the same derivation', [boardName('**Plot** board\nbody', 'Untitled'), boardName('****', 'Untitled'), boardName(undefined, 'A sketch')], ['Plot board', 'Untitled', 'A sketch']);
  check('EXCERPTS: the lines a card face and a survey read are plain, blank and markup-only lines skipped', plainLines('**Title**\n\n- first *point*\n****\n> a quote'), ['Title', 'first point', 'a quote']);
  check('EXCERPTS: the post-sprint echo line is plain text too', substantialLines('**short**\nthis is a **long enough** line to echo back to the writer', 24), ['this is a long enough line to echo back to the writer']);

  // ---- STRIP ----
  check('STRIP: "Copy My Words" removes stacked prefixes in ANY order (bullet inside an indent, quote inside a bullet)', stripMarkdownConventions('\t- one\n- > two\n>< **three**'), 'one\ntwo\nthree');
  // ---- BLOCK INDENT, FIRST-LINE LEVELS, THE LINE READER (step 3, Nick's Tab ruling) ----
  const { readLead, stripLine, createTabChord, CHORD_HOLD_MS } = mod;
  check('TABS: three Tab presses are three first-line levels, in the stored text', press('One', 1, 1, 'indent', 'indent', 'indent').text, '\t\t\tOne');
  check('TABS: Shift+Tab (outdent) takes one level back, floored at zero', [press('\t\tOne', 3, 3, 'outdent').text, press('One', 1, 1, 'outdent').text], ['\tOne', 'One']);
  check('BLOCK: one press puts one `>| ` on the CARET\'S LINE only - a line is a paragraph, so its neighbours are untouched (Nick 2026-09-25)', press('One\nTwo', 1, 1, 'block-indent').text, '>| One\nTwo');
  const P3 = 'first\nsecond\nthird';
  check('SCOPE: Tab (indent) on the middle of three single-newline paragraphs indents THAT LINE ONLY - it used to indent all three', [press(P3, 8, 8, 'indent').text, press(P3, 8, 8, 'indent', 'indent').text], ['first\n\tsecond\nthird', 'first\n\t\tsecond\nthird']);
  check('SCOPE: Shift+Tab (outdent) and the block levels have the same scope', [press('\ta\n\tb\n\tc', 4, 4, 'outdent').text, press(P3, 8, 8, 'block-indent', 'block-indent').text, press('>| a\n>| b\n>| c', 6, 6, 'block-outdent').text], ['\ta\nb\n\tc', 'first\n>| >| second\nthird', '>| a\nb\n>| c']);
  check('SCOPE: with a selection, one level per SELECTED line - and no line outside it', [press(P3, 6, 14, 'indent').text, press(P3, 6, 14, 'block-indent').text], ['first\n\tsecond\n\tthird', 'first\n>| second\n>| third']);
  check('BLOCK: a second press is a second level; an outdent removes ONE', [press('One', 1, 1, 'block-indent', 'block-indent').text, press('One', 1, 1, 'block-indent', 'block-indent', 'block-outdent').text], ['>| >| One', '>| One']);
  check('BLOCK: outdent is floored at zero and leaves an un-blocked paragraph alone', press('One', 1, 1, 'block-outdent').text, 'One');
  check('BLOCK: only the caret\'s paragraph changes (the blank line ends it)', press('A\n\nB', 0, 0, 'block-indent').text, '>| A\n\nB');
  check('BLOCK: a first-line tab goes INSIDE the block (after its tokens), and Outdent still finds it there', [press('>| One', 4, 4, 'indent').text, press('>| One', 4, 4, 'indent', 'outdent').text], ['>| \tOne', '>| One']);
  check('BLOCK: the caret keeps the character it was on', (() => { const r = press('One', 2, 2, 'block-indent'); return r.text.slice(r.start - 1, r.start); })(), 'n');
  const lead = (l) => readLead(l).tokens.map(t => `${t.kind}@${t.start}-${t.end}`);
  check('LEAD: tabs, the block token, a bullet and a heading are read in order, with positions', lead('\t>| - # x'), ['tab@0-1', 'block@1-4', 'bullet@4-6', 'heading@6-8']);
  check('LEAD: ordinary prose never parses as a block token - `>|x`, a mid-line `>| `, a lone `>|`, `|> `', ['>|x y', 'a >| b', '>|', '|> x', '>||', ' >| x'].map(l => lead(l)), [[], [], [], [], [], []]);
  check('STRIP: Copy My Words removes structure in any order, block tokens included', stripMarkdownConventions('>| >| \tone\n- > two\n>< **three**\n# ~~four~~'), 'one\ntwo\nthree\nfour');
  check('STRIP: "2 * 3 * 4" exports as it shows (the regex copy would have paired the stars); a real run is stripped', stripMarkdownConventions('2 * 3 * 4 and *real* and __u__'), '2 * 3 * 4 and real and u');
  check('STRIP: heading text is text - only the mark goes', stripMarkdownConventions('## A - not a bullet'), 'A - not a bullet');
  check('DECORATOR: `>| ` paints a block level with its marker collapsed, and two levels are two wrappers', [D('>| x').includes('md-block'), (D('>| >| x').match(/md-block/g) || []).length, visible(D('>| >| x'))], [true, 2, 'x']);
  check('DECORATOR: block, tab and marks together still emit every character once', chars(D('>| >| \tx **y**')).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&') === '>| >| \tx **y**', true);

  // ---- THE TAB KEY, as a state machine ----
  const K = (o) => ({ code: o.key === '1' ? 'Digit1' : `Key${(o.key || '').toUpperCase()}`, repeat: false, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, isComposing: false, ...o });
  const tab = (t, o = {}) => K({ key: 'Tab', code: 'Tab', timeStamp: t, ...o });
  const one = (t, o = {}) => K({ key: '1', code: 'Digit1', timeStamp: t, ...o });
  const flat = (steps) => steps.map(x => x.acts.join('+') || '-').join(' ');
  const play = (chord, evs) => evs.map(([kind, e]) => (kind === 'd' ? chord.keydown(e) : chord.keyup(e)));
  {
    const c = createTabChord();
    const st = play(c, [['d', tab(0)], ['u', { key: 'Tab' }], ['d', tab(500)], ['u', { key: 'Tab' }], ['d', tab(900)], ['u', { key: 'Tab' }]]);
    check('TABKEY: three taps are three `indent` acts - each applied on RELEASE, Tab itself never moves focus', [flat(st), st.every(x => x.preventDefault)], ['- indent - indent - indent', true]);
  }
  check('TABKEY: Shift+Tab is one `outdent` on release', flat(play(createTabChord(), [['d', tab(0, { shiftKey: true })], ['u', { key: 'Tab' }]])), '- outdent');
  check('TABKEY: a HELD Tab auto-repeating is ONE press, one level (repeats are swallowed)', flat(play(createTabChord(), [['d', tab(0)], ['d', tab(500, { repeat: true })], ['d', tab(530, { repeat: true })], ['d', tab(560, { repeat: true })], ['u', { key: 'Tab' }]])), '- - - - indent');
  check(`TABKEY: Tab held past ${CHORD_HOLD_MS} ms then 1 is a BLOCK indent, consumes the 1, and the release adds no Tab level`, (() => { const st = play(createTabChord(), [['d', tab(0)], ['d', one(400)], ['u', { key: 'Tab' }]]); return [flat(st), st[1].preventDefault]; })(), ['- block-indent -', true]);
  check('TABKEY: one level per press of the 1 while Tab stays held; the 1 auto-repeating adds none', flat(play(createTabChord(), [['d', tab(0)], ['d', one(400)], ['d', one(700)], ['d', one(730, { repeat: true })], ['u', { key: 'Tab' }]])), '- block-indent block-indent - -');
  check('TABKEY: auto-repeat does not restart the hold clock - a Tab held from 0, repeating at 190, then a 1 at 250 is a CHORD (250 ms held), not a rollover', flat(play(createTabChord(), [['d', tab(0)], ['d', tab(190, { repeat: true })], ['d', one(250)]])), '- - block-indent');
  check('TABKEY: Shift+Tab held + 1 is one block OUTDENT', flat(play(createTabChord(), [['d', tab(0, { shiftKey: true })], ['d', one(400, { shiftKey: true })], ['u', { key: 'Tab' }]])), '- block-outdent -');
  check('TABKEY: a fast rollover (Tab then 1 inside the window) applies the Tab FIRST and leaves the 1 to be TYPED', (() => { const st = play(createTabChord(), [['d', tab(0)], ['d', one(60)], ['u', { key: 'Tab' }]]); return [flat(st), st[1].preventDefault]; })(), ['- indent -', false]);
  check(`TABKEY: the threshold is exact - ${CHORD_HOLD_MS - 1} ms is rollover, ${CHORD_HOLD_MS} ms is a chord`, [flat(play(createTabChord(), [['d', tab(0)], ['d', one(CHORD_HOLD_MS - 1)]])), flat(play(createTabChord(), [['d', tab(0)], ['d', one(CHORD_HOLD_MS)]]))], ['- indent', '- block-indent']);
  check('TABKEY: any other key after a Tab proves it was a tap - the Tab lands first, the key types', (() => { const st = play(createTabChord(), [['d', tab(0)], ['d', K({ key: 'a', timeStamp: 50 })]]); return [flat(st), st[1].preventDefault]; })(), ['- indent', false]);
  check('TABKEY: where the chord may not act (Free Write on a written line) the held-Tab 1 is just TYPED, after the pending Tab', (() => { const st = play(createTabChord(() => false), [['d', tab(0)], ['d', one(400)], ['u', { key: 'Tab' }]]); return [flat(st), st[1].preventDefault]; })(), ['- indent -', false]);
  check('TABKEY: Ctrl/Meta/Alt+Tab and an IME composition are left entirely alone', [play(createTabChord(), [['d', tab(0, { ctrlKey: true })]])[0], play(createTabChord(), [['d', tab(0, { isComposing: true })]])[0]], [{ preventDefault: false, acts: [] }, { preventDefault: false, acts: [] }]);
  check('TABKEY: a modifier pressed while Tab is held does not count as "another key"', flat(play(createTabChord(), [['d', tab(0)], ['d', K({ key: 'Shift', code: 'ShiftLeft', timeStamp: 30 })], ['u', { key: 'Tab' }]])), '- - indent');

  return results;
}

const base = run(await load('base'));
const bad = base.filter(r => !r.pass);
for (const r of base) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `\n        got  ${JSON.stringify(r.got)}\n        want ${JSON.stringify(r.want)}`}`);
console.log(`\n${base.length - bad.length}/${base.length} checks passed`);
let ok = bad.length === 0;

if (process.argv.includes('--mutants')) {
  const M = [
    ['no toggle: wrap always', 'draftFormat.ts', (s) => s.replace("if (action === 'bold') return toggleInline(", "if (action === 'bold') return wrapSelection(").replace("if (action === 'italic') return toggleInline(", "if (action === 'italic') return wrapSelection(")],
    ['selection is one pair across lines', 'draftFormat.ts', (s) => s.replace("const segs = selectedSegments(text, start, end);", "const segs = [{ a: start, b: end, ls: text.lastIndexOf('\\n', Math.max(0, start - 1)) + 1 }];")],
    ['prefixes not skipped', 'draftFormat.ts', (s) => s.replace("let a = Math.max(start, ls, ls + leadLength(text.slice(ls, le)));", "let a = Math.max(start, ls);")],
    ['mixed selection removes instead of applying', 'draftFormat.ts', (s) => s.replace("const removing = plans.every(pl => pl.marked);", "const removing = plans.some(pl => pl.marked);")],
    ['a part of a run is not split', 'draftFormat.ts', (s) => s.replace("const inner = runs.find(r => r.open + ml <= A && B <= r.close) ?? null;", "const inner = runs.find(r => r.open + ml === A && B === r.close) ?? null;")],
    ['a new mark may cut across another mark\'s run', 'draftFormat.ts', (s) => s.replace('if (overlaps && !inside && !covers) {', 'if (false) {')],
    ['line tools act on the caret line only', 'draftFormat.ts', (s) => s.replace('if (le >= end || le >= text.length) break;', 'break;')],
    ['READER: no flanking rule (a star followed by a space opens)', 'markRuns.ts', (s) => s.replace('canOpen: !isSpace(line[pos + len])', 'canOpen: true').replace('canClose: pos > 0 && !isSpace(line[pos - 1])', 'canClose: pos > 0')],
    ['READER: a three-star run is not both bold and italic', 'markRuns.ts', (s) => s.replace("if (n >= 1 && n <= 3) push(ch, i, n);", "if (n >= 1 && n <= 2) push(ch, i, n);")],
    ['READER: crossing runs are all kept', 'markRuns.ts', (s) => s.replace('if (!crosses) accepted.push(r);', 'accepted.push(r);')],
    ['READER: an empty pair (four stars) is text', 'markRuns.ts', (s) => s.replace('else if (n === 4) { push(ch, i, 2); push(ch, i + 2, 2); }', '')],
    ['TABKEY: the hold threshold is not enforced (any 1 while Tab is down chords)', 'tabChord.ts', (s) => s.replace('e.timeStamp - at >= CHORD_HOLD_MS', 'true')],
    ['TABKEY: auto-repeat is not swallowed', 'tabChord.ts', (s) => s.replace('if (down) return { preventDefault: true, acts: [] };', '')],
    ['TABKEY: a rollover 1 does not apply the Tab first', 'tabChord.ts', (s) => s.replace("if (pending) { pending = false; return { preventDefault: false, acts: [tabAct()] }; }", '')],
    ['LEAD: the block token is not read', 'markRuns.ts', (s) => s.replace("  { kind: 'block', text: BLOCK_TOKEN },\n", '').replace("  { kind: 'block', text: BLOCK_TOKEN },\r\n", '')],
    ['STRIP: Copy My Words does not go through the shared reader', 'draftFormat.ts', (s) => s.replace("return text.split('\\n').map(stripLine).join('\\n');", "return text.split('\\n').map(l => l.replace(/\\*([^*]+)\\*/g, '$1')).join('\\n');")],
    ['BLOCK: outdent removes every level', 'draftFormat.ts', (s) => s.replace('return at === -1 ? tokens : [...tokens.slice(0, at), ...tokens.slice(at + 1)];', 'return tokens.filter(t => t !== BLOCK_TOKEN);')],
    ['TITLES: firstLine no longer goes through the reader', 'entryText.ts', (s) => s.replace('return firstPlainLine(text) || \'Untitled\';', "return (text.split('\\n').map(l => l.trim()).find(Boolean)) || 'Untitled';")],
    ['TITLES: markup-only lines are not skipped', 'entryText.ts', (s) => s.replace("return text.split('\\n').map(l => stripLine(l.trimStart()).trim()).filter(Boolean);", "return text.split('\\n').map(l => stripLine(l.trimStart()).trim());")],
    ['TITLES: the board name keeps its own copy', 'entryText.ts', (s) => s.replace("const first = firstPlainLine(text ?? '');", "const first = (text ?? '').split('\\n').map(l => l.trim()).find(Boolean);")],
    ['DECORATOR: marks are not nested (a run inside another is dropped)', 'draftDecoration.ts', (s) => s.replace(/kids\.push\(within\[i \+ 1\]\);\s*i\+\+;/, 'i++;')],
  ];
  for (const [name, file, fn] of M) {
    let landed = true; let res;
    try { res = run(await load(`m-${name.replace(/\W+/g, '-')}`, { file, fn })); } catch (e) { landed = !/did not land/.test(String(e)); res = null; if (landed) console.log(`MUTANT ${name}: build error ${e.message}`); }
    if (!landed) { console.log(`MUTANT ${name}: DID NOT LAND (instrument bug)`); ok = false; continue; }
    const red = res ? res.filter(r => !r.pass).length : -1;
    console.log(`MUTANT ${red > 0 ? 'KILLED' : 'SURVIVED'}  ${name}  (${red} red)`);
    if (red <= 0) ok = false;
  }
}
process.exit(ok ? 0 : 1);
