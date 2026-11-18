import type { Condition } from "./market";

/** Renoncement de propriété signé au comptoir (table renoncement). */
export type Waiver = {
  ref: string;
  place: string;
  openedAt: string;
  depositor: { name: string; card: string; study: string };
  device: { name: string; serial: string; condition: Condition; battery: number | null };
  wish: number | null;
  /** Valeur de reprise fixée par la boutique. */
  takeBack: number;
  /** Prix de mise en vente (ou de l'ensemble des pièces). */
  listPrice: number;
  bonusRate: number;
  /** Bonus réellement accordé (plafonné, un seul par étudiant) ; calculé par le serveur. */
  bonus?: number;
  /** Reprise en pièces : l'appareil ne peut pas repartir entier. */
  pieces: boolean;
  /** Mode de reprise (échange direct : objet gardé en boutique, ou objet LBC en contrepartie). */
  mode?: "vente" | "echange-points" | "echange-objet";
  counterpart?: string | null;
  balanceBefore: number;
  signedAt: string;
  agent: string;
  hash: string;
};
