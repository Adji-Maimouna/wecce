import type { ArticleInput, ExpertiseInput, RefusalReason } from "@/domain/entities";

/** Port de l'espace LBC (Laravel : expertise, refus, stock, remise de l'objet). */
export interface PartnerGateway {
  submitExpertise(input: ExpertiseInput): Promise<void>;
  refuseDeposit(depositRef: string, reason: RefusalReason, comment: string): Promise<void>;
  publishArticle(articleId: string): Promise<void>;
  handOver(acquisitionRef: string): Promise<void>;
  /** Créer (sans id) ou modifier un article. Renvoie son identifiant. */
  saveArticle(input: ArticleInput): Promise<{ id: string }>;
  withdrawArticle(articleId: string, reason: string): Promise<void>;
}
