// MOCKUP KIT GUARD - browserless unit (Fable, Nov 2: "a check that throws, crashes or prints no verdict is RED, never green ... add a
// self-test (a planted throw must go red)"). Drives scripts/frames/mockup-kit.mjs guarded() with a stand-in app whose tap can fire a page
// error, and asks each planted case to come out the way the guard promises. The real-browser half is scripts/frames/mockup-kit-selftest.mjs.
// Prints MOCKUP-KIT-GUARD VERIFY: PASS|FAIL. No browser, no storage.
import { guarded, isPicture } from '../frames/mockup-kit.mjs';

const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? '  -- ' + detail : ''}`); };
const fakeApp = () => { const taps = new Set(); return { taps, tap: (fn) => { taps.add(fn); return () => taps.delete(fn); }, fire: (text) => taps.forEach((f) => f('Runtime.exceptionThrown', { exceptionDetails: { text: 'Uncaught', exception: { description: text } } })) }; };
const run = async (fn, app = fakeApp()) => { const quiet = console.log; try { await fn(app, {}); return { red: false, msg: '' }; } catch (e) { return { red: true, msg: String(e && e.message || e) }; } finally { console.log = quiet; } };
const mute = (fn) => async (...a) => { const real = console.log; const lines = []; console.log = (...b) => lines.push(b.join(' ')); try { return await fn(...a); } finally { console.log = real; } };

const S = guarded({
  'u-ok': async () => console.log('UNIT-KIT u-ok {"ok":true}'),
  'u-throw': async () => { throw new Error('planted throw'); },
  'u-silent': async () => {},
  'u-page-error': async (app) => { app.fire('Error: planted page throw'); console.log('UNIT-KIT u-page-error {"ok":true}'); },
  'u-swallowed': async () => { console.log('UNIT-KIT-FAIL u-swallowed {}'); console.log('UNIT-KIT u-swallowed {}'); },
  'u-other-prefix': async () => console.log('SOMEONE-ELSE u-other-prefix {"ok":true}'),
  'u-pic-quiet': async () => {},
  'u-pic-throw': async () => { throw new Error('planted picture throw'); },
  'machina-walk-open-day-1366': async () => {},
  'machina-walk-reduced-repeat': async () => {},
}, { verdict: ['UNIT-KIT'] });

const r = {};
for (const k of Object.keys(S)) r[k] = await mute(run)(S[k]);
ok('G1 a check that prints its verdict is green', !r['u-ok'].red, r['u-ok'].msg);
ok('G2 THE PLANTED THROW is red, with its own message', r['u-throw'].red && /planted throw/.test(r['u-throw'].msg), r['u-throw'].msg);
ok('G3 a check with no verdict is red (NO VERDICT)', r['u-silent'].red && /NO VERDICT/.test(r['u-silent'].msg), r['u-silent'].msg);
ok('G4 a page error during a check is red even after a pass line, and names the error', r['u-page-error'].red && /UNCAUGHT PAGE ERROR/.test(r['u-page-error'].msg) && /planted page throw/.test(r['u-page-error'].msg), r['u-page-error'].msg);
ok('G5 a printed FAIL line that is swallowed is red', r['u-swallowed'].red && /SWALLOWED FAIL/.test(r['u-swallowed'].msg), r['u-swallowed'].msg);
ok('G6 another file\'s verdict prefix does not count as this check\'s verdict', r['u-other-prefix'].red && /NO VERDICT/.test(r['u-other-prefix'].msg), r['u-other-prefix'].msg);
ok('G7 a picture owes no verdict', !r['u-pic-quiet'].red && !r['machina-walk-open-day-1366'].red, r['u-pic-quiet'].msg);
ok('G8 a picture that throws is red', r['u-pic-throw'].red, r['u-pic-throw'].msg);
ok('G9 the walk\'s reduced repeat is a CHECK, not a picture: silent = red', r['machina-walk-reduced-repeat'].red && /NO VERDICT/.test(r['machina-walk-reduced-repeat'].msg), r['machina-walk-reduced-repeat'].msg);
// liveness: a guard that cannot watch the page is red, never a quiet pass
const blind = await mute(run)(S['u-ok'], {});
ok('G10 no app.tap = BLIND = red', blind.red && /BLIND/.test(blind.msg), blind.msg);
// the tap is released after each screen (a later screen is not blamed for an earlier page error)
const app = fakeApp(); await mute(run)(S['u-ok'], app);
ok('G11 the guard lets go of the tap when the screen ends', app.taps.size === 0, String(app.taps.size));
// console.log is restored, even after a throw
const real = console.log; await run(S['u-throw']);
ok('G12 console.log is restored after a throw', console.log === real);
ok('G13 the picture rule: "-pic-" and the walk\'s open / closed frames only', isPicture('r17-pic-tabs') && isPicture('arbor-walk-closed-day-2000') && !isPicture('arbor-walk-reduced-repeat') && !isPicture('r17-tabs'));
// a guard without verdict prefixes is refused
let refused = false; try { guarded({}, { verdict: [] }); } catch { refused = true; }
ok('G14 guarded() refuses an empty verdict list', refused);

const bad = results.filter((x) => !x.pass);
console.log(`MOCKUP-KIT-GUARD VERIFY: ${bad.length ? 'FAIL' : 'PASS'} (${results.length} checks${bad.length ? `, ${bad.length} failed` : ''})`);
process.exit(bad.length ? 1 : 0);
