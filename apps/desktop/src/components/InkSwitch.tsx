import { useDeskLexicon } from '../store/deskLexicon';

// ITEM 121 I3 — THE TEXT | INK SWITCH, in the band.
//
// It is not an instrument IN the desk; it says which instrument the page IS
// (ink pass §1). That is why it cannot be a zone among zones and why it sits
// in the band — page-level chrome for page-level state, readable with the
// drawer shut, which is the bench's visibility law: "which instrument am I" is
// state the writer must be able to read without opening anything.
//
// ── THE SEAT, AND WHY IT IS NOT "BESIDE THE LOCATION LINE" ────────────────
// R15 and mockup B seat the switch beside the band's location line. The framed
// band has no location line: CD1 S1 retired the crumb from it, and the Page
// face carries the title and the where-it-lives chain now (the mockup was
// drawn against a band that still had one). So what ports is the switch's
// position RELATIVE to the one landmark the mockup and the live band share —
// the mode strip — and the switch mounts immediately before it. Resurrecting
// the crumb to manufacture a location line would reverse CD1 S1 on a build
// lane's authority, which this lane will not do. See item121-s0-survey.md §4.
//
// ── THE BAND MUST NOT GROW ────────────────────────────────────────────────
// `.sprint-nav` has no fixed height — it is `display:flex` with
// `flex-wrap:wrap` and `padding:8px 14px`, so its height is content-derived
// and the failure mode at 1366 is not a few pixels, it is A WHOLE SECOND ROW.
// The switch is therefore sized to sit UNDER the band's existing tallest
// control (`.sprint-toggle-btn`: 13px type, 5px/12px padding) rather than
// beside it at its own preferred size, and `.wz-ink-switch` in index.css
// carries `flex-shrink` so the crumb-less band gives ground before it wraps.
// Paper never reflows for chrome; the harness measures the band's height at
// both reference widths with the switch mounted and without it.
//
// ── THE DRESS (mockup B) ──────────────────────────────────────────────────
// Engraved uppercase, letter-spaced; olive at rest, the ACTIVE side wearing
// the olive hairline; the flip is an evental press (brass). Nothing animates
// beyond a colour transition, so `prefers-reduced-motion` needs no branch.

export type Instrument = 'text' | 'ink';

interface Props {
  value: Instrument;
  onChange: (next: Instrument) => void;
}

export function InkSwitch({ value, onChange }: Props) {
  const { t } = useDeskLexicon();
  // A radiogroup, not a toggle button: two named states of one thing, and the
  // writer reads WHICH — a single pressed/unpressed control would announce
  // "ink, pressed" and leave "so what is it now?" to inference.
  return (
    <div className="wz-ink-switch" role="radiogroup" aria-label={t('inkInstrument')}>
      <button
        type="button"
        role="radio"
        className="wz-ink-switch-side"
        aria-checked={value === 'text'}
        data-on={value === 'text' ? 'true' : 'false'}
        onClick={() => onChange('text')}
      >
        {t('inkModeText')}
      </button>
      <button
        type="button"
        role="radio"
        className="wz-ink-switch-side"
        aria-checked={value === 'ink'}
        data-on={value === 'ink' ? 'true' : 'false'}
        onClick={() => onChange('ink')}
      >
        {t('inkModeInk')}
      </button>
    </div>
  );
}
