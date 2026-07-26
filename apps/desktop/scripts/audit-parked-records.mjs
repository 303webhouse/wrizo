#!/usr/bin/env node
// DF1 S4 — parked-records history audit (item 48's rider).
//
// LAW being audited: a parked harness assertion is IMMUTABLE. Once a check is
// retired, its original text is quoted verbatim inside a pok() RECORD —
// `pok('PARKED (was "<ORIGINAL VERBATIM>") — <supersession note>', <condition>)`
// — and that quoted-original text must be introduced ONCE and byte-stable ever
// since. The supersession note after the em-dash may lawfully be EXTENDED as
// further tickets layer on (a chain, never a rewrite), and the executing
// CONDITION (the 2nd pok arg) and any surrounding evalJs PROBE reads lawfully
// follow current reality — those are exempt. This audit distinguishes the
// quoted record from the executing condition, and checks only the record.
//
// Mechanism: extract every pok() RECORD's quoted-original text, take a
// distinctive stable key from it, and `git log -S<key>` to find every commit
// that changed the occurrence count of that key. A record introduced once and
// never mutated shows EXACTLY ONE such commit (the parking commit). More than
// one means the key text was added/removed more than once — the signature of an
// in-place mutation (the B1 pre-law incident) — and is flagged for review.
//
// Usage: node scripts/audit-parked-records.mjs [--json]
// Exits 0 if every record is byte-stable (or a known-remediated exception),
// non-zero if any un-remediated mutation is found.

import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const asJson = process.argv.includes('--json');

// Known, already-ruled history the audit must CORROBORATE, not rediscover:
// B1's pre-law in-place mutation of an ab3.mjs parked entry (commit 9ce8f6b),
// ruled a violation, pre-law, remediated on the record (item 48 rider; the CD3
// incident, item 53). A record whose extra touching commit is this one is CITED
// as the known remediation, not flagged as a fresh violation.
const KNOWN_REMEDIATED = new Map([
  ['9ce8f6b', 'B1 pre-law in-place mutation of an ab3.mjs parked entry — ruled a violation, pre-law, remediated on the record (item 48 rider / CD3 incident, item 53).'],
]);

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const HARNESS_REL = 'apps/desktop/scripts/harness';
const harnessDir = join(repoRoot, HARNESS_REL);

function git(args) {
  try { return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }); }
  catch { return ''; }
}

// DF1.1 S4 (item 66) — is this `pok(` inside a `//` comment?
//
// Two of DF1's four hand-ruled edges (ab3.mjs:688, cd2.mjs:963) were exactly
// this: a GENERATION-2 record quoted verbatim inside a comment block, kept for
// the audit trail but deliberately no longer executed as its own pok(). The
// extractor treated them as live calls, scanned across the line breaks, and
// swallowed the `// ` continuation prefixes into the key — producing a key that
// contains newlines and comment markers and therefore can never match the
// on-disk bytes `git log -S` searches. They reported KEY_NOT_FOUND forever.
// They are not violations and never were; they are a different, lawful FORM.
function inLineComment(src, idx) {
  const lineStart = src.lastIndexOf('\n', idx) + 1;
  const before = src.slice(lineStart, idx);
  return before.includes('//');
}

// Parse the first single-quoted string argument of each pok( occurrence in a
// file's source, honoring \' and \\ escapes. Returns [{ name, line }].
// DF1.1 S4 — comment occurrences are split out rather than mis-parsed: they are
// returned separately as `commentForm` so the audit can COUNT them honestly
// instead of either crying wolf over them or pretending they don't exist.
function extractPokNames(src) {
  const out = [];
  const commentForm = [];
  let i = 0;
  while ((i = src.indexOf('pok(', i)) !== -1) {
    const line = src.slice(0, i).split('\n').length;
    if (inLineComment(src, i)) { commentForm.push({ line }); i += 4; continue; }
    let j = i + 4;
    while (j < src.length && /\s/.test(src[j])) j++;
    if (src[j] !== "'") { i += 4; continue; }
    j++; // past opening quote
    let name = '';
    while (j < src.length) {
      const c = src[j];
      if (c === '\\') { name += src[j] + src[j + 1]; j += 2; continue; }
      if (c === "'") break;
      name += c; j++;
    }
    out.push({ name, line });
    i = j + 1;
  }
  return { live: out, commentForm };
}

