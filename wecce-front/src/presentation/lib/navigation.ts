import { useLocation, useNavigate } from "react-router";

/**
 * Point unique de navigation.
 * Aujourd'hui : React Router. Avec Laravel + Inertia : remplacer par `usePage().url` et `router.visit()`.
 */
export function useCurrentPath(): string {
  return useLocation().pathname;
}

export function useGo(): (href: string) => void {
  const navigate = useNavigate();
  return (href: string) => navigate(href, { viewTransition: true });
}
