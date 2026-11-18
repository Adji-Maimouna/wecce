import type { CoverageActivityStats, CoveragePoint, CoverageSnapshot, CoverageStockBreakdown, MarginRow } from "@/domain/entities";
import { coverageLevel } from "@/domain/rules/coverage";
import { Kpis } from "@/presentation/components/admin/Kpis";
import { CoverageChart } from "@/presentation/components/charts/CoverageChart";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { Badge } from "@/presentation/components/ui/Badge";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { Notice } from "@/presentation/components/ui/Notice";
import { Panel, PanelBody, PanelHead } from "@/presentation/components/ui/Panel";
import { fmt, pts } from "@/presentation/lib/format";

export type CouvertureProps = {
  coverage: CoverageSnapshot;
  history: CoveragePoint[];
  margins: MarginRow[];
  stockBreakdown?: CoverageStockBreakdown;
  activityStats?: CoverageActivityStats;
};

const pct = (r: number) => `${Math.round(r * 100)} %`;
const pct1 = (r: number) => `${(r * 100).toFixed(1).replace(".", ",")} %`;

function trendSentence(history: CoveragePoint[]): string {
  if (history.length < 2) return "Une mesure par semaine apparaîtra ici.";
  const first = history[0];
  const last = history[history.length - 1];
  const debtGrowth = last.debt - first.debt;
  const stockGrowth = last.stock - first.stock;
  return debtGrowth > stockGrowth
    ? `Depuis le ${first.label}, les points étudiants ont progressé plus vite que votre stock.`
    : `Depuis le ${first.label}, votre stock a progressé au moins aussi vite que les points étudiants.`;
}

