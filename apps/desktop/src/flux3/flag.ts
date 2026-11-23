// FLUX3 - the redesign's URL flag (flux-rulings-oct31.md: "?flux3=1"; the handoff: a URL query parameter only, no stored flag, no localStorage key).
// Read once at load: the query sits before the hash route (/?flux3=1#/...), so in-app navigation never changes it.
// SWITCH-OVER (Nick, Nov 22, 9:09 pm: "the full Flux redesign live"; Fable's Flux-live plan): the redesign is ON by default; ?flux3=0 turns it off, for tests. (It was on only behind ?flux3=1.) Every part of it is Flux's:
// the components that mount from this flag return nothing outside the Flux theme and its stylesheet is scoped to :root[data-flux3][data-theme='flux'], so Machina and Arbor are not changed by it being on.
export const FLUX3: boolean = !(typeof location !== 'undefined' && new URLSearchParams(location.search).get('flux3') === '0');
