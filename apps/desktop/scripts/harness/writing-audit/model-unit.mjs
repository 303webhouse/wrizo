// WRITING AUDIT, SESSION 1 - the model and the verdict, proved WITHOUT a browser (no box, no account): the reference model's rules, and verify.mjs's detectors against synthetic page reads
// (a caret at the page's corner, a moved page, a lost focus, a jumped view ...). A detector that cannot fire is not a detector: each one here is shown to fire on a read built to trip it, and to stay quiet on a clean read.
// Run: node scripts/harness/writing-audit/model-unit.mjs   (from apps/desktop; browserless)
import { Model, prevWordStart, nextWordStop } from './lib/model.mjs';
import { verify } from './lib/verify.mjs';
import { GROUPS } from './lib/cases.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const snap = (m) => `${JSON.stringify(m.text)}@${m.a}..${m.f}`;
const run = (text, a, f, ...steps) => { const m = new Model(text, a, f ?? a, 'linux'); for (const s of steps) m.apply(s); return m; };
const K = (key, o = {}) => ({ k: 'key', key, ...o });
const T = (s) => ({ k: 'type', s });

// ---- the model ----
let m = run('Hello world', 11, 11, K('Enter'));
ok('M1 Enter at the end: a new empty line, caret on it', m.text === 'Hello world\n' && m.f === 12, snap(m));
m = run('Hello world', 5, 5, K('Enter'));
ok('M2 Enter in the middle splits the paragraph, caret at the start of the second half', m.text === 'Hello\n world' && m.f === 6, snap(m));
m = run('Hello world', 5, 6, K('Enter'));
ok('M3 Enter over a selection replaces it', m.text === 'Hello\nworld' && m.f === 6, snap(m));
m = run('One\nTwo', 4, 4, K('Backspace'));
ok('M4 Backspace at a paragraph start joins up', m.text === 'OneTwo' && m.f === 3, snap(m));
m = run('One\nTwo', 3, 3, K('Delete'));
ok('M5 Delete at a paragraph end joins down', m.text === 'OneTwo' && m.f === 3, snap(m));
m = run('', 0, 0, K('Backspace'), K('Delete'));
ok('M6 Backspace and Delete in an empty document do nothing', m.text === '' && m.f === 0, snap(m));
m = run('ab\ncd', 4, 4, K('Home'), K('End'));
ok('M7 Home then End on the second line', m.f === 5 && m.collapsed, snap(m));
m = run('ab\ncd', 4, 4, K('Home', { shift: true }));
ok('M8 Shift+Home selects to the line start (anchor stays)', m.a === 4 && m.f === 3, snap(m));
m = run('Hello world', 2, 7, K('ArrowLeft'));
ok('M9 Left on a selection collapses to its START', m.a === 2 && m.f === 2, snap(m));
m = run('Hello world', 2, 7, K('ArrowRight'));
ok('M10 Right on a selection collapses to its END', m.a === 7 && m.f === 7, snap(m));
m = run('abc', 1, 1, K('a', { ctrl: true }), T('X'));
ok('M11 Ctrl+A then typing replaces everything', m.text === 'X' && m.f === 1, snap(m));
m = run('Hello world', 3, 3, T('XY'));
ok('M12 typing in a word', m.text === 'HelXYlo world' && m.f === 5, snap(m));
ok('M13 Ctrl+Left skips back to a word start', prevWordStart('Hello big world', 15) === 10 && prevWordStart('Hello big world', 10) === 6 && prevWordStart('Hello big world', 6) === 0);
ok('M14 a paragraph boundary is one word-step', prevWordStart('ab\ncd', 3) === 2 && nextWordStop('ab\ncd', 2, 'win') === 3);
ok('M15 Ctrl+Right: Windows stops at the next word start, Linux at this word end', nextWordStop('Hello big world', 0, 'win') === 6 && nextWordStop('Hello big world', 0, 'linux') === 5);
m = run('Hello big world', 15, 15, K('Backspace', { ctrl: true }));
ok('M16 Ctrl+Backspace deletes the word before the caret', m.text === 'Hello big ' && m.f === 10, snap(m));
m = run('Hello big world', 6, 6, K('Delete', { ctrl: true }));
ok('M16b smart delete: a word taken from between two spaces takes one space with it (measured, Chrome 156 Linux)', m.text === 'Hello world' && m.f === 6, snap(m));
let threw = false; try { run('a', 0, 0, K('PageUp')); } catch { threw = true; }
ok('M17 a key the model has no rule for is refused, never guessed', threw);
const all = Object.values(GROUPS).flat();
let bad = [];
for (const c of all) { try { const mm = new Model(c.text, c.a, c.f, 'linux'); for (const s of c.steps) mm.apply(s); } catch (e) { bad.push(c.id + ': ' + e.message); } }
ok(`M18 every case (${all.length}) is one the model can apply`, !bad.length, bad.join(' | '));
ok('M19 case ids are unique, and Enter is the first group', new Set(all.map((c) => c.id)).size === all.length && Object.keys(GROUPS)[0] === 'enter');

// ---- the verdict: a clean read, then one read built to trip each detector ----
const page = { x: 400, y: 80, w: 700, h: 600 };
const clean = () => ({ editor: true, theme: 'plateau', text: 'Hello\nworld', anchor: 6, focus: 6, collapsed: true, focused: true, active: 'DIV.forward-only-editor', rows: 2,
  caret: { via: 'range', x: 450, top: 140, height: 24 }, px: { x: 450, top: 143, width: 1, height: 18 }, pxTries: 1, fluxCaret: null, page: { ...page }, scroll: { top: 0, win: 0 }, selNode: null });
