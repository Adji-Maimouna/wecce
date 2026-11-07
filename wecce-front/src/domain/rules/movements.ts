import type { Movement, MovementKind, MovementType } from "@/domain/entities";

const KIND: Record<MovementType, MovementKind> = {
  reprise: "gain",
  bonus: "gain",
  ajustement: "gain",
  fonte: "baisse",
  acquisition: "depense",
};

/** Famille d'un mouvement (un ajustement négatif compte comme une dépense). */
export function movementKind(m: Movement): MovementKind {
  if (m.type === "ajustement") return m.amount >= 0 ? "gain" : "depense";
  return KIND[m.type];
}
