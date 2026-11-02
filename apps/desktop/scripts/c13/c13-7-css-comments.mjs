#!/usr/bin/env node
// #13 step 7 (brief; Fable's comment ruling, Oct 29): in src/styles/*, a comment stays only if it explains WHY non-obvious code is
// as it is, citing its ruling id. Ruling HISTORY (supersessions, parks, who said what and when) moves VERBATIM to
// docs/rulings/css-<file>.md, under that id. Browserless.
//
//   node apps/desktop/scripts/c13/c13-7-css-comments.mjs list [--all]
//        print every history-marked comment block (or every block): its key (file#ordinal), hash, line and text, for the spec
//   node apps/desktop/scripts/c13/c13-7-css-comments.mjs apply <spec.json>
//        spec: [{ key, hash, why }]: each block (found by its hash, which must be unique in its file) moves verbatim to docs/rulings/css-<stem>.md as
//        "## <stem> §<n>"; in the CSS it becomes "/* <why> [<stem> §<n>] */", or goes entirely when why is ""
//   node apps/desktop/scripts/c13/c13-7-css-comments.mjs check --base <rev> [--plant drop|edit|rule|cite]
//        the proof: (1) with every comment stripped, each styles file is the base's, byte for byte (no rule moved or changed);
//        (2) every comment block removed or rewritten since the base is in docs/rulings/, verbatim (a block multiset: as many
//        copies as were removed); (3) every [<stem> §<n>] cited in the CSS is a heading in its rulings file, and every heading is
//        cited; (4) no history marker is left in a CSS comment. --plant: the same check on a mutated input: must FAIL.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const STYLES = 'apps/desktop/src/styles';
const RULINGS = 'docs/rulings';
const arg = (n) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : null);
const noCR = (s) => s.replace(/\r\n/g, '\n');
const hash = (s) => crypto.createHash('sha1').update(noCR(s)).digest('hex').slice(0, 10);
const stemOf = (f) => f.replace(/^\d+-/, '').replace(/\.css$/, '');

// History: a date, a name, a supersession or park, a ledger / box / item / commit reference. A ticket id alone (BG1 S2) is not
// history: it is the ruling id a why-comment cites.
export const HISTORY = /SUPERSEDED|PARKED|\bNick\b|\bFable\b|\bledger\b|\b20\d\d-\d\d-\d\d\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b|\bruled\b|\bruling\b|\bitem \d|\bbox (run|turn)\b|\bturn \d|\b(on|@) ?[0-9a-f]{7,8}\b/;
const CITE = /\[([a-z0-9-]+) §(\d+)\]/g;

// Comment blocks, outside strings: { start, end, text } (offsets into the text)
function blocks(text) {
  const out = [];
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2) + 2;
      out.push({ start: i, end, text: text.slice(i, end) });
      i = end - 1;
    }
  }
  return out;
}
const lineOf = (text, at) => text.slice(0, at).split('\n').length;
const files = () => fs.readdirSync(path.join(ROOT, STYLES)).filter((f) => f.endsWith('.css')).sort();
const read = (f) => fs.readFileSync(path.join(ROOT, STYLES, f), 'utf8');

function list() {
  const all = process.argv.includes('--all');
  let n = 0;
  for (const f of files()) {
    const t = read(f);
    blocks(t).forEach((b, k) => {
      if (!all && !HISTORY.test(b.text)) return;
      n++;
      console.log(`=== ${f}#${k} ${hash(b.text)} L${lineOf(t, b.start)}\n${noCR(b.text)}`);
    });
  }
  console.log(`--- ${n} blocks`);
}

