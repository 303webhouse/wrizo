// Throwaway diagnostic copy of connector-b.mjs (NOT committed, trial tree only): the two bare `.find(...).querySelector('.wz-links-x').click()` drivers become optional-chained, so a missing Links row
// is a failed check further down instead of an abort that hides every verdict. Asserts nothing new; the patch is counted so a silent no-op cannot pass.
import { readFileSync, writeFileSync } from 'node:fs';
const dir = 'C:/Users/nickh/writer-studio/.claude/worktrees/cb4/apps/desktop/scripts/harness/';
let s = readFileSync(dir + 'connector-b.mjs', 'utf8');
let n = 0;
for (const via of ['link', 'card']) {
  const from = `.find((li) => li.dataset.linkVia === '${via}').querySelector('.wz-links-x').click()`;
  const to = `.find((li) => li.dataset.linkVia === '${via}')?.querySelector('.wz-links-x')?.click()`;
  const parts = s.split(from); n += parts.length - 1; s = parts.join(to);
}
if (n < 3) throw new Error('patch did not land: ' + n);
writeFileSync(dir + 'connector-b-dbg.mjs', s);
console.log('patched sites: ' + n);
