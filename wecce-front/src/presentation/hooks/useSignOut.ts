import { useNavigate } from "react-router";
import { paths } from "@/presentation/lib/paths";
import { useUseCases } from "./useUseCases";

/**
 * Se déconnecter : on quitte d'abord l'espace réservé (vers la page d'entrée), puis la session est fermée.
 * Avec Inertia : `router.post(route("logout"))`, le serveur redirige.
 */
export function useSignOut(): () => Promise<void> {
  const { logout } = useUseCases();
  const navigate = useNavigate();
  return async () => {
    navigate(paths.entree);
    await logout();
  };
}
