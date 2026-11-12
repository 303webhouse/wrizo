// FRAMES for the Wrizors (#76 part 2 and 3), not a pass/fail check: it takes pictures and measures what is drawn, then prints FRAME lines.
//   a-row    line (a) "open in another window" standing last in the page's count row (Arbor: the progress row; Machina: the Run row; Flux: the page frame's header readouts)
//   a-alone  line (a) standing by itself under the page (a page with no count row: a narrow window, progress off, no timer)
//   b-kept   line (b) "two windows changed this paragraph, both versions kept" (the quiet toast), in the window that was merged
// For each frame: the colour the line is DRAWN in (its colour with its own and its ancestors' opacity laid over the ground behind it, the ground read from the screenshot's pixels next to the line) and the contrast ratio
// of that colour to the ground (WCAG relative luminance), plus the same read from the strongest text pixel of the line as it really painted (anti-aliasing can only make that weaker).
// Run: node scripts/harness/writing-audit/frames-76.mjs (from apps/desktop; on Actions via writing-audit.yml, script=frames-76.mjs). Pictures: WA_OUT/shots/<theme>-<flag>-<tone>-<width>-<frame>.png
import fs from 'node:fs';
import path from 'node:path';
import { runTabs } from './lib/tabs-common.mjs';

const NL = String.fromCharCode(10);

