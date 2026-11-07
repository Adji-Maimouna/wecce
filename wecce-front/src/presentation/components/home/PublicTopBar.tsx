import { AppLink } from "@/presentation/components/ui/AppLink";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Brand } from "@/presentation/components/layout/Brand";
import { useSessionRole } from "@/presentation/hooks/session";
import { HOME_BY_ROLE, paths } from "@/presentation/lib/paths";

/** Barre haute de l'accueil public. Connecté, on propose de revenir à son espace. */
export function PublicTopBar() {
  const role = useSessionRole();
  return (
    <header className="top">
      <div className="wrap top__in">
        <Brand />
        <nav className="nav" aria-label="Navigation principale">
          <AppLink href={paths.marche}>Marché</AppLink>
          <a href="#comment">Comment ça marche</a>
          <a href="#lbc">La boutique LBC</a>
          <a href="#questions">Questions</a>
        </nav>
        <div className="top__cta">
          {role ? (
            <ButtonLink href={HOME_BY_ROLE[role]}>Aller à mon espace</ButtonLink>
          ) : (
            <>
              <ButtonLink href={paths.connexion} variant="ghost">
                Se connecter
              </ButtonLink>
              <ButtonLink href={paths.deposer}>Déposer un objet</ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
