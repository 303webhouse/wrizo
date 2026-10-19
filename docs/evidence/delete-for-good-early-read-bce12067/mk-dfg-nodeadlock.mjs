// Throwaway diagnostic copy of delete-for-good.mjs (NOT committed; trial tree only): H2's statement returns the pending `request(...).then(...)` promise, which evalJs AWAITS (awaitPromise: true)
// - and the promise only settles when the dialog is answered by the NEXT step, so the harness deadlocks. The copy ends that statement with `; null` so nothing is awaited. The edit is COUNTED.
import { readFileSync, writeFileSync } from 'node:fs';
const dir = 'C:/Users/nickh/writer-studio/.claude/worktrees/dfo/apps/desktop/scripts/harness/';
let s = readFileSync(dir + 'delete-for-good.mjs', 'utf8');
const from = ".then((a) => { window.__wzConfirmAnswer = a; })`);";
const parts = s.split(from);
if (parts.length - 1 < 1) throw new Error('patch did not land');
s = parts.join(".then((a) => { window.__wzConfirmAnswer = a; }); null`);");
writeFileSync(dir + 'delete-for-good-nd.mjs', s);
console.log('patched sites: ' + (parts.length - 1));
