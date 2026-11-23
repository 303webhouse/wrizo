// THE SCREENPLAY PAGE THAT IS OPEN, as Find and Replace needs it (SCRIPT #1). A script page holds its lines in its own state and saves them two seconds
// after the last key, so a replace asks it to save first (words typed a moment ago are replaced with the rest) and to take the new lines afterwards.

export interface OpenScript { flush: () => void; adopt: () => void }

const open = new Map<string, OpenScript>();

/** The page says it is open. Returns the call that says it has closed. */
export function registerOpenScript(id: string, host: OpenScript): () => void {
  open.set(id, host);
  return () => { if (open.get(id) === host) open.delete(id); };
}
export const flushOpenScript = (id: string): void => { open.get(id)?.flush(); };
export const adoptOpenScript = (id: string): void => { open.get(id)?.adopt(); };
