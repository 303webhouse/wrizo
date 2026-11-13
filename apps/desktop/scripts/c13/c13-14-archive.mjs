#!/usr/bin/env node
// #13 step 14 (Fable, Nov 12): THE PARKED ARCHIVE. A parked record whose successor has been green for two production deploys moves
// VERBATIM to scripts/harness/archive/<file>.parked.md; the live file keeps its successor and a one-line pointer. Browserless.
//
// A RECORD: a run of comment-only lines in scripts/harness/*.mjs that starts with a marker line (PARKED / SUPERSEDED / RETIRED) and holds at
// least one commented assertion (`// ok(` or `// pok(`) - the original kept verbatim in comments. pok() records (they run on the parked leg)
// and `if (false) ok(` lines are code, not records, and never move. Its PARKING COMMIT is the newest commit among its lines (git blame).
// GREEN FOR TWO DEPLOYS (the ledger's deploy tags): the parking commit is an ancestor of both of the last two production deploys -
// #12n (main a1718101) and train 1 (e97dde15). Main is linear and every deploy shipped a green pair, so the successor was green in both.
//
//   node apps/desktop/scripts/c13/c13-14-archive.mjs census [--rev <rev>] [--list]
//        the records at <rev> (default HEAD) and which qualify. Reads git only.
//   node apps/desktop/scripts/c13/c13-14-archive.mjs apply
//        moves every qualifying record of the working tree (which must match HEAD under scripts/harness/) into the archive, replacing
//        each with one pointer line at its own indent. Deterministic: the same HEAD always gives the same result. Commits nothing.
//   node apps/desktop/scripts/c13/c13-14-archive.mjs check [--base <rev>] [--strict] [--plant drop]
//        STRUCTURE (always): every pointer names an archive record that exists, every archive record has exactly one pointer, each
//        archived record says where it came from and its parking commit qualifies, and no archived record is also still live.
//        With --base (the commit before apply; a lane passes its merge-base with main): the brief's proofs -
//          RECORDS: records live at <base> == records live now + records archived since <base> (moved, never lost)
//          LINES:   every line removed from scripts/harness/*.mjs since <base> appears verbatim in an archive record (a multiset compare)
//          POK:     the pok( call count is the same at <base> and now (the parked leg keeps its successor count)
//        --strict (the apply commit itself): every line added to scripts/harness/*.mjs since <base> is a pointer.
//        LIVENESS (always): the same check on an in-memory copy with one archived record dropped must fail.
//        --plant drop: run the check itself on that dropped copy (it must exit red).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CUTOFFS = { '#12n': 'a1718101', 'train 1': 'e97dde15' };
const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const HARNESS = 'apps/desktop/scripts/harness';
const ARCHIVE = `${HARNESS}/archive`;
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const has = (n) => process.argv.includes(n);
const mode = process.argv[2];

const isComment = (l) => /^\s*\/\//.test(l);
const MARK = /PARKED|SUPERSEDED|RETIRED/;
const ASSERT = /^\s*\/\/\s*(\/\/\s*)?p?ok\(/;
// the pointer does not begin with PARKED, so neither this tool's record pattern nor audit-parked-records' comment-form estimate counts it
const POINTER = /^\s*\/\/ ARCHIVED PARK \(#13 step 14\): archive\/([\w.-]+\.parked\.md) record (\d+)\s*$/;
const pointerLine = (indent, archive, n) => `${indent}// ARCHIVED PARK (#13 step 14): archive/${archive} record ${n}`;
const noCR = (s) => s.replace(/\r\n/g, '\n');

// the records of one file's text (lines without CR): [{ from, to }] (0-based, inclusive)
function recordsOf(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!(isComment(lines[i]) && MARK.test(lines[i]) && !POINTER.test(lines[i]))) continue;
    if (i > 0 && isComment(lines[i - 1])) continue;
    let j = i; while (j + 1 < lines.length && isComment(lines[j + 1])) j++;
    if (lines.slice(i, j + 1).some((l) => ASSERT.test(l))) out.push({ from: i, to: j });
    i = j;
  }
  return out;
}

const ancestry = new Map();
const isAncestor = (c, tip) => { const k = `${c}>${tip}`; if (!ancestry.has(k)) { try { git('merge-base', '--is-ancestor', c, tip); ancestry.set(k, true); } catch { ancestry.set(k, false); } } return ancestry.get(k); };
const qualifies = (c) => Object.values(CUTOFFS).every((tip) => isAncestor(c, tip));
const times = new Map();
const timeOf = (c) => { if (!times.has(c)) times.set(c, Number(git('show', '-s', '--format=%ct', c).trim())); return times.get(c); };
function parkingCommits(rev, file, records) {
  const blame = git('blame', '--line-porcelain', rev, '--', file).split('\n');
  const commitOf = [];
  for (const l of blame) { const m = /^([0-9a-f]{40}) \d+ (\d+)/.exec(l); if (m) commitOf[Number(m[2]) - 1] = m[1]; }
  return records.map((r) => [...new Set(commitOf.slice(r.from, r.to + 1))].sort((a, b) => timeOf(b) - timeOf(a))[0]);
}
const harnessFiles = (rev) => git('ls-tree', '--name-only', rev, `${HARNESS}/`).split('\n').filter((f) => f.endsWith('.mjs'));
const showAt = (rev, f) => { try { return noCR(git('show', `${rev}:${f}`)); } catch { return null; } };

