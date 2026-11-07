/** Rôle d'un compte (table utilisateur.role). Le rôle décide de l'espace ouvert à la connexion. */
export type Role = "ETUDIANT" | "AGENT" | "ADMIN";

/** Identité commune à tous les comptes (table utilisateur). */
export type User = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  role: Role;
};

/** Nom court affiché (« Moussa D. »). */
export function displayName(u: Pick<User, "prenom" | "nom">): string {
  return `${u.prenom} ${u.nom.charAt(0)}.`;
}

/** Initiales de l'avatar (« MD »). */
export function initials(u: Pick<User, "prenom" | "nom">): string {
  return `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();
}