/** Dette et couverture : vue simple de la couverture du stock face aux points détenus par les étudiants. */
export default function Couverture({ coverage: c, history, margins, stockBreakdown }: CouvertureProps) {
  const level = coverageLevel(c);
  const t = c.thresholds;
  const excess = c.stockValue - c.pointsInCirculation;
  const suspendFloor = Math.round(c.pointsInCirculation * t.suspend);
  const bufferBeforeBlock = c.stockValue - suspendFloor;

  const totalExpertises = margins.reduce((s, m) => s + m.expertises, 0);
  const totalMarginPoints = margins.reduce((s, m) => s + (m.totalMarginPoints ?? 0), 0);
  const avgOverallMargin =
    totalExpertises > 0 ? margins.reduce((s, m) => s + m.margin * m.expertises, 0) / totalExpertises : 0;

  return (
    <BackOfficeLayout space="partenaire" current="couverture">
      <PageTitle>Dette et couverture</PageTitle>
      <PageHead
        title="Dette et couverture"
        lead="Votre stock en boutique doit couvrir les points détenus par les étudiants (1 pt = 1 FCFA)."
        aside={<span className="small muted">{c.computedAt}</span>}
      />

      {level === "surveillance" && (
        <Notice tone="warn" title={`Attention : couverture à ${pct(c.ratio)}.`} style={{ marginBottom: 18 }}>
          <p className="small">
            Ajoutez des articles de la boutique ou réduisez les reprises. Sous <strong>{pct(t.suspend)}</strong>, les nouveaux dépôts se bloquent.
          </p>
        </Notice>
      )}
      {level === "suspendu" && (
        <Notice tone="danger" icon="pause" title={`Dépôts bloqués : couverture à ${pct(c.ratio)}.`} style={{ marginBottom: 18 }}>
          {`Les achats des étudiants font baisser leurs points. Réouverture automatique à ${pct(t.reopen)}.`}
        </Notice>
      )}

      <Kpis
        style={{ marginBottom: 16 }}
        items={[
          {
            label: "Taux de couverture",
            value: level === "ouvert" ? <CountUp value={Math.round(c.ratio * 100)} suffix=" %" /> : pct(c.ratio),
            sub: (
              <span className="row" style={{ gap: 6 }}>
                {level === "ouvert" ? (
                  <Badge tone="ok">Normal</Badge>
                ) : level === "surveillance" ? (
                  <Badge tone="warn">Attention</Badge>
                ) : (
                  <Badge tone="danger">Dépôts bloqués</Badge>
                )}
                <span>{excess >= 0 ? `+${fmt(excess)} pts d'avance` : `${fmt(excess)} pts manquants`}</span>
              </span>
            ),
          },
          {
            label: "Points des étudiants",
            value: <CountUp value={c.pointsInCirculation} />,
            sub: `à honorer · ${c.fundedAccounts ?? c.studentAccounts} comptes actifs`,
          },
          {
            label: "Valeur de votre stock",
            value: <CountUp value={c.stockValue} />,
            sub: stockBreakdown
              ? `${c.stockCount} objets (${stockBreakdown.studentDepositsCount} dépôts · ${stockBreakdown.shopStockCount} boutique)`
              : `${c.stockCount} objets en boutique`,
          },
          {
            label: "Marge avant blocage",
            value: bufferBeforeBlock >= 0 ? `+${fmt(bufferBeforeBlock)}` : fmt(bufferBeforeBlock),
            valueStyle: { fontSize: "var(--t-lg)", marginTop: 10 },
            sub: `minimum requis : ${fmt(suspendFloor)} pts (${pct(t.suspend)})`,
          },
        ]}
      />

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel__body row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px 18px" }}>
          <span className="small muted">Seuils automatiques :</span>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <Badge tone={level === "suspendu" ? "danger" : undefined}>
              Sous {pct(t.suspend)} · Dépôts bloqués
            </Badge>
            <Badge tone={level === "surveillance" ? "warn" : undefined}>
              {pct(t.suspend)} – {pct(t.watch)} · Vigilance
            </Badge>
            <Badge tone={level === "ouvert" ? "ok" : undefined}>
              {pct(t.watch)} et + · Tout va bien
            </Badge>
          </div>
          <span className="xs muted">Réouverture à {pct(t.reopen)}</span>
        </div>
      </div>

      <div className="stack" style={{ gap: 20 }}>
        <Panel>
          <PanelHead title="Valeur du stock vs points des étudiants" aside="Une mesure par semaine" />
          <PanelBody className="stack" style={{ gap: 12 }}>
            <CoverageChart points={history} suspendFactor={t.suspend} />
            <p className="small muted">{trendSentence(history)}</p>
          </PanelBody>
        </Panel>

        {stockBreakdown && (
          <Panel>
            <PanelHead title="D'où vient votre stock actuel" aside={`${c.stockCount} objets`} />
            <PanelBody className="stack" style={{ gap: 14 }}>
              <dl className="dl small">
                <dt>Dépôts d&apos;étudiants repris ({stockBreakdown.studentDepositsCount})</dt>
                <dd>{pts(stockBreakdown.studentDepositsValue)}</dd>
                <dt>Articles propres à la boutique ({stockBreakdown.shopStockCount})</dt>
                <dd>{pts(stockBreakdown.shopStockValue)}</dd>
                <span className="sep" />
                <dt>En ligne ({stockBreakdown.enLigneCount})</dt>
                <dd>{pts(stockBreakdown.enLigneValue)}</dd>
                <dt>À photographier ({stockBreakdown.aPhotographierCount})</dt>
                <dd>{pts(stockBreakdown.aPhotographierValue)}</dd>
                <dt>Réservés, en attente de retrait ({stockBreakdown.reserveeCount})</dt>
                <dd>{pts(stockBreakdown.reserveeValue)}</dd>
                <span className="sep" />
                <dt className="total">Total du stock</dt>
                <dd className="total pts">{pts(c.stockValue)}</dd>
              </dl>
            </PanelBody>
          </Panel>
        )}

        <Panel>
          <PanelHead title="Marge boutique par mois" aside="Reprises acceptées" />
          <PanelBody className="stack" style={{ gap: 12 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th className="r">Reprises</th>
                    <th className="r">Reprise moy.</th>
                    <th className="r">Affichage moy.</th>
                    <th className="r">Marge</th>
                    <th className="r">%</th>
                  </tr>
                </thead>
                <tbody>
                  {margins.map((m) => (
                    <tr key={m.month}>
                      <td>{m.month}</td>
                      <td className="r">{fmt(m.expertises)}</td>
                      <td className="r">{m.avgTakeBack !== undefined ? pts(m.avgTakeBack) : "–"}</td>
                      <td className="r">{m.avgListPrice !== undefined ? pts(m.avgListPrice) : "–"}</td>
                      <td className="r">{m.totalMarginPoints !== undefined ? `+${pts(m.totalMarginPoints)}` : "–"}</td>
                      <td className="r">
                        <strong>{pct1(m.margin)}</strong>
                      </td>
                    </tr>
                  ))}
                  {margins.length > 0 && (
                    <tr>
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td className="r">
                        <strong>{fmt(totalExpertises)}</strong>
                      </td>
                      <td className="r muted">–</td>
                      <td className="r muted">–</td>
                      <td className="r">
                        <strong>+{pts(totalMarginPoints)}</strong>
                      </td>
                      <td className="r">
                        <strong>{pct1(avgOverallMargin)}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </BackOfficeLayout>
  );
}
