import type { Category } from "./market";
import type { RefusalReason } from "./partner";

/**
 * Statut d'un dépôt (table depot, statut_depot).
 * « a-signer » : LBC a fixé les deux prix, l'étudiant n'a pas encore signé (EXPERTISE dans le schéma).
 */
export type DepositStatus = "brouillon" | "rendez-vous" | "a-signer" | "repris" | "refuse" | "annule";

/** Étapes de la vie d'un dépôt, dans l'ordre. */
export const DEPOSIT_STAGES = ["decrit", "rendez-vous", "examen", "signature", "en-vente"] as const;
export type DepositStage = (typeof DEPOSIT_STAGES)[number];

/** Dépôt d'un étudiant (table depot). */
export type Deposit = {
  ref: string;
  deviceName: string;
  category: Category;
  status: DepositStatus;
  photo?: string;
  /** Étape en cours (rang dans DEPOSIT_STAGES) ; 5 quand tout est fait. */
  stageIndex?: number;
  appointment?: { label: string; long: string };
  wish?: number;
  missing?: string;
  signedOn?: string;
  takeBack?: { points: number; bonus: number };
  prices?: { initial: number; today: number };
  examinedOn?: string;
  /** Refus : le motif (code) et le commentaire de l'agent. */
  refusal?: { reason: RefusalReason; comment: string };
  cancelledOn?: string;
  /** Annonce liée sur le marché (dépôt repris, objet en ligne). */
  itemSlug?: string;
};

export type AgeBand = "moins-1" | "1-2" | "2-3" | "plus-4" | "inconnu";
export type DeviceCondition = "comme-neuf" | "bon" | "use";
export type PartCondition = "fonctionnel" | "defectueux";

/** Demande de dépôt remplie en ligne avant le rendez-vous. */
export type DepositRequest = {
  category: Category;
  modele: string;
  stockage: string;
  age: AgeBand;
  etat: DeviceCondition;
  etatPiece: PartCondition;
  photos: (string | null)[];
  /** Prix souhaité en points, privé (vu seulement par l'étudiant et LBC). Facultatif. */
  souhait: number | null;
  day: number;
  slot: number | null;
  /** Brouillon repris : la demande complète ce dépôt au lieu d'en créer un. */
  draftRef?: string;
};

/** Jour de rendez-vous proposé par LBC. */
export type AppointmentDay = {
  label: string;
  month: string;
  freeCount: number;
  /** Rangs des créneaux déjà pris (ou passés). */
  taken: number[];
};
