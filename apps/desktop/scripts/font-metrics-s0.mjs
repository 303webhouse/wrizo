// ITEM 207 S0 — chars-per-line drift across the nine-face roster. BROWSERLESS: it reads the bundled font files
// (WOFF and WOFF2, by a minimal sfnt reader - no font library is a dependency) and computes, per face, the mean
// advance of a real English prose sample and the x-height, in em.
//
//   node apps/desktop/scripts/font-metrics-s0.mjs [--json]
//
// WHAT IT CAN AND CANNOT SAY. Advance widths come from the file's hmtx; for a VARIABLE font that is the DEFAULT
// instance (the Regular master), so the weight-400 reading is the one measured. Kerning and ligatures are not
// applied (they move a line by well under 1%). It does NOT replace a rendered measurement: the harness
// (item207.mjs, box turn) re-measures in the real engine, and this file's numbers are what that run is checked against.
//
// Times New Roman and Arial are measured through Tinos and Arimo: metric-compatible by design (identical advance
// widths glyph for glyph), which is the whole reason they are the fallbacks. It is an inference, named as one.
import { readFileSync } from 'node:fs';
import { inflateSync, brotliDecompressSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const NM = join(here, '..', 'node_modules');
const WOFF2_TAGS = ['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];

function tablesOf(buf) {
  const sig = buf.toString('latin1', 0, 4);
  const out = new Map();
  if (sig === 'wOFF') {
    const n = buf.readUInt16BE(12);
    for (let i = 0; i < n; i += 1) {
      const o = 44 + i * 20; const tag = buf.toString('latin1', o, o + 4);
      const off = buf.readUInt32BE(o + 4); const comp = buf.readUInt32BE(o + 8); const orig = buf.readUInt32BE(o + 12);
      const raw = buf.subarray(off, off + comp);
      out.set(tag, { data: comp < orig ? inflateSync(raw) : raw, transformed: false });
    }
    return out;
  }
  if (sig !== 'wOF2') throw new Error('not a WOFF/WOFF2 file');
  const n = buf.readUInt16BE(12); const compLen = buf.readUInt32BE(20);
  let p = 48;
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i += 1) { const b = buf[p]; p += 1; v = (v << 7) | (b & 0x7f); if (!(b & 0x80)) return v >>> 0; } throw new Error('bad UIntBase128'); };
  const dir = [];
  for (let i = 0; i < n; i += 1) {
    const flags = buf[p]; p += 1;
    const idx = flags & 0x3f; const ver = (flags >> 6) & 3;
    let tag; if (idx === 63) { tag = buf.toString('latin1', p, p + 4); p += 4; } else tag = WOFF2_TAGS[idx];
    const orig = base128();
    const isGlyfLoca = tag === 'glyf' || tag === 'loca';
    const transformed = isGlyfLoca ? ver === 0 : ver !== 0;   // hmtx: version 1 = transformed
    const len = transformed ? base128() : orig;
    dir.push({ tag, len, transformed });
  }
  const stream = brotliDecompressSync(buf.subarray(p, p + compLen));
  let q = 0;
  for (const d of dir) { out.set(d.tag, { data: stream.subarray(q, q + d.len), transformed: d.transformed }); q += d.len; }
  return out;
}

