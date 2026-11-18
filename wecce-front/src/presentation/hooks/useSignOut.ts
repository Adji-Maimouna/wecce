import { router } from "@inertiajs/react";
import { paths } from "@/presentation/lib/paths";
import { useUseCases } from "./useUseCases";

/**
 * Se déconnecter : envoie la requête de déconnexion au backend puis redirige vers l'accueil.
 */
export function useSignOut(): () => Promise<void> {
  const { logout } = useUseCases();
  return async () => {
    await logout();
    router.visit(paths.accueil);
  };
}
