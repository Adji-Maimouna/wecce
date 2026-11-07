import { makeUseCases } from "@/application";
import { getVersion, subscribe } from "@/infrastructure/demo/db";
import { demoPorts } from "@/infrastructure/demo/gateways";
import * as server from "@/infrastructure/demo/queries";
import type { Session } from "@/presentation/hooks/session";

/**
 * Racine de composition : le seul endroit qui choisit les adaptateurs.
 * Aujourd'hui : le serveur simulé (src/infrastructure/demo). Pour brancher Laravel :
 * remplacer `demoPorts` par les adaptateurs Inertia, la session par `usePage().props.auth`,
 * et les lectures de `server` par les props envoyées par les contrôleurs.
 */
export const useCases = makeUseCases(demoPorts);

/** Lectures du serveur simulé (ce que les contrôleurs Laravel enverront en props). */
export { server };

/** Abonnement aux changements de données : les écrans se recalculent après chaque action. */
export const store = { subscribe, getVersion };

/** Le compte connecté, tel que le partagera Inertia (props `auth`). */
export function currentSession(): Session {
  const v = server.viewer();
  if (!v) return {};
  if (v.role === "ETUDIANT") return { student: server.studentEntity(v.id) };
  if (v.role === "AGENT") return { agent: server.agentEntity(v.id), appointmentsToReceive: server.appointmentsToReceive() };
  return { admin: server.adminEntity(v.id) };
}
