import { isPasswordLongEnough, looksLikeEmail } from "@/domain/rules/account";
import { RuleViolation } from "@/application/errors";
import type { ContactUpdate, ProfileGateway } from "@/application/ports";

/** Mettre à jour ses coordonnées. */
export const makeUpdateContact = (profile: ProfileGateway) => async (update: ContactUpdate) => {
  if (!looksLikeEmail(update.email)) throw new RuleViolation("email-invalide", "Indiquez une adresse e-mail valide.");
  if (!update.telephone.trim()) throw new RuleViolation("telephone-manquant", "Indiquez votre numéro.");
  await profile.updateContact({ ...update, email: update.email.trim(), telephone: update.telephone.trim() });
};

/** Changer de mot de passe (l'actuel est vérifié par le serveur). */
export const makeChangePassword = (profile: ProfileGateway) => async (current: string, next: string) => {
  if (!isPasswordLongEnough(next)) throw new RuleViolation("mot-de-passe-court", "Choisissez un mot de passe de 8 caractères au moins.");
  return profile.changePassword(current, next);
};
