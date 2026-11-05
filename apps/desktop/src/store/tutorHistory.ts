// the client sends only the most recent messages within the server's cap, ending with the writer's; pure and dependency-free, so a proof runs the real function [tutorHistory §1]
type TutorRole = 'writer' | 'tutor';

// mirrors apps/server/src/tutor.ts's MAX_MESSAGES (20): separate packages, so it must stay numerically mirrored [tutorHistory §2]
export const TUTOR_MAX_MESSAGES = 20;

// cap a stored thread to the most recent `max` messages in order; a window this function cut must open on a writer turn [tutorHistory §3]
export function capTutorHistory<T extends { role: TutorRole; text: string }>(
  full: readonly T[],
  max: number = TUTOR_MAX_MESSAGES,
): T[] {
  if (max <= 0) return [];
  // the leading-tutor drop repairs a truncation, so it never runs on a thread this function did not cut (a spur may legitimately open one) [tutorHistory §4]
  if (full.length <= max) return full.slice();
  let capped = full.slice(full.length - max);
  while (capped.length > 0 && capped[0].role === 'tutor') capped = capped.slice(1);
  return capped;
}
