// THE REORG'S BACK MENU IN ARBOR, ITS STYLESHEET, BROWSERLESS (Fable, Nov 21, 4:58 pm; claude/wrizors/arbor-reorg-spec.md sections 0 and 5): the drawer-tab rule (the open tab comes forward in its own cloth, its cloth the drawer's 3 px border), PLAN in madder #A8392F, GRAFTS cold blue #7FA0BC, TUTOR olive #56632E;
// a search field in the drawer's own field style (1 px --arbor-line, #9C8A6E by night); brass is her act only (the chosen row's 4 px mark; "where you are" is olive); the cloths are Arbor's own. No browser, no box: styles/25-reorg-arbor-back.css is read as text; each law is given
// a mutant (a text rewrite) that must LAND and turn its own check red.
//   SCOPED  every rule is under :root[data-arbor2][data-theme='plateau'] (the live Arbor, the redesign: no other theme, and nothing outside the reorg's own markup, is touched)
//   COVER   every Machina rule that dresses the Back menu's lists, sorts, "+" menus and the search (23-reorg-back.css, 23-reorg-top.css) has an Arbor twin: nothing is left to the browser's raw buttons and fields
//   CLOTH   PLAN's tab is madder, comes forward when open (z-index, no box-shadow), names the drawer's 3 px border cloth (--arbor2-chosen-r, and the edge's inset shadows): the tab rule Arbor's own three tabs follow
//   FIELD   the search door and field are 1 px var(--arbor-line); focused, the edge is Arbor's "where you are" olive (--accent-rest), never brass
//   CHOSEN  the current Section's row wears the chosen-row rule: a 4 px brass mark at its left edge, roman 500; by night its words are brass, by day olive
//   ROOM    the row names keep their room (the Wrizors' pass 1, REAL 4): a Plan row's name and an asset row's label take the row's width and the row's buttons wrap to a second line, never squeezing the name to a few letters; always visible (no hover-only controls: a touch screen has no hover)
//   PALETTE every hex colour in the file is one of Arbor's (the cloths, the bars, the cream and walnut inks, the raised surfaces)
//   BRASS   brass (var(--brass)) is only ever a current mark (the chosen row's, the current search hit's), never a fill, text or edge colour elsewhere
// Run: node scripts/harness/reorg-arbor-back-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/25-reorg-arbor-back.css');
const AR = ":root[data-arbor2][data-theme='plateau']";

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
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());
const find = (R, re) => R.filter((x) => re.test(x.sel));
const has = (R, selRe, bodyRe) => find(R, selRe).some((x) => bodyRe.test(x.body));
const norm = (p) => p.replace(`${AR} `, '').replace(":root[data-arbor2][data-theme='plateau'][data-arbor2-room='day'] ", '').replace(":root[data-arbor2][data-theme='plateau'][data-arbor2-room='night'] ", '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/\[aria-[a-z]+='[a-z]+'\]/g, '').trim();

const machinaSelectors = () => {
  const out = new Set();
  const take = (css, starts) => { for (const x of rules(css)) for (const p of topSplit(x.sel)) if (p.startsWith("[data-theme='machina']") && starts.some((st) => p.includes(st))) out.add(p.replace("[data-theme='machina'] ", '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/\[aria-[a-z]+='[a-z]+'\]/g, '').trim()); };
  take(rd('styles/23-reorg-back.css'), ['.wz-back-part', '.wz-back-assets-head', '.wz-back-icon', '.wz-back-asset-kind', '.wz-back-beside', '.wz-assets-add', '.wz-assets-picker', '.wz-assets-sort', '.wz-back-docassets']);
  take(rd('styles/23-reorg-top.css'), ['.reorg-search']);
  return [...out];
};
// Arbor's own colours (arbor-reorg-spec sections 0, 6, 8; arbor-v2.css)
const PALETTE = new Set(['#56632E', '#7FA0BC', '#A8392F', '#17454E', '#C9A46B', '#39414A', '#3A4322', '#241912', '#EFE4CB', '#2B1D12', '#9C8A6E', '#F6F1E4', '#261A12', '#6B5F4E', '#B9AA8C', '#6B7A3A']);   // #6B7A3A: Arbor's opener olive (arbor-v2.css), kept on an open opener

function suite(css) {
  const R = {};
  const rs = rules(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => {
    const bad = rs.filter((x) => !topSplit(x.sel).every((p) => p.startsWith(AR))).map((x) => x.sel.slice(0, 80));
    return { pass: rs.length > 20 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) };
  });
  t('COVER', () => {
    const want = machinaSelectors();
    const have = new Set(rs.flatMap((x) => topSplit(x.sel).map(norm)));
    const missing = want.filter((w) => !have.has(w));
    return { pass: want.length > 30 && missing.length === 0, detail: J({ want: want.length, missing: missing.slice(0, 6) }) };
  });
  t('CLOTH', () => {
    const cloth = has(rs, /#wz-tutor-tab-plan\)?$|:is\(#wz-tutor-tab-plan\)$|#wz-tutor-tab-plan$/, /background:\s*#A8392F/i);
    const chosen = has(rs, /:has\(#wz-tutor-tab-plan\[data-on='true'\]\)$/, /--arbor2-chosen-r:\s*#A8392F/i);
    const forward = has(rs, /#wz-tutor-tab-plan\[data-on='true'\]$/, /z-index:\s*3/) && has(rs, /#wz-tutor-tab-plan\[data-on='true'\]$/, /box-shadow:\s*none/);
    const edge = has(rs, /:has\(#wz-tutor-tab-plan\[data-on='true'\]\) \.wz-tutor-panel \.wz-drawer-slide--right$/, /inset -3px 0 0 var\(--arbor2-chosen-r\)/) && has(rs, /:has\(#wz-tutor-tab-plan\[data-on='true'\]\) \.wz-tutor-panel \.wz-drawer-slide--right$/, /inset 0 3px 0 var\(--arbor2-chosen-r\)/);
    return { pass: cloth && chosen && forward && edge, detail: J({ cloth, chosen, forward, edge }) };
  });
  t('FIELD', () => {
    const door = find(rs, /reorg-search-door|reorg-search-field/);
    const base = door.some((x) => /border:\s*1px solid var\(--arbor-line\)/.test(x.body));
    const focus = has(rs, /:focus-within$/, /border-color:\s*var\(--accent-rest\)/);
    const noBrass = !door.some((x) => /var\(--brass\)|#C9A46B/i.test(x.body));
    return { pass: base && focus && noBrass, detail: J({ base, focus, noBrass }) };
  });
  t('CHOSEN', () => {
    const mark = has(rs, /wz-back-part\.is-here > \.wz-back-part-head$/, /box-shadow:\s*inset 4px 0 0 var\(--brass\)/) && has(rs, /wz-back-part\.is-here > \.wz-back-part-head$/, /font-weight:\s*500/);
    const night = has(rs, /data-arbor2-room='night'\] .*wz-back-part\.is-here > \.wz-back-part-head$/, /color:\s*var\(--brass\)/);
    const day = has(rs, /data-arbor2-room='day'\] .*wz-back-part\.is-here > \.wz-back-part-head$/, /color:\s*var\(--accent-rest\)/);
    return { pass: mark && night && day, detail: J({ mark, night, day }) };
  });
  t('ROOM', () => {
    const plan = has(rs, /wz-back-plan-row > \.wz-back-plan-name$/, /flex:\s*1 1 calc\(100% - 40px\)/) && has(rs, /wz-back-plan-row$/, /flex-wrap:\s*wrap/);
    const asset = has(rs, /wz-back-asset$/, /flex-wrap:\s*wrap/) && has(rs, /wz-back-asset \.wz-links-label$/, /flex:\s*1 1 calc\(100% - 80px\)/);
    const always = !rs.some((x) => /wz-back-plan-(part|acts|btn)|wz-back-beside|wz-back-topart/.test(x.sel) && /opacity:\s*0|visibility:\s*hidden|display:\s*none|pointer-events:\s*none/.test(x.body));
    // pass 1, REAL 4 (graft names cut: "PLAN ..." and "THIS ..." in GRAFTS): a canvas group's head row (tag, icon, name, then Beside / To Section / Colour / Open) lets the name take the row and the buttons wrap under it
    const head = has(rs, /wz-back-boardhead$/, /flex-wrap:\s*wrap/) && has(rs, /wz-back-boardhead > \.wz-back-boardname$/, /flex:\s*1 1 calc\(100% - 64px\)/);
    return { pass: plan && asset && head && always, detail: J({ plan, asset, head, always }) };
  });
  t('PALETTE', () => {
    const all = hexes(css);
    const bad = all.filter((h) => !PALETTE.has(h));
    return { pass: all.length > 3 && bad.length === 0, detail: J({ n: all.length, bad }) };
  });
  t('BRASS', () => {
    const uses = rs.filter((x) => /var\(--brass\)/.test(x.body));
    const bad = uses.filter((x) => !(/wz-back-part\.is-here > \.wz-back-part-head$/.test(x.sel) || /reorg-search-hit\[aria-current='true'\]$/.test(x.sel))).map((x) => x.sel.slice(0, 80));
    return { pass: uses.length >= 3 && bad.length === 0, detail: J({ uses: uses.length, bad }) };
  });
  t('OPENER', () => {
    // the Wrizors' pass 1, NIT 1 (Nick, Oct 9: an opener is not a choice, so it never takes brass): with the Back menu on, the Tutor drawer's opener keeps its olive when the drawer is open (arbor-v2.css turns an open opener brass)
    const r = find(rs, /\.desk-frame-stage:has\(#wz-tutor-tab-plan\) \.wz-tutor-grip\[data-open='true'\]$/).filter((x) => /background:\s*#6B7A3A/i.test(x.body) && /border-color:\s*#6B7A3A/i.test(x.body) && !/brass|#FF9800/i.test(x.body));
    return { pass: r.length === 1, detail: J({ n: r.length }) };
  });
  t('CHIPS', () => {
    // pass 1, NIT 3: a graft's colour chip shows its slot's cloth (the tag tokens), edged and numbered as the Section tags are
    const base = has(rs, /\.wz-back-tag$/, /width:\s*16px/) && has(rs, /\.wz-back-tag$/, /font-size:\s*0/);
    const slots = ['a', 'b', 'c', 'd', 'e', 'f'].filter((s) => !(has(rs, new RegExp(`\\.wz-back-tag\\[data-colour-slot='${s}'\\]$`), new RegExp(`background:\\s*var\\(--reorg-tag-${s}-fill\\)`)) && has(rs, new RegExp(`\\.wz-back-tag\\[data-colour-slot='${s}'\\]$`), new RegExp(`border-color:\\s*var\\(--reorg-tag-${s}-edge\\)`)) && has(rs, new RegExp(`\\.wz-back-tag\\[data-colour-slot='${s}'\\]::after$`), new RegExp(`content:\\s*var\\(--reorg-tag-${s}-num\\)`))));
    return { pass: base && slots.length === 0, detail: J({ base, missing: slots }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
const KEYS = ['SCOPED', 'COVER', 'CLOTH', 'FIELD', 'CHOSEN', 'ROOM', 'PALETTE', 'BRASS', 'OPENER', 'CHIPS'];
for (const k of KEYS) ok(`${k} on the real 25-reorg-arbor-back.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '25-reorg-arbor-back.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /23-reorg-back\.css$/.test(p));
ok('WIRED the global stylesheet lists 25-reorg-arbor-back.css after the Machina reorg sheets', at >= 0 && PARTS.some((p, i) => i > at && /25-reorg-arbor-back\.css$/.test(p)), J({ at, parts: PARTS.slice(-6) }));

const MUT = [
  ['a rule escapes the Arbor scope', 'SCOPED', (t) => t.replace(`${AR} .wz-assets-sort{`, () => '.wz-assets-sort{')],
  ['the sort buttons lose their twin', 'COVER', (t) => t.split('.wz-assets-sort > button').join('.wz-assets-sorted > button')],
  ['a canvas group head lets its buttons squeeze the name again', 'ROOM', (t) => t.replace(".wz-back-boardhead > .wz-back-boardname{ flex:1 1 calc(100% - 64px);", () => ".wz-back-boardhead > .wz-back-boardname{ flex:1 1 auto;")],
  ['the open Tutor opener goes brass again', 'OPENER', (t) => t.replace(/(wz-tutor-grip\[data-open='true'\]\{ background:)#6B7A3A; border-color:#6B7A3A/, (m, a) => a + 'var(--brass); border-color:var(--brass)')],
  ['the open Tutor opener rule is dropped', 'OPENER', (t) => t.replace(".desk-frame-stage:has(#wz-tutor-tab-plan) .wz-tutor-grip[data-open='true']", () => ".desk-frame-stage:has(#wz-tutor-tab-plan) .wz-tutor-grip[data-docked='true']")],
  ['a chip loses its cloth', 'CHIPS', (t) => t.replace(/(\.wz-back-tag\[data-colour-slot='c'\]\{ background:)var\(--reorg-tag-c-fill\)/, (m, a) => a + 'transparent')],
  ['a chip loses its number', 'CHIPS', (t) => t.replace(/content:var\(--reorg-tag-e-num\)/, () => "content:'E'")],
  ['PLAN turns olive', 'CLOTH', (t) => t.replace('background:#A8392F', () => 'background:#56632E')],
  ['PLAN does not come forward', 'CLOTH', (t) => t.replace('z-index:3; box-shadow:none', () => 'z-index:1; box-shadow:none')],
  ['the field edge turns brass', 'FIELD', (t) => t.replace(':focus-within{ border-color:var(--accent-rest); }', () => ':focus-within{ border-color:var(--brass); }')],
  ['the chosen row loses its 4 px mark', 'CHOSEN', (t) => t.replace('box-shadow:inset 4px 0 0 var(--brass)', () => 'box-shadow:inset 3px 0 0 var(--brass)')],
  ['the Plan name is squeezed again', 'ROOM', (t) => t.replace('flex:1 1 calc(100% - 40px)', () => 'flex:1 1 0')],
  ['the asset label is squeezed again', 'ROOM', (t) => t.replace('flex:1 1 calc(100% - 80px)', () => 'flex:1 1 auto')],
  ['a row control hides until hover', 'ROOM', (t) => `${t}\n${AR} .wz-back-plan-acts{ opacity:0; }\n`],
  ['a colour outside Arbor creeps in', 'PALETTE', (t) => t.replace('background:#A8392F', () => 'background:#B03A2E')],
  ['brass becomes a fill', 'BRASS', (t) => t.replace(`${AR} .wz-assets-sort > button[aria-pressed='true']{`, () => `${AR} .wz-assets-sort > button[aria-pressed='true']{ background:var(--brass);`)],
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
console.log(bad ? `\nREORG-ARBOR-BACK-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ARBOR-BACK-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
