// CD2 S3 — the Settings category's Sign-out request, a tiny pub-sub the SAME
// shape as store/deskFrameActive.ts's own listener set (that file's header
// comment names the precedent this one copies). The Cascade's Settings panel
// lives deep inside a framed page host (JournalEntry/PageEditor/ScriptEditor
// -> DeskFrame -> Cascade), with no clean prop path up to App.tsx's own
// `handleLogout` (which also owns the `authState` React state that decides
// what the rest of the app renders) — rather than thread `onLogout`/`authed`
// through three separate host files' own already-large prop lists, or
// duplicate the logout sequence (apiLogout/stopSync/clearLastSyncAt/
// resetLocalData/setCurrentUser) a second time and risk the two copies
// drifting, the panel fires ONE request here; App.tsx is the sole listener
// and runs its own EXISTING handleLogout unchanged. "Invent nothing" (S3's
// own words for this category) — this reuses the one real implementation.
const listeners = new Set<() => void>();

export function requestLogout(): void {
  listeners.forEach((l) => l());
}

export function onLogoutRequested(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
