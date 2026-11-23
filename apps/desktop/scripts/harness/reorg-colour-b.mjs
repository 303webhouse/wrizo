// COLOUR B: THE SCHEMES, THE PICKER, CUSTOM (reorg plan v2.1 §3b, ARBOR item 5; Nick, Nov 21 3:30 pm: Default / Muted / Vivid on the slots A-F, the
// picker with SCHEME, six swatches and "+ Custom…", ANY custom colour saved with no refusal and no suggestion; 4:53 pm: EACH DOC KEEPS ITS OWN SCHEME,
// saved with the account; Fable 4:58 pm: doc_settings.colourScheme, written through the column's guard MERGED with the Doc's other keys; Custom uses
// the existing pageSettings.color). The Wrizors' concept, claude/wrizors/part-colours-concept.md draft 2. Machina with its look, ?reorg=1.
//
// The fixture (seams only): a Doc "The Mill" she made, its six Parts cb-a .. cb-f coloured A .. F (wrizoParts.setPartColor), its settings holding a
// style guide (APA), an export format (md) and one Doc-level asset; a second Doc "Other" with one Part cb-o coloured C; a loose page cb-l. The dark
// room is pinned with the look's own clock (23:00). She is on cb-c in BUILD with the Front menu's PARTS tab open.
//
// SAVE    S1  Muted chosen in the picker's SCHEME row stores doc_settings.colourScheme 'muted' on the Doc and KEEPS its other keys (the style guide,
//             the export format, the asset) exactly as they were
//         MUT-S1  the same reading with the other keys gone (a write that overwrote them) turns S1's test red
// DRAW    S2  in Muted (dark room) each slot's tile draws the concept's Muted colour, its letter #151719
//         S3  the scheme is the Doc's: the other Doc's C tile still draws Default's C (#8FA9C4), and back on The Mill its tiles are Muted again
//         S4  the current Part's bar is brass in Default and not in Muted (data-here-bar, and the bar's own colour)
//         S5  in Muted the current Part's row takes its colour as a 10% tint over the dark panel (#23272B), within 2 per channel
// CUSTOM  S6  "+ Custom…" with #3A3A3A and Enter stores pageSettings.color '#3A3A3A' (no refusal); the picker shows no warning or suggestion; the tile
//             draws #3A3A3A with white letters (the better of the two) and the dark room's quiet-grey edge (#9AA1A8: it stands under 3:1 on the panel)
//         MUT-S6  a picker reading with a warning line turns S6's test red
// KEYS    S7  from the Part's menu, "Colour…" opens the picker on its slot; ArrowRight three times and Enter store slot E; Escape closes a picker
// LOOSE   S8  a loose page's picker has no SCHEME row, and the guard refuses a scheme on it (nothing stored)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-colour-b.mjs
process.env.WS_MACHINA2 = process.env.WS_MACHINA2 || 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const rgb = (hex) => { const m = /^#(..)(..)(..)$/.exec(hex); return `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})`; };
const MUTED_DARK = ['#9FB4CC', '#A3BC9B', '#D4B670', '#D9A091', '#C1A6CB', '#8CC2C2'];
const BRASS = 'rgb(255, 152, 0)';
const ROW = (id) => `.wz-sliver .reorg-parts-row[data-part-row="${id}"]`;
const TAGS = "[...document.querySelectorAll('.wz-sliver .reorg-parts-row')].map((r) => { const g = r.querySelector('.reorg-parts-tag'); const s = g ? getComputedStyle(g) : null; return { id: r.getAttribute('data-part-row'), slot: g && g.getAttribute('data-colour'), hex: g && g.getAttribute('data-colour-hex'), bg: s && s.backgroundColor, ink: s && s.color, edge: s && s.borderTopColor }; })";
const ROWREAD = (id) => `(() => { const r = document.querySelector(${q(ROW(id))}); if (!r) return null; return { bar: r.getAttribute('data-here-bar'), barColour: getComputedStyle(r, '::before').backgroundColor, bg: getComputedStyle(r).backgroundColor, tint: r.getAttribute('data-tint') }; })()`;
const SETTINGS = (id) => `JSON.stringify(window.wrizoDocSettings ? window.wrizoDocSettings.of(${q(id)}) : null)`;
const dbl = (sel) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return false; e.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true })); return true; })()`;
const click = (sel) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return false; e.click(); return true; })()`;
const PICKER = "(() => { const p = document.querySelector('[data-colour-picker]'); return p ? { id: p.getAttribute('data-colour-picker'), schemes: p.querySelectorAll('[data-scheme-choice]').length, text: (p.textContent || '').trim(), focus: document.activeElement && p.contains(document.activeElement) ? (document.activeElement.getAttribute('data-colour') || document.activeElement.className) : null } : null; })()";
const colourOf = (id) => `(() => { const e = (JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).find((x) => x.id === ${q(id)}); return e && e.pageSettings ? e.pageSettings.color ?? null : null; })()`;
const near = (a, b) => { const m = /(\d+), (\d+), (\d+)/.exec(a || ''); return !!m && [1, 2, 3].every((i) => Math.abs(+m[i] - b[i - 1]) <= 2); };