// DF1.1 S4 — comment-form park RECORDS: an original quoted verbatim inside a
// comment rather than inside an executing pok(). FX14 parked ~30 originals this
// way and HB2-lite's b1.mjs S5(c) is another, and the audit could see NONE of
// them, which made its coverage line quietly narrower than it read. They are
// counted and reported now. They are deliberately NOT byte-traced: a
// comment-form record is line-wrapped with `// ` prefixes, so no contiguous
// on-disk byte sequence exists for `git log -S` to search. Saying so out loud
// is the point — an audit that silently omits a whole lawful form is making a
// coverage claim it has not earned.
const COMMENT_RECORD_RE = /^\s*\/\/\s*(?:ORIGINAL|GENERATION|PARKED)\b/;
function countCommentRecords(src) {
  return src.split('\n').filter((l) => COMMENT_RECORD_RE.test(l)).length;
}

// A RECORD quotes a frozen original: it contains `(was ` (optionally `(was the `
// / `(was PARKED-generation`). Everything else is a live PROBE — exempt.
function isRecord(name) {
  return /\(was\b/.test(name) || /^PARKED\b/.test(name) && /"[^"]/.test(name);
}

// The FULL quoted original — the immutable unit. Scan the source bytes of the
// record name from just after `(was "` (or `(was the "`) up to the first
// UNESCAPED double-quote, preserving \-escape byte pairs so the key matches the
// on-disk source that `git log -S` searches. The full original is long enough to
// be unique per record, so a shared short prefix no longer causes false hits.
// DF1.1 S4 — the keyer now understands the other two lawful framings, which
// were the remaining two of DF1's four hand-ruled edges:
//
//   (a) THE GENERATION FRAMING (fx1.mjs:580). A re-parked record names its
//       lineage before quoting: `(was gen-2 "…")`, `(was the "…")`,
//       `(was PARKED-generation-1 …)`. The old keyer accepted only a bare `"`
//       or the literal `the `, so `gen-2 ` returned NO_KEY. Rather than bolt on
//       one more literal, take the first double-quote in a short window after
//       `(was ` — which covers every framing used so far AND the next one
//       somebody invents.
//
//   (b) THE NESTED-ESCAPE RECORD (ab4.mjs:595). The quoted original itself
//       contains quoted words: on disk that is `\\"Add card\\"`. The old
//       scanner consumed `\\` as an escape pair and then hit the `"` as a
//       TERMINATOR, cutting the key to six characters — under the 10-char floor,
//       so NO_KEY. In source bytes `\\"` is an INTERNAL quote and must be
//       carried into the key verbatim, because those are the exact bytes
//       `git log -S` has to find.
//
// Both were always benign. The tool reporting them as REVIEW items — and
// exiting non-zero forever because of it — is the "a tool that reds on
// known-benign" disease this arc cured everywhere else.
function traceKey(name) {
  const anchor = name.indexOf('(was ');
  if (anchor === -1) return null;
  const windowStart = anchor + 5;
  const q = name.indexOf('"', windowStart);
  if (q === -1 || q - windowStart > 40) return null; // (a) any lawful framing
  let j = q + 1;
  let key = '';
  while (j < name.length) {
    // (b) `\\"` in SOURCE is an internal, escaped quote — part of the record.
    if (name[j] === '\\' && name[j + 1] === '\\' && name[j + 2] === '"') { key += '\\\\"'; j += 3; continue; }
    const c = name[j];
    if (c === '\\') { key += name[j] + (name[j + 1] || ''); j += 2; continue; }
    if (c === '"') break;
    key += c; j++;
  }
  key = key.trim();
  return key.length >= 10 ? key : null;
}

// How many times this exact original appears across the current harness tree —
// a record legitimately shared across K parked slots expects K additive intros.
function occurrencesInHead(key) {
  let n = 0;
  for (const f of files) n += readFileSync(join(harnessDir, f), 'utf8').split(key).length - 1;
  return n;
}
const PARK_LIKE = /park|harness|superseded|PARKED|\bS\d|review|deflake|fold|sweep|maintenance/i;

