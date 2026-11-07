/**
 * Règles des points (PRODUCT.md) :
 * - 1 point = 1 franc sur le marché ;
 * - le 1er de chaque mois, les points ET les prix baissent de 5 % (la fonte) : le pouvoir d'achat ne change pas ;
 * - les points n'expirent pas.
 */
export const FONTE_MENSUELLE = 0.05;

/** Valeur après `months` baisses mensuelles. */
export function afterFonte(value: number, months: number): number {
  return Math.round(value * Math.pow(1 - FONTE_MENSUELLE, months));
}

/** Ce que le solde couvre d'un prix : part en points et complément en francs. */
export function coverage(price: number, balance: number) {
  const covered = Math.min(price, balance);
  const complement = Math.max(0, price - balance);
  const ratio = price > 0 ? covered / price : 0;
  return { covered, complement, ratio, inBalance: complement === 0 };
}
