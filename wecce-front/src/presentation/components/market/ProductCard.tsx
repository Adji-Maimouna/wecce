import { Badge } from "@/presentation/components/ui/Badge";
import { AppLink } from "@/presentation/components/ui/AppLink";
import { Jauge } from "@/presentation/components/points/Jauge";
import { PriceSplit } from "@/presentation/components/points/PriceSplit";
import { pts } from "@/presentation/lib/format";
import { stagger } from "@/presentation/lib/motion";
import type { MarketItem } from "@/domain/entities";
import { BatteryLabel, ConditionLabel } from "./ConditionLabel";
import { ItemPhoto } from "./ItemPhoto";
import { ProductName } from "./ProductName";

type ProductCardProps = {
  item: MarketItem;
  balance: number;
  href: string;
  /** Rang dans la grille (cascade d'apparition et remplissage de la jauge). */
  index: number;
  /** Masque la batterie et le détail (cartes de l'accueil). */
  compact?: boolean;
  okLabel?: string;
};

/** Fiche produit du marché : photo, état, prix en points, jauge points et francs. */
export function ProductCard({ item, balance, href, index, compact, okLabel }: ProductCardProps) {
  return (
    <AppLink className="card" href={href} style={stagger(index)}>
      <div className="card__photo">
        <ItemPhoto photo={item.photo} category={item.category} lazy />
        {item.mine && !compact && (
          <Badge tone="ink" className="card__flag">
            Votre dépôt
          </Badge>
        )}
        {item.reserved && !compact && (
          <Badge tone="line" className="card__flag" style={{ background: "var(--surface)" }}>
            Réservé
          </Badge>
        )}
      </div>
      <div className="card__body">
        <div className="card__name">
          <ProductName name={item.name} />
        </div>
        <div className="card__meta">
          <ConditionLabel condition={item.condition} />
          {!compact && item.battery !== undefined && <BatteryLabel value={item.battery} />}
          {!compact && item.detail && <span>{item.detail}</span>}
        </div>
        <div className="card__price">
          <span className="pts" style={item.reserved ? { color: "var(--muted)" } : undefined}>
            {pts(item.price)}
          </span>
        </div>
        {item.reserved ? (
          <div className="split">
            <span>En attente de retrait</span>
          </div>
        ) : (
          <>
            <Jauge price={item.price} balance={balance} />
            <PriceSplit price={item.price} balance={balance} okLabel={okLabel} />
          </>
        )}
      </div>
    </AppLink>
  );
}
