// THE SESSION-2 CASES (writing audit; Fable's order, Nov 10): Enter with the Typewriter ENGAGED (Nick's bug: Enter, then the caret in the page's top-left corner), the probe for #61 (does the next typed character
// land in the wrong place?), then Up/Down/PageUp/PageDown, Home/End on wrapped lines, and the mouse. Step kinds beyond cases.mjs:
//   { k:'key', key:'ArrowDown', geo:'down' }     the layout-aware oracle (geom.mjs): the expected offset comes from the page's own geometry before the step
//   { k:'key', key:'PageDown', prop:'down' }     a property, not an offset: the caret moved forward (or was at the end), the text is unchanged, it is drawn where the selection says
//   { k:'click', q:12 | eol:true,line:1 | below:true | margin:true,line:1, count:1|2|3 }   a real mouse click aimed from the geometry
//   { k:'drag', from:q, to:r }                   press at one caret position, release at another
// `cont: true` on a case runs every step even after one fails (the model carries on from the INTENDED state), so a probe can answer "and then what happens when the writer keeps typing?".
import { GROUPS } from './cases.mjs';

const K = (key, o = {}) => ({ k: 'key', key, ...o });
const T = (s, o = {}) => ({ k: 'type', s, ...o });
const c = (id, name, text, at, steps, extra = {}) => ({ id, name, text, a: at, f: extra.to ?? at, steps, ...extra });

const LINES30 = Array.from({ length: 30 }, (_, i) => `Line number ${i + 1}`).join('\n');
const endOfLine = (text, k) => text.split('\n').slice(0, k).join('\n').length;   // offset just after the k-th line's last character
const W = 'The quick brown fox jumps over the lazy dog and keeps running through the wide green field until night falls. Then it rests.';
const P3 = 'A third one that also runs long enough to wrap onto a second visual line for sure, yes.';
const DOC = `${W}\nSecond paragraph is short.\n${P3}`;

