import { getPref, prefsHeardServer, setPref, subscribePrefs } from '../reorg/prefsSaved';
import { onRailReset } from '../reorg/railSavedKey';
import { getWritingSettings, hasStoredWritingSettings, resetWritingSettings, setWritingSettings, subscribeWritingSettings, writingDefaults, type WritingSettings } from './writingSettings';

// THE SESSION'S WRITING SETTINGS, SAVED TO THE ACCOUNT (Fable, Nov 20, 12:15 pm: "Mirror the device key wrizo-writing-settings into a `writing` fact in users.prefs, saved with the
// reorg switch OFF, as ARBOR's room is (add it to SWITCHLESS). Red-first: two devices, reload, every theme"; Nick's SAVED DATA ruling, Nov 19: everything a writer changes is saved
// to the ACCOUNT). The device key stays what it was: store/writingSettings.ts still reads and writes `wrizo-writing-settings`, so a device that has never met the account behaves
// as it always did. This bridge is the only thing that knows the account:
//   - her act (any setWritingSettings that really changes a value) becomes the fact `writing: { ...settings, at }` (reorg/prefsSaved.ts, one of its SWITCHLESS facts: saved whatever
//     the reorg's switch, kept in the existing prefs key in the server's shape, sent a second later, merged by stamp - the later act wins, whole);
//   - at boot and whenever the account's record changes (another device's act arrives in a round), the fact's values are written into the settings, field by field, only where
//     they differ - and only values this build accepts (sanitizeWritingFields); a newer build's extra field is kept in the fact, never applied here and never dropped by our own act;
//   - ADOPTION: a device that already holds settings of its own and finds the account has none (a round has answered and there is no fact) gives them to the account once - so
//     the settings a writer set before today follow her too. Never before the account has answered: a fact that merely has not arrived yet must not be written over;
//   - sign-out: the settings go back to the defaults and the device key goes (onRailReset, the same hook that clears the rail and the prefs copy), so the next account never
//     inherits this one's and its device never adopts them.
// The first-run seed (setWritingSettings({ typewriter: true }), what the default already is) is not an act: a call that changes nothing writes nothing.
export const WRITING_FACT = 'writing';

// THE ONE PLACE THAT KNOWS WHICH VALUES ARE VALID: a value this build does not know (a newer build's field, a damaged value, a stranger's PUT) is never applied
const isEnum = <T extends string>(...ok: T[]) => (v: unknown): v is T => typeof v === 'string' && (ok as string[]).includes(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000;
const VALID: { [K in keyof WritingSettings]: (v: unknown) => boolean } = {
  progress: isEnum('words', 'time', 'project', 'off'),
  fadeDepth: isEnum('partial', 'full'),
  timer: isBool,
  typewriter: isBool,
  progressStyle: isEnum('bar', 'rhizome'),
  instrumentsOn: isBool,
  forwardLockUnit: isEnum('words', 'sentences'),
  forwardLockCount: isCount,
  lineFadeOn: isBool,
  lineFadeLines: isCount,
  writingLine: isEnum('top', 'center', 'bottom'),
  pageScroll: isBool,
  flicker: isBool,
};
/** The settings this build knows, each of a value it accepts; anything else is left out. */
export function sanitizeWritingFields(raw: unknown): Partial<WritingSettings> {
  const out: Record<string, unknown> = {};
  if (raw && typeof raw === 'object') for (const k of Object.keys(VALID) as (keyof WritingSettings)[]) if (VALID[k]((raw as Record<string, unknown>)[k])) out[k] = (raw as Record<string, unknown>)[k];
  return out as Partial<WritingSettings>;
}

const canonOf = (o: Record<string, unknown>): string => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
const mine = (): Partial<WritingSettings> => sanitizeWritingFields(getWritingSettings());
const fieldsOf = (f: unknown): Partial<WritingSettings> => {
  if (!f || typeof f !== 'object') return {};
  const { at: _at, ...rest } = f as Record<string, unknown>;
  void _at;
  return sanitizeWritingFields(rest);
};

// what the settings were the last time the account and this device agreed (boot, an apply, a publish): a call that leaves them equal to it is not an act
let baseFields: Record<string, unknown> = { ...mine() };
const agree = (): void => { baseFields = { ...mine() }; };
let applying = false;
let adopted = false;

// ONE FIELD, ONE ACT: the fact carries a stamp per setting (`fieldAt`, merged by reorg/prefsSaved.ts), so a switch changed on one device and another switch changed on a second
// device are both kept, and only the SAME switch changed twice is settled by the later stamp. A publish therefore stamps only the settings she just changed.
function publish(changed: string[]): void {
  const was = getPref(WRITING_FACT);
  const { at: wasAt, fieldAt: oldAt, ...old } = (was ?? { at: '' }) as Record<string, unknown>;
  const stamps: Record<string, string> = {};
  for (const k of Object.keys(old)) stamps[k] = typeof (oldAt as Record<string, unknown> | undefined)?.[k] === 'string' ? (oldAt as Record<string, string>)[k] : String(wasAt);
  const m = mine() as Record<string, unknown>;
  const next: Record<string, unknown> = { ...old };   // a newer build's extra fields stay
  for (const k of changed) {
    next[k] = m[k];
    let t = Date.now();
    if (stamps[k]) t = Math.max(t, Date.parse(stamps[k]) + 1);
    stamps[k] = new Date(t).toISOString();
  }
  setPref(WRITING_FACT, { ...next, fieldAt: stamps });
}

function apply(): void {
  const f = getPref(WRITING_FACT);
  if (!f) return;
  const want = fieldsOf(f);
  const now = getWritingSettings() as unknown as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(want)) if (now[k] !== v) patch[k] = v;
  if (Object.keys(patch).length) {
    applying = true;
    try { setWritingSettings(patch as Partial<WritingSettings>); } finally { applying = false; }
  }
  agree();
}

// the account has answered and holds nothing for this device's settings: the settings she already has become the account's, once
function adopt(): void {
  if (adopted || !prefsHeardServer() || getPref(WRITING_FACT) || !hasStoredWritingSettings()) return;
  if (canonOf(mine()) === canonOf(sanitizeWritingFields(writingDefaults()))) return;   // a device that still holds only the defaults has nothing to give
  adopted = true;
  publish(Object.keys(mine()));
  agree();
}

apply();
subscribePrefs(apply);
subscribePrefs(adopt);
subscribeWritingSettings(() => {
  if (applying) return;
  const m = mine() as Record<string, unknown>;
  const changed = Object.keys(m).filter((k) => m[k] !== baseFields[k]);
  if (!changed.length) return;
  agree();
  publish(changed);
});
// the reset is not her act: it must not publish the defaults as a new fact
const resetSettings = (): void => {
  adopted = false;
  applying = true;
  try { resetWritingSettings(); } finally { applying = false; }
  agree();
};
onRailReset(resetSettings);
