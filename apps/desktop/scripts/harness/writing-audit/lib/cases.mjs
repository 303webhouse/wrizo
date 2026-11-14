// THE SESSION-1 CASES (writing audit; brief §5, the caret group on the Page editor in Draft): Enter first (Nick's bug: Enter, and the caret lands in the page's top-left corner), then typing, deleting, moving,
// selecting. Each case: the text the page starts with, where the caret (or selection) starts, and the steps a writer takes. The model (model.mjs) says what each step must do; verify.mjs checks the page after EACH step.
// Lines are short (no wrap) except where a case says so, so Home/End are logical-line ends (model.mjs, ORACLE ASSUMPTIONS). Hyphens and markdown characters stay out of the typed text: "--" is the em-dash
// trigger and `*`/`#` are the page's own formatting, both of which are separate surfaces for later sessions.
const K = (key, o = {}) => ({ k: 'key', key, ...o });
const T = (s, o = {}) => ({ k: 'type', s, ...o });
const c = (id, name, text, at, steps, extra = {}) => ({ id, name, text, a: at, f: extra.to ?? at, steps, ...extra });

const PARA3 = 'One\nTwo\nThree';
const LONG = ('The quick brown fox jumps over the lazy dog and keeps going until the line must wrap. ').repeat(4).trim();

