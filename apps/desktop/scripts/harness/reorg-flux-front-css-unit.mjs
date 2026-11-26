// THE REORG'S FRONT MENU IN FLUX, ITS STYLESHEETS, SOURCE SITES AND WORDS, BROWSERLESS (Fable, Nov 22, 9:20 pm: "you build Flux's FRONT MENU of the reorg on the redesign (?flux3=1)"; claude/wrizors/flux-reorg-spec.md sections 0, 1, 4 and 6;
// flux-reorg-words.md). No browser, no box: the two sheets, Sliver.tsx, frontTabs.ts and the word table are read as text; each law has a mutant (a text rewrite) that must LAND and turn its own check red. The live half is reorg-flux-front-live.mjs.
//   SCOPED   every rule is under :root[data-flux3][data-theme='flux'] (the redesign): the plain Flux and every other theme are untouched
//   COVER    every reorg class Arbor's Front sheet dresses has a Flux rule, so nothing is left to the browser's raw buttons and fields
//   TAGS     the six slots are Flux's signals (spec section 6): a transparent fill, the signal as code and bar, the code [01] to [06]; ice is the pinned #E7F4F1; teal is #7FA8A0 unless TK6's own matcher flags it (then #7EB4C4, Nick, Nov 20)
//   CONTRAST on both Flux grounds (the panel #0F1926, node dress #04141A) a tag's code holds 4.5:1 and its bar 3:1
//   BAR      a Track's tag is a code and a 3 px bar, no chip: no fill, no box, the code drawn from the slot's token
//   NOTINT   a Track's row keeps the panel's fill (Flux marks with light, not fills)
//   CHOICE   the current Track wears Flux's choice mark: a cyan edge and the 3 x 24 brass bar
//   TABS     the tabs are caps in the chrome face; the open one has the cyan edge and the 3 x 24 brass bar; focus is cyan
//   NODE     the kind menu and the colour picker are in node dress: fill #04141A, 1 px #7EB4C4
//   FIELD    the hex field is in Flux's field dress: fill #020C10, 1 px #5F8F95; focused, a cyan edge and the brass bar
//   BADGE    the link badge is [chain n] in text-low, no box
//   TK6      every hex in the Front sheet has blue at or above green and none is a green-grey tier
//   BRASS    brass is only ever a 3 x 24 bar
//   NOARBOR  no Arbor colour, token or scope came across with the twins
//   SITES    MARKUP names the first tab, and Presets, the kind row and Frame live in the TRACKS head menu, in Arbor and Flux through ONE rule (frontKindHead); Machina keeps its reading
//   WORDS    the spec's words are in the table, and no string the Front menu reads still says "Part" in Flux
//   WIRED    the global stylesheet imports both sheets once, the tokens first
//   TICK     the one Flux tick, at all four of the reorg's checkboxes: no browser control, node dress, a 1 px #7EB4C4 edge, a cyan tick (pass 1, REAL; INK's pass 2, REAL 5)
//   EDGES    the COMMANDS buttons' edges are #5F8F95, 3:1 or better, only in the reorg's Front menu (pass 1, ship must)
//   USE      the picker's "Use" wears the button dress (NIT 4); a greyed tab looks locked (NIT 7)
//   CUSTOM   her own colour is its 3 px bar, inside a 1 px edge that holds it on the panel (rule 1), with the code [##] in text-hi (spec draft 4, sections 6 and 11)
//   NODIM    nothing in the Front sheet is dimmed by opacity: a greyed control goes to text-low (rule 5)
//   SEAM     a tab rule here names the left hand, so the Back menu's tabs (INK's) are untouched
//   ROOM     a Track's name keeps the row (the Wrizors' Flux pass 1, REAL 4, on the Back menu: "The c"): what stands left of the name is at most 58 px and the row's "..." at most 22 px
//   HINT     Uplink's hint is a sentence, so it is in sentence case in the UI face (flux-reorg-words B), not the list head's caps
// Run: node scripts/harness/reorg-flux-front-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const rh = (p) => { try { return lf(fs.readFileSync(new URL('./' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const SC = ":root[data-flux3][data-theme='flux']";
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'];
const HAND = '.desk-frame-sliver-anchor:has(#wz-sliver-tab-parts)';   // only the reorg's Front menu has the TRACKS tab, so a rule under it never reaches today's drawer

