import type { CoverageSnapshot } from "@/domain/entities";

export type CoverageLevel = "ouvert" | "surveillance" | "suspendu";

/** Niveau de couverture : au-dessus du seuil de surveillance, entre les deux, ou sous le seuil de suspension. */
export function coverageLevel(c: Pick<CoverageSnapshot, "ratio" | "thresholds">): CoverageLevel {
  if (c.ratio < c.thresholds.suspend) return "suspendu";
  if (c.ratio < c.thresholds.watch) return "surveillance";
  return "ouvert";
}

/** Marge réelle d'une expertise : (prix d'affichage − reprise) ÷ prix d'affichage. */
export function realMargin(takeBack: number, listPrice: number): number {
  return listPrice > 0 ? (listPrice - takeBack) / listPrice : 0;
}
