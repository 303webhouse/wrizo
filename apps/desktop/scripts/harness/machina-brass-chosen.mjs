// MACHINA'S LIGHT ROOM: A CHOSEN OPTION'S WORDS ARE NEVER BRASS (spec §2e, Law 3, Fable's ruling Nov 9: "on a light surface brass never stands
// alone ... a chosen option keeps its brass outline with a 1 px ink keyline, and its words stay in the label colour (9.6:1), as Arbor's day rule
// does"; the Wrizors' carry, chrome scale pass 2, Nov 21: "Whole document" and the chosen Form "Blank" are brass words on the light drawer, about
// 1.9:1). Machina with its look (WS_MACHINA2=default), ?reorg=1, the Front menu open on a Part; the room set with the look's own clock.
//
// LIGHT   B1  in the light room every chosen option in the Front menu (the type scope's "Whole document", the chosen Form, and any other of the
//             five chosen kinds Arbor's day rule names) reads its words in the label colour, 7:1 or better against the drawer, and draws a brass
//             ring inside its edge with a 1 px ink keyline (#23272B) outside it; at least two are on screen
// DARK    B2  in the dark room the chosen options are as before: brass words (the rule is the light room's only)
// MUTANT  MUT-B1  the light reading with the words back in brass turns B1's test red
// COUNT   B3  (the Wrizors' chrome scale pass 3, REAL, Nov 21 4:00 pm) in the light room the readout's "page n of m" under the page reads 4.5:1 or better on
//             the room it sits on (spec: the quiet G4 #5E666E, 4.75:1; it read #878E9C, 3.0:1)
//         MUT-B3  the light reading at #878E9C turns B3's test red
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/machina-brass-chosen.mjs
process.env.WS_MACHINA2 = process.env.WS_MACHINA2 || 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BRASS = 'rgb(255, 152, 0)';
const INK = 'rgb(35, 39, 43)';
const CHOSEN = ".mode-seg button.on, .wz-type-scope[data-on='true'], .wz-sliver-mode-btn[aria-pressed='true'], .wz-page-setup-chip[aria-checked='true'], .wz-template-row[aria-pressed='true']";
const READ = `(() => { const p = document.querySelector('.wz-sliver-panel'); if (!p) return null; const ground = getComputedStyle(p).backgroundColor;
  return { room: document.documentElement.getAttribute('data-machina2-room'), ground, chosen: [...p.querySelectorAll(${JSON.stringify(CHOSEN)})].filter((e) => e.getBoundingClientRect().width > 0)
    .map((e) => { const s = getComputedStyle(e); let g = null; for (let n = e.parentElement; n && !g; n = n.parentElement) { const bg = getComputedStyle(n).backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') g = bg; }
      return { cls: String(e.className).slice(0, 40), text: (e.textContent || '').trim().slice(0, 24), color: s.color, shadow: s.boxShadow, ground: g || getComputedStyle(document.body).backgroundColor }; }) }; })()`;
