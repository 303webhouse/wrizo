import { useEffect, useState } from 'react';

// the writer's installed fonts: one device-local key (`wrizo-installed-fonts`, a JSON array of names), never synced; a page stores the existing face record; a missing face falls back to the theme's default; nothing here throws [installedFonts §1]
const KEY = 'wrizo-installed-fonts';
const MAX_NAMES = 300;
const MAX_LEN = 80;

/** A family name the stack can carry: trimmed, no quotes, backslashes, braces, semicolons or control characters (the same hostile-name stance as fontRoster's quote()). Empty = refused. */
export function cleanFontName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f'"`\\{};<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
}

function read(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of parsed) {
      const n = cleanFontName(v);
      const k = n.toLowerCase();
      if (n && !seen.has(k)) { seen.add(k); out.push(n); }
      if (out.length >= MAX_NAMES) break;
    }
    return out;
  } catch { return []; }
}

let cache: string[] | null = null;
const subs = new Set<() => void>();
const list = (): string[] => (cache ??= read());
const write = (next: string[]): boolean => {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { return false; }
  cache = next;
  subs.forEach((fn) => fn());
  return true;
};

export function getInstalledFonts(): readonly string[] { return list(); }

/** Add a family name to this device's list. Returns the name as stored (existing spelling wins on a repeat), or null when it was refused. */
export function addInstalledFont(raw: string): string | null {
  const name = cleanFontName(raw);
  if (!name) return null;
  const cur = list();
  const have = cur.find((n) => n.toLowerCase() === name.toLowerCase());
  if (have) return have;
  if (cur.length >= MAX_NAMES) return null;
  return write([...cur, name]) ? name : null;
}

export function removeInstalledFont(name: string): void {
  const k = cleanFontName(name).toLowerCase();
  write(list().filter((n) => n.toLowerCase() !== k));
}

export function useInstalledFonts(): readonly string[] {
  const [, setTick] = useState(0);
  useEffect(() => { const fn = () => setTick((n) => n + 1); subs.add(fn); return () => { subs.delete(fn); }; }, []);
  return list();
}

/** Chromium's local-font access, behind its own permission prompt. Resolves the distinct family names, or null when the API is absent, the writer declined, or anything threw. Never rejects. */
export async function queryLocalFamilies(): Promise<string[] | null> {
  try {
    const w = window as unknown as { queryLocalFonts?: () => Promise<Array<{ family?: string }>> };
    if (typeof w.queryLocalFonts !== 'function') return null;
    const fonts = await w.queryLocalFonts();
    const names = new Set<string>();
    for (const f of fonts) { const n = cleanFontName(f.family); if (n) names.add(n); }
    return [...names].sort((a, b) => a.localeCompare(b));
  } catch { return null; }
}

/** Is this family installed on THIS device? The classic width probe: the text measures differently in `'<name>', X` than in X alone for at least one of two very different fallbacks. Unknown (no canvas) = true, so a note is
 *  never shown on a guess. */
export function fontIsAvailable(name: string): boolean {
  try {
    if (typeof document === 'undefined') return true;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return true;
    const probe = 'mmmmmmmmmmlliWWW@@ 0123';
    const width = (family: string) => { ctx.font = `72px ${family}`; return ctx.measureText(probe).width; };
    const n = cleanFontName(name);
    if (!n) return false;
    return ['monospace', 'serif'].some((fb) => width(`'${n}', ${fb}`) !== width(fb));
  } catch { return true; }
}