export const GROUPS2 = {
  // 1. Enter with the Typewriter engaged: the whole session-1 Enter group again (the runner turns the Typewriter on), then long pages where it scrolls
  enterTw: GROUPS.enter,
  enterLong: [
    c('L01', 'Enter twice at the end of a 30-line page, then type', LINES30, LINES30.length, [K('Enter'), K('Enter'), T('x')]),
    c('L02', 'Enter in the middle of a 30-line page, then type', LINES30, endOfLine(LINES30, 15), [K('Enter'), T('x')]),
    c('L03', 'Enter at the very start of a 30-line page', LINES30, 0, [K('Enter'), T('x')]),
    c('L04', 'Type, Enter, type, Enter at the end of a 30-line page', LINES30, LINES30.length, [T(' more'), K('Enter'), T('next line'), K('Enter')]),
    c('L05', 'Enter on an empty line in the middle of a 30-line page', `${LINES30.split('\n').slice(0, 14).join('\n')}\n\n${LINES30.split('\n').slice(14).join('\n')}`, endOfLine(LINES30, 14) + 1, [K('Enter'), T('x')]),
  ],
  enterKeys: [
    c('L06', 'Ctrl+Home, then Enter, then type, on a 30-line page', LINES30, LINES30.length, [K('Home', { ctrl: true }), K('Enter'), T('x')]),
    c('L07', 'Up fifteen lines, then Enter, then type, on a 30-line page', LINES30, LINES30.length, [...Array.from({ length: 15 }, () => K('ArrowUp', { geo: 'up' })), K('Enter'), T('x')]),
    c('L08', 'Ctrl+Home on a 30-line page (does the view follow the caret?)', LINES30, LINES30.length, [K('Home', { ctrl: true })]),
  ],
  // 2. #61: after Enter on an empty middle line, does the next typed character land in the wrong place?
  probe: [
    c('P61', '#61: Enter on an empty middle line, then type "x"', 'One\n\nThree', 4, [K('Enter'), T('x')], { cont: true }),
    c('P62', 'Enter on an empty middle line twice, then type "xy"', 'One\n\nThree', 4, [K('Enter'), K('Enter'), T('xy')], { cont: true }),
    c('P63', "Nick's first page: type, Enter, type, Enter, Enter, type", '', 0, [T('Hello'), K('Enter'), T('World'), K('Enter'), K('Enter'), T('x')], { cont: true }),
  ],
  // 3a. Up / Down / PageUp / PageDown, Home / End on wrapped lines
  vert: [
    c('V01', 'Down four times from the start of a wrapped page (the goal column)', DOC, 0, [K('ArrowDown', { geo: 'down' }), K('ArrowDown', { geo: 'down' }), K('ArrowDown', { geo: 'down' }), K('ArrowDown', { geo: 'down' })]),
    c('V02', 'Up four times from the end of a wrapped page', DOC, DOC.length, [K('ArrowUp', { geo: 'up' }), K('ArrowUp', { geo: 'up' }), K('ArrowUp', { geo: 'up' }), K('ArrowUp', { geo: 'up' })]),
    c('V03', 'Down, Down, Up, Up keeps the goal column', DOC, 30, [K('ArrowDown', { geo: 'down' }), K('ArrowDown', { geo: 'down' }), K('ArrowUp', { geo: 'up' }), K('ArrowUp', { geo: 'up' })]),
    c('V04', 'Down through an empty line', 'abcdefghij\n\nabcdefghij', 6, [K('ArrowDown', { geo: 'down' }), K('ArrowDown', { geo: 'down' })]),
    c('V05', 'Up on the first line and Down on the last', 'abc\ndef', 2, [K('ArrowUp', { geo: 'up' }), K('ArrowDown', { geo: 'down' }), K('ArrowDown', { geo: 'down' })]),
    c('V06', 'Home and End on a wrapped line', DOC, 70, [K('Home', { geo: 'home' }), K('End', { geo: 'end' }), K('Home', { geo: 'home' })]),
    c('V07', 'Shift+Down twice (the selection grows by lines)', DOC, 5, [K('ArrowDown', { geo: 'down', shift: true }), K('ArrowDown', { geo: 'down', shift: true })]),
    c('V08', 'PageDown, PageDown, PageUp on a 30-line page', LINES30, 0, [K('PageDown', { prop: 'down' }), K('PageDown', { prop: 'down' }), K('PageUp', { prop: 'up' })]),
    c('V09', 'Down onto a line, then type (it lands where the caret is)', 'abcdefghij\nklmnopqrst', 4, [K('ArrowDown', { geo: 'down' }), T('X')]),
  ],
  // 3b. the mouse
  mouse: [
    c('U01', 'Click in the middle of a word', 'One two three\nFour five six\nSeven eight nine', 0, [{ k: 'click', q: 21 }]),
    c('U02', 'Click to the right of the end of a line', 'One two three\nFour five six\nSeven eight nine', 0, [{ k: 'click', eol: true, line: 1 }]),
    c('U03', 'Click on an empty line', 'One\n\nThree', 0, [{ k: 'click', q: 4 }]),
    c('U04', 'Click below the last line', 'One two three\nFour five six', 0, [{ k: 'click', below: true }]),
    c('U05', "Click in the page's left margin beside a line", 'One two three\nFour five six\nSeven eight nine', 0, [{ k: 'click', margin: true, line: 1 }]),
    c('U06', 'Double-click a word', 'One two three\nFour five six', 0, [{ k: 'click', q: 5, count: 2 }]),
    c('U07', 'Triple-click a line', 'One two three\nFour five six\nSeven eight nine', 0, [{ k: 'click', q: 19, count: 3 }]),
    c('U08', 'Drag across words in one line', 'One two three\nFour five six', 0, [{ k: 'drag', from: 2, to: 11 }]),
    c('U09', 'Drag across two paragraphs', 'One two three\nFour five six', 0, [{ k: 'drag', from: 6, to: 19 }]),
    c('U10', 'Click, then type (it lands where the click was)', 'One two three\nFour five six', 0, [{ k: 'click', q: 20 }, T('X')]),
  ],
};
// the SMOKE set (Fable's "dark and 1920"): the cases that found something plus one clean control per kind, drawn from both sessions' groups
import { GROUPS as G1 } from './cases.mjs';
const pick = (list, ids) => list.filter((x) => ids.includes(x.id));
GROUPS2.smoke = [
  ...pick(G1.enter, ['E02', 'E05', 'E16', 'E18']), ...pick(G1.type, ['T01', 'T06']), ...pick(G1.del, ['D02']), ...pick(G1.move, ['M06']), ...pick(G1.select, ['S03']),
  ...pick(GROUPS2.probe, ['P61', 'P63']), ...pick(GROUPS2.vert, ['V02', 'V06', 'V08']), ...pick(GROUPS2.mouse, ['U03', 'U06', 'U08']), ...pick(GROUPS2.enterLong, ['L03']),
];
export const ORDER2 = ['enterTw', 'enterLong', 'enterKeys', 'probe', 'vert', 'mouse'];
