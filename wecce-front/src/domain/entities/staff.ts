import type { User } from "./user";

/** Agent de la boutique LBC (tables utilisateur + agent). */
export type Agent = User & {
  role: "AGENT";
  fonction: string;
  peutExpertiser: boolean;
  /** Poste de travail (« Comptoir 1 »). */
  poste: string;
};

/** Administrateur de la plateforme (tables utilisateur + administrateur). */
export type Administrator = User & {
  role: "ADMIN";
  portee: "GLOBAL" | string;
};
