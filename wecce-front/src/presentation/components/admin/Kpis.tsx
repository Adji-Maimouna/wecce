import type { CSSProperties, ReactNode } from "react";
import { stagger } from "@/presentation/lib/motion";

export type KpiItem = { label: string; value: ReactNode; sub?: ReactNode; valueStyle?: CSSProperties };

/** Bande de chiffres clés (quatre colonnes, deux sur téléphone). */
export function Kpis({ items, style }: { items: KpiItem[]; style?: CSSProperties }) {
  return (
    <section className="panel kpis" data-stagger style={style}>
      {items.map((k, i) => (
        <div key={k.label} className="kpi" style={stagger(i)}>
          <div className="kpi__label">{k.label}</div>
          <div className="kpi__value" style={k.valueStyle}>
            {k.value}
          </div>
          {k.sub && <div className="kpi__sub">{k.sub}</div>}
        </div>
      ))}
    </section>
  );
}
