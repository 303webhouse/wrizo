// Wrizo wordmark. The text "Wrizo" set in Figtree (via --font-display). The
// hand-drawn wordmark is a separate future artifact — until then this is plain
// type, no glyph. Appears only at thresholds (launcher, login), never in the
// working chrome.

interface WordmarkProps {
  size?: number; // wordmark font-size in px
  className?: string;
}

export function Wordmark({ size = 40, className }: WordmarkProps) {
  return (
    <span className={`wordmark${className ? ` ${className}` : ''}`} style={{ fontSize: size }} aria-label="Wrizo">
      <span className="wordmark__text">Wrizo</span>
    </span>
  );
}
