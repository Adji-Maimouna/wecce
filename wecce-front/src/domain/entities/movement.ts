/** Type d'un mouvement de points (table mouvement_points). */
export type MovementType = "reprise" | "bonus" | "fonte" | "acquisition" | "ajustement";

/** Famille d'un mouvement, pour le filtre de l'historique. */
export type MovementKind = "gain" | "baisse" | "depense";

/** Ligne du journal des points (en ajout seul : le solde est la somme des mouvements). */
export type Movement = {
  date: string;
  type: MovementType;
  detail: string;
  /** Positif pour un crédit, négatif pour un débit. */
  amount: number;
  balanceAfter: number;
};

/** Un point du graphique « Depuis votre premier dépôt ». */
export type BalancePoint = {
  label: string;
  /** Jours écoulés depuis le premier dépôt. */
  day: number;
  balance: number;
  /** Prix de l'objet déposé à cette date. */
  price: number;
  projected?: boolean;
};
