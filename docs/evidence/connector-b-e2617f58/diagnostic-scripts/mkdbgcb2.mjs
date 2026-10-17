// Throwaway diagnostic copy #2 (NOT committed, trial tree only): on top of mkdbgcb.mjs's guards, openDrawers opens the panel only if it is CLOSED (it is a strip toggle: a second call closes it).
// Tests the reading that B5 / B9's "thumbnail absent" is the harness toggling the panel shut. Counted so a silent no-op cannot pass.
import { readFileSync, writeFileSync } from 'node:fs';
const dir = 'C:/Users/nickh/writer-studio/.claude/worktrees/cb4/apps/desktop/scripts/harness/';
let s = readFileSync(dir + 'connector-b-dbg.mjs', 'utf8');
const from = "const openDrawers = async (app) => { await app.evalJs(";
const to = "const openDrawers = async (app) => { if (await app.evalJs(\"!!document.querySelector('.wz-drawers-tile[data-link-entry]')\")) return; await app.evalJs(";
const parts = s.split(from); if (parts.length !== 2) throw new Error('patch did not land: ' + (parts.length - 1));
writeFileSync(dir + 'connector-b-dbg2.mjs', parts.join(to));
console.log('patched openDrawers');
