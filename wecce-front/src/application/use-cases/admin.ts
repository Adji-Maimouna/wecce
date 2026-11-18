import { checkAdjustment } from "@/domain/rules/adjustment";
import { RuleViolation } from "@/application/errors";
import type { AdjustmentRequest, AdminGateway, BonusLimits } from "@/application/ports";
import { BONUS_MAX_QUOTA, BONUS_MAX_RATE } from "@/domain/rules/expertise";

const MIN_REASON = 5;

/** Suspendre ou rouvrir les dépôts à la main, avec un motif affiché aux étudiants. */
export const makeSetDepositsSuspended = (admin: AdminGateway) => async (suspended: boolean, reason: string) => {
  if (suspended && reason.trim().length < MIN_REASON) throw new RuleViolation("motif-manquant", "Indiquez le motif affiché aux étudiants.");
  await admin.setDepositsSuspended(suspended, reason.trim());
};

/** Changer le bonus de lancement (toujours en points). Le motif est obligatoire. */
export const makeSaveBonus = (admin: AdminGateway) => async (rate: number, quota: number, reason: string, limits?: BonusLimits) => {
  if (reason.trim().length < MIN_REASON) throw new RuleViolation("motif-manquant", "Saisissez un motif pour enregistrer.");
  if (!(rate >= 0 && rate <= BONUS_MAX_RATE)) throw new RuleViolation("bonus-taux", `Le taux du bonus doit rester entre 0 et ${BONUS_MAX_RATE} %.`);
  if (!(quota > 0 && quota <= BONUS_MAX_QUOTA)) throw new RuleViolation("bonus-quota", `Le nombre de dépôts bonifiés est limité à ${BONUS_MAX_QUOTA}.`);
  if (limits && !(limits.ceiling >= 0)) throw new RuleViolation("bonus-plafond", "Indiquez un plafond en points (0 = sans plafond).");
  await admin.saveBonus(rate, quota, reason.trim(), limits);
};

/** Ajuster un solde : on ajoute un mouvement motivé, on n'efface jamais. */
export const makeAdjustPoints = (admin: AdminGateway) => async (balance: number, request: AdjustmentRequest) => {
  const check = checkAdjustment(balance, request.direction, request.amount, request.reason);
  if (!check.ok) throw new RuleViolation("ajustement-invalide", "Ajustement refusé par les règles (montant, motif ou solde négatif).");
  return admin.adjustPoints({ ...request, reason: request.reason.trim() });
};
