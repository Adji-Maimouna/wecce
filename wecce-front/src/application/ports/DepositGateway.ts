import type { AppointmentAvailability, DepositRequest } from "@/domain/entities";

export type DepositCreated = { ref: string };

/** Port des dépôts de l'étudiant (Laravel : POST /depots, DELETE /depots/{ref}). */
export interface DepositGateway {
  submit(request: DepositRequest): Promise<DepositCreated>;
  cancel(ref: string): Promise<void>;
  /** Changer le créneau d'un rendez-vous déjà pris. */
  reschedule(ref: string, day: number, slot: number): Promise<void>;
  /** Demander un (nouveau) rendez-vous : LBC fixera le jour et l'heure. */
  requestAppointment(ref: string, availability: AppointmentAvailability): Promise<void>;
  /** Enregistrer un brouillon de dépôt côté serveur (session ou base). */
  saveDraft?(request: DepositRequest): Promise<{ ok: boolean; redirect?: string | null; draftRef?: string | null }>;
}
