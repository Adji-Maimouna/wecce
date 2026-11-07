/** Règles des comptes. */

export const PASSWORD_MIN_LENGTH = 8;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

/** Vérification simple d'une adresse e-mail (la vraie validation se fait côté Laravel). */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
