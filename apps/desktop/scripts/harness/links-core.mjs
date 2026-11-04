// TOOLS - WEB LINKS IN THE PAGE TEXT, THE TEXT RULES (Nick approved the mark; Fable's spec, Oct 31 / Nov 4). HARNESS ONLY, WRITTEN RED ON MAIN BY DESIGN: the product build waits for #13 and the anti-slop paste rail.
// The mark is `[words](https://...)`, written inside a line and read by the ONE reader (store/markRuns.ts readMarks) - so every consumer that already reads a run reads this one.
//
// THE CONTRACT THESE CHECKS PIN (the reader's shape, so a consumer needs no new idea): a link is a run of `kind: 'link'` carrying `href`, whose OPENING mark is `[` and whose CLOSING mark
// is `](<address>)` held in `cmark` like a font span's `]{.font-<slug>}` - so `closeMark(run)`, `removeMarkers` and the non-crossing rule all work on it unchanged. If the build names the run
// differently the contract changes HERE, in the open, not in the build.
//
//   READ     https / http / mailto are links; the address is whatever sits between the parentheses; the marks inside an address are NOT marks
//   BLOCKED  anything but https / http / mailto stays plain text (javascript:, data:, file:, ftp:, vbscript:, a relative path, a bare `//host`, an empty address, whitespace dressed up as a scheme)
//   NEST     a link nests with Bold / Italic / a size span, either way round, and NEVER crosses one (the later opener is dropped and its characters stay literal)
//   LITERAL  a typed bracket (`\[`) is text and so never opens a link; an unclosed mark is text
//   EXPORT   .txt / Copy My Words give "words (address)"; .md keeps the mark as written; a board's cards the same; a blocked mark is untouched in both
//   READERS  a word count is the words, never the address; a page's title is the words, never the address
//   SAVE     the mark survives the save (the cache -> localStorage serialisation) and the sync payload byte for byte
// NOT HERE, and said so rather than left silent: .docx / PDF "real links" - there is NO .docx or PDF exporter anywhere in the tree to check (grep: nothing under apps/ or packages/), so that
// line of the spec has nothing to be red against until an exporter exists; it is reported to Fable as a question, not faked. The browser half (click, Ctrl/Cmd+click, paste-over-selection,
// Ctrl/Cmd+K, the Link button, the look, never fetched) is scripts/harness/links-surface.mjs.
// Run: node scripts/harness/links-core.mjs   (from apps/desktop; browserless, no box turn)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const root = join(DESKTOP, '..', '..');
const pnpmDir = join(root, 'node_modules', '.pnpm');
const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('LINKS-CORE VERIFY: FAIL - esbuild not found under node_modules/.pnpm'); process.exit(1); }
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);

// a fake browser for the modules that read storage at load (persistence comes along with the exporters)
const map = new Map();
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }), devicePixelRatio: 1 };
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null, documentElement: { getAttribute: () => null } };
globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
// the sync payload, captured: postJson goes through fetch, and a link must reach it untouched
const sent = [];
globalThis.fetch = async (url, init) => { sent.push({ url: String(url), body: init && init.body ? String(init.body) : '' }); return { ok: true, status: 200, json: async () => ({ now: new Date().toISOString(), pull: {} }), text: async () => '{}' }; };

const bundle = async (names, tag) => {
  const tmp = mkdtempSync(join(tmpdir(), `wz-links-${tag}-`));
  const entry = join(tmp, 'entry.ts');
  const s = join(DESKTOP, 'src', 'store').replace(/\\/g, '/');
  writeFileSync(entry, names.map(([alias, mod]) => `export * as ${alias} from '${s}/${mod}';`).join('\n'));
  const out = join(tmp, 'bundle.mjs');
  try {
    execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
      '--external:@fontsource/*', '--external:@fontsource-variable/*', `--alias:react=${join(DESKTOP, 'node_modules', 'react').replace(/\\/g, '/')}`], { stdio: 'pipe' });
    return await import(pathToFileURL(out).href);
  } catch (e) { return { err: String((e && (e.stderr || e.message)) || e).split('\n').slice(0, 3).join(' | ').slice(0, 300) }; }
  finally { rmSync(tmp, { recursive: true, force: true }); }
};
const NOW = await bundle([['mr', 'markRuns'], ['df', 'draftFormat'], ['px', 'pageExport'], ['wc', 'wordCount'], ['et', 'entryText'], ['ps', 'persistence'], ['api', 'api']], 'now');
ok('fixture: the real modules bundle', !NOW.err, NOW.err || '');
const { mr = {}, df = {}, px = {}, wc = {}, et = {}, ps = {}, api = {} } = NOW;
const has = (o, k) => typeof o[k] === 'function';
const call = (f, ...a) => { try { return f(...a); } catch (e) { return { threw: String(e && e.message || e) }; } };
const marks = (line) => (has(mr, 'readMarks') ? call(mr.readMarks, line) : []);
const links = (line) => { const m = marks(line); return Array.isArray(m) ? m.filter((r) => r.kind === 'link') : []; };
const strip = (line) => (has(mr, 'stripLine') ? call(mr.stripLine, line) : null);
const noCrossing = (line) => { const f = marks(line); return Array.isArray(f) && f.every((a, i) => f.every((b, j) => { if (i === j) return true; const aE = a.close + mr.closeMark(a).length, bE = b.close + mr.closeMark(b).length; return bE <= a.open || aE <= b.open || (a.open <= b.open && bE <= aE) || (b.open <= a.open && aE <= bE); })); };
const ADDR = 'https://links.example.test/a/b?c=d#e';
// THE CONTROL every "stays text" check carries: the SAME sentence with an allowed address IS a link. Without it a check that something is NOT a link passes on a build that reads no links at all - it could not fail.
const CONTROL = () => links(`a [words](${ADDR}) b`).length === 1;

