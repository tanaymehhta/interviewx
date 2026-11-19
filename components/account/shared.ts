// Pure helpers shared by the browser and the server. No imports, so `node --test` can run the checks.

/** A same-site path to return to after sign-in, or null. Rejects full URLs and "//host" forms. */
export const safeNext = (next: unknown): string | null =>
  typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : null;

export const MAX_ROLES = 5;
/** "Sales manager, strategy associate" becomes a list of names. */
export const parseRoles = (text: string): string[] =>
  text.split(/[,\n;]/).map((r) => r.trim().slice(0, 80)).filter(Boolean);

export const RESUME_TEXT_MAX = 20_000;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
