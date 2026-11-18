import type { DepositRequest, AppointmentAvailability } from "@/domain/entities";
import { RuleViolation } from "@/application/errors";
import type { AcquisitionRequest, DepositGateway, PaymentGateway, WaiverGateway } from "@/application/ports";

/** Prendre rendez-vous pour un dépôt. Rien n'est engagé avant l'examen chez LBC. */
export const makeSubmitDeposit = (deposits: DepositGateway) => async (request: DepositRequest) => {
  if (!request.availability?.days.length && request.slot === null)
    throw new RuleViolation("disponibilites-manquantes", "Cochez au moins un jour où vous pouvez passer chez LBC.");
  if (!request.modele.trim()) throw new RuleViolation("modele-manquant", "Indiquez la marque et le modèle.");
  return deposits.submit(request);
};

/** Changer le rendez-vous d'un dépôt. */
export const makeRescheduleDeposit = (deposits: DepositGateway) => async (ref: string, day: number, slot: number | null) => {
  if (slot === null) throw new RuleViolation("creneau-manquant", "Choisissez un créneau.");
  await deposits.reschedule(ref, day, slot);
};

/** Demander un rendez-vous (ou un autre) : l'étudiant donne ses disponibilités, LBC fixe le créneau. */
export const makeRequestAppointment = (deposits: DepositGateway) => async (ref: string, availability: AppointmentAvailability) => {
  if (!availability.days.length) throw new RuleViolation("disponibilites-manquantes", "Cochez au moins un jour où vous pouvez passer chez LBC.");
  await deposits.requestAppointment(ref, { ...availability, note: availability.note.trim() });
};

/** Annuler un dépôt : le créneau est libéré. */
export const makeCancelDeposit = (deposits: DepositGateway) => (ref: string) => deposits.cancel(ref);

export const makeSaveDepositDraft = (deposits: DepositGateway) => (request: DepositRequest) =>
  deposits.saveDraft ? deposits.saveDraft(request) : Promise.resolve({ ok: true, redirect: null, draftRef: null });

/** Prendre un objet : les points d'abord, le complément en francs ensuite. */
export const makeAcquireItem = (payments: PaymentGateway) => (request: AcquisitionRequest) => payments.acquire(request);

/** Attendre la confirmation d'un paiement mobile. */
export const makeAwaitPayment = (payments: PaymentGateway) => (paymentRef: string) => payments.awaitConfirmation(paymentRef);

/** Changer de moyen de paiement : la demande en attente est abandonnée, l'objet est libéré. */
export const makeCancelPayment = (payments: PaymentGateway) => (acquisitionRef: string) => payments.cancel(acquisitionRef);

/** Signer le renoncement : les points sont crédités immédiatement. */
export const makeSignWaiver = (waivers: WaiverGateway) => async (depositRef: string, signature: string) => {
  if (!signature) throw new RuleViolation("signature-manquante", "Signez dans le cadre.");
  return waivers.sign(depositRef, signature);
};

/** Refuser les deux prix au comptoir : aucun point, l'appareil repart avec l'étudiant. */
export const makeDeclineWaiver = (waivers: WaiverGateway) => (depositRef: string) => waivers.decline(depositRef);