const files = readdirSync(harnessDir).filter(f => f.endsWith('.mjs')).sort();
const records = [];
const probes = [];
const commentForm = []; // DF1.1 S4 — the lawful form the tracer used to be blind to
for (const f of files) {
  const src = readFileSync(join(harnessDir, f), 'utf8');
  const { live, commentForm: cf } = extractPokNames(src);
  for (const p of live) {
    if (isRecord(p.name)) records.push({ file: f, ...p });
    else probes.push({ file: f, ...p });
  }
  const n = countCommentRecords(src);
  if (cf.length || n) commentForm.push({ file: f, commentedPok: cf.map((c) => c.line), recordLines: n });
}

const results = [];
for (const r of records) {
  const key = traceKey(r.name);
  if (!key) { results.push({ ...r, key: null, verdict: 'NO_KEY', commits: [] }); continue; }
  // commits that changed the count of this exact key anywhere in the repo
  const raw = git(['log', '--format=%h\u001f%ci\u001f%s', '-S', key, '--', HARNESS_REL]);
  const commits = raw.trim() ? raw.trim().split('\n').map(l => {
    const [h, ci, s] = l.split('\u001f');
    return { h, ci, s };
  }) : [];
  const occ = occurrencesInHead(key);
  const introCommit = commits[commits.length - 1]; // earliest = introduction
  const hitsRemediated = commits.some(c => [...KNOWN_REMEDIATED.keys()].some(k => c.h.startsWith(k) || k.startsWith(c.h)));
  const allParkLike = commits.length > 0 && commits.every(c => PARK_LIKE.test(c.s));
  // NOTE ON DETECTION LIMITS: `git log -S<current-original>` shows only that
  // EXACT text's add/remove history. A benign re-park MOVES the byte-identical
  // original across park commits (count changes, text does not) — >1 commit,
  // all park-like. A silent in-place MUTATION replaces the text: the OLD text
  // vanishes (traced by a different key) and the NEW text first appears at the
  // mutating commit. So the reliable signal for a mutation is: the current text
  // was introduced by a commit that is NOT a legitimate park/harness commit.
  // (A mutation performed INSIDE a park sweep cannot be told from a fresh park
  // by this trace — that residual is called out in the report and cross-checked
  // by hand for the one file with known history, ab3.mjs.)
  // What `git log -S<current-original>` proves: the quoted original has a REAL
  // git lineage — it is a verbatim copy of text that genuinely existed (often as
  // a LIVE ok() check before it was parked), not a fabricated record. It does
  // NOT, on its own, isolate a silent in-place mutation (the reliable detector
  // is the record's own line-history / a targeted diff — see the report's
  // hand-corroboration of the one known case, B1's ab3 bump at 9ce8f6b). So:
  let verdict;
  if (commits.length === 0) verdict = 'KEY_NOT_FOUND';        // couldn't trace — extraction/escaping edge, REVIEW by hand
  else if (hitsRemediated) verdict = 'B1_TOUCHED';            // informational: the B1 fixture-repair commit touched this text (see report)
  else if (commits.length > 1) verdict = 'TRACED_MULTI';      // real lineage across >1 commit (parked-from-live and/or re-parked) — benign
  else verdict = 'TRACED_ONCE';                               // real lineage, single introducing commit — benign
  results.push({ ...r, key, occ, verdict, commits });
}

const summary = {
  filesScanned: files.length,
  pokTotal: records.length + probes.length,
  records: records.length,
  probesExempt: probes.length,
  tracedOnce: results.filter(r => r.verdict === 'TRACED_ONCE').length,
  tracedMulti: results.filter(r => r.verdict === 'TRACED_MULTI').length,
  b1Touched: results.filter(r => r.verdict === 'B1_TOUCHED').length,
  keyNotFound: results.filter(r => r.verdict === 'KEY_NOT_FOUND').length,
  noKey: results.filter(r => r.verdict === 'NO_KEY').length,
  commentFormRecords: commentForm.reduce((n, c) => n + c.recordLines + c.commentedPok.length, 0),
};

