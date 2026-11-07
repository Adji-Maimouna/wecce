import type { DepositRequest } from "@/domain/entities";

export type DepositCreated = { ref: string };

/** Port des dépôts de l'étudiant (Laravel : POST /depots, DELETE /depots/{ref}). */
export interface DepositGateway {
  submit(request: DepositRequest): Promise<DepositCreated>;
  cancel(ref: string): Promise<void>;
  /** Changer le créneau d'un rendez-vous déjà pris. */
  reschedule(ref: string, day: number, slot: number): Promise<void>;
}
