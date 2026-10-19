// DELETE FOR GOOD - THE CLIENT MUTANTS (Fable, Oct 18: "finish the six client mutants"; ledger 107 adds connector-b's page_links rule).
// Each mutant copies apps/desktop/src to a scratch folder INSIDE apps/desktop (so its imports resolve the same node_modules), makes ONE edit,
// asserts the edit LANDED (its text occurs exactly once, and the copy really changed), runs delete-for-good-check.mjs against the copy
// (WZ_CLIENT_SRC, read by scripts/lib/client-node.mjs), and counts a kill ONLY when the check ran to its verdict line - a crash is not a
// kill - and every case it names went RED. The copy is removed in a finally. The real src is never touched.
// Run (repo root): node apps/desktop/scripts/delete-for-good-mutants.mjs
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..');
const SRC = join(DESKTOP, 'src');
const CHECK = join(here, 'delete-for-good-check.mjs');

const MUTANTS = [
  { name: 'a reader lists a shell (Trash keeps a purged page)', file: 'store/persistence.ts', all: 2,
    from: '.filter(e => !!e.deletedAt && !e.purgedAt && getSystemKind(e) === undefined)', to: '.filter(e => !!e.deletedAt && getSystemKind(e) === undefined)', mustRed: ['P2'] },
  { name: 'a pulled purge leaves the local edit dirty', file: 'store/persistence.ts',
    from: 'if (dirty[name].delete(rec.id)) persistDirty();', to: 'void 0;', mustRed: ['P9'] },
  { name: 'a purged page\'s pins are not purge-marked', file: 'store/persistence.ts',
    from: "const pinIds = new Set(boxes.filter(b => b.kind === 'page-pin' && b.entryId === id && !b.purgedAt).map(b => b.id));", to: 'const pinIds = new Set<string>();', mustRed: ['P4'] },
  { name: 'the gate takes UNTRUSTED input', file: 'store/destructiveGate.ts',
    from: 'if (!pending || !trusted || !pending.req.phrase', to: 'if (!pending || !pending.req.phrase', mustRed: ['P13'] },
  { name: 'the test unlock works on any host', file: 'store/destructiveGate.ts',
    from: '  if (!LOCAL_HOSTS.has(host)) return false;\n', to: '', mustRed: ['P12'] },
  { name: 'the server\'s acknowledgement is ignored', file: 'store/persistence.ts',
    from: 'export function applyAcknowledgedPurged(ack: PurgeAck | undefined): void {\n  if (!ack) return;', to: 'export function applyAcknowledgedPurged(ack: PurgeAck | undefined): void {\n  if (ack || !ack) return;', mustRed: ['P10', 'P15'] },
  // connector-b's page_links (ledger 107)
  { name: 'a purge leaves other entries\' links to it live', file: 'store/persistence.ts',
    from: 'if ((e.pageLinks ?? []).some(l => !l.deletedAt && l.bEntryId === id)) {', to: 'if (false) {', mustRed: ['P16'] },
  { name: 'a link to a purged entry still reads as an end', file: 'store/persistence.ts',
    from: 'if (!e || e.purgedAt) return null;', to: 'if (!e) return null;', mustRed: ['P17'] },
];

const noCR = (t) => t.replace(/\r\n/g, '\n');
const results = [];
for (const m of MUTANTS) {
  const dir = join(DESKTOP, `.dfg-client-mutant-${process.pid}`);
  const r = { name: m.name, landed: false, verdict: false, red: [], killed: false };
  try {
    rmSync(dir, { recursive: true, force: true });
    cpSync(SRC, join(dir, 'src'), { recursive: true });
    const f = join(dir, 'src', m.file);
    const src = noCR(readFileSync(f, 'utf8'));
    const count = src.split(m.from).length - 1;
    const mutated = src.split(m.from).join(m.to);
    r.landed = count === (m.all || 1) && mutated !== src;
    r.count = count;
    if (r.landed) {
      writeFileSync(f, mutated);
      const run = spawnSync(process.execPath, [CHECK], { env: { ...process.env, WZ_CLIENT_SRC: join(dir, 'src') }, encoding: 'utf8', timeout: 180000 });
      const out = `${run.stdout || ''}${run.stderr || ''}`;
      r.verdict = /DELETE-FOR-GOOD-CHECK VERIFY: (PASS|FAIL)/.test(out);
      r.red = [...out.matchAll(/^FAIL {2}(P\d+):/gm)].map((x) => x[1]);
      r.killed = r.verdict && m.mustRed.every((k) => r.red.includes(k));
      if (!r.verdict) r.tail = out.slice(-400);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  results.push(r);
  console.log(`${r.killed ? 'PASS' : 'FAIL'}  MUTANT (${m.name}): the edit LANDED, the check ran to its verdict, and ${m.mustRed.join(' + ')} went RED  [${JSON.stringify(r)}]`);
}
const bad = results.filter((r) => !r.killed).length;
console.log(bad === 0 ? `\nDELETE-FOR-GOOD-MUTANTS VERIFY: PASS (${results.length} mutants, each landed and killed)` : `\nDELETE-FOR-GOOD-MUTANTS VERIFY: FAIL - ${bad}/${results.length} not killed`);
process.exit(bad === 0 ? 0 : 1);
