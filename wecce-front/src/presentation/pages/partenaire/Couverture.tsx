import type { CoveragePoint, CoverageSnapshot, MarginRow } from "@/domain/entities";
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
import { Tbd } from "@/presentation/components/ui/Tbd";
import { fmt } from "@/presentation/lib/format";

export type CouvertureProps = { coverage: CoverageSnapshot; history: CoveragePoint[]; margins: MarginRow[] };

const pct = (r: number) => `${Math.round(r * 100)} %`;

/** Ce que montre le graphique, en une phrase : la dette rattrape-t-elle le stock ? */
function trendSentence(history: CoveragePoint[]): string {
  if (history.length < 2) return "Une mesure par semaine apparaîtra ici.";
  const first = history[0];
  const last = history[history.length - 1];
  const debtGrowth = last.debt - first.debt;
  const stockGrowth = last.stock - first.stock;
  return debtGrowth > stockGrowth
    ? `Depuis le ${first.label}, la dette a augmenté plus vite que la valeur du stock.`
    : `Depuis le ${first.label}, la valeur du stock a augmenté au moins aussi vite que la dette.`;
}
const pct1 = (r: number) => `${(r * 100).toFixed(1).replace(".", ",")} %`;

/** Dette et couverture : le stock doit toujours valoir plus que les points en circulation. */
export default function Couverture({ coverage: c, history, margins }: CouvertureProps) {
  const level = coverageLevel(c);
  const t = c.thresholds;
  return (
    <BackOfficeLayout space="partenaire" current="couverture">
      <PageTitle>Dette et couverture</PageTitle>
      <PageHead
        title="Dette et couverture"
        lead="Votre stock doit toujours valoir plus que les points en circulation."
        aside={<span className="small muted">{c.computedAt}</span>}
      />

      {level === "surveillance" && (
        <Notice tone="warn" title={`Couverture à ${pct(c.ratio)} : sous le seuil de surveillance.`} style={{ marginBottom: 18 }}>
          <p className="small">
            Pour la faire remonter, mettez en ligne des articles de la boutique ou baissez les valeurs de reprise. Sous{" "}
            <Tbd note="Seuil à trancher (§11.5)">{pct(t.suspend)}</Tbd>, les dépôts sont suspendus automatiquement.
          </p>
        </Notice>
      )}
      {level === "suspendu" && (
        <Notice tone="danger" icon="pause" title={`Couverture à ${pct(c.ratio)} : les nouveaux dépôts sont suspendus.`} style={{ marginBottom: 18 }}>
          {`Les étudiants peuvent toujours prendre des objets, ce qui fait baisser la dette. Les dépôts rouvriront automatiquement au-dessus de ${pct(t.reopen)}, ou sur décision de l'administration.`}
        </Notice>
      )}

      <Kpis
        style={{ marginBottom: 20 }}
        items={[
          {
            label: "Couverture",
            value: level === "ouvert" ? <CountUp value={Math.round(c.ratio * 100)} suffix=" %" /> : pct(c.ratio),
            sub:
              level === "ouvert" ? <Badge tone="ok">Ouvert</Badge> : level === "surveillance" ? <Badge tone="warn">Surveillance</Badge> : <Badge tone="danger">Suspendu</Badge>,
          },
          { label: "Points en circulation", value: <CountUp value={c.pointsInCirculation} />, sub: `sur ${c.studentAccounts} comptes étudiants` },
          { label: "Valeur du stock en ligne", value: <CountUp value={c.stockValue} />, sub: `${c.stockCount} objets, prix du jour` },
          {
            label: "Seuils",
            value: <Tbd note="Seuils à trancher (§11.5)">{`${pct(t.watch)} · ${pct(t.suspend)}`}</Tbd>,
            valueStyle: { fontSize: "var(--t-lg)", marginTop: 10 },
            sub: "surveillance · suspension",
          },
        ]}
      />

      <div className="cols" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>
        <Panel>
          <PanelHead title="Depuis l'ouverture" aside="Une mesure par semaine" />
          <PanelBody className="stack" style={{ gap: 12 }}>
            <CoverageChart points={history} suspendFactor={t.suspend} />
            <p className="small muted">{trendSentence(history)}</p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Votre marge réelle" />
          <PanelBody className="stack" style={{ gap: 12 }}>
            <p className="small muted">Écart moyen entre vos deux prix, mesuré sur vos expertises acceptées.</p>
            <table className="table table--wrap">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th className="r">Expertises</th>
                  <th className="r">Marge moyenne</th>
                </tr>
              </thead>
              <tbody>
                {margins.map((m) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td className="r">{fmt(m.expertises)}</td>
                    <td className="r">{pct1(m.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="xs muted">Marge = (prix d'affichage − reprise) ÷ prix d'affichage. Les reprises en pièces sont comptées à part.</p>
          </PanelBody>
        </Panel>
      </div>
    </BackOfficeLayout>
  );
}
