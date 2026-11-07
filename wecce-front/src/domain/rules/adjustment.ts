import type { AdjustmentDirection } from "@/domain/entities";

/** Longueur minimale du motif d'un ajustement (lu par l'étudiant, conservé au journal). */
export const ADJUSTMENT_REASON_MIN = 10;

/** Solde après ajustement (peut être négatif : à refuser). */
export function balanceAfterAdjustment(balance: number, direction: AdjustmentDirection, amount: number): number {
  return balance + (direction === "debit" ? -amount : amount);
}

export type AdjustmentCheck = { ok: boolean; negative: boolean; reasonTooShort: boolean; noAmount: boolean };

/** Un ajustement est valable s'il a un montant, un motif suffisant, et ne rend pas le solde négatif. */
export function checkAdjustment(balance: number, direction: AdjustmentDirection, amount: number, reason: string): AdjustmentCheck {
  const negative = balanceAfterAdjustment(balance, direction, amount) < 0;
  const reasonTooShort = reason.trim().length < ADJUSTMENT_REASON_MIN;
  const noAmount = !(amount > 0);
  return { ok: !negative && !reasonTooShort && !noAmount, negative, reasonTooShort, noAmount };
}