const rgbOf = (c) => { const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
const lum = (c) => { const v = rgbOf(c); if (!v) return NaN; const [r, g, b] = v.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

async function open(app, clock) {
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/bc-1'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && document.documentElement.getAttribute('data-machina2') === 'true'", { label: 'the Part', timeout: 20000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null"); await sleep(700);
  await app.evalJs(`window.machina2Clock ? window.machina2Clock('${clock}') : null`); await sleep(600);
  if (await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true'")) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
  await app.waitFor("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", { label: 'the Front menu', timeout: 5000 }).catch(() => {});
  await sleep(900);
}
const b1b = (r) => !!r && r.room === 'light' && r.chosen.length >= 2 && r.chosen.every((c) => contrast(c.color, c.ground) >= 7 && c.shadow.includes(BRASS) && c.shadow.includes(INK));
const b1 = !!r && r.room === 'light' && r.chosen.length >= 2 && r.chosen.every((c) => contrast(c.color, r.ground) >= 7 && c.shadow.includes(BRASS) && c.shadow.includes(INK));

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }).catch(() => {});
  await app.evalJs(`(() => { const W = window; const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    W.wrizoCreateJournalPage({ id: 'bc-1', text: ['Chapter One', ...Array.from({ length: 30 }, (_, i) => 'Paragraph ' + (i + 1) + '. The rain had not stopped for three days, and the river was up past the second step of the mill.')].join('\\n'), createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: mill.id, orderIndex: 0 });
    W.wrizoFlushNow(); return true; })()`);
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); localStorage.setItem('wrizo-theme', 'machina'); null");

  // FIXTURE (Nov 21, B3): the Part is 30 paragraphs long, so the readout counts its pages. No assertion changes to B1 and B2.
  await open(app, '12:00');
  const light = await app.evalJs(READ);
  const count = await app.evalJs("(() => { const c = document.querySelector('.wz-pagecount'); if (!c) return null; let g = null; for (let n = c.parentElement; n && !g; n = n.parentElement) { const bg = getComputedStyle(n).backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') g = bg; } return { text: (c.textContent || '').trim(), color: getComputedStyle(c).color, ground: g || getComputedStyle(document.body).backgroundColor, room: document.documentElement.getAttribute('data-machina2-room') }; })()");
  await open(app, '23:00');
  const dark = await app.evalJs(READ);
  console.log('BRASS-CHOSEN READINGS ' + JSON.stringify({ light, dark, count }));
  const b3 = (c) => !!c && c.room === 'light' && /page \d+ of \d+/i.test(c.text) && contrast(c.color, c.ground) >= 4.5;
  ok('B3 in the light room the readout\'s "page n of m" reads 4.5:1 or better on the room it sits on', b3(count), count && { ...count, ratio: +contrast(count.color, count.ground).toFixed(2) });
  const faint = count ? { ...count, color: 'rgb(135, 142, 156)' } : null;
  ok('MUT-B3 the light reading at #878E9C turns B3\'s test red', !!faint && faint.color !== count.color && !b3(faint), faint);
  // SUPERSEDED (Nov 21, before this file's first green; Actions 44958991137 and 44959200615 on 147c939b / 83a35151): B1 measured every chosen option against the drawer panel's OWN background, which reads transparent (the drawer's ground is
  // painted by a layer behind it), so the ratio was taken against nothing (2:1) while the words were already the label colour with the ring and the
  // keyline. B1-B measures each option against the first opaque layer behind it. Verbatim:
  // ok('B1 in the light room every chosen option in the Front menu reads its words in the label colour (7:1 or better on the drawer) with a brass ring and a 1 px ink keyline; at least two on screen',
  //   b1(light), light && { ground: light.ground, chosen: light.chosen.map((c) => ({ ...c, ratio: +contrast(c.color, light.ground).toFixed(2) })) });
  ok('B1-B in the light room every chosen option in the Front menu reads its words in the label colour (7:1 or better on the ground behind it) with a brass ring and a 1 px ink keyline; at least two on screen',
    b1b(light), light && { chosen: light.chosen.map((c) => ({ ...c, ratio: +contrast(c.color, c.ground).toFixed(2) })) });
  ok('B2 in the dark room the chosen options keep their brass words', !!dark && dark.room === 'dark' && dark.chosen.length >= 2 && dark.chosen.every((c) => c.color === BRASS), dark);
  const brassy = light ? { ...light, chosen: light.chosen.map((c) => ({ ...c, color: BRASS })) } : null;
  // SUPERSEDED (Nov 21, before this file's first green; Actions 44958991137 and 44959200615 on 147c939b / 83a35151): B1 is parked; its mutant moves to B1-B's test. Verbatim:
  // ok('MUT-B1 the light reading with the words back in brass turns B1\'s test red', !!brassy && brassy.chosen.length > 0 && brassy.chosen.some((c, i) => c.color !== light.chosen[i].color) && !b1(brassy), brassy && brassy.chosen);
  ok('MUT-B1-B the light reading with the words back in brass turns B1-B\'s test red', !!brassy && brassy.chosen.length > 0 && brassy.chosen.some((c, i) => c.color !== light.chosen[i].color) && !b1b(brassy), brassy && brassy.chosen);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 5;   // 3 + B3 + MUT-B3 (the Wrizors' pass 3 REAL, Nov 21)
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nMACHINA-BRASS-CHOSEN VERIFY: PASS (${checks.length} checks)`
  : `\nMACHINA-BRASS-CHOSEN VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