function cmapOf(t) {
  const d = t.get('cmap').data; const n = d.readUInt16BE(2); let best = null;
  for (let i = 0; i < n; i += 1) {
    const pid = d.readUInt16BE(4 + i * 8); const eid = d.readUInt16BE(6 + i * 8); const off = d.readUInt32BE(8 + i * 8);
    const fmt = d.readUInt16BE(off);
    if ((pid === 3 && eid === 10 && fmt === 12) || (pid === 3 && eid === 1 && fmt === 4) || (pid === 0 && (fmt === 4 || fmt === 12))) { if (!best || fmt === 12) best = { off, fmt }; }
  }
  if (!best) throw new Error('no usable cmap');
  const { off, fmt } = best; const map = new Map();
  if (fmt === 4) {
    const segX2 = d.readUInt16BE(off + 6); const seg = segX2 / 2;
    const endO = off + 14; const startO = endO + segX2 + 2; const deltaO = startO + segX2; const rangeO = deltaO + segX2;
    for (let s = 0; s < seg; s += 1) {
      const end = d.readUInt16BE(endO + s * 2); const start = d.readUInt16BE(startO + s * 2); const delta = d.readInt16BE(deltaO + s * 2); const ro = d.readUInt16BE(rangeO + s * 2);
      for (let c = start; c <= end && c !== 0xffff; c += 1) {
        let g;
        if (ro === 0) g = (c + delta) & 0xffff;
        else { const gi = rangeO + s * 2 + ro + (c - start) * 2; g = gi + 2 <= d.length ? d.readUInt16BE(gi) : 0; if (g) g = (g + delta) & 0xffff; }
        if (g) map.set(c, g);
      }
    }
  } else {
    const ng = d.readUInt32BE(off + 12);
    for (let i = 0; i < ng; i += 1) { const o = off + 16 + i * 12; const s = d.readUInt32BE(o); const e = d.readUInt32BE(o + 4); const g0 = d.readUInt32BE(o + 8); for (let c = s; c <= e; c += 1) map.set(c, g0 + (c - s)); }
  }
  return map;
}

function fontOf(file) {
  const t = tablesOf(readFileSync(file));
  const head = t.get('head').data; const upm = head.readUInt16BE(18);
  const hhea = t.get('hhea').data; const nh = hhea.readUInt16BE(34);
  const hm = t.get('hmtx'); const adv = new Array(nh);
  if (hm.transformed) { for (let i = 0; i < nh; i += 1) adv[i] = hm.data.readUInt16BE(1 + i * 2); }
  else { for (let i = 0; i < nh; i += 1) adv[i] = hm.data.readUInt16BE(i * 4); }
  const os2 = t.get('OS/2')?.data; const xh = os2 && os2.readUInt16BE(0) >= 2 ? os2.readInt16BE(86) : 0; const cap = os2 && os2.readUInt16BE(0) >= 2 ? os2.readInt16BE(88) : 0;
  const cmap = cmapOf(t);
  const advOf = (cp) => { const g = cmap.get(cp); if (g === undefined) return null; return adv[Math.min(g, nh - 1)] / upm; };
  return { upm, advOf, xHeight: xh / upm, capHeight: cap / upm };
}

