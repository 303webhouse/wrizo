// W3 / W11a - "more -> Tutor" STAGES an ask; it never sends one. The step "?" popover (components/StepHelp.tsx) calls stageTutorAsk(text); the Tutor (components/Tutor.tsx) listens, opens its
// drawer on the Tutor tab and puts `text` in its composer as ordinary editable text with the caret at the end - exactly what the Draft roster's chips do (pressAsk). Nothing goes on the wire:
// the writer reads it, edits it if they wish and presses Send, the existing unchanged send path. No Tutor mounted (a surface without one) = the event simply finds no listener.
export const TUTOR_STAGE_EVENT = 'wrizo:tutor-stage';

export function stageTutorAsk(text: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TUTOR_STAGE_EVENT, { detail: { text } }));
}
