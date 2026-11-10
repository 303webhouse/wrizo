// ARBOR2-ROOM-GUARD - BROWSERLESS (Fable, Nov 10, 3:45 pm, census (b): "a guard check fails any Arbor screen that sets no room (a helper counts)").
// A screen gets a room one of two ways: it sets its own (setRoom / data-room / the arbor2room URL pin / the faked clock arbor2Clock / the Themes
// menu's Room row, in its body or in any function of its file that it calls), or it runs under the kit's room pin (mockup-kit.mjs withRoomPin:
// the browser clock at midday, so the room is DAY) - the helper that counts. A screens file whose export does not go through withRoomPin leaves
// every screen in it that sets no room to the runner's clock (America/Denver): that is what this guard fails.
//   G1  every Arbor frames screens file (scripts/frames/arbor2*.mjs that exports screens; the walk's driver and the a6 tools excepted) exports
//       through withRoomPin, and imports it from the kit
//   G2  the kit's withRoomPin pins the clock before each screen and clears it after (its own source, read)
//   G3  coverage, printed: per file, how many check screens set their own room and how many take the pin's DAY
//   G4  the Arbor harness files that run without WS_URL_SEARCH's room pin (arbor2-1, -4, -6, -23) pin the clock themselves: pinClock(app, 12) first
//       inside withHarness, unpinClock in a finally, imported from the kit (Chat 1's option (1): nothing in runtime-verify.mjs)
//   MUT a copy of one file with the wrapper taken out (in memory) must FAIL G1's rule (the guard can go red); MUT4 the same for G4's pin
// Run: node apps/desktop/scripts/harness/arbor2-room-guard.mjs   (no browser, no box)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FR = path.resolve(here, '..', 'frames');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const norm = (s) => s.replace(/\r\n/g, '\n');
const EXCEPT = /^arbor2-(walk|a6-.*)\.mjs$/;
const files = fs.readdirSync(FR).filter((f) => /^arbor2(-[a-z0-9-]+)?\.mjs$/.test(f) && !EXCEPT.test(f)).sort();
const screensFile = (s) => /\n {2}'[a-z0-9-]+': (async )?\(?app/.test(s) && /\nexport default /.test(s);
const wrapped = (s) => /\nexport default withRoomPin\(/.test(s) && /import \{[^}]*\bwithRoomPin\b[^}]*\} from '\.\/mockup-kit\.mjs'/.test(s);

const SETS = /setRoom\(|data-room|arbor2room|arbor2Clock|pickThemesRoom/;
const coverage = [];
const unwrapped = [];
for (const f of files) {
  const s = norm(fs.readFileSync(path.join(FR, f), 'utf8'));
  if (!screensFile(s)) continue;
  if (!wrapped(s)) unwrapped.push(f);
  // G3: which check screens set their own room (followed through the file's own functions), which take the pin's day
  const decl = /\n(?:const|async function|function) ([A-Za-z_$][\w$]*)\s*=?/g; const heads = []; let m;
  while ((m = decl.exec(s))) heads.push({ name: m[1], at: m.index });
  const bodyOf = new Map(); heads.forEach((h, i) => bodyOf.set(h.name, s.slice(h.at, i + 1 < heads.length ? heads[i + 1].at : s.length)));
  const reach = (text, seen = new Set()) => { let out = text; for (const [name, b] of bodyOf) if (!seen.has(name) && new RegExp(`\\b${name}\\b`).test(text)) { seen.add(name); out += '\n' + reach(b, seen); } return out; };
  const re = /\n {2}'([a-z0-9-]+)': (async )?\(?app/g; const marks = [];
  while ((m = re.exec(s))) marks.push({ name: m[1], at: m.index });
  let own = 0, pinned = 0;
  for (let i = 0; i < marks.length; i++) {
    const { name, at } = marks[i]; if (/-pic-|-v\d+$/.test(name)) continue;
    const body = s.slice(at, i + 1 < marks.length ? marks[i + 1].at : s.length);
    if (SETS.test(reach(body))) own++; else pinned++;
  }
  coverage.push({ f, own, pinned });
}
ok(`G1 every Arbor frames screens file exports through the kit's withRoomPin (${coverage.length} files)`, unwrapped.length === 0 && coverage.length >= 15, JSON.stringify({ unwrapped }));
const kit = norm(fs.readFileSync(path.join(FR, 'mockup-kit.mjs'), 'utf8'));
const wr = kit.slice(kit.indexOf('export function withRoomPin'), kit.indexOf('export function withRoomPin') + 400);
ok('G2 withRoomPin pins the clock (pinClock) before each screen and clears it (unpinClock) in finally', /await pinClock\(app, 12\); try \{ await fn\(app, ctx\); \} finally \{ await unpinClock\(app\); \}/.test(wr) && /Emulation\.setTimezoneOverride/.test(kit), wr.slice(0, 200));
const tot = coverage.reduce((a, c) => ({ own: a.own + c.own, pinned: a.pinned + c.pinned }), { own: 0, pinned: 0 });
console.log(`     coverage: ${tot.own} check screens set their own room, ${tot.pinned} take the pin's DAY - ${coverage.map((c) => `${c.f.replace('.mjs', '')} ${c.own}/${c.pinned}`).join(' · ')}`);
ok('G3 coverage counted (every check screen is either own-room or pinned)', tot.own + tot.pinned > 100, JSON.stringify(tot));
// G4: the four harness files
const HF = path.resolve(here);
const pinnedHarness = (t) => /import { pinClock, unpinClock } from '\.\.\/frames\/mockup-kit\.mjs';/.test(t) && /await withHarness\(async \(app\) => \{ await pinClock\(app, 12\); try \{/.test(t) && /\} finally \{ await unpinClock\(app\); \} \}, \{ label: /.test(t);
const H4 = ['arbor2-1.mjs', 'arbor2-4.mjs', 'arbor2-6.mjs', 'arbor2-23.mjs'];
const notPinned = H4.filter((f) => !pinnedHarness(norm(fs.readFileSync(path.join(HF, f), 'utf8'))));
ok(`G4 the four Arbor harness files pin the clock to midday themselves and clear it in a finally (${H4.join(', ')})`, notPinned.length === 0, JSON.stringify({ notPinned }));
const h1 = norm(fs.readFileSync(path.join(HF, 'arbor2-1.mjs'), 'utf8'));
const h1m = h1.replace('await withHarness(async (app) => { await pinClock(app, 12); try {', 'await withHarness(async (app) => { try {');
ok('MUT4 G4 is RED on a harness file without the pin (the mutant landed: the text changed)', h1m !== h1 && !pinnedHarness(h1m), '');
// MUT: arbor2-r23.mjs with its wrapper taken out, in memory
const r23 = norm(fs.readFileSync(path.join(FR, 'arbor2-r23.mjs'), 'utf8'));
const mut = r23.replace(/\nexport default withRoomPin\((guarded\([^\n]*\))\);/, '\nexport default $1;');
ok('MUT the guard is RED on a file whose export skips withRoomPin (the mutant landed: the text changed; screensFile, not wrapped)', mut !== r23 && screensFile(mut) && !wrapped(mut), '');
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-ROOM-GUARD: PASS (${checks.length} checks)` : `\nARBOR2-ROOM-GUARD: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