// A real English prose sample from the repo's own docs (the words a writer's page holds), never a synthetic pangram.
const SAMPLE = readFileSync(join(here, '..', '..', '..', 'docs', 'PHILOSOPHY.md'), 'utf8').replace(/[#*_>`|\-]+/g, ' ').replace(/\s+/g, ' ').slice(0, 40000);

const F = (pkg, file) => join(NM, pkg, 'files', file);
const ROSTER = [
  ['Crimson Pro (default, today)', F('@fontsource-variable/crimson-pro', 'crimson-pro-latin-wght-normal.woff2'), 'serif'],
  ['Lora', F('@fontsource-variable/lora', 'lora-latin-wght-normal.woff2'), 'serif'],
  ['EB Garamond', F('@fontsource-variable/eb-garamond', 'eb-garamond-latin-wght-normal.woff2'), 'serif'],
  ['Source Serif 4', F('@fontsource-variable/source-serif-4', 'source-serif-4-latin-wght-normal.woff2'), 'serif'],
  ['Times New Roman (via Tinos)', F('@fontsource/tinos', 'tinos-latin-400-normal.woff'), 'serif'],
  ['Figtree (sans voice)', F('@fontsource-variable/figtree', 'figtree-latin-wght-normal.woff2'), 'sans'],
  ['Atkinson Hyperlegible', F('@fontsource/atkinson-hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff'), 'sans'],
  ['Arial (via Arimo)', F('@fontsource/arimo', 'arimo-latin-400-normal.woff'), 'sans'],
  ['Courier Prime (WORST CASE: monospace)', F('@fontsource/courier-prime', 'courier-prime-latin-400-normal.woff'), 'mono'],
];

const rows = [];
for (const [name, file, cls] of ROSTER) {
  const f = fontOf(file);
  let sum = 0; let n = 0; let miss = 0;
  for (const ch of SAMPLE) { const a = f.advOf(ch.codePointAt(0)); if (a === null) { miss += 1; continue; } sum += a; n += 1; }
  rows.push({ name, cls, meanAdvanceEm: sum / n, xHeightEm: f.xHeight, capHeightEm: f.capHeight, sampleChars: n, missing: miss });
}
const base = rows[0];
// The measure: at the SAME font-size (17px x scale) and the SAME column width, characters per line is
// inversely proportional to the mean advance. Relative to Crimson Pro (what every page renders in today).
for (const r of rows) {
  r.cplVsToday = base.meanAdvanceEm / r.meanAdvanceEm;                    // > 1: more characters per line than today
  r.xHeightVsToday = r.xHeightEm / base.xHeightEm;                        // perceived size
  // size-adjust that would EQUALISE x-height with today's face, and the chars-per-line it then leaves
  r.sizeAdjustXh = base.xHeightEm / r.xHeightEm;
  r.cplVsTodayAfterXhAdjust = r.cplVsToday / r.sizeAdjustXh;
  // size-adjust that would equalise the MEASURE (mean advance) - and the x-height it then leaves
  r.sizeAdjustMeasure = base.meanAdvanceEm / r.meanAdvanceEm;
  r.xHeightVsTodayAfterMeasureAdjust = r.xHeightVsToday * r.sizeAdjustMeasure;
}
// The column: .mode-pagecol is min(760px x scale, 60ch) and its `ch` is the CHROME font's zero (body font-family is
// --font-ui = Figtree, or Rajdhani under one theme), NOT the prose face - so the paper's width never depends on the face.
const fig = fontOf(F('@fontsource-variable/figtree', 'figtree-latin-wght-normal.woff2'));
const zero = fig.advOf(0x30);
const colPx = Math.min(760, 60 * zero * 16);
const contentPx = colPx - 2 * 38;                                          // .paper-page horizontal padding (index.css, scale 1)
const out = { sampleChars: SAMPLE.length, chromeZeroEm: zero, columnPx: Math.round(colPx), contentPx: Math.round(contentPx), rows };
for (const r of rows) r.charsPerLineToday17px = Math.round(contentPx / (r.meanAdvanceEm * 17));
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`sample ${SAMPLE.length} chars · chrome '0' = ${zero.toFixed(3)}em · column ${out.columnPx}px · text width ${out.contentPx}px (scale 1, 17px)\n`);
console.log('face'.padEnd(40) + 'adv(em)  x-h(em)  cpl@17px  cpl vs today  x-h vs today | size-adjust to equalise x-height -> cpl vs today | equalise measure -> x-h vs today');
for (const r of rows) {
  console.log(r.name.padEnd(40) + r.meanAdvanceEm.toFixed(3).padEnd(9) + r.xHeightEm.toFixed(3).padEnd(9) + String(r.charsPerLineToday17px).padEnd(10)
    + (r.cplVsToday * 100).toFixed(0).padStart(4) + '%'.padEnd(10) + (r.xHeightVsToday * 100).toFixed(0).padStart(4) + '%'.padEnd(6) + '| '
    + `${r.sizeAdjustXh.toFixed(3)} -> ${(r.cplVsTodayAfterXhAdjust * 100).toFixed(0)}%`.padEnd(30) + '| ' + `${r.sizeAdjustMeasure.toFixed(3)} -> ${(r.xHeightVsTodayAfterMeasureAdjust * 100).toFixed(0)}%`);
}
const prop = rows.filter((r) => r.cls !== 'mono');
const spread = (k) => `${(Math.min(...prop.map((r) => r[k])) * 100).toFixed(0)}%..${(Math.max(...prop.map((r) => r[k])) * 100).toFixed(0)}%`;
console.log(`\nPROPORTIONAL faces only, chars per line vs today's Crimson Pro: ${spread('cplVsToday')}  (with an x-height size-adjust: ${spread('cplVsTodayAfterXhAdjust')})`);
const mono = rows.find((r) => r.cls === 'mono');
console.log(`COURIER PRIME, reported separately (the worst case): ${(mono.cplVsToday * 100).toFixed(0)}% of today's chars per line = ${mono.charsPerLineToday17px} cpl against ${base.charsPerLineToday17px}`);
