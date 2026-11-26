// THE GUIDE'S FRAME PAGE (PRESETS-B, Nov 25): a harness-only page that mounts the Guide panel alone over a stand-in room, in a chosen theme and tone, so its steps can be photographed at 1366, 1920 and 2560 with no door wired.
// Served by `vite` at /scripts/harness/guide-frame/index.html?theme=plateau|flux|machina&room=light|dark. It is not part of the product build (vite builds only the root index.html). Nothing here is shipped.
import '@fontsource-variable/figtree';
import '@fontsource-variable/crimson-pro';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/chakra-petch/400.css';
import '@fontsource/chakra-petch/500.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-sans/400.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

const q = new URLSearchParams(location.search);
const theme = q.get('theme') === 'flux' || q.get('theme') === 'machina' ? (q.get('theme') as string) : 'plateau';
try { localStorage.setItem('wrizo-theme', theme); } catch { /* the frame still draws */ }

(async () => {
  await import('../../../src/index.css');
  const { initTheme } = await import('../../../src/store/theme');
  initTheme();
  document.documentElement.setAttribute('data-room', q.get('room') === 'dark' ? 'dark' : 'light');
  if (theme === 'plateau') await import('../../../src/arbor2/mount');
  if (theme === 'machina') await import('../../../src/machina2/mount');
  const { GuidePanel } = await import('../../../src/reorg/GuidePanel');
  const Room = () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink-900, #1b1b1b)', color: 'var(--text-mid, #888)', padding: 40, boxSizing: 'border-box' }}>
        <p>Stand-in room: the page behind the dimmed panel.</p>
        {open ? <GuidePanel onStart={(p) => { (window as unknown as { __guideStarts: unknown[] }).__guideStarts = [...((window as unknown as { __guideStarts?: unknown[] }).__guideStarts ?? []), p]; }} onClose={() => setOpen(false)} /> : <button type="button" data-reopen onClick={() => setOpen(true)}>Open the Guide</button>}
      </div>
    );
  };
  ReactDOM.createRoot(document.getElementById('root')!).render(<Room />);
  (window as unknown as { __guideRun: unknown }).__guideRun = run;
})();

// ---------------------------------------------------------------- the measuring half: drives the steps by pressing the real buttons, and measures each (harness only)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lum = (c: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a: number[], b: number[]) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const nums = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
function backgrounds(el: Element): number[][] {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    const bg = nums(cs.backgroundColor);
    if (bg.length >= 3 && (bg.length < 4 || bg[3] > 0.5)) return [bg.slice(0, 3)];
    const gradient = cs.backgroundImage;
    if (gradient.includes('gradient')) { const out = [...gradient.matchAll(/rgba?\([^)]*\)/g)].map((m) => nums(m[0]).slice(0, 3)); if (out.length) return out; }
  }
  return [[0, 0, 0]];
}
function measure(label: string) {
  const panel = document.querySelector('[data-guide]') as HTMLElement | null;
  if (!panel) return { label, missing: true };
  const r = panel.getBoundingClientRect();
  const inView = r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
  const btns = [...panel.querySelectorAll('button')].filter((b) => (b as HTMLElement).offsetParent !== null).map((b) => ({ t: (b.textContent ?? '').trim(), r: b.getBoundingClientRect() }));
  const overlaps: string[] = [];
  for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
    const a = btns[i].r, b = btns[j].r;
    if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) overlaps.push(btns[i].t + ' | ' + btns[j].t);
  }
  // clipped: any word or button drawn outside the panel's box (the Flux brackets sit outside it on purpose and carry no words), or the panel scrolling inside itself
  const outside = [...panel.querySelectorAll('button, h2, p, span')].filter((el) => !el.closest('.guide-sr') && (el as HTMLElement).offsetParent !== null).some((el) => { const b = el.getBoundingClientRect(); return b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1; });
  const clipped = outside || (getComputedStyle(panel).overflowY !== 'visible' && panel.scrollHeight > panel.clientHeight + 1);
  let min = 99; let worst = '';
  for (const el of panel.querySelectorAll('*')) {
    if (el.classList.contains('guide-sr') || el.closest('.guide-sr')) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    if (!own) continue;
    const cs = getComputedStyle(el); const fg = nums(cs.color);
    if (fg.length < 3) continue;
    const bgs = backgrounds(el);
    for (const bg of bgs) { const c = ratio(fg.slice(0, 3), bg); if (c < min) { min = c; worst = (el.textContent ?? '').trim().slice(0, 28); } }
  }
  const focus = document.activeElement as HTMLElement | null;
  const ring = focus ? (() => { const cs = getComputedStyle(focus); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? 'outline' : cs.boxShadow !== 'none' ? 'shadow' : 'none'; })() : 'nofocus';
  return { label, w: innerWidth, panel: [Math.round(r.width), Math.round(r.height)], inView, overlaps, clipped, minContrast: Math.round(min * 100) / 100, worst, focusIn: !!focus && panel.contains(focus), ring };
}
const press = async (sel: string) => { const b = document.querySelector(sel) as HTMLElement | null; if (!b) return false; b.click(); await wait(60); return true; };
async function run() {
  const out: unknown[] = [];
  out.push(measure('q1'));
  await press('[data-guide-more]'); out.push(measure('q1-more'));
  await press('[data-guide-option=story]'); out.push(measure('story-length'));
  await press('[data-guide-option=book]'); out.push(measure('story-sofar'));
  await press('[data-guide-option=person]'); out.push(measure('landing'));
  await press('[data-guide-why]'); out.push(measure('note'));
  await press('[data-guide-note-back]'); await press('[data-guide-back]'); await press('[data-guide-back]'); await press('[data-guide-back]');
  await press('[data-guide-option=paper]'); await press('[data-guide-option=argument]'); out.push(measure('paper-style'));
  await press('[data-guide-option=mla]'); out.push(measure('paper-landing'));
  await press('[data-guide-back]'); await press('[data-guide-back]'); await press('[data-guide-back]');
  await press('[data-guide-not-sure]'); out.push(measure('not-sure'));
  await press('[data-guide-back]');   // and back to the first question, so the walk can be run again at another width
  return out;
}
(window as unknown as { __guideSummary: unknown }).__guideSummary = async (label: string) => {
  const o = (await run()) as { label: string; w: number; inView: boolean; overlaps: string[]; clipped: boolean; minContrast: number; worst: string; focusIn: boolean }[];
  const low = [...o].sort((a, b) => a.minContrast - b.minContrast)[0];
  return JSON.stringify({ label, w: o[0].w, inView: o.every((x) => x.inView), overlaps: o.reduce((a, x) => a + x.overlaps.length, 0), clipped: o.filter((x) => x.clipped).map((x) => x.label), minContrast: low.minContrast, worst: low.worst, focusIn: o.every((x) => x.focusIn) });
};
