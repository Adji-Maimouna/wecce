import type { ReactNode } from "react";

/**
 * Valeur provisoire, encore à trancher avec le partenaire (soulignement pointillé).
 * Outil de maquette : à retirer quand la valeur est confirmée.
 */
export function Tbd({ note, children }: { note: string; children: ReactNode }) {
  return (
    <span className="tbd" title={note}>
      {children}
    </span>
  );
}
