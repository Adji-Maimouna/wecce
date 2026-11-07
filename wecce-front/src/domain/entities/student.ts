import type { User } from "./user";

/** Étudiant (tables utilisateur + etudiant + compte_points). */
export type Student = User & {
  role: "ETUDIANT";
  numeroCarte: string;
  niveau?: string;
  ufr?: string;
  /** Solde de points (cache de la somme des mouvements). */
  balance: number;
  memberSince: string;
  /** Nombre de dépôts, tous statuts confondus. */
  depositCount: number;
};

/** Données d'inscription d'un étudiant. */
export type StudentRegistration = {
  prenom: string;
  nom: string;
  numeroCarte: string;
  telephone: string;
  email: string;
  niveau?: string;
  ufr?: string;
  motDePasse: string;
};
