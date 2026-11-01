import { useEffect, useMemo, useRef, useState } from 'react';
import { setThemePrefs } from '../store/themePrefs';
import { setCast } from '../store/themeCast';
import { setWritingGoal } from '../store/writingGoal';
import { useTheme } from '../store/theme';
import { isOn, subscribeSwitches } from './switches';

// MACHINA v2 MOCKUP - §8.1 THE COMMAND LINE (Fable ruling 2: approved as a SHARED mechanism over existing actions, built first for Machina;
// "the lane checks the Ctrl/⌘K collision with links"). ⌘K (macOS) / Ctrl+K (elsewhere) opens a hairline box in the room BESIDE the page
// (never over the words), IBM Plex Mono; she types what she wants; the matching commands list beneath in the cool blue, the first chosen (brass
// outline); Enter runs it; Esc closes and the focus goes back where it was.
// A SECOND DOOR TO THE SAME ACTS, NEVER A NEW ACT: every command presses a control that is on screen (a mode tab, the Plan door, a rail item,
// a drawer tab, the Flow State toggle, the "..." menu's Fullscreen) or calls the app's own setter for an existing preference (Page, Cast, the
// goal). There is no export, find or "new part" command because the app has no such button yet: the registry lists only what exists.
// THE CTRL/⌘K CHECK (before this was built): no handler in the app takes K with Ctrl or ⌘ (the Ctrl/⌘ chords in use: Z/Y undo-redo, B/I/U
// formatting, Ctrl+/ the Controls drawer, Ctrl+1-8 in the script editor), Electron sets no menu or accelerator, and links (Grafts/Assets, the
// link dock) have no keyboard chord. Two collisions are OUTSIDE the app: ⌘K / Ctrl+K is "insert link" by convention in Docs, Word and Notion -
// so the day links get a keyboard door it should be a command here ("link…"), not a second chord - and on macOS Ctrl+K is the text system's
// kill-to-end-of-line, so on a Mac only ⌘K opens the line and Ctrl+K is left to the editor.
// THE KEYS, RULED (Fable, Oct 31, after the check above): links = Ctrl+K (Windows/Linux) and ⌘K (Mac only); the command line = Ctrl+/ (⌘/ on a
// Mac), with an "Add link" command inside it. So r2 moves the line to Ctrl/⌘ + / and gives K to the link: Ctrl/⌘K and the "Add link" command run
// ONE act, the existing one - the right drawer's "+ Graft..." (the Links tab's own button, ConnectionsDrawerPanel, which opens GraftPicker).
// THE ONE COLLISION THIS MAKES: Ctrl+/ (and ⌘/) already opens the Controls drawer (components/Sliver.tsx). Under the flag, while the command
// line's switch is on, the line takes the chord first (a capture listener that stops it), and the Controls drawer stays one command away
// ("Controls drawer"); switch the line off and Ctrl+/ opens the Controls drawer again. Handed to Fable as a conflict, not decided here.
// THE KEYBOARD LEGEND (§8.4, ruling 1: shortcuts plus a legend drawn from the command registry, not a stored mode): with the switch on, the
// box lists the commands that already have a chord. In session only; nothing stored.
type Cmd = { id: string; label: string; words: string; run: () => void; chord?: string };
const mac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
const MOD = mac ? '⌘' : 'Ctrl+';

const visible = (el: Element | null): el is HTMLElement => {
  if (!el) return false;
  const r = (el as HTMLElement).getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};
const press = (el: HTMLElement | null) => () => { el?.click(); };

/** Waits up to ~60 frames for a control to be on screen; every frame reads the DOM, so the wait ends on what is there, not on a clock. */
const until = (find: () => Element | null, frames = 60): Promise<HTMLElement | null> => new Promise((done) => {
  const step = (n: number) => { const el = find(); if (visible(el)) return done(el); if (n <= 0) return done(null); requestAnimationFrame(() => step(n - 1)); };
  step(frames);
});

/** ADD LINK (r2; Fable's key ruling): the existing act - the right drawer opens on its Links tab and "+ Graft..." is pressed, so the picker
 *  opens as if she had clicked it. A page or a board must be open (the drawer's grip is the sign); otherwise nothing happens. */
export function canAddLink(): boolean { return visible(document.querySelector('.wz-tutor-grip')); }
export async function addLink(): Promise<boolean> {
  if (!canAddLink()) return false;
  const tab = () => document.querySelector('#wz-tutor-tab-links');
  if (!visible(tab())) document.querySelector<HTMLElement>('.wz-tutor-grip')?.click();
  const t = await until(tab); if (!t) return false;
  if (t.getAttribute('aria-selected') !== 'true') t.click();
  const add = await until(() => document.querySelector('[data-graft-add]')) as HTMLButtonElement | null;
  if (!add || add.disabled) return false;
  if (add.getAttribute('aria-expanded') !== 'true') add.click();
  return true;
}
const words = (s: string) => s.replace(/[→▸▾]/g, ' ').replace(/\s+/g, ' ').trim();

