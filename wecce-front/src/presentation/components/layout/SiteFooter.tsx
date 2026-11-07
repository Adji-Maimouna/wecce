import { AppLink } from "@/presentation/components/ui/AppLink";
import { Icon } from "@/presentation/components/ui/Icon";
import { useSessionRole } from "@/presentation/hooks/session";
import { useSignOut } from "@/presentation/hooks/useSignOut";
import { HOME_BY_ROLE, paths } from "@/presentation/lib/paths";
import { Brand } from "./Brand";

const CAMPUS_MAP = "https://www.openstreetmap.org/search?query=Universit%C3%A9%20Gaston%20Berger%20Saint-Louis";

type SiteFooterProps = {
  /** « etudiant » : l'aide renvoie vers la page Questions fréquentes, et le compte vers le profil. */
  space: "public" | "etudiant";
};

/**
 * Pied de page : de l'aide, la boutique LBC (lieu et jours de rendez-vous), le compte.
 * Il ne répète pas la navigation du haut.
 */
export function SiteFooter({ space }: SiteFooterProps) {
  const student = space === "etudiant";
  const help = student
    ? [
        { href: paths.faq, label: "Questions fréquentes" },
        { href: `${paths.faq}#deux-prix`, label: "Les deux prix" },
        { href: `${paths.faq}#baisse`, label: "La baisse mensuelle" },
        { href: `${paths.faq}#retrait`, label: "Retrait et garantie" },
      ]
    : [
        { href: `${paths.accueil}#comment`, label: "Comment ça marche" },
        { href: `${paths.accueil}#deux-prix`, label: "Les deux prix" },
        { href: `${paths.accueil}#baisse`, label: "La baisse mensuelle" },
        { href: `${paths.accueil}#questions`, label: "Questions fréquentes" },
      ];

  return (
    <footer className="site-foot">
      <div className="wrap site-foot__in">
        <div className="site-foot__brand">
          <Brand href={student ? paths.marche : paths.accueil} label={student ? "Wecce, marché" : "Wecce, accueil"} />
          <p>L'échange d'électronique par points, entre étudiants de l'UGB.</p>
        </div>
        <nav className="site-foot__col" aria-label="Aide">
          <h2>Aide</h2>
          {help.map((l) => (
            <AppLink key={l.href} href={l.href}>
              {l.label}
            </AppLink>
          ))}
        </nav>
        <div className="site-foot__col">
          <h2>La boutique LBC</h2>
          <p>
            <strong>Leye Business Company</strong>
            <br />
            Campus de l'UGB, entre les villages E&nbsp;et&nbsp;F
          </p>
          <p>Rendez-vous du lundi au samedi, de 9&nbsp;h&nbsp;30 à 16&nbsp;h&nbsp;30</p>
          <a className="site-foot__pin" href={CAMPUS_MAP} target="_blank" rel="noreferrer">
            <Icon name="store" />
            Voir le campus sur la carte
          </a>
        </div>
        {student ? <StudentAccount /> : <GuestAccount />}
      </div>
      <div className="wrap">
        <div className="site-foot__legal">
          <span>© 2026 Wecce, avec LBC</span>
          <AppLink href={paths.credits}>Crédits photos</AppLink>
        </div>
      </div>
    </footer>
  );
}

function StudentAccount() {
  const signOut = useSignOut();
  return (
    <nav className="site-foot__col" aria-label="Mon compte">
      <h2>Mon compte</h2>
      <AppLink href={paths.profilEtudiant}>Mon profil</AppLink>
      <AppLink href={`${paths.solde}#historique`}>Historique des points</AppLink>
      <button type="button" className="site-foot__link" onClick={signOut}>
        Se déconnecter
      </button>
    </nav>
  );
}

/** Accueil public : se connecter ou s'inscrire ; déjà connecté, revenir à son espace. */
function GuestAccount() {
  const role = useSessionRole();
  const signOut = useSignOut();
  return (
    <nav className="site-foot__col" aria-label="Compte">
      <h2>Compte</h2>
      {role ? (
        <>
          <AppLink href={HOME_BY_ROLE[role]}>Aller à mon espace</AppLink>
          <button type="button" className="site-foot__link" onClick={signOut}>
            Se déconnecter
          </button>
        </>
      ) : (
        <>
          <AppLink href={paths.connexion}>Se connecter</AppLink>
          <AppLink href={paths.inscription}>Créer un compte étudiant</AppLink>
        </>
      )}
    </nav>
  );
}
