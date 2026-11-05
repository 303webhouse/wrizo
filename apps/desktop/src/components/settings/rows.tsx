import { setThemePrefs } from '../../store/themePrefs';
import { Seg } from './Seg';

// the Progress row's options, one list for the gear (ModeStage) and the Sliver's foot; Drawer only where a StoryPlan gives it something to count. The stored value stays 'project' (a storage id); only its label is a word [ModeStage §22]
export function progressOptions(hasMilestones: boolean, drawerWord: string): [string, string][] {
  const opts: [string, string][] = [['words', 'Words'], ['time', 'Time'], ['off', 'Off']];
  if (hasMilestones) opts.splice(2, 0, ['project', drawerWord]);
  return opts;
}

// the page's tone, one row for the gear's theme panel (ModeStage) and the theme picker
export function PageToneRow({ page }: { page: 'dark' | 'light' }) {
  return <Seg label="Page" value={page} opts={[['light', 'Light'], ['dark', 'Dark']]} onPick={(v) => setThemePrefs({ page: v as 'dark' | 'light' })} />;
}
