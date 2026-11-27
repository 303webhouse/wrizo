// THE THEME'S OPENING (the flourish spec §2: the "mode on" notice shows "every time the theme opens", Nick ruled). A theme opens when the app starts in it and each
// time it is chosen. One notice is owed per opening, to the first writing page that draws the meter lane. In memory only: nothing is saved.
import { getTheme, subscribeTheme, type ThemeId } from './theme';

let owed: ThemeId | null = getTheme();
subscribeTheme((t) => { owed = t; });

/** True once for each opening of `theme`: the caller owns that opening's notice. */
export function takeOpening(theme: ThemeId): boolean {
  if (owed !== theme) return false;
  owed = null;
  return true;
}