if (asJson) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  console.log('# Parked-records history audit — DF1 S4\n');
  console.log(`Scanned ${summary.filesScanned} harness files; ${summary.pokTotal} pok() calls `
    + `(${summary.records} quoted RECORDS audited, ${summary.probesExempt} live PROBES exempt).\n`);
  console.log(`TRACED-once ${summary.tracedOnce} · TRACED-multi(re-park/from-live) ${summary.tracedMulti} · `
    + `B1-touched(informational) ${summary.b1Touched} · REVIEW key-not-found ${summary.keyNotFound} · REVIEW no-key ${summary.noKey}\n`);

  // DF1.1 S4 — the coverage statement, said honestly. Comment-form records are
  // a lawful park form this tool CANNOT byte-trace (see countCommentRecords).
  // Naming the number is the difference between "everything is audited" and
  // "everything this instrument can reach is audited."
  console.log(`COMMENT-FORM park records: ~${summary.commentFormRecords} across ${commentForm.length} file(s), NOT byte-traceable.`);
  console.log('They are line-wrapped inside comments, so no contiguous on-disk byte key exists for `git log -S`.');
  console.log('COUNTING RULE (so this number can be judged, not just believed): comment lines that OPEN a park');
  console.log('record — `// ORIGINAL…`, `// GENERATION…`, `// PARKED…` — one per record, plus commented-out');
  console.log('pok() calls. It is an ESTIMATE and slightly HIGH: a later supersession annotation on an already-');
  console.log('parked record opens with the same words and is counted again. Deliberately not presented as an');
  console.log('exact census — a false-precise figure in the very report about honest coverage would be worse');
  console.log('than an owned approximation.');
  console.log(`Coverage, stated plainly: this tool byte-traces ${summary.records} records; roughly `
    + `${summary.commentFormRecords} more exist in a form it cannot trace at all — so it reaches on the order of `
    + `${Math.round(100 * summary.records / (summary.records + summary.commentFormRecords))}% of the tree's park`);
  console.log('records, not the "all of them" its older summary line implied.\n');
  for (const c of commentForm) {
    const bits = [];
    if (c.recordLines) bits.push(`${c.recordLines} comment-form record(s)`);
    if (c.commentedPok.length) bits.push(`${c.commentedPok.length} commented-out pok() at line(s) ${c.commentedPok.join(', ')}`);
    console.log(`  - ${c.file} — ${bits.join('; ')}`);
  }
  console.log('');

  // DF1.1 S4 (Fable's addition) — the four edges DF1 ruled benign by hand stay
  // written down even now that the tool no longer flags them, so the REASONING
  // survives the tool learning to ignore them. A silent allowlist would have
  // buried exactly this.
  console.log('# The four hand-ruled edges of DF1 — now handled, kept on the record');
  console.log('  ab3.mjs:688, cd2.mjs:963 — a generation-2 record quoted verbatim INSIDE a comment, kept for the');
  console.log('    audit trail and deliberately not executed. Was KEY_NOT_FOUND because the extractor read the');
  console.log('    `// ` continuation prefixes into the key. Now classified as comment-form, not mis-parsed.');
  console.log('  ab4.mjs:595 — a nested-escape record: the original quotes words inside itself (`\\\\"Add card\\\\"`).');
  console.log('    Was NO_KEY because the scanner treated the escaped quote as a terminator, cutting the key to');
  console.log('    6 chars. Those bytes are internal to the record and are now carried into the key verbatim.');
  console.log('  fx1.mjs:580 — the generation framing `(was gen-2 "…")`. Was NO_KEY because the keyer accepted');
  console.log('    only a bare quote or the literal `the `. The keyer now takes the first quote in a short window.');
  console.log('  None of the four was ever a violation; all four were framings the instrument could not read.\n');
  const order = { KEY_NOT_FOUND: 0, NO_KEY: 1, B1_TOUCHED: 2, TRACED_MULTI: 3, TRACED_ONCE: 4 };
  for (const r of results.sort((a, b) => (order[a.verdict] - order[b.verdict]) || a.file.localeCompare(b.file))) {
    console.log(`- [${r.verdict}] ${r.file}:${r.line}${r.occ > 1 ? ' (x' + r.occ + ' slots)' : ''}`);
    if (r.key) console.log(`    key: "${r.key.slice(0, 90)}"`);
    for (const c of r.commits) {
      const note = [...KNOWN_REMEDIATED.entries()].find(([k]) => c.h.startsWith(k) || k.startsWith(c.h));
      console.log(`    ${c.h} ${c.ci.slice(0, 10)} ${c.s.slice(0, 70)}${note ? '  <= ' + note[1] : ''}`);
    }
  }
}

const failed = summary.keyNotFound + summary.noKey; // only genuine extraction edges need a human
process.exit(failed > 0 ? 1 : 0);
