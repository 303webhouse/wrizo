// THE REORG'S BACK MENU IN FLUX, ITS STYLESHEET, BROWSERLESS (Fable, Nov 21, 3:43 pm: "piece 2: the Back menu in Flux, behind themeGate"; claude/wrizors/flux-reorg-spec.md sections 0 and 5: panels in node dress #04141A with a 1 px #7EB4C4 edge;
// a search field in Flux's field dress, fill #020C10, 1 px #5F8F95, focused a cyan edge with the thin 3 x 24 brass bar; the current item wears the choice mark, a cyan edge and the 3 x 24 brass bar; brass is her act, cyan is "live / here";
// TK6: no green-grey tier in any Flux block). No browser, no box: styles/24-reorg-flux.css is read as text; each law is given a mutant (a text rewrite) that must LAND and turn its own check red.
// SUPERSEDED (Nov 21, the redesign rule): //   SCOPED  every rule is under [data-theme='flux'] (so no other theme, and nothing outside the reorg's own markup, is touched)
//   SCOPED  every rule is under :root[data-flux3][data-theme='flux'] (the Flux REDESIGN's scope: the plain Flux, every other theme, and nothing outside the reorg's own markup, is touched)
//   COVER   every Machina rule that dresses the Back menu's lists, sorts, "+" menus and the search (23-reorg-back.css, 23-reorg-top.css) has a Flux twin: nothing is left to the browser's raw buttons and fields
//   FIELD   the search door and field: fill #020C10, 1 px #5F8F95; focused, a cyan edge and the 3 x 24 brass bar
//   CHOICE  the current Part and the current search hit wear the choice mark: a cyan edge and the 3 x 24 brass bar
//   NODE    the "+" menu pops in node dress: fill #04141A, 1 px #7EB4C4
//   TK6     every hex colour in the file has blue above green and none is a green-grey tier (#8FB4AC, #6E958D, #7FA8A0 without its check)
//   BRASS   brass (var(--orange)) is only ever a 3 x 24 bar on a current or focused item (her act), never a fill, text or edge colour
//   TABS    the fourth tab, Before uplink, stays on one line (it only exists under the reorg's Back menu)
// Run: node scripts/harness/reorg-flux-back-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/24-reorg-flux.css');
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));

// a tiny reader: rules as { sel, body } (no nesting in this file), comments dropped
const rules = (css) => {
  const t = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = []; let i = 0;
  while (i < t.length) {
    const o = t.indexOf('{', i); if (o < 0) break;
    const c = t.indexOf('}', o); if (c < 0) break;
    out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim().replace(/\s+/g, ' ') });
    i = c + 1;
  }
  return out;
};
// a selector list split at its TOP-level commas only (a comma inside :is(...) is not a separator)
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []);
const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const tk6 = (h) => { const [r, g, b] = rgb(h); return b >= g; };
const find = (R, re) => R.filter((x) => re.test(x.sel));
const has = (R, selRe, bodyRe) => find(R, selRe).some((x) => bodyRe.test(x.body));

