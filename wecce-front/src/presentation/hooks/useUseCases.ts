import { createContext, useContext } from "react";
import type { UseCases } from "@/application";

/** Cas d'usage injectés par la couche app (adaptateurs de démo aujourd'hui, Inertia demain). */
export const UseCasesContext = createContext<UseCases | null>(null);

/** `const { login } = useUseCases();` — la seule porte de la présentation vers les actions métier. */
export function useUseCases(): UseCases {
  const uc = useContext(UseCasesContext);
  if (!uc) throw new Error("useUseCases doit être utilisé sous <UseCasesContext>.");
  return uc;
}
