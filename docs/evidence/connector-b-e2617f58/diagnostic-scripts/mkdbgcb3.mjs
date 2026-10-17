// Throwaway diagnostic copy #3 (NOT committed, trial tree only): B9's press/release use the RIGHT button (BoardEditor.tsx:2128 - right-click on the corner square enters connection mode with the button HELD;
// a plain left press-drag on the corner is a RESIZE, which is what the committed B9 drives). Counted so a silent no-op cannot pass.
import { readFileSync, writeFileSync } from 'node:fs';
const dir = 'C:/Users/nickh/writer-studio/.claude/worktrees/cb4/apps/desktop/scripts/harness/';
let s = readFileSync(dir + 'connector-b-dbg2.mjs', 'utf8');
const a = "await app.mouseMove(hp.x, hp.y); await mouse(app, 'mousePressed', hp.x, hp.y);";
const a2 = "await app.mouseMove(hp.x, hp.y); await mouse(app, 'mousePressed', hp.x, hp.y, { button: 'right', buttons: 2 });";
const b = "await mouse(app, 'mouseReleased', ...Object.values(centre(tb9))); await sleep(500);";
const b2 = "await mouse(app, 'mouseReleased', ...Object.values(centre(tb9)), { button: 'right', buttons: 0 }); await sleep(500);";
for (const [x] of [[a], [b]]) if (s.split(x).length !== 2) throw new Error('patch did not land: ' + x);
s = s.split(a).join(a2).split(b).join(b2);
writeFileSync(dir + 'connector-b-dbg3.mjs', s);
console.log('patched B9 to the right button');
