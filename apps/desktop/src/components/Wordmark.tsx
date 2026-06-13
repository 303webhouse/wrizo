import { useId } from 'react';

// Ember wordmark lockup (branding §3). Horizontal Option A: the twisting-flame
// mark sitting just left of the title-case "Ember", raised so its tip floats
// above the letters. Mark, gap, and lift all scale with `size` (the wordmark
// font-size in px); the lift is one CSS variable (--lockup-lift) so the v1 →
// final tweak is a single line. The flame is one shape with the canonical
// radial gradient — no separate glow, no outline, no flat recolor.

interface WordmarkProps {
  size?: number; // wordmark font-size in px (40 is the spec reference)
  className?: string;
}

export function Wordmark({ size = 40, className }: WordmarkProps) {
  const gradId = useId();
  return (
    <span className={`wordmark${className ? ` ${className}` : ''}`} style={{ fontSize: size }} aria-label="Ember">
      <svg className="wordmark__mark" viewBox="37 21 30 59" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={gradId} cx="0.46" cy="0.62" r="0.62">
            <stop offset="0%" stopColor="#FFE6B8" />
            <stop offset="38%" stopColor="#F4983F" />
            <stop offset="72%" stopColor="#E06E27" />
            <stop offset="100%" stopColor="#93340F" />
          </radialGradient>
        </defs>
        <path
          d="M47 75 C38 62 44 46 56 38 C65 33 63 24 55 25 C60 29 57 40 54 49 C51 58 58 68 55 76 C53 79 49 78 47 75 Z"
          fill={`url(#${gradId})`}
        />
      </svg>
      <span className="wordmark__text">Ember</span>
    </span>
  );
}
