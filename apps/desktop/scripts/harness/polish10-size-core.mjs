// POLISH #10, FIX item 4 - SIZE FOLLOWS THE SELECTION (Nick ruled A, Oct 25): with text selected, a size change applies ONLY to the selection, even one
// character, via `[words]{.size-N}` - the font-span grammar - on pages and cards. Where a face and a size meet on the same words they are ONE span with
// both classes, `[words]{.font-<slug> .size-N}`, so no two spans ever cross. N is in points, whole or half (`10.5`). No new field: a mark in the text.
// Nick's conditions: every reader of saved text handles or strips the mark (render, the editor, export, the word count, search + the Tutor's text,
// copy/paste between surfaces); a stale tab cannot corrupt it; checks first; FULL PAIR.
//
// THE TEXT RULES, WITHOUT A BROWSER (no box turn's browser; it runs in the suite like seed-guard). Bundles the REAL modules with the repo's own esbuild:
//   READ    a size span is a span (alone, half-point, and joined with a face in one span); a malformed size is text; `[sic]` inside stays text
//   PICK    a size pick wraps the highlight - even one character - and keeps it highlighted; neighbours of one size MERGE; a partial re-pick SPLITS;
//           null removes; a face pick over a sized stretch KEEPS its size (one span, both classes) and a size pick over a faced stretch keeps its face;
//           a stretch that would cross Bold is split so the two nest; a collapsed caret changes nothing
//   AT      fontSizeAt reads N / null / 'mixed'; fontFaceAt is not fooled by a size
//   WHOLE   the whole-document SIZE pick removes every size and keeps every face; the whole-document FACE pick removes every face and keeps every size
//   EDIT    Backspace/Delete never take half a span; Enter inside closes and reopens it (the house rules, through the same run model)
//   READERS withoutFontMarks strips size marks too; the word count is unchanged; the .txt / Copy My Words reading strips it; the Tutor's wire carries no
//           size mark - nor a HALF span cut off by the delta's tail; Consistency names none; a board's .txt export strips its cards' spans; titles
//           (the Tutor's lens) read no mark; line-equivalents are not inflated by marks
//   CLIP    copying a cut size span reopens it with its own size; the plain copy carries no mark; paste between surfaces keeps it
//   STALE   the PREVIOUS build's editing functions (git 243cf8f0, bundled from the object store) keep a size span byte for byte: Bold, a face pick and an
//           edit elsewhere on the line leave `[words]{.size-N}` whole; a face picked ON the sized words nests and the new reader reads both
// Run: node scripts/harness/polish10-size-core.mjs   (from apps/desktop)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const root = join(DESKTOP, '..', '..');
const pnpmDir = join(root, 'node_modules', '.pnpm');
const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('POLISH10-SIZE-CORE VERIFY: FAIL - esbuild not found under node_modules/.pnpm'); process.exit(1); }
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);

// a fake browser for the modules that read storage at load (persistence comes along with the exporters and lenses)
const map = new Map();
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }), devicePixelRatio: 1 };
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null, documentElement: { getAttribute: () => null } };
globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });

const bundle = async (srcStore, names, tag) => {
  const tmp = mkdtempSync(join(tmpdir(), `wz-size-${tag}-`));
  const entry = join(tmp, 'entry.ts');
  const s = srcStore.replace(/\\/g, '/');
  writeFileSync(entry, names.map(([alias, mod]) => `export * as ${alias} from '${s}/${mod}';`).join('\n'));
  const out = join(tmp, 'bundle.mjs');
  try {
    execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
      '--external:@fontsource/*', '--external:@fontsource-variable/*', `--alias:react=${join(DESKTOP, 'node_modules', 'react').replace(/\\/g, '/')}`], { stdio: 'pipe' });
    return await import(pathToFileURL(out).href);
  } catch (e) { return { err: String((e && (e.stderr || e.message)) || e).split('\n').slice(0, 3).join(' | ').slice(0, 300) }; }
  finally { rmSync(tmp, { recursive: true, force: true }); }
};
const NOW = await bundle(join(DESKTOP, 'src', 'store'), [['mr', 'markRuns'], ['df', 'draftFormat'], ['hm', 'hiddenMarks'], ['api', 'api'], ['tc', 'tutorConsistency'], ['cf', 'clipboardFormat'], ['px', 'pageExport'], ['le', 'lineEquivalents'], ['tl', 'tutorLenses']], 'now');
ok('fixture: the real modules bundle', !NOW.err, NOW.err || '');
const { mr = {}, df = {}, hm = {}, api = {}, tc = {}, cf = {}, px = {}, le = {}, tl = {} } = NOW;
const has = (o, k) => typeof o[k] === 'function';
const call = (f, ...a) => { try { return f(...a); } catch (e) { return { threw: String(e && e.message || e) }; } };
const spans = (line) => (has(mr, 'readMarks') ? mr.readMarks(line).filter((r) => r.kind === 'font') : []);
const words = (t) => { const s = t.trim(); return s ? s.split(/\s+/).length : 0; };
const sel = (r) => (r && typeof r.text === 'string' ? r.text.slice(r.start, r.end) : null);
const noCrossing = (text) => text.split('\n').every((line) => { const f = spans(line); return f.every((a, i) => f.every((b, j) => i === j || b.open > a.close || a.open > b.close || (a.open < b.open && b.close < a.close) || (b.open < a.open && a.close < b.close))); });

