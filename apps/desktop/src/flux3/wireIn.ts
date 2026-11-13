// FLUX WIRE IN - the Corridor on its own (Fable, Nov 12 6:50 pm). Imported once from main.tsx, AFTER index.css, so its rules come after the global ones as flux-v3.css's did.
// It loads the Corridor's stylesheet and sets the marker every one of its rules is scoped to (with the Flux theme): `data-wirein` on <html>. The marker is inert for every other theme,
// and it is NOT `data-flux3`: that stays the mark of the redesign's other pieces (the Schema, the doc frame, the room ground, the rail dress), which still need ?flux3=1.
import './flux-wirein.css';

if (typeof document !== 'undefined') document.documentElement.setAttribute('data-wirein', '');
