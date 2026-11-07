import { notify } from "./db";

/*
 * Session du serveur simulé (l'équivalent du cookie de session Laravel).
 * « Rester connecté » : la session est gardée dans localStorage (partagée entre onglets).
 * Sinon : sessionStorage, propre à l'onglet. On peut donc ouvrir un onglet étudiant et un onglet LBC côte à côte.
 */

const KEY = "wecce-session";

function read(storage: Storage): string | null {
  try {
    return storage.getItem(KEY);
  } catch {
    return null;
  }
}

let current: string | null | undefined;

/** Identifiant du compte connecté, ou null. */
export function currentUserId(): string | null {
  if (current === undefined) current = read(sessionStorage) ?? read(localStorage);
  return current;
}

export function signIn(userId: string, remember: boolean) {
  current = userId;
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    (remember ? localStorage : sessionStorage).setItem(KEY, userId);
  } catch {
    /* stockage indisponible : la session reste en mémoire */
  }
  notify();
}

export function signOut() {
  current = null;
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    /* rien à effacer */
  }
  notify();
}
