#!/usr/bin/env node
// #13 step 3 (docs/cleanup/deploy-13-brief.md): docs/open-threads.md keeps OPEN items only; every closed section moves VERBATIM
// to docs/ledger/<YYYY-MM>.md, in date order. Browserless. Chat 1 owns the ledger and the open list, and runs `split` at merge.
//
//   node apps/desktop/scripts/c13/c13-3-ledger.mjs propose   write docs/ledger/open-list.txt: a FIRST READING for Chat 1 to correct
//   node apps/desktop/scripts/c13/c13-3-ledger.mjs split     cut docs/open-threads.md by the open list (rewrites it, writes docs/ledger/*.md)
//   node apps/desktop/scripts/c13/c13-3-ledger.mjs check [--ref <git ref>] [--plant drop|dup|new]
//        the proof: every line of the ledger at <ref> (default HEAD) appears exactly once across the new files; the only new lines
//        are generated ones (each ends with the marker below) and blank lines next to them. --plant: the same check on a mutated set: must FAIL.
//
// A section is a `## ` heading and every line up to the next one. Its date is the first YYYY-MM-DD in its heading, else in its first
// 15 lines, else the date of the section before it.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const LEDGER = 'docs/open-threads.md';
const DIR = path.join(ROOT, 'docs', 'ledger');
const OPEN_LIST = path.join(DIR, 'open-list.txt');
const MARK = ' <!-- c13-3 -->';
const DATE = /20\d\d-\d\d-\d\d/;
const EOL = (t) => (t.includes('\r\n') ? '\r\n' : '\n');