export const GROUPS = {
  enter: [
    c('E01', 'Enter in an empty document', '', 0, [K('Enter')]),
    c('E02', 'Enter at the end of a paragraph', 'Hello world', 11, [K('Enter')]),
    c('E03', 'Enter in the middle of a paragraph', 'Hello world', 5, [K('Enter')]),
    c('E04', 'Enter at the start of a paragraph', 'Hello world', 0, [K('Enter')]),
    c('E05', 'Enter on an empty line in the middle', 'One\n\nThree', 4, [K('Enter')]),
    c('E06', 'Enter twice in a row at the end', 'Hello world', 11, [K('Enter'), K('Enter')]),
    c('E07', 'Enter at the very end of three paragraphs', PARA3, 13, [K('Enter')]),
    c('E08', 'Enter at the very start of three paragraphs', PARA3, 0, [K('Enter')]),
    c('E09', 'Enter, then keep typing', 'Hello', 5, [K('Enter'), T('x'), T('abc')]),
    c('E10', 'Shift+Enter at the end of a paragraph', 'Hello', 5, [K('Enter', { shift: true })]),
    c('E11', 'Shift+Enter in the middle of a paragraph', 'Hello world', 5, [K('Enter', { shift: true })]),
    c('E12', 'Enter over a selection', 'Hello world', 5, [K('Enter')], { to: 6 }),
    c('E13', 'Enter, then Backspace (rejoin)', 'Hello world', 5, [K('Enter'), K('Backspace')]),
    c('E14', 'Enter three times at the end, then type', 'Hello', 5, [K('Enter'), K('Enter'), K('Enter'), T('x')]),
    c('E15', 'Enter at the end of a document that already ends in an empty line', 'One\n', 4, [K('Enter')]),
    c('E16', 'A first page: type, Enter, type, Enter', '', 0, [T('Hi'), K('Enter'), T('there'), K('Enter'), T('friend')]),
    c('E17', 'Enter at the start of a middle paragraph', PARA3, 4, [K('Enter')]),
    c('E18', 'Enter at the end of a middle paragraph', PARA3, 7, [K('Enter')]),
    c('E19', 'Enter in the middle of a paragraph that wraps', LONG, 150, [K('Enter')]),
    c('E20', 'Enter at the end of a paragraph that wraps', LONG, LONG.length, [K('Enter'), T('x')]),
  ],
  type: [
    c('T01', 'Type into an empty page', '', 0, [T('The quick brown fox')]),
    c('T02', 'Type in the middle of a word', 'Hello world', 3, [T('XY')]),
    c('T03', 'Capitals, digits and punctuation', '', 0, [T('Dear Sam, I have 12 apples. Really? Yes!')]),
    c('T04', 'Type over a selection', 'Hello world', 6, [T('there')], { to: 11 }),
    c('T05', 'A fast burst (no gap between keys)', '', 0, [T('burst typing with no pause between the keys', { gap: 0 })]),
    c('T06', 'A long unbroken word', '', 0, [T('a'.repeat(120))]),
    c('T07', 'Type at the start of a paragraph', PARA3, 4, [T('Z')]),
    c('T08', 'Type at the end of the document', PARA3, 13, [T(' and more')]),
    c('T09', 'Two spaces and a trailing space', 'ab', 2, [T('  cd ')]),
  ],
  del: [
    c('D01', 'Backspace inside a word', 'Hello world', 3, [K('Backspace'), K('Backspace')]),
    c('D02', 'Backspace at a paragraph start (join up)', PARA3, 4, [K('Backspace')]),
    c('D03', 'Backspace at the end of the document', PARA3, 13, [K('Backspace'), K('Backspace')]),
    c('D04', 'Delete inside a word', 'Hello world', 3, [K('Delete'), K('Delete')]),
    c('D05', "Delete at a paragraph's end (join down)", PARA3, 3, [K('Delete')]),
    c('D06', 'Backspace and Delete in an empty document', '', 0, [K('Backspace'), K('Delete')]),
    c('D07', 'Backspace over a selection', 'Hello world', 2, [K('Backspace')], { to: 8 }),
    c('D08', 'Delete over a selection that spans paragraphs', PARA3, 2, [K('Delete')], { to: 6 }),
    c('D09', 'Backspace on an empty middle line', 'One\n\nThree', 4, [K('Backspace')]),
    c('D10', 'Ctrl+Backspace after a word', 'Hello big world', 15, [K('Backspace', { ctrl: true })]),
    c('D11', 'Ctrl+Delete before a word', 'Hello big world', 6, [K('Delete', { ctrl: true })]),
  ],
  move: [
    c('M01', 'Left and Right across a paragraph boundary', PARA3, 4, [K('ArrowLeft'), K('ArrowLeft'), K('ArrowRight'), K('ArrowRight')]),
    c('M02', 'Home and End on a line', PARA3, 5, [K('Home'), K('End')]),
    c('M03', 'Ctrl+Home and Ctrl+End', PARA3, 5, [K('Home', { ctrl: true }), K('End', { ctrl: true })]),
    c('M04', 'Left at the start and Right at the end of the document', 'ab', 0, [K('ArrowLeft'), K('End', { ctrl: true }), K('ArrowRight')]),
    c('M05', 'Ctrl+Left and Ctrl+Right by words', 'Hello big world', 15, [K('ArrowLeft', { ctrl: true }), K('ArrowLeft', { ctrl: true }), K('ArrowRight', { ctrl: true })]),
    c('M06', 'Arrows on an empty line', 'One\n\nThree', 4, [K('ArrowLeft'), K('ArrowRight'), K('ArrowRight')]),
  ],
  select: [
    c('S01', 'Shift+Right then Shift+Left', 'Hello world', 3, [K('ArrowRight', { shift: true }), K('ArrowRight', { shift: true }), K('ArrowLeft', { shift: true })]),
    c('S02', 'Shift+Home and Shift+End', PARA3, 5, [K('Home', { shift: true }), K('End', { shift: true })]),
    c('S03', 'Ctrl+A, then type over everything', PARA3, 5, [K('a', { ctrl: true }), T('X')]),
    c('S04', 'Ctrl+A, then Backspace', PARA3, 5, [K('a', { ctrl: true }), K('Backspace')]),
    c('S05', 'Shift+Ctrl+Right by words, then Delete', 'Hello big world', 0, [K('ArrowRight', { shift: true, ctrl: true }), K('Delete')]),
    c('S06', 'A selection, then Left collapses to its start', 'Hello world', 2, [K('ArrowLeft')], { to: 7 }),
    c('S07', 'A selection, then Right collapses to its end', 'Hello world', 2, [K('ArrowRight')], { to: 7 }),
  ],
};

export const ORDER = ['enter', 'type', 'del', 'move', 'select'];
