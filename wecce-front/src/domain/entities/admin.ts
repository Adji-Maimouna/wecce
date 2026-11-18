/** Bonus de lancement (table configuration). Toujours versé en points, jamais en argent. */
export type LaunchBonus = {
  active: boolean;
  rate: number;
  quota: number;
  used: number;
  /** Plafond en points par dépôt (0 : aucun). */
  ceiling?: number;
  onePerStudent?: boolean;
  limits?: { maxRate: number; maxQuota: number; maxCeiling: number };
};

export type DepositsState = {
  suspended: boolean;
  /** Motif affiché aux étudiants pendant une suspension manuelle. */
  reason?: string;
  suspendedAt?: string;
  coverageRatio: number;
  autoSuspendBelow: number;
  upcomingAppointments: number;
};

export type ScheduledTask = {
  name: string;
  description: string;
  frequency: string;
  lastRun: string;
  result: string;
  tone: "ok" | "danger" | "neutral";
};

/** Écart trouvé par le contrôle nocturne des soldes. */
export type BalanceMismatch = { card: string; recorded: number; computed: number };

export type AdminActionType = "ajustement" | "suspension" | "reprise" | "retrait" | "configuration";

/** Ligne du journal d'administration (en ajout seul). */
export type AdminLogEntry = {
  at: string;
  type: AdminActionType;
  target: string;
  change: string;
  reason: string;
  by: string;
};

/** Compte étudiant vu par l'administration (recherche par carte). */
export type AccountSummary = { name: string; initials: string; card: string; study: string; active: boolean; balance: number };

export type AdjustmentDirection = "credit" | "debit";
