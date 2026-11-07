import type { RecentTakeBack } from "@/domain/entities";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { paths } from "@/presentation/lib/paths";
import { Drawer } from "./Drawer";

type HeroProps = { recentTakeBacks: RecentTakeBack[]; takenBackCount: number };

/** Ouverture de l'accueil sur le bandeau moutarde : titre, promesse, deux actions, faits, tiroir. */
export function Hero({ recentTakeBacks, takenBackCount }: HeroProps) {
  return (
    <section className="hero">
      <div className="wrap hero__in">
        <div className="hero__top">
          <h1>Votre vieux téléphone vaut des points.</h1>
          <div className="hero__side">
            <p className="hero__lead">
              Déposez chez LBC l'électronique qui ne vous sert plus. Vous recevez des points à la signature et vous les dépensez sur le
              marché Wecce.
            </p>
            <div className="hero__actions">
              <ButtonLink href={paths.deposer} size="lg">
                Déposer un objet
              </ButtonLink>
              <ButtonLink href={paths.marche} variant="ghost" size="lg">
                Voir le marché
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="hero__facts">
          <span>
            <Icon name="store" />
            LBC, entre les villages E et F
          </span>
          <span>
            <Icon name="points" />1 point = 1 franc
          </span>
        </div>
        <Drawer items={recentTakeBacks} count={takenBackCount} />
      </div>
    </section>
  );
}
