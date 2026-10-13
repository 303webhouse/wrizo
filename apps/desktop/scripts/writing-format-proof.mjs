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
const FILES = ['draftFormat.ts', 'markRuns.ts', 'draftDecoration.ts', 'tabChord.ts', 'entryText.ts', 'hiddenMarks.ts'];
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
  writeFileSync(join(dir, 'entry.ts'), "export * from './draftFormat'; export { readMarks } from './markRuns'; export { decorateMarkdownForCard } from './draftDecoration'; export { readLead, stripLine } from './markRuns'; export { createTabChord, CHORD_HOLD_MS } from './tabChord'; export { firstLine, firstPlainLine, plainLines, boardName, substantialLines } from './entryText'; export { snapCaret, snapCaretAfterClick, wordBackspaceAt, wordDeleteAt } from './hiddenMarks';");
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
  check('BULLET: hollow replaces the round mark instead of stacking, and a second press clears it', [press('Milk', 1, 1, 'bullet', 'bullet-circle').text, press('Milk', 1, 1, 'bullet-circle', 'bullet-circle').text], ['-+ Milk', 'Milk']);
  check('BULLET: square replaces hollow', press('-+ Milk', 4, 4, 'bullet-square').text, '-= Milk');
  check('BULLET: round replaces square', press('-= Milk', 4, 4, 'bullet').text, '- Milk');
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
  // ---- PARKED - SUPERSEDED by PR #7 (19a4676: lists gain hollow `-+ ` and square `-= ` bullets), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The row grows the two new bullet tokens; every original case is still in it.
  //
  // check('TITLES: every kind of markup goes - heading mark, block token, bullet, quote, centring, tabs, strike, underline, nested', ['# Big Title', '>| >| Indented', '- a bullet', '> quoted', '>< centred', '\t\ttabbed', '~~struck~~ text', '__under__ *and* ***both***'].map(firstLine), ['Big Title', 'Indented', 'a bullet', 'quoted', 'centred', 'tabbed', 'struck text', 'under and both']);
  // ----------------------------------------------------------------------
  check('TITLES: every kind of markup goes - heading mark, block token, bullet, quote, centring, tabs, strike, underline, nested', ['# Big Title', '>| >| Indented', '- a bullet', '-+ a hollow', '-= a square', '> quoted', '>< centred', '\t\ttabbed', '~~struck~~ text', '__under__ *and* ***both***'].map(firstLine), ['Big Title', 'Indented', 'a bullet', 'a hollow', 'a square', 'quoted', 'centred', 'tabbed', 'struck text', 'under and both']);
  check('TITLES: a line that is only markup has nothing to read, so the NEXT line is the title (like a blank one)', [firstLine('****\n>| \nReal words'), firstLine('**  **\n\nSecond')], ['Real words', '**  **']);
  check('TITLES: and a page that is only markup is "Untitled" - never a stray asterisk', [firstLine('****'), firstLine('>| '), firstLine('   \n\n')], ['Untitled', 'Untitled', 'Untitled']);
  check('TITLES: what the page shows as text stays text - "2 * 3 * 4" and a lone underscore name are NOT mangled', [firstLine('2 * 3 * 4'), firstLine('the file_name'), firstLine('an __unclosed run')], ['2 * 3 * 4', 'the file_name', 'an __unclosed run']);
  check('TITLES: a board\'s name is the same derivation', [boardName('**Plot** board\nbody', 'Untitled'), boardName('****', 'Untitled'), boardName(undefined, 'A sketch')], ['Plot board', 'Untitled', 'A sketch']);
  check('EXCERPTS: the lines a card face and a survey read are plain, blank and markup-only lines skipped', plainLines('**Title**\n\n- first *point*\n****\n> a quote'), ['Title', 'first point', 'a quote']);
  check('EXCERPTS: the post-sprint echo line is plain text too', substantialLines('**short**\nthis is a **long enough** line to echo back to the writer', 24), ['this is a long enough line to echo back to the writer']);

  // ---- PARKED - SUPERSEDED by item 211 / PR #7 (e79390c: hidden marks never show, at an edge or mid-word), 2026-10-02 ----
  // Kept VERBATIM and no longer run. The section's heading named the interim rule.
  //
  // // ---- THE INTERIM REVEAL RULE: a run's markers show only while the caret TOUCHES a marker ----
  // ----------------------------------------------------------------------
  // ---- ITEM 211: MARKERS NEVER SHOW (Nick's "A", 2026-09-25) ----
  {
    const T = 'Start **BOLD** end';                      // markers at [6,8] and [12,14]; the word is 8..12
    const shown = (c) => /<span class="md-mark">\*\*<\/span>/.test(decorateMarkdownForCard(T, c));
    // ---- PARKED - SUPERSEDED by item 211 / PR #7 (e79390c: hidden marks never show, at an edge or mid-word), 2026-10-02 ----
    // Kept VERBATIM and no longer run. The interim rule showed the marks at 6,7,8 and 12,13,14; now they show at no caret position.
    //
    // const all = []; for (let c = 0; c <= T.length; c += 1) all.push(shown(c) ? c : null);
    // check('REVEAL: over every caret position, the bold markers show EXACTLY when the caret is inside or at an edge of a marker span - 6,7,8 and 12,13,14 - and nowhere inside the word (9,10,11)', all.filter(x => x !== null), [6, 7, 8, 12, 13, 14]);
    // ----------------------------------------------------------------------
    const all = []; for (let c = 0; c <= T.length; c += 1) all.push(shown(c));
    check('REVEAL: over every caret position, including the marker edges, the bold marks stay hidden', all.every(x => x === false), true);
    check('REVEAL: no caret (a resting card, a selection, Free Write) shows nothing', shown(null), false);
    const N = '**TESTING** THE *DATABASE* SYNC';             // Nick's screenshot
    const vis = (c) => visible(decorateMarkdownForCard(N, c));
    check('REVEAL: Nick\'s case - a caret in the middle of "TESTING" shows NO asterisks anywhere on the line', vis(5), 'TESTING THE DATABASE SYNC');
    // ---- PARKED - SUPERSEDED by item 211 / PR #7 (e79390c: hidden marks never show, at an edge or mid-word), 2026-10-02 ----
    // Kept VERBATIM and no longer run. At the word's end the interim rule showed that word's marks; now nothing shows.
    //
    // check('REVEAL: a caret at the END of "TESTING" (the edge a Backspace... or a Delete acts at) shows that word\'s markers and only that word\'s', vis(9), '**TESTING** THE DATABASE SYNC');
    // ----------------------------------------------------------------------
    check('REVEAL: a caret at the END of "TESTING", where a click off the word lands, still shows no asterisks', vis(9), 'TESTING THE DATABASE SYNC');
    // ---- PARKED - SUPERSEDED by item 211 / PR #7 (e79390c: hidden marks never show, at an edge or mid-word), 2026-10-02 ----
    // Kept VERBATIM and no longer run. Nested runs no longer reveal at all; the word reads plain at both carets.
    //
    // check('REVEAL: nested marks reveal per run - in `__*x*__` a caret at 2 touches BOTH opening markers; at 3 (after x) only the italic\'s', [visible(decorateMarkdownForCard('__*x*__', 2)), visible(decorateMarkdownForCard('__*x*__', 3))], ['__*x*__', '*x*']);
    // ----------------------------------------------------------------------
    check('REVEAL: nested marks stay hidden - `__*x*__` shows the word at the caret that used to reveal both marks, and at the caret just after it', [visible(decorateMarkdownForCard('__*x*__', 2)), visible(decorateMarkdownForCard('__*x*__', 3))], ['x', 'x']);
    // ---- PARKED - SUPERSEDED by item 211 / PR #7 (e79390c: hidden marks never show, at an edge or mid-word), 2026-10-02 ----
    // Kept VERBATIM and no longer run. An empty pair no longer shows itself; Backspace and Delete now remove it whole (item211.mjs ONE).
    //
    // check('REVEAL: an empty pair `****` with the caret between shows itself (the writer sees what a press inserted)', visible(decorateMarkdownForCard('****', 2)), '****');
    // ----------------------------------------------------------------------
    check('REVEAL: an empty pair `****` stays hidden, including with the caret between the marks', visible(decorateMarkdownForCard('****', 2)), '');
    check('BULLET: the token stays hidden even when the caret touches it', ['- Milk', '-+ Milk', '-= Milk'].every((t) => visible(decorateMarkdownForCard(t, t.indexOf('M'))) === 'Milk'), true);
    check('BULLET: hollow and square marks stay hidden and wear their own glyph class', ['-+ Milk', '-= Milk'].every((t, i) => {
      const html = decorateMarkdownForCard(t, null);
      const cls = i === 0 ? 'md-bullet-circle' : 'md-bullet-square';
      return html.includes(cls) && visible(html) === 'Milk' && chars(html) === t;
    }), true);
    check('HEADING: `# Chapter` and `## Chapter` hide the hash at every caret and keep the heading size', ['# Chapter', '## Chapter'].every((t) => {
      const word = t.replace(/^#{1,2} /, '');
      const cls = t.startsWith('## ') ? 'md-h2' : 'md-h1';
      for (let c = 0; c <= t.length; c += 1) {
        const html = decorateMarkdownForCard(t, c);
        if (/<span class="md-mark">#/.test(html)) return false;
        if (!html.includes(cls)) return false;
        if (visible(html) !== word) return false;
        if (chars(html) !== t) return false;
      }
      return true;
    }), true);
    const B = ['a **b** c', '***bi*** x', '__*u*__', '~~s~~ and *i*', '2 * 3 * 4', '>| - **x**'];
    check('REVEAL: every character is still emitted exactly once at EVERY caret position (the 1:1 count the caret restore depends on)', B.every(t => { for (let c = 0; c <= t.length; c += 1) { if (chars(decorateMarkdownForCard(t, c)).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&') !== t) return false; } return true; }), true);

    // ---- PARKED - SUPERSEDED by the 211 card port (2026-10-06): the popup now runs the page's editing rules -----------------
    // (store/hiddenMarksEditing.ts), so the interim `revealAtMarker` option it alone passed is RETIRED - the option, the code path and
    // its five checks. Quoted VERBATIM and no longer run. Successor: the card is decorated exactly as the page is - no mark shows at
    // any caret - which the REVEAL checks above already assert for the one painter both surfaces now share; the line below makes the
    // claim for the card's own shapes (a bullet token, a heading hash, Nick's line).
    //
    // // ---- THE CARD POPUP keeps the interim rule (Fable's PR #7 review, 2026-10-03) until it has the page's editing rules ----
    // const CARD = { revealAtMarker: true };
    // const cardShown = (c) => /<span class="md-mark">\*\*<\/span>/.test(decorateMarkdownForCard(T, c, CARD));
    // const cardAll = []; for (let c = 0; c <= T.length; c += 1) if (cardShown(c)) cardAll.push(c);
    // check('CARD: with revealAtMarker the bold marks show EXACTLY while the caret touches a marker - 6,7,8 and 12,13,14 - and nowhere inside the word', cardAll, [6, 7, 8, 12, 13, 14]);
    // check('CARD: Nick\'s case on the card - mid-word shows nothing, the word\'s end shows that word\'s marks only', [visible(decorateMarkdownForCard(N, 5, CARD)), visible(decorateMarkdownForCard(N, 9, CARD))], ['TESTING THE DATABASE SYNC', '**TESTING** THE DATABASE SYNC']);
    // check('CARD: a bullet token and a heading hash show while the caret touches them, and hide away from them', [visible(decorateMarkdownForCard('-= Milk', 3, CARD)), visible(decorateMarkdownForCard('-= Milk', 5, CARD)), visible(decorateMarkdownForCard('## Chapter', 3, CARD)), visible(decorateMarkdownForCard('## Chapter', 6, CARD))], ['-= Milk', 'Milk', '## Chapter', 'Chapter']);
    // check('CARD: the 1:1 character count holds at every caret position with revealAtMarker too', B.concat(['# Head **x**', '-+ list *i*']).every(t => { for (let c = 0; c <= t.length; c += 1) { if (chars(decorateMarkdownForCard(t, c, CARD)).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&') !== t) return false; } return true; }), true);
    // check('CARD: without the option (the page) nothing changed - the same carets show no marks', [cardShown(7) && !shown(7), visible(decorateMarkdownForCard('-= Milk', 3)), visible(decorateMarkdownForCard('## Chapter', 3))], [true, 'Milk', 'Chapter']);
    // ---------------------------------------------------------------------
    check('CARD [port successor]: the card is painted as the page is - no mark, bullet token or heading hash shows at ANY caret', ['-= Milk', '## Chapter', N, 'Start **BOLD** end'].every((t) => { for (let c = 0; c <= t.length; c += 1) { if (/<span class="md-mark">(?!\t)/.test(decorateMarkdownForCard(t, c))) return false; } return true; }), true);
  }

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
  check('LEAD: hollow and square bullets are their own tokens, not the round hyphen', [lead('-+ one'), lead('-= two'), lead('- three')], [['bullet-circle@0-3'], ['bullet-square@0-3'], ['bullet@0-2']]);
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


  // ---- NICK'S LIVE BUG (2026-10-06): a click past a styled word must not land inside it, and nothing lights unless it should ----
  {
    const { marksAt, snapCaret, snapCaretAfterClick } = mod;
    const L1 = '**BOLD** *TEST* ~~FINAL~~ (hopefully)';          // his line
    const L2 = 'plain words then **BOLD**';                       // a line that ENDS in a styled word
    const none = { bold: false, italic: false, underline: false, strike: false };
    check('CLICK: a click past the end of a line that ends in a bold word lands AFTER its closing marks (the line\'s end), not inside the word', snapCaretAfterClick(L2, L2.length), L2.length);
    check('CLICK: ...and the strip lights NOTHING there', marksAt(L2, L2.length), none);
    check('CLICK: a click just after "BOLD" mid-line (raw 8, after the hidden `**`) stays after the marks - the strip lights nothing', [snapCaretAfterClick(L1, 8), marksAt(L1, snapCaretAfterClick(L1, 8))], [8, none]);
    check('CLICK: a click that lands BETWEEN the two hidden closing stars goes to the group\'s end, never splitting it', snapCaretAfterClick(L1, 7), 8);
    check('CLICK: nested closers are one group - in `__*x*__ y` a click at 4, 5 or 6 (after x: inside or between the closers) lands at 7, after both', [4, 5, 6].map((p) => snapCaretAfterClick('__*x*__ y', p)), [7, 7, 7]);
    check('CLICK: an empty pair a press made keeps its interior stop (typing goes into it)', snapCaretAfterClick('a**** b', 3), 3);
    check('KEYBOARD unchanged: the arrow/typing snap still pulls a caret after the hidden closers back to the last visible letter (the left-character rule)', snapCaret(L2, L2.length), L2.length - 2);
    check('MARKS: a mark lights exactly when the character to the caret\'s LEFT carries it - inside BOLD and after its last letter, not before its first', [marksAt(L1, 4).bold, marksAt(L1, 6).bold, marksAt(L1, 2).bold, marksAt(L1, 0).bold], [true, true, false, false]);
    check('MARKS: italic and strike the same; a caret in plain text lights nothing', [marksAt(L1, 12).italic, marksAt(L1, 20).strike, marksAt(L1, 30)], [true, true, none]);
    check('MARKS: one reader, per line - a lone `*` or `**` on ANOTHER line can no longer pair with this one (the old indexOf reader paired across lines)', marksAt('end of line\n** stray', 5), none);
    check('MARKS: an empty pair a press just made lights its mark (the next letter is bold)', marksAt('a**** b', 3).bold, true);
  }

  // ---- HEADINGS: six levels, H toggles (adds Heading 2, removes any level), + toward h1 and - toward h6, clamped ----
  {
    const { headingLevelAt } = mod;
    const lead = (l) => readLead(l).tokens.map((t) => `${t.kind}@${t.start}-${t.end}`);
    check('HEADINGS: the one lead reader reads # through ###### plus a space; seven hashes, or none after the space, are text', ['# a', '## a', '### a', '#### a', '##### a', '###### a', '####### a', '#a'].map((l) => lead(l)), [['heading@0-2'], ['heading@0-3'], ['heading@0-4'], ['heading@0-5'], ['heading@0-6'], ['heading@0-7'], [], []]);
    check('HEADINGS: H on a plain line adds Heading 2 (`## `) - the web editors\' default for a new heading', press('Chapter', 3, 3, 'heading').text, '## Chapter');
    check('HEADINGS: H on ANY heading line removes the heading, whatever its level ("all heading modifications should be undone")', ['# A', '## A', '#### A', '###### A'].map((t) => press(t, t.length, t.length, 'heading').text), ['A', 'A', 'A', 'A']);
    check('HEADINGS: + steps toward h1 and - toward h6, one level a press', [press('### A', 5, 5, 'heading-up').text, press('### A', 5, 5, 'heading-down').text], ['## A', '#### A']);
    check('HEADINGS: + is clamped at h1 and - at h6 (no seventh hash, no zero-hash heading)', [press('# A', 3, 3, 'heading-up').text, press('###### A', 8, 8, 'heading-down').text], ['# A', '###### A']);
    check('HEADINGS: + and - do nothing on a line that is not a heading', [press('Plain', 2, 2, 'heading-up').text, press('Plain', 2, 2, 'heading-down').text], ['Plain', 'Plain']);
    check('HEADINGS: the token is read where the reader puts it - after a centring token - and H toggles it there', [press('>< Title', 4, 4, 'heading').text, press('>< ## Title', 7, 7, 'heading').text], ['>< ## Title', '>< Title']);
    check('HEADINGS: the caret keeps the character it was on through H, + and -', (() => { const r = press('## Chapter', 6, 6, 'heading-up'); return r.text.slice(r.start, r.start + 3); })(), 'pte');
    check('HEADINGS: H lights on a heading line, with its level, and not elsewhere', [headingLevelAt('## A\nplain', 2), headingLevelAt('## A\nplain', 8), headingLevelAt('###### six', 9)], [2, null, 6]);
    check('HEADINGS: the page paints a distinct class per level, hash hidden', [1, 2, 3, 4, 5, 6].map((n) => { const h = decorateMarkdownForCard('#'.repeat(n) + ' x', null); return h.includes(`md-h${n}`) && visible(h) === 'x'; }), [true, true, true, true, true, true]);
    check('HEADINGS: titles and Copy My Words strip every level', [firstLine('### Third level'), firstLine('###### Six'), stripMarkdownConventions('#### Four\n###### Six')], ['Third level', 'Six', 'Four\nSix']);
  }


  // ---- THE STRAY `**` (owner's queue): an empty italic cannot be stored, so it is held for the next text typed ----
  {
    const r = applyFormat('Plain words', 3, 3, 'italic');
    check('EMPTY ITALIC: Italic at a bare caret writes NOTHING (an empty italic `**` reads as a lone bold marker and stayed on the page) and holds the mark pending', [r.text, r.start, r.pending], ['Plain words', 3, '*']);
    check('EMPTY ITALIC: the other empty pairs are readable runs and are stored as before - `****`, `____`, `~~~~`', ['bold', 'underline', 'strike'].map((a) => { const x = applyFormat('ab', 1, 1, a); return [x.text, x.pending ?? null]; }), [['a****b', null], ['a____b', null], ['a~~~~b', null]]);
    check('EMPTY ITALIC: inside an empty bold pair it IS readable (`***|***`) and is stored', [applyFormat('a****b', 3, 3, 'italic').text, applyFormat('a****b', 3, 3, 'italic').pending ?? null], ['a******b', null]);
  }

  // ---- CTRL+BACKSPACE / CTRL+DELETE over the visible text ----
  {
    const { wordBackspaceAt, wordDeleteAt } = mod;
    const B = (t, p) => { const r = wordBackspaceAt(t, p); return r ? [r.text, r.caret] : null; };
    const D = (t, p) => { const r = wordDeleteAt(t, p); return r ? [r.text, r.caret] : null; };
    check('WORD BACKSPACE: a whole bold word goes with its marks (no lone `**` left), from the caret after its last letter', B('one **bold** two', 10), ['one  two', 4]);
    check('WORD BACKSPACE: spaces before the caret go with the word before them', B('one two   ', 10), ['one ', 4]);
    check('WORD BACKSPACE: half of a bold word - the marks of the part that stays survive, nothing empty is left', B('one **boldly** x', 11), ['one **y** x', 4]);
    check('WORD BACKSPACE: in the middle of a styled word only its first part goes, and the pair still wraps the rest', B('**abcdef**', 5), ['**def**', 0]);
    check('WORD BACKSPACE: at a line\'s start it is a plain Backspace (the lines join)', B('one\ntwo', 4), ['onetwo', 3]);
    check('WORD DELETE: the word after the caret and its following spaces go; a styled word takes its marks', [D('one **bold** two', 4), D('one two', 3)], [['one two', 4], ['onetwo', 3]]);
    check('WORD DELETE: at a line\'s end it is a plain Delete (the lines join)', D('one\ntwo', 3), ['onetwo', 3]);
  }

  return results;
}

const base = run(await load('base'));
const bad = base.filter(r => !r.pass);
for (const r of base) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : `\n        got  ${JSON.stringify(r.got)}\n        want ${JSON.stringify(r.want)}`}`);
console.log(`\n${base.length - bad.length}/${base.length} checks passed`);
let ok = bad.length === 0;

if (process.argv.includes('--mutants')) {
  const M = [
    ['EMPTY ITALIC: Italic at a bare caret writes its ambiguous empty pair again', 'draftFormat.ts', (s) => s.replace("return empty ? w : { text, start, end, pending: mark };", "return w;")],
    ['WORD BACKSPACE: the range is cut raw, not through replaceRange (an emptied pair is left on the page)', 'hiddenMarks.ts', (s) => s.replace(/(while \(i >= li\.leadEnd && !\/\\s\/\.test\(text\[i\]\)\) \{ q = i; i = prevVisible\(q\); \}\s*)return replaceRange\(text, q, p, ''\);/, "$1return { text: text.slice(0, q) + text.slice(p), caret: q, structural: true };")],
    ['CLICK: a click is snapped by the keyboard rule (back inside the run)', 'hiddenMarks.ts', (s) => s.replace("return end === -1 ? snapCaret(text, p) : end;", "return snapCaret(text, p);")],
    ['MARKS: a caret after a run\'s closing marks counts as inside it (the old reader)', 'draftFormat.ts', (s) => s.replace("(at > r.open + ml && at <= r.close)", "(at > r.open + ml && at <= r.close + ml)")],
    ['HEADINGS: only one or two hashes are read', 'markRuns.ts', (s) => s.replace("/^(#{1,6}) /", "/^(#{1,2}) /")],
    ['HEADINGS: H adds Heading 1', 'draftFormat.ts', (s) => s.replace("cur === null ? 2 : null", "cur === null ? 1 : null")],
    ['HEADINGS: + and - are not clamped', 'draftFormat.ts', (s) => s.replace("Math.max(1, Math.min(6, cur + (action === 'heading-up' ? -1 : 1)))", "cur + (action === 'heading-up' ? -1 : 1)")],
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
    // ---- PARKED - SUPERSEDED by item 211 / PR #7 (e79390c: hidden marks never show, at an edge or mid-word), 2026-10-02 ----
    // Kept VERBATIM and no longer run. The `const reveal = touches(...)` line these mutated is gone; the successors re-introduce each superseded rule (the old rule, the interim rule) and must go RED.
    //
    // ['REVEAL: markers show anywhere inside the run (the old rule)', 'draftDecoration.ts', (s) => s.replace('const reveal = touches(r.open) || touches(r.close);', 'const reveal = caret !== null && caret >= r.open && caret <= end;')],
    // ['REVEAL: only the opening marker is watched', 'draftDecoration.ts', (s) => s.replace('const reveal = touches(r.open) || touches(r.close);', 'const reveal = touches(r.open);')],
    // ----------------------------------------------------------------------
    // Re-anchored by the 211 card port: the reveal option is gone, so the old rule is mutated in where the painter now hard-codes hidden.
    ['REVEAL: markers show anywhere inside the run (the old rule)', 'draftDecoration.ts', (s) => s.replace("const markCls = 'md-mark md-mark-hidden';", "const markCls = caret !== null && caret >= r.open && caret <= end ? 'md-mark' : 'md-mark md-mark-hidden';")],
    ['HEADING: the hash stays on the page', 'draftDecoration.ts', (s) => s.replace("const headCls = 'md-mark md-mark-hidden';", "const headCls = 'md-mark';")],
    // RETIRED with the option they mutated (the 211 card port): 'the card's interim rule leaks onto the page' and 'the popup loses the
    // interim rule' - there is no interim rule left to leak or to lose.
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
