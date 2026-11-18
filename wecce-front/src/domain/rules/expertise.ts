/** Règles de l'expertise : l'agent fixe les deux prix, la plateforme ne calcule aucun prix. */

/** Le prix d'affichage ne peut pas être inférieur à la valeur de reprise. */
export function isListPriceValid(takeBack: number, listPrice: number): boolean {
  return !(takeBack > 0 && listPrice > 0 && listPrice < takeBack);
}

/** Les deux prix sont saisis et cohérents : on peut faire signer. */
export function canSubmitPrices(takeBack: number, listPrice: number): boolean {
  return takeBack > 0 && listPrice > 0 && isListPriceValid(takeBack, listPrice);
}

/** Écart pour la boutique, en points et en part du prix affiché. */
export function shopMargin(takeBack: number, listPrice: number): { points: number; ratio: number | null } {
  const points = Math.max(0, listPrice - takeBack);
  return { points, ratio: listPrice > 0 ? points / listPrice : null };
}

/** Bonus de lancement sur une reprise (taux en %). */
export function launchBonus(takeBack: number, rate: number, cap?: number): number {
  const raw = Math.round((takeBack * rate) / 100);
  return cap && cap > 0 ? Math.min(raw, cap) : raw;
}

/** Limites fixées avec LBC : taux et quota plafonnés (le plafond par dépôt est réglable). */
export const BONUS_MAX_RATE = 20;
export const BONUS_MAX_QUOTA = 500;

/** Points crédités à la signature : reprise + bonus. */
export function creditAtSignature(takeBack: number, bonusRate: number, cap?: number): number {
  return takeBack + launchBonus(takeBack, bonusRate, cap);
}

/** Écart entre le souhait de l'étudiant et la reprise proposée (positif : en dessous du souhait). */
export function gapToWish(wish: number, takeBack: number): number {
  return wish - takeBack;
}
