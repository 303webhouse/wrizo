import { getJournalEntry } from '../store/persistence';
import { graftTo, isGrafted, type GraftTarget } from '../store/grafts';
import { withoutFontMarks } from '../store/markRuns';

// AN ASSET ONTO A PART (reorg plan 5.2, first slice; Fable, Nov 20: "the drag through graftTo with its date: right"). Behind ?reorg=1, Machina only.
// She drags a row of the Back menu's Assets tab onto a Part in the Front menu's Parts tab, or presses the row's "→ Part": the asset is connected to
// THAT Part. The write is the store's own graftTo with the Part as the subject, so it is ONE PageLink owned by the Part (the record that already
// rides the entry's page_links jsonb to the account; createdAt is the date the connection was made). No new field, no new key, no text written.
//
// The drag carries ONLY its own type, never text/plain: a drop that misses the Parts list and lands on the page can never type the asset's name.

export const ASSET_DRAG_TYPE = 'application/x-wrizo-asset';

export function writeAssetDrag(dt: DataTransfer, asset: GraftTarget): void {
  dt.setData(ASSET_DRAG_TYPE, JSON.stringify(asset.boxId ? { entryId: asset.entryId, boxId: asset.boxId } : { entryId: asset.entryId }));
  dt.effectAllowed = 'link';
}

/** Whether a drag is an asset (the types are readable during dragover; the data only at the drop). */
export const isAssetDrag = (dt: DataTransfer | null): boolean => !!dt && Array.from(dt.types).includes(ASSET_DRAG_TYPE);

export function readAssetDrag(dt: DataTransfer | null): GraftTarget | null {
  if (!dt) return null;
  try {
    const v = JSON.parse(dt.getData(ASSET_DRAG_TYPE)) as { entryId?: unknown; boxId?: unknown };
    if (typeof v.entryId !== 'string' || !v.entryId) return null;
    return typeof v.boxId === 'string' && v.boxId ? { entryId: v.entryId, boxId: v.boxId } : { entryId: v.entryId };
  } catch { return null; }
}

/** The asset's title as the Assets tab draws it (the panel's titleOf: the first line, 60 characters; a sketch card reads "A sketch"). '' when gone. */
export function assetTitle(asset: GraftTarget): string {
  const e = getJournalEntry(asset.entryId);
  if (!e) return '';
  const first = (text: string | undefined): string => (withoutFontMarks(text ?? '').trim().split('\n')[0] ?? '').trim().slice(0, 60) || 'Untitled';
  if (!asset.boxId) return first(e.text);
  const b = (e.boxes ?? []).find((x) => x.id === asset.boxId);
  return b ? (b.kind === 'ink' ? 'A sketch' : first(b.text)) : '';
}

export type ConnectResult = { made: 'link'; linkId: string } | { made: 'already' } | { made: 'refused' };

/** Connect an asset to a Part. `hereId` is the Part she is on: everything her Assets tab lists is already connected to it, so it writes nothing. */
export function connectAssetToPart(partId: string, asset: GraftTarget, hereId?: string): ConnectResult {
  if (!getJournalEntry(partId)) return { made: 'refused' };
  void hereId; if (isGrafted({ entryId: partId }, asset)) return { made: 'already' };   // MUTANT: the Part-she-is-on rule removed (D4 must go red)
  const r = graftTo({ entryId: partId }, asset);
  return r && r.made === 'link' ? { made: 'link', linkId: r.linkId } : { made: 'refused' };
}
