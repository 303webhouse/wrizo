// ITEM 207b — THE DEVICE FONT LIBRARY: the families the writer has ADDED ON THIS DEVICE (Fable's ruling: "all fonts that have
// been added" means added on this device). A font is a property of the machine, so the list is per-device localStorage
// (the `wrizo-theme-prefs` precedent), never synced. What syncs is only a page's own `face` (its NAME and class) - a device
// that lacks the font renders the fallback in that class and says so, quietly, inside the control.
//
// Nothing here ENUMERATES fonts except `listInstalledFamilies`, which runs only from the writer's own click on "Add a font…"
// (Local Font Access needs transient activation and asks the browser's permission at that moment, never on load).
import type { FaceGeneric, StoredFace } from '../types';

export const DEVICE_FONTS_KEY = 'wrizo-device-fonts';
export const DEVICE_FONTS_CAP = 200;

export interface DeviceFont { name: string; generic: FaceGeneric }
const GENERICS: FaceGeneric[] = ['serif', 'sans-serif', 'monospace'];
const listeners = new Set<() => void>();

function sane(v: unknown): DeviceFont | null {
  if (!v || typeof v !== 'object') return null;
  const { name, generic } = v as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.length > 120) return null;
  if (!GENERICS.includes(generic as FaceGeneric)) return null;
  return { name: name.trim(), generic: generic as FaceGeneric };
}

/** The library, in the order the writer added them. A corrupt or missing value is an empty library, never a throw. */
export function getDeviceFonts(): DeviceFont[] {
  try {
    const raw = localStorage.getItem(DEVICE_FONTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>(); const out: DeviceFont[] = [];
    for (const item of parsed) { const f = sane(item); if (f && !seen.has(f.name)) { seen.add(f.name); out.push(f); } }
    return out.slice(0, DEVICE_FONTS_CAP);
  } catch { return []; }
}

/** Add a family (or refresh its class). Returns the stored entry, or null when the name is not acceptable. */
export function addDeviceFont(name: string, generic: FaceGeneric): DeviceFont | null {
  const f = sane({ name, generic });
  if (!f) return null;
  const next = [...getDeviceFonts().filter((x) => x.name !== f.name), f].slice(-DEVICE_FONTS_CAP);
  try { localStorage.setItem(DEVICE_FONTS_KEY, JSON.stringify(next)); } catch { /* storage blocked: the pick still applies to the page */ }
  listeners.forEach((l) => l());
  return f;
}

export function subscribeDeviceFonts(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }

/** How a library entry is stored on a page: `source: 'device'`, no fallback file (the generic class IS the fallback). */
export function storedFaceForDevice(f: DeviceFont): StoredFace {
  return { name: f.name, generic: f.generic, source: 'device' };
}

export type InstalledFamiliesResult =
  | { ok: true; families: string[] }
  | { ok: false; reason: 'unsupported' | 'denied' | 'failed' };

/** Local Font Access exists on this browser (Chromium: Edge, Chrome, Electron). Firefox and Safari have no such API. */
export function localFontsSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { queryLocalFonts?: unknown }).queryLocalFonts === 'function';
}

/** The installed FAMILIES (unique, sorted), read from Local Font Access. Only names are read; a face's bytes (`blob()`) are
 *  never touched. Must be called from a user gesture. A refusal is a value, not an exception. */
export async function listInstalledFamilies(): Promise<InstalledFamiliesResult> {
  if (!localFontsSupported()) return { ok: false, reason: 'unsupported' };
  try {
    const faces = await (window as unknown as { queryLocalFonts: () => Promise<Array<{ family: string }>> }).queryLocalFonts();
    const set = new Set<string>();
    for (const f of faces) if (f && typeof f.family === 'string' && f.family.trim()) set.add(f.family.trim());
    return { ok: true, families: [...set].sort((a, b) => a.localeCompare(b)) };
  } catch (e) {
    const name = e && typeof e === 'object' ? (e as { name?: string }).name : '';
    return { ok: false, reason: name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'failed' };
  }
}
