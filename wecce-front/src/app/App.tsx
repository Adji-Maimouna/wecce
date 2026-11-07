import { Fragment, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { Navigate, Route, Routes, useLocation, useParams, useSearchParams } from "react-router";
import { ToastProvider } from "@/presentation/components/feedback/ToastProvider";
import { useGlobalRipple } from "@/presentation/hooks/useGlobalRipple";
import { SessionContext } from "@/presentation/hooks/session";
import { UseCasesContext } from "@/presentation/hooks/useUseCases";
import NotFound from "@/presentation/pages/NotFound";
import { HOME_BY_ROLE, paths } from "@/presentation/lib/paths";
import { currentSession, server, store, useCases } from "./container";
import { screens, type Screen } from "./routes";

/** Remonte en haut à chaque changement d'écran, ou va à l'ancre demandée (#deux-prix…). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

/** Relit les données à chaque action (comme Inertia recharge les props après un POST). */
function useStoreVersion() {
  return useSyncExternalStore(store.subscribe, store.getVersion);
}

/**
 * Un écran : vérifie l'accès (comme le middleware `auth` et `role` de Laravel), puis rend la page avec ses props.
 * Visiteur sur un écran réservé : renvoyé vers la connexion, qui le ramène ensuite ici.
 * Compte d'un autre rôle : renvoyé vers son propre espace.
 */
function ScreenHost({ screen }: { screen: Screen }) {
  useStoreVersion();
  const params = useParams();
  const [query] = useSearchParams();
  const { pathname, search } = useLocation();
  const user = server.viewer();
  // La connexion ne renvoie ailleurs que si l'on arrive déjà connecté (pas au moment où l'on se connecte).
  const [arrivedAs] = useState(user);

  if (screen.access === "guest") {
    if (arrivedAs) return <Navigate to={HOME_BY_ROLE[arrivedAs.role]} replace />;
  } else if (screen.access !== "public") {
    if (!user) return <Navigate to={`${paths.connexion}?retour=${encodeURIComponent(pathname + search)}`} replace />;
    if (user.role !== screen.access) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }
  // Une adresse = un écran neuf : l'état d'une page ne passe pas à la suivante.
  return <Fragment key={pathname + search}>{screen.render({ params, query, user })}</Fragment>;
}

export function App() {
  useGlobalRipple();
  useStoreVersion();
  return (
    <UseCasesContext value={useCases}>
      <SessionContext value={currentSession()}>
        <ToastProvider>
          <ScrollManager />
          <Suspense fallback={null}>
            <Routes>
              {screens.map((s) => (
                <Route key={s.path} path={s.path} element={<ScreenHost key={s.path} screen={s} />} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </SessionContext>
    </UseCasesContext>
  );
}
