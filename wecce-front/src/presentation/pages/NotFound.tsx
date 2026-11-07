import { GateLayout } from "@/presentation/components/gate/GateLayout";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { ButtonLink } from "@/presentation/components/ui/Button";

/** Adresse inconnue. */
export default function NotFound() {
  return (
    <GateLayout variant="auth" photos={[{ src: "/img/hdd.jpg", width: 360, height: 640, rotate: -4 }]}>
      <PageTitle>Page introuvable</PageTitle>
      <span className="gate__mark gate__mark--sm" role="img" aria-label="Wecce">
        wecce<span />
      </span>
      <h1>Cette page n'existe pas</h1>
      <p className="muted">L'adresse a peut-être changé. Repartez de l'accueil ou du marché.</p>
      <div className="row">
        <ButtonLink href="/accueil" size="lg">
          Aller à l'accueil
        </ButtonLink>
        <ButtonLink href="/etudiant/marche" variant="ghost" size="lg">
          Voir le marché
        </ButtonLink>
      </div>
    </GateLayout>
  );
}
