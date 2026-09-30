// ITEM 203 - WHAT DOES A BIG /sync BODY COST THE SERVER?  Raising Express's limit is only safe if the server can afford to
// parse a body that size. express.json BUFFERS the whole body, then JSON.parse builds the object tree, then the /sync handler
// JSON.stringify's `strokes` back out for the database parameter - so the peak is a multiple of the body, not the body.
// This measures that multiple with the REAL express.json and real-shaped ink JSON, in a child process so the numbers are the
// server's alone. Local only; no network beyond loopback; nothing here touches production.
//
// Run: node docs/evidence/item203/parse-cost-probe.mjs
import { createRequire } from 'node:module';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const MiB = 1024 * 1024;

if (process.argv[2] === 'child') {
  const expressPath = createRequire(join(repo, 'apps/server/package.json')).resolve('express');
  const express = createRequire(import.meta.url)(expressPath);
  const limitMiB = Number(process.argv[3]);
  const app = express();
  app.use(express.json({ limit: `${limitMiB}mb` }));
  app.post('/sync', (req, res) => {
    // what the handler does with a journal entry's strokes: it stringifies the parsed value again for the database parameter
    const e = req.body.push.journalEntries[0];
    const again = JSON.stringify(e.strokes ?? null);
    res.json({ ok: true, reparsedBytes: again.length });
  });
  const server = app.listen(0, () => {
    process.send({ port: server.address().port });
  });
  // resourceUsage().maxRSS is the OS's own peak-RSS counter (KiB), exact even across a synchronous JSON.parse that would starve any sampler.
  process.on('message', (m) => { if (m === 'report') process.send({ report: { peakRss: process.resourceUsage().maxRSS * 1024, now: process.memoryUsage().rss } }); });
} else {
  const rand = (n) => Array.from({ length: n }, () => ({ x: (100 + Math.random() * 900) / 1234.5, y: (60 + Math.random() * 1300) / 1234.5, p: Math.round(Math.random() * 1000) / 1000 }));
  const body = (bytes) => {
    const pts = Math.ceil(bytes / 56.3);
    return JSON.stringify({ lastSyncAt: null, push: { journalEntries: [{ id: 'P', text: '', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', strokes: [{ id: 's', points: rand(pts) }] }] } });
  };
  console.log('body MiB | server RSS before | server PEAK RSS | growth | growth per body-MiB | parse+handler ms');
  for (const mib of [5, 10, 25, 50]) {
    const child = fork(fileURLToPath(import.meta.url), ['child', '64'], { silent: true });
    const port = await new Promise((r) => child.once('message', (m) => r(m.port)));
    const before = await new Promise((r) => { child.send('report'); child.once('message', (m) => r(m.report.peakRss)); });
    const b = body(mib * MiB);
    const t0 = Date.now();
    const res = await fetch(`http://127.0.0.1:${port}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: b });
    await res.text();
    const ms = Date.now() - t0;
    const rep = await new Promise((r) => { child.send('report'); child.once('message', (m) => r(m.report)); });
    const growth = rep.peakRss - before;
    console.log(`${String(mib).padStart(8)} | ${(before / MiB).toFixed(0).padStart(17)} MiB | ${(rep.peakRss / MiB).toFixed(0).padStart(13)} MiB | ${(growth / MiB).toFixed(0).padStart(4)} MiB | ${(growth / MiB / (b.length / MiB)).toFixed(1).padStart(19)}x | ${ms}`);
    child.kill();
  }
}
