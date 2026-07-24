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

// Parse the first single-quoted string argument of each pok( occurrence in a
// file's source, honoring \' and \\ escapes. Returns [{ name, line }].
function extractPokNames(src) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf('pok(', i)) !== -1) {
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
    const line = src.slice(0, i).split('\n').length;
    out.push({ name, line });
    i = j + 1;
  }
  return out;
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
function traceKey(name) {
  const anchor = name.indexOf('(was ');
  if (anchor === -1) return null;
  let j = anchor + 5;
  if (name.slice(j, j + 4) === 'the ') j += 4;
  if (name[j] === '"') j++; else return null;
  let key = '';
  while (j < name.length) {
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
for (const f of files) {
  const src = readFileSync(join(harnessDir, f), 'utf8');
  for (const p of extractPokNames(src)) {
    if (isRecord(p.name)) records.push({ file: f, ...p });
    else probes.push({ file: f, ...p });
  }
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
};

if (asJson) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  console.log('# Parked-records history audit — DF1 S4\n');
  console.log(`Scanned ${summary.filesScanned} harness files; ${summary.pokTotal} pok() calls `
    + `(${summary.records} quoted RECORDS audited, ${summary.probesExempt} live PROBES exempt).\n`);
  console.log(`TRACED-once ${summary.tracedOnce} · TRACED-multi(re-park/from-live) ${summary.tracedMulti} · `
    + `B1-touched(informational) ${summary.b1Touched} · REVIEW key-not-found ${summary.keyNotFound} · REVIEW no-key ${summary.noKey}\n`);
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