async function openPart(app, id) {
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && document.documentElement.getAttribute('data-machina2') === 'true'", { label: `the Part ${id}`, timeout: 20000 }).catch(() => {});
  await sleep(800);
  await app.evalJs("window.machina2Clock ? window.machina2Clock('23:00') : null"); await sleep(400);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null"); await sleep(600);
  if (await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true'")) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
  await app.waitFor("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", { label: 'the Front menu', timeout: 5000 }).catch(() => {});
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(700);
}
const settle = async (app) => { await sleep(300); await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500); };

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }).catch(() => {});
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs("window.wrizoTheme.set('machina'); localStorage.setItem('wrizo-theme', 'machina'); null");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor('!!window.wrizoParts && !!window.wrizoDocSettings', { label: 'the reorg seams', timeout: 20000 }).catch(() => {});
  await app.evalJs(`(() => { const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((s, i) => page('cb-' + s, 'Part ' + s.toUpperCase() + '. The rain had not stopped.', { origin: 'project', projectId: mill.id, orderIndex: i }));
    const other = W.wrizoCreateProject('Other'); W.wrizoSetProjectDrawer(other.id, drawer.id);
    page('cb-o', 'The other Doc.', { origin: 'project', projectId: other.id, orderIndex: 0 });
    page('cb-l', 'A loose page.', { origin: 'loose' });
    page('cb-n', 'Research notes', { origin: 'loose' });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(500);
  await app.evalJs(`(() => { const W = window; ['a', 'b', 'c', 'd', 'e', 'f'].forEach((s) => W.wrizoParts.setPartColor('cb-' + s, s)); W.wrizoParts.setPartColor('cb-o', 'c');
    W.wrizoDocSettings.set('cb-c', { styleGuide: 'apa', export: { format: 'md' } }); W.wrizoDocSettings.addAsset('cb-c', { entryId: 'cb-n' }); W.wrizoFlushNow(); return true; })()`);
  await sleep(600);

  // ---- DEFAULT, then MUTED through the picker ----------------------------------------------------------------------------------------------
  await openPart(app, 'cb-c');
  const before = JSON.parse((await app.evalJs(SETTINGS('cb-c'))) || 'null');
  const rowDefault = await app.evalJs(ROWREAD('cb-c'));
  await app.evalJs(dbl(`${ROW('cb-c')} .reorg-parts-tag`)); await sleep(500);
  const p0 = await app.evalJs(PICKER);
  await app.evalJs(click('[data-colour-picker] [data-scheme-choice="muted"]'));
  await settle(app);
  const after = JSON.parse((await app.evalJs(SETTINGS('cb-c'))) || 'null');
  await app.key('Escape'); await sleep(400);
  const others = (s) => { if (!s) return null; const { colourScheme, ...rest } = s; void colourScheme; return JSON.stringify(rest); };
  const s1 = (b, a) => !!b && !!a && a.colourScheme === 'muted' && others(a) === others(b) && b.styleGuide === 'apa' && !!b.export && Array.isArray(b.assets) && b.assets.length === 1;
  ok('S1 Muted chosen in the picker stores doc_settings.colourScheme on the Doc and keeps its other keys (style guide, export, asset) as they were', s1(before, after), { picker: p0, before, after });
  const overwritten = after ? { colourScheme: after.colourScheme } : null;
  ok('MUT-S1 the same reading with the other keys gone turns S1\'s test red', !!overwritten && others(overwritten) !== others(after) && !s1(before, overwritten), overwritten);

  const tags = await app.evalJs(TAGS);
  const mill = tags.filter((x) => /^cb-[a-f]$/.test(x.id));
  ok('S2 in Muted (dark room) each slot\'s tile draws the Muted colour with #151719 letters', mill.length === 6 && mill.every((x, i) => x.slot === 'abcdef'[i] && x.bg === rgb(MUTED_DARK[i]) && x.ink === rgb('#151719')), mill);
  const rowMuted = await app.evalJs(ROWREAD('cb-c'));
  const tint = MUTED_DARK[2].slice(1).match(/../g).map((h, i) => 0.1 * parseInt(h, 16) + 0.9 * [0x23, 0x27, 0x2B][i]);
  // SUPERSEDED (Nov 21, before this file's first green; Actions 44965381930 on ff7c81e6): S5 read the row's background only as rgb(r, g, b), and a
  // colour-mix tint computes as color(srgb r g b) - there it read 0.2067 0.2090 0.1957, which is 52.7, 53.3, 49.9: the tint asked for. S5-B reads
  // either form. Verbatim:
  //   ok('S5 in Muted the current Part\'s row is a 10% tint of its colour over the dark panel (2 per channel)', !!rowMuted && rowMuted.tint === 'c' && near(rowMuted.bg, tint), { rowMuted, want: tint.map((n) => +n.toFixed(1)) });
  const channels = (c) => { const a = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(c || ''); if (a) return [+a[1], +a[2], +a[3]]; const s = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(c || ''); return s ? [s[1], s[2], s[3]].map((v) => +v * 255) : null; };
  const nearB = (c, want) => { const v = channels(c); return !!v && v.every((x, i) => Math.abs(x - want[i]) <= 2); };
  ok('S5-B in Muted the current Part\'s row is a 10% tint of its colour over the dark panel (2 per channel; rgb() or color(srgb) read alike)', !!rowMuted && rowMuted.tint === 'c' && nearB(rowMuted.bg, tint),
    { rowMuted, read: channels(rowMuted && rowMuted.bg), want: tint.map((n) => +n.toFixed(1)) });
  ok('S4 the current Part\'s bar is brass in Default and not in Muted', !!rowDefault && rowDefault.bar === 'brass' && rowDefault.barColour === BRASS && !!rowMuted && rowMuted.bar !== 'brass' && rowMuted.barColour !== BRASS, { rowDefault, rowMuted });

  await openPart(app, 'cb-o');
  const otherTags = await app.evalJs(TAGS);
  const attrOther = await app.evalJs("document.documentElement.getAttribute('data-colour-scheme')");
  await openPart(app, 'cb-c');
  const millAgain = (await app.evalJs(TAGS)).filter((x) => x.id === 'cb-c');
  ok('S3 the scheme is the Doc\'s: the other Doc\'s C tile draws Default\'s C, and The Mill is Muted again', otherTags.length === 1 && otherTags[0].bg === rgb('#8FA9C4') && !attrOther && millAgain.length === 1 && millAgain[0].bg === rgb(MUTED_DARK[2]), { otherTags, attrOther, millAgain });

  // ---- CUSTOM ------------------------------------------------------------------------------------------------------------------------------
  await app.evalJs(dbl(`${ROW('cb-c')} .reorg-parts-tag`)); await sleep(500);
  await app.evalJs(click('[data-colour-picker] [data-colour-custom]')); await sleep(400);
  await app.evalJs("(() => { const i = document.querySelector('[data-colour-picker] [data-colour-hex]'); if (i) { i.focus(); i.select(); } return !!i; })()");
  await app.type('#3A3A3A'); await sleep(300);
  const typed = await app.evalJs(PICKER);
  await app.key('Enter');
  await settle(app);
  const stored6 = await app.evalJs(colourOf('cb-c'));
  const tile6 = (await app.evalJs(TAGS)).find((x) => x.id === 'cb-c');
  const s6 = (pk, st, tl) => !!pk && !/can.?t be read|instead|nearest|too (dark|light)/i.test(pk.text) && st === '#3A3A3A' && !!tl && tl.hex === '#3A3A3A' && tl.bg === rgb('#3A3A3A') && tl.ink === rgb('#FFFFFF') && tl.edge === rgb('#9AA1A8');
  ok('S6 "+ Custom…" #3A3A3A and Enter stores it (no refusal), the picker shows no warning or suggestion, and the tile draws it with white letters and the quiet-grey edge', s6(typed, stored6, tile6), { typed, stored6, tile6 });
  const warned = typed ? { ...typed, text: `${typed.text} Words can't be read on this one (1.3:1). Use #6E6E6E instead` } : null;
  ok('MUT-S6 a picker reading with a warning line turns S6\'s test red', !!warned && warned.text !== typed.text && !s6(warned, stored6, tile6), warned && warned.text.slice(-60));

  // ---- KEYS --------------------------------------------------------------------------------------------------------------------------------
  await app.evalJs(click('.wz-sliver [data-part-more="cb-b"]')); await sleep(300);
  await app.evalJs(click('.wz-sliver [data-part-menu="cb-b"] [data-part-act="colour"]')); await sleep(500);
  const p7 = await app.evalJs(PICKER);
  for (let i = 0; i < 3; i += 1) { await app.key('ArrowRight'); await sleep(120); }
  await app.key('Enter');
  await settle(app);
  const stored7 = await app.evalJs(colourOf('cb-b'));
  await app.evalJs(dbl(`${ROW('cb-a')} .reorg-parts-tag`)); await sleep(400);
  const open7 = await app.evalJs(PICKER);
  await app.key('Escape'); await sleep(300);
  const closed7 = await app.evalJs(PICKER);
  ok('S7 "Colour…" opens the picker on its slot; ArrowRight x3 and Enter store E; Escape closes a picker', !!p7 && p7.id === 'cb-b' && p7.focus === 'b' && stored7 === 'e' && !!open7 && closed7 === null, { p7, stored7, open7, closed7 });

  // ---- LOOSE -------------------------------------------------------------------------------------------------------------------------------
  await openPart(app, 'cb-l');
  await app.evalJs(dbl(`${ROW('cb-l')} .reorg-parts-tag`)); await sleep(500);
  const p8 = await app.evalJs(PICKER);
  const refused = await app.evalJs("window.wrizoDocSettings ? window.wrizoDocSettings.set('cb-l', { colourScheme: 'muted' }) : null");
  await app.key('Escape'); await sleep(300);
  ok('S8 a loose page\'s picker has no SCHEME row, and the guard refuses a scheme on it', !!p8 && p8.id === 'cb-l' && p8.schemes === 0 && refused === false, { p8, refused });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 10;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-COLOUR-B VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-COLOUR-B VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
