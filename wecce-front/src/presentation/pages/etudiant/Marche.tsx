import { useSearchParams } from "react-router";
import type { MarketItem } from "@/domain/entities";
import { useSearch } from "@/presentation/components/layout/searchContext";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StudentLayout } from "@/presentation/components/layout/StudentLayout";
import { MarketEmpty } from "@/presentation/components/market/MarketEmpty";
import { MarketToolbar, type CategoryFilter } from "@/presentation/components/market/MarketToolbar";
import { ProductCard } from "@/presentation/components/market/ProductCard";
import { useMarketFilters } from "@/presentation/components/market/useMarketFilters";
import { Icon } from "@/presentation/components/ui/Icon";
import { Notice } from "@/presentation/components/ui/Notice";
import { useStudent } from "@/presentation/hooks/session";
import { paths } from "@/presentation/lib/paths";

export type MarcheProps = {
  items: MarketItem[];
  /** Les dépôts sont suspendus (couverture trop basse ou décision de l'administration). */
  depositsSuspended?: boolean;
  /** Mois de la prochaine baisse mensuelle (« décembre »). */
  nextFonte: string;
};

const CATEGORIES: CategoryFilter[] = ["tout", "tel", "ordi", "tab", "audio", "piece"];

/** Marché : les objets examinés par LBC, filtrés, triés, avec la jauge du solde. Filtres possibles dans l'adresse : ?categorie=tel&solde=1&q=. */
export default function Marche(props: MarcheProps) {
  return (
    <StudentLayout section="marche" flush>
      <PageTitle>Marché</PageTitle>
      <MarcheContent {...props} />
    </StudentLayout>
  );
}

function MarcheContent({ items, depositsSuspended, nextFonte }: MarcheProps) {
  const student = useStudent();
  const { query, setQuery } = useSearch();
  const [params] = useSearchParams();
  const cat = params.get("categorie") as CategoryFilter | null;
  const f = useMarketFilters(items, student.balance, query, {
    category: cat && CATEGORIES.includes(cat) ? cat : "tout",
    onlyBalance: params.get("solde") === "1",
  });

  return (
    <>
      <div className="band">
        <div className="wrap">
          {depositsSuspended && (
            <Notice tone="warn" icon="pause" title="Les dépôts sont suspendus." style={{ marginBottom: 24 }}>
              Vous pouvez toujours prendre des objets avec vos points.
            </Notice>
          )}
          <PageHead title="Marché" lead="Des appareils examinés par LBC, à retirer à la boutique entre les villages E et F.">
            <p className="fonte-note">
              <Icon name="down" />
              <span>
                Le 1<sup>er</sup> {nextFonte}, les prix et votre solde baissent de 5&nbsp;%.
              </span>
            </p>
          </PageHead>
        </div>
      </div>
      <div className="wrap">
        <MarketToolbar
          category={f.category}
          onCategory={f.setCategory}
          counts={f.counts}
          onlyBalance={f.onlyBalance}
          onOnlyBalance={f.setOnlyBalance}
          balanceCount={f.balanceCount}
          sort={f.sort}
          onSort={f.setSort}
          shown={f.shown.length}
        />
        {f.shown.length > 0 ? (
          <div className="grid" data-stagger>
            {f.shown.map((item, i) => (
              <ProductCard key={item.slug} item={item} balance={student.balance} href={paths.item(item.slug)} index={i} />
            ))}
          </div>
        ) : (
          <MarketEmpty
            onReset={() => {
              f.reset();
              setQuery("");
            }}
          />
        )}
      </div>
    </>
  );
}
