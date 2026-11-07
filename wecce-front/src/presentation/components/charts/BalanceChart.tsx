import { Fragment } from "react";
import { fmt, pts } from "@/presentation/lib/format";
import type { BalancePoint } from "@/domain/entities";
import { ChartTooltip } from "./ChartTooltip";

type BalanceChartProps = {
  points: BalancePoint[];
  itemName: string;
  /** Graduations de l'axe vertical (la plus haute et la plus basse fixent l'échelle). */
  ticks?: number[];
};

// Repère du dessin (viewBox 640 × 236), identique à la maquette.
const X0 = 80;
const X1 = 590;
const Y_TOP = 45.7;
const Y_BOTTOM = 174.3;

/** Solde (moutarde) et prix de l'objet déposé (cobalt) baissent au même rythme ; le futur est en pointillés. */
export function BalanceChart({ points, itemName, ticks = [40000, 35000, 30000] }: BalanceChartProps) {
  const lastDay = points[points.length - 1]?.day || 1;
  const max = Math.max(...ticks);
  const min = Math.min(...ticks);
  const x = (day: number) => +(X0 + (day / lastDay) * (X1 - X0)).toFixed(1);
  const y = (v: number) => +(Y_TOP + ((max - v) / (max - min)) * (Y_BOTTOM - Y_TOP)).toFixed(1);

  const past = points.filter((p) => !p.projected);
  const lastPast = past[past.length - 1];
  const future = points.filter((p) => p.projected);
  const line = (list: BalancePoint[], key: "balance" | "price") => list.map((p) => `${x(p.day)},${y(p[key])}`).join(" ");
  const datePart = (p: BalancePoint) => `${p.label}${p.projected ? " (prévu)" : ""}`;

  return (
    <ChartTooltip>
      <svg className="chart chart--wide" viewBox="0 0 640 236" role="img" aria-labelledby="chart-t" style={{ width: "100%", height: "auto", maxHeight: 300 }}>
        <title id="chart-t">Votre solde et le prix du {itemName} baissent au même rythme.</title>
        {ticks.map((t) => (
          <Fragment key={t}>
            <line className="grid-line" x1="56" x2="610" y1={y(t)} y2={y(t)} />
            <text x="48" y={y(t) + 3.5} textAnchor="end">
              {fmt(t)}
            </text>
          </Fragment>
        ))}
        <line className="axis" x1="56" x2="610" y1="200" y2="200" />
        {points.map((p) => (
          <text key={p.label} x={x(p.day)} y="222" textAnchor="middle">
            {p.label}
          </text>
        ))}
        <polyline className="ln-ref" points={line(past, "price")} fill="none" strokeWidth="2.5" strokeLinejoin="round" />
        {future.length > 0 && <polyline className="ln-ref" points={line([lastPast, ...future], "price")} fill="none" strokeWidth="2.5" strokeDasharray="5 5" />}
        <polyline className="ln-points" points={line(past, "balance")} fill="none" strokeWidth="3.5" strokeLinejoin="round" />
        {future.length > 0 && <polyline className="ln-points" points={line([lastPast, ...future], "balance")} fill="none" strokeWidth="3.5" strokeDasharray="5 5" />}
        <g className="hits">
          {points.map((p, i) => {
            const t = `${datePart(p)} · ${itemName} ${i === 0 ? "mis en vente à" : "à"} ${pts(p.price)}`;
            return <circle key={`r${p.label}`} className="dot-ref hit" cx={x(p.day)} cy={y(p.price)} r="6" strokeWidth="2" data-tip={t} tabIndex={0} aria-label={t} />;
          })}
          {points.map((p, i) => {
            const t = `${datePart(p)} · votre solde : ${pts(p.balance)}${i === 0 ? " (dépôt + bonus)" : ""}`;
            return <circle key={`b${p.label}`} className="dot-points hit" cx={x(p.day)} cy={y(p.balance)} r="7" strokeWidth="2" data-tip={t} tabIndex={0} aria-label={t} />;
          })}
        </g>
      </svg>
      <div className="legend" style={{ marginTop: 14 }}>
        <span>
          <i style={{ background: "var(--points-fill)" }} />
          Votre solde
        </span>
        <span>
          <i style={{ background: "var(--cobalt)" }} />
          Prix du {itemName} que vous avez déposé
        </span>
        <span>
          <i style={{ background: "repeating-linear-gradient(90deg,var(--muted) 0 4px,transparent 4px 7px)" }} />
          Prévu
        </span>
      </div>
    </ChartTooltip>
  );
}
