import type { PaymentMethod } from "@/domain/entities";

/** Nom affiché de chaque moyen de paiement. */
export const METHOD_NAMES: Record<PaymentMethod, string> = { wave: "Wave", om: "Orange Money", especes: "espèces" };