function census(rev) {
  const rows = [];
  for (const f of harnessFiles(rev)) {
    const lines = showAt(rev, f).split('\n');
    const recs = recordsOf(lines);
    if (!recs.length) continue;
    const parked = parkingCommits(rev, f, recs);
    recs.forEach((r, k) => rows.push({ file: f, ...r, lines: lines.slice(r.from, r.to + 1), parkedIn: parked[k], qualifies: qualifies(parked[k]) }));
  }
  return rows;
}

// ---- the archive: one markdown file per harness file, each record a section with its verbatim lines in a fence ----
const SECTION = /^## Record (\d+) · from ([\w.-]+\.mjs) lines (\d+)-(\d+) at ([0-9a-f]{40}) · parked in ([0-9a-f]{40})$/;
function parseArchive(text) {
  const recs = []; const ls = noCR(text).split('\n'); let i = 0;
  while (i < ls.length) {
    const m = SECTION.exec(ls[i]);
    if (!m) { i++; continue; }
    if (ls[i + 1] !== '' || ls[i + 2] !== '```js') { recs.push({ n: Number(m[1]), bad: 'malformed section' }); i++; continue; }
    let j = i + 3; const body = [];
    while (j < ls.length && ls[j] !== '```') { body.push(ls[j]); j++; }
    recs.push({ n: Number(m[1]), file: m[2], from: Number(m[3]), to: Number(m[4]), at: m[5], parkedIn: m[6], lines: body });
    i = j + 1;
  }
  return recs;
}
const archiveHeader = (file) => `# Parked records archived from ${file} (#13 step 14)\n\nEach record below is a parked check's original, moved VERBATIM out of \`scripts/harness/${file}\` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.\n`;

