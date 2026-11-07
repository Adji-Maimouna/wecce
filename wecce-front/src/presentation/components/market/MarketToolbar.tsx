import { Chip, ChipGroup, type ChipOption } from "@/presentation/components/ui/Chip";
import { plural } from "@/presentation/lib/format";
import type { Category } from "@/domain/entities";

export type CategoryFilter = "tout" | Category;
export type SortOrder = "recent" | "prix-asc" | "prix-desc";

type MarketToolbarProps = {
  category: CategoryFilter;
  onCategory: (c: CategoryFilter) => void;
  counts: Record<CategoryFilter, number>;
  onlyBalance: boolean;
  onOnlyBalance: (v: boolean) => void;
  balanceCount: number;
  sort: SortOrder;
  onSort: (s: SortOrder) => void;
  shown: number;
};

/** Filtres du marché : catégories, « Dans mon solde », nombre de résultats et tri. */
export function MarketToolbar(p: MarketToolbarProps) {
  const options: ChipOption<CategoryFilter>[] = [
    { value: "tout", label: "Tout", count: p.counts.tout },
    { value: "tel", label: "Téléphones", icon: "phone", count: p.counts.tel },
    { value: "ordi", label: "Ordinateurs", icon: "laptop", count: p.counts.ordi },
    { value: "tab", label: "Tablettes", icon: "tablet", count: p.counts.tab },
    { value: "audio", label: "Audio", icon: "audio", count: p.counts.audio },
    { value: "piece", label: "Pièces", icon: "piece", count: p.counts.piece },
  ];
  return (
    <>
      <div className="filters">
        <ChipGroup label="Catégories" scroll value={p.category} onChange={p.onCategory} options={options} />
        <Chip tone="points" icon="points" pressed={p.onlyBalance} onClick={() => p.onOnlyBalance(!p.onlyBalance)} count={p.balanceCount}>
          Dans mon solde
        </Chip>
      </div>
      <div className="results">
        <span aria-live="polite">{plural(p.shown, "objet", "objets")}</span>
        <label className="results__sort">
          Trier par
          <select className="select select--sm" value={p.sort} onChange={(e) => p.onSort(e.target.value as SortOrder)}>
            <option value="recent">Plus récents</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
          </select>
        </label>
      </div>
    </>
  );
}
