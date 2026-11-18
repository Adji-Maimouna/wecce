import type { AdjustmentDirection } from "@/domain/entities";

/** Limites du bonus demandées par LBC : plafond en points par dépôt, un seul bonus par étudiant. */
export type BonusLimits = { ceiling: number; onePerStudent: boolean };

export type AdjustmentRequest = { card: string; direction: AdjustmentDirection; amount: number; reason: string };

/** Port de l'administration. Chaque action est motivée et inscrite au journal (en ajout seul). */
export interface AdminGateway {
  setDepositsSuspended(suspended: boolean, reason: string): Promise<void>;
  saveBonus(rate: number, quota: number, reason: string, limits?: BonusLimits): Promise<void>;
  adjustPoints(request: AdjustmentRequest): Promise<{ balanceAfter: number }>;
}
