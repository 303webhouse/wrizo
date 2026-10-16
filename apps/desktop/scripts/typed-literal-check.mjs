// TYPED-LITERAL - THE TEXT RULES, CHECKED WITHOUT A BROWSER (Nick's ruling, Oct 16; docs/typed-literal-plan.md). A formatting character
// the writer TYPES or PASTES is stored escaped (`\*`) and is literal; Ctrl+B and the menus still make markup; old saved markup still reads
// as markup. This bundles the REAL modules with the repo's own esbuild and checks, byte for byte:
//   ESCAPE   escapeTyped's table - `\ * _ ~` anywhere; `# - >` only where a line's text begins; a mid-line hyphen bare; a paste's lines
//   READ     the reader reads an escape as text (no run, no heading, no bullet), old `**bold**` as bold, `\\*x*` as a real italic
//   SHOW     the decorator hides an escape's backslash, keeps every stored character (1:1), and paints no style for escaped stars
//   211      Backspace / Delete / a cut through an escape take it WHOLE; the caret never stops between `\` and its character
//   RUNWAY   Free Write's strike and erase never split an escape
//   FORMAT   Ctrl+B still writes real marks (the formatter is not escaped)
//   READERS  .txt / Copy My Words / titles (stripLine) and the Tutor / Consistency (unescapeTyped) read the plain character; word counts unchanged
// Run: node apps/desktop/scripts/typed-literal-check.mjs   (no browser, no box turn)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const pnpmDir = join(root, 'node_modules', '.pnpm');
const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('TYPED-LITERAL-CHECK VERIFY: FAIL - esbuild not found'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'wz-typedlit-'));
const entry = join(tmp, 'entry.ts');
const store = join(here, '..', 'src', 'store').replace(/\\/g, '/');
writeFileSync(entry, ['markRuns', 'hiddenMarks', 'draftDecoration', 'draftFormat', 'forwardOnly', 'api', 'tutorConsistency']
  .map((m) => `export * as ${m.replace(/[^a-zA-Z]/g, '')} from '${store}/${m}';`).join('\n') + '\n');
const out = join(tmp, 'bundle.mjs');
// the font roster's faces load lazily from @fontsource CSS (draftDecoration imports it since font-span); those imports never run here
execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
  '--external:@fontsource/*', '--external:@fontsource-variable/*'], { stdio: 'pipe' });
const M = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });
const { markRuns: mr, hiddenMarks: hm, draftDecoration: dd, draftFormat: df, forwardOnly: fo, api, tutorConsistency: tc } = M;

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const B = '\\';
const esc = (s) => s.replace(/[\\*_~]/g, (c) => B + c);   // what a typed inline character becomes
const words = (t) => { const s = t.trim(); return s ? s.split(/\s+/).length : 0; };
const tagsOff = (html) => html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// ---- ESCAPE
const E = (ins, text = '', at = text.length) => hm.escapeTyped(ins, text, at);
ok('ESCAPE: * _ ~ and \\ are escaped wherever they are typed', E('*') === `${B}*` && E('**x**') === esc('**x**') && E('a_b') === `a${B}_b` && E('~~') === `${B}~${B}~` && E(B) === `${B}${B}`, JSON.stringify([E('*'), E('**x**'), E('a_b'), E('~~'), E(B)]));
ok('ESCAPE: # - > are escaped at the start of a line\'s text (a heading, bullet or quote could only form there)',
  E('# H') === `${B}# H` && E('- i') === `${B}- i` && E('> q') === `${B}> q` && E('#', 'abc\n') === `${B}#`, JSON.stringify([E('# H'), E('- i'), E('> q'), E('#', 'abc\n')]));
ok('ESCAPE: ...and NOT mid-line - a hyphen in a word stays bare', E('well-known', 'It is ') === 'well-known' && E('#', 'a ') === '#' && E('>', 'x') === '>', JSON.stringify([E('well-known', 'It is '), E('#', 'a ')]));
ok('ESCAPE: after a line\'s own structure (a bullet made by the menu) the text still begins there: a # typed after it is escaped', E('#', '- ') === `${B}#`, E('#', '- '));
ok('ESCAPE: a pasted run of lines is escaped line by line', E('a\n- b\n**c**') === `a\n${B}- b\n${esc('**c**')}`, E('a\n- b\n**c**'));

// ---- READ
ok('READ: escaped stars are text - no run at all', mr.readMarks(esc('**x**')).length === 0, JSON.stringify(mr.readMarks(esc('**x**'))));
ok('READ: an escaped # or - at a line\'s start is no heading and no bullet', mr.readLead(`${B}# H`).tokens.length === 0 && mr.readLead(`${B}- i`).tokens.length === 0);
ok('READ: OLD saved markup still reads as markup (no rewrite of old Pages) - `**bold**` is a bold run, `# H` a heading', mr.readMarks('**bold**').some((r) => r.kind === 'bold') && mr.readLead('# H').tokens.some((t) => t.kind === 'heading'));
ok('READ: Markdown\'s own rule - an escaped backslash leaves the next star REAL markup (`\\\\*x*` is an italic x)', mr.readMarks(`${B}${B}*x*`).some((r) => r.kind === 'italic'), JSON.stringify(mr.readMarks(`${B}${B}*x*`)));