function apply() {
  const spec = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  const base = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const byFile = new Map();
  for (const e of spec) { const f = e.key.split('#')[0]; if (!byFile.has(f)) byFile.set(f, []); byFile.get(f).push(e); }
  for (const [f, entries] of byFile) {
    let t = read(f);
    const eol = t.includes('\r\n') ? '\r\n' : '\n';
    const bs = blocks(t);
    const stem = stemOf(f);
    const rulingsFile = path.join(ROOT, RULINGS, `css-${stem}.md`);
    const existing = fs.existsSync(rulingsFile) ? noCR(fs.readFileSync(rulingsFile, 'utf8')) : null;
    let nextId = existing ? Math.max(0, ...[...existing.matchAll(/^## [a-z0-9-]+ §(\d+)$/gm)].map((m) => Number(m[1]))) + 1 : 1;
    const plan = entries.map((e) => {
      // found by its hash within the file (the ordinal in the key is where it was listed; a block above it may have gone since)
      const hits = bs.filter((x) => hash(x.text) === e.hash);
      if (hits.length !== 1) throw new Error(`${e.key}: ${hits.length} blocks in ${f} carry hash ${e.hash}`);
      const b = hits[0];
      if (/[{}]/.test(e.why)) throw new Error(`${e.key}: a why-line may not hold a brace`);
      return { ...e, b, id: nextId++, line: lineOf(t, b.start) };
    }).sort((x, y) => y.b.start - x.b.start);
    const md = [];
    for (const p of plan) {
      const cite = `${stem} §${p.id}`;
      let s = p.b.start, e = p.b.end;
      if (p.why) t = t.slice(0, s) + `/* ${p.why} [${cite}] */` + t.slice(e);
      else {
        // the block goes: and its own line(s) with it when nothing else shares them
        const ls = t.lastIndexOf('\n', s - 1) + 1, le = t.indexOf('\n', e);
        const before = t.slice(ls, s), after = t.slice(e, le < 0 ? t.length : le).replace(/\r$/, '');
        if (!before.trim() && !after.trim()) { s = ls; e = le < 0 ? t.length : le + 1; }
        else if (!after.trim()) { s = ls + before.replace(/\s+$/, '').length; }
        t = t.slice(0, s) + t.slice(e);
      }
      md.unshift(`## ${cite}\n\nFrom \`${STYLES}/${f}\`, line ${p.line} at \`${base}\`${p.why ? ` (the comment that stays: "${p.why}")` : ' (no comment stays: the rule reads plainly)'}.\n\n\`\`\`css\n${noCR(p.b.text)}\n\`\`\`\n`);
    }
    fs.writeFileSync(path.join(ROOT, STYLES, f), t.replace(/\r?\n/g, eol));
    fs.mkdirSync(path.dirname(rulingsFile), { recursive: true });
    const head = existing ?? `# Rulings: \`${STYLES}/${f}\`\n\nRuling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that\ncites \`[${stem} §n]\` points here.\n\n`;
    fs.writeFileSync(rulingsFile, head.replace(/\n*$/, '\n\n') + md.join('\n'));
    console.log(`${f}: ${plan.length} blocks moved (${plan.filter((p) => p.why).length} leave a why-line)`);
  }
}

const strip = (t) => noCR(blocks(t).reduceRight((s, b) => s.slice(0, b.start) + s.slice(b.end), t)).split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim()).join('\n');

function check() {
  const base = arg('base');
  const plant = arg('plant');
  if (!base) { console.log('check needs --base <rev>'); process.exit(1); }
  const show = (f) => noCR(execFileSync('git', ['show', `${base}:${STYLES}/${f}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));
  const fails = [];
  const rulingsTexts = fs.existsSync(path.join(ROOT, RULINGS)) ? fs.readdirSync(path.join(ROOT, RULINGS)).filter((f) => /^css-.*\.md$/.test(f))
    .map((f) => [f, noCR(fs.readFileSync(path.join(ROOT, RULINGS, f), 'utf8'))]) : [];
  const moved = new Map();   // block text -> copies held in docs/rulings
  const heads = new Map();   // "<stem> §n" -> rulings file
  for (const [f, s] of rulingsTexts) {
    for (const m of s.matchAll(/```css\n([\s\S]*?)\n```/g)) moved.set(m[1], (moved.get(m[1]) || 0) + 1);
    for (const m of s.matchAll(/^## ([a-z0-9-]+ §\d+)$/gm)) heads.set(m[1], f);
  }
  if (plant === 'drop') { const k = [...moved.keys()][0]; moved.set(k, moved.get(k) - 1); }
  const cited = new Map();
  let removedTotal = 0, nowBlocks = 0;
  for (const f of files()) {
    let now = noCR(read(f));
    if (plant === 'rule' && f === files()[12]) now = now.replace(/padding:\s*/, 'padding: 1');
    if (plant === 'cite' && f === files()[12]) now = now.replace(CITE, '[nowhere §999]');
    if (plant === 'edit' && f === files()[12]) { const b = blocks(now).find((x) => !HISTORY.test(x.text) && x.text.length > 40); if (b) now = now.slice(0, b.start) + b.text.replace(/ /, '  ') + now.slice(b.end); }
    const was = show(f);
    if (strip(now) !== strip(was)) fails.push(`${f}: the CSS itself changed (comments stripped, it is not the base's)`);
    // the base's blocks that are gone now, as a multiset
    const nowSet = new Map();
    for (const b of blocks(now)) { nowBlocks++; nowSet.set(b.text, (nowSet.get(b.text) || 0) + 1); }
    for (const b of blocks(was)) {
      const left = nowSet.get(b.text) || 0;
      if (left > 0) { nowSet.set(b.text, left - 1); continue; }
      removedTotal++;
      const held = moved.get(b.text) || 0;
      if (held > 0) moved.set(b.text, held - 1);
      else fails.push(`${f}: a removed comment is not in docs/rulings verbatim: ${b.text.slice(0, 70).replace(/\n/g, ' ')}`);
    }
    for (const b of blocks(now)) {
      for (const m of b.text.matchAll(CITE)) cited.set(`${m[1]} §${m[2]}`, f);
      if (HISTORY.test(b.text)) fails.push(`${f}: a comment still carries history: ${b.text.slice(0, 70).replace(/\n/g, ' ')}`);
    }
  }
  for (const [c, f] of cited) if (!heads.has(c)) fails.push(`${f}: cites [${c}], which no rulings file holds`);
  for (const [h, f] of heads) if (!cited.has(h) && !/no comment stays/.test(rulingsTexts.find(([n]) => n === f)[1].split(`## ${h}\n`)[1]?.split('\n## ')[0] || '')) fails.push(`${f}: ${h} is cited by no comment`);
  console.log(`styles ${files().length}; comment blocks now ${nowBlocks}; removed or rewritten ${removedTotal}; rulings files ${rulingsTexts.length}, entries ${heads.size}; cited ${cited.size}${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails.slice(0, 12)) console.log('FAIL', f);
  console.log(fails.length ? `COMMENTS: FAIL (${fails.length})` : 'COMMENTS: PASS (the CSS is the base\'s with comments aside; every removed comment is in docs/rulings verbatim; every citation resolves)');
  process.exit(fails.length ? 1 : 0);
}

({ list, apply, check }[process.argv[2]] ?? (() => { console.log('usage: list [--all] | apply <spec.json> | check --base <rev> [--plant drop|edit|rule|cite]'); process.exit(1); }))();
