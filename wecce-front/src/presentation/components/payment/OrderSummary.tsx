import { ItemPhoto } from "@/presentation/components/market/ItemPhoto";
import { Jauge } from "@/presentation/components/points/Jauge";
import { CONDITION_LABELS } from "@/presentation/lib/labels";
import { fmt, francs, pts } from "@/presentation/lib/format";
import type { MarketItem } from "@/domain/entities";

type OrderSummaryProps = {
  item: MarketItem;
  title: string;
  /** Points utilisés (ou débités) pour cet objet. */
  covered: number;
  /** Complément en francs. */
  complement: number;
  /** Solde après l'échange. */
  balanceAfter: number;
};

/** Récapitulatif à droite : l'objet, la jauge, ce que paient les points et les francs. */
export function OrderSummary({ item, title, covered, complement, balanceAfter }: OrderSummaryProps) {
  const sub = [CONDITION_LABELS[item.condition], item.battery !== undefined ? `batterie ${item.battery} %` : null].filter(Boolean).join(" · ");
  return (
    <aside className="panel sticky" aria-label="Récapitulatif">
      <div className="panel__body stack" style={{ gap: 16 }}>
        <div className="row" style={{ gap: 14, flexWrap: "nowrap", alignItems: "flex-start" }}>
          <ItemPhoto photo={item.photo} category={item.category} small className="thumb thumb--lg" />
          <div>
            <div style={{ fontWeight: 500 }}>{title}</div>
            <div className="small muted">{sub}</div>
          </div>
        </div>
        <Jauge price={item.price} balance={covered} large />
        <dl className="dl small">
          <dt>Prix de l'objet</dt>
          <dd>{fmt(item.price)}</dd>
          <dt>Vos points</dt>
          <dd className="pts">− {pts(covered)}</dd>
          <span className="sep" />
          <dt className="total">À payer en francs</dt>
          <dd className="total fcfa">{francs(complement)}</dd>
        </dl>
        <p className="xs muted">1 point vaut 1 franc. Après l'échange, votre solde sera de {balanceAfter === 0 ? "0 point" : pts(balanceAfter)}.</p>
      </div>
    </aside>
  );
}
