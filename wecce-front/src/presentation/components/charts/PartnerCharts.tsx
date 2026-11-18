import { useState } from "react";
import { fmt } from "@/presentation/lib/format";

/*
 * Graphiques de l'espace LBC, en SVG simple.
 * Séries : --series-1 (cobalt) et --series-2 (orange), validées pour la vision des couleurs (palette dataviz).
 * Marques fines (colonnes ≤ 24 px, bout arrondi de 4 px, base carrée), grille d'un filet, légende + infobulle.
 */

export type ColumnSeries = { key: string; label: string; color: string };
export type ColumnDatum = { label: string; values: Record<string, number>; current?: boolean };

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Path d'une colonne : bout arrondi (4 px) en haut, base carrée sur la ligne de base. */
function columnPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

/** Colonnes groupées (par semaine), deux séries au plus, avec infobulle au survol et au clavier. */
export function GroupedColumns({ data, series, height = 220, ariaLabel }: { data: ColumnDatum[]; series: ColumnSeries[]; height?: number; ariaLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const pad = { top: 12, right: 8, bottom: 28, left: 30 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0))));
  const band = innerW / Math.max(1, data.length);
  const barW = Math.min(18, (band - 14) / series.length);
  const ticks = [0, max / 2, max];
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  return (
    <div className="viz">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t} className="axis">
            <line className="gridline" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const groupW = barW * series.length + 2 * (series.length - 1);
          const x0 = pad.left + i * band + (band - groupW) / 2;
          return (
            <g key={d.label}>
              {hover === i && <rect x={pad.left + i * band + 2} y={pad.top} width={band - 4} height={innerH} rx={8} fill="var(--surface-2)" />}
              {series.map((s, k) => {
                const v = d.values[s.key] ?? 0;
                const top = y(v);
                return <path key={s.key} d={columnPath(x0 + k * (barW + 2), top, barW, pad.top + innerH - top)} fill={s.color} />;
              })}
              <text className="tick" x={pad.left + i * band + band / 2} y={height - 8} textAnchor="middle" fontWeight={d.current ? 700 : 400}>
                {d.label}
              </text>
              <rect
                x={pad.left + i * band}
                y={pad.top}
                width={band}
                height={innerH + pad.bottom}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.label} : ${series.map((s) => `${s.label} ${d.values[s.key] ?? 0}`).join(", ")}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div className="viz-tip" style={{ left: `${((pad.left + hover * band + band / 2) / width) * 100}%`, top: `${(pad.top / height) * 100}%` }}>
          <strong>Semaine du {data[hover].label}</strong>
          {series.map((s) => (
            <div key={s.key}>
              <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 6 }} />
              {s.label} : {data[hover].values[s.key] ?? 0}
            </div>
          ))}
        </div>
      )}
      <div className="viz-legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Barres horizontales d'une seule série (valeur en ligne par catégorie) ; valeur au bout de la barre. */
export function HBars({ rows, unit = "pts" }: { rows: { label: string; value: number; sub?: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div role="list">
      {rows.map((r) => (
        <div key={r.label} className="hbar" role="listitem" title={`${r.label} : ${fmt(r.value)} ${unit}${r.sub ? ` · ${r.sub}` : ""}`}>
          <span>
            {r.label}
            {r.sub && <span className="xs muted"> · {r.sub}</span>}
          </span>
          <span className="hbar__track">
            <span className="hbar__fill" style={{ display: "block", width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="hbar__val">
            {fmt(r.value)} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Barre segmentée haute : un tout découpé en parts (libellé dans le bloc s'il tient), légende dessous. */
export function SegmentBar({ parts, ariaLabel }: { parts: { label: string; value: number; color: string; darkText?: boolean }[]; ariaLabel: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <div>
      <div className="seg-bar" role="img" aria-label={`${ariaLabel} : ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
        {parts
          .filter((p) => p.value > 0)
          .map((p) => {
            const share = total > 0 ? p.value / total : 0;
            return (
              <span key={p.label} className={p.darkText ? "is-dark-text" : undefined} style={{ width: `${share * 100}%`, background: p.color }} title={`${p.label} : ${p.value}`}>
                {share >= 0.12 ? p.value : ""}
              </span>
            );
          })}
      </div>
      <div className="viz-legend">
        {parts.map((p) => (
          <span key={p.label}>
            <i style={{ background: p.color }} />
            {p.label} · {p.value}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Jauge de couverture : valeur du stock / dette en points, avec les seuils de surveillance et de suspension. */
export function CoverageMeter({ ratio, watch, suspend }: { ratio: number | null; watch: number; suspend: number }) {
  const scale = Math.max(2, (ratio ?? 0) * 1.1, watch * 1.4);
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  const tone = ratio === null || ratio >= watch ? "var(--ok)" : ratio >= suspend ? "var(--brand)" : "var(--danger)";
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={scale} aria-valuenow={ratio ?? 0} aria-label="Taux de couverture">
        <span style={{ width: pct(ratio ?? scale), background: tone }} />
        <i style={{ left: pct(suspend) }} title={`Suspension sous ${Math.round(suspend * 100)} %`} />
        <i style={{ left: pct(watch) }} title={`Surveillance sous ${Math.round(watch * 100)} %`} />
      </div>
      <div className="row xs muted" style={{ justifyContent: "space-between" }}>
        <span>Suspension sous {Math.round(suspend * 100)} %</span>
        <span>Surveillance sous {Math.round(watch * 100)} %</span>
      </div>
    </div>
  );
}