// the Machina selectors that dress the Back menu's lists, sorts, "+" menus and search: the twin set the Flux file must carry
const machinaSelectors = () => {
  const out = new Set();
  const take = (css, starts) => { for (const x of rules(css)) { const parts = topSplit(x.sel); for (const p of parts) if (p.startsWith("[data-theme='machina']") && starts.some((st) => p.includes(st))) out.add(p.replace("[data-theme='machina'] ", '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/\[aria-[a-z]+='[a-z]+'\]/g, '').trim()); } };
  take(rd('styles/23-reorg-back.css'), ['.wz-back-part', '.wz-back-assets-head', '.wz-back-icon', '.wz-back-asset-kind', '.wz-back-beside', '.wz-assets-add', '.wz-assets-picker', '.wz-assets-sort', '.wz-back-docassets']);
  take(rd('styles/23-reorg-top.css'), ['.reorg-search']);
  return [...out];
};

function suite(css) {
  const R = {};
  const rs = rules(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => {
    // SUPERSEDED (Nov 21): const bad = rs.filter((x) => !topSplit(x.sel).every((p) => /^(:root)?\[data-theme='flux'\]/.test(p))).map((x) => x.sel.slice(0, 80));
    const bad = rs.filter((x) => !topSplit(x.sel).every((p) => /^:root\[data-flux3\]\[data-theme='flux'\]/.test(p))).map((x) => x.sel.slice(0, 80));
    return { pass: rs.length > 20 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) };
  });
  t('COVER', () => {
    const want = machinaSelectors();
    const have = new Set(rs.flatMap((x) => topSplit(x.sel).map((p) => p.replace(":root[data-flux3][data-theme='flux'] ", '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/\[aria-[a-z]+='[a-z]+'\]/g, '').trim())));
    const missing = want.filter((w) => !have.has(w));
    return { pass: want.length > 30 && missing.length === 0, detail: J({ want: want.length, missing: missing.slice(0, 6) }) };
  });
  t('FIELD', () => {
    const door = find(rs, /reorg-search-door|reorg-search-field/);
    const base = door.some((x) => /background:\s*#020C10/i.test(x.body) && /border:\s*1px solid #5F8F95/i.test(x.body));
    const focus = has(rs, /:focus-within/, /border-color:\s*var\(--line-active\)/);
    const bar = has(rs, /(reorg-search-door|reorg-search-field)[^,]*:focus-within::before/, /width:\s*3px/) && has(rs, /(reorg-search-door|reorg-search-field)[^,]*:focus-within::before/, /height:\s*24px/) && has(rs, /(reorg-search-door|reorg-search-field)[^,]*:focus-within::before/, /background:\s*var\(--orange\)/);
    return { pass: base && focus && bar, detail: J({ base, focus, bar }) };
  });
  t('CHOICE', () => {
    const part = has(rs, /wz-back-part\.is-here > \.wz-back-part-head$/, /box-shadow:\s*inset 0 0 0 1px var\(--line-active\)/) && has(rs, /wz-back-part\.is-here > \.wz-back-part-head::before/, /width:\s*3px; height:\s*24px|height:\s*24px; [^}]*width:\s*3px/) && has(rs, /wz-back-part\.is-here > \.wz-back-part-head::before/, /background:\s*var\(--orange\)/);
    const hit = has(rs, /reorg-search-hit\[aria-current='true'\]$/, /border-left-color:\s*var\(--orange\)/) && has(rs, /reorg-search-hit\[aria-current='true'\]$/, /box-shadow:\s*inset 0 0 0 1px var\(--line-active\)/);
    return { pass: part && hit, detail: J({ part, hit }) };
  });
  t('NODE', () => {
    const pop = find(rs, /wz-assets-add-pop$/).some((x) => /background:\s*#04141A/i.test(x.body) && /border:\s*1px solid #7EB4C4/i.test(x.body));
    return { pass: pop, detail: J({ pop }) };
  });
  t('TK6', () => {
    const all = hexes(css);
    const bad = all.filter((h) => !tk6(h) || /^#(8FB4AC|6E958D)$/i.test(h));
    return { pass: all.length > 5 && bad.length === 0, detail: J({ n: all.length, bad }) };
  });
  t('BRASS', () => {
    // var(--orange) / var(--brass) may only be the background of a ::before bar 3px wide and 24px tall, or a border-left-color of a current hit
    const uses = rs.filter((x) => /var\(--(orange|brass)\)/.test(x.body));
    const bad = uses.filter((x) => !(topSplit(x.sel).every((p) => /::before$/.test(p)) && /background:\s*var\(--(orange|brass)\)/.test(x.body) && /width:\s*3px/.test(x.body) && /height:\s*24px/.test(x.body)) && !(/aria-current='true'/.test(x.sel) && /border-left-color:\s*var\(--orange\)/.test(x.body))).map((x) => x.sel.slice(0, 70));
    return { pass: uses.length >= 3 && bad.length === 0, detail: J({ uses: uses.length, bad }) };
  });
  t('TABS', () => {
    const tabs = has(rs, /wz-drawer-tabs:has\(#wz-tutor-tab-export\) \.wz-drawer-tab$/, /white-space:\s*nowrap/);
    return { pass: tabs, detail: J({ tabs }) };
  });
  t('ROOM', () => {
    // the Wrizors' Flux pass 1, REAL 4 ("The c", "The …", "PLAN BOA…": row names cut to a few letters): a Plan row's name, an asset row's label and a canvas group's name take the row, and the row's buttons wrap under them (always visible: a touch screen has no hover)
    const plan = has(rs, /wz-back-plan-row > \.wz-back-plan-name$/, /flex:\s*1 1 calc\(100% - 40px\)/) && has(rs, /wz-back-plan-row$/, /flex-wrap:\s*wrap/);
    const asset = has(rs, /wz-back-asset$/, /flex-wrap:\s*wrap/) && has(rs, /wz-back-asset \.wz-links-label$/, /flex:\s*1 1 calc\(100% - 80px\)/);
    const head = has(rs, /wz-back-boardhead$/, /flex-wrap:\s*wrap/) && has(rs, /wz-back-boardhead > \.wz-back-boardname$/, /flex:\s*1 1 calc\(100% - 64px\)/);
    const always = !rs.some((x) => /wz-back-plan-(part|acts|btn)|wz-back-beside|wz-back-topart/.test(x.sel) && /opacity:\s*0|visibility:\s*hidden|display:\s*none|pointer-events:\s*none/.test(x.body));
    return { pass: plan && asset && head && always, detail: J({ plan, asset, head, always }) };
  });
  t('TABMARK', () => {
    // NIT 1: the open tab has Flux's choice mark: the cyan edge and the thin 3 x 24 brass bar
    const base = has(rs, /wz-drawer-slide--right \.wz-drawer-tab\[data-on='true'\]$/, /position:\s*relative/);
    const bar = has(rs, /wz-drawer-slide--right \.wz-drawer-tab\[data-on='true'\]::before$/, /width:\s*3px/) && has(rs, /wz-drawer-slide--right \.wz-drawer-tab\[data-on='true'\]::before$/, /height:\s*24px/) && has(rs, /wz-drawer-slide--right \.wz-drawer-tab\[data-on='true'\]::before$/, /background:\s*var\(--orange\)/);
    return { pass: base && bar, detail: J({ base, bar }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
const KEYS = ['SCOPED', 'COVER', 'FIELD', 'CHOICE', 'NODE', 'TK6', 'BRASS', 'TABS', 'ROOM', 'TABMARK'];
for (const k of KEYS) ok(`${k} on the real 24-reorg-flux.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '24-reorg-flux.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /23-reorg-back\.css$/.test(p));
ok('WIRED the global stylesheet lists 24-reorg-flux.css right after 23-reorg-back.css (the Machina reorg sheets)', at >= 0 && /24-reorg-flux\.css$/.test(PARTS[at + 1] || ''), J({ at, next: PARTS[at + 1] }));

const MUT = [
  // SUPERSEDED (Nov 21): ['a rule escapes the Flux scope', 'SCOPED', (t) => t.replace("[data-theme='flux'] .wz-assets-sort{", () => '.wz-assets-sort{')],
  ['a rule escapes the redesign scope (the plain Flux gets it)', 'SCOPED', (t) => t.replace(":root[data-flux3][data-theme='flux'] .wz-assets-sort{", () => ":root[data-theme='flux'] .wz-assets-sort{")],
  ['a rule escapes to every theme', 'SCOPED', (t) => t.replace(":root[data-flux3][data-theme='flux'] .wz-assets-sort{", () => '.wz-assets-sort{')],
  ['the sort buttons lose their twin', 'COVER', (t) => t.split('.wz-assets-sort > button').join('.wz-assets-sorted > button')],
  ['the field fill drifts', 'FIELD', (t) => t.replace('background:#020C10', () => 'background:#041214')],
  ['the field edge turns brass', 'FIELD', (t) => t.replace(':focus-within{ border-color:var(--line-active); }', () => ':focus-within{ border-color:var(--orange); }')],
  ['the current Part loses its brass bar', 'CHOICE', (t) => t.replace("wz-back-part-head::before{ content:''; position:absolute; left:0; top:50%; width:3px; height:24px; margin-top:-12px; background:var(--orange);", () => "wz-back-part-head::before{ content:''; position:absolute; left:0; top:50%; width:3px; height:24px; margin-top:-12px; background:var(--line-active);")],
  ['the pop-up fill drifts', 'NODE', (t) => t.replace('background:#04141A', () => 'background:#0A1814')],
  ['a green-grey tier returns', 'TK6', (t) => t.replace('#7EB4C4', () => '#8FB4AC')],
  ['brass becomes a fill', 'BRASS', (t) => t.replace(":root[data-flux3][data-theme='flux'] .wz-assets-sort > button[aria-pressed='true']{", () => ":root[data-flux3][data-theme='flux'] .wz-assets-sort > button[aria-pressed='true']{ background:var(--orange);")],
  ['a canvas group head lets its buttons squeeze the name again', 'ROOM', (t) => t.replace('.wz-back-boardhead > .wz-back-boardname{ flex:1 1 calc(100% - 64px);', () => '.wz-back-boardhead > .wz-back-boardname{ flex:1 1 auto;')],
  ['an asset row stops wrapping', 'ROOM', (t) => t.replace('.wz-back-asset{ flex-wrap:wrap;', () => '.wz-back-asset{ flex-wrap:nowrap;')],
  ['the open tab loses its brass bar', 'TABMARK', (t) => t.replace(/(wz-drawer-slide--right \.wz-drawer-tab\[data-on='true'\]::before\{[^}]*background:)var\(--orange\)/, (m, a) => a + 'var(--line-active)')],
  ['the open tab bar is brass but 2 px', 'TABMARK', (t) => t.replace(/(wz-drawer-slide--right \.wz-drawer-tab\[data-on='true'\]::before\{[^}]*)width:3px/, (m, a) => a + 'width:2px')],
  ['the fourth tab may wrap', 'TABS', (t) => t.replace('white-space:nowrap; letter-spacing', () => 'white-space:normal; letter-spacing')],
];
for (const [name, key, fn] of MUT) {
  const after = CSS ? fn(CSS) : CSS;
  const landed = !!CSS && after !== CSS;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FLUX-BACK-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FLUX-BACK-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
