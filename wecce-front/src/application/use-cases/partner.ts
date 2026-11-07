import type { ArticleInput, ExpertiseInput, RefusalReason } from "@/domain/entities";
import { canSubmitPrices } from "@/domain/rules/expertise";
import { RuleViolation } from "@/application/errors";
import type { PartnerGateway } from "@/application/ports";

/** Valider l'expertise : les deux prix fixés par l'agent, puis signature de l'étudiant. */
export const makeSubmitExpertise = (partner: PartnerGateway) => async (input: ExpertiseInput) => {
  if (!canSubmitPrices(input.takeBack, input.listPrice))
    throw new RuleViolation("prix-incoherents", "Le prix d'affichage ne peut pas être inférieur à la valeur de reprise.");
  await partner.submitExpertise(input);
};

/** Refuser un dépôt : l'étudiant repart avec son appareil et lit le motif. */
export const makeRefuseDeposit = (partner: PartnerGateway) => (depositRef: string, reason: RefusalReason, comment: string) =>
  partner.refuseDeposit(depositRef, reason, comment.trim());

export const makePublishArticle = (partner: PartnerGateway) => (articleId: string) => partner.publishArticle(articleId);

/** Remettre un objet réservé : l'acquisition est soldée, la garantie démarre. */
export const makeHandOver = (partner: PartnerGateway) => (acquisitionRef: string) => partner.handOver(acquisitionRef);

/** Ajouter ou modifier un article de la boutique : un nom et un prix en points sont obligatoires. */
export const makeSaveArticle = (partner: PartnerGateway) => async (input: ArticleInput) => {
  if (!input.name.trim()) throw new RuleViolation("nom-manquant", "Indiquez le nom de l'article.");
  if (!(input.price > 0)) throw new RuleViolation("prix-manquant", "Indiquez le prix d'affichage en points.");
  return partner.saveArticle({ ...input, name: input.name.trim() });
};

/** Retirer un article du marché, avec un motif inscrit au journal. */
export const makeWithdrawArticle = (partner: PartnerGateway) => async (articleId: string, reason: string) => {
  if (reason.trim().length < 5) throw new RuleViolation("motif-manquant", "Indiquez pourquoi l'article est retiré.");
  await partner.withdrawArticle(articleId, reason.trim());
};
