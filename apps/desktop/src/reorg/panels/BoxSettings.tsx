import { useRef, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { lettersOf } from '../railData';
import { setBoxLook, useBoxes } from '../railMemory';
import { encodeBoxPicture, setBoxPictureSaved } from '../railSaved';
import { ARBOR_PLAIN_BOX, ARBOR_SWATCHES, useSwatches } from '../RailBox';

// BOX SETTINGS (step 4, frame R5; Nick, Nov 11: "one closed drop-down at the foot of Projects, for the Project she is in"). Letters (or none),
// a colour (the five swatches, brass among them, or her own colour), a picture. SAVED WITH THE ACCOUNT (Nick's ruling, Nov 18; railSaved.ts):
// the picture is made small on this device first (256 px square, WebP, 64 KB at most) and only that copy is uploaded, never her file.

const SWATCH_NAMES: DeskTermId[] = ['reorgSwatchPale', 'reorgSwatchGrey', 'reorgSwatchBlue', 'reorgSwatchBrass', 'reorgSwatchOrange'];
// ARBOR's six are named by the slots' words (Olive .. Iron in Arbor's table): the same cloths as a Section's tag
const ARBOR_SWATCH_NAMES: DeskTermId[] = ['reorgTagA', 'reorgTagB', 'reorgTagC', 'reorgTagD', 'reorgTagE', 'reorgTagF'];

export function BoxSettings({ id, name }: { id: string | null; name: string }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const look = useBoxes()[id ?? ''] || {};
  const file = useRef<HTMLInputElement>(null);
  const swatches = useSwatches();
  const names = swatches === ARBOR_SWATCHES ? ARBOR_SWATCH_NAMES : SWATCH_NAMES;
  if (id == null) return null;   // Unfiled writing has no Project, so no box
  // ARBOR: a box with no colour of its own is plain cream and no swatch is chosen (the Wrizors, Nov 21); elsewhere the first swatch, as ruled
  const colour = look.colour || (swatches === ARBOR_SWATCHES ? ARBOR_PLAIN_BOX : swatches[0]);
  const letters = look.letters !== undefined ? look.letters : lettersOf(name);
  const choosePicture = (f: File | undefined) => {
    if (!f || !/^image\//.test(f.type)) return;
    // a file the browser cannot read as a picture, or none that fits in 64 KB, changes nothing
    void encodeBoxPicture(f).then((small) => { if (small) return setBoxPictureSaved(id, small.bytes, small.mime); }).catch(() => undefined);
  };
  return (
    <section className="wz-reorg-box-settings" data-box-settings={id} data-open={open ? 'true' : 'false'}>
      <button type="button" className="wz-reorg-box-settings-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="wz-reorg-box-settings-caret" aria-hidden="true">{open ? 'v' : '›'}</span>
        <span className="wz-reorg-box-settings-title">{t('reorgBoxSettings')}</span>
        <span className="wz-reorg-box-settings-for">{name}</span>
      </button>
      {open && (
        <div className="wz-reorg-box-settings-body">
          <div className="wz-reorg-box-settings-row">
            <label className="wz-reorg-box-settings-label" htmlFor={`wz-reorg-letters-${id}`}>{t('reorgLetters')}</label>
            <input id={`wz-reorg-letters-${id}`} className="wz-reorg-letters" data-box-letters="" maxLength={2} value={letters}
              onChange={(ev) => setBoxLook(id, { letters: ev.target.value.toUpperCase().slice(0, 2) })} />
            <button type="button" className="wz-reorg-chip" data-box-no-letters="" aria-pressed={look.letters === ''} onClick={() => setBoxLook(id, { letters: '' })}>{t('reorgNoLetters')}</button>
          </div>
          <div className="wz-reorg-box-settings-row">
            <span className="wz-reorg-box-settings-label" id={`wz-reorg-colour-${id}`}>{t('reorgColour')}</span>
            <div className="wz-reorg-swatches" role="radiogroup" aria-labelledby={`wz-reorg-colour-${id}`}>
              {swatches.map((s, i) => (
                <button key={s} type="button" role="radio" className="wz-reorg-swatch" data-swatch={s} aria-checked={!look.picture && colour === s}
                  aria-label={t(names[i])} title={t(names[i])} style={{ background: s }} onClick={() => setBoxLook(id, { colour: s, picture: undefined })} />
              ))}
            </div>
          </div>
          <div className="wz-reorg-box-settings-row wz-reorg-box-settings-row--indent">
            <label className="wz-reorg-chip wz-reorg-own-colour">
              {t('reorgOwnColour')}
              <input type="color" data-box-own-colour="" value={colour.toLowerCase()} onChange={(ev) => setBoxLook(id, { colour: ev.target.value.toUpperCase(), picture: undefined })} />
            </label>
          </div>
          <div className="wz-reorg-box-settings-row">
            <span className="wz-reorg-box-settings-label">{t('reorgPicture')}</span>
            <button type="button" className="wz-reorg-chip" data-box-choose-picture="" onClick={() => file.current?.click()}>{t('reorgChoosePicture')}</button>
            {look.picture ? <button type="button" className="wz-reorg-chip" data-box-remove-picture="" onClick={() => setBoxLook(id, { picture: undefined })}>{t('reorgRemovePicture')}</button> : null}
            <input ref={file} type="file" accept="image/*" hidden data-box-picture-input="" onChange={(ev) => { choosePicture(ev.target.files?.[0]); ev.target.value = ''; }} />
          </div>
        </div>
      )}
    </section>
  );
}
