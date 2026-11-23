// CENSUS #32: a dealt deck's rows are fixed height, so long card text is clipped under the next row (seen: Thesis plan -> Methodology).
// Runs the bug's own check, deck-rows.mjs, on the live build (no theme pin), its frames kept. Its D2/D3 and L2/L3/L4/L5 are the bug: cards overlap, text is clipped, the row does not fit its tallest card.
// STILL THERE: one of those is red. GONE: the whole file is green. CAN'T TELL: the file gave no verdict, or only other checks are red.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FRAMES, finish, GONE, THERE, CANT } from './census/lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const log = path.join(FRAMES, 'census-32-deck-rows.log.txt');
const fd = fs.openSync(log, 'w');   // output to a file, never a pipe
const dir = path.join(FRAMES, 'census-32');
const r = spawnSync(process.execPath, [path.join(here, 'deck-rows.mjs')], { stdio: ['ignore', fd, fd], env: { ...process.env, DR_FRAMES: dir }, timeout: 11 * 60 * 1000 });
fs.closeSync(fd);
const text = fs.readFileSync(log, 'utf8');
const lines = text.split(/\r?\n/);
const verdict = lines.find((l) => /DECK-ROWS VERIFY:/.test(l)) || null;
const failed = lines.filter((l) => /^FAIL\s/.test(l)).map((l) => l.slice(0, 260));
const bug = failed.filter((l) => /^FAIL\s+(D2|D3|L2|L3|L4|L5) /.test(l));
const frames = fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => `census-32/${f}`) : [];
finish('32', {
  result: !verdict ? CANT : bug.length ? THERE : failed.length ? CANT : GONE,
  why: !verdict ? `deck-rows gave no verdict (exit ${r.status})` : bug.length ? `${bug.length} of the bug's own checks are red` : failed.length ? `only other checks are red: ${failed.length}` : verdict.trim(),
  readings: { exit: r.status, verdict, failed },
  frames,
});
