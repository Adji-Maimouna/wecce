import { useMemo, useState } from "react";
import type { MarketItem } from "@/domain/entities";
import type { CategoryFilter, SortOrder } from "./MarketToolbar";

/** Filtre, compte et trie les objets du marché. La recherche vient de la barre haute. */
export function useMarketFilters(
  items: MarketItem[],
  balance: number,
  query: string,
  initial: { category?: CategoryFilter; onlyBalance?: boolean } = {},
) {
  const [category, setCategory] = useState<CategoryFilter>(initial.category ?? "tout");
  const [onlyBalance, setOnlyBalance] = useState(initial.onlyBalance ?? false);
  const [sort, setSort] = useState<SortOrder>("recent");

  const q = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const c: Record<CategoryFilter, number> = { tout: items.length, tel: 0, ordi: 0, tab: 0, audio: 0, piece: 0 };
    items.forEach((i) => c[i.category]++);
    return c;
  }, [items]);

  const balanceCount = useMemo(() => items.filter((i) => !i.reserved && i.price <= balance).length, [items, balance]);

  const shown = useMemo(() => {
    const list = items.filter(
      (i) =>
        (category === "tout" || i.category === category) &&
        (!onlyBalance || i.price <= balance) &&
        (!q || `${i.name} ${i.keywords}`.toLowerCase().includes(q)),
    );
    return [...list].sort((a, b) => (sort === "prix-asc" ? a.price - b.price : sort === "prix-desc" ? b.price - a.price : a.order - b.order));
  }, [items, category, onlyBalance, balance, q, sort]);

  function reset() {
    setCategory("tout");
    setOnlyBalance(false);
  }

  return { category, setCategory, onlyBalance, setOnlyBalance, sort, setSort, counts, balanceCount, shown, reset };
}
