import { displayName } from "@/domain/entities";
import { Door, type DoorProps } from "@/presentation/components/gate/Door";
import { GateLayout } from "@/presentation/components/gate/GateLayout";
import type { PilePhoto } from "@/presentation/components/gate/PhotoPile";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { Icon } from "@/presentation/components/ui/Icon";
import { useSession, useSessionRole } from "@/presentation/hooks/session";
import { stagger } from "@/presentation/lib/motion";
import { HOME_BY_ROLE, paths } from "@/presentation/lib/paths";

const PHOTOS: PilePhoto[] = [
  { src: "/img/redmi.jpg", width: 480, height: 640, rotate: -6 },
  { src: "/img/iphone11.jpg", width: 500, height: 615, rotate: 5 },
  { src: "/img/galaxya12.jpg", width: 720, height: 960, rotate: -2 },
];

const SPACE_NAME = { ETUDIANT: "Mon espace étudiant", AGENT: "Espace LBC", ADMIN: "Administration" } as const;

/** Page d'entrée générale : se connecter, créer un compte, ou continuer sans compte. Connecté : revenir à son espace. */
export default function Entree() {
  const role = useSessionRole();
  const session = useSession();
  const who = session.student ?? session.agent ?? session.admin;
  const doors: DoorProps[] = role
    ? [
        { href: HOME_BY_ROLE[role], icon: "log-in", title: SPACE_NAME[role], description: who ? `Connecté : ${displayName(who)}` : "", tone: "primary" },
        { href: paths.accueil, icon: "compass", title: "Voir l'accueil", description: "Le marché, les deux prix, la boutique LBC", tone: "quiet" },
      ]
    : [
        { href: paths.connexion, icon: "log-in", title: "Se connecter", description: "Étudiants, équipe LBC et administration", tone: "primary" },
        { href: paths.inscription, icon: "user-plus", title: "Créer un compte", description: "Réservé aux étudiants de l'UGB" },
        { href: paths.accueil, icon: "compass", title: "Continuer sans compte", description: "Voir le marché et les prix", tone: "quiet" },
      ];

  return (
    <GateLayout photos={PHOTOS}>
      <PageTitle>Entrer</PageTitle>
      <span className="gate__mark" role="img" aria-label="Wecce">
        wecce<span />
      </span>
      <h1>Échangez votre électronique contre des points, sur le campus de l'UGB.</h1>

      <nav className="doors" aria-label="Entrer sur Wecce" data-stagger>
        {doors.map((d, i) => (
          <div key={d.href} style={stagger(i)}>
            <Door {...d} />
          </div>
        ))}
      </nav>

      <p className="gate__foot">
        <Icon name="store" size="sm" />
        Dépôts et retraits chez LBC, entre les villages E et F
      </p>
    </GateLayout>
  );
}