function sections(text) {
  const lines = text.split(/\r?\n/);
  const starts = lines.map((l, i) => (/^## /.test(l) ? i : -1)).filter((i) => i >= 0);
  const pre = lines.slice(0, starts[0]);
  let last = '2026-07-12';
  const secs = starts.map((s, k) => {
    const body = lines.slice(s, k + 1 < starts.length ? starts[k + 1] : lines.length);
    const d = (body[0].match(DATE) || body.slice(0, 15).join('\n').match(DATE) || [last])[0];
    last = d;
    const item = (body[0].match(/\bITEM\s+(\d+[A-Za-z]?)\b/i) || [])[1];
    return { pos: k, heading: body[0], body, date: d, month: d.slice(0, 7), item: item ? item.toUpperCase() : null };
  });
  return { pre, secs };
}

const CLOSE = /CLOSED|MERGED|SHIPPED|LIVE AND VERIFIED|DEPLOYED|RETIRED|\bDONE\b|LANDED|CLEARED/i;
const OPENW = /OPENS|\bOPEN\b|HELD|WAITING|NOT SHIPPED|PENDING|REOPEN|BLOCKED|DEFERRED|OFFERED|FOR ANY FRESH SESSION/i;

function propose() {
  const { secs } = sections(fs.readFileSync(path.join(ROOT, LEDGER), 'utf8'));
  // An ITEM is open when its latest section (by date, then position) is not a closing one. Other sections read their own heading.
  const latest = new Map();
  for (const s of secs) if (s.item) { const p = latest.get(s.item); if (!p || s.date > p.date || (s.date === p.date && s.pos > p.pos)) latest.set(s.item, s); }
  const open = secs.filter((s) => (s.item ? latest.get(s.item) === s && !CLOSE.test(s.heading.replace(/NOT SHIPPED/i, '')) : OPENW.test(s.heading) && !CLOSE.test(s.heading)));
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(OPEN_LIST, ['# #13 step 3 - the open list. Chat 1 owns it. One exact `## ` heading per line; that section stays in docs/open-threads.md.',
    '# Seeded by `propose` from the headings alone (an ITEM is open when its latest section is not a closing one): a first reading, not a verdict.',
    '# Delete a line to archive that section; add a heading to keep one.', ...open.map((s) => s.heading)].join('\n') + '\n');
  console.log(`sections ${secs.length}; proposed open ${open.length} (items ${open.filter((s) => s.item).length}, other ${open.filter((s) => !s.item).length}); wrote ${path.relative(ROOT, OPEN_LIST)}`);
}

function readOpenList() {
  return new Set(fs.readFileSync(OPEN_LIST, 'utf8').split(/\r?\n/).filter((l) => l.startsWith('## ')));
}

function split() {
  const text = fs.readFileSync(path.join(ROOT, LEDGER), 'utf8');
  const { pre, secs } = sections(text);
  const keep = readOpenList();
  const missing = [...keep].filter((h) => !secs.some((s) => s.heading === h));
  if (missing.length) { console.log(`STOP: ${missing.length} open-list headings are not in the ledger:`, missing.slice(0, 5)); process.exit(1); }
  const open = secs.filter((s) => keep.has(s.heading));
  const closed = secs.filter((s) => !keep.has(s.heading));
  const months = [...new Set(closed.map((s) => s.month))].sort();
  const monthsOfItem = (item, self) => [...new Set(closed.filter((s) => s.item === item && s !== self).map((s) => s.month))].sort();
  const out = [...pre, `**#13 step 3:** open items only. Closed sections moved verbatim, by month: ${months.map((m) => `[${m}](ledger/${m}.md)`).join(' · ')}.${MARK}`, ''];
  for (const s of open) {
    out.push(s.body[0]);
    const hist = s.item ? monthsOfItem(s.item, s) : [];
    if (hist.length) out.push(`History of ITEM ${s.item}: ${hist.map((m) => `[${m}](ledger/${m}.md)`).join(' · ')}${MARK}`);
    out.push(...s.body.slice(1));
  }
  fs.writeFileSync(path.join(ROOT, LEDGER), out.join(EOL(text)));
  fs.mkdirSync(DIR, { recursive: true });
  for (const m of months) {
    const ms = closed.filter((s) => s.month === m).sort((a, b) => a.date.localeCompare(b.date) || a.pos - b.pos);
    fs.writeFileSync(path.join(DIR, `${m}.md`), [`# Ledger archive · ${m} (closed sections, moved verbatim from docs/open-threads.md, in date order)${MARK}`, '',
      ...ms.flatMap((s) => s.body)].join(EOL(text)));
  }
  console.log(`open ${open.length} sections kept; closed ${closed.length} moved into ${months.length} months (${months.join(', ')})`);
}

function check() {
  const a = process.argv;
  const ref = a.includes('--ref') ? a[a.indexOf('--ref') + 1] : 'HEAD';
  const plant = a.includes('--plant') ? a[a.indexOf('--plant') + 1] : null;
  const old = execFileSync('git', ['show', `${ref}:${LEDGER}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split(/\r?\n/);
  const files = [LEDGER, ...fs.readdirSync(DIR).filter((f) => /^\d{4}-\d\d\.md$/.test(f)).map((f) => `docs/ledger/${f}`)];
  let neu = files.flatMap((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/));
  const firstReal = neu.findIndex((l) => l.trim() && !l.endsWith(MARK) && l.startsWith('## '));
  if (plant === 'drop') neu.splice(firstReal, 1);
  if (plant === 'dup') neu.push(neu[firstReal]);
  if (plant === 'new') neu.push('an unmarked line that was never in the ledger');
  const count = (xs) => xs.reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());
  const generated = neu.filter((l) => l.endsWith(MARK));
  const o = count(old.filter((l) => l.trim())), n = count(neu.filter((l) => l.trim() && !l.endsWith(MARK)));
  const fails = [];
  for (const [l, c] of o) if ((n.get(l) ?? 0) !== c) fails.push(`old line x${c}, new x${n.get(l) ?? 0}: ${l.slice(0, 100)}`);
  for (const [l, c] of n) if (!o.has(l)) fails.push(`new line x${c} that the ledger never had: ${l.slice(0, 100)}`);
  const ob = old.filter((l) => !l.trim()).length, nb = neu.filter((l) => !l.trim()).length;
  if (nb < ob - files.length || nb > ob + generated.length + files.length) fails.push(`blank lines ${ob} -> ${nb}, outside what the generated lines allow`);
  for (const g of generated) if (!/^(\*\*#13 step 3:\*\*|History of ITEM |# Ledger archive · )/.test(g)) fails.push(`a marked line of an unknown shape: ${g.slice(0, 100)}`);
  // Each archive section sits in the month of its own date.
  for (const f of files.slice(1)) {
    const m = f.match(/(\d{4}-\d\d)\.md$/)[1];
    for (const s of sections(fs.readFileSync(path.join(ROOT, f), 'utf8')).secs) if (s.month !== m) fails.push(`${f}: a section dated ${s.date}: ${s.heading.slice(0, 80)}`);
  }
  console.log(`ref ${ref}; old ledger ${old.length} lines (${o.size} distinct non-blank); new files ${files.length}, ${neu.length} lines, ${generated.length} generated${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails.slice(0, 15)) console.log('FAIL', f);
  console.log(fails.length ? `VERIFY: FAIL (${fails.length})` : 'VERIFY: PASS');
  process.exit(fails.length ? 1 : 0);
}

({ propose, split, check }[process.argv[2]] ?? (() => { console.log('usage: propose | split | check [--ref R] [--plant drop|dup|new]'); process.exit(1); }))();
