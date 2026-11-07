import { useState } from "react";
import type { DepositRequest } from "@/domain/entities";
import { fmt, parseAmount } from "@/presentation/lib/format";

/** Brouillon du formulaire : comme la demande de dépôt, mais le prix souhaité reste le texte saisi (« 90 000 »). */
export type DepositDraft = Omit<DepositRequest, "souhait"> & { souhait: string };

/** Valeurs de départ fournies par le serveur : un brouillon à reprendre, et le premier créneau libre. */
export type DraftStart = Partial<Omit<DepositRequest, "photos">> & { day: number; slot: number | null };

/** Brouillon de dépôt partagé par les quatre étapes. */
export function useDepositDraft(start: DraftStart) {
  const [draft, setDraft] = useState<DepositDraft>(() => ({
    category: start.category ?? "tel",
    modele: start.modele ?? "",
    stockage: start.stockage ?? "",
    age: start.age ?? "1-2",
    etat: start.etat ?? "bon",
    etatPiece: start.etatPiece ?? "fonctionnel",
    photos: [null, null, null, null],
    souhait: start.souhait ? fmt(start.souhait) : "",
    day: start.day,
    slot: start.slot,
    draftRef: start.draftRef,
  }));
  const update = (patch: Partial<DepositDraft>) => setDraft((d) => ({ ...d, ...patch }));
  return { draft, update };
}

/** Convertit le brouillon en demande de dépôt pour le cas d'usage. */
export function toDepositRequest(draft: DepositDraft): DepositRequest {
  return { ...draft, souhait: draft.souhait ? parseAmount(draft.souhait) : null };
}
