// THE LINK BADGE'S ASK (the Team B restyle's Decision 2; Fable, Nov 20 9:45 pm: "it opens Assets at that Part; cover the case where Assets is
// already open"). A Part row's badge (PartsList) asks; the Tutor opens its drawer on ASSETS; the Assets tab (AssetPartGroups) opens that Part's
// group and brings it into view, whether the tab is mounting fresh or already drawn. Held in memory for the moment of the press: nothing is
// saved, and an ask the Assets tab has taken is never replayed (the tab still opens fresh with only her Part open, 1H).

export interface AssetsFocus { partId: string; tick: number }

let focus: AssetsFocus | null = null;
let taken = 0;
const subs = new Set<() => void>();

/** The badge's press: ask the Assets tab to open at this Part. */
export function focusAssetsPart(partId: string): void {
  focus = { partId, tick: (focus?.tick ?? 0) + 1 };
  for (const f of [...subs]) f();
}

/** The ask not yet taken, or null. */
export function pendingAssetsFocus(): AssetsFocus | null {
  return focus && focus.tick > taken ? focus : null;
}

/** The Assets tab has opened at the Part: the ask is spent. */
export function takeAssetsFocus(tick: number): void {
  if (tick > taken) taken = tick;
}

export function subscribeAssetsFocus(f: () => void): () => void {
  subs.add(f);
  return () => { subs.delete(f); };
}
