export type ContactUpdate = { email: string; telephone: string; niveau?: string; ufr?: string };

/** Port du profil, commun aux trois rôles (Laravel : PUT /profil, PUT /profil/mot-de-passe). */
export interface ProfileGateway {
  updateContact(update: ContactUpdate): Promise<void>;
  /** Refusé si le mot de passe actuel est faux. */
  changePassword(current: string, next: string): Promise<{ ok: boolean }>;
}
