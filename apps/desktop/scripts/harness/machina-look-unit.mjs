// machina-look-unit.mjs - BROWSERLESS half of MACHINA'S LOOK (Fable, Nov 19: "Machina's look SHIPS this weekend (rooms, colours, bars, splash; wow
// parts out)"; r10's mockup rebased LOOK ONLY, on by default in Machina as Arbor's redesign shipped). The browser half is machina-look.mjs.
//   F1  the flag, on Arbor's ship pattern: Machina with no query -> on, no mockup bar; ?machina2=0 -> off (test-only); ?machina2=1 -> on with the
//       mockup bar; Arbor or Flux with no query -> off; no window, or a window without a location -> off, never a throw
//   U4  every pair of §2's palette, computed: labels and quiet text >= 4.5:1, page ink >= 7:1, marks >= 3:1 (r10's U4; the dark page ink is r10's #E8E8E5)
//   U5  every rule in the Machina file is scoped under the flag and Machina's theme (or is the look's own .machina2-* class); no font CDN
//   U6  the room and the page are independent settings: no light-ROOM rule sets a page value, no light-PAGE rule a room value
//   U7  the room follows the clock (r3): the choice, the clock's edges, a pick beats the clock, the clock waits while she types
//   O1  LOOK ONLY: none of the features ruled out ships - no module, no stylesheet rule, no hook in the app's components, no mount
//   MUT the test-only ?machina2=0 guard removed (in memory, the file untouched): F1 goes red; a rule left unscoped (in memory): U5 goes red
// Run: node apps/desktop/scripts/harness/machina-look-unit.mjs -> "MACHINA-LOOK-UNIT VERIFY: PASS (n checks)". No browser, no box turn.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const read = (p) => fs.readFileSync(path.join(SRC, p), 'utf8').replace(/\r\n?/g, '\n');
const exists = (p) => fs.existsSync(path.join(SRC, p));
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${!pass && detail ? ' :: ' + detail : ''}`); };

const require = createRequire(path.join(DESKTOP, 'package.json'));
const { transform } = createRequire(require.resolve('vite'))('esbuild');
let nonce = 0;
const load = async (src) => {
  const out = await transform(src, { loader: 'ts', format: 'esm' });
  nonce += 1;
  return import('data:text/javascript;base64,' + Buffer.from(`${out.code}\n// load ${nonce}`).toString('base64'));
};

// ---- F1 the flag ----
const FLAG = exists('machina2/flag.ts') ? read('machina2/flag.ts') : '';
// one reading under a given window (undefined = none) and theme on <html>; returns { on, bar } or { threw }
const under = (mod, win, theme) => {
  const hadW = Object.prototype.hasOwnProperty.call(globalThis, 'window'), w0 = globalThis.window;
  const hadD = Object.prototype.hasOwnProperty.call(globalThis, 'document'), d0 = globalThis.document;
  if (win === undefined) delete globalThis.window; else globalThis.window = win;
  globalThis.document = { documentElement: { getAttribute: (k) => (k === 'data-theme' ? theme : null) } };
  try { return { on: mod.isMachina2(), bar: mod.machina2MockupBar(), enabled: mod.machina2Enabled() }; } catch (e) { return { threw: String((e && e.message) || e) }; }
  finally { if (hadW) globalThis.window = w0; else delete globalThis.window; if (hadD) globalThis.document = d0; else delete globalThis.document; }
};
const at = (search, hash = '#/') => ({ location: { search, hash } });
const flagReads = (mod) => ({
  machina: under(mod, at(''), 'machina'), off: under(mod, at('?machina2=0'), 'machina'), one: under(mod, at('?machina2=1'), 'machina'),
  hashOne: under(mod, at('', '#/page/x?machina2=1'), 'plateau'), arbor: under(mod, at(''), 'plateau'), flux: under(mod, at(''), 'flux'),
  noWin: under(mod, undefined, 'machina'), noLoc: under(mod, { addEventListener() {} }, 'machina'),
});
const flagOk = (r) => r.machina.on === true && r.machina.bar === false && r.off.on === false && r.off.enabled === false && r.one.on === true && r.one.bar === true
  && r.hashOne.on === true && r.arbor.on === false && r.flux.on === false && r.noWin.on === false && !r.noWin.threw && r.noLoc.on === false && !r.noLoc.threw;
