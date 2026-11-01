#!/usr/bin/env node
// #13 step 4c (Nick's default, Nov 1): docs/evidence/ leaves the current files and stays in git history (no history rewrite).
// Browserless.
//
//   node apps/desktop/scripts/c13/c13-4c-evidence.mjs manifest   write docs/cleanup/c13-4c-evidence-removed.tsv: every tracked file under
//        docs/evidence/ at HEAD, its blob, its size, and the last commit that changed it; the header names HEAD, the commit that last held them all
//   node apps/desktop/scripts/c13/c13-4c-evidence.mjs remove     git rm -r docs/evidence (after `manifest`)
//   node apps/desktop/scripts/c13/c13-4c-evidence.mjs verify [--plant missing|extra|ignore]
//        the proof: (1) nothing is tracked under docs/evidence/ now; (2) every manifest row is in the base commit with that blob (recoverable);
//        (3) the only files the step deletes are the manifest's, and nothing outside docs/evidence/ is deleted or changed except the step's own
//        two files; (4) .railwayignore still keeps docs/evidence/ out of the deploy. --plant: the same check on a mutated input: must FAIL.
//        --at <rev> reads the step at that commit (4c's own tip, 04ad76fb), so a later commit on top does not count as "outside the step".
//   node apps/desktop/scripts/c13/c13-4c-evidence.mjs ignore [--plant nobox|image|yml]
//        Fable, Nov 1: new evidence is text box logs only. .gitignore keeps docs/evidence/ out of git EXCEPT the .txt files under
//        docs/evidence/box-logs/, and harness.yml only accepts box-log paths there. The probes run in a scratch repo built from the real
//        .gitignore (nothing in this tree is touched); --plant mutates that copy (or the yml text) and must FAIL.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (...a) => execFileSync('git', ['-c', 'core.quotePath=false', ...a], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30 });
const DIR = 'docs/evidence';
const MANIFEST = 'docs/cleanup/c13-4c-evidence-removed.tsv';
// The step's own files (added), and the MAP's numbers row (modified, never deleted).
const OWN = new Map([[MANIFEST, 'A'], ['apps/desktop/scripts/c13/c13-4c-evidence.mjs', 'A'], ['docs/MAP.md', 'M']]);

function manifest() {
  const base = git('rev-parse', 'HEAD').trim();
  const rows = git('ls-tree', '-r', '-l', 'HEAD', `${DIR}/`).split('\n').filter(Boolean).map((l) => {
    const [meta, file] = l.split('\t');
    const [, , blob, size] = meta.trim().split(/\s+/);
    return { file, blob, size };
  });
  // One pass over the history: the first commit listed for a path is the last one that changed it.
  const last = new Map();
  let cur = null;
  for (const l of git('log', '--format=@%H', '--name-only', '--diff-merges=first-parent', 'HEAD', '--', `${DIR}/`).split('\n')) {
    if (l.startsWith('@')) cur = l.slice(1);
    else if (l && !last.has(l)) last.set(l, cur);
  }
  const total = rows.reduce((s, r) => s + Number(r.size), 0);
  fs.writeFileSync(path.join(ROOT, MANIFEST), [
    `# #13 step 4c: docs/evidence/ removed from the current files; every file stays in git history.`,
    `# base\t${base}\t(the commit that last held all ${rows.length} files, ${(total / 1048576).toFixed(1)} MB; recover one with: git show ${base.slice(0, 12)}:<file>)`,
    'file\tblob\tbytes\tlast-changed-in',
    ...rows.map((r) => `${r.file}\t${r.blob}\t${r.size}\t${last.get(r.file) ?? '?'}`),
  ].join('\n') + '\n');
  console.log(`manifest: ${rows.length} files, ${(total / 1048576).toFixed(1)} MB, base ${base.slice(0, 8)}; unknown last-changed ${rows.filter((r) => !last.has(r.file)).length}`);
}

function remove() {
  if (!fs.existsSync(path.join(ROOT, MANIFEST))) { console.log('run `manifest` first'); process.exit(1); }
  git('rm', '-r', '-q', `${DIR}/`);
  console.log(`removed ${DIR}/ from the index and the tree`);
}

