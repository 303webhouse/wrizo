// THE BARE SWITCH CENSUS (Fable, Nov 21, 11:20 pm, after INK found overrides/arborReorg.ts reading the bare REORG: "add a census check: every reader of the bare REORG
// outside flag.ts/themeGate.ts is either listed as harmless (a harness hook) or reads reorgFor, with a mutant"). The switch-over turns the reorg ON by default; the ruling
// (9:40 pm) keeps it to Machina: anything that reads the bare switch to decide what a WRITER sees would light it in Arbor and Flux too. So, over the whole client source:
//   CENSUS   every live (non-comment, non-import) read of the bare REORG outside reorg/flag.ts and reorg/themeGate.ts is either a HARNESS HOOK (the one-line seam
//            `if (REORG && typeof window !== 'undefined')` that hangs a window.wrizo* seam for the harness) or a site listed in HARMLESS below with its reason;
//            everything else must ask reorgFor(theme)
//   COVER    the census read the whole client (> 300 files) and found the seams it should (it prints each one), so a pass means something
//   LISTED   every HARMLESS entry is still there (a stale entry fails: the list cannot rot into a blanket pass)
//   MUT      a new bare read (a writer-facing `REORG && ...` in a new file) LANDS in the census input and turns CENSUS red
// Browserless: node scripts/harness/reorg-bare-switch-census.mjs (from apps/desktop; no box turn).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });

// the gate's own files: they DEFINE the switch and the rule
const GATE_FILES = new Set(['reorg/flag.ts', 'reorg/themeGate.ts']);
// a harness hook: the whole condition is the bare switch and a window, and its body hangs a seam (checked: the next lines assign window.wrizo*)
const HOOK = /^\s*if \(REORG && typeof window !== 'undefined'\)/;
// sites that read the bare switch on purpose, each with its reason; an entry is [file, a fragment of the line, the reason]
const HARMLESS = [
  ['reorg/railSaved.ts', 'if (REORG) {', 'its own local mirror read into memory at start; every write (persist) and every sync (syncRail) passes reorgInMachina, so nothing reaches a writer outside the reorg\'s themes'],
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : /\.(ts|tsx)$/.test(d.name) ? [path.join(dir, d.name)] : []));
// strip comments (block, JSX block, line) but keep line numbers: a comment's text becomes spaces
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));

function census(files) {
  const hooks = [], harmless = [], bare = [];
  for (const [rel, text] of files) {
    if (GATE_FILES.has(rel)) continue;
    const lines = stripComments(text.replace(/\r\n/g, '\n')).split('\n');
    lines.forEach((line, i) => {
      if (!/\bREORG\b/.test(line) || /^\s*import\b/.test(line)) return;
      const at = `${rel}:${i + 1}`;
      if (HOOK.test(line) && /window as unknown as \{ wrizo|\.wrizo[A-Z]/.test(lines.slice(i, i + 3).join('\n'))) { hooks.push(at); return; }
      const h = HARMLESS.find(([f, frag]) => f === rel && line.includes(frag));
      if (h) { harmless.push(at); return; }
      bare.push(`${at}  ${line.trim().slice(0, 140)}`);
    });
  }
  return { hooks, harmless, bare };
}

const files = walk(SRC).map((p) => [path.relative(SRC, p).split(path.sep).join('/'), fs.readFileSync(p, 'utf8')]);
const real = census(files);
for (const h of real.hooks) console.log(`INFO harness hook: ${h}`);
for (const h of real.harmless) console.log(`INFO harmless (listed): ${h}`);
ok('CENSUS every bare REORG read outside flag.ts / themeGate.ts is a harness hook or a listed harmless site; everything else asks reorgFor(theme)', real.bare.length === 0, { bare: real.bare });
ok('COVER the census read the whole client and found its seams', files.length > 300 && real.hooks.length >= 5, { files: files.length, hooks: real.hooks.length, harmless: real.harmless.length });
const stale = HARMLESS.filter(([f, frag]) => !real.harmless.some((h) => h.startsWith(f + ':')) || !files.some(([rel, t]) => rel === f && t.includes(frag)));
ok('LISTED every HARMLESS entry is still there (no stale entry)', stale.length === 0, { stale });
const mutant = census([...files, ['components/SomeNewPanel.tsx', "export const on = REORG && theme === 'plateau';\n"]]);
ok('MUT a new writer-facing bare read LANDS in the census input and turns CENSUS red', mutant.bare.some((b) => b.startsWith('components/SomeNewPanel.tsx:1')), { mutantBare: mutant.bare.slice(-3) });

const EXPECTED = 4;
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 2000)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nREORG-BARE-SWITCH-CENSUS VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-BARE-SWITCH-CENSUS VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
