import type { MarketItem } from "@/domain/entities";
import { ProductCard } from "@/presentation/components/market/ProductCard";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { Icon } from "@/presentation/components/ui/Icon";
import { Reveal } from "@/presentation/components/ui/Reveal";
import { fmt } from "@/presentation/lib/format";
import { paths } from "@/presentation/lib/paths";
import { HomeSection } from "./HomeSection";

type MarketPreviewProps = { items: MarketItem[]; balance: number; total: number };

/** Quatre objets du marché, avec la jauge calculée pour un solde d'exemple. */
export function MarketPreview({ items, balance, total }: MarketPreviewProps) {
  return (
    <HomeSection tone="tint" title="En ce moment sur le marché" lead={`Jauges calculées pour un solde de ${fmt(balance)} points.`}>
      <div className="grid" data-stagger>
        {items.map((item, i) => (
          <ProductCard key={item.slug} item={item} balance={balance} href={paths.item(item.slug)} index={i} compact okLabel="Dans ce solde" />
        ))}
      </div>
      <Reveal style={{ marginTop: 40 }}>
        <ButtonLink href={paths.marche} size="lg">
          Voir les {total} objets
          <Icon name="arrow-right" size="sm" />
        </ButtonLink>
      </Reveal>
    </HomeSection>
  );
}