// ---- READ
{
  const r1 = spans('a [big]{.size-14} b');
  ok('READ: `[big]{.size-14}` is a span carrying 14 points', r1.length === 1 && r1[0].points === 14 && !r1[0].face, J(r1));
  const r2 = spans('a [big]{.size-10.5} b');
  ok('READ: a half point (`.size-10.5`) is a span carrying 10.5', r2.length === 1 && r2[0].points === 10.5, J(r2));
  const r3 = spans('a [big]{.font-lora .size-14} b');
  ok('READ: a face and a size on the same words are ONE span with both classes', r3.length === 1 && r3[0].face === 'lora' && r3[0].points === 14, J(r3));
  const r4 = spans('a [big]{.size-1x} [b]{.size-} [c]{.size-14 .size-12} d');
  ok('READ: a malformed size (`.size-1x`, `.size-`, two sizes) is text, not a span', r4.length === 0, J(r4));
  ok('READ: stripLine keeps the words only', has(mr, 'stripLine') && mr.stripLine('a [big **bold**]{.font-lora .size-14} b') === 'a big bold b', has(mr, 'stripLine') ? J(mr.stripLine('a [big **bold**]{.font-lora .size-14} b')) : 'no stripLine');
  const r5 = spans('a [the \\[sic\\] word]{.size-14} b');
  ok('READ: a typed `[sic]` inside a size span stays text and the span stays whole', r5.length === 1 && r5[0].points === 14, J(r5));
  ok('READ: spanCloseMark writes face first, size second', has(mr, 'spanCloseMark') && mr.spanCloseMark({ face: 'lora', points: 14 }) === ']{.font-lora .size-14}' && mr.spanCloseMark({ points: 10.5 }) === ']{.size-10.5}' && mr.spanCloseMark({ face: 'lora' }) === ']{.font-lora}',
    has(mr, 'spanCloseMark') ? J([mr.spanCloseMark({ face: 'lora', points: 14 }), mr.spanCloseMark({ points: 10.5 })]) : 'no spanCloseMark');
}