/** The registry, read when the line opens: the controls on screen now, and the app's own preference setters. */
export function buildRegistry(query: string): Cmd[] {
  const out: Cmd[] = [];
  document.querySelectorAll<HTMLElement>('.desk-mode-tab').forEach((b) => {
    if (!visible(b)) return;
    const w = words(b.textContent || ''); if (!w) return;
    out.push({ id: 'mode-' + w.toLowerCase(), label: `Mode: ${w[0]}${w.slice(1).toLowerCase()}`, words: `mode ${w} switch`, run: press(b) });
  });
  const plan = document.querySelector<HTMLElement>('.page-plan-door');
  if (visible(plan)) out.push({ id: 'plan', label: 'Plan →', words: 'plan plans structure outline', run: press(plan) });
  document.querySelectorAll<HTMLElement>('.wz-strip-item').forEach((b) => {
    if (!visible(b)) return;
    const w = words(b.querySelector('.wz-strip-label')?.textContent || b.getAttribute('aria-label') || b.textContent || ''); if (!w) return;
    out.push({ id: 'open-' + w.toLowerCase(), label: `Open: ${w}`, words: `open go ${w}`, run: press(b) });
  });
  const tools = document.querySelector<HTMLElement>('.wz-sliver-grip');
  if (visible(tools)) out.push({ id: 'controls', label: 'Controls drawer', words: 'controls tools drawer format font left', run: press(tools) });
  const tutor = document.querySelector<HTMLElement>('.wz-tutor-grip');
  if (visible(tutor)) out.push({ id: 'consultant', label: 'Consultant', words: 'consultant tutor ask assets right drawer', run: press(tutor) });
  if (canAddLink()) out.push({ id: 'add-link', label: 'Add link', words: 'add link links graft connect attach', run: () => { void addLink(); }, chord: `${MOD}K` });
  const flow = document.querySelector<HTMLElement>('.typewriter-toggle');
  if (visible(flow)) out.push({ id: 'flow', label: 'Flow State', words: 'flow state typewriter zoom focus', run: press(flow) });
  const dots = document.querySelector<HTMLElement>('.gh-corner-glyph');
  if (visible(dots)) out.push({ id: 'fullscreen', label: 'Fullscreen', words: 'fullscreen full screen window', run: () => {
    dots.click();
    requestAnimationFrame(() => { [...document.querySelectorAll<HTMLElement>('.gh-corner-menu button')].find((x) => /full\s*screen/i.test(x.textContent || ''))?.click(); });
  } });
  out.push({ id: 'page-light', label: 'Page: Light', words: 'page light tone bright', run: () => setThemePrefs({ page: 'light' }) });
  out.push({ id: 'page-dark', label: 'Page: Dark', words: 'page dark tone night', run: () => setThemePrefs({ page: 'dark' }) });
  out.push({ id: 'cast-cool', label: 'Cast: Cool', words: 'cast cool blue grey', run: () => setCast('cool') });
  out.push({ id: 'cast-neutral', label: 'Cast: Neutral', words: 'cast neutral warm grey', run: () => setCast('neutral') });
  const g = /^\s*goal\s+(\d{1,6})\s*(words?|lines?)?\s*$/i.exec(query);
  if (g) {
    const n = Math.max(1, parseInt(g[1], 10)), unit = /^line/i.test(g[2] || '') ? 'lines' : 'words';
    out.unshift({ id: 'goal', label: `Goal: ${n} ${unit}`, words: `goal ${n} ${unit}`, run: () => setWritingGoal({ n, unit }) });
  } else {
    out.push({ id: 'goal-hint', label: 'Goal: type "goal 2000"', words: 'goal target count', run: () => {} });
  }
  return out;
}

/** The commands whose words hold every word she typed, in registry order (exact label starts first). */
export function matchCommands(cmds: Cmd[], query: string): Cmd[] {
  const q = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!q.length) return cmds.filter((c) => c.id !== 'goal-hint');
  const hit = cmds.filter((c) => q.every((w) => (c.label + ' ' + c.words).toLowerCase().includes(w)));
  return hit.sort((a, b) => Number(b.label.toLowerCase().includes(q.join(' '))) - Number(a.label.toLowerCase().includes(q.join(' '))));
}

