import { useTheme } from '../store/theme';

// the theme's own Wrizo mark: Arbor's hand-drawn PNG, Flux's own WRIZO wordmark in the chrome face - never Arbor's picture [WrizoMark §1]
export function WrizoMark({ className, alt }: { className: string; alt: string }) {
  const theme = useTheme();
  if (theme === 'flux') {
    return <span className={`${className} wz-flux-wordmark`} {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}>WRIZO</span>;
  }
  // POLISH (Nick, Oct 27: "no pure white"): Arbor's hand-drawn mark is the same drawing in a light cream-tan (--arbor-letter), strokes identical, orange untouched. Other themes keep the original PNG.
  const src = theme === 'plateau' ? '/brand/wrizo-logo-cream.png' : '/brand/wrizo-logo.png';
  return <img className={className} src={src} alt={alt} {...(alt ? {} : { 'aria-hidden': true })} />;
}
