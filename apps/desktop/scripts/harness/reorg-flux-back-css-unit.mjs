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
const TUTOR = rd('components/Tutor.tsx');
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

function suite(css, tutor = TUTOR) {
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
  t('CORRIDOR', () => {
    // Wire In in Flux is the Corridor (data-flux3-jacked): flux-wirein.css hides every hand, anchor and handle there (Nick, Nov 8); Nick's Nov 20 word is the newer one: the Back menu's opener stays, and the opened Back menu with it. Only the RIGHT hand's anchors come back (marked data-back by the reorg's Tutor): the left hand stays off
    const back = rs.filter((x) => /\[data-flux3-jacked\]/.test(x.sel) && /\.desk-frame-tutor-anchor/.test(x.sel) && /\.desk-frame-tutor-panel-anchor/.test(x.sel) && /\[data-back='true'\]/.test(x.sel));
    // SUPERSEDED (INK, Nov 23: the panel's anchor fills the stage, so pointer-events:auto on it swallowed every press on her page in Wire In; found reading flux3-s4c's CARET on live Flux). The original, verbatim:
    // const shown = back.some((x) => /opacity:\s*1\s*!important/.test(x.body) && /pointer-events:\s*auto\s*!important/.test(x.body));
    const grip = rs.some((x) => /\[data-flux3-jacked\]/.test(x.sel) && /\.wz-tutor-grip\[data-back='true'\]/.test(x.sel) && /pointer-events:\s*auto/.test(x.body));
    const shown = grip && back.some((x) => /opacity:\s*1\s*!important/.test(x.body) && !/pointer-events:\s*auto/.test(x.body));
    const leftOff = !rs.some((x) => /desk-frame-sliver-anchor|desk-rail|desk-frame-strip|flux3-glitchbar/.test(x.sel) && /\[data-flux3-jacked\]/.test(x.sel));
    return { pass: shown && leftOff, detail: J({ rules: back.length, shown, leftOff }) };
  });
  t('CORRIDOR2', () => {
    // Actions run 45114045303 (FB11): the anchors were drawn but the grip was still not hit-testable: Wire In is the Typewriter zoom, and 13-desk-frame.css hides both grips while the page is zoomed (.desk-frame-stage:has(.mode-pagecol[data-zoom='true']) :is(.wz-sliver-grip, .wz-tutor-grip){ visibility:hidden }). The Back menu's own grip (the reorg's, data-back) is shown again in the Corridor; the left grip stays hidden
    const g = rs.some((x) => /\[data-flux3-jacked\]/.test(x.sel) && /\.wz-tutor-grip\[data-back='true'\]/.test(x.sel) && /visibility:\s*visible/.test(x.body));
    const leftHidden = !rs.some((x) => /wz-sliver-grip/.test(x.sel) && /visibility:\s*visible/.test(x.body));
    return { pass: g && leftHidden, detail: J({ g, leftHidden }) };
  });
  // SUPERSEDED (Nov 23, Actions frames at 1920: the panel is not always clamp(320px, 34vw, 460px) wide, so a CSS placement of the grip cannot hold at every size; the grip is measured from the opened panel in Tutor.tsx instead, as a board's is). The original CORRIDOR3, verbatim:
  // t('CORRIDOR3', () => {
  // // the Wrizors-bound frames of Nov 23 (flux-back-wirein): the grip drew INSIDE the opened panel, on its OPERATOR tab. Wire In is the zoom, which widens the page's half, so the grip's formula (the page's right edge) and the panel (clamp(320px, 34vw, 460px), flush to the stage's right) no longer meet. In the Corridor the grip's anchor is placed from the panel: opened, 16 px left of the panel's own width; closed, flush to the stage's right edge. Marked by data-open on the anchor
  // const sel = (open) => rs.filter((x) => /\[data-flux3-jacked\]/.test(x.sel) && /\.desk-frame-tutor-anchor\[data-back='true'\]/.test(x.sel) && (open ? /\[data-open='true'\]/.test(x.sel) : /\[data-open='false'\]/.test(x.sel)));
  // const opened = sel(true).some((x) => /left:\s*calc\(100% - clamp\(320px, 34vw, 460px\) - 16px\)/.test(x.body) && /right:\s*auto/.test(x.body));
  // const closed = sel(false).some((x) => /left:\s*calc\(100% - 16px\)/.test(x.body) && /right:\s*auto/.test(x.body));
  // return { pass: opened && closed, detail: J({ opened, closed }) };
  // });
  t('CORRIDOR4', () => {
    // [successor] the opened grip is MEASURED from the panel: Tutor.tsx's grip-position effect runs for the reorg's Back menu too (not only a board), reads the panel's own rect, and in a prose page only in the Corridor (data-flux3-jacked); the sheet carries no guess of the panel's width
    const effect = /\(pageKind !== 'board' && !back\)/.test(tutor) && /pageKind !== 'board' && !document\.documentElement\.hasAttribute\('data-flux3-jacked'\)/.test(tutor) && /\[open, docked, pageKind, panelWidthPx, back, sprint\]/.test(tutor);
    const noGuess = !rs.some((x) => /desk-frame-tutor-anchor/.test(x.sel) && /\[data-flux3-jacked\]/.test(x.sel) && /(^|[\s;])left\s*:/.test(x.body));
    return { pass: effect && noGuess, detail: J({ effect, noGuess }) };
  });
  t('FIELDS', () => {
    // pass 2 REAL 3: the Operator's two fields and the Spine's add field are in field dress (fill #020C10, a 1 px #5F8F95 edge), and every field's hint is text-low #7EB4C4 (8.67:1), never the browser's green-grey
    const dress = rs.filter((x) => /\.wz-tutor-convo-input/.test(x.sel) && /\.wz-tutor-bible-input/.test(x.sel) && /\.wz-back-plan-input/.test(x.sel) && !/::placeholder/.test(x.sel));
    const fill = dress.some((x) => /background:\s*#020C10/i.test(x.body) && /border:\s*1px solid #5F8F95/i.test(x.body));
    const hint = rs.some((x) => /\.wz-tutor-convo-input/.test(x.sel) && /\.wz-tutor-bible-input/.test(x.sel) && /\.wz-back-plan-input/.test(x.sel) && /::placeholder/.test(x.sel) && /color:\s*#7EB4C4/i.test(x.body) && /opacity:\s*1/.test(x.body));
    return { pass: fill && hint, detail: J({ dress: dress.length, fill, hint }) };
  });
  // SUPERSEDED (#128, Fable Nov 24 11:28 am: no scrollbar arrows in any theme): scrollbar-color is the standard property, which in Chromium draws the native
  // bar whose arrows no CSS hides; the colour now rides --wz-sb-thumb / --wz-sb-track, read by the ::-webkit-scrollbar thumb and track (02-scrollbars.css).
  // The claim stands (the Back menu scrolls with #5F8F95); THUMB2 reads it where it now lives. Verbatim:
  //   t('THUMB', () => {
  //     // pass 2 REAL 4: INPUTS' scrollbar thumb was 2.06:1; the Back menu's panel and everything in it scroll with #5F8F95 (the declaration is on every element: scrollbar-color does not inherit reliably, 02-scrollbars.css)
  //     const r = rs.some((x) => /:is\(\.wz-tutor-panel, \.wz-tutor-panel \*\)$/.test(x.sel) && /scrollbar-color:\s*#5F8F95 transparent/i.test(x.body));
  //     return { pass: r, detail: J({ r }) };
  //   });
  t('THUMB2', () => {
    // #128: the same #5F8F95 thumb on a clear track, carried by the two properties every scrollbar rule now sets
    const r = rs.some((x) => /:is\(\.wz-tutor-panel, \.wz-tutor-panel \*\)$/.test(x.sel) && /--wz-sb-thumb:\s*#5F8F95/i.test(x.body) && /--wz-sb-track:\s*transparent/i.test(x.body) && !/scrollbar-color/.test(x.body));
    return { pass: r, detail: J({ r }) };
  });
  t('PANEL', () => {
    // pass 2 NIT 1: the panel is node dress (#04141A), as the rail's panels are
    const r = has(rs, /\.wz-tutor-panel$/, /background:\s*#04141A/i);
    return { pass: r, detail: J({ r }) };
  });
  // SUPERSEDED (Nov 23, the Wrizors' frames after pass 2: the 38% cap left the panel about 213 px tall at 1366 and the 'Writing prompt' button and the toggle scrolled out of view). The original WIRECAP, verbatim:
  // t('WIRECAP', () => {
  // // pass 2 REAL 1 (Arbor pass 1 had the same, and the same fix: max-height 38%): in Wire In the opened panel never reaches her line, which sits at the stage's middle
  // const r = has(rs, /\.wz-tutor-panel\[data-back-sprint='true'\]$/, /max-height:\s*38%/);
  // return { pass: r, detail: J({ r }) };
  // });
  t('WIRECAP2', () => {
    // [successor] the opened Wire In panel ends above her line (cap 54%: about 300 px at 1366, her line is at 421) AND keeps its action in view: the Back menu's search field is not drawn in Wire In (the Operator sends prompts only: there is nothing to search, Arbor's pass 1 NIT 2), which frees about 50 px
    const cap = has(rs, /\.wz-tutor-panel\[data-back-sprint='true'\]$/, /max-height:\s*54%/);
    const search = rs.some((x) => /\.wz-tutor-panel\[data-back-sprint='true'\]/.test(x.sel) && /\.reorg-search-door/.test(x.sel) && /\.reorg-search-field/.test(x.sel) && /display:\s*none/.test(x.body));
    return { pass: cap && search, detail: J({ cap, search }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
// SUPERSEDED (#128, Nov 24): THUMB parked for THUMB2 (above). Verbatim:
//   const KEYS = ['SCOPED', 'COVER', 'FIELD', 'CHOICE', 'NODE', 'TK6', 'BRASS', 'TABS', 'ROOM', 'TABMARK', 'CORRIDOR', 'CORRIDOR2', 'CORRIDOR4', 'FIELDS', 'THUMB', 'PANEL', 'WIRECAP2'];
const KEYS = ['SCOPED', 'COVER', 'FIELD', 'CHOICE', 'NODE', 'TK6', 'BRASS', 'TABS', 'ROOM', 'TABMARK', 'CORRIDOR', 'CORRIDOR2', 'CORRIDOR4', 'FIELDS', 'THUMB2', 'PANEL', 'WIRECAP2'];
for (const k of KEYS) ok(`${k} on the real 24-reorg-flux.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '24-reorg-flux.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /23-reorg-back\.css$/.test(p));
// SUPERSEDED (PRESETS-B item 18, Nov 25; L10): an item's own Machina sheet (23-reorg-compare.css, 23-reorg-quick.css) may now stand between the two; what the law is for is unchanged (the Flux dress comes after the
// Machina reorg sheets it re-dresses, with nothing else between). The original, verbatim:
// ok('WIRED the global stylesheet lists 24-reorg-flux.css right after 23-reorg-back.css (the Machina reorg sheets)', at >= 0 && /24-reorg-flux\.css$/.test(PARTS[at + 1] || ''), J({ at, next: PARTS[at + 1] }));
const afterBack = PARTS.slice(at + 1).findIndex((p) => !/23-reorg-(compare|quick)\.css$/.test(p));
ok('WIRED [successor]: the global stylesheet lists 24-reorg-flux.css right after 23-reorg-back.css (the Machina reorg sheets), only item sheets 23-reorg-compare/quick.css between', at >= 0 && afterBack >= 0 && /24-reorg-flux\.css$/.test(PARTS[at + 1 + afterBack] || ''), J({ at, after: PARTS.slice(at + 1, at + 4) }));

const MUT = [
  ['the fields lose their fill', 'FIELDS', (t) => t.replace('.wz-back-plan-input){ background:#020C10;', () => '.wz-back-plan-input){ background:#132437;')],
  ['the hints go back to the browser grey', 'FIELDS', (t) => t.replace('color:#7EB4C4; opacity:1', () => 'color:#787876; opacity:1')],
  // SUPERSEDED with THUMB (#128): its mutant, verbatim:
  //   ['the thumb is the old colour', 'THUMB', (t) => t.replace('scrollbar-color:#5F8F95 transparent', () => 'scrollbar-color:#254E7E transparent')],
  ['the thumb is the old colour', 'THUMB2', (t) => t.replace('--wz-sb-thumb:#5F8F95', () => '--wz-sb-thumb:#254E7E')],
  ['the thumb goes back to the native bar (scrollbar-color, with its arrows)', 'THUMB2', (t) => t.replace('--wz-sb-thumb:#5F8F95; --wz-sb-track:transparent;', () => '--wz-sb-thumb:#5F8F95; --wz-sb-track:transparent; scrollbar-color:#5F8F95 transparent;')],
  ['the panel is the chrome grey again', 'PANEL', (t) => t.replace(/\.wz-tutor-panel\{ background:#04141A;/, () => '.wz-tutor-panel{ background:#101A27;')],
  // SUPERSEDED (Nov 23, see WIRECAP above): its mutant, verbatim:
  // ['the Wire In panel runs to the foot again', 'WIRECAP', (t) => t.replace('max-height:38%', () => 'max-height:100%')],
  ['the Wire In panel runs to the foot again', 'WIRECAP2', (t) => t.replace('max-height:54%', () => 'max-height:100%')],
  ['the Wire In panel draws the search field again', 'WIRECAP2', (t) => t.replace('.reorg-search-field){ display:none; }', () => '.reorg-search-field){ display:block; }')],
  // [successors, against CORRIDOR4]
  ['a CSS guess of the opened grip returns to the sheet', 'CORRIDOR4', (t) => `${t}\n:root[data-flux3][data-theme='flux'][data-wirein][data-flux3-jacked] .desk-frame-tutor-anchor[data-back='true']{ left:calc(100% - 476px); }\n`],
  // SUPERSEDED (Nov 23, see CORRIDOR3 above): its two mutants, verbatim:
  // ['the opened grip is placed from the page again (inside the panel)', 'CORRIDOR3', (t) => t.replace('left:calc(100% - clamp(320px, 34vw, 460px) - 16px)', () => 'left:auto')],
  // ['the closed grip is not flush to the stage edge', 'CORRIDOR3', (t) => t.replace('left:calc(100% - 16px)', () => 'left:50%')],
  ['the grip stays hidden in the Corridor', 'CORRIDOR2', (t) => t.replace('visibility:visible', () => 'visibility:hidden')],
  ['the grip of the left hand is shown in the Corridor too', 'CORRIDOR2', (t) => `${t}
:root[data-flux3][data-theme='flux'][data-wirein][data-flux3-jacked] .wz-sliver-grip{ visibility:visible; }
`],
  ['the Corridor stops showing the opener', 'CORRIDOR', (t) => t.replace(/opacity:1 !important;/, () => 'opacity:0 !important;')],
  // SUPERSEDED (INK, Nov 23: the anchors no longer take the pointer, the grip's own rule does). The original, verbatim:
  // ['the opener cannot be pressed in the Corridor', 'CORRIDOR', (t) => t.replace('pointer-events:auto !important', () => 'pointer-events:none !important')],
  ['the opener cannot be pressed in the Corridor', 'CORRIDOR', (t) => t.replace(".wz-tutor-grip[data-back='true']{ visibility:visible; pointer-events:auto; }", () => ".wz-tutor-grip[data-back='true']{ visibility:visible; pointer-events:none; }")],
  ['the Back menu\'s anchors take the pointer again in the Corridor (the panel\'s fills the stage and swallows her press)', 'CORRIDOR', (t) => t.replace("[data-back='true']{ opacity:1 !important; }", () => "[data-back='true']{ opacity:1 !important; pointer-events:auto !important; }")],
  ['the left hand comes back in the Corridor too', 'CORRIDOR', (t) => `${t}\n:root[data-flux3][data-theme='flux'][data-wirein][data-flux3-jacked] .desk-frame-sliver-anchor{ opacity:1 !important; }\n`],
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

// CORRIDOR4's other half rewrites Tutor.tsx (a second source), so its mutants run here
const TMUT = [
  ['the measure effect loses the Back menu arm (a prose page is never measured)', (s) => s.replace("(pageKind !== 'board' && !back)", () => "pageKind !== 'board'")],
  ['the measure runs in a prose page outside the Corridor too', (s) => s.replace("(pageKind !== 'board' && !document.documentElement.hasAttribute('data-flux3-jacked'))", () => 'false')],
  ['the effect forgets the Back menu in its dependencies', (s) => s.replace('[open, docked, pageKind, panelWidthPx, back, sprint]', () => '[open, docked, pageKind, panelWidthPx]')],
];
for (const [name, fn] of TMUT) {
  const after = TUTOR ? fn(TUTOR) : TUTOR;
  const landed = !!TUTOR && after !== TUTOR;
  let res = null, err = null;
  try { res = landed ? suite(CSS, after) : null; } catch (e) { err = e; }
  ok(`MUT ${name}: it LANDED and CORRIDOR4 goes RED`, landed && !err && !!res && res.CORRIDOR4 && res.CORRIDOR4.pass === false, J({ landed, err: err && String(err.message).slice(0, 120) }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FLUX-BACK-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FLUX-BACK-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