export async function main({ title }) {
  await runTabs({
    title,
    cases: async (h) => {
      const { run, sleep, ev, app, d } = h;
      const W = Number(process.env.WA_W || 1366), H = Number(process.env.WA_H || 768);
      const TAG = `${process.env.WA_THEME || 'plateau'}-${process.env.WA_FLAG || 'off'}-${process.env.WA_TONE || 'light'}-${W}`;
      const OUT = process.env.WA_OUT || null;
      const B = "document.getElementById('wa-tab-b')";
      const hideB = () => ev(`(() => { const f = ${B}; if (f) f.style.cssText = 'position:fixed;left:-5000px;top:0;width:700px;height:600px;border:0'; return true; })()`);
      const fullB = () => ev(`(() => { const f = ${B}; if (f) f.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;border:0;background:#fff'; return true; })()`);
      const docOf = (w) => (w === 'B' ? `${B}.contentDocument` : 'document');
      // the line: its rectangle, colour, the product of the opacities from it up to the root
      const lineInfo = (w, sel) => ev(`(() => { const doc = ${docOf(w)}; const l = doc.querySelector(${JSON.stringify(sel)}); if (!l) return null; const win = doc.defaultView; const r = l.getBoundingClientRect(); let op = 1; for (let e = l; e && e.nodeType === 1; e = e.parentElement) { const o = parseFloat(win.getComputedStyle(e).opacity); if (Number.isFinite(o)) op *= o; } const cs = win.getComputedStyle(l); const row = l.closest('.mode-pmeta, .machina-run, .flux-readout-head'); return { text: l.textContent.trim(), x: r.left, y: r.top, w: r.width, h: r.height, color: cs.color, opacity: +op.toFixed(3), size: cs.fontSize, family: cs.fontFamily.split(',')[0], inRow: !!row, rowClass: row ? row.className : null, last: !!row && row.lastElementChild === l }; })()`);
      const luminance = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const ratio = (a, b) => { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
      const parseRgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }; };
      // the ground and the strongest text pixel, read from the screenshot (a canvas in the page decodes it): the ground = the middle value of the pixels in a band around the line, the text pixel = the one farthest from it inside the line
      const pixels = (b64, r) => ev(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); const R = ${JSON.stringify(r)}; const x0 = Math.max(0, Math.floor(R.x) - 10), y0 = Math.max(0, Math.floor(R.y) - 6), w = Math.min(c.width - x0, Math.ceil(R.w) + 20), h = Math.min(c.height - y0, Math.ceil(R.h) + 12); const data = x.getImageData(x0, y0, w, h).data; const band = [], inside = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const px = x0 + i, py = y0 + j; const k = (j * w + i) * 4; const v = [data[k], data[k + 1], data[k + 2]]; const inL = px >= R.x && px <= R.x + R.w && py >= R.y && py <= R.y + R.h; (inL ? inside : band).push(v); } const med = (a, ch) => { const s = a.map((v) => v[ch]).sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; }; const ground = band.length ? [0, 1, 2].map((ch) => med(band, ch)) : [0, 0, 0]; let best = null, bd = -1; for (const v of inside) { const dd = Math.abs(v[0] - ground[0]) + Math.abs(v[1] - ground[1]) + Math.abs(v[2] - ground[2]); if (dd > bd) { bd = dd; best = v; } } return { ground, strongest: best, n: inside.length }; })()`);
      const snap = async (name) => {
        const shot = await app.cdp('Page.captureScreenshot', { format: 'png' });
        if (OUT) { const dir = path.join(OUT, 'shots'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${TAG}-${name}.png`), Buffer.from(shot.data, 'base64')); }
        return shot.data;
      };
      const measure = async (name, info, notes) => {
        const b64 = await snap(name);
        const px = await pixels(b64, info);
        const col = parseRgb(info.color);
        const a = (col ? col.a : 1) * info.opacity;
        const g = px.ground;
        const drawn = col ? col.rgb.map((v, i) => Math.round(v * a + g[i] * (1 - a))) : null;
        const cr = drawn ? ratio(drawn, g) : null;
        const crPx = px.strongest ? ratio(px.strongest, g) : null;
        const line = `FRAME ${TAG}-${name}: "${info.text}" ${info.size} ${info.family} at ${Math.round(info.x)},${Math.round(info.y)} ${Math.round(info.w)}x${Math.round(info.h)}; colour ${info.color}, opacity ${info.opacity}; ground rgb(${g.join(',')}); drawn rgb(${drawn ? drawn.join(',') : '?'}); CONTRAST ${cr ? cr.toFixed(2) : '?'}:1 (strongest painted pixel rgb(${px.strongest ? px.strongest.join(',') : '?'}) ${crPx ? crPx.toFixed(2) : '?'}:1)${info.inRow ? `; in row .${String(info.rowClass).split(' ')[0]}, last ${info.last}` : '; standing alone'}`;
        console.log(line); notes.push(line.slice(0, 600));
        return cr;
      };
      const waitFor = async (fn, ms) => { const t0 = Date.now(); let v = await fn(); while (!v && Date.now() - t0 < ms) { await sleep(150); v = await fn(); } return v; };

      await run('FR1', 'frame: line (a) in its row', async (fails, notes) => {
        const pid = `wa-fr1-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'The quick fox ran home.' + NL + 'A second paragraph, so the page is not bare.');
        await h.openA(pid); await h.tabB(); await hideB();
        const info = await waitFor(() => lineInfo('A', '[data-same-page-elsewhere]'), 9000);
        if (!info) { fails.push('no line (a) in window A'); return; }
        await sleep(400);
        await measure('a-row', await lineInfo('A', '[data-same-page-elsewhere]'), notes);
      });

      await run('FR3', 'frame: line (b), both versions kept', async (fails, notes) => {
        const pid = `wa-fr3-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'The quick fox ran home.');
        await h.openA(pid); await h.tabB(); await hideB();
        await h.typeIn('A', 'brown ', 10);
        await h.typeIn('B', 'slowly ', 18);
        let at = null;
        const t0 = Date.now();
        while (!at && Date.now() - t0 < 16000) {
          for (const w of ['A', 'B']) { const i = await lineInfo(w, '.action-toast[data-shown="true"]'); if (i && i.w > 0) { at = { w, i }; break; } }
          if (!at) await sleep(120);
        }
        if (!at) { fails.push('no "both versions kept" line showed in either window'); return; }
        if (at.w === 'B') await fullB();
        await sleep(250);
        const info = await lineInfo(at.w, '.action-toast[data-shown="true"]');
        if (!info) { fails.push('the line went before it could be drawn'); return; }
        notes.push(`shown in window ${at.w}`);
        await measure('b-kept', info, notes);
        await hideB();
      });

      await run('FR2', 'frame: line (a) standing alone', async (fails, notes) => {
        await ev(`(() => { try { const k = 'wrizo-writing-settings'; const cur = JSON.parse(localStorage.getItem(k) || '{}'); localStorage.setItem(k, JSON.stringify({ ...cur, progress: 'off', timer: false })); } catch (e) {} return true; })()`);
        await app.reload();
        await app.waitFor("!!document.querySelector('.forward-only-editor') || !!document.body", { timeout: 20000, label: 'reload' }); await sleep(900);
        await app.emulateDpr(1, 1000, 700); await sleep(700);
        const pid = `wa-fr2-${Date.now().toString(36)}`;
        await h.mkPage(pid, 'The quick fox ran home.' + NL + 'A second paragraph, so the page is not bare.');
        await h.openA(pid); await h.tabB(); await hideB();
        const info = await waitFor(() => lineInfo('A', '[data-same-page-elsewhere]'), 9000);
        if (!info) { fails.push('no line (a) in window A with the count row off'); return; }
        if (info.inRow) notes.push('the line stands in a count row here, not alone: this configuration still has a row');
        await sleep(400);
        const cr = await measure('a-alone', await lineInfo('A', '[data-same-page-elsewhere]'), notes);
        if (!info.inRow && cr !== null && cr < 4.5) fails.push(`the alone line reads ${cr.toFixed(2)}:1 as drawn, under 4.5:1`);
        await ev(`(() => { try { const k = 'wrizo-writing-settings'; const cur = JSON.parse(localStorage.getItem(k) || '{}'); localStorage.setItem(k, JSON.stringify({ ...cur, progress: 'words' })); } catch (e) {} return true; })()`);
        await app.emulateDpr(1, W, H);
      });
    },
  });
}

await main({ title: 'FRAMES-76' });
