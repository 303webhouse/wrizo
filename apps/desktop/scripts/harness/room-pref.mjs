// THE ROOM, SAVED TO THE ACCOUNT - the browser half (Fable, Nov 19, 11:20 pm: "SAVED TO THE ACCOUNT, for Machina AND Arbor ... red-first (two devices; reload)").
// The two devices and the account are the browserless half (writing-audit/room-pref-saved.mjs: the real prefs client, the real server rules, R1-R9 and two mutants);
// this file proves the RELOAD in the real app, in both themes, with the reorg's switch off (no ?reorg=1 anywhere). Plain navigations, as arbor-default-on.mjs does:
//   RP1 Arbor: Night pressed in the Themes pop-out's Room row -> the night room; after a reload <html data-room> is 'dark' and the room is night at boot; the account
//       preferences' key holds { room: { value: 'dark' } }
//   RP2 Arbor: "By the clock" pressed -> after a reload no data-room (the clock), and the fact reads 'clock'
//   RP3 Machina: the room's attribute set as Machina's Room row sets it (Day: data-room 'light') -> after a reload data-room is 'light'
//   RP4 a theme switch keeps her room: Night in Arbor, then Machina through the theme seam, no reload: data-room still 'dark'
//   M1  (mutant) the saved fact removed before the reload (LANDED): RP1's reload read goes RED
// Seeding through the seams (wrizoCreateJournalPage, origin and source carried); the theme through the product's store key read at boot.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const READ = `(() => { const r = document.documentElement; let fact = null; try { const p = JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || 'null'); fact = p && p.room ? p.room.value : null; } catch { fact = 'unreadable'; }
  return { theme: r.getAttribute('data-theme'), room: r.getAttribute('data-room'), arborRoom: r.getAttribute('data-arbor2-room'), fact, reorg: /[?&]reorg=1/.test(location.search) }; })()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const boot = async (theme, clear) => {
    await app.goto('/');
    await app.evalJs(`localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', ${J(theme)}); ${clear ? "localStorage.removeItem('wrizo-reorg-prefs');" : ''} true`);
    await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
    await waitSoft(app, "!!document.querySelector('.wz-arrival') || !!document.querySelector('.desk-frame-stage')", { label: 'desk', timeout: 15000 });
    await sleep(1200);
  };
  // a reload that keeps storage as it is (the writer's reload): no key touched
  const reload = async () => {
    await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }); await sleep(1500);
    return app.evalJs(READ);
  };
  let n = 0;
  const openPage = async () => {
    const pid = `rpref-${++n}-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`!!window.wrizoCreateJournalPage(${J({ id: pid, text: 'Room page.\nIts second line.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${pid}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector(\".wz-strip-item[data-category='theme']\")", { label: 'page with the rail', timeout: 20000 }); await sleep(800);
  };
  const pressRoom = async (word) => {
    if (!(await app.evalJs("!!document.querySelector('.wz-theme-picker')"))) {
      await app.evalJs("(() => { const it = document.querySelector(\".wz-strip-item[data-category='theme']\"); if (it) it.click(); return !!it; })()");
      await waitSoft(app, "!!document.querySelector('.wz-theme-picker .arbor2-theme-room')", { label: 'the Room row', timeout: 6000 });
    }
    const did = await app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-theme-picker .arbor2-theme-room .mode-seg button')].find((x) => (x.textContent || '').trim() === ${J(word)}); if (!b) return false; b.click(); return true; })()`);
    await sleep(600);
    return did;
  };
  const setTheme = (t) => app.evalJs(`(() => { const s = window.wrizoTheme; if (!s || typeof s.set !== 'function') return null; s.set(${J(t)}); return s.get() === ${J(t)} ? 'seam' : 'unchanged'; })()`);

  // RP1 Arbor: Night survives a reload
  await boot('plateau', true);
  await openPage();
  const pressed = await pressRoom('Dark');
  const now1 = await app.evalJs(READ);
  const after1 = await reload();
  ok(`RP1 Arbor: Night pressed (${pressed}; room ${now1 && now1.arborRoom}) survives a reload: data-room ${after1 && after1.room}, the room ${after1 && after1.arborRoom}, the fact ${after1 && after1.fact}; the switch off (${after1 && !after1.reorg})`,
    pressed && !!now1 && now1.arborRoom === 'night' && !!after1 && after1.room === 'dark' && after1.arborRoom === 'night' && after1.fact === 'dark' && !after1.reorg, J({ now1, after1 }));

  // RP2 Arbor: the clock survives a reload
  await openPage();
  const pressed2 = await pressRoom('By the clock');
  const after2 = await reload();
  ok(`RP2 Arbor: "By the clock" pressed (${pressed2}) survives a reload: no data-room (${after2 && after2.room}), the fact ${after2 && after2.fact}`, pressed2 && !!after2 && after2.room === null && after2.fact === 'clock', J(after2));

  // RP3 Machina: Day survives a reload (the attribute Machina's Room row writes)
  await boot('machina', true);
  await app.evalJs("document.documentElement.setAttribute('data-room', 'light'); true"); await sleep(400);
  const after3 = await reload();
  ok(`RP3 Machina: Day (data-room 'light') survives a reload: data-room ${after3 && after3.room}, the fact ${after3 && after3.fact}`, !!after3 && after3.theme === 'machina' && after3.room === 'light' && after3.fact === 'light', J(after3));

  // RP4 a theme switch keeps her room
  await boot('plateau', true);
  await openPage();
  await pressRoom('Dark');
  const via = await setTheme('machina'); await sleep(1000);
  const s4 = await app.evalJs(READ);
  ok(`RP4 a theme switch keeps her room: Night in Arbor, then Machina (via ${via}): data-room ${s4 && s4.room}, the fact ${s4 && s4.fact}`, via === 'seam' && !!s4 && s4.theme === 'machina' && s4.room === 'dark' && s4.fact === 'dark', J(s4));
  await setTheme('plateau'); await sleep(600);

  // M1 the saved fact removed before the reload: RP1's read goes red
  await pressRoom('Dark');
  await app.evalJs("localStorage.removeItem('wrizo-reorg-prefs'); true");
  const landed = await app.evalJs("localStorage.getItem('wrizo-reorg-prefs') === null");
  const m1 = await reload();
  ok(`M1 (mutant): the saved fact removed before the reload (LANDED: ${landed}) - the room after the reload is ${m1 && m1.room}: RP1's read goes RED`, landed && !!m1 && !(m1.room === 'dark' && m1.fact === 'dark'), J(m1));
  return checks;
}, { label: 'room-pref' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nROOM-PREF PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 5;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nROOM-PREF VERIFY: PASS (${checks.length} checks)` : `\nROOM-PREF VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