// ---- PICK
const base = 'The ferry was late and the harbour was cold';
const p1 = has(df, 'applySizePick') ? call(df.applySizePick, base, 4, 9, 14) : null;
ok('PICK: a size pick wraps the highlight and keeps it highlighted', !!p1 && p1.text === 'The [ferry]{.size-14} was late and the harbour was cold' && sel(p1) === 'ferry', J(p1));
const p2 = has(df, 'applySizePick') ? call(df.applySizePick, base, 4, 5, 18) : null;
ok('PICK: ONE character takes a size alone', !!p2 && p2.text === 'The [f]{.size-18}erry was late and the harbour was cold' && sel(p2) === 'f', J(p2));
const p3 = p1 && has(df, 'applySizePick') ? call(df.applySizePick, p1.text, p1.text.indexOf(' was late'), p1.text.indexOf(' was late') + ' was late'.length, 14) : null;
ok('PICK: neighbours of one size MERGE into one span', !!p3 && p3.text === 'The [ferry was late]{.size-14} and the harbour was cold', J(p3));
const p4 = p3 && has(df, 'applySizePick') ? call(df.applySizePick, p3.text, p3.text.indexOf('was'), p3.text.indexOf('was') + 3, 20) : null;
ok('PICK: a partial re-pick SPLITS the span - never two sizes stacked', !!p4 && p4.text === 'The [ferry]{.size-14} [was]{.size-20} [late]{.size-14} and the harbour was cold' && noCrossing(p4.text), J(p4));
const p5 = p1 && has(df, 'applySizePick') ? call(df.applySizePick, p1.text, p1.start, p1.end, null) : null;
ok('PICK: null removes the size (the page\'s own size)', !!p5 && p5.text === base, J(p5));
const p6 = p1 && has(df, 'applyFontPick') ? call(df.applyFontPick, p1.text, p1.start, p1.end, 'lora') : null;
ok('PICK: a FACE picked over a sized stretch keeps its size - one span, both classes', !!p6 && p6.text === 'The [ferry]{.font-lora .size-14} was late and the harbour was cold' && sel(p6) === 'ferry', J(p6));
const f1 = has(df, 'applyFontPick') ? call(df.applyFontPick, base, 4, 9, 'lora') : null;
const p7 = f1 && has(df, 'applySizePick') ? call(df.applySizePick, f1.text, f1.start, f1.end, 12) : null;
ok('PICK: a SIZE picked over a faced stretch keeps its face', !!p7 && p7.text === 'The [ferry]{.font-lora .size-12} was late and the harbour was cold', J(p7));
const p8 = p7 && has(df, 'applySizePick') ? call(df.applySizePick, p7.text, p7.start, p7.end, null) : null;
ok('PICK: removing the size from a face+size span leaves the face span', !!p8 && p8.text === f1.text, J({ p8, f1: f1 && f1.text }));
const bolded = 'one **two three** four';
const p9 = has(df, 'applySizePick') ? call(df.applySizePick, bolded, 0, bolded.indexOf('three'), 16) : null;
ok('PICK: a size stretch that would cross Bold is split so the two NEST (the reader drops neither)', !!p9 && noCrossing(p9.text) && mr.readMarks(p9.text).some((r) => r.kind === 'bold') && spans(p9.text).length >= 1, J(p9));
const p10 = has(df, 'applySizePick') ? call(df.applySizePick, base, 4, 4, 14) : null;
ok('PICK: a collapsed caret changes nothing', !!p10 && p10.text === base, J(p10));
const p11 = has(df, 'applySizePick') ? call(df.applySizePick, 'line one\nline two', 5, 13, 14) : null;
ok('PICK: across two lines, one span per line', !!p11 && p11.text === 'line [one]{.size-14}\n[line]{.size-14} two', J(p11));

// ---- AT
ok('AT: fontSizeAt reads 14 on the sized words, null on plain words, mixed across both', has(df, 'fontSizeAt') && !!p1 && df.fontSizeAt(p1.text, p1.start, p1.end) === 14 && df.fontSizeAt(p1.text, p1.text.indexOf('harbour'), p1.text.indexOf('harbour') + 7) === null && df.fontSizeAt(p1.text, 0, p1.text.length) === 'mixed',
  has(df, 'fontSizeAt') && p1 ? J([df.fontSizeAt(p1.text, p1.start, p1.end), df.fontSizeAt(p1.text, 0, p1.text.length)]) : 'no fontSizeAt');
ok('AT: fontFaceAt is not fooled by a size (a sized word with no face reads null)', has(df, 'fontFaceAt') && !!p1 && df.fontFaceAt(p1.text, p1.start, p1.end) === null, has(df, 'fontFaceAt') && p1 ? J(df.fontFaceAt(p1.text, p1.start, p1.end)) : '');

// ---- WHOLE
const both = 'a [b]{.font-lora .size-14} c [d]{.size-12} e [f]{.font-arial} g';
ok('WHOLE: the whole-document SIZE pick removes every size and keeps every face', has(df, 'clearSizeSpans') && df.clearSizeSpans(both) === 'a [b]{.font-lora} c d e [f]{.font-arial} g', has(df, 'clearSizeSpans') ? J(df.clearSizeSpans(both)) : 'no clearSizeSpans');
ok('WHOLE: the whole-document FACE pick removes every face and keeps every size', has(df, 'clearFontSpans') && df.clearFontSpans(both) === 'a [b]{.size-14} c [d]{.size-12} e f g', has(df, 'clearFontSpans') ? J(df.clearFontSpans(both)) : '');

// ---- EDIT (the house rules, through the same run model: hiddenMarks)
{
  // font-span-check.mjs's 211 cases, on a size span and a face+size span (the same run model)
  for (const [S, close] of [['a [bc]{.size-14} d', ']{.size-14}'], ['a [bc]{.font-lora .size-14} d', ']{.font-lora .size-14}']]) {
    const b1 = has(hm, 'backspaceAt') ? call(hm.backspaceAt, S, 5) : null;
    ok(`EDIT (${close}): Backspace after the span's last letter takes the LETTER, never a mark`, !!b1 && b1.text === `a [b${close} d`, J(b1));
    const bA = has(hm, 'backspaceAt') ? call(hm.backspaceAt, S, S.indexOf(' d')) : null;
    ok(`EDIT (${close}): Backspace just AFTER the span takes its last letter - the whole closing mark is stepped over`, !!bA && bA.text === `a [b${close} d`, J(bA));
    const b2 = b1 && has(hm, 'backspaceAt') ? call(hm.backspaceAt, b1.text, 4) : null;
    ok(`EDIT (${close}): deleting every word inside removes the span (no empty marks left)`, !!b2 && b2.text === 'a  d', J(b2));
    const e1 = has(hm, 'enterAt') ? call(hm.enterAt, S, 4, 4) : null;
    ok(`EDIT (${close}): Enter inside closes the span before the newline and opens it again after`, !!e1 && e1.text === `a [b${close}\n[c${close} d`, J(e1));
  }
}

