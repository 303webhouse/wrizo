// #91 PROBE (a measurement aid, not a check of the product): reflow-open.mjs run while the machine is kept busy. The one red in Chat 1's first pair came on a loaded runner (two legs at once); alone it passed 24 of 24.
// Twice as many busy-loop processes as cores are started before the driver loads and killed when it ends: the page's own layout, its ResizeObserver callback and its font loads then land late and out of their usual order.
// reflow-open prints each open's card heights ("grew on N/N opens: ro-1:h ro-2:h ro-3:h | ...") and its F check: 0.1434 is right, 0.1875 is a card measured too early and kept.
import os from 'node:os';
import { spawn } from 'node:child_process';
const n = Math.max(2, os.cpus().length * 2);
const kids = Array.from({ length: n }, () => spawn(process.execPath, ['-e', 'for(;;){}'], { stdio: 'ignore' }));
console.log(`LOAD ${n} busy processes on ${os.cpus().length} cores`);
const stop = () => { for (const k of kids) { try { k.kill('SIGKILL'); } catch { /* gone */ } } };
process.on('exit', stop);
await import('../reflow-open.mjs');
