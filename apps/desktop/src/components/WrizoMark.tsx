import { useTheme } from '../store/theme';

// the theme's own Wrizo mark: Arbor's hand-drawn PNG, Flux's own WRIZO wordmark in the chrome face - never Arbor's picture [WrizoMark §1]
export function WrizoMark({ className, alt }: { className: string; alt: string }) {
  const theme = useTheme();
  if (theme === 'flux') {
    return <span className={`${className} wz-flux-wordmark`} {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}>WRIZO</span>;
  }
  return <img className={className} src="/brand/wrizo-logo.png" alt={alt} {...(alt ? {} : { 'aria-hidden': true })} />;
}
