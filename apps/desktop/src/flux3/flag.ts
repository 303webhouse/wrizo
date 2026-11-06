// FLUX3 - the redesign's URL flag (flux-rulings-oct31.md: "?flux3=1"; the handoff: a URL query parameter only, no stored flag, no localStorage key).
// Read once at load: the query sits before the hash route (/?flux3=1#/...), so in-app navigation never changes it.
export const FLUX3: boolean = typeof location !== 'undefined' && new URLSearchParams(location.search).get('flux3') === '1';
