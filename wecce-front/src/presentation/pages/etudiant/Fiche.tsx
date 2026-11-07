import { BuyBox } from "@/presentation/components/fiche/BuyBox";
import { ChecksPanel } from "@/presentation/components/fiche/ChecksPanel";
import { PickupInfo } from "@/presentation/components/fiche/PickupInfo";
import { Crumbs } from "@/presentation/components/layout/Crumbs";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { ConditionLabel } from "@/presentation/components/market/ConditionLabel";
import { ItemPhoto } from "@/presentation/components/market/ItemPhoto";
import type { ItemDetails } from "@/domain/entities";
import { CATEGORY_LABELS } from "@/presentation/lib/labels";
import { paths } from "@/presentation/lib/paths";

export type FicheProps = ItemDetails & {
  balance: number;
  /** Réservé par un autre étudiant. */
  reservedByOther: boolean;
  /** Réservé par l'étudiant connecté : on renvoie vers son bon de retrait. */
  reservedByMe?: boolean;
  nextFonte: string;
};

/** Fiche d'un objet : photo, achat (avant les vérifications sur téléphone), vérifications de la boutique. */
export default function Fiche({ item, title, details, examinedOn, checks, balance, reservedByOther, reservedByMe, nextFonte }: FicheProps) {
  const shortName = item.name.split(" · ")[0];
  return (
    <StudentLayout section="marche">
      <PageTitle>{shortName}</PageTitle>
      <div className="wrap">
        <Crumbs
          items={[
            { label: "Marché", href: paths.marche },
            { label: CATEGORY_LABELS[item.category].plural, href: `${paths.marche}?categorie=${item.category}` },
            { label: shortName },
          ]}
        />
        <div className="fiche-grid">
          <div className="gallery fiche-g">
            <ItemPhoto photo={item.photo} category={item.category} />
          </div>

          <div className="stack sticky fiche-b" style={{ gap: 20 }}>
            <div>
              <h1 style={{ fontSize: "var(--t-2xl)" }}>{title}</h1>
              <div className="row" style={{ marginTop: 10, gap: "8px 14px" }}>
                <span className="small">
                  <ConditionLabel condition={item.condition} />
                </span>
                <span className="small muted">{details}</span>
              </div>
            </div>
            <BuyBox
              price={item.price}
              balance={balance}
              reservedByOther={reservedByOther}
              reservedByMe={reservedByMe}
              takeHref={paths.take(item.slug)}
              nextFonte={nextFonte}
            />
            <PickupInfo />
          </div>

          <ChecksPanel className="fiche-c" checks={checks} examinedOn={examinedOn} />
        </div>
      </div>
    </StudentLayout>
  );
}