// ---- READ
{
  const line = `see [the docs](${ADDR}) now`;
  const r = links(line);
  ok('READ: `[the docs](https://...)` is ONE link run carrying its href', r.length === 1 && r[0].href === ADDR, J(r));
  ok('READ: the run\'s marks are the opening `[` and the closing `](<address>)` - a consumer that measures closeMark(run) sees the whole mark', r.length === 1 && r[0].mark === '[' && has(mr, 'closeMark') && mr.closeMark(r[0]) === `](${ADDR})` && line.slice(r[0].open, r[0].close + mr.closeMark(r[0]).length) === `[the docs](${ADDR})`, J(r));
  ok('READ: removeMarkers leaves the words only', r.length === 1 && has(mr, 'removeMarkers') && mr.removeMarkers(line, r) === 'see the docs now', r.length ? J(call(mr.removeMarkers, line, r)) : 'no run');
  const h = links('a [plain](http://links.example.test/x) b');
  ok('READ: http is a link', h.length === 1 && h[0].href === 'http://links.example.test/x', J(h));
  const m = links('write [me](mailto:someone@example.test) soon');
  ok('READ: mailto is a link', m.length === 1 && m[0].href === 'mailto:someone@example.test', J(m));
  const two = links(`[one](${ADDR}) and [two](http://links.example.test/2)`);
  ok('READ: two links on a line are two runs, side by side', two.length === 2 && two[0].href === ADDR && two[1].href === 'http://links.example.test/2' && noCrossing(`[one](${ADDR}) and [two](http://links.example.test/2)`), J(two));
  const inside = links('a [x](https://links.example.test/__a__/*b*/~~c~~) b');
  ok('READ: the marks INSIDE an address (`__`, `*`, `~~`) are not marks - one link, nothing else read from the address', inside.length === 1 && marks('a [x](https://links.example.test/__a__/*b*/~~c~~) b').length === 1, J(marks('a [x](https://links.example.test/__a__/*b*/~~c~~) b')));
  const esc = links('a [the \\[sic\\] word](https://links.example.test/x) b');
  ok('READ: a typed `[sic]` inside the label stays text and the link stays whole', esc.length === 1 && esc[0].href === 'https://links.example.test/x', J(esc));
}

// ---- BLOCKED - only https / http / mailto; anything else is plain text, left exactly as typed
{
  const BAD = [
    ['javascript:alert(1)', 'javascript:'], ['JaVaScRiPt:alert(1)', 'javascript: in mixed case'], ['data:text/html;base64,PGI+eA==', 'data:'], ['file:///C:/Windows/win.ini', 'file:'], ['ftp://links.example.test/x', 'ftp:'],
    ['vbscript:msgbox(1)', 'vbscript:'], ['/relative/path', 'a relative path'], ['//links.example.test/x', 'a protocol-relative //host'], ['links.example.test/x', 'a bare host'], ['', 'an empty address'],
    ['https://', 'a scheme with nothing after it'], ['  javascript:alert(1)', 'javascript: after a space'], ['java\tscript:alert(1)', 'javascript: split by a tab'], ['java&#x09;script:alert(1)', 'javascript: dressed in an entity'],
    ['blob:https://links.example.test/x', 'blob:'], ['tel:+15550100', 'tel:'],
  ];
  for (const [addr, what] of BAD) {
    const line = `a [words](${addr}) b`;
    ok(`BLOCKED: ${what} is NOT a link - no run, and the page's text is left exactly as typed (nothing hidden)`, CONTROL() && links(line).length === 0 && strip(line) === line, J({ control: CONTROL(), runs: links(line), strip: strip(line) }));
  }
}

