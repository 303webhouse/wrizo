// CI-MERGE (Oct 29, the harness on GitHub Actions): fold the shard logs of a run into ONE log per leg, in run-suite's own line shape, plus a
// summary Chat 1 can read in a minute. Optionally compares each file to a box log (the parity table: file -> box verdict -> Actions verdict).
//   node scripts/ci-merge.mjs --in <dir of suite-<leg>-<n>/run.log> --out <dir> [--box-default <log>] [--box-parked <log>]
// ADVISORY: a merged log is not a box-stamped pair. It carries no tree/bundle stamp from the box and says so on its first line.
// Exit 0 when every leg is clean (every file OK) and every shard reported; 1 otherwise.
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const IN = arg('in', null), OUT = arg('out', null);
if (!IN || !OUT) { console.error('usage: ci-merge.mjs --in <dir> --out <dir> [--box-default log] [--box-parked log]'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const ROW = /^\[\d+\/\d+\] (\w+) +exit=(-?\d+) +(\d+)s (\S+\.mjs) :: (.*)$/;
const parse = (file) => {
  const m = new Map();
  for (const l of readFileSync(file, 'utf8').split(/\r?\n/)) { const x = ROW.exec(l); if (x) m.set(x[4], { st: x[1], exit: +x[2], s: +x[3], v: x[5] }); }
  return m;
};

const shards = {};
for (const d of readdirSync(IN, { withFileTypes: true })) {
  const x = /^suite-(default|parked)-(\d+)$/.exec(d.name);
  if (!d.isDirectory() || !x) continue;
  (shards[x[1]] ||= []).push({ idx: +x[2], log: path.join(IN, d.name, 'run.log') });
}

const out = [];
let clean = true;
for (const leg of ['default', 'parked']) {
  if (!shards[leg]) continue;
  const box = arg('box-' + leg, null) && existsSync(arg('box-' + leg)) ? parse(arg('box-' + leg)) : null;
  const rows = new Map(); const missing = [];
  for (const s of shards[leg].sort((a, b) => a.idx - b.idx)) {
    if (!existsSync(s.log)) { missing.push(s.idx); continue; }
    for (const [f, r] of parse(s.log)) rows.set(f, r);
  }
  const names = [...rows.keys()].sort();
  const bad = names.filter((f) => rows.get(f).st !== 'OK');
  const total = names.reduce((n, f) => n + rows.get(f).s, 0);
  const ok = !bad.length && !missing.length;
  if (!ok) clean = false;
  const merged = [`MERGED FROM ${shards[leg].length} GITHUB-ACTIONS SHARD(S), ${leg} leg, ${names.length} files. ADVISORY: not a box-stamped pair.`];
  names.forEach((f, i) => { const r = rows.get(f); merged.push(`[${String(i + 1).padStart(2, '0')}/${names.length}] ${r.st.padEnd(9)} exit=${r.exit} ${String(r.s).padStart(4)}s ${f} :: ${r.v}`); });
  merged.push(`MERGED RESULT (${leg}): ${ok ? 'CLEAN' : 'NOT CLEAN'} - ${names.length - bad.length}/${names.length} OK${missing.length ? `; shard(s) with no log: ${missing.join(',')}` : ''}`);
  writeFileSync(path.join(OUT, `pair-${leg}.log.txt`), merged.join('\n') + '\n');

  out.push(`### ${leg} leg - ${ok ? 'CLEAN' : 'NOT CLEAN'}`, '', `${names.length - bad.length}/${names.length} files OK; ${shards[leg].length} shards; ${total}s of file time.${missing.length ? ` **Shard(s) with no log: ${missing.join(', ')}**` : ''}`, '');
  if (bad.length) { out.push('| file | Actions verdict |', '|---|---|'); for (const f of bad) out.push(`| ${f} | ${rows.get(f).st}: ${rows.get(f).v.slice(0, 140)} |`); out.push(''); }
  if (box) {
    const same = [], diff = [], onlyHere = [], onlyBox = [...box.keys()].filter((f) => !rows.has(f));
    for (const f of names) {
      const b = box.get(f), a = rows.get(f);
      if (!b) { onlyHere.push(f); continue; }
      (b.st === a.st && b.v.replace(/\s+/g, ' ') === a.v.replace(/\s+/g, ' ') ? same : diff).push(f);
    }
    out.push(`**Parity vs the box log:** ${same.length} identical verdict lines, ${diff.length} different, ${onlyHere.length} not in the box log, ${onlyBox.length} box files not run here.`, '');
    if (diff.length) { out.push('| file | box | Actions |', '|---|---|---|'); for (const f of diff) out.push(`| ${f} | ${box.get(f).st}: ${box.get(f).v.slice(0, 110)} | ${rows.get(f).st}: ${rows.get(f).v.slice(0, 110)} |`); out.push(''); }
  }
}
if (!out.length) { out.push('No shard logs found.'); clean = false; }
writeFileSync(path.join(OUT, 'summary.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
process.exit(clean ? 0 : 1);
