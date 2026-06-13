// Ember wordmark lockup (branding §3R). The ornate script-"e" hero mark beside
// the title-case "Ember" in Newsreader 500. Mark height + gap scale with `size`.
//
// The lockup appears only at thresholds (launcher, login) — never in the
// working chrome (sprint/beat/board), per §2R-rule — so the soft ember glow on
// the mark (a shape-following drop-shadow, applied in .wordmark__mark) is
// allowed here.

interface WordmarkProps {
  size?: number; // wordmark font-size in px
  className?: string;
}

export function Wordmark({ size = 40, className }: WordmarkProps) {
  return (
    <span className={`wordmark${className ? ` ${className}` : ''}`} style={{ fontSize: size }} aria-label="Ember">
      <img className="wordmark__mark" src="/brand/ember-hero.png" alt="" aria-hidden="true" />
      <span className="wordmark__text">Ember</span>
    </span>
  );
}