function verify() {
  const plant = process.argv.includes('--plant') ? process.argv[process.argv.indexOf('--plant') + 1] : null;
  const text = fs.readFileSync(path.join(ROOT, MANIFEST), 'utf8');
  const base = /^# base\t([0-9a-f]{40})/m.exec(text)[1];
  const rows = text.split(/\r?\n/).filter((l) => l && !l.startsWith('#') && !l.startsWith('file\t')).map((l) => { const [file, blob] = l.split('\t'); return { file, blob }; });
  if (plant === 'missing') rows.push({ file: `${DIR}/never-was.png`, blob: '0'.repeat(40) });
  const fails = [];
  // Tracked now: text box logs are allowed under box-logs/ (Fable, Nov 1); anything else under docs/evidence/ is a failure.
  const nowTracked = git('ls-files', `${DIR}/`).split('\n').filter((f) => f && !/^docs\/evidence\/box-logs\/.+\.txt$/.test(f));
  if (nowTracked.length) fails.push(`${nowTracked.length} files still tracked under ${DIR}/`);
  const atBase = new Map(git('ls-tree', '-r', base, `${DIR}/`).split('\n').filter(Boolean).map((l) => { const [meta, file] = l.split('\t'); return [file, meta.split(/\s+/)[2]]; }));
  for (const r of rows) if (atBase.get(r.file) !== r.blob) fails.push(`not recoverable at ${base.slice(0, 8)}: ${r.file}`);
  if (atBase.size !== rows.length - (plant === 'missing' ? 1 : 0)) fails.push(`manifest rows ${rows.length} vs files at base ${atBase.size}`);
  const at = process.argv.includes('--at') ? process.argv[process.argv.indexOf('--at') + 1] : 'HEAD';
  let changes = git('diff', '--name-status', '--no-renames', base, at).split('\n').filter(Boolean).map((l) => l.split('\t'));
  if (plant === 'extra') changes.push(['D', 'docs/MAP.md']);
  const listed = new Set(rows.map((r) => r.file));
  for (const [st, f] of changes) {
    if (f.startsWith(`${DIR}/`)) { if (st !== 'D' || !listed.has(f)) fails.push(`${st} ${f}: not a listed deletion`); }
    else if (OWN.get(f) !== st) fails.push(`${st} ${f}: outside the step`);
  }
  let ignore = fs.existsSync(path.join(ROOT, '.railwayignore')) ? fs.readFileSync(path.join(ROOT, '.railwayignore'), 'utf8') : '';
  if (plant === 'ignore') ignore = ignore.replace(/^docs\/evidence\/?\s*$/m, '');
  if (!/^docs\/evidence\/?\s*$/m.test(ignore)) fails.push('.railwayignore no longer keeps docs/evidence/ out of the deploy');
  console.log(`base ${base.slice(0, 8)}; manifest ${rows.length}; tracked now ${nowTracked.length}; changes ${changes.length}${plant ? `; PLANTED: ${plant}` : ''}`);
  for (const f of fails.slice(0, 10)) console.log('FAIL', f);
  console.log(fails.length ? `VERIFY: FAIL (${fails.length})` : 'VERIFY: PASS');
  process.exit(fails.length ? 1 : 0);
}

function ignore() {
  const plant = process.argv.includes('--plant') ? process.argv[process.argv.indexOf('--plant') + 1] : null;
  let gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').replace(/\r\n/g, '\n');
  if (plant === 'nobox') gi = gi.replace(/^!docs\/evidence\/box-logs\/.*$/gm, '');
  if (plant === 'image') gi = gi.replace(/^docs\/evidence\/box-logs\/\*\*$/m, '');
  let yml = fs.readFileSync(path.join(ROOT, '.github/workflows/harness.yml'), 'utf8');
  if (plant === 'yml') yml = yml.replace("'^docs/evidence/box-logs/", "'^docs/evidence/");
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TEMP || process.env.TMPDIR || '/tmp'), 'c13-4c-ignore-'));
  const fails = [];
  try {
    execFileSync('git', ['init', '-q', tmp]);
    fs.writeFileSync(path.join(tmp, '.gitignore'), gi);
    // [path, must be ignored?]
    const probes = [
      ['docs/evidence/scrollbar-flush/arbor-dark/01.jpg', true],
      ['docs/evidence/page-size-final/02.png', true],
      ['docs/evidence/item210/rerun.log.txt', true],
      ['docs/evidence/frames.json', true],
      ['docs/evidence/box-logs/c13-4b-8df3c60b/default.log.txt', false],
      ['docs/evidence/box-logs/parked.log.txt', false],
      ['docs/evidence/box-logs/c13-4b-8df3c60b/01.png', true],
      ['docs/evidence/box-logs/c13-4b-8df3c60b/frames.json', true],
      ['docs/MAP.md', false],
    ];
    for (const [p, want] of probes) {
      fs.mkdirSync(path.dirname(path.join(tmp, p)), { recursive: true });
      fs.writeFileSync(path.join(tmp, p), 'x');
      let ignored = true;
      try { execFileSync('git', ['-C', tmp, 'check-ignore', '-q', p]); } catch { ignored = false; }
      if (ignored !== want) fails.push(`${p}: ${ignored ? 'ignored' : 'committable'}, expected ${want ? 'ignored' : 'committable'}`);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  if (!/grep -Eq '\^docs\/evidence\/box-logs\//.test(yml)) fails.push('harness.yml accepts box-log paths outside docs/evidence/box-logs/');
  const rw = fs.readFileSync(path.join(ROOT, '.railwayignore'), 'utf8');
  if (!/^docs\/evidence\/?\s*$/m.test(rw)) fails.push('.railwayignore no longer keeps docs/evidence/ (box logs included) out of the deploy');
  for (const f of fails) console.log('FAIL', f);
  console.log(`${fails.length ? `IGNORE: FAIL (${fails.length})` : 'IGNORE: PASS'} (9 path probes, harness.yml, .railwayignore)${plant ? `; PLANTED: ${plant}` : ''}`);
  process.exit(fails.length ? 1 : 0);
}

({ manifest, remove, verify, ignore }[process.argv[2]] ?? (() => { console.log('usage: manifest | remove | verify [--at rev] [--plant missing|extra|ignore] | ignore [--plant nobox|image|yml]'); process.exit(1); }))();