// ---- READERS
{
  const mixed = '# A heading\n- one [**two**]{.size-14} three\nplain [words]{.font-arial .size-12} here';
  ok('READERS: withoutFontMarks removes the size marks too - headings, bullets, bold kept', has(mr, 'withoutFontMarks') && mr.withoutFontMarks(mixed) === '# A heading\n- one **two** three\nplain words here', has(mr, 'withoutFontMarks') ? J(mr.withoutFontMarks(mixed)) : '');
  const counted = [mixed, p4 && p4.text, p6 && p6.text, p7 && p7.text].filter((t) => typeof t === 'string');
  ok('READERS: the house word count is unchanged by size marks (the marks hold no whitespace)', counted.length >= 3 && has(mr, 'withoutFontMarks') && counted.every((t) => words(t) === words(mr.withoutFontMarks(t))),
    J(counted.map((t) => [words(t), has(mr, 'withoutFontMarks') ? words(mr.withoutFontMarks(t)) : null])));
  ok('READERS: the .txt / Copy My Words reading strips a size span to its words', has(df, 'stripMarkdownConventions') && df.stripMarkdownConventions('- the [two **words**]{.font-lora .size-14} here') === 'the two words here', has(df, 'stripMarkdownConventions') ? J(df.stripMarkdownConventions('- the [two **words**]{.font-lora .size-14} here')) : '');
  ok('READERS: line-equivalents are not inflated by span marks', has(le, 'countLineEquivalents') && le.countLineEquivalents('x'.repeat(58) + ' [y]{.font-lora .size-14}') === le.countLineEquivalents('x'.repeat(58) + ' y'),
    has(le, 'countLineEquivalents') ? J([le.countLineEquivalents('x'.repeat(58) + ' [y]{.font-lora .size-14}'), le.countLineEquivalents('x'.repeat(58) + ' y')]) : '');
}
if (has(api, 'apiTutorChat')) {
  let sent = null;
  globalThis.fetch = async (_p, init) => { sent = init && init.body; return { ok: true, json: async () => ({ configured: true, reply: 'ok' }) }; };
  await api.apiTutorChat([{ role: 'writer', text: 'about [Ada]{.size-14} and **her** boat' }], 'the [ferry]{.font-arial .size-12} was late', 'bible [entry]{.size-10.5}', 'sel [words]{.size-14} here');
  const body = sent ? JSON.parse(sent) : null;
  ok('TUTOR: the wire carries no size mark - messages, delta, bible, selection - and keeps the other conventions',
    !!body && !/\{\.(size|font)-/.test(String(sent)) && body.messages[0].text === 'about Ada and **her** boat' && body.delta === 'the ferry was late' && body.bible === 'bible entry' && body.selection === 'sel words here', String(sent));
  sent = null;
  await api.apiTutorChat([{ role: 'writer', text: 'q' }], 'ry]{.size-14} was late and [the harb', undefined, 'ds]{.font-lora .size-12} here');
  const b2 = sent ? JSON.parse(sent) : null;
  ok('TUTOR: a HALF span cut off by the delta\'s tail or the selection\'s edge carries no mark either (orphan closers and openers)', !!b2 && !/\{\.(size|font)-/.test(String(sent)) && b2.delta === 'ry was late and the harb' && b2.selection === 'ds here', String(sent));
} else ok('TUTOR: the wire bundles', false, 'no apiTutorChat');
if (has(tc, 'computeConsistencyObservations')) {
  const obs = tc.computeConsistencyObservations(['Ada met [Ada]{.size-14} at the [Harbour]{.font-arial .size-12}.', 'Later Ada left the Harbour.']);
  ok('CONSISTENCY: no observation names a size mark', obs.every((o) => !/size|\{\.|\]\{/.test(o)), J(obs));
}
if (has(px, 'exportPageFiles')) {
  const board = { id: 'b', text: '', pageType: 'board', createdAt: '2026-10-25T00:00:00Z', boxes: [{ id: 'c1', kind: 'text', x: 0, y: 0, w: 0.3, h: 0.1, z: 1, text: 'A [card]{.font-lora .size-14} word' }] };
  const files = call(px.exportPageFiles, board);
  const txt = files && !files.threw ? Object.entries(files).find(([k]) => /txt|plain/i.test(k)) : null;
  const plain = txt ? String(txt[1] && (txt[1].body ?? txt[1].text ?? txt[1])) : J(files);
  ok('EXPORT: a board\'s .txt export strips its cards\' spans to their words', !!txt && plain.includes('A card word') && !/\{\.(size|font)-/.test(plain), plain.slice(0, 200));
}
if (has(tl, 'titleOf')) {
  const t = call(tl.titleOf, { id: 'x', text: '[Big]{.size-20} title line\nbody', createdAt: '2026-10-25T00:00:00Z' });
  ok('TITLES: the Tutor\'s lens titles read no span mark', typeof t === 'string' && !/\{\.|\]/.test(t) && t.includes('Big title line'), J(t));
}

// ---- CLIP
if (has(cf, 'copyPayload')) {
  const t = 'a [big word]{.size-14} b';
  const p = call(cf.copyPayload, t, t.indexOf('word'), t.indexOf('word') + 4);
  ok('CLIP: copying part of a size span reopens it with its own size; the plain copy carries no mark', !!p && !p.threw && /\[word\]\{\.size-14\}/.test(String(p.fragment ?? p.envelope ?? p.text ?? J(p))) && String(p.plain ?? '').trim() === 'word', J(p));
  if (has(cf, 'pasteEdit') && p && !p.threw) {
    const r = call(cf.pasteEdit, 'into here', 5, 5, p.fragment ?? null, p.plain ?? 'word');
    ok('CLIP: pasting it into another surface keeps the size span', !!r && typeof r.text === 'string' && /\[word\]\{\.size-14\}/.test(r.text), J(r));
  }
}

// ---- STALE: the previous build's own functions, bundled from git 243cf8f0 (page-size-r3 FINAL - the build this one replaces)
{
  const PREV = '243cf8f0';
  const tmp = mkdtempSync(join(tmpdir(), 'wz-size-prev-'));
  let OLD = { err: 'not extracted' };
  try {
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', PREV, 'apps/desktop/src/store', 'apps/desktop/src/types'], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
    for (const f of files) { const dest = join(tmp, f); mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, execFileSync('git', ['show', `${PREV}:${f}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 })); }
    OLD = await bundle(join(tmp, 'apps', 'desktop', 'src', 'store'), [['mr', 'markRuns'], ['df', 'draftFormat']], 'prev');
  } catch (e) { OLD = { err: String(e && e.message || e).slice(0, 200) }; }
  finally { rmSync(tmp, { recursive: true, force: true }); }
  ok(`STALE (fixture): the previous build (${PREV}) bundles from the object store`, !OLD.err, OLD.err || '');
  if (!OLD.err) {
    const t = 'The [ferry]{.size-14} was late and the harbour was cold';
    const oldSpans = OLD.mr.readMarks(t).filter((r) => r.kind === 'font');
    ok('STALE (premise): the previous build does not know a size span (it reads none)', oldSpans.length === 0, J(oldSpans));
    const b = OLD.df.applyFormat(t, t.indexOf('harbour'), t.indexOf('harbour') + 7, 'bold');
    ok('STALE: Bold elsewhere on the line in a stale tab keeps `[ferry]{.size-14}` byte for byte', b.text.includes('[ferry]{.size-14}') && spans(b.text).some((s) => s.points === 14), J(b.text));
    const f = OLD.df.applyFontPick(t, t.indexOf('harbour'), t.indexOf('harbour') + 7, 'lora');
    ok('STALE: a face picked elsewhere on the line in a stale tab keeps the size span whole', f.text.includes('[ferry]{.size-14}') && spans(f.text).some((s) => s.points === 14) && spans(f.text).some((s) => s.face === 'lora'), J(f.text));
    const on = OLD.df.applyFontPick(t, t.indexOf('ferry'), t.indexOf('ferry') + 5, 'lora');
    const onSpans = spans(on.text);
    ok('STALE: a face picked ON the sized words in a stale tab nests inside it, and the new reader reads both (nothing lost, nothing crossing)',
      onSpans.some((s) => s.points === 14) && onSpans.some((s) => s.face === 'lora') && noCrossing(on.text) && mr.stripLine(on.text) === 'The ferry was late and the harbour was cold', J(on.text));
  }
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${String(c.detail).slice(0, 400)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-SIZE-CORE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-SIZE-CORE VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-SIZE-CORE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
