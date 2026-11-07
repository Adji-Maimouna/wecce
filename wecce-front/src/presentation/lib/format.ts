/** Nombres à la française : espace fine comme séparateur de milliers, chiffres entiers. */
const nf = new Intl.NumberFormat("fr-FR");

export function fmt(n: number): string {
  return nf.format(Math.round(n));
}

/** « 32 490 pts », « 0 pt », « 1 pt » */
export function pts(n: number): string {
  return `${fmt(n)} ${Math.abs(n) > 1 ? "pts" : "pt"}`;
}

/** « 9 510 F » (francs CFA) */
export function francs(n: number): string {
  return `${fmt(n)} F`;
}

/** « 1 objet », « 17 objets » */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

/** Garde seulement les chiffres d'une saisie et la reformate (« 90000 » → « 90 000 »). */
export function formatDigits(raw: string, maxDigits = 7): string {
  const d = raw.replace(/\D/g, "").slice(0, maxDigits);
  return d ? fmt(Number(d)) : "";
}

/** Lit un nombre saisi avec des espaces (« 72 000 » → 72000) : tout ce qui n'est pas un chiffre est ignoré. */
export function parseAmount(raw: string): number {
  return Number(String(raw).replace(/\D/g, "")) || 0;
}