function apply() {
  const head = git('rev-parse', 'HEAD').trim();
  const dirty = git('status', '--porcelain', '--', HARNESS).trim();
  if (dirty) { console.error(`apply refuses: ${HARNESS} differs from HEAD (commit or stash first):\n${dirty}`); process.exit(2); }
  const rows = census(head).filter((r) => r.qualifies);
  const byFile = new Map();
  for (const r of rows) { if (!byFile.has(r.file)) byFile.set(r.file, []); byFile.get(r.file).push(r); }
  fs.mkdirSync(path.join(ROOT, ARCHIVE), { recursive: true });
  let moved = 0;
  for (const [file, recs] of byFile) {
    const abs = path.join(ROOT, file);
    const raw = fs.readFileSync(abs, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const lines = noCR(raw).split('\n');
    const base = path.basename(file);
    const archName = `${base}.parked.md`;
    const archAbs = path.join(ROOT, ARCHIVE, archName);
    const existing = fs.existsSync(archAbs) ? parseArchive(fs.readFileSync(archAbs, 'utf8')) : [];
    let n = existing.reduce((m, r) => Math.max(m, r.n || 0), 0);
    let text = fs.existsSync(archAbs) ? noCR(fs.readFileSync(archAbs, 'utf8')).replace(/\n*$/, '\n') : archiveHeader(base);
    for (const r of recs) {   // in file order: numbering follows the file
      n += 1;
      text += `\n## Record ${n} · from ${base} lines ${r.from + 1}-${r.to + 1} at ${head} · parked in ${r.parkedIn}\n\n\`\`\`js\n${r.lines.join('\n')}\n\`\`\`\n`;
      r.n = n;
    }
    for (const r of recs.slice().sort((a, b) => b.from - a.from)) {   // bottom-up, so the earlier line numbers stay put
      const indent = /^(\s*)/.exec(lines[r.from])[1];
      lines.splice(r.from, r.to - r.from + 1, pointerLine(indent, archName, r.n));
      moved += 1;
    }
    fs.writeFileSync(abs, lines.join(eol));
    fs.writeFileSync(archAbs, text.replace(/\n/g, eol === '\r\n' ? '\r\n' : '\n'));
  }
  console.log(`C13-14 APPLY: ${moved} records moved into ${byFile.size} archive files from HEAD ${head.slice(0, 8)}; nothing committed. Next: check --base ${head.slice(0, 8)} --strict`);
}

// ---- check ----
function readNow() {
  const files = fs.readdirSync(path.join(ROOT, HARNESS)).filter((f) => f.endsWith('.mjs')).map((f) => `${HARNESS}/${f}`);
  const live = new Map(files.map((f) => [f, noCR(fs.readFileSync(path.join(ROOT, f), 'utf8'))]));
  const archDir = path.join(ROOT, ARCHIVE);
  const archives = new Map(fs.existsSync(archDir) ? fs.readdirSync(archDir).filter((f) => f.endsWith('.parked.md')).map((f) => [f, parseArchive(fs.readFileSync(path.join(archDir, f), 'utf8'))]) : []);
  return { live, archives };
}
const lineBag = (lines) => { const m = new Map(); for (const l of lines) m.set(l, (m.get(l) || 0) + 1); return m; };
const bagMinus = (a, b) => { const out = []; for (const [l, c] of a) { const d = c - (b.get(l) || 0); for (let k = 0; k < d; k++) out.push(l); } return out; };

function check(state, baseRev, strict) {
  const fails = [];
  const { live, archives } = state;
  // STRUCTURE
  const pointers = [];
  for (const [f, text] of live) text.split('\n').forEach((l, i) => { const m = POINTER.exec(l); if (m) pointers.push({ f, line: i + 1, archive: m[1], n: Number(m[2]) }); });
  const seen = new Map();
  for (const p of pointers) {
    const recs = archives.get(p.archive);
    const rec = recs && recs.find((r) => r.n === p.n);
    if (!rec) fails.push(`POINTER names no record: ${p.f}:${p.line} -> ${p.archive} record ${p.n}`);
    else if (`${HARNESS}/${rec.file}` !== p.f) fails.push(`POINTER in ${p.f} names a record from ${rec.file}`);
    const k = `${p.archive}#${p.n}`; seen.set(k, (seen.get(k) || 0) + 1);
  }
  let archived = 0;
  for (const [a, recs] of archives) for (const r of recs) {
    archived += 1;
    if (r.bad) { fails.push(`ARCHIVE ${a} record ${r.n}: ${r.bad}`); continue; }
    if ((seen.get(`${a}#${r.n}`) || 0) !== 1) fails.push(`ARCHIVE ${a} record ${r.n} has ${seen.get(`${a}#${r.n}`) || 0} pointers (needs exactly 1)`);
    if (!qualifies(r.parkedIn)) fails.push(`ARCHIVE ${a} record ${r.n}: parked in ${r.parkedIn.slice(0, 8)}, which is not in both deploys`);
    if (!recordsOf(r.lines).length) fails.push(`ARCHIVE ${a} record ${r.n}: its lines are not a record`);
    const liveText = live.get(`${HARNESS}/${r.file}`) || '';
    if (r.lines.length && liveText.includes(r.lines.join('\n'))) fails.push(`ARCHIVE ${a} record ${r.n} is also still live in ${r.file}`);
  }
  const out = { pointers: pointers.length, archived, fails };
  if (!baseRev) return out;
  // the brief's proofs against <base>
  const baseFiles = harnessFiles(baseRev);
  let recordsBase = 0, recordsNow = 0, pokBase = 0, pokNow = 0;
  const pokCount = (t) => t.split('\n').filter((l) => !isComment(l) && /\bpok\(/.test(l)).length;
  const removed = [], added = [];
  for (const f of new Set([...baseFiles, ...live.keys()])) {
    const b = baseFiles.includes(f) ? showAt(baseRev, f) : '';
    const n = live.get(f) ?? '';
    recordsBase += recordsOf(b.split('\n')).length; recordsNow += recordsOf(n.split('\n')).length;
    pokBase += pokCount(b); pokNow += pokCount(n);
    removed.push(...bagMinus(lineBag(b.split('\n')), lineBag(n.split('\n'))));
    added.push(...bagMinus(lineBag(n.split('\n')), lineBag(b.split('\n'))));
  }
  const archivedBase = (() => { try { return git('ls-tree', '--name-only', baseRev, `${ARCHIVE}/`).split('\n').filter((f) => f.endsWith('.parked.md')).reduce((s, f) => s + parseArchive(git('show', `${baseRev}:${f}`)).length, 0); } catch { return 0; } })();
  const movedSince = archived - archivedBase;
  if (recordsBase !== recordsNow + movedSince) fails.push(`RECORDS: ${recordsBase} live at base, ${recordsNow} live now + ${movedSince} archived since (a record was lost or added)`);
  if (pokBase !== pokNow) fails.push(`POK: ${pokBase} pok( calls at base, ${pokNow} now`);
  const archBag = lineBag([...archives.values()].flatMap((recs) => recs.flatMap((r) => r.lines || [])));
  const baseArchBag = lineBag((() => { try { return git('ls-tree', '--name-only', baseRev, `${ARCHIVE}/`).split('\n').filter((f) => f.endsWith('.parked.md')).flatMap((f) => parseArchive(git('show', `${baseRev}:${f}`)).flatMap((r) => r.lines || [])); } catch { return []; } })());
  const newlyArchived = lineBag(bagMinus(archBag, baseArchBag));
  const unaccounted = bagMinus(lineBag(removed.filter((l) => isComment(l) || l.trim() === '')), newlyArchived).filter((l) => l.trim() !== '');
  if (unaccounted.length) fails.push(`LINES: ${unaccounted.length} removed comment lines are in no archive record (first: ${JSON.stringify(unaccounted[0].slice(0, 80))})`);
  if (strict) {
    const removedCode = removed.filter((l) => l.trim() !== '' && !isComment(l));
    if (removedCode.length) fails.push(`STRICT: ${removedCode.length} non-comment lines removed (first: ${JSON.stringify(removedCode[0].slice(0, 80))})`);
    const notPointer = added.filter((l) => l.trim() !== '' && !POINTER.test(l));
    if (notPointer.length) fails.push(`STRICT: ${notPointer.length} added lines are not pointers (first: ${JSON.stringify(notPointer[0].slice(0, 80))})`);
  }
  return { ...out, recordsBase, recordsNow, movedSince, pokBase, pokNow, removed: removed.length };
}
const dropOne = (state) => {
  const archives = new Map(state.archives);
  const victim = [...archives.entries()].find(([, recs]) => recs.length);
  if (victim) archives.set(victim[0], victim[1].slice(0, -1));
  return { live: state.live, archives, dropped: victim ? `${victim[0]} record ${victim[1][victim[1].length - 1].n}` : null };
};

if (mode === 'census') {
  const rev = arg('--rev') || 'HEAD';
  const rows = census(rev);
  const q = rows.filter((r) => r.qualifies);
  const files = new Set(rows.map((r) => r.file)), qFiles = new Set(q.map((r) => r.file));
  console.log(`C13-14 CENSUS at ${git('rev-parse', '--short', rev).trim()}: ${rows.length} records in ${files.size} files (${rows.reduce((s, r) => s + r.lines.length, 0)} lines); ${q.length} qualify (parked in a commit inside both ${Object.entries(CUTOFFS).map(([k, v]) => `${k} ${v}`).join(' and ')}) in ${qFiles.size} files (${q.reduce((s, r) => s + r.lines.length, 0)} lines)`);
  if (has('--list')) for (const r of rows) console.log(`${r.qualifies ? 'MOVE' : 'STAY'}  ${r.file.replace(`${HARNESS}/`, '')}:${r.from + 1}-${r.to + 1}  parked in ${r.parkedIn.slice(0, 8)}  ${r.lines[0].trim().slice(0, 90)}`);
} else if (mode === 'apply') {
  apply();
} else if (mode === 'check') {
  const baseRev = arg('--base');
  const strict = has('--strict');
  const now = readNow();
  if (has('--plant')) {
    const d = dropOne(now);
    const r = check(d, baseRev, strict);
    console.log(`PLANTED: dropped ${d.dropped}`);
    for (const f of r.fails.slice(0, 6)) console.log(`FAIL  ${f}`);
    console.log(r.fails.length ? `C13-14 CHECK: FAIL (${r.fails.length})` : 'C13-14 CHECK: PASS');
    process.exit(r.fails.length ? 1 : 0);
  }
  const r = check(now, baseRev, strict);
  // LIVENESS: one archived record dropped must be red (only meaningful once something is archived)
  const d = dropOne(now);
  const live = d.dropped ? check(d, baseRev, strict).fails.length > 0 : true;
  if (!live) r.fails.push('LIVENESS: a dropped archive record was NOT caught');
  console.log(`STRUCTURE: ${r.pointers} pointers, ${r.archived} archived records`);
  if (baseRev) console.log(`AGAINST ${baseRev}: records ${r.recordsBase} at base = ${r.recordsNow} live + ${r.movedSince} archived since; pok( ${r.pokBase} -> ${r.pokNow}; ${r.removed} lines removed${strict ? ' (strict)' : ''}`);
  console.log(`LIVENESS: ${d.dropped ? `dropping ${d.dropped} is ${live ? 'caught' : 'NOT caught'}` : 'nothing archived yet (no record to drop)'}`);
  for (const f of r.fails.slice(0, 12)) console.log(`FAIL  ${f}`);
  console.log(r.fails.length ? `\nC13-14 CHECK: FAIL (${r.fails.length})` : '\nC13-14 CHECK: PASS');
  process.exit(r.fails.length ? 1 : 0);
} else {
  console.error('usage: c13-14-archive.mjs census [--rev <rev>] [--list] | apply | check [--base <rev>] [--strict] [--plant drop]');
  process.exit(2);
}
