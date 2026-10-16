// IN-APP-COPY-FORMAT, THE COPY HALF - CHECKED WITHOUT A BROWSER (Nick's ruling, Oct 16; plan docs/in-app-copy-format-plan.md @ f2a9f956;
// Fable, Oct 16: build the copy half on typed-literal, Q2 as leaned). A copy from a writing surface writes the PLAIN characters for other
// apps (each line read as Copy My Words reads it: no marks, no escapes, no structure tokens) and Wrizo's own MARKUP beside it. This bundles
// the real modules with the repo's own esbuild and checks:
//   PLAIN     a copy's plain text holds no hidden mark, no escape backslash and no structure token - a typed `*` reaches an email as `*`
//   FRAGMENT  whole lines copy as they are stored; a selection that cuts a run closes and reopens it at the cut; an escape is taken whole;
//             the first line's structure tokens come only when the selection starts at that line's start (Q2)
//   ROUND     on seeded random pages and random selections: the fragment's plain IS the plain written beside it, and every character
//             the fragment shows carries exactly the styles it carried on the page (bold, italic, underline, strike) - the markup is the
//             selection's own, balanced; the lines that fall back to literal text are counted and printed (a guard can pass blind)
//   ENVELOPE  the Wrizo envelope carries the version, the fragment and the plain text it was copied beside
// Run: node apps/desktop/scripts/in-app-copy-format-check.mjs   (no browser, no box turn)
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
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('IN-APP-COPY-FORMAT-CHECK VERIFY: FAIL - esbuild not found'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'wz-copyfmt-'));
const entry = join(tmp, 'entry.ts');
const store = join(here, '..', 'src', 'store').replace(/\\/g, '/');
writeFileSync(entry, ['markRuns', 'clipboardFormat'].map((m) => `export * as ${m} from '${store}/${m}';`).join('\n') + '\n');
const out = join(tmp, 'bundle.mjs');
execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error'], { stdio: 'pipe' });
const M = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });
const { markRuns: mr, clipboardFormat: cf } = M;

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const B = '\\';
const P = (text, s = 0, e = text.length) => cf.copyPayload(text, s, e);
// a selection given by its first and last VISIBLE characters' place in the stored text: `sel(text, 'ld wo')` selects that visible run
const at = (text, needle) => { const i = text.indexOf(needle); if (i < 0) throw new Error(`no ${needle} in ${text}`); return [i, i + needle.length]; };

// ---- PLAIN
{
  const a = P('Plain **bold** and *it* end');
  ok('PLAIN: a bold and an italic copy as their words - no marks reach another app', a.plain === 'Plain bold and it end', JSON.stringify(a));
  const b = P(`A ${B}*sigh${B}* and ${B}_x${B}_ and ${B}${B}`);
  ok('PLAIN: a typed star, underscore and backslash copy as themselves - no escape backslash reaches another app (the leak typed-literal opened)',
    b.plain === `A *sigh* and _x_ and ${B}`, JSON.stringify(b));
  const c = P(`# Heading\n- item one\n\t> quoted ${B}# not`);
  ok('PLAIN: structure tokens (a heading, a bullet, a tab and a quote) do not reach another app, line by line',
    c.plain === `Heading\nitem one\nquoted # not`, JSON.stringify(c));
  const d = P('two * three * four');
  ok('PLAIN: a lone star the reader does not pair (an old page\'s "2 * 3") is shown, so it is copied', d.plain === 'two * three * four', JSON.stringify(d));
}

