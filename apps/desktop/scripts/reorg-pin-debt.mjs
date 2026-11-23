// The switch-over's debt list: harness files that open Machina without asking for the reorg (no ?reorg=1, no WS_REORG=1), so they ride the
// driver pin. Measured over the FULL directory listing; printed with the population and the counts, so a blind run shows. Run from the repo
// root: node apps/desktop/scripts/reorg-pin-debt.mjs (docs/reorg-switchover-pin-debt.md holds the list as measured at the build).
import fs from 'node:fs';
import path from 'node:path';
const dir = 'apps/desktop/scripts/harness';
const all = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort();
const rows = all.map((f) => { const s = fs.readFileSync(path.join(dir, f), 'utf8');
  return { f, machina: /['"`]machina['"`]/.test(s), asks: /reorg=1/.test(s), env: /WS_REORG\s*=\s*['"]1['"]/.test(s) }; });
const machina = rows.filter((r) => r.machina);
const ride = machina.filter((r) => !r.asks && !r.env);
const mixed = machina.filter((r) => r.asks && !r.env);
console.log(JSON.stringify({ population: all.length, machina: machina.length, askReorg: machina.filter((r) => r.asks).length, env: rows.filter((r) => r.env).map((r) => r.f), ride: ride.length, mixed: mixed.length }));
console.log('RIDE ' + ride.map((r) => r.f).join(' '));
console.log('MIXED ' + mixed.map((r) => r.f).join(' '));