// ---- NEST - a link nests with the other marks and never crosses one
{
  const a = `**[bold link](${ADDR})**`;
  const ra = marks(a);
  ok('NEST: a link INSIDE Bold - both read, nesting', Array.isArray(ra) && ra.some((r) => r.kind === 'bold') && ra.some((r) => r.kind === 'link') && noCrossing(a), J(ra));
  const b = `[**bold** and *italic* words](${ADDR})`;
  const rb = marks(b);
  ok('NEST: Bold and Italic INSIDE a link - all three read, nesting', Array.isArray(rb) && rb.some((r) => r.kind === 'bold') && rb.some((r) => r.kind === 'italic') && rb.some((r) => r.kind === 'link') && noCrossing(b), J(rb));
  const c = `[[big]{.size-14} words](${ADDR})`;
  const rc = marks(c);
  ok('NEST: a size span INSIDE a link - both read, nesting', Array.isArray(rc) && rc.some((r) => r.kind === 'font' && r.points === 14) && rc.some((r) => r.kind === 'link') && noCrossing(c), J(rc));
  const d = `[a link with [big]{.size-14} in it](${ADDR})`;
  ok('NEST: stripLine reads through every nesting to the words and the address', strip(a) === `bold link (${ADDR})` && strip(b) === `bold and italic words (${ADDR})` && strip(c) === `big words (${ADDR})` && strip(d) === `a link with big in it (${ADDR})`, J([strip(a), strip(b), strip(c), strip(d)]));
  const cross = `**a [b** c](${ADDR})`;
  const rx = marks(cross);
  const linkRun = links(cross).length === 1, boldRun = Array.isArray(rx) && rx.some((r) => r.kind === 'bold');
  ok('NEVER CROSS: `**a [b** c](address)` - the two cannot both stand, so exactly one is read and the other\'s characters stay literal', CONTROL() && links(`**a** [b](${ADDR})`).length === 1 && noCrossing(cross) && linkRun !== boldRun, J({ rx, stripped: strip(cross) }));
  const cross2 = `[a **b](${ADDR}) c**`;
  const rx2 = marks(cross2);
  ok('NEVER CROSS: `[a **b](address) c**` - same, the other way round', CONTROL() && links(`[a](${ADDR}) **b**`).length === 1 && noCrossing(cross2) && (links(cross2).length === 1) !== (Array.isArray(rx2) && rx2.some((r) => r.kind === 'bold')), J({ rx2, stripped: strip(cross2) }));
}

// ---- LITERAL - typed brackets and unfinished marks are text
{
  const typed = `a \\[words\\](${ADDR}) b`;
  ok('LITERAL: a typed bracket is stored escaped and never opens a link - `\\[words\\](address)` is text', CONTROL() && links(typed).length === 0, J(links(typed)));
  ok('LITERAL: an unclosed `[words](https://...` is text', CONTROL() && links(`a [words](${ADDR} b`).length === 0 && links(`a [words] (${ADDR}) b`).length === 0, J([links(`a [words](${ADDR} b`), links(`a [words] (${ADDR}) b`)]));
  ok('LITERAL: a link in a line\'s own structure (`- `, `> `, `# `) is read after the structure', ['- ', '> ', '# '].every((lead) => strip(`${lead}[w](${ADDR})`) === `w (${ADDR})`), J(['- ', '> ', '# '].map((lead) => strip(`${lead}[w](${ADDR})`))));
}