const exp = { text: 'Hello\nworld', a: 6, f: 6 };
const box = { via: 'char', x: 450, top: 140, height: 24 };
const v = (over, o = {}) => verify({ exp: o.exp || exp, box: o.box === undefined ? box : o.box, before: clean(), early: { ...clean(), ...over }, late: { ...clean(), ...over }, errors: o.errors || [], expect: o.expect || {} });
const names = (r) => r.fails.map((f) => f.check).join(',');
ok('V0 liveness: a clean read passes every check', v({}).fails.length === 0, names(v({})));
ok('V1 a lost character is a TEXT failure', names(v({ text: 'Hell\nworld' })).includes('text'));
ok('V2 a doubled paragraph break is a TEXT failure', names(v({ text: 'Hello\n\nworld' })).includes('text'));
ok('V3 a non-breaking space is a note, not a failure', (() => { const r = v({ text: 'Hello\nworld', rawHasNbsp: true }); return r.fails.length === 0; })());
ok('V4 the caret one character off is a CARET failure', names(v({ anchor: 7, focus: 7 })).includes('caret'));
ok('V5 a selection outside the editor is a CARET failure', names(v({ anchor: null, focus: null, selNode: 'BODY' })).includes('caret'));
ok("V6 NICK'S BUG: the caret drawn at the page's top-left corner is a DRAWN failure", (() => { const r = v({ px: { x: 402, top: 84, width: 1, height: 18 } }); return names(r).includes('drawn') && /corner/.test(r.fails.find((f) => f.check === 'drawn').detail); })());
ok("V7 the caret drawn at the window's corner is a DRAWN failure", (() => { const r = v({ px: { x: 0, top: 0, width: 1, height: 18 } }); return names(r).includes('drawn') && /window/.test(r.fails.find((f) => f.check === 'drawn').detail); })());
ok('V8 the caret drawn off the page is a DRAWN failure', names(v({ px: { x: 1300, top: 400, width: 1, height: 18 } })).includes('drawn'));
ok('V9 the caret drawn one line too high is a DRAWN failure', names(v({ px: { x: 450, top: 110, width: 1, height: 18 } })).includes('drawn'));
ok("V10 Flux: the block caret not drawn at all is a DRAWN failure", names(v({ theme: 'flux', fluxCaret: null })).includes('drawn'));
ok("V11 Flux: the block caret at the page's corner is a DRAWN failure", names(v({ theme: 'flux', fluxCaret: { x: 402, top: 82, height: 24, width: 8 } })).includes('drawn'));
ok('V12 Flux: the block caret where the text puts it passes', v({ theme: 'flux', fluxCaret: { x: 450, top: 140, height: 24, width: 8 } }).fails.length === 0);
ok('V9b the native caret painted at the right margin of the right row is a DRAWN failure (run 42918219726, E18)', names(v({ px: { x: 908, top: 230, width: 1, height: 18 } })).includes('drawn'));
ok('V9c no caret painted anywhere is a DRAWN failure', (() => { const r = v({ px: null, pxTries: 8 }); return names(r).includes('drawn') && /no caret is painted/.test(r.fails.find((f) => f.check === 'drawn').detail); })());
ok('V9d the range rectangle being wrong is NOT a failure when the painted caret is right (it was the proxy that was wrong)', v({ caret: { via: 'range', x: 450, top: 110, height: 24 } }).fails.length === 0);
ok('V13 focus left the editor is a FOCUS failure', names(v({ focused: false, active: 'BODY' })).includes('focus'));
ok('V14 a step that means to blur is not a focus failure', !names(v({ focused: false }, { expect: { blur: true } })).includes('focus'));
ok('V15 the page moved 7px is a PAGE failure', names(v({ page: { ...page, x: 407 } })).includes('page'));
ok('V16 the view jumped is a VIEW failure; an allowed scroll is not', names(v({ scroll: { top: 40, win: 0 } })).includes('view') && !names(v({ scroll: { top: 40, win: 0 } }, { expect: { scroll: true } })).includes('view'));
ok('V17 a console error is a CONSOLE failure', names(v({}, { errors: ['console.error: boom'] })).includes('console'));
ok('V18 a caret that moves after the keystroke is a SETTLED failure (bug 33)', (() => { const r = verify({ exp, box, before: clean(), early: { ...clean(), anchor: 6, focus: 6 }, late: { ...clean(), anchor: 11, focus: 11 }, errors: [] }); return names(r).includes('settled'); })());
ok('V19 rows that are not one per line are noted, not guessed at', (() => { const r = v({}, { box: { via: 'rows-drift' } }); return r.fails.length === 0 && r.notes.some((n) => /rows/.test(n)); })());
ok('V20 a selection (not a caret) is not judged by drawn place', (() => { const r = verify({ exp: { text: 'Hello\nworld', a: 0, f: 5 }, box: null, before: clean(), early: { ...clean(), anchor: 0, focus: 5, collapsed: false }, late: { ...clean(), anchor: 0, focus: 5, collapsed: false, caret: null }, errors: [] }); return r.fails.length === 0; })());

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : `  [${c.detail}]`}`);
console.log(failed.length ? `\nWRITING-AUDIT MODEL-UNIT: FAIL - ${failed.length}/${checks.length}` : `\nWRITING-AUDIT MODEL-UNIT: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
