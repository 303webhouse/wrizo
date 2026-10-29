// ARBOR v2 MOCKUP - §14 item 6, BROWSERLESS half: the afternoon's arithmetic (src/arbor2/sun.ts). Node >= 22.18 (type stripping). No box.
//   A1  before noon with a fresh session, t = 0; the session alone reaches a third at 90 min and never more
//   A2  the clock alone: 15:00 = 1/3, 18:00 and later = 2/3; both together cap at 1
//   A3  the ground mix: t=0 is the whitewash #EFE6D2, t=1 the late #E3D4B6, and t=.5 sits between
import { afternoonT, mixHex } from '../../src/arbor2/sun.ts';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const at = (h, m = 0) => { const d = new Date(2026, 9, 29, h, m, 0); return d; };
const near = (a, b) => Math.abs(a - b) < 1e-6;

ok('A1 11:00, fresh session: t = 0', near(afternoonT(at(11), at(11).getTime()), 0), String(afternoonT(at(11), at(11).getTime())));
ok('A1 11:00, 90 min in: t = 1/3', near(afternoonT(at(11), at(9, 30).getTime()), 1 / 3), String(afternoonT(at(11), at(9, 30).getTime())));
ok('A1 11:00, 5 hours in: still 1/3 (the session part is capped)', near(afternoonT(at(11), at(6).getTime()), 1 / 3), '');
ok('A2 15:00, fresh session: t = 1/3', near(afternoonT(at(15), at(15).getTime()), 1 / 3), String(afternoonT(at(15), at(15).getTime())));
ok('A2 18:00 and 23:00, fresh session: t = 2/3', near(afternoonT(at(18), at(18).getTime()), 2 / 3) && near(afternoonT(at(23), at(23).getTime()), 2 / 3), '');
ok('A2 19:00, 2 hours in: t = 1 (capped)', near(afternoonT(at(19), at(17).getTime()), 1), String(afternoonT(at(19), at(17).getTime())));
ok('A3 the ground mix: t=0 #EFE6D2, t=1 #E3D4B6, t=.5 between', mixHex('#EFE6D2', '#E3D4B6', 0) === '#EFE6D2' && mixHex('#EFE6D2', '#E3D4B6', 1) === '#E3D4B6' && mixHex('#EFE6D2', '#E3D4B6', 0.5) === '#E9DDC4', mixHex('#EFE6D2', '#E3D4B6', 0.5));

for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
const pass = checks.every((c) => c.pass);
console.log(pass ? `\nARBOR2-6-UNIT: PASS (${checks.length} checks)` : `\nARBOR2-6-UNIT: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length}`);
process.exit(pass ? 0 : 1);
