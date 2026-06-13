// Ember wordmark lockup (branding §3R). The flat ember "e" mark beside the
// title-case "Ember" in Newsreader 500. Mark/gap/lift scale with `size`; the
// lift is one CSS variable (--lockup-lift) for trivial fine-tuning.
//
// NOTE: per Revision 2 §2R-rule the glowing hero mark is threshold-only and is
// a separate raster asset; this flat ember "e" is the in-app + interim
// threshold mark. The launcher/login glow swaps in once the transparent hero
// PNG export lands — a one-line change here.

interface WordmarkProps {
  size?: number; // wordmark font-size in px
  className?: string;
}

export function Wordmark({ size = 40, className }: WordmarkProps) {
  return (
    <span className={`wordmark${className ? ` ${className}` : ''}`} style={{ fontSize: size }} aria-label="Ember">
      <svg className="wordmark__mark" viewBox="6 12 88 78" aria-hidden="true" focusable="false">
        <path
          d="M 24 54 C 40 50 60 49 76 53 C 84 41 70 22 48 22 C 28 22 18 40 21 56 C 23 73 40 83 60 80 C 70 78 76 72 80 64"
          fill="none"
          stroke="#E0712C"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="wordmark__text">Ember</span>
    </span>
  );
}
