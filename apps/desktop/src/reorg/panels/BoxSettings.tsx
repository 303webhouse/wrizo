import { useRef, useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { lettersOf } from '../railData';
import { setBoxLook, useBoxes } from '../railMemory';
import { SWATCHES } from '../RailBox';

// BOX SETTINGS (step 4, frame R5; Nick, Nov 11: "one closed drop-down at the foot of Projects, for the Project she is in"). Letters (or none),
// a colour (the five swatches, brass among them, or her own colour), a picture. ALL OF IT IN MEMORY ONLY (railMemory.setBoxLook): the box's
// letters, colour and picture are new saved data, not approved until Nick's saved-data sitting, so a reload forgets them and nothing uploads
// (a picture is read with FileReader into a data: URL in this tab's memory).

const SWATCH_NAMES: DeskTermId[] = ['reorgSwatchPale', 'reorgSwatchGrey', 'reorgSwatchBlue', 'reorgSwatchBrass', 'reorgSwatchOrange'];

export function BoxSettings({ id, name }: { id: string | null; name: string }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const look = useBoxes()[id ?? ''] || {};
  const file = useRef<HTMLInputElement>(null);
  if (id == null) return null;   // Unfiled writing has no Project, so no box
  const colour = look.colour || SWATCHES[0];
  const letters = look.letters !== undefined ? look.letters : lettersOf(name);
  const choosePicture = (f: File | undefined) => {
    if (!f || !/^image\//.test(f.type)) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setBoxLook(id, { picture: reader.result }); };
    reader.readAsDataURL(f);
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
            <input id={`wz-reorg-letters-${id}`} className="wz-reorg-letters" data-box-letters="" maxLength={2} value={letters} spellCheck={false}
              onChange={(ev) => setBoxLook(id, { letters: ev.target.value.toUpperCase().slice(0, 2) })} />
            <button type="button" className="wz-reorg-chip" data-box-no-letters="" aria-pressed={look.letters === ''} onClick={() => setBoxLook(id, { letters: '' })}>{t('reorgNoLetters')}</button>
          </div>
          <div className="wz-reorg-box-settings-row">
            <span className="wz-reorg-box-settings-label" id={`wz-reorg-colour-${id}`}>{t('reorgColour')}</span>
            <div className="wz-reorg-swatches" role="radiogroup" aria-labelledby={`wz-reorg-colour-${id}`}>
              {SWATCHES.map((s, i) => (
                <button key={s} type="button" role="radio" className="wz-reorg-swatch" data-swatch={s} aria-checked={!look.picture && colour === s}
                  aria-label={t(SWATCH_NAMES[i])} title={t(SWATCH_NAMES[i])} style={{ background: s }} onClick={() => setBoxLook(id, { colour: s, picture: undefined })} />
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
