import { useTheme } from '../store/theme';

// The theme's own Wrizo mark on the arrival and home screens. Arbor draws its hand-drawn PNG (exactly as before); Flux draws its own WRIZO wordmark in the chrome label face, in
// orange (one of orange's few homes) - never Arbor's picture (Fable, Oct 22: "Flux shows its own WRIZO mark, never Arbor's"). The in-app corner mark is App.tsx's .brand-mark,
// which the Flux stylesheet re-draws the same way; this component covers the two <img> sites that carry the mark as a picture.
export function WrizoMark({ className, alt }: { className: string; alt: string }) {
  const theme = useTheme();
  if (theme === 'flux') {
    return <span className={`${className} wz-flux-wordmark`} {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}>WRIZO</span>;
  }
  return <img className={className} src="/brand/wrizo-logo.png" alt={alt} {...(alt ? {} : { 'aria-hidden': true })} />;
}
