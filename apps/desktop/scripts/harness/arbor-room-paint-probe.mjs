// ARBOR'S ROOM AND THE PAINT (found by #118's probe, Nov 24: a key into a card on an Arbor board paints in ~170 ms by day against 24 at night - the room
// pinned through the redesign's own test pin, arbor2/flag.ts arbor2RoomPin). A DIAGNOSTIC: does the same hold on a PAGE? It judges no bar.
// Each arm: a 300-word Draft page seeded through the app's seam, opened, the caret at the end, 30 keys one every 90 ms, Event Timing read for every keydown
// (duration = key -> the next paint) beside the key's own work (keydown -> input).
//   PDAY    Arbor (the redesign), the day room pinned (?arbor2=1&arbor2room=day)
//   PNIGHT  Arbor (the redesign), the night room pinned (?arbor2=1&arbor2room=night)
//   PFLUX   Flux (the redesign, the default): a page with no room, for reference
// PRINTS per arm: Event Timing keydown n / median / p95 / max / >= 48 ms, and the work median. Premises gate (each arm stood in its theme and room, every key
// reached the page); the numbers are information.
// ARBOR_ROOM_ROUNDS=<n> (default 2). Run: node scripts/harness/arbor-room-paint-probe.mjs (from apps/desktop; Actions or a box turn)
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Math.max(1, Number(process.env.ARBOR_ROOM_ROUNDS || 2));
const KEYS = 30, GAP = 90, IDLE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const stat = (xs) => { const s = (xs || []).filter((x) => x != null).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, med: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null, ge48: s.filter((x) => x >= 48).length }; };
const words = (n) => Array.from({ length: n }, (_, i) => ['light', 'kettle', 'street', 'table', 'question', 'morning', 'dog', 'answer'][i % 8]).join(' ') + '.';
const ARMS = {
  PDAY: { theme: 'plateau', url: '/?arbor2=1&arbor2room=day', room: 'day' },
  PNIGHT: { theme: 'plateau', url: '/?arbor2=1&arbor2room=night', room: 'night' },
  PFLUX: { theme: 'flux', url: '/', room: null },
};
const ORDER = Object.keys(ARMS);
const CYCLE = 'the signal holds while she writes on ';

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();

  let n = 0;
  const runArm = async (name) => {
    const arm = ARMS[name];
    const id = `arp-${name.toLowerCase()}-${++n}`;
    await ev("location.hash = '#/'"); await sleep(300);
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 15000 });
    await ev(`window.wrizoCreateJournalPage(${J({ id, text: words(300), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })})`);
    await ev(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-theme', ${J(arm.theme)});`);
    await ev(`history.replaceState(null, '', ${J(arm.url)} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await sleep(IDLE_MS);
    await ev("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()");
    await sleep(800);
    const LEN = "document.querySelector('.forward-only-editor').textContent.split('\\u200b').join('').length";
    const where = await ev(`(() => ({ theme: document.documentElement.getAttribute('data-theme'), room: document.documentElement.getAttribute('data-arbor2-room'), before: ${LEN} }))()`);
    await ev(`(() => { window.__et = []; window.__work = []; let k0 = 0;
      const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'keydown') window.__et.push(e.duration); }); po.observe({ type: 'event', durationThreshold: 16 });
      const kd = () => { k0 = performance.now(); }; const inp = () => { if (k0) { window.__work.push(performance.now() - k0); k0 = 0; } };
      document.addEventListener('keydown', kd, true); document.addEventListener('input', inp, false);
      window.__arpOff = () => { po.disconnect(); document.removeEventListener('keydown', kd, true); document.removeEventListener('input', inp, false); }; return true; })()`);
    for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[(n * 5 + i) % CYCLE.length]); await sleep(GAP); }
    await sleep(600);
    const got = await ev(`(() => { const out = { et: window.__et.slice(), work: window.__work.slice(), after: ${LEN} }; window.__arpOff(); return out; })()`);
    return { name, where, ...got };
  };

  await runArm('PNIGHT');   // warm-up, discarded
  const res = Object.fromEntries(ORDER.map((k) => [k, []]));
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = ORDER.slice((round - 1) % ORDER.length).concat(ORDER.slice(0, (round - 1) % ORDER.length));
    for (const name of rot) res[name].push(await runArm(name));
  }
  const all = Object.values(res).flat();
  ok('P1 (premise) every arm stood in its theme and room (the room read back from <html data-arbor2-room>)', all.every((r) => r.where.theme === ARMS[r.name].theme && (ARMS[r.name].room === null || r.where.room === ARMS[r.name].room)), J(all.map((r) => [r.name, r.where])));
  ok('P2 (premise) every key reached the page (it grew by the keys typed) and Event Timing saw keydowns in every arm-round', all.every((r) => r.after - r.where.before === KEYS && r.et.length > 0), J(all.map((r) => [r.name, r.after - r.where.before, r.et.length])));
  for (const name of ORDER) {
    const s = stat(res[name].flatMap((r) => r.et)), w = stat(res[name].flatMap((r) => r.work));
    console.log(`ARP ${name.padEnd(6)} Event Timing keydown n ${s.n} med ${s.med} p95 ${s.p95} max ${s.max} >=48 ${s.ge48} | work med ${w.med == null ? null : Math.round(w.med * 10) / 10}`);
  }
}); } catch (e) { ok('the probe ran to the end', false, String(e && e.message || e).slice(0, 400)); }

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 900)}]` : ''}`);
const EXPECTED = 2;
const passed = checks.filter((c) => c.pass).length;
const verdict = passed === checks.length && checks.length === EXPECTED;
console.log(verdict ? `\nARBOR-ROOM-PAINT-PROBE VERIFY: PASS (${checks.length} checks; the ARP lines are the reading)` : `\nARBOR-ROOM-PAINT-PROBE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed${checks.length !== EXPECTED ? `, ${checks.length} of ${EXPECTED} checks ran` : ''}`);
process.exit(verdict ? 0 : 1);
