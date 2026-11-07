import type { PaymentMethod } from "@/domain/entities";

export type { PaymentMethod };

export type AcquisitionRequest = { itemSlug: string; method: PaymentMethod; phone?: string };

export type AcquisitionResult =
  /** Espèces, ou objet entièrement couvert par les points : l'objet est réservé tout de suite. */
  | { status: "reserve"; acquisitionRef: string }
  /** Paiement mobile : une demande attend la validation de l'étudiant sur son téléphone. */
  | { status: "en-attente"; acquisitionRef: string; paymentRef: string; sentAt: string };

/** Port des acquisitions et du paiement du complément (Laravel : POST /acquisitions, rappels Wave / Orange Money). */
export interface PaymentGateway {
  acquire(request: AcquisitionRequest): Promise<AcquisitionResult>;
  /** Se résout quand le prestataire confirme ou refuse le paiement. */
  awaitConfirmation(paymentRef: string): Promise<"confirme" | "echoue">;
  /** Abandonner un paiement mobile en attente : l'objet revient sur le marché, rien n'est débité. */
  cancel(acquisitionRef: string): Promise<void>;
}