// ---- FRAGMENT
{
  const T = `# Head **bold** ${B}*x${B}*\n- item *it*`;
  ok('FRAGMENT: whole lines copy exactly as they are stored (marks, escapes, structure)', P(T).fragment === T, JSON.stringify(P(T)));
  const t = 'One **bold words** two';
  const [s, e] = at(t, 'ld wo');
  const f = P(t, s, e);
  ok('FRAGMENT: a selection inside a bold run closes and reopens it at the cut', f.fragment === '**ld wo**' && f.plain === 'ld wo', JSON.stringify(f));
  const [s2] = at(t, 'wor');
  const f2 = P(t, s2, t.length);
  ok('FRAGMENT: a selection that starts inside a run and runs past its end reopens it and keeps its own closing mark',
    f2.fragment === '**words** two' && f2.plain === 'words two', JSON.stringify(f2));
  const n = 'a __under *both* line__ z';
  const [s3, e3] = at(n, 'r *bo');
  const f3 = P(n, s3, e3 + 0);
  ok('FRAGMENT: nested runs cut by the selection reopen outer-first and close inner-first',
    f3.fragment === '__r *bo*__' && f3.plain === 'r bo', JSON.stringify(f3));
  const x = `say ${B}*hi${B}* now`;
  const i = x.indexOf('*');   // between the backslash and its star
  const f4 = P(x, i, x.length);
  ok('FRAGMENT: an edge between an escape\'s backslash and its character takes the escape whole (a start moves out to the backslash)',
    f4.fragment === `${B}*hi${B}* now` && f4.plain === '*hi* now', JSON.stringify(f4));
  const f5 = P(x, 0, i);
  ok('FRAGMENT: ...and an end there leaves the escape out whole (no lone backslash, which would escape what it is pasted before)',
    f5.fragment === 'say ' && f5.plain === 'say ', JSON.stringify(f5));
  const L = '# Title here\n- next';
  const f6 = P(L, L.indexOf('Title'), L.length);
  ok('FRAGMENT (Q2): a first line copied from mid-line carries no structure token; the lines after it carry theirs',
    f6.fragment === 'Title here\n- next' && f6.plain === 'Title here\nnext', JSON.stringify(f6));
  const f7 = P(L, 0, L.indexOf('\n'));
  ok('FRAGMENT (Q2): a first line copied from its start carries its structure token', f7.fragment === '# Title here' && f7.plain === 'Title here', JSON.stringify(f7));
  const w = 'go **hello world** on';
  const [s8, e8] = at(w, ' world');
  const f8 = P(w, s8, e8);
  ok('FRAGMENT: a cut run whose selected part starts with a space reopens AFTER the space (a mark before a space would not pair)',
    f8.fragment === ' **world**' && f8.plain === ' world', JSON.stringify(f8));
}

