import { useState } from "react";
import type { StockArticle, StockOrigin, StockSummary } from "@/domain/entities";
import { Kpis } from "@/presentation/components/admin/Kpis";
import { BackOfficeLayout } from "@/presentation/components/layout/BackOfficeLayout";
import { PageHead } from "@/presentation/components/layout/PageHead";
import { PageTitle } from "@/presentation/components/layout/PageTitle";
import { StockRow } from "@/presentation/components/partner/StockRow";
import { ButtonLink } from "@/presentation/components/ui/Button";
import { ChipGroup } from "@/presentation/components/ui/Chip";
import { CountUp } from "@/presentation/components/ui/CountUp";
import { Icon } from "@/presentation/components/ui/Icon";
import { Panel } from "@/presentation/components/ui/Panel";
import { paths } from "@/presentation/lib/paths";

type Filter = "tout" | StockOrigin;

export type StockProps = {
  summary: StockSummary | null;
  articles: StockArticle[];
  counts: Record<Filter, number>;
};

/** Stock en boutique : ce qui est en ligne, son origine, ses prix du jour, les réservations. */
export default function Stock({ summary, articles, counts }: StockProps) {
  const [filter, setFilter] = useState<Filter>("tout");
  const [q, setQ] = useState("");
  const shown = articles.filter(
    (a) => (filter === "tout" || a.origin === filter) && (!q || `${a.name} ${a.originRef ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const addButton = (label: string) => (
    <ButtonLink href={paths.articleNew}>
      <Icon name="plus" size="sm" />
      {label}
    </ButtonLink>
  );

  return (
    <BackOfficeLayout space="partenaire" current="stock">
      <PageTitle>Stock en boutique</PageTitle>
      <PageHead
        title="Stock en boutique"
        lead={
          <>
            Les prix baissent automatiquement le 1<sup>er</sup> de chaque mois.
          </>
        }
        aside={addButton("Ajouter un article de la boutique")}
      />

      {!summary || articles.length === 0 ? (
        <Panel style={{ padding: "36px 28px" }}>
          <div className="stack" style={{ maxWidth: "58ch", gap: 14 }}>
            <Icon name="package" size="lg" style={{ color: "var(--muted)" }} />
            <h2>Ouvrez le marché avec 30 à 50 articles de votre boutique</h2>
            <p className="muted">Les étudiants déposent plus volontiers quand il y a déjà des objets à prendre avec leurs points.</p>
            <p className="small muted">Pour chaque article, une photo, l'état constaté et le prix en points. Ces articles ne créent aucune dette.</p>
            <div>{addButton("Ajouter le premier article")}</div>
          </div>
        </Panel>
      ) : (
        <div className="stack" style={{ gap: 20 }}>
          <Kpis
            items={[
              { label: "En ligne", value: <CountUp value={summary.online} />, sub: `dont ${summary.onlineFromShop} de votre boutique` },
              { label: "Valeur affichée", value: <CountUp value={summary.displayedValue} />, sub: "points, au prix du jour" },
              { label: "Réservés", value: <CountUp value={summary.reserved} />, sub: "en attente de retrait" },
              { label: `Partis en ${summary.lastMonthLabel}`, value: <CountUp value={summary.leftLastMonth} />, sub: `dont ${summary.leftWithComplement} avec un complément` },
            ]}
          />

          <div className="row" style={{ gap: "10px 14px" }}>
            <ChipGroup<Filter>
              label="Origine"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "tout", label: "Tous", count: counts.tout },
                { value: "depot", label: "Dépôts étudiants", count: counts.depot },
                { value: "boutique", label: "Stock de la boutique", count: counts.boutique },
              ]}
            />
            <span className="spacer" />
            <label className="search" style={{ background: "var(--surface)", maxWidth: 280 }}>
              <Icon name="search" />
              <input type="search" placeholder="Modèle ou référence" aria-label="Chercher dans le stock" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>

          <Panel>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Objet</th>
                    <th>Origine</th>
                    <th>En ligne depuis</th>
                    <th className="r">Prix initial</th>
                    <th className="r">Prix du jour</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((a) => (
                    <StockRow key={a.id} a={a} />
                  ))}
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan={7} className="muted" style={{ padding: "28px 14px", textAlign: "center" }}>
                        Aucun article ne correspond.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="panel__foot small muted">
              {shown.length} objets sur {counts.tout}
            </div>
          </Panel>
        </div>
      )}
    </BackOfficeLayout>
  );
}