let flagMod = null;
try { flagMod = FLAG && /export function machina2MockupBar/.test(FLAG) ? await load(FLAG) : null; } catch { flagMod = null; }
const fr = flagMod ? flagReads(flagMod) : null;
ok('F1 the flag on Arbor\'s ship pattern: Machina -> on (no mockup bar); ?machina2=0 -> off; ?machina2=1 (search or hash) -> on with the bar; Arbor, Flux -> off; no window / no location -> off, no throw',
  !!fr && flagOk(fr), JSON.stringify(fr));

// ---- U4 the palette ----
const L = (h) => { const n = parseInt(h.slice(1), 16); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const C = (a, b) => { const x = L(a), y = L(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; };
const pairs = [
  ['cool light labels G5 on the room G1', '#3A4047', '#E6E8EA', 4.5], ['cool light labels G5 on panels G0', '#3A4047', '#F4F5F6', 4.5],
  ['cool light quiet G4 on the room G1', '#5E666E', '#E6E8EA', 4.5], ['cool light quiet G4 on panels G0', '#5E666E', '#F4F5F6', 4.5],
  ['cool light guidance text #3F6183 on the room', '#3F6183', '#E6E8EA', 4.5], ['cool light guidance text #3F6183 on panels', '#3F6183', '#F4F5F6', 4.5],
  ['light page ink #1C1C1C on #FBFBFA', '#1C1C1C', '#FBFBFA', 7], ['light page low ink G4 on #FBFBFA', '#5E666E', '#FBFBFA', 4.5],
  ['cool dark labels G1 on the room G7', '#E6E8EA', '#151719', 4.5], ['cool dark labels G1 on panels G6', '#E6E8EA', '#23272B', 4.5],
  ['cool dark quiet G3 on the room G7', '#9AA1A8', '#151719', 4.5], ['cool dark quiet G3 on panels G6', '#9AA1A8', '#23272B', 4.5],
  ['cool dark guidance #8FA3B8 on panels G6', '#8FA3B8', '#23272B', 4.5], ['dark page ink #E8E8E5 on #1A1B1D', '#E8E8E5', '#1A1B1D', 7], ['dark page low ink G3 on #1A1B1D', '#9AA1A8', '#1A1B1D', 4.5],
  ['neutral light labels #3B3833 on the room #E9E6E1', '#3B3833', '#E9E6E1', 4.5], ['neutral light quiet #5F5A53 on the room', '#5F5A53', '#E9E6E1', 4.5], ['neutral light quiet #5F5A53 on panels #F5F3EF', '#5F5A53', '#F5F3EF', 4.5],
  ['neutral light guidance #3F6183 on the room', '#3F6183', '#E9E6E1', 4.5],
  ['neutral dark labels #E6E2DB on the room #171614', '#E6E2DB', '#171614', 4.5], ['neutral dark quiet #A09A91 on panels #242220', '#A09A91', '#242220', 4.5], ['neutral dark guidance #8FA3B8 on panels #242220', '#8FA3B8', '#242220', 4.5],
  ['COOL bar labels G1 on #1E262E', '#E6E8EA', '#1E262E', 4.5], ['COOL bar quiet G3 on #1E262E', '#9AA1A8', '#1E262E', 4.5], ['COOL bar guidance (Plan →, ?) #8FA3B8 on #1E262E', '#8FA3B8', '#1E262E', 4.5],
  ['NEUTRAL bar labels #E6E2DB on #201E1B', '#E6E2DB', '#201E1B', 4.5], ['NEUTRAL bar quiet #A09A91 on #201E1B', '#A09A91', '#201E1B', 4.5], ['NEUTRAL bar guidance #8FA3B8 on #201E1B', '#8FA3B8', '#201E1B', 4.5],
  ['brass underline on the dark bars', '#FF9800', '#1E262E', 3], ['brass underline on the dark panels', '#FF9800', '#23272B', 3],
  ['blue mark outline #7FA0BC on dark panels', '#7FA0BC', '#23272B', 3],
];
const low = pairs.map(([n, fg, bg, floor]) => [n, C(fg, bg), floor]).filter(([, r, floor]) => r < floor);
ok(`U4 all ${pairs.length} pairs of §2's palette meet their floors (labels/quiet 4.5, page ink 7, marks 3)`, low.length === 0, JSON.stringify(low));
const CSS_RAW = exists('styles/machina-v2.css') ? read('styles/machina-v2.css') : '';
const css = CSS_RAW.replace(/\/\*[\s\S]*?\*\//g, '');
ok('U4 the stylesheet carries the palette it was computed on (dark page ink #E8E8E5, the bars #1E262E / #201E1B, the light page #FBFBFA)',
  /--ink-on-paper:#E8E8E5/.test(css) && /#1E262E/.test(css) && /#201E1B/.test(css) && /--paper:#FBFBFA/.test(css) && !/#E6E6E3/.test(css), '');

// ---- U5 scoping ----
const looseRules = (text) => {
  const topSplit = (sel) => { const out = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  const loose = []; let depth = 0, buf = '';
  for (const ch of text) {
    if (ch === '{') { if (depth === 0) { const sel = buf.trim(); if (sel && !/^@/.test(sel)) for (const part of topSplit(sel)) { const s = part.trim(); if (s && !s.startsWith(':root[data-machina2]') && !s.startsWith(':root[data-wz-writing') && !/^\.machina2-/.test(s)) loose.push(s); } } depth++; buf = ''; }
    else if (ch === '}') { depth--; buf = ''; }
    else if (depth === 0) buf += ch;
  }
  return loose;
};
const loose = looseRules(css);
ok('U5 every rule in the Machina file is scoped under the flag (or is the look\'s own .machina2-* class)', css.length > 0 && loose.length === 0, JSON.stringify(loose.slice(0, 4)));
ok('U5 no font CDN, no new face (Plex is the app\'s own)', css.length > 0 && !/@font-face|googleapis|gstatic|jsdelivr|unpkg/.test(css), '');

// ---- U6 the room and the page ----
const roomRules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => [m[1].trim(), m[2]]);
const PAGE_VARS = /--(paper|paper-dim|paper-border|ink-on-paper|ink-on-paper-low)\s*:/;
const ROOM_VARS = /--(ink-950|chrome-surface|ink-900|ink-border|text-hi|text-mid|text-low|machina2-guide)\s*:/;
const crossed = roomRules.filter(([sel, body]) => (/data-machina2-room='light'/.test(sel) && PAGE_VARS.test(body)) || (/data-page='light'/.test(sel) && !/\.board-canvas/.test(sel) && ROOM_VARS.test(body)));
ok('U6 no light-ROOM rule sets a page value and no light-PAGE rule a room value (the four mixes are independent)', roomRules.length > 0 && crossed.length === 0, JSON.stringify(crossed.map(([s]) => s).slice(0, 3)));
ok('U6 the light room keys its own rules (data-machina2-room) and the light room\'s page is a hairline, not a cast shadow',
  /data-machina2-room='light'\]\{/.test(css) && /data-machina2-room='light'\] \.mode-page\{ box-shadow:0 0 0 1px/.test(css), '');

// ---- U7 the room follows the clock ----
let r3 = null;
try { r3 = exists('machina2/room.ts') ? await load(read('machina2/room.ts')) : null; } catch { r3 = null; }
if (r3) {
  const hm = (s) => r3.parseClock(s);
  ok('U7 the choice from data-room: light = Day, dark = Night, anything else = Automatic',
    r3.choiceOf('light') === 'light' && r3.choiceOf('dark') === 'dark' && r3.choiceOf(null) === 'clock' && r3.choiceOf('day') === 'clock' && r3.choiceOf('') === 'clock', '');
  ok('U7 the clock: light from 07:00 until 19:00 local, dark otherwise (the edges exact)',
    r3.clockRoom(hm('06:59:59')) === 'dark' && r3.clockRoom(hm('07:00')) === 'light' && r3.clockRoom(hm('18:59:59')) === 'light' && r3.clockRoom(hm('19:00')) === 'dark' && r3.clockRoom(hm('00:00')) === 'dark', '');
  ok('U7 a choice beats the clock; Automatic reads it', r3.wantRoom('light', hm('23:00')) === 'light' && r3.wantRoom('dark', hm('12:00')) === 'dark' && r3.wantRoom(null, hm('12:00')) === 'light' && r3.wantRoom(null, hm('23:00')) === 'dark', '');
  ok('U7 the clock waits while she types and lands once she stops; a pick and the first resolve land at once',
    r3.IDLE_MS === 5000 && r3.nextRoom('light', 'dark', false, 4999) === 'light' && r3.nextRoom('light', 'dark', false, 5000) === 'dark' && r3.nextRoom('light', 'dark', true, 0) === 'dark' && r3.nextRoom(null, 'dark', false, 0) === 'dark', '');
} else ok('U7 the room module loads', false, 'src/machina2/room.ts missing or does not load');

// ---- O1 look only ----
const OUT_MODULES = ['commandLine.tsx', 'readout.ts', 'run.tsx', 'outlineParts.tsx', 'beside.tsx', 'switches.ts', 'newPageSize.ts', 'doors.tsx'];
const presentOut = OUT_MODULES.filter((f) => exists(`machina2/${f}`));
ok('O1 no module of a feature ruled out (command line, readout, the Run\'s r10 behaviours, Outline -> Parts, Open beside, the switches, 11 pt, the doors)', exists('machina2') && presentOut.length === 0, JSON.stringify(presentOut));
const OUT_CLASSES = /\.machina2-(cmd|door|readout|legend|beside|outline|plans-outline|files-beside|ask|run|field-wrap|tick)\b|\.wz-type-num-(box|unit|plain)|\.machina-run-burst|data-machina2-off|data-machina2-run/;
ok('O1 no stylesheet rule for a feature ruled out', css.length > 0 && !OUT_CLASSES.test(css), (css.match(OUT_CLASSES) || [''])[0]);
const HOOKS = ['components/RunStrip.tsx', 'components/Sliver.tsx', 'components/Tutor.tsx', 'components/TypeControl.tsx', 'components/Cascade.tsx', 'components/CascadePanels.tsx',
  'components/ConnectionsDrawerPanel.tsx', 'components/LinkDockReader.tsx', 'components/SectionsPopout.tsx', 'store/persistence.ts'];
const hooked = HOOKS.filter((f) => exists(f) && /from '\.\.\/machina2\//.test(read(f)));
ok('O1 none of the app\'s components the out features hooked imports the look (Run, Tools drawer, Tutor, size box, rail, Plans, Assets, link dock, Files, page birth)', hooked.length === 0, JSON.stringify(hooked));
const MOUNT = exists('machina2/mount.tsx') ? read('machina2/mount.tsx') : '';
ok('O1 the mount draws the nameplate and, only under machina2MockupBar(), the bar - no command line, no door, no switches',
  /machina2MockupBar\(\) && <Panel \/>/.test(MOUNT) && /<Nameplate \/>/.test(MOUNT) && !/CommandLine|CommandDoor|Switch|Run unit|runUnit/.test(MOUNT), '');
ok('O1 the look stores nothing (no storage in the flag, the room, the chrome, the sheet, the drawer edge, the mount)',
  ['flag.ts', 'room.ts', 'chrome.ts', 'sheet.ts', 'drawerEdge.ts', 'mount.tsx', 'themeRoom.tsx', 'nameplate.tsx'].every((f) => exists(`machina2/${f}`) && !/localStorage\.setItem|sessionStorage|indexedDB/.test(read(`machina2/${f}`))), '');

// ---- MUT ----
const GUARD = "if (p === '0') return false;";
const mLanded = FLAG.includes(GUARD);
let mFlag = null; try { mFlag = mLanded ? await load(FLAG.replace(GUARD, '')) : null; } catch { mFlag = null; }
const mr = mFlag ? flagReads(mFlag) : null;
ok('MUT premise: the ?machina2=0 guard is in the flag as pinned, and the mutant removed it', mLanded && !!mFlag, '');
ok('MUT the guard-less flag FAILS F1 (Machina under ?machina2=0 still reads on)', !!mr && !flagOk(mr), JSON.stringify(mr && mr.off));
const mCss = css + "\n.mode-page{ background:#000; }\n";
ok('MUT a rule left unscoped (in memory) FAILS U5', looseRules(mCss).includes('.mode-page'), '');

const pass = results.length > 0 && results.every((r) => r.pass);
console.log(pass ? `\nMACHINA-LOOK-UNIT VERIFY: PASS (${results.length} checks)` : `\nMACHINA-LOOK-UNIT VERIFY: FAIL - ${results.filter((r) => !r.pass).length}/${results.length} failed`);
process.exit(pass ? 0 : 1);