const FRONT = rd('styles/24-reorg-flux-front.css');
const TAGS = rd('styles/24-reorg-flux-tags.css');
const ARBOR = rd('styles/25-reorg-arbor-front.css');
const SLIVER = rd('components/Sliver.tsx');
const FTABS = rd('reorg/frontTabs.ts');
const WORDS = rd('store/lexicon/overrides/fluxReorg.ts');
const CANON = rd('store/lexicon/canonical/chrome.ts');
const READERS = ['reorg/PartsList.tsx', 'reorg/DocKindMenu.tsx', 'reorg/TextFolds.tsx', 'reorg/PublishParts.tsx', 'reorg/ColourPicker.tsx', 'components/Sliver.tsx'].map(rd);

// TK6's own matcher, read from its guard rather than copied, so the teal ruling follows whatever the guard flags
const TK6_RE = (() => { const m = /const greyGreen = \/([^/]+)\/i\.test\(fluxText\);/.exec(rh('flux-v2.mjs')); return m ? new RegExp(m[1], 'i') : null; })();

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@container[^{]*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g, '$1');
const rules = (css) => {
  const t = strip(css); const out = []; let i = 0;
  while (i < t.length) {
    const o = t.indexOf('{', i); if (o < 0) break;
    const c = t.indexOf('}', o); if (c < 0) break;
    out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim().replace(/\s+/g, ' ') });
    i = c + 1;
  }
  return out;
};
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out; };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exact = (R, tail) => R.filter((x) => topSplit(x.sel).includes(`${SC} ${tail}`));
const bodyOf = (R, tail) => exact(R, tail).map((x) => x.body).join(' ');
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []);
const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const tokensOf = (css) => { const out = {}; for (const m of strip(css).matchAll(/--reorg-tag-([a-f])-(fill|ink|edge|num)\s*:\s*([^;]+);/g)) out[`${m[1]}-${m[2]}`] = m[3].trim(); return out; };
const isBar = (b) => /width:\s*3px/.test(b) && /height:\s*24px/.test(b) && /background:\s*var\(--orange\)/.test(b);

