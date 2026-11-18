import type { ArticleInput, ExpertiseInput, RefusalReason } from "@/domain/entities";

/** Port de l'espace LBC (Laravel : expertise, refus, stock, remise de l'objet). */
export interface PartnerGateway {
  submitExpertise(input: ExpertiseInput): Promise<void>;
  refuseDeposit(depositRef: string, reason: RefusalReason, comment: string): Promise<void>;
  /** Fixer le jour (AAAA-MM-JJ) et l'heure (HH:MM) du rendez-vous d'un dépôt. Renvoie le libellé du créneau. */
  scheduleAppointment(depositRef: string, date: string, time: string): Promise<{ label: string }>;
  publishArticle(articleId: string): Promise<void>;
  /** Valider un achat : les points de l'étudiant sont débités, l'objet lui est réservé. */
  validateAcquisition(acquisitionRef: string): Promise<{ points: number; complement: number }>;
  /** Refuser un achat : rien n'est débité, l'objet revient sur le marché. */
  refuseAcquisition(acquisitionRef: string, reason: string): Promise<{ refundFcfa: number }>;
  /** Confirmer la remise de l'objet à l'étudiant. */
  handOver(acquisitionRef: string): Promise<void>;
  /** Créer (sans id) ou modifier un article. Renvoie son identifiant. */
  saveArticle(input: ArticleInput): Promise<{ id: string }>;
  withdrawArticle(articleId: string, reason: string): Promise<void>;
}
