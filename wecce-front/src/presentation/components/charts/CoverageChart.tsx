import { Fragment } from "react";
import type { CoveragePoint } from "@/domain/entities";
import { fmt, pts } from "@/presentation/lib/format";
import { ChartTooltip } from "./ChartTooltip";

type CoverageChartProps = {
  points: CoveragePoint[];
  /** Seuil de suspension : la dette multipliée par ce facteur (1,1 = dette + 10 %). */
  suspendFactor: number;
};

// Repère du dessin (viewBox 720 × 250), identique à la maquette. L'échelle suit les données.
const X0 = 64;
const WIDTH = 572.4;
const Y0 = 210;
const Y_TOP = 51.7;

const millions = (v: number) => `${(v / 1_000_000).toFixed(2).replace(".", ",")} M`;
const tickLabel = (v: number) => (v === 0 ? "0" : `${(v / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M`);

/** Trois paliers ronds au-dessus de la plus haute valeur (0,25 M, 0,5 M, 1 M…). */
function scale(top: number): number[] {
  const step = [125_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000].find((s) => s * 3 >= top) ?? 10_000_000;
  return [3, 2, 1, 0].map((i) => i * step);
}

/** Valeur du stock (cobalt), points en circulation (moutarde) et seuil de suspension (pointillés rouges). */
export function CoverageChart({ points, suspendFactor }: CoverageChartProps) {
  const last = points[points.length - 1];
  const ticks = scale(Math.max(...points.map((p) => Math.max(p.stock, p.debt * suspendFactor))));
  const max = ticks[0] || 1;
  const perDay = WIDTH / Math.max(last.day, 1);
  const x = (day: number) => +(X0 + day * perDay).toFixed(1);
  const y = (v: number) => +(Y0 - (v / max) * (Y0 - Y_TOP)).toFixed(1);
  const TICKS = ticks.map((v) => ({ v, label: tickLabel(v) }));
  const line = (f: (p: CoveragePoint) => number) => points.map((p) => `${x(p.day)},${y(f(p))}`).join(" ");
  const labelled = points.filter((p, i) => i === points.length - 1 || (p.day % 14 === 0 && last.day - p.day >= 7));
  const suspendPct = Math.round(suspendFactor * 100);
  const ratioOf = (p: CoveragePoint) => (p.debt > 0 ? `${Math.round((p.stock / p.debt) * 100)} %` : "–");

  return (
    <ChartTooltip>
      <svg className="chart" viewBox="0 0 720 250" role="img" aria-labelledby="cv-t" style={{ width: "100%", height: "auto" }}>
        <title id="cv-t">
          {`Valeur du stock, points des étudiants et minimum requis. Les points passent de ${fmt(points[0].debt)} à ${fmt(last.debt)} ; le stock passe de ${fmt(points[0].stock)} à ${fmt(last.stock)} points.`}
        </title>
        {TICKS.map((t) => (
          <Fragment key={t.v}>
            <line className={t.v === 0 ? "axis" : "grid-line"} x1="64" x2="700" y1={y(t.v)} y2={y(t.v)} />
            <text x="56" y={y(t.v) + 3.5} textAnchor="end">
              {t.label}
            </text>
          </Fragment>
        ))}
        {labelled.map((p, i) => (
          <text key={p.label} x={x(p.day)} y={i === labelled.length - 1 ? 248 : 232} textAnchor="middle">
            {p.label}
          </text>
        ))}
        <polyline className="ln-ink" fill="none" strokeWidth="2.5" strokeLinejoin="round" points={line((p) => p.stock)} />
        <polyline className="ln-danger" fill="none" strokeWidth="1.5" strokeDasharray="5 4" points={line((p) => p.debt * suspendFactor)} />
        <polyline className="ln-points" fill="none" strokeWidth="3.5" strokeLinejoin="round" points={line((p) => p.debt)} />
        {[
          { cls: "dot-ink", cx: x(last.day), cy: y(last.stock), r: 5.5, tip: `${last.label} · valeur du stock : ${pts(last.stock)} (${ratioOf(last)})` },
          { cls: "dot-points", cx: x(last.day), cy: y(last.debt), r: 6, tip: `${last.label} · points étudiants : ${pts(last.debt)} (${ratioOf(last)})` },
          ...points
            .filter((p) => p.event)
            .map((p) => ({ cls: "dot-points", cx: x(p.day), cy: y(p.debt), r: 5, tip: `${p.label} · ${p.event} : points ${pts(p.debt)}, stock ${pts(p.stock)} (${ratioOf(last)})` })),
        ].map((d) => (
          <circle key={d.tip} className={`${d.cls} hit`} cx={d.cx} cy={d.cy} r={d.r} strokeWidth="2" data-tip={d.tip} tabIndex={0} aria-label={d.tip} />
        ))}
        <text className="tx-ink" x={x(last.day) - 8} y={y(last.stock) - 10} textAnchor="end">
          {millions(last.stock)}
        </text>
        <text className="tx-points" x={x(last.day) - 8} y={y(last.debt) + 18} textAnchor="end">
          {millions(last.debt)}
        </text>
      </svg>
      <div className="legend" style={{ marginTop: 12 }}>
        <span>
          <i style={{ background: "var(--cobalt)" }} />
          Valeur du stock
        </span>
        <span>
          <i style={{ background: "var(--points-fill)" }} />
          Points des étudiants
        </span>
        <span>
          <i style={{ background: "repeating-linear-gradient(90deg,var(--danger) 0 4px,transparent 4px 7px)" }} />
          Minimum requis ({suspendPct} %)
        </span>
      </div>
    </ChartTooltip>
  );
}
