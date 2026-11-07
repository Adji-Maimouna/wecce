import { useState } from "react";

type Rule = { ok: boolean; message: string };

/**
 * Validation simple à l'envoi : les erreurs n'apparaissent qu'après une première tentative,
 * puis se retirent dès que le champ est corrigé.
 */
export function useRequired<K extends string>(rules: Record<K, Rule>) {
  const [tried, setTried] = useState(false);
  const errors = Object.fromEntries(
    (Object.keys(rules) as K[]).map((k) => [k, tried && !rules[k].ok ? rules[k].message : null]),
  ) as Record<K, string | null>;
  const valid = (Object.keys(rules) as K[]).every((k) => rules[k].ok);

  /** À appeler à l'envoi : renvoie vrai si tout est bon, sinon place le focus sur le premier champ fautif. */
  function check(): boolean {
    setTried(true);
    if (!valid) {
      const first = (Object.keys(rules) as K[]).find((k) => !rules[k].ok);
      if (first) document.getElementById(first)?.focus();
    }
    return valid;
  }

  return { errors, check };
}