/** Where the box goes: the room beside the page - the wider margin if it holds the box, else the strip above the page. Never over the words. */
function place(): { left: number; top: number; width: number } {
  const p = document.querySelector('.mode-page, .board-canvas-wrap, .entry-full')?.getBoundingClientRect();
  const rail = document.querySelector('.desk-frame-strip, .desk-rail')?.getBoundingClientRect();
  if (!p) return { left: Math.max(16, innerWidth / 2 - 160), top: 72, width: 320 };
  const leftRoom = p.left - (rail ? rail.right : 0) - 24, rightRoom = innerWidth - p.right - 24;
  // (min 150 and 20 px clear of the page: the drawer opener sits on the page's edge. At 1366 in Sprint the zoomed page leaves 163 px on the right -
  // a 170 px minimum sent the box to the strip above the page, where its list fell over the words: frames run 41248833065)
  const want = 320, min = 150, gap = 20;
  if (rightRoom >= min && rightRoom >= leftRoom) { const w = Math.min(want, rightRoom - (gap - 12)); return { left: p.right + gap, top: Math.max(64, p.top), width: w }; }
  if (leftRoom >= min) { const w = Math.min(want, leftRoom - (gap - 12)); return { left: p.left - gap - w, top: Math.max(64, p.top), width: w }; }
  return { left: Math.max(16, p.left), top: Math.max(56, p.top - 44), width: Math.min(want, p.width) };
}

export function CommandLine() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [pos, setPos] = useState(place);
  const [, tick] = useState(0);
  const back = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => subscribeSwitches(() => tick((x) => x + 1)), []);
  const enabled = theme === 'machina' && isOn('command');

  useEffect(() => {
    if (!enabled) { setOpen(false); return; }
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const chord = mac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      if ((k === '/' || (e.code === 'Slash' && !e.shiftKey)) && chord && !e.altKey && !e.isComposing) {
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => {
          if (!o) { back.current = document.activeElement as HTMLElement | null; setQ(''); setSel(0); setPos(place()); }
          return !o;
        });
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [enabled]);
  // Ctrl+K (⌘K on a Mac) = Add link, the links key - whether or not the command line's switch is on (it is the link's key, not the line's)
  const machina = theme === 'machina';
  useEffect(() => {
    if (!machina) return;
    const onKey = (e: KeyboardEvent) => {
      const chord = mac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      if (e.key.toLowerCase() !== 'k' || !chord || e.altKey || e.shiftKey || e.isComposing || !canAddLink()) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      void addLink();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [machina]);
  useEffect(() => { if (open) requestAnimationFrame(() => input.current?.focus()); }, [open]);

  const cmds = useMemo(() => (open ? matchCommands(buildRegistry(q), q) : []), [open, q]);
  const close = (refocus = true) => { setOpen(false); if (refocus) requestAnimationFrame(() => back.current?.focus?.()); };
  const run = (c: Cmd | undefined) => { if (!c) return; close(true); requestAnimationFrame(() => c.run()); };
  if (!open || !enabled) return null;
  const legend = isOn('legend') ? buildRegistry('').filter((c) => c.chord) : [];
  return (
    <div className="machina2-cmd" role="dialog" aria-label="Command line" style={{ left: pos.left, top: pos.top, width: pos.width }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(cmds.length - 1, s + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
        else if (e.key === 'Enter') { e.preventDefault(); run(cmds[sel]); }
      }}>
      <input ref={input} className="machina2-cmd-input" value={q} spellCheck={false} placeholder="type a command" aria-label="Command"
        onChange={(e) => { setQ(e.target.value); setSel(0); }} onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) close(false); }} />
      <ul className="machina2-cmd-list" role="listbox" aria-label="Matching commands">
        {cmds.slice(0, 8).map((c, i) => (
          <li key={c.id} role="option" aria-selected={i === sel} className="machina2-cmd-item" data-cmd={c.id} data-chosen={i === sel ? 'true' : 'false'}
            onMouseDown={(e) => { e.preventDefault(); run(c); }}>{c.label}</li>
        ))}
        {!cmds.length && <li className="machina2-cmd-none">no command - the line runs only what is on screen or in the settings</li>}
      </ul>
      <p className="machina2-cmd-foot">↵ run · ↑↓ choose · Esc close</p>
      {legend.length > 0 && (
        <ul className="machina2-cmd-legend" aria-label="Keyboard legend">
          <li><kbd>{MOD}/</kbd> command line</li>
          {legend.map((c) => <li key={c.id}><kbd>{c.chord}</kbd> {c.label}</li>)}
          <li><kbd>{MOD}B</kbd> <kbd>{MOD}I</kbd> <kbd>{MOD}U</kbd> bold · italic · underline (Build)</li>
          <li><kbd>{MOD}Z</kbd> undo · <kbd>{mac ? '⇧⌘Z' : 'Ctrl+Y'}</kbd> redo</li>
        </ul>
      )}
    </div>
  );
}
