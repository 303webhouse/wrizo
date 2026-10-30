// ARBOR v2 MOCKUP - §14 item 8, the Mood menu, BROWSERLESS (src/arbor2/mount.tsx MOOD + styles/arbor-v2.css + src/arbor2/shoots.ts). No box.
// The browser half is the frames screen `arbor-mood` (and `arbor-rhizome-variation` for the variation switch), which flips each switch and
// measures what it changed.
//   M1  the menu lists the spec's nine (§13), in its order
//   M2  (parked -> M2b) no switch is decorative: every switch that can be flipped has a rule that reads it (CSS `data-arbor2-off~='<key>'`, or shoots.ts)
//   M3  (parked -> M3b) a row that cannot switch says why, and has no switch
//   M4  in-session only: mount.tsx never touches storage
import fs from 'node:fs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const src = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const mount = src('../../src/arbor2/mount.tsx'), css = src('../../src/styles/arbor-v2.css'), shoots = src('../../src/arbor2/shoots.ts');

const block = mount.slice(mount.indexOf('const MOOD'), mount.indexOf('];', mount.indexOf('const MOOD')));
const rows = [...block.matchAll(/\{ key: '([a-z-]+)', label: '([^']+)'(?:, why: '([^']+)')? \}/g)].map((m) => ({ key: m[1], label: m[2], why: m[3] || null }));
ok('M1 the nine switches of spec §13, in order', rows.map((r) => r.key).join() === 'breath,lamp-progress,shadows,afternoon,flutter,variation,pull,tabs,dim', JSON.stringify(rows.map((r) => r.key)));
const live = rows.filter((r) => !r.why);
const readers = live.map((r) => ({ key: r.key, css: css.includes(`data-arbor2-off~='${r.key}'`), js: r.key === 'variation' && /includes\('variation'\)/.test(shoots) }));
// PARKED 2026-10-29 (SUPERSEDED: Fable ruled "Build 'Dim the room' (§6.2)", so the dim switch is live - eight switch, one says why).
// Original, verbatim:
// ok('M2 every live switch has a rule that reads it', live.length === 7 && readers.every((r) => r.css || r.js), JSON.stringify(readers));
// ok('M3 the two that cannot switch say why (and get no switch)', rows.filter((r) => r.why).map((r) => r.key).join() === 'lamp-progress,dim'
//   && /\{why \? <span className="arbor2-mood-why">\{why\}<\/span> : \(/.test(mount), '');
// SUCCESSORS M2b / M3b: the same, with dim live.
ok('M2b every live switch (eight) has a rule that reads it', live.length === 8 && readers.every((r) => r.css || r.js), JSON.stringify(readers));
ok('M3b the one that cannot switch (lamp as progress) says why, and gets no switch', rows.filter((r) => r.why).map((r) => r.key).join() === 'lamp-progress'
  && /\{why \? <span className="arbor2-mood-why">\{why\}<\/span> : \(/.test(mount), '');
ok('M4 nothing stored: no storage call in mount.tsx', !/localStorage|sessionStorage|indexedDB/.test(mount.replace(/\/\/.*$/gm, '')), '');

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-8-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-8-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