// ---- ROUND: seeded random pages, random selections
let seed = 20261016;
const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
const WORDS = ['the', 'writer', 'kept', 'going', 'past', 'a', 'door', 'x', 'quiet', 'river'];
const word = () => {
  const w = pick(WORDS); const r = rnd();
  if (r < 0.12) return `**${w}**`;
  if (r < 0.20) return `*${w}*`;
  if (r < 0.25) return `__${w}__`;
  if (r < 0.29) return `~~${w}~~`;
  if (r < 0.32) return `***${w}***`;
  if (r < 0.36) return `**${w} ${pick(WORDS)}**`;
  if (r < 0.39) return `__${w} *${pick(WORDS)}*__`;
  if (r < 0.43) return `${B}*${w}${B}*`;
  if (r < 0.45) return `${w}${B}_${w}`;
  if (r < 0.46) return `${B}${B}`;
  if (r < 0.47) return '*';
  return w;
};
const line = () => {
  if (rnd() < 0.1) return '';
  const lead = pick(['', '', '', '', '- ', '# ', '> ', '\t', '>< ', `${B}# `]);
  return lead + Array.from({ length: 1 + Math.floor(rnd() * 9) }, word).join(' ');
};
// the page's truth, read from the source with the one reader: each VISIBLE character and the styles over it
const KINDS = ['bold', 'italic', 'underline', 'strike'];
const styledChars = (text) => {
  const out = [];
  for (const ln of text.split('\n')) {
    const lead = mr.readLead(ln).length;
    const rest = ln.slice(lead);
    const runs = mr.readMarks(rest);
    const hidden = new Set(mr.readEscapes(rest));
    for (const r of runs) { const cl = (r.cmark ?? r.mark).length; for (let k = 0; k < r.mark.length; k++) hidden.add(r.open + k); for (let k = 0; k < cl; k++) hidden.add(r.close + k); }
    for (let i = 0; i < rest.length; i++) {
      if (hidden.has(i)) continue;
      const st = KINDS.filter((kd) => runs.some((r) => r.kind === kd && i >= r.open + r.mark.length && i < r.close)).join('+');
      out.push(rest[i] + ':' + st);
    }
    out.push('\n:');
  }
  out.pop();
  return out;
};
// the same truth for a selection [s, e) of the stored text: the visible characters inside it, with their styles
const styledSlice = (text, s, e) => {
  const out = [];
  let ls = 0;
  for (const ln of text.split('\n')) {
    const le = ls + ln.length;
    if (le >= s && ls <= e) {
      const lead = mr.readLead(ln).length;
      const rest = ln.slice(lead);
      const runs = mr.readMarks(rest);
      const hidden = new Set(mr.readEscapes(rest));
      for (const r of runs) { const cl = (r.cmark ?? r.mark).length; for (let k = 0; k < r.mark.length; k++) hidden.add(r.open + k); for (let k = 0; k < cl; k++) hidden.add(r.close + k); }
      for (let i = 0; i < rest.length; i++) {
        const g = ls + lead + i;
        if (g < s || g >= e || hidden.has(i)) continue;
        const st = KINDS.filter((kd) => runs.some((r) => r.kind === kd && i >= r.open + r.mark.length && i < r.close)).join('+');
        out.push(rest[i] + ':' + st);
      }
    }
    if (le >= s && le < e) out.push('\n:');   // the newline after this line is inside the selection
    ls = le + 1;
  }
  return out;
};
const CASES = Number(process.argv[2]) || 6000;
let plainOk = 0, styleOk = 0, fellBack = 0, lines = 0, cutRuns = 0;
const firstFails = [];
for (let c = 0; c < CASES; c++) {
  const page = Array.from({ length: 1 + Math.floor(rnd() * 4) }, line).join('\n');
  let s = Math.floor(rnd() * (page.length + 1));
  let e = Math.floor(rnd() * (page.length + 1));
  if (s > e) [s, e] = [e, s];
  const p = P(page, s, e);
  const truth = styledSlice(page, s, e);
  const want = truth.map((x) => x.slice(0, x.lastIndexOf(':'))).join('');
  const got = styledChars(p.fragment);
  const fbLines = p.fragment.split('\n').length;
  lines += fbLines;
  fellBack += p.fallbackLines ?? 0;
  if (truth.some((x) => /:./.test(x.slice(x.lastIndexOf(':'))))) cutRuns++;
  const plainGood = p.plain === want && p.fragment.split('\n').map(mr.stripLine).join('\n') === p.plain;
  const styleGood = JSON.stringify(got) === JSON.stringify(truth);
  if (plainGood) plainOk++;
  if (styleGood || (p.fallbackLines ?? 0) > 0) styleOk++;
  if ((!plainGood || !(styleGood || (p.fallbackLines ?? 0) > 0)) && firstFails.length < 4) firstFails.push({ page, s, e, plain: p.plain, want, fragment: p.fragment });
}
console.log(JSON.stringify({ cases: CASES, selectionsWithStyledText: cutRuns, linesCopied: lines, linesFellBackToLiteral: fellBack, firstFails }, null, 2));
ok(`ROUND: on ${CASES} random selections, the plain text is exactly the selection's visible characters, and it is the fragment read as Copy My Words reads it`, plainOk === CASES, `${plainOk}/${CASES}`);
ok(`ROUND: ...and every character the fragment shows carries exactly the styles it carried on the page (or its line fell back to literal text)`, styleOk === CASES, `${styleOk}/${CASES}`);
ok('ROUND (coverage): most selections hold styled text, so the style check is not passing on plain prose', cutRuns >= CASES * 0.5, `${cutRuns}/${CASES}`);
ok('ROUND (fallback rate): at most 1% of the copied lines fall back to literal text - the markup is carried, not given up', fellBack <= lines * 0.01, `${fellBack}/${lines}`);

// ---- ENVELOPE
{
  const p = P('a **b** c');
  let env = null;
  try { env = JSON.parse(cf.writeEnvelope(p)); } catch { /* recorded below */ }
  ok('ENVELOPE: the Wrizo envelope is JSON carrying version 1, the fragment and the plain text it was copied beside',
    !!env && env.v === 1 && env.text === 'a **b** c' && env.plain === 'a b c' && cf.WRIZO_MIME === 'application/x-wrizo-fragment', JSON.stringify(env));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nIN-APP-COPY-FORMAT-CHECK VERIFY: PASS (${checks.length} checks)` : `\nIN-APP-COPY-FORMAT-CHECK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