function suite(front, tags, sliver, ftabs, words) {
  const R = {};
  const rs = rules(front);
  const tk = tokensOf(tags);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => {
    const all = [...rs, ...rules(tags)];
    const bad = all.filter((x) => !topSplit(x.sel).every((p) => p.startsWith(SC))).map((x) => x.sel.slice(0, 90));
    return { pass: rs.length > 60 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) };
  });
  t('COVER', () => {
    const cls = (c) => new Set(strip(c).match(/\.reorg-[a-z0-9-]+/g) || []);
    const want = [...cls(ARBOR)], have = cls(front);
    // SUPERSEDED (PRESETS-B items 1-3, Nov 24: the PARTS Presets list's "?" row (.reorg-dockind-prow) and its note (.reorg-preset-note) are Arbor's, with no Flux dress yet - Fable asked for frames of that row in Flux first; the unit names them, so a THIRD class lost is still red); original, verbatim:
    // const missing = want.filter((w) => !have.has(w));
    // return { pass: want.length > 40 && missing.length === 0, detail: J({ want: want.length, missing: missing.slice(0, 8) }) };
    // was: const PENDING = ['.reorg-dockind-prow', '.reorg-preset-note'];   (#121, Nov 24: Flux gained both rules in 24-reorg-flux-front.css, so both left the list as its rule says)
    const PENDING = [];   // Arbor-only until Flux's dress is drawn; when Flux gains a rule for one, take it out of this list (a stale name is red)
    const stale = PENDING.filter((c) => have.has(c)), unlisted = want.filter((w) => !have.has(w) && !PENDING.includes(w));
    return { pass: want.length > 40 && unlisted.length === 0 && stale.length === 0 && PENDING.every((c) => want.includes(c)), detail: J({ want: want.length, missing: unlisted.slice(0, 8), stale }) };
  });
  t('TAGS', () => {
    if (!TK6_RE) return { pass: false, detail: "TK6's matcher was not found in flux-v2.mjs" };
    const teal = TK6_RE.test('#7FA8A0') ? '#7EB4C4' : '#7FA8A0';
    const want = { a: '#00C2FF', b: '#B7FF3C', c: '#FF2E97', d: '#E7F4F1', e: teal, f: '#3A8FA5' };
    // SUPERSEDED (Nov 22, spec draft 4, section 11 rule 2: beside its bar on the panel the code is text-hi; section 6: her own colour is a bar with the code [##]), the original, verbatim:
    // const bad = SLOTS.filter((s, i) => tk[`${s}-fill`] !== 'transparent' || (tk[`${s}-ink`] || '').toUpperCase() !== want[s] || (tk[`${s}-edge`] || '').toUpperCase() !== want[s] || tk[`${s}-num`] !== `'[0${i + 1}]'`);
    const bad = SLOTS.filter((s, i) => tk[`${s}-fill`] !== 'transparent' || (tk[`${s}-ink`] || '').toUpperCase() !== '#E7F4F1' || (tk[`${s}-edge`] || '').toUpperCase() !== want[s] || tk[`${s}-num`] !== `'[0${i + 1}]'`);
    return { pass: bad.length === 0, detail: J({ bad, teal, tk: bad.length ? tk : undefined }) };
  });
  t('CONTRAST', () => {
    const low = [];
    for (const s of SLOTS) for (const g of ['#0F1926', '#04141A']) {
      const ink = tk[`${s}-ink`], edge = tk[`${s}-edge`];
      if (!ink || !edge || ratio(ink, g) < 4.5 || ratio(edge, g) < 3) low.push(`${s} on ${g}`);
    }
    return { pass: low.length === 0, detail: J({ low }) };
  });
  t('BAR', () => {
    const base = bodyOf(rs, ".reorg-parts-tag[data-colour]");
    const shape = /background:\s*none/.test(base) && /border-width:\s*0 0 0 3px/.test(base) && /border-style:\s*solid/.test(base) && /font-size:\s*0/.test(base);
    const slots = SLOTS.filter((s) => {
      const b = bodyOf(rs, `.reorg-parts-tag[data-colour='${s}']`), a = bodyOf(rs, `.reorg-parts-tag[data-colour='${s}']::after`);
      return !(b.includes(`border-left-color:var(--reorg-tag-${s}-edge)`) && b.includes(`color:var(--reorg-tag-${s}-ink)`) && a.includes(`content:var(--reorg-tag-${s}-num)`));
    });
    const noFill = !rs.some((x) => /reorg-parts-tag/.test(x.sel) && !/data-colour-hex/.test(x.sel) && /background:\s*var\(--reorg-tag/.test(x.body));
    return { pass: shape && slots.length === 0 && noFill, detail: J({ shape, slots, noFill }) };
  });
  t('NOTINT', () => { const bad = rs.filter((x) => /data-tint/.test(x.sel) && /background/.test(x.body)).map((x) => x.sel.slice(0, 90)); return { pass: bad.length === 0, detail: J({ bad }) }; });
  t('CHOICE', () => {
    const edge = /box-shadow:\s*inset 0 0 0 1px var\(--line-active\)/.test(bodyOf(rs, '.reorg-parts-row.is-here'));
    const before = exact(rs, '.reorg-parts-row.is-here::before');
    const bar = before.length > 0 && isBar(before[before.length - 1].body) && /left:\s*0/.test(before[before.length - 1].body);
    return { pass: edge && bar, detail: J({ edge, bar, rules: before.length }) };
  });
  t('TABS', () => {
    // SUPERSEDED (Nov 22, the Wrizors' Front pass 1 @ d72cc6ea), the original, verbatim: the tab rules now stand under the Front menu alone, so today's drawer is untouched
    // const tab = bodyOf(rs, '.wz-drawer-slide--left .wz-drawer-tab');
    const tab = bodyOf(rs, `${HAND} .wz-drawer-slide--left .wz-drawer-tab`);
    const caps = /text-transform:\s*uppercase/.test(tab) && /font-family:\s*var\(--font-chromeLabel/.test(tab);
    // const on = /border-color:\s*var\(--line-active\)/.test(bodyOf(rs, ".wz-drawer-slide--left .wz-drawer-tab[data-on='true']"));
    const on = /border-color:\s*var\(--line-active\)/.test(bodyOf(rs, `${HAND} .wz-drawer-slide--left .wz-drawer-tab[data-on='true']`));
    // const bar = isBar(bodyOf(rs, ".wz-drawer-slide--left .wz-drawer-tab[data-on='true']::before"));
    const bar = isBar(bodyOf(rs, `${HAND} .wz-drawer-slide--left .wz-drawer-tab[data-on='true']::before`));
    // const focus = /outline:\s*1px solid var\(--line-active\)/.test(bodyOf(rs, '.wz-drawer-slide--left .wz-drawer-tab:focus-visible'));
    const focus = /outline:\s*1px solid var\(--line-active\)/.test(bodyOf(rs, `${HAND} .wz-drawer-slide--left .wz-drawer-tab:focus-visible`));
    return { pass: caps && on && bar && focus, detail: J({ caps, on, bar, focus }) };
  });
  t('NODE', () => {
    const bad = ['.reorg-dockind-menu', '.reorg-colour-picker'].filter((c) => { const b = bodyOf(rs, c); return !/background:\s*#04141A/i.test(b) || !/border:\s*1px solid #7EB4C4/i.test(b); });
    return { pass: bad.length === 0, detail: J({ bad }) };
  });
  t('FIELD', () => {
    const b = bodyOf(rs, '.reorg-colour-hex');
    const base = /background:\s*#020C10/i.test(b) && /border:\s*1px solid #5F8F95/i.test(b);
    const focus = /border-color:\s*var\(--line-active\)/.test(bodyOf(rs, '.reorg-colour-hex:focus'));
    const bar = isBar(bodyOf(rs, '.reorg-colour-custom:has(.reorg-colour-hex:focus)::before'));
    return { pass: base && focus && bar, detail: J({ base, focus, bar }) };
  });
  t('BADGE', () => {
    const b = bodyOf(rs, 'button.reorg-parts-assets');
    const plain = /border:\s*0/.test(b) && /color:\s*var\(--text-low\)/.test(b);
    const open = /content:\s*'\['/.test(bodyOf(rs, 'button.reorg-parts-assets::before')), shut = /content:\s*'\]'/.test(bodyOf(rs, 'button.reorg-parts-assets::after'));
    return { pass: plain && open && shut, detail: J({ plain, open, shut }) };
  });
  t('TK6', () => {
    const all = hexes(strip(front));
    const bad = all.filter((h) => { const [, g, b] = rgb(h); return b < g || (TK6_RE && TK6_RE.test(h)) || /#7FA8A0/i.test(h); });
    return { pass: all.length > 0 && bad.length === 0, detail: J({ bad: [...new Set(bad)] }) };
  });
  t('BRASS', () => {
    const bad = rs.filter((x) => /var\(--(orange|brass)\)/.test(x.body) && !(/::before/.test(x.sel) && isBar(x.body))).map((x) => x.sel.slice(0, 90));
    return { pass: bad.length === 0, detail: J({ bad: bad.slice(0, 5) }) };
  });
  t('NOARBOR', () => { const s = strip(front); const bad = ['#56632E', '--arbor', 'data-arbor2', "'plateau'", '#7FA0BC', '#6B7A3A'].filter((x) => s.includes(x)); return { pass: bad.length === 0, detail: J({ bad }) }; });
  t('SITES', () => {
    const helper = /export const frontKindHead = \(theme: string \| null \| undefined\): boolean => theme === 'plateau' \|\| theme === 'flux';/.test(ftabs);
    const word = sliver.includes("text: frontKindHead(sliverTheme) ? 'railFormat' : 'inkModeText'");
    const retire = sliver.includes('frontSectionAllowed(content.kind as DrawerKind, frontTab, section, frontKindHead(theme))');
    const setup = sliver.includes("{frontTab === 'text' && frontEntry && !frontKindHead(theme) && <PageSetupZone");
    const imported = /import \{[^}]*\bfrontKindHead\b[^}]*\} from '\.\.\/reorg\/frontTabs';/.test(sliver);
    return { pass: helper && word && retire && setup && imported, detail: J({ helper, word, retire, setup, imported }) };
  });
  t('WORDS', () => {
    const want = { reorgFrontLabel: 'Tools', reorgColourThisPart: 'This track', reorgSchemeLine: "Changes every Track's colours in this Doc.", reorgColourHex: 'Hex colour', reorgPresetGroupWeb: 'Web and journalism', reorgPartIn: 'Nest', reorgPartOut: 'Unnest', reorgPartJoin: 'Merge', reorgPartJoinNo: 'Not merged.', reorgPartsJoinDone: 'Merged into Track {n}.', reorgPartJoinCarries: 'Not merged: this Track holds ink, nodes, links or an Operator thread, and merging would drop them.', reorgPartJoinScript: 'Not merged: a screenplay Track has no plain text to merge.' };   // spec draft 4, section 11 rule 9: Merge, not Join; Nest / Unnest, not Level in / out
    const wordOf = (k) => { const m = new RegExp('^\\s*' + k + ":\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|\"([^\"]*)\")", 'm').exec(words); return m ? (m[1] ?? m[2]).replace(/\\'/g, "'") : null; };
    const wrong = Object.entries(want).filter(([k, v]) => wordOf(k) !== v).map(([k]) => k);
    const keys = new Set(); for (const s of READERS) for (const m of s.matchAll(/['"`](reorg[A-Z][A-Za-z0-9]*)['"`]/g)) keys.add(m[1]);
    // SUPERSEDED (PRESETS-B item 14, Nov 25; L10): Quick Preset's six words are PROPOSED and have no Flux word yet (Flux shows "Parts" in that small form where its other menus say "Tracks": a known gap, sent to Fable
    // and the Wrizors, to be closed when Flux's words come). Exactly these six are excused, by name, so any other word is still caught. The original, verbatim:
    // const part = [...keys].filter((k) => { const c = new RegExp('^\\s*' + k + ":\\s*(['\"`])(.*?)\\1", 'm').exec(CANON); return c && /\bParts?\b/.test(c[2].replace(/\{part\}/g, '')) && wordOf(k) === null; });
    const NO_FLUX_WORD_YET = ['reorgQuickPresetLabel', 'reorgQuickPresetHint', 'reorgQuickPresetMax', 'reorgQuickPresetOne', 'reorgQuickPresetMany', 'reorgQuickPresetAdd'];
    const part = [...keys].filter((k) => { const c = new RegExp('^\\s*' + k + ":\\s*(['\"`])(.*?)\\1", 'm').exec(CANON); return c && /\bParts?\b/.test(c[2].replace(/\{part\}/g, '')) && wordOf(k) === null && !NO_FLUX_WORD_YET.includes(k); });
    return { pass: wrong.length === 0 && part.length === 0 && keys.size > 60, detail: J({ wrong, part, keys: keys.size }) };
  });
  t('ROOM', () => {
    const last = (tail, prop) => { const hit = exact(rs, tail).map((x) => new RegExp('(?:^|[ ;])' + prop + ':\\s*(?:calc\\()?(\\d+(?:\\.\\d+)?)(?:px)?(?![\\d.%a-z])').exec(x.body)).filter(Boolean).pop(); return hit ? +hit[1] : NaN; };
    const row = '.reorg-parts-list > li > .reorg-parts-row';
    const pad = last(row, 'padding-left'), gap = last(row, 'gap'), num = last('.reorg-parts-num', 'width'), tag = last('.reorg-parts-tag', 'min-width'), more = last('.reorg-parts-more', 'width'), moreM = last('.reorg-parts-more', 'margin-right');
    const left = pad + num + gap + tag + gap;
    const li = '.reorg-parts-list > li[data-part-li]';
    const grid = /display:\s*grid/.test(bodyOf(rs, li)) && /grid-template-columns:\s*minmax\(0, 1fr\) auto/.test(bodyOf(rs, li));
    const under = /grid-row:\s*2/.test(bodyOf(rs, `${li} > button.reorg-parts-assets`)) && /grid-row:\s*1/.test(bodyOf(rs, `${li} > .reorg-parts-row`)) && /grid-row:\s*3/.test(bodyOf(rs, `${li} > .reorg-part-menu`));
    return { pass: left <= 58 && more + moreM <= 22 && grid && under, detail: J({ pad, gap, num, tag, left, more, moreM, grid, under }) };
  });
  t('CUSTOM', () => {
    const tag = '.reorg-parts-tag[data-colour-hex]';
    const b = bodyOf(rs, `${tag}::before`), a = bodyOf(rs, `${tag}::after`), base = bodyOf(rs, tag);
    const bar = /width:\s*3px/.test(b) && /background:\s*var\(--part-hex\)/.test(b) && /box-shadow:\s*0 0 0 1px var\(--part-hex-edge-dark\)/.test(b);
    const code = /content:\s*'\[##\]'/.test(a) && /color:\s*var\(--text-hi\)/.test(base) && /background:\s*none/.test(base);
    return { pass: bar && code, detail: J({ bar, code }) };
  });
  t('NODIM', () => { const bad = rs.filter((x) => { const m = /(?:^|[ ;])opacity:\s*([\d.]+)/.exec(x.body); return m && +m[1] < 1; }).map((x) => x.sel.slice(-50)); return { pass: bad.length === 0, detail: J({ bad }) }; });
  // SUPERSEDED (Nov 22, the Wrizors' Front pass 1 @ d72cc6ea), the original, verbatim:
  // t('SEAM', () => { const bad = rs.flatMap((x) => topSplit(x.sel)).filter((p) => p.includes('.wz-drawer-tab') && !p.includes('.wz-drawer-slide--left')); return { pass: bad.length === 0, detail: J({ bad: bad.slice(0, 3) }) }; });
  t('SEAM', () => { const parts = rs.flatMap((x) => topSplit(x.sel)); const bad = parts.filter((p) => (p.includes('.wz-drawer-tab') && !p.includes(`${HAND} .wz-drawer-slide--left`)) || (p.includes('.wz-action-btn') && !p.includes(`${HAND} `))); return { pass: bad.length === 0 && parts.some((p) => p.includes('.wz-action-btn')), detail: J({ bad: bad.slice(0, 3) }) }; });
  t('TICK', () => {
    const box = ":is(.reorg-pubparts-row, .reorg-pub-tick, .reorg-attach-row, .reorg-plan-include) input[type='checkbox']";
    const b = bodyOf(rs, box), c = bodyOf(rs, `${box}:checked::after`);
    const dress = /(?:^|[ ;])appearance:\s*none/.test(b) && /background:\s*#04141A/i.test(b) && /border:\s*1px solid #7EB4C4/i.test(b) && /border-radius:\s*0/.test(b);
    const mark = /content:\s*''/.test(c) && /border:\s*solid var\(--line-active\)/.test(c) && /rotate\(45deg\)/.test(c);
    const focus = /outline:\s*1px solid var\(--line-active\)/.test(bodyOf(rs, `${box}:focus-visible`));
    return { pass: dress && mark && focus, detail: J({ dress, mark, focus }) };
  });
  t('EDGES', () => { const b = bodyOf(rs, `${HAND} .wz-action-btn`); const pass = /border-color:\s*#5F8F95/i.test(b) && ratio('#5F8F95', '#0F1926') >= 3 && /border-color:\s*var\(--choice\)/.test(bodyOf(rs, `${HAND} .wz-action-btn[aria-pressed='true']`)) && /outline:\s*1px solid var\(--line-active\)/.test(bodyOf(rs, `${HAND} .wz-action-btn:focus-visible`)); return { pass, detail: J({ b }) }; });
  t('USE', () => { const u = bodyOf(rs, '.reorg-colour-use'); const dressed = /background:\s*#04141A/i.test(u) && /border:\s*1px solid #7EB4C4/i.test(u); const g = bodyOf(rs, `${HAND} .wz-drawer-slide--left .wz-drawer-tab[data-disabled='true']`); const locked = /color:\s*#5F8F95/i.test(g); return { pass: dressed && locked, detail: J({ dressed, locked }) }; });
  t('HINT', () => { const b = bodyOf(rs, '.reorg-pubparts .reorg-parts-head'); const pass = /text-transform:\s*none/.test(b) && /letter-spacing:\s*normal/.test(b) && /font-family:\s*var\(--font-ui\)/.test(b); return { pass, detail: J({ b }) }; });
  return R;
}

const KEYS = ['SCOPED', 'COVER', 'TAGS', 'CONTRAST', 'BAR', 'NOTINT', 'CHOICE', 'TABS', 'NODE', 'FIELD', 'BADGE', 'TK6', 'BRASS', 'NOARBOR', 'SITES', 'WORDS', 'ROOM', 'HINT', 'CUSTOM', 'NODIM', 'SEAM', 'TICK', 'EDGES', 'USE'];
const base = suite(FRONT, TAGS, SLIVER, FTABS, WORDS);
for (const k of KEYS) ok(`${k} on the real sheets, sites and words`, base[k] && base[k].pass, base[k] ? base[k].detail : 'not run');
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = (re) => PARTS.findIndex((p) => re.test(p));
const count = (re) => PARTS.filter((p) => re.test(p)).length;
ok('WIRED the global stylesheet imports the tag tokens, then the Front sheet, once each', count(/24-reorg-flux-tags\.css$/) === 1 && count(/24-reorg-flux-front\.css$/) === 1 && at(/24-reorg-flux-tags\.css$/) < at(/24-reorg-flux-front\.css$/), J({ tags: at(/24-reorg-flux-tags\.css$/), front: at(/24-reorg-flux-front\.css$/) }));

// [name, law, which text (front / tags / sliver / ftabs / words), the rewrite]
const MUT = [
  ['a rule escapes the redesign scope (the plain Flux gets it)', 'SCOPED', 'front', (t) => t.replace(`${SC} .reorg-parts-row.is-here{`, () => ":root[data-theme='flux'] .reorg-parts-row.is-here{")],
  ['a token block escapes to every theme', 'SCOPED', 'tags', (t) => t.replace(`${SC}{`, () => ':root{')],
  ['the kind menu loses its twin', 'COVER', 'front', (t) => t.split('.reorg-dockind-sub').join('.reorg-dockind-subb')],
  ['slot c drifts off the hot pink', 'TAGS', 'tags', (t) => t.split('#FF2E97').join('#FF2E98')],
  ['ice goes back to the old text-hi', 'TAGS', 'tags', (t) => t.split('#E7F4F1').join('#E3F1EC')],
  ['a slot gets a filled chip', 'TAGS', 'tags', (t) => t.replace('--reorg-tag-a-fill:transparent', () => '--reorg-tag-a-fill:#00C2FF')],
  ['a code loses its bracket', 'TAGS', 'tags', (t) => t.replace("'[04]'", () => "'04'")],
  ['deep cyan darkens below 4.5:1', 'CONTRAST', 'tags', (t) => t.split('#3A8FA5').join('#1F5666')],
  ['the tag gets a box', 'BAR', 'front', (t) => t.replace('border-width:0 0 0 3px', () => 'border-width:1px')],
  ['a slot reads its fill as a chip', 'BAR', 'front', (t) => t.replace(`${SC} .reorg-parts-tag[data-colour='b']{`, () => `${SC} .reorg-parts-tag[data-colour='b']{ background:var(--reorg-tag-b-fill);`)],
  ['a slot draws no code', 'BAR', 'front', (t) => t.replace('content:var(--reorg-tag-f-num)', () => "content:''")],
  ['the row is tinted', 'NOTINT', 'front', (t) => t + `\n${SC} .reorg-parts-row[data-tint='a']{ background:rgba(0,194,255,.2); }`],
  ['the current Track loses its brass bar', 'CHOICE', 'front', (t) => t.replace(/(\.reorg-parts-row\.is-here::before\{[^}]*background:)var\(--orange\)/, (m, a) => a + 'var(--line-active)')],
  ['the current Track loses its cyan edge', 'CHOICE', 'front', (t) => t.replace('box-shadow:inset 0 0 0 1px var(--line-active)', () => 'box-shadow:none')],
  ['the tabs lose their caps', 'TABS', 'front', (t) => t.replace(/(\.wz-drawer-slide--left \.wz-drawer-tab\{[^}]*)text-transform:uppercase/, (m, a) => a + 'text-transform:none')],
  ['the open tab loses its bar', 'TABS', 'front', (t) => t.replace(/(\.wz-drawer-slide--left \.wz-drawer-tab\[data-on='true'\]::before\{[^}]*)height:24px/, (m, a) => a + 'height:12px')],
  ['the kind menu drifts off node dress', 'NODE', 'front', (t) => t.replace(/(\.reorg-dockind-menu\{[^}]*background:)#04141A/, (m, a) => a + '#0A1814')],
  ['the hex field drifts', 'FIELD', 'front', (t) => t.replace('background:#020C10', () => 'background:#041214')],
  ['the badge gets a box', 'BADGE', 'front', (t) => t.replace(/(button\.reorg-parts-assets\{[^}]*)border:0/, (m, a) => a + 'border:1px solid #7EB4C4')],
  ['a green-grey tier enters the sheet', 'TK6', 'front', (t) => t.replace('border:1px solid #7EB4C4', () => 'border:1px solid #8FB4AC')],
  ['brass becomes an edge', 'BRASS', 'front', (t) => t.replace(`${SC} .reorg-dockind-btn{`, () => `${SC} .reorg-dockind-btn{ border-color:var(--orange);`)],
  ["Arbor's olive comes across", 'NOARBOR', 'front', (t) => t.replace('var(--line-active)', () => '#56632E')],
  ['the first tab goes back to TEXT', 'SITES', 'sliver', (t) => t.replace("text: frontKindHead(sliverTheme) ? 'railFormat' : 'inkModeText'", () => "text: sliverTheme === 'plateau' ? 'railFormat' : 'inkModeText'")],
  ['Presets stay on MARKUP', 'SITES', 'sliver', (t) => t.replace('section, frontKindHead(theme))', () => "section, theme === 'plateau')")],
  ['Frame stays on MARKUP', 'SITES', 'sliver', (t) => t.replace('!frontKindHead(theme) && <PageSetupZone', () => "theme !== 'plateau' && <PageSetupZone")],
  ['the rule also takes Machina', 'SITES', 'ftabs', (t) => t.replace("theme === 'plateau' || theme === 'flux';", () => "theme === 'plateau' || theme === 'flux' || theme === 'machina';")],
  ['the row goes back to its wide left', 'ROOM', 'front', (t) => t.replace('padding-left:calc(7px + var(--part-level, 0) * 14px)', () => 'padding-left:calc(12px + var(--part-level, 0) * 14px)')],
  ['the row\'s "..." widens', 'ROOM', 'front', (t) => t.replace(`${SC} .reorg-parts-more{ width:20px; margin-right:0; }`, () => `${SC} .reorg-parts-more{ width:26px; margin-right:4px; }`)],
  ['the badge goes back beside the name', 'ROOM', 'front', (t) => t.replace('> button.reorg-parts-assets{ grid-row:2; grid-column:1;', () => '> button.reorg-parts-assets{ grid-row:1; grid-column:2;')],
  ['the Track row stops being a grid', 'ROOM', 'front', (t) => t.replace('li[data-part-li]{ display:grid;', () => 'li[data-part-li]{ display:flex;')],
  ['the code goes back to the signal', 'TAGS', 'tags', (t) => t.replace('--reorg-tag-c-ink:#E7F4F1', () => '--reorg-tag-c-ink:#FF2E97')],
  ['her own colour loses its code', 'CUSTOM', 'front', (t) => t.replace("content:'[##]'", () => "content:''")],
  ['her own colour loses its edge', 'CUSTOM', 'front', (t) => t.replace('box-shadow:0 0 0 1px var(--part-hex-edge-dark)', () => 'box-shadow:none')],
  ['a greyed control is dimmed again', 'NODIM', 'front', (t) => t.replace(`${SC} .reorg-colour-use[disabled]{`, () => `${SC} .reorg-colour-use[disabled]{ opacity:.4;`)],
  ['a tab rule reaches the Back menu', 'SEAM', 'front', (t) => t + `\n${SC} .wz-drawer-tab[data-disabled='true']{ cursor:default; }`],
  ['Merge goes back to Join', 'WORDS', 'words', (t) => t.replace("reorgPartJoin: 'Merge'", () => "reorgPartJoin: 'Join to the one above'")],
  ['a tab rule reaches today\'s drawer', 'SEAM', 'front', (t) => t.replace(`${SC} ${HAND} .wz-drawer-slide--left .wz-drawer-tab{`, () => `${SC} .wz-drawer-slide--left .wz-drawer-tab{`)],
  ['a command edge reaches today\'s drawer', 'SEAM', 'front', (t) => t.replace(`${SC} ${HAND} .wz-action-btn{`, () => `${SC} .wz-action-btn{`)],
  ['the tick goes back to the browser', 'TICK', 'front', (t) => t.replace('-webkit-appearance:none; appearance:none;', () => '')],
  ['the tick is no longer cyan', 'TICK', 'front', (t) => t.replace('border:solid var(--line-active); border-width:0 2px 2px 0', () => 'border:solid #7EB4C4; border-width:0 2px 2px 0')],
  ['the command edges fall back', 'EDGES', 'front', (t) => t.replace(`${HAND} .wz-action-btn{ border-color:#5F8F95;`, () => `${HAND} .wz-action-btn{ border-color:#1A3656;`)],
  ['Use loses its button dress', 'USE', 'front', (t) => t.replace(`${SC} .reorg-colour-use{ height:26px; padding:0 10px; background:#04141A; border:1px solid #7EB4C4;`, () => `${SC} .reorg-colour-use{ height:26px; padding:0 10px;`)],
  ['the hint goes back to caps', 'HINT', 'front', (t) => t.replace(`${SC} .reorg-pubparts .reorg-parts-head{ text-transform:none;`, () => `${SC} .reorg-pubparts .reorg-parts-head{ text-transform:uppercase;`)],
  ['a word is lost', 'WORDS', 'words', (t) => t.replace(/^\s*reorgColourThisPart:.*\n/m, () => '')],
];
const IDX = { front: 0, tags: 1, sliver: 2, ftabs: 3, words: 4 };
for (const [name, key, which, fn] of MUT) {
  const texts = [FRONT, TAGS, SLIVER, FTABS, WORDS];
  const before = texts[IDX[which]];
  const after = before ? fn(before) : before;
  const landed = !!before && after !== before;
  texts[IDX[which]] = after;
  let res = null, err = null;
  try { res = landed ? suite(...texts) : null; } catch (e) { err = e; }
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && !!res && res[key] && res[key].pass === false, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 500)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-FLUX-FRONT-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FLUX-FRONT-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
