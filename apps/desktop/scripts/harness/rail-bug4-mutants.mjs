// TOOLS - RAIL BUG #4, THE MUTANTS. Proves rail-bug4.mjs can fail: each mutant breaks ONE half of the ruling (Fable, Nov 7) in the product source, runs rail-bug4.mjs through the suite (which rebuilds),
// reads the per-check verdicts, and demands the NAMED checks go red - then puts the file back byte for byte, whatever happened. Needs a box turn (it drives rail-bug4). ~4 builds: a few minutes.
//   M1  the name comes back in the Journal slot          -> "at most once in the rail" and "icon-only door" red
//   M2  the door is gone in the Journal (slot not drawn) -> "icon-only door" and "still opens the switcher" red
//   M3  the Journal pin is not marked active              -> "pin is marked active" red
//   M4  the slot never names a place (Drawers too)        -> "in a Drawer nothing changed" red
// Run (from apps/desktop, needs a box turn):  node scripts/harness/rail-bug4-mutants.mjs
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const DESKTOP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PB = 'src/components/PlaceBlock.tsx';
const CA = 'src/components/Cascade.tsx';
const NAME_SPAN = '{isJournal ? null : <span className="wz-strip-label wz-place-name">{name}</span>}';
const MUTANTS = [
  { id: 'M1', what: 'the name comes back in the Journal slot', file: PB, find: NAME_SPAN, to: '<span className="wz-strip-label wz-place-name">{name}</span>', red: ['at most once in the rail', 'icon-only door (no name)'] },
  { id: 'M2', what: 'the door is gone in the Journal (the slot is not drawn)', file: PB, find: /  return \(\r?\n    <div className="wz-strip-section wz-place-section">/, to: '  if (isJournal) return null;\n  return (\n    <div className="wz-strip-section wz-place-section">', red: ['icon-only door (no name)', 'still opens the switcher'] },
  { id: 'M3', what: 'the Journal pin is not marked active', file: CA, find: "state.category === item.id || currentPlace === item.id ? ' active' : ''", to: "state.category === item.id ? ' active' : ''", red: ['Journal pin is marked active'] },
  { id: 'M4', what: 'the slot never names a place (Drawers too)', file: PB, find: NAME_SPAN, to: '{null}', red: ['in a Drawer nothing changed'] },
];

let bad = 0;
for (const m of MUTANTS) {
  const p = path.join(DESKTOP, m.file);
  const orig = fs.readFileSync(p);
  const text = orig.toString('utf8');
  const landed = typeof m.find === 'string' ? text.split(m.find).length === 2 : (text.match(m.find) || []).length === 1;
  if (!landed) { console.log(`FAIL  ${m.id} (${m.what}): the mutation did not land (anchor not found exactly once)`); bad++; continue; }
  try {
    fs.writeFileSync(p, text.replace(m.find, () => m.to));
    const r = spawnSync(process.execPath, ['scripts/run-suite.mjs', '--only', 'rail-bug4.mjs'], { cwd: DESKTOP, encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 });
    const out = `${r.stdout || ''}\n${r.stderr || ''}`;
    const file = (out.match(/full output at (\S.*?rail-bug4\.mjs\.default\.txt)/) || [])[1];
    const body = file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const failed = body.split(/\r?\n/).filter((l) => l.startsWith('FAIL'));
    const missing = m.red.filter((frag) => !failed.some((l) => l.includes(frag)));
    const pass = body && missing.length === 0;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${m.id} (${m.what}): landed, and ${pass ? 'turns ' + m.red.length + ' named check(s) RED (' + failed.length + ' red in all)' : (body ? 'these did not go red: ' + missing.join(' | ') : 'no verdict file found')}`);
    if (!pass) bad++;
  } finally { fs.writeFileSync(p, orig); }
}
console.log(bad ? `RAIL-BUG4-MUTANTS VERIFY: FAIL (${bad} of ${MUTANTS.length})` : `RAIL-BUG4-MUTANTS VERIFY: PASS (${MUTANTS.length} mutants, each killed by its named checks; sources restored)`);
process.exit(bad ? 1 : 0);