// ---- EXPORT - .txt / Copy My Words give "words (address)"; .md keeps the mark
{
  const text = `Read [the docs](${ADDR}) first.\nThen write [me](mailto:someone@example.test).\nNot [this](javascript:alert(1)) one.`;
  const entry = { id: 'lk-1', text, createdAt: '2026-11-04T00:00:00Z', pageType: 'journal' };
  const plain = has(px, 'pageBodyPlain') ? call(px.pageBodyPlain, entry) : null;
  ok('EXPORT: .txt / Copy My Words reads `[words](address)` as "words (address)", mailto too, and leaves a blocked mark exactly as typed',
    plain === `Read the docs (${ADDR}) first.\nThen write me (mailto:someone@example.test).\nNot [this](javascript:alert(1)) one.`, J(plain));
  const formatted = has(px, 'pageBodyFormatted') ? call(px.pageBodyFormatted, entry) : null;
  ok('EXPORT: .md (Copy Formatted) keeps the link mark exactly as written - a Markdown reader renders it as a link', formatted === text, J(formatted));
  const files = has(px, 'exportPageFiles') ? call(px.exportPageFiles, entry) : null;
  ok('EXPORT: This Page makes the pair - the .md holds `[the docs](address)`, the .txt holds "the docs (address)"', !!files && String(files.md).includes(`[the docs](${ADDR})`) && String(files.txt).includes(`the docs (${ADDR})`) && !String(files.txt).includes('](http'), J(files));
  const stripped = has(df, 'stripMarkdownConventions') ? call(df.stripMarkdownConventions, '**[b](https://links.example.test/x)** and *[i](http://links.example.test/y)*') : null;
  ok('EXPORT: stripMarkdownConventions (the plain reading) - emphasis out, the link as "words (address)"', stripped === 'b (https://links.example.test/x) and i (http://links.example.test/y)', J(stripped));
  const board = { id: 'lk-b', text: '', pageType: 'board', createdAt: '2026-11-04T00:00:00Z', boxes: [{ id: 'c1', kind: 'text', x: 0, y: 0, w: 0.3, h: 0.1, z: 1, text: `A card with [a link](${ADDR}) in it` }] };
  const bPlain = has(px, 'pageBodyPlain') ? call(px.pageBodyPlain, board) : null;
  const bFmt = has(px, 'pageBodyFormatted') ? call(px.pageBodyFormatted, board) : null;
  ok('EXPORT: a board\'s card - the .txt gives "a link (address)", the .md keeps the mark', typeof bPlain === 'string' && bPlain.includes(`A card with a link (${ADDR}) in it`) && typeof bFmt === 'string' && bFmt.includes(`[a link](${ADDR})`), J({ bPlain, bFmt }));
}

// ---- READERS - the words, never the address
{
  const t = `Read [the docs](${ADDR}) now`;
  ok('READERS: a word count is the words - `Read [the docs](address) now` is 4 words, the address adds none', has(wc, 'wordCount') && call(wc.wordCount, t) === 4, has(wc, 'wordCount') ? J(call(wc.wordCount, t)) : 'no wordCount');
  ok('READERS: a one-word link counts as one word', has(wc, 'wordCount') && call(wc.wordCount, `[one](${ADDR})`) === 1, has(wc, 'wordCount') ? J(call(wc.wordCount, `[one](${ADDR})`)) : 'no wordCount');
  // a title is read through the same stripLine that gives Copy My Words "words (address)" - so the two readers must NOT be the same one for a link, or every page opening on a link is titled with its address (surfaced to Fable)
  const title = has(et, 'firstLine') ? call(et.firstLine, `[My chapter](${ADDR}) begins here`) : null;
  ok('READERS: a page\'s title (entryText.firstLine - the page-link label, a search snippet) is the WORDS, never the address - "My chapter begins here"', title === 'My chapter begins here', J(title));
}

// ---- SAVE - the mark survives the cache -> localStorage serialisation and the sync payload byte for byte
{
  const text = `One [link](${ADDR}) and **[a bold one](http://links.example.test/b)**.\nA [mail](mailto:someone@example.test) too.`;
  let saved = null;
  if (has(ps, 'createJournalPage')) {
    const e = call(ps.createJournalPage, { id: 'lk-save', text, createdAt: '2026-11-04T00:00:00Z', origin: null, source: 'page' });
    if (has(ps, 'flushNow')) call(ps.flushNow);
    const back = has(ps, 'getJournalEntry') ? call(ps.getJournalEntry, 'lk-save') : null;
    const raw = [...map.values()].find((v) => v.includes('lk-save') && v.includes('links.example.test'));
    let rawText = null;
    try { const arr = JSON.parse(raw || '[]'); const row = (Array.isArray(arr) ? arr : Object.values(arr)).find((r) => r && r.id === 'lk-save'); rawText = row ? row.text : null; } catch { /* the check records what it found */ }
    saved = { created: e && e.text, back: back && back.text, rawText };
  }
  ok('SAVE: the mark is stored exactly as written - in the cache, and in localStorage after a flush', !!saved && saved.created === text && saved.back === text && saved.rawText === text, J(saved));
  let pushed = null;
  if (has(api, 'apiSync')) {
    sent.length = 0;
    await call(api.apiSync, { lastSyncAt: null, push: { journalEntries: [{ id: 'lk-save', text, createdAt: '2026-11-04T00:00:00Z' }] } });
    try { pushed = JSON.parse((sent[0] || {}).body || '{}').push.journalEntries[0].text; } catch { /* the check records what it found */ }
  }
  ok('SYNC: the mark reaches the server in the sync payload exactly as written', pushed === text, J(pushed));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail && !c.pass ? `  [${String(c.detail).slice(0, 400)}]` : ''}`);
console.log('NOTE  .docx / PDF real links: no .docx or PDF exporter exists in the tree - nothing to check yet (reported to Fable)');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nLINKS-CORE VERIFY: PASS (${checks.length} checks)` : `\nLINKS-CORE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