// ---- SHOW
const html = dd.decorateMarkdownForCard(`a ${esc('*b*')} c`, null);
ok('SHOW: the decorator hides each escape\'s backslash (md-escape) and paints NO italic for escaped stars', (html.match(/md-escape/g) || []).length === 2 && !/md-italic/.test(html), html);
ok('SHOW: and keeps every stored character - the decorated text is the stored text, 1:1', tagsOff(html) === `a ${esc('*b*')} c`, tagsOff(html));
const html2 = dd.decorateMarkdownForCard(`**b ${B}* c**`, null);
ok('SHOW: a typed star INSIDE a bold run is a literal star in bold text', /md-bold/.test(html2) && (html2.match(/md-escape/g) || []).length === 1 && tagsOff(html2) === `**b ${B}* c**`, html2);

// ---- 211
const T = `a ${B}*b`;   // a, space, \, *, b
ok('211: Backspace after a typed star takes the star WITH its backslash', JSON.stringify(hm.backspaceAt(`a ${B}*`, 4)) === JSON.stringify({ text: 'a ', caret: 2, structural: false }), JSON.stringify(hm.backspaceAt(`a ${B}*`, 4)));
const d = hm.deleteAt(T, 2);
ok('211: Delete before a typed star takes it WITH its backslash', !!d && d.text === 'a b', JSON.stringify(d));
const cut = hm.replaceRange(`a ${B}*bc`, 3, 4, '');
ok('211: a cut that takes only the star takes the escape whole', cut.text === 'a bc', JSON.stringify(cut));
ok('211: the caret never stops between the backslash and its character (rule 1)', hm.snapCaret(T, 3) === 2, String(hm.snapCaret(T, 3)));
ok('211: the right arrow steps over the escape as ONE visible character', hm.stepRight(T, 2) === 4, String(hm.stepRight(T, 2)));

// ---- RUNWAY (Free Write)
const sr = fo.strikeTail([{ text: `x${B}*`, struck: false }], 1);
ok('RUNWAY: a one-character strike of a typed star strikes it WITH its backslash (no lone backslash left to show)', JSON.stringify(sr.content) === JSON.stringify([{ text: 'x', struck: false }, { text: `${B}*`, struck: true }]), JSON.stringify(sr));
ok('RUNWAY: a one-character erase does the same', JSON.stringify(fo.eraseTail([{ text: `x${B}*`, struck: false }], 1)) === JSON.stringify([{ text: 'x', struck: false }]), JSON.stringify(fo.eraseTail([{ text: `x${B}*`, struck: false }], 1)));

// ---- FORMAT
ok('FORMAT: Ctrl+B still writes REAL marks - the formatter is never escaped', df.applyFormat('ab', 0, 2, 'bold').text === '**ab**', df.applyFormat('ab', 0, 2, 'bold').text);

// ---- READERS
ok('READERS: .txt / Copy My Words / titles read the plain character', df.stripMarkdownConventions(`a ${esc('*b*')} c\n${B}# not a heading`) === 'a *b* c\n# not a heading', JSON.stringify(df.stripMarkdownConventions(`a ${esc('*b*')} c\n${B}# not a heading`)));
ok('READERS: unescapeTyped takes the backslashes out and keeps markup', mr.unescapeTyped(`**x** ${esc('*y*')}`) === '**x** *y*', mr.unescapeTyped(`**x** ${esc('*y*')}`));
{
  let sent = null;
  globalThis.fetch = async (_p, init) => { sent = init && init.body; return { ok: true, json: async () => ({ configured: true, reply: 'ok' }) }; };
  await api.apiTutorChat([{ role: 'writer', text: `my own ${B}* line` }], `the ${esc('*x*')} page`, undefined, `sel ${esc('_y_')}`);
  const b = sent ? JSON.parse(sent) : null;
  ok('READERS: the Tutor\'s wire unescapes the PAGE\'s text (delta, selection) and leaves the writer\'s own chat line as typed',
    !!b && b.delta === 'the *x* page' && b.selection === 'sel _y_' && b.messages[0].text === `my own ${B}* line` && !('bible' in b), String(sent));
}
ok('READERS: Consistency never names a backslash', tc.computeConsistencyObservations([`Ada met ${B}*Ada${B}* at the Harbour.`, 'Later Ada left the harbour.']).every((o) => !o.includes(B)));
const sample = [esc('**x**'), `a ${esc('*b*')} c`, `${B}# H`, `well-known ${B}_x`];
ok('READERS: the house word count is the same with the escapes as without them', sample.every((t) => words(t) === words(mr.unescapeTyped(t))), JSON.stringify(sample.map((t) => [words(t), words(mr.unescapeTyped(t))])));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTYPED-LITERAL-CHECK VERIFY: PASS (${checks.length} checks)` : `\nTYPED-LITERAL-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
